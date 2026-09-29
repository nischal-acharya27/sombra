// The ad bridge — the one seam between the game and whatever host serves ads.
//
// The game never talks to an ad SDK. It asks this object two questions (is a
// rewarded ad ready, is an interstitial ready) and makes two requests (show
// one, then call me back with how it went). Everything behind those four calls
// belongs to the host: today the Android shell in `android/`, which injects
// `window.SombraAds` through `addJavascriptInterface` and answers through
// `window.__sombraAdResult`. See `docs/SPEC-ANDROID.md` § The ad bridge.
//
// **The null bridge is the default, not a fallback.** GitHub Pages, a desktop
// browser, `?sim` and every check in `tools/` run with it, and with it every
// ad feature is dark: nothing is ever ready, so the death screen never offers
// a second wind and a gate boundary never pauses. The game has to look
// deliberate with no ads at all, the same rule `assets/` lives under.
//
// Nothing here builds a three.js object or draws from `Math.random`, so it is
// safe to call mid-run under the suite's seeded stream.

/**
 * How a show request ended, as handed to its callback:
 *   'rewarded'    — a rewarded ad was watched to its reward, then closed.
 *   'closed'      — the ad was shown and closed with no reward earned (an
 *                   interstitial always ends this way).
 *   'unavailable' — nothing was shown: no ad loaded, or the host refused.
 */
export const AD_OUTCOME = Object.freeze({
  REWARDED: 'rewarded',
  CLOSED: 'closed',
  UNAVAILABLE: 'unavailable',
});

/** No host, no ads. Every request answers at once, having shown nothing. */
export const NULL_AD_BRIDGE = Object.freeze({
  available: false,
  rewardedReady: () => false,
  showRewarded: (onDone) => onDone(AD_OUTCOME.UNAVAILABLE),
  interstitialReady: () => false,
  showInterstitial: (onDone) => onDone(AD_OUTCOME.UNAVAILABLE),
  privacyOptionsRequired: () => false,
  showPrivacyOptions: () => {},
  pageReady: () => {},
});

/**
 * The bridge for this page: the Android shell's if it injected one, the null
 * bridge otherwise.
 *
 * The native side's show calls return whether an ad actually started. A
 * `false` — or a throw, which a `@JavascriptInterface` can produce if the
 * activity is going away — answers the callback immediately as unavailable,
 * so a caller that paused the game waiting on an ad can never be left paused.
 */
export function detectAdBridge(host = globalThis) {
  const native = host.SombraAds;
  if (!native) return NULL_AD_BRIDGE;

  const pending = new Map();
  let nextId = 1;
  // The native side calls this, on the page's own thread, once a shown ad is
  // dismissed or fails to show. An id it does not recognise is ignored rather
  // than thrown on: a late answer to a request already settled is harmless.
  host.__sombraAdResult = (id, outcome) => {
    const done = pending.get(id);
    if (!done) return;
    pending.delete(id);
    done(outcome);
  };

  const ask = (fn) => {
    try {
      return !!fn();
    } catch {
      return false;
    }
  };
  const show = (method, onDone) => {
    const id = nextId++;
    pending.set(id, onDone);
    if (ask(() => native[method](id))) return;
    pending.delete(id);
    onDone(AD_OUTCOME.UNAVAILABLE);
  };

  return {
    available: true,
    rewardedReady: () => ask(() => native.isRewardedReady()),
    showRewarded: (onDone) => show('showRewarded', onDone),
    interstitialReady: () => ask(() => native.isInterstitialReady()),
    showInterstitial: (onDone) => show('showInterstitial', onDone),
    privacyOptionsRequired: () => ask(() => native.isPrivacyOptionsRequired()),
    showPrivacyOptions: () => ask(() => native.showPrivacyOptions()),
    // Boot is done. The shell holds the consent form until now, because the
    // form is a web page in the same renderer process as the game and the
    // gate build would starve it — see `AdBridge.start` in android/.
    pageReady: () => ask(() => native.pageReady()),
  };
}
