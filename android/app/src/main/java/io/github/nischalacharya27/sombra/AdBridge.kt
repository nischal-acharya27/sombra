package io.github.nischalacharya27.sombra

import android.app.Activity
import android.os.Handler
import android.os.Looper
import android.util.Log
import android.webkit.JavascriptInterface
import android.webkit.WebView
import com.google.android.gms.ads.AdError
import com.google.android.gms.ads.AdRequest
import com.google.android.gms.ads.FullScreenContentCallback
import com.google.android.gms.ads.LoadAdError
import com.google.android.gms.ads.MobileAds
import com.google.android.gms.ads.RequestConfiguration
import com.google.android.gms.ads.interstitial.InterstitialAd
import com.google.android.gms.ads.interstitial.InterstitialAdLoadCallback
import com.google.android.gms.ads.rewarded.RewardedAd
import com.google.android.gms.ads.rewarded.RewardedAdLoadCallback
import com.google.android.ump.ConsentDebugSettings
import com.google.android.ump.ConsentInformation
import com.google.android.ump.ConsentRequestParameters
import com.google.android.ump.UserMessagingPlatform
import java.util.concurrent.atomic.AtomicBoolean
import kotlin.concurrent.thread

/**
 * The native half of the ad bridge — the game's half is
 * `src/engine/adbridge.js`, and the contract between them is
 * `docs/SPEC-ANDROID.md` § The ad bridge.
 *
 * The page calls the `@JavascriptInterface` methods below on WebView's
 * binder thread; everything that touches an ad or the activity is posted to
 * the main thread. Answers go back through `window.__sombraAdResult(id,
 * outcome)`, with outcome one of `rewarded`, `closed` or `unavailable`.
 *
 * Order at launch is consent first, then the SDK, then the first loads:
 * AdMob is never initialised, and no ad is ever requested, until the UMP
 * SDK says ads may be requested.
 */
class AdBridge(private val activity: Activity, private val web: WebView) {

    private val main = Handler(Looper.getMainLooper())
    private val consent: ConsentInformation = UserMessagingPlatform.getConsentInformation(activity)
    private val initialised = AtomicBoolean(false)

    @Volatile private var rewarded: RewardedAd? = null
    @Volatile private var interstitial: InterstitialAd? = null
    private var rewardedRetry = RETRY_START_MS
    private var interstitialRetry = RETRY_START_MS

    private var consentAttempts = 0
    private val consentStarted = AtomicBoolean(false)

    /**
     * Called once from `onCreate`. The consent round trip itself waits for
     * [pageReady]: every WebView in an app shares one renderer process, and
     * the consent form is a web page, so asking for it while the game is
     * building every gate and warming its shaders — several seconds of solid
     * main-thread work on a phone — starves the form until UMP gives up on
     * it. Measured on the emulator: every attempt made during boot timed out.
     */
    fun start() {
        main.postDelayed(::beginConsent, PAGE_READY_FALLBACK_MS)
        // A returning player's consent from last session is already on disk,
        // so the SDK can start while this session's round trip waits.
        initialiseIfAllowed()
    }

    /** The game finished booting (`src/main.js`), or the fallback fired. */
    @JavascriptInterface
    fun pageReady() {
        main.post(::beginConsent)
    }

    private fun beginConsent() {
        if (consentStarted.compareAndSet(false, true)) requestConsent()
    }

    /**
     * The consent round trip. Where consent is required (the EEA, the UK) no
     * ad can load until the form has been answered, and the form is a web
     * page of its own that can time out on a slow network or a busy GPU. One
     * timeout used to mean no ads for the whole session, so a failed round
     * trip is retried a few times, spaced out, before giving up until the
     * next launch.
     */
    private fun requestConsent() {
        consentAttempts++
        val params = ConsentRequestParameters.Builder().apply {
            debugSettings()?.let { setConsentDebugSettings(it) }
        }.build()
        consent.requestConsentInfoUpdate(
            activity,
            params,
            {
                UserMessagingPlatform.loadAndShowConsentFormIfRequired(activity) { error ->
                    if (error != null) {
                        Log.w(TAG, "consent form (attempt $consentAttempts): ${error.message}")
                        retryConsent()
                    }
                    initialiseIfAllowed()
                    refreshPage()
                }
            },
            { error ->
                Log.w(TAG, "consent info (attempt $consentAttempts): ${error.message}")
                retryConsent()
                initialiseIfAllowed()
            },
        )
    }

    /** Debug builds only, and only when asked for — see `UMP_DEBUG_GEOGRAPHY` in app/build.gradle.kts. */
    private fun debugSettings(): ConsentDebugSettings? {
        val geography = when (BuildConfig.UMP_DEBUG_GEOGRAPHY) {
            "eea" -> ConsentDebugSettings.DebugGeography.DEBUG_GEOGRAPHY_EEA
            "other" -> ConsentDebugSettings.DebugGeography.DEBUG_GEOGRAPHY_OTHER
            else -> return null
        }
        return ConsentDebugSettings.Builder(activity)
            .setDebugGeography(geography)
            .addTestDeviceHashedId(BuildConfig.UMP_TEST_DEVICE)
            .build()
    }

    private fun retryConsent() {
        if (consent.canRequestAds() || consentAttempts >= CONSENT_ATTEMPTS) return
        main.postDelayed(::requestConsent, CONSENT_RETRY_MS * consentAttempts)
    }

