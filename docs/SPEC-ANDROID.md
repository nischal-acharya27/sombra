# Spec — the Android release: a WebView shell, a second wind, and an interstitial

Status: built 2026-09-29, on `main`. The decisions it rests on were settled
that day, with the recorded ones they overturn, in `DECISIONS.md` §
"Amended 2026-09-29" (four entries). This document turns them into work and
records what was built.

## Problem Statement

The game is live on GitHub Pages and plays well on a phone, on touch
controls that were measured against four viewports. It is not on the Play
Store, and the project's end goal since 2026-08-03 has been *a free Android
game carrying ads*. Three things stand between the two.

**There is no Android app.** The packaging plan on record was a TWA built
with PWABuilder, chosen because it asks nothing of this repo. A TWA runs the
page inside the player's Chrome, and that is exactly why it cannot carry ads:
there is no native view to host the ad SDK, and no JavaScript bridge to ask it
for one. The plan's own step 5 ("ad SDK, if wanted — undecided") has now been
decided, and it forces step 3 to change.

**There is no revenue.** No ad placement exists, and the placements that were
decided in 2026-08 were decided against a design claim that the user has now
chosen to weigh differently.

**Nothing in the game knows it might be embedded.** The save is
`localStorage`, which a WebView silently drops unless it is configured for it
and served from a stable origin. Backgrounding the app does not pause a fight.
Android's back button would close the app from the middle of a Warden.

## Solution

**A native Kotlin WebView shell in `android/`.** One activity, one WebView,
the game inside it. Gradle builds the shell; nothing builds the game. A Gradle
task copies `index.html`, `src/`, `vendor/` and `assets/` into the APK byte
for byte, and `WebViewAssetLoader` serves them from
`https://appassets.androidplatform.net/game/`, which is a stable HTTPS origin
on every launch. That keeps ES modules, the import map and the save file
working. The repo root stays npm-free and build-free, which is the rule the
TWA choice was protecting.

**A second wind on death.** When the hunter dies, the death screen may offer
SECOND WIND, labelled plainly as an ad. An ad watched through to its reward
raises the hunter where they fell, or on the ledge behind the chasm they fell
into, with half their health and 2.5 s of invulnerability. Every encounter is
left exactly as it stood. You get one per gate attempt, anywhere in a gate.
RISE AGAIN, the free restart, is always offered beside it.

**An interstitial every second gate clear.** It plays at the arch between
gates, after the clear is saved and before the next gate arrives. That is the
one moment the game already cuts. It never plays at launch, on exit, mid-fight,
or before the run-end screen.

**A consent flow before any ad.** Google's UMP SDK runs first. AdMob is not
initialised, and no ad is requested, until UMP says ads may be requested.
Where UMP says the player must be able to change their answer (the EEA and the
UK), the title screen gains a PRIVACY OPTIONS button.

**The web build is unchanged.** Pages, desktop browsers and `?sim` run under
the null ad bridge. No ad is ever ready there, so the death screen never
offers a second wind and the arch never waits. The pre-existing suite rows are
byte-identical to their baseline on all five recorded seeds.

## User Stories

**Second wind**

1. As a hunter who just died, I want to be offered a way back that costs an
   ad rather than the gate, so that a death near the Warden does not cost the
   two minutes before it.
2. As a hunter, I want the offer to say it is an ad before I press it, so
   that I am never surprised into watching one.
3. As a hunter, I want RISE AGAIN to stay beside the offer, so that I can
   always refuse the ad and restart for free.
4. As a hunter, I want to rise where I fell rather than at the gate's start,
   so that the second wind is worth the ad.
5. As a hunter who fell into a chasm, I want to rise on the ledge I jumped
   from, not over the chasm, so that the second wind is not a second death.
6. As a hunter, I want a moment of invulnerability when I rise, so that the
   blow that killed me cannot land again on the first frame.
7. As a hunter, I want to rise with part of my health rather than all of it,
   so that dying is never a better way to heal than levelling.
8. As a hunter who closed the ad early, I want to stay on the death screen,
   so that a skipped ad does not count as a watched one.
9. As a player, I want at most one second wind per gate attempt, so that the
   gate is still a skill check and not an ad count.
10. As a player on the web build, I want no ad offer at all, so that the game
    I already play is unchanged.

**Interstitial**

11. As a player, I want interstitials only between gates, never during a
    fight, so that an ad never takes a moment I am playing.
12. As a player, I want no more than one interstitial per two gate clears, so
    that a two-minute gate is not bracketed by ads.
13. As a player finishing the campaign, I want to go straight to my run
    statistics, so that the ending is not interrupted.
