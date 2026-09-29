# Play Store — the checklist, in order

From "no account" to "live on Play", with who does each step. **You** marks
steps only the account holder can do: identity, payment, signing secrets,
legal declarations, the upload button. The agent must not do these, even if
asked. Everything else is already built, or drafted for your review in
`docs/store/`.

Policy facts below were checked against Google's own pages on **2026-09-29**
(sources at the end). Google changes them yearly. Re-check any line you are
about to act on if this date is more than a few months old.

Decisions this rests on:

- **Audience:** built for 9+, declared 13+ (`DECISIONS.md` § Audience).
- **Ads:** a second wind once per gate attempt, and an interstitial every
  second gate clear (`DECISIONS.md` § "Amended 2026-09-29", both entries).
- **Ship:** Production with eleven gates, with gate 12 (the finale) to follow
  as an update.

---

## 0. Decide before anything else

- [ ] **You: personal or organisation account?** This sets the schedule.
  A **personal** account created after 2023-11-13 cannot publish to
  Production until a **closed test has had at least 12 testers opted in
  continuously for 14 days**. Testers who leave before day 14 do not count.
  An **organisation** account skips this, but needs a D-U-N-S number and
  takes longer to verify. For a personal account, the 14-day clock is the
  longest item on this list, so start it as early as possible (step 6).
- [ ] **You: the package name** is `io.github.nischalacharya27.sombra`
  (`android/gradle.properties`). It is permanent after the first upload.
  Change it now or never.

## 1. Accounts (you)

- [ ] **Play Console developer account.** $25 one-time fee. Identity
  verification may ask for a government ID and a card in your legal name.
  <https://play.google.com/console/signup>
- [ ] **AdMob account.** <https://admob.google.com>. Link it to the Play
  Console account once the app exists on Play (AdMob → Apps → link to store).
- [ ] In AdMob:
  - create the app, and one **Rewarded** and one **Interstitial** ad unit;
  - note the app id (`ca-app-pub-…~…`) and the two unit ids (`ca-app-pub-…/…`).
- [ ] In AdMob → Privacy & messaging, create a **GDPR message** (EEA/UK)
  for the app. The app's UMP code shows whatever message you publish there.
  Without one, EEA players see no form, give no consent, and get no ads.
  Optionally, create a **US states** message too.

## 2. Signing secrets (you, on your Mac, never in the repo)

- [ ] Generate the **upload key**. The command is in `android/README.md` §
  Release. Back the `.jks` file and its passwords up somewhere that is not
  this repo and not this laptop alone.
- [ ] Put the seven `SOMBRA_*` values in `~/.gradle/gradle.properties`
  (`android/README.md` § Release). The repo's `.gitignore` refuses `*.jks`
  and `keystore.properties` as a second line of defence, but the values
  should never be inside the repo in the first place.
- [ ] Play App Signing is mandatory for new apps and turns on at first
  upload. Google holds the real app-signing key, and yours is only the
  upload key.

## 3. Build the bundle (agent or you)

- [ ] `?sim` across the five recorded seeds: 244 PASS / 0 FAIL expected.
- [ ] `cd android && ./gradlew bundleRelease` produces
  `app/build/outputs/bundle/release/app-release.aab`. It is an AAB, which
  Play requires for new apps; an APK is not accepted.
- [ ] Target API: the build targets **API 36**, which Play requires for new
  apps and updates from 2026-08-31.
- [ ] **Rehearse the release on a device before uploading** (`adb install`
  the release APK from `./gradlew assembleRelease`, or use internal testing).
  R8 bugs only show in release. One already did (`android/README.md`).

## 4. Host two things on the web (you: push, and check the URLs)

- [ ] **Privacy policy.** This is mandatory even though the game itself only
  keeps a save on the device, because AdMob collects data (step 5). A draft
  is at `docs/store/privacy-policy.md`. Review it, fill in the contact email,
  and publish it at a public URL. The simplest option is a `privacy.html` on
  GitHub Pages: <https://nischal-acharya27.github.io/sombra/privacy.html>.
- [ ] **app-ads.txt.** AdMob looks for it only at the **root of the domain**
  in your store listing's *developer website* field, e.g.
  `https://example.com/app-ads.txt`. A GitHub **project** page
  (`…github.io/sombra/`) is not a root. Two ways to get one:
  - a GitHub **user site**: a repo named `nischal-acharya27.github.io`, with
    `app-ads.txt` at its root, served at
    `https://nischal-acharya27.github.io/app-ads.txt`. Put
    `https://nischal-acharya27.github.io` as the developer website;
  - or any domain you own.

  The file's one line comes from AdMob → Apps → app-ads.txt. Ads serve
  without it, but AdMob warns and some demand is withheld. It's worth doing
  before launch.

## 5. Play Console: the app's declarations (you, with the drafts)

Create the app: a free game, category **Action**. Then App content:

- [ ] **Privacy policy URL**, from step 4.
- [ ] **Ads:** *Yes, my app contains ads.*
- [ ] **App access:** no login, all content accessible.
- [ ] **Target audience and content: 13–15, 16–17, 18+. Do not tick any
  under-13 group.** Ticking one pulls the app into the Families policy
  (certified ad SDKs, non-personalised ads, and the reported eCPM cut across
  the whole user base). The app's ad requests already agree with this: not
  child-directed, not under the age of consent, maximum ad rating Teen
  (`AdBridge.kt`). When asked whether the app could unintentionally appeal
  to children, answer honestly. The known risk is on record: a soft pastel
  art style can draw a review, and the listing copy is written to that
  (`docs/store/listing.md`).
