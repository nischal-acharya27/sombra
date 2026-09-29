# Data safety form — draft answers

For the account holder to review and enter in Play Console → App content →
Data safety (`docs/PLAY-STORE.md` step 5). Drafted 2026-09-29 against Google's
own guidance for the Mobile Ads SDK
(<https://developers.google.com/admob/android/privacy/play-data-disclosure>).
**Re-read that page before submitting. Google updates the SDK's collection,
and the form must match the SDK version actually shipped**
(`play-services-ads:25.0.0`, `user-messaging-platform:4.0.0` in
`android/app/build.gradle.kts`).

## What the game itself does

Nothing leaves the device. The save (furthest gate reached, level, best
style ranks, which tutorials were seen) is `localStorage` inside the app's
WebView. It is included in Android's own backup (`backup_rules.xml`), which
is the user's Google account backup, not a server of ours. There are no
accounts, no analytics, no crash reporting of our own, and no network calls
of our own. The game is bundled in the APK.

Android backup is not "collection" for the form: the data goes to the user's
own backup, and the developer cannot access it.

## Overview questions

| Question | Answer |
|---|---|
| Does your app collect or share any of the required user data types? | **Yes**, through the Google Mobile Ads SDK |
| Is all of the user data collected by your app encrypted in transit? | **Yes** (the SDK uses TLS) |
| Do you provide a way for users to request that their data is deleted? | **No** account data exists to delete. The ad data is Google's, governed by Google's policies; the advertising ID can be reset or deleted in Android settings. Say so in the privacy policy. |

## Data types

Every type below is **collected and shared**, **processed ephemerally: no**,
**required** (users cannot opt out in-app, except through consent in
EEA/UK, where UMP limits it). Purposes, for each: **Advertising or
marketing**, **Analytics**, **Fraud prevention, security and compliance**.

| Category | Type | Why it's there |
|---|---|---|
| Location | **Approximate location** | the SDK sees the device IP address, which estimates general location |
| App activity | **App interactions** | ad-related launches, taps and video views |
| App info and performance | **Diagnostics** | launch time, hang rate, energy use, for the SDK |
| Device or other IDs | **Device or other IDs** | the Android advertising ID and app set ID |

Nothing in: personal info (name, email), financial info, health, messages,
photos/videos, audio, files, calendar, contacts, web browsing, or precise
location.

## Cross-check before submitting

- [ ] The SDK version in `android/app/build.gradle.kts` still matches the
      version the Google page describes.
- [ ] No new SDK has been added to the shell since this draft. Each new SDK
      adds its own rows.
- [ ] The privacy policy (`docs/store/privacy-policy.md`) names the same
      data types, and says the same thing about deletion.
