package com.banghe.measure.core.tts

import android.content.Context
import android.media.AudioManager
import android.os.Handler
import android.os.Looper
import android.speech.tts.TextToSpeech
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import java.util.Calendar
import java.util.Locale
import java.util.concurrent.ConcurrentLinkedQueue

class TTSManager(private val context: Context) {
    private var tts: TextToSpeech? = null
    private val _isInitialized = MutableStateFlow(false)
    val isInitialized: StateFlow<Boolean> = _isInitialized.asStateFlow()
    private var lastSpeakTime = 0L
    private val throttleMs = 3000L
    private val pendingQueue = ConcurrentLinkedQueue<String>()
    private val handler = Handler(Looper.getMainLooper())

    fun init() {
        tts = TextToSpeech(context) { status ->
            if (status == TextToSpeech.SUCCESS) {
                tts?.language = Locale.CHINESE
                _isInitialized.value = true
                flushPending()
            } else {
                tts = null
            }
        }
    }

    /**
     * 播报指定文本，若 TTS 未初始化则排队等待
     */
    fun speak(text: String) {
        if (text.isBlank()) return
        if (!_isInitialized.value) {
            pendingQueue.offer(text)
            return
        }
        doSpeak(text)
    }

    private fun doSpeak(text: String) {
        val now = System.currentTimeMillis()
        if (now - lastSpeakTime < throttleMs) return
        if (isInQuietHours() || isSystemSilent()) return
        lastSpeakTime = now
        tts?.speak(text, TextToSpeech.QUEUE_FLUSH, null, "notification")
    }

    private fun flushPending() {
        // 按 throttleMs 间隔逐个播报，避免节流丢弃
        handler.post(object : Runnable {
            override fun run() {
                val item = pendingQueue.poll() ?: return
                doSpeak(item)
                if (pendingQueue.isNotEmpty()) {
                    handler.postDelayed(this, throttleMs)
                }
            }
        })
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
