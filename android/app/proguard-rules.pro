# The ad bridge is called by name from JavaScript; R8 cannot see that.
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# The ads SDK pulls in WorkManager 2.7 on Room 2.2, which finds its generated
# database (`WorkDatabase_Impl`) by reflection and ships no rule R8's full mode
# honours. Without this the release build crashes on launch, in a content
# provider, before the activity exists — found by running a signed release
# on the emulator, which a debug build cannot show.
-keep class * extends androidx.room.RoomDatabase { <init>(); }
