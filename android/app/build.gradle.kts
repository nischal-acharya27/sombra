import javax.inject.Inject

plugins {
    // AGP 9 compiles Kotlin itself; no separate Kotlin plugin.
    id("com.android.application")
}

/** A value from `gradle.properties` — the repo's or, for secrets, ~/.gradle's. */
fun prop(name: String): String? = (findProperty(name) as String?)?.takeIf { it.isNotBlank() }

// Google's published test ids. Debug builds always use these: a real ad
// clicked during development is invalid traffic and can suspend the account.
val testAdmobAppId = "ca-app-pub-3940256099942544~3347511713"
val testRewardedId = "ca-app-pub-3940256099942544/5224354917"
val testInterstitialId = "ca-app-pub-3940256099942544/1033173712"

// The real ids come from ~/.gradle/gradle.properties, never the repo.
val admobAppId = prop("SOMBRA_ADMOB_APP_ID")
val rewardedId = prop("SOMBRA_ADMOB_REWARDED_ID")
val interstitialId = prop("SOMBRA_ADMOB_INTERSTITIAL_ID")
val uploadStore = prop("SOMBRA_UPLOAD_STORE_FILE")

android {
    namespace = "io.github.nischalacharya27.sombra"
    compileSdk = 36

    defaultConfig {
        applicationId = prop("sombra.applicationId")
        minSdk = 26
        // Play requires API 36 for new apps and updates from 2026-08-31.
        targetSdk = 36
        versionCode = prop("sombra.versionCode")!!.toInt()
        versionName = prop("sombra.versionName")
    }

    signingConfigs {
        if (uploadStore != null) {
            create("upload") {
                storeFile = file(uploadStore)
                storePassword = prop("SOMBRA_UPLOAD_STORE_PASSWORD")
                keyAlias = prop("SOMBRA_UPLOAD_KEY_ALIAS")
                keyPassword = prop("SOMBRA_UPLOAD_KEY_PASSWORD")
            }
        }
    }

    buildTypes {
        debug {
            manifestPlaceholders["admobAppId"] = testAdmobAppId
            buildConfigField("String", "REWARDED_ID", "\"$testRewardedId\"")
            buildConfigField("String", "INTERSTITIAL_ID", "\"$testInterstitialId\"")
            // Consent testing, debug only: `-PSOMBRA_UMP_DEBUG_GEOGRAPHY=eea`
            // (or `other`) plus the hashed device id UMP prints to logcat as
            // `-PSOMBRA_UMP_TEST_DEVICE=...`. Lets the EEA form be tested from
            // outside the EEA, and the ad path from inside it.
            buildConfigField("String", "UMP_DEBUG_GEOGRAPHY", "\"${prop("SOMBRA_UMP_DEBUG_GEOGRAPHY") ?: ""}\"")
            buildConfigField("String", "UMP_TEST_DEVICE", "\"${prop("SOMBRA_UMP_TEST_DEVICE") ?: ""}\"")
        }
        release {
            isMinifyEnabled = true
            isShrinkResources = true
            proguardFiles(getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro")
            manifestPlaceholders["admobAppId"] = admobAppId ?: "MISSING"
            buildConfigField("String", "REWARDED_ID", "\"${rewardedId ?: "MISSING"}\"")
            buildConfigField("String", "INTERSTITIAL_ID", "\"${interstitialId ?: "MISSING"}\"")
            buildConfigField("String", "UMP_DEBUG_GEOGRAPHY", "\"\"")
            buildConfigField("String", "UMP_TEST_DEVICE", "\"\"")
            if (uploadStore != null) signingConfig = signingConfigs.getByName("upload")
        }
    }

    buildFeatures {
        buildConfig = true
    }
}

dependencies {
    implementation("androidx.core:core-ktx:1.17.0")
    implementation("androidx.activity:activity:1.9.3")
    implementation("androidx.webkit:webkit:1.14.0")
    implementation("com.google.android.gms:play-services-ads:25.0.0")
    implementation("com.google.android.ump:user-messaging-platform:4.0.0")
}

// -- the game, copied in ------------------------------------------------------
//
// The game is not compiled, bundled or transformed: the files Pages serves are
// copied byte for byte into the APK's assets and served from
// https://appassets.androidplatform.net/game/ by WebViewAssetLoader. `tools/`
// is left out — `?sim` and `?perf` never run in the app.

abstract class SyncGame : DefaultTask() {
    @get:InputFiles
    @get:PathSensitive(PathSensitivity.RELATIVE)
    abstract val game: ConfigurableFileCollection

    @get:OutputDirectory
    abstract val outputDir: DirectoryProperty

    @get:Inject
    abstract val fs: FileSystemOperations

    @TaskAction
    fun sync() {
        fs.sync {
            from(game)
            into(outputDir.dir("game"))
        }
    }
}

val syncGame = tasks.register<SyncGame>("syncGame") {
    game.from(
        fileTree(rootDir.parentFile) {
            include("index.html", "src/**", "vendor/**", "assets/**")
            exclude("**/.DS_Store")
        }
    )
}

androidComponents {
    onVariants { variant ->
        variant.sources.assets?.addGeneratedSourceDirectory(syncGame, SyncGame::outputDir)
    }
}

// A release build with Google's test ids earns nothing, and one with no ids
// at all crashes on launch. Neither should ever reach the upload page.
val checkReleaseConfig = tasks.register("checkReleaseConfig") {
    val missing = listOf(
        "SOMBRA_ADMOB_APP_ID" to admobAppId,
        "SOMBRA_ADMOB_REWARDED_ID" to rewardedId,
        "SOMBRA_ADMOB_INTERSTITIAL_ID" to interstitialId,
        "SOMBRA_UPLOAD_STORE_FILE" to uploadStore,
    ).filter { it.second == null }.map { it.first }
    doLast {
        if (missing.isNotEmpty()) {
            throw GradleException(
                "Release build needs ${missing.joinToString()} in ~/.gradle/gradle.properties — see android/README.md."
            )
        }
    }
}
tasks.matching { it.name == "preReleaseBuild" }.configureEach { dependsOn(checkReleaseConfig) }