14. As a player launching the app, I want no ad before I have played, so that
    the first thing I see is the game.

**The app**

15. As a player, I want my progress to survive closing the app, so that the
    furthest gate I reached is where I resume.
16. As a player, I want my progress to survive a new phone, so that Android's
    backup carries it over.
17. As a player, I want backgrounding the app to pause a live fight and
    silence it, so that I come back to a held game.
18. As a player, I want the back button to open the pause menu during a run,
    and not close the app, so that a mis-tap does not end the fight.
19. As a player, I want the game full screen and landscape, with no system
    bars in the way, so that the on-screen controls have the whole glass.
20. As a player in the EEA or UK, I want to be asked for consent before any
    personalised ad, and to be able to change my answer later, so that the
    app respects the law I live under.

**The developer**

21. As the developer, I want every placement rule to be a value in
    `config.js`, so that changing the policy after seeing it in the hand is a
    one-line diff.
22. As the developer, I want the suite to prove the web build never waits on
    an ad, so that the null bridge is a checked promise and not an
    assumption.
23. As the developer, I want debug builds to always use Google's test ad ids,
    so that I can never generate invalid traffic on my own account.
24. As the developer, I want a release build to refuse to build without real
    ad ids and a signing key, so that a build that earns nothing, or one that
    crashes on launch, can never be uploaded by accident.

## Implementation Decisions

### The ad bridge

The seam is an interface with a null implementation
(`src/engine/adbridge.js`):

| Member | Null bridge | Android bridge |
|---|---|---|
| `rewardedReady()` | `false` | `SombraAds.isRewardedReady()` |
| `showRewarded(onDone)` | `onDone('unavailable')` at once | `SombraAds.showRewarded(id)` |
| `interstitialReady()` | `false` | `SombraAds.isInterstitialReady()` |
| `showInterstitial(onDone)` | `onDone('unavailable')` at once | `SombraAds.showInterstitial(id)` |
| `privacyOptionsRequired()` | `false` | `SombraAds.isPrivacyOptionsRequired()` |
| `showPrivacyOptions()` | no-op | `SombraAds.showPrivacyOptions()` |
| `pageReady()` | no-op | `SombraAds.pageReady()`: boot is done, ask for consent now |

`detectAdBridge()` returns the Android bridge only if the shell injected
`window.SombraAds`. `main.js` passes the null bridge unconditionally under
`?sim`.

**The wire protocol.** A show call carries a numeric request id and returns
whether an ad is about to show. `false`, or a throw, answers the callback at
once as `unavailable`. Otherwise the shell answers later by calling
`window.__sombraAdResult(id, outcome)`, where outcome is one of:

- `rewarded`: watched through to the reward, then closed.
- `closed`: shown and closed with no reward (an interstitial always ends
  this way).
- `unavailable`: nothing showed.

A caller that paused waiting on an ad is always released, whatever happens.

**The host hooks.** `main.js` defines `window.__sombraHost`:

- `pause()`: silences audio (`Audio.hold`), and opens the pause menu if a
  fight is live.
- `resume()`: restores sound only. A paused game waits for RESUME.
- `back()`: toggles the pause menu during a run. Anywhere else it returns
  `'exit'`, and the shell moves the app to the background.
- `refresh()`: re-asks the bridge after the shell's ad or consent state
  changes.

The shell calls `pause()` and `resume()` from `onPause` and `onResume`, which
also fire when a full-screen ad covers the activity. `visibilitychange` calls
the same two hooks, so a phone playing on Pages gets the same behaviour.

### Second wind (`Game`)

- `_onDeath` records what it interrupted: the state (`playing` or `cleared`)
  and whether the encounter holding the Warden was live.
- `secondWindOffered()` is true when all of the following hold:
  - the hunter is dead;
  - a second wind is left this attempt (`secondWindsLeft`, refilled by
    `_enterGate`);
  - `SECOND_WIND.scope` allows it here;
  - `ads.rewardedReady()`.
- The death screen shows the button only when that is true. `takeSecondWind()`
  shows the ad. Only `rewarded` calls `_secondWind()`; anything else
  re-evaluates the offer.
- `_secondWind()`:
  - restores the interrupted state;
  - sets hp to `round(maxHp × SECOND_WIND.hpFraction)` and gives `SECOND_WIND.invuln`
    seconds of invulnerability;
  - clears the input buffer;
  - restores the objective banner and music intensity to match whatever
    encounter is live.

  A hunter below the void is moved to the first floor behind them, searching
  back from where they fell and clamped inside a live encounter's lock, then
  a further `SECOND_WIND.ledgeBack` back. It builds nothing: the suite counts
  scene objects around it.
