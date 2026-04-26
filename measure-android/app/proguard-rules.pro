# Add project specific ProGuard rules here.
-keepattributes *Annotation*
-keepattributes Signature
-keep class com.banghe.measure.data.** { *; }
-keep class com.banghe.measure.domain.model.** { *; }

# Socket.IO client and Engine.IO
-keep class io.socket.** { *; }
-dontwarn io.socket.**

# OkHttp / Okio (required by socket.io-client)
-keep class okhttp3.** { *; }
-dontwarn okhttp3.**
-keep class okio.** { *; }
-dontwarn okio.**
