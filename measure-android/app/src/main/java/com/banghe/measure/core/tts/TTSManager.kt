package com.banghe.measure.core.tts

import android.content.Context
import android.media.AudioManager
import android.speech.tts.TextToSpeech
import java.util.Calendar
import java.util.Locale

class TTSManager(private val context: Context) {
    private var tts: TextToSpeech? = null
    private var lastSpeakTime = 0L
    private val throttleMs = 3000L

    fun init() {
        tts = TextToSpeech(context) { status ->
            if (status == TextToSpeech.SUCCESS) {
                tts?.language = Locale.CHINESE
            } else {
                tts = null
            }
        }
    }

    /**
     * 播报指定文本
     */
    fun speak(text: String) {
        val now = System.currentTimeMillis()
        if (now - lastSpeakTime < throttleMs) return
        if (!isInQuietHours() && !isSystemSilent()) {
            lastSpeakTime = now
            tts?.speak(text, TextToSpeech.QUEUE_FLUSH, null, "notification")
        }
    }

    /**
     * 播报新消息提示（兼容旧调用）
     */
    fun speakNewMessage() {
        speak("您有新的消息")
    }

    private fun isInQuietHours(): Boolean {
        val hour = Calendar.getInstance().get(Calendar.HOUR_OF_DAY)
        return hour < 8 || hour >= 22
    }

    private fun isSystemSilent(): Boolean {
        val am = context.getSystemService(Context.AUDIO_SERVICE) as AudioManager
        return am.ringerMode == AudioManager.RINGER_MODE_SILENT
    }

    fun destroy() {
        tts?.stop()
        tts?.shutdown()
        tts = null
    }
}
