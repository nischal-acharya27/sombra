// The Android shell for SOMBRA. A separate toolchain in a separate directory:
// the game at the repo root has no build step and never will — this project
// copies it, it does not compile it. See docs/SPEC-ANDROID.md.

pluginManagement {
    repositories {
        google()
        mavenCentral()
        gradlePluginPortal()
    }
}

dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
    }
}

rootProject.name = "sombra-android"
include(":app")
