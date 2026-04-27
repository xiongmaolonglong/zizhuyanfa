package com.banghe.measure.core.websocket

import android.os.Handler
import android.os.Looper
import android.util.Log
import com.banghe.measure.core.storage.PreferencesStore
import io.socket.client.IO
import io.socket.client.Socket
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.channels.BufferOverflow
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharedFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asSharedFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import org.json.JSONObject

/**
 * 通知数据类
 */
data class PushNotification(
    val id: Int,
    val title: String,
    val content: String?,
    val type: String?,
    val workOrderId: Int?,
    val ts: Long?
)

class WebSocketManager(private val preferencesStore: PreferencesStore) {
    private var socket: Socket? = null
    private val _isConnected = MutableStateFlow(false)
    val isConnected: StateFlow<Boolean> = _isConnected.asStateFlow()

    private val _unreadCount = MutableStateFlow(0)
    val unreadCount: StateFlow<Int> = _unreadCount.asStateFlow()

    private val _newNotification = MutableSharedFlow<PushNotification>(
        extraBufferCapacity = 5,
        onBufferOverflow = BufferOverflow.DROP_OLDEST
    )
    val newNotification: SharedFlow<PushNotification> = _newNotification.asSharedFlow()

    private var reconnectAttempts = 0
    private var reconnectRunnable: Runnable? = null
    private val handler = Handler(Looper.getMainLooper())
    private val scope = CoroutineScope(Dispatchers.IO + SupervisorJob())

    companion object {
        private const val TAG = "WebSocketManager"
        private const val MAX_RECONNECT_ATTEMPTS = 15
    }

    fun connect() {
        val token = preferencesStore.getTokenBlocking()
        if (token.isNullOrEmpty()) {
            Log.w(TAG, "No token available, skip WebSocket connection")
            return
        }

        scope.launch {
            // 确保通知设置已启用
            val notificationEnabled = preferencesStore.getNotificationEnabled()
            if (!notificationEnabled) {
                Log.w(TAG, "Notification disabled, skip WebSocket connection")
                return@launch
            }

            // 已有活跃连接，跳过
            if (socket?.connected() == true) {
                Log.i(TAG, "WebSocket already connected, skip")
                return@launch
            }

            // 创建新 socket 前先断开旧的
            disconnect()

            // 取消之前调度的重连任务
            reconnectRunnable?.let { handler.removeCallbacks(it) }
            reconnectRunnable = null

            // 使用服务端配置的 URL（HTTPS 复用 HTTP 端口）
            val baseUrl = "https://www.fsbhgg.com"
            Log.i(TAG, "Connecting to $baseUrl with auth token")

            try {
                // 按服务端文档使用 IO.Options.builder()
                val opts = IO.Options.builder()
                    .setAuth(mapOf("token" to token))
                    .setTransports(arrayOf("websocket"))
                    .setTimeout(10000L)
                    .setReconnection(false)
                    .build()

                socket = IO.socket(baseUrl, opts)

                socket?.on(Socket.EVENT_CONNECT) {
                    Log.i(TAG, "WebSocket connected successfully")
                    _isConnected.value = true
                    reconnectAttempts = 0
                }

                socket?.on(Socket.EVENT_DISCONNECT) { args ->
                    Log.w(TAG, "WebSocket disconnected: ${args.firstOrNull()}")
                    _isConnected.value = false
                    scheduleReconnect()
                }

                socket?.on(Socket.EVENT_CONNECT_ERROR) { args ->
                    Log.e(TAG, "WebSocket connect error: ${args.firstOrNull()}")
                    _isConnected.value = false
                    scheduleReconnect()
                }

                // 监听 notification 事件（服务端推送的通知）
                socket?.on("notification") { args ->
                    Log.i(TAG, "Received notification event: ${args.firstOrNull()}")
                    val data = args.firstOrNull()
                    if (data != null) {
                        try {
                            val json = if (data is JSONObject) data else JSONObject(data.toString())
                            val notification = PushNotification(
                                id = json.optInt("id", 0),
                                title = json.optString("title", "新通知"),
                                content = json.optString("content", null),
                                type = json.optString("type", null),
                                workOrderId = json.optInt("work_order_id", 0).takeIf { it > 0 },
                                ts = json.optLong("ts", 0).takeIf { it > 0 }
                            )
                            Log.i(TAG, "Parsed notification: $notification")
                            scope.launch {
                                _newNotification.emit(notification)
                            }
                            _unreadCount.update { it + 1 }
                        } catch (e: Exception) {
                            Log.e(TAG, "Failed to parse notification: ${e.message}")
                        }
                    }
                }

                socket?.connect()
            } catch (e: Exception) {
                Log.e(TAG, "Failed to create socket: ${e.message}")
                scheduleReconnect()
            }
        }
    }

    fun disconnect() {
        Log.i(TAG, "Disconnecting WebSocket")
        // 取消所有待调度的重连
        reconnectRunnable?.let { handler.removeCallbacks(it) }
        reconnectRunnable = null
        reconnectAttempts = 0

        socket?.off()
        socket?.disconnect()
        socket = null
        _isConnected.value = false
    }

    private fun scheduleReconnect() {
        // 达到上限后，每 5 分钟重试一次，不再放弃
        val delay = if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
            reconnectAttempts = 0
            300000L
        } else {
            minOf(1000L * (1L shl reconnectAttempts.coerceAtMost(14)), 30000L).also { reconnectAttempts++ }
        }
        Log.i(TAG, "Scheduling reconnect in ${delay}ms (attempt ${reconnectAttempts.takeIf { it > 0 } ?: "periodic"})")
        reconnectRunnable = Runnable {
            if (!_isConnected.value) connect()
        }
        handler.postDelayed(reconnectRunnable!!, delay)
    }

    fun clearUnread() { _unreadCount.update { 0 } }

    fun destroy() {
        reconnectRunnable?.let { handler.removeCallbacks(it) }
        reconnectRunnable = null
        scope.cancel()
        disconnect()
    }
}