- Because `update()` returns early while the state is `dead`, every enemy is
  frozen for as long as the death screen is up. A second wind resumes the
  fight; it does not reset it.

### Interstitial (`Game._stepThrough`)

- `sessionGateClears` counts clears across runs in one app session. A
  restart does not reset the schedule, in either direction.
- On every `INTERSTITIAL.everyNGates`th clear, if an interstitial is ready,
  the arch sets `resting` and waits for `showInterstitial`'s answer before
  `_enterGate(next)`. `resting` is the existing literal pause used by the
  boss-rest prompt, so no second pause mechanism was invented.
- The last gate's arch goes straight to `_endRun`.

### Policy as values (`src/game/config.js`)

```js
SECOND_WIND = { scope: 'gate', perGateAttempt: 1, hpFraction: 0.5, invuln: 2.5, ledgeBack: 1.5 }
INTERSTITIAL = { everyNGates: 2 }
```

The three options that were weighed, as values:

- Option A: `scope: 'warden'`, `perGateAttempt: 1`.
- Option B (adopted): `scope: 'gate'`, `perGateAttempt: 1`.
- Option C (refused): `scope: 'gate'`, `perGateAttempt: Infinity`.

### The shell (`android/`)

- **Toolchain.** AGP 9.3.2 (which compiles Kotlin itself) and Gradle 9.5.0
  through the committed wrapper.
- **SDK levels.** `compileSdk` and `targetSdk` 36 (Play's requirement for new
  apps from 2026-08-31). `minSdk` 26, so the launcher icon can be adaptive
  only and the WebView is always evergreen.
- **Serving the game.** `WebViewAssetLoader` with `AssetsPathHandler`. The
  top frame may not navigate off `appassets.androidplatform.net`. WebView
  settings:
  - `domStorageEnabled` on, for the save file;
  - file and content access off;
  - text zoom pinned at 100.
- **Window.** Landscape (`sensorLandscape`), immersive with the bars
  available on a swipe, drawing under a display cutout on API 30+. The
  window background matches the boot screen's `#06040e`, so launch never
  flashes white.
- **Back.** Asks `__sombraHost.back()` and moves the task to the background
  on `'exit'`.
- **Backup.** `app_webview/` is included in cloud backup and device
  transfer, which is where the WebView keeps `localStorage`.
- **Ads (`AdBridge.kt`).** The order is:
  1. Wait for the page's `pageReady()` (20 s fallback). The form is a web
     page in the game's renderer process, and the gate build starves it.
  2. UMP `requestConsentInfoUpdate`, then `loadAndShowConsentFormIfRequired`,
     retried up to three more times on failure, spaced 20/40/60 s.
  3. `MobileAds.initialize` on a background thread, only once `canRequestAds()`.
     Consent remembered from an earlier launch lets this start at once.
  4. Load one rewarded and one interstitial, with exponential retry
     (15 s up to 4 min).

  Each ad is reloaded after it is shown. Request configuration:
  - `TAG_FOR_CHILD_DIRECTED_TREATMENT_FALSE` and
    `TAG_FOR_UNDER_AGE_OF_CONSENT_FALSE`, which agree with the 13+
    declaration;
  - `MAX_AD_CONTENT_RATING_T`.
- **Consent testing.** Debug builds only: `-PSOMBRA_UMP_DEBUG_GEOGRAPHY=eea|other`
  with `-PSOMBRA_UMP_TEST_DEVICE=<hashed id from logcat>`.
- **Ids.** Debug builds always use Google's published test ids. Release reads
  `SOMBRA_ADMOB_APP_ID`, `SOMBRA_ADMOB_REWARDED_ID`,
  `SOMBRA_ADMOB_INTERSTITIAL_ID` and the four `SOMBRA_UPLOAD_*` signing values
  from `~/.gradle/gradle.properties`, and `checkReleaseConfig` fails the build
  if any is missing.
- **Release shrinking.** R8 is on, with a keep rule for
  `@JavascriptInterface`.
- **Icon.** The boot mark ✦, drawn as a vector with an adaptive background
  and a monochrome layer for themed icons. Code-built, like every other piece
  of art in the project.

## Testing Decisions

**The suite probe is last in `runAll`** (`SECOND WIND AND THE INTERSTITIAL`,
19 rows). It swaps in a scripted bridge, asserts what a player would see, and
puts the null bridge back. The rows cover:

