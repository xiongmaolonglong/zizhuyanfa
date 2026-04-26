# Add project specific ProGuard rules here.
-keepattributes *Annotation*
-keepattributes Signature
-keep class com.banghe.measure.data.** { *; }
-keep class com.banghe.measure.domain.model.** { *; }

# Socket.IO client
-keep class io.socket.** { *; }
-dontwarn io.socket.**