    private fun initialiseIfAllowed() {
        if (!consent.canRequestAds() || !initialised.compareAndSet(false, true)) return
        // The audience is declared 13+ (docs/DECISIONS.md § Audience), so
        // requests say so: not child-directed, not under the age of consent,
        // and no ad above a Teen rating in a game built mild enough for 9+.
        MobileAds.setRequestConfiguration(
            RequestConfiguration.Builder()
                .setTagForChildDirectedTreatment(RequestConfiguration.TAG_FOR_CHILD_DIRECTED_TREATMENT_FALSE)
                .setTagForUnderAgeOfConsent(RequestConfiguration.TAG_FOR_UNDER_AGE_OF_CONSENT_FALSE)
                .setMaxAdContentRating(RequestConfiguration.MAX_AD_CONTENT_RATING_T)
                .build()
        )
        thread(name = "sombra-ads-init") {
            MobileAds.initialize(activity) {
                main.post {
                    loadRewarded()
                    loadInterstitial()
                }
            }
        }
    }

    // -- loading ----------------------------------------------------------

    private fun loadRewarded() {
        RewardedAd.load(activity, BuildConfig.REWARDED_ID, AdRequest.Builder().build(), object : RewardedAdLoadCallback() {
            override fun onAdLoaded(ad: RewardedAd) {
                rewarded = ad
                rewardedRetry = RETRY_START_MS
                refreshPage()
            }

            override fun onAdFailedToLoad(error: LoadAdError) {
                Log.i(TAG, "rewarded load failed: ${error.code} ${error.message}")
                main.postDelayed(::loadRewarded, rewardedRetry)
                rewardedRetry = (rewardedRetry * 2).coerceAtMost(RETRY_MAX_MS)
            }
        })
    }

    private fun loadInterstitial() {
        InterstitialAd.load(activity, BuildConfig.INTERSTITIAL_ID, AdRequest.Builder().build(), object : InterstitialAdLoadCallback() {
            override fun onAdLoaded(ad: InterstitialAd) {
                interstitial = ad
                interstitialRetry = RETRY_START_MS
            }

            override fun onAdFailedToLoad(error: LoadAdError) {
                Log.i(TAG, "interstitial load failed: ${error.code} ${error.message}")
                main.postDelayed(::loadInterstitial, interstitialRetry)
                interstitialRetry = (interstitialRetry * 2).coerceAtMost(RETRY_MAX_MS)
            }
        })
    }

    // -- the page's calls -------------------------------------------------

    @JavascriptInterface
    fun isRewardedReady(): Boolean = rewarded != null

    @JavascriptInterface
    fun isInterstitialReady(): Boolean = interstitial != null

    /** Returns whether an ad is about to show; if so, `id` is answered once it closes. */
    @JavascriptInterface
    fun showRewarded(id: Int): Boolean {
        if (rewarded == null) return false
        main.post {
            val ad = rewarded ?: return@post answer(id, UNAVAILABLE)
            rewarded = null
            var earned = false
            ad.fullScreenContentCallback = object : FullScreenContentCallback() {
                override fun onAdDismissedFullScreenContent() {
                    answer(id, if (earned) REWARDED else CLOSED)
                    loadRewarded()
                }

                override fun onAdFailedToShowFullScreenContent(error: AdError) {
                    answer(id, UNAVAILABLE)
                    loadRewarded()
                }
            }
            ad.show(activity) { earned = true }
        }
        return true
    }

    @JavascriptInterface
    fun showInterstitial(id: Int): Boolean {
        if (interstitial == null) return false
        main.post {
            val ad = interstitial ?: return@post answer(id, UNAVAILABLE)
            interstitial = null
            ad.fullScreenContentCallback = object : FullScreenContentCallback() {
                override fun onAdDismissedFullScreenContent() {
                    answer(id, CLOSED)
                    loadInterstitial()
                }

                override fun onAdFailedToShowFullScreenContent(error: AdError) {
                    answer(id, UNAVAILABLE)
                    loadInterstitial()
                }
            }
            ad.show(activity)
        }
        return true
    }

    @JavascriptInterface
    fun isPrivacyOptionsRequired(): Boolean =
        consent.privacyOptionsRequirementStatus == ConsentInformation.PrivacyOptionsRequirementStatus.REQUIRED

    @JavascriptInterface
    fun showPrivacyOptions(): Boolean {
        main.post {
            UserMessagingPlatform.showPrivacyOptionsForm(activity) { error ->
                if (error != null) Log.w(TAG, "privacy options: ${error.message}")
                initialiseIfAllowed()
                refreshPage()
            }
        }
        return true
    }

    // -- answers ------------------------------------------------------------

    private fun answer(id: Int, outcome: String) {
        main.post { web.evaluateJavascript("window.__sombraAdResult && window.__sombraAdResult($id, '$outcome')", null) }
    }

    /** Ad or consent state changed: let the page re-ask what it may offer. */
    private fun refreshPage() {
        main.post { web.evaluateJavascript("window.__sombraHost && window.__sombraHost.refresh()", null) }
    }

    private companion object {
        const val TAG = "SombraAds"
        const val REWARDED = "rewarded"
        const val CLOSED = "closed"
        const val UNAVAILABLE = "unavailable"
        const val RETRY_START_MS = 15_000L
        const val RETRY_MAX_MS = 240_000L
        const val CONSENT_ATTEMPTS = 4
        const val PAGE_READY_FALLBACK_MS = 20_000L
        const val CONSENT_RETRY_MS = 20_000L
    }
}