- no offer with no bridge, or with no ad loaded;
- an ad closed early does not raise the hunter;
- a watched ad raises them with the configured health and invulnerability;
- the second wind builds no scene objects;
- the hunter is still alive a second later;
- the per-attempt cap, and a retry refilling it;
- `scope: 'warden'` refusing outside a Warden fight;
- a fall rising on the ledge behind the gap and staying on it;
- the interstitial landing on clears 2 and 4 of 4;
- the next gate waiting for a held interstitial;
- no interstitial before the run-end screen;
- the control: with the null bridge the arch is a straight cut.

**No drift is proven by hash, not by eye.** With the new section removed, the
report is byte-identical to the pre-change baseline on all five recorded seeds
(`20260728`, `1`, `99991`, `20260802`, `7777777`). Result: 244 PASS / 0 FAIL,
up from 225.

**The probe's first run was red, and the red was the probe.** The fall row
stepped one frame after a kill that had left a hitstop `freeze` behind. A
frozen frame simulates nothing, so the hunter had not died yet when the
second wind was asked for. It now steps until the void claims them. This is
recorded because "one step" is the obvious way to write the next such probe.

**What the suite cannot see, and what the device showed.** The suite
cannot prove any of the following:

- that the WebView serves ES modules with the right MIME types;
- that `localStorage` survives a relaunch;
- that consent and ads work;
- that back pauses;
- that a thumb clears a 26% jump margin.

All but the last were checked on an API 36 emulator (Google APIs, arm64),
over `adb` and the debug build's DevTools socket, on 2026-09-29:

| Check | Result |
|---|---|
| boots from `appassets.androidplatform.net`, 8/8 textures, touch controls on by `pointer: coarse` | pass |
| consent form (EEA, forced by debug geography and by the host's real IP) | pass, after the fix below |
| test rewarded and interstitial ads load after consent is declined (limited ads) | pass |
| death, then SECOND WIND, then a real tap, then Google's rewarded test ad, then "Reward granted", then closed: back to `playing` at 60/120 HP, objective restored | pass |
| audio held during the ad, released after it | pass |
| interstitial at the arch: game held on `resting` at gate 1, entered gate 2 only after close | pass |
| back during a run opens and closes the pause menu; back on the title sends the app home | pass |
| home mid-run: paused, audio context suspended; return: still paused, sound back | pass |
| force-stop and relaunch: title resumes at gate 2, NEW GAME shown | pass |
| signed release (R8, throwaway key): boots, consent, bridge reaches native, ads load | pass, after the fix below |

What it found, all fixed and recorded in `DECISIONS.md` § "Built
2026-09-29":

- **The consent form starved at boot.** One renderer process serves every
  WebView in an app, so the game's gate build blocked UMP's form page until
  it timed out. The shell now waits for `pageReady()` and retries.
- **The release build crashed on launch.** R8 stripped WorkManager's Room
  database. There is now a keep rule for it.
- **The title screen overflowed a landscape phone.** It is now tightened
  under 520 px tall.

**Still owed: a real thumb on a real phone.** It is the first time the game
runs under a WebView, and an emulator driven by `adb input` proves nothing
about a 26% margin. `docs/PLAY-STORE.md` § 6 carries it.

## Out of Scope

- **A finale.** The campaign as coded ends at gate 11's arch on the stats
  screen. The plan is now twelve gates (`DECISIONS.md` § "Amended
  2026-09-29: the campaign is twelve gates"), and gate 12 is its own build.
- **Remote config for the ad policy.** `SECOND_WIND` and `INTERSTITIAL` ship in
  the bundle. Moving them server-side would be a dependency and a network
  call for a number that changes once a year.
- **Banner ads, app-open ads and in-app purchases.** None was asked for, and
  an app-open ad is the one placement AdMob policy and this game's first
  impression both argue against.
- **Mediation.** AdMob's own demand only, until there is traffic to
  optimise.
- **Updating the game without a Play release.** This was the TWA's one real
  advantage, and it is given up. See the packaging amendment.

## Further Notes

**The trade that was made, stated once.** The recorded design claim is that
every threat announces itself, so you always know what killed you. It is
defended by the per-attempt cap and by nothing else. Option C is one value
away. If a later session is tempted to move it, the reasoning against is in
`DECISIONS.md` § Monetisation, unchanged, and the condition for reopening it
there still stands: retention data showing players lost at a non-boss wall.

**Every game change is now a Play release.** A bundled copy is what makes ads
and a stable save origin possible, and it means Pages and the app can drift
apart. Bump `sombra.versionCode` in `android/gradle.properties` for every
upload.

**Running it.** See `android/README.md`: debug build, emulator, real device,
signed release.
