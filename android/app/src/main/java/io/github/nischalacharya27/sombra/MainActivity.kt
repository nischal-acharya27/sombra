package io.github.nischalacharya27.sombra

import android.annotation.SuppressLint
import android.graphics.Color
import android.net.Uri
import android.os.Bundle
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebView
import androidx.activity.ComponentActivity
import androidx.activity.OnBackPressedCallback
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.WindowInsetsControllerCompat
import androidx.webkit.WebViewAssetLoader
import androidx.webkit.WebViewClientCompat

/**
 * One activity, one WebView, the game inside it.
 *
 * The game is served from the APK through [WebViewAssetLoader] at
 * `https://appassets.androidplatform.net/game/`, not from `file://`. That is
 * load-bearing twice over: ES modules and the import map refuse `file://`,
 * and `localStorage` — the save file — is keyed by origin, so it survives
 * only on an origin that is the same on every launch.
 *
 * The page talks to the shell through two names, both documented in
 * `docs/SPEC-ANDROID.md`: `window.SombraAds` (the ad bridge, [AdBridge]) and
 * `window.__sombraHost` (pause, resume, back, refresh — defined by the game's
 * `src/main.js`).
 */
class MainActivity : ComponentActivity() {

    private lateinit var web: WebView
    private lateinit var ads: AdBridge

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        WindowCompat.setDecorFitsSystemWindows(window, false)
        // chrome://inspect in debug builds only — never in the one players get.
        WebView.setWebContentsDebuggingEnabled(BuildConfig.DEBUG)

        val loader = WebViewAssetLoader.Builder()
            .addPathHandler("/", WebViewAssetLoader.AssetsPathHandler(this))
            .build()

        web = WebView(this).apply {
            setBackgroundColor(Color.parseColor("#06040E"))
            settings.javaScriptEnabled = true
            // The save file. Without this `localStorage` is silently absent
            // and every launch is a fresh hunter.
            settings.domStorageEnabled = true
            // The game unlocks Web Audio on the first tap, as it does in a
            // browser; nothing needs a gesture beyond that.
            settings.mediaPlaybackRequiresUserGesture = false
            settings.allowFileAccess = false
            settings.allowContentAccess = false
            settings.setSupportZoom(false)
            settings.textZoom = 100
            isVerticalScrollBarEnabled = false
            isHorizontalScrollBarEnabled = false
            overScrollMode = WebView.OVER_SCROLL_NEVER
            webViewClient = object : WebViewClientCompat() {
                override fun shouldInterceptRequest(view: WebView, request: WebResourceRequest): WebResourceResponse? =
                    loader.shouldInterceptRequest(request.url)

                // Nothing in the game links anywhere. Anything that tries to
                // navigate the top frame away from the bundle is refused.
                override fun shouldOverrideUrlLoading(view: WebView, request: WebResourceRequest): Boolean =
                    request.url.host != ASSET_HOST
            }
        }
        setContentView(web)

        ads = AdBridge(this, web)
        web.addJavascriptInterface(ads, "SombraAds")
        web.loadUrl(GAME_URL)
        ads.start()

        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                web.evaluateJavascript("window.__sombraHost ? window.__sombraHost.back() : 'exit'") { result ->
                    // The pause menu is the game's; leaving is Android's.
                    if (result == null || result.contains("exit")) moveTaskToBack(true)
                }
            }
        })
    }

    override fun onWindowFocusChanged(hasFocus: Boolean) {
        super.onWindowFocusChanged(hasFocus)
        if (hasFocus) immersive()
    }

    /** Full screen, bars on a swipe. The on-screen controls need the whole glass. */
    private fun immersive() {
        WindowInsetsControllerCompat(window, web).apply {
            systemBarsBehavior = WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
            hide(WindowInsetsCompat.Type.systemBars())
        }
    }

    // Backgrounded, or covered by a full-screen ad: the game silences itself
    // and pauses a live fight (see `__sombraHost.pause` in src/main.js).
    override fun onPause() {
        web.evaluateJavascript("window.__sombraHost && window.__sombraHost.pause()", null)
        web.onPause()
        super.onPause()
    }

    override fun onResume() {
        super.onResume()
        web.onResume()
        web.evaluateJavascript("window.__sombraHost && window.__sombraHost.resume()", null)
    }

    override fun onDestroy() {
        web.destroy()
        super.onDestroy()
    }

    companion object {
        const val ASSET_HOST = WebViewAssetLoader.DEFAULT_DOMAIN
        val GAME_URL: String = Uri.Builder()
            .scheme("https").authority(ASSET_HOST).path("/game/index.html").build().toString()
    }
}