- [ ] **Content rating (IARC questionnaire).** The honest answers:
  - stylised fantasy combat against humanoid and mythological figures;
  - no blood, no gore, no dismemberment;
  - no sexual content, no profanity, no drugs;
  - no gambling. One Warden throws dice as an attack; no money or chance
    mechanic is involved;
  - no user-generated content, no chat, no location, no purchases.

  Expect roughly PEGI 7–12 or ESRB E10+ to T. IARC assigns it; do not guess
  it into the listing.
- [ ] **Data safety.** Draft answers are in `docs/store/data-safety.md`. In
  short: the game collects nothing, but the AdMob SDK collects the
  **advertising ID / device identifiers, approximate location (from IP),
  app interactions and diagnostics**, all encrypted in transit.
- [ ] **Advertising ID declaration:** *Yes*, used for advertising. The ads
  SDK adds the `AD_ID` permission.
- [ ] **Foreground service:** the ads SDK's WorkManager dependency adds the
  `FOREGROUND_SERVICE` permission. The app starts no foreground service. If
  Console asks for a foreground-service declaration, that is the answer.
  Tell the agent too, since the permission can be stripped from the manifest.
- [ ] **Government apps, financial features, health, news:** none.

## 6. Testing tracks (you press upload; the agent can prepare everything)

- [ ] **Internal testing** first: up to 100 testers, no review wait. Upload
  the `.aab`, install through the opt-in link on your own phone, and play:
  - consent appears (in the EEA/UK);
  - a death offers SECOND WIND once the ad has loaded;
  - the second gate clear shows an interstitial;
  - back pauses;
  - progress survives a relaunch.
- [ ] **The real-thumb check**, also on that phone: gate 1's jumps, played
  with a thumb (`DECISIONS.md` § The touch budget).
- [ ] **Closed testing** (personal accounts): recruit **at least 12
  testers** (by email list or Google Group), have every one opt in and
  install, and **keep them opted in for 14 consecutive days**. Recruit 15–20,
  so that two dropping out does not restart the count.
- [ ] After 14 days, apply for **Production access** in Play Console. Google
  asks about the test: how testers were recruited, what feedback changed.
  Keep notes during the fortnight.

## 7. Store listing (you submit; the agent drafted)

- [ ] Title, short description and full description: drafts are in
  `docs/store/listing.md`, written to three constraints:
  - the 13+ declaration;
  - the respectful-treatment flags in `docs/research/villain-roster.md`;
  - an honest "eleven gates, the finale coming". It does not promise an
    ending this build lacks.
- [ ] **App icon**, 512×512 PNG. The launcher icon is a vector (the boot
  mark ✦). A PNG export of it is a design task the agent can do on request.
- [ ] **Feature graphic**, 1024×500, and **at least 2 phone screenshots**
  (landscape is fine). Take screenshots from the real app on a phone, not
  from Pages: the store must show what installs. No text baked into
  graphics is required, and if you add some, remember the no-text-in-textures
  rule is the game's, not Play's.
- [ ] Contact email (public) and developer website (the app-ads.txt domain,
  step 4).

## 8. Production (you)

- [ ] Promote the tested build to Production, starting with a staged
  rollout (for example 20%).
- [ ] **What a reviewer and a player will meet:** eleven gates, then the
  run-end screen after Narakasura. That is the decision on record. Make sure
  the listing says the finale is coming, not that the story ends.
- [ ] **Every later game change is a new `.aab`** with a bumped
  `versionCode`. Pages and the app now update separately, which is the cost
  of the native shell (`DECISIONS.md` § "…the Android shell is native, not a
  TWA").

## Ad placement rules this build already follows

These are checked here so the review does not have to find them:

| Rule (AdMob / Play) | How the build meets it |
|---|---|
| Rewarded ads are opt-in, and the reward is stated before the ad | SECOND WIND is a button the player presses, labelled "watch an ad · rise where you fell"; RISE AGAIN, free, is always beside it |
| No interstitial on app launch or exit | only at a gate boundary, never before the first gate or on the run-end screen |
| No interstitial during gameplay or unexpectedly | only at the arch, after the clear is saved, with nothing live |
| No more than one interstitial per two user actions, and none right after another | one per two gate clears (~4 min of play) |
| Consent before personalised ads in the EEA/UK | UMP runs first; AdMob is not initialised until `canRequestAds()`; PRIVACY OPTIONS on the title screen where required |
| Child-directed flags agree with the declared audience | not child-directed, not under the age of consent, max rating Teen |
| No accidental clicks: ads never overlap game controls | full-screen ads only; no banners |

## Sources (checked 2026-09-29)

- Target API level: <https://developer.android.com/google/play/requirements/target-sdk>
- Testing requirements for new personal accounts: <https://support.google.com/googleplay/android-developer/answer/14151465>
- Registration fee and verification: <https://support.google.com/googleplay/android-developer/answer/6112435>
- app-ads.txt location: <https://support.google.com/admob/answer/9363762>
- Interstitial placement policy: <https://support.google.com/admob/answer/6201362>
- AdMob SDK data for the Data safety form: <https://developers.google.com/admob/android/privacy/play-data-disclosure>
- UMP SDK (consent): <https://developers.google.com/admob/android/privacy>
