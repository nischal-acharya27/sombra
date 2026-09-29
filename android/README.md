# SOMBRA — the Android shell

A native Kotlin WebView that carries the game from the repo root, plus the
AdMob and consent bridge. The game itself is **not** built here, just
copied: `index.html`, `src/`, `vendor/` and `assets/` go into the APK byte for
byte. Why this exists instead of a TWA, and what the game and the shell say
to each other, is in `docs/SPEC-ANDROID.md` and `docs/DECISIONS.md` §
"Amended 2026-09-29: the Android shell is native, not a TWA".

Gradle only, no npm. The repo root stays build-free.

## One-time setup

```bash
export ANDROID_HOME=~/Library/Android/sdk
```

```bash
export JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home"
```

The Homebrew JDK that `gradle` uses by default is too new for AGP. The JDK
bundled with Android Studio is the tested one. `android/local.properties`
(uncommitted) can hold `sdk.dir=` instead of the first export.

## Debug build: emulator or phone

```bash
cd android && ./gradlew installDebug
```

Debug builds always use **Google's test ad ids**. Clicking a real ad in your
own app is invalid traffic and can suspend the AdMob account, so never put
real ids in a debug build. WebView debugging is on in debug builds only:
`chrome://inspect` on the Mac, with the phone on USB.

**Testing consent from outside the EEA (or ads from inside it).** Launch the
app once and find UMP's line in logcat:
`addTestDeviceHashedId("…")`. Then:

```bash
./gradlew installDebug -PSOMBRA_UMP_DEBUG_GEOGRAPHY=eea -PSOMBRA_UMP_TEST_DEVICE=<that id>
```

`other` instead of `eea` forces the non-EEA path. Clear the app's data
between runs, because consent is remembered.

**If Google's test ads say "No fill" in the EEA,** answer the consent form
first. Until it has been answered, nothing fills, not even test ads.

**The real-thumb check** (`docs/DECISIONS.md` § The touch budget): install on
a phone and play gate 1 through its jumps. The WebView is a new runtime for
this game, and the only proof a thumb clears a 26% margin is a thumb.

## Release: the signed `.aab` for Play

Everything secret lives in **`~/.gradle/gradle.properties`**, in your home
directory, never in this repo:

```properties
SOMBRA_UPLOAD_STORE_FILE=/Users/you/keys/sombra-upload.jks
SOMBRA_UPLOAD_STORE_PASSWORD=…
SOMBRA_UPLOAD_KEY_ALIAS=upload
SOMBRA_UPLOAD_KEY_PASSWORD=…
SOMBRA_ADMOB_APP_ID=ca-app-pub-XXXXXXXXXXXXXXXX~YYYYYYYYYY
SOMBRA_ADMOB_REWARDED_ID=ca-app-pub-XXXXXXXXXXXXXXXX/ZZZZZZZZZZ
SOMBRA_ADMOB_INTERSTITIAL_ID=ca-app-pub-XXXXXXXXXXXXXXXX/WWWWWWWWWW
```

**Create the upload key once, yourself, and back it up.** Losing it means
asking Google for an upload-key reset, which is possible with Play App
Signing, but slow.

```bash
"$JAVA_HOME/bin/keytool" -genkeypair -v -keystore ~/keys/sombra-upload.jks -alias upload -keyalg RSA -keysize 2048 -validity 10000
```

Then build it:

```bash
cd android && ./gradlew bundleRelease
```

The output is `app/build/outputs/bundle/release/app-release.aab`.
`checkReleaseConfig` refuses to build if any of the seven values is missing.
A release with test ids earns nothing, and one with no ids crashes on launch.

**Before every upload:**

- bump `sombra.versionCode` in `android/gradle.properties` (Play rejects a
  repeated code), and `sombra.versionName` to match what changed;
- run `?sim` across the five seeds on the game first. The APK carries
  whatever the repo root holds at build time.

**`sombra.applicationId` is permanent** once the first build is uploaded to
Play. It is `io.github.nischalacharya27.sombra` today; change it before the
first upload or never.

## What a release has been checked for

A signed release was built with a throwaway key and run on an API 36
emulator (2026-09-29). R8 is on, and the checks below are what it could have
broken:

- the app boots to the title;
- the consent form appears;
- the page's call into `SombraAds` reaches native code;
- ads load.

The first release build crashed on launch: WorkManager's Room database was
stripped by R8, which `proguard-rules.pro` now prevents. A debug build cannot
show that class of bug. Rehearse a release on a device before the first
upload of any build that changes dependencies.
