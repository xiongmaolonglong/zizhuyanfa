package com.banghe.measure.core

import android.app.Application
import androidx.work.ExistingPeriodicWorkPolicy
import androidx.work.PeriodicWorkRequestBuilder
import androidx.work.WorkManager
import com.banghe.measure.core.database.AppDatabase
import com.banghe.measure.core.network.ApiClient
import com.banghe.measure.core.network.ConnectivityObserver
import com.banghe.measure.core.storage.PreferencesStore
import com.banghe.measure.core.tts.TTSManager
import com.banghe.measure.core.websocket.WebSocketManager
import com.banghe.measure.core.work.CleanupWorker
import com.banghe.measure.data.assignment.AssignmentRepository
import com.banghe.measure.data.auth.AuthRepository
import com.banghe.measure.data.client.ClientRepository
import com.banghe.measure.data.construction.ConstructionRepository
import com.banghe.measure.data.dashboard.DashboardRepository
import com.banghe.measure.data.draft.DraftManager
import com.banghe.measure.data.measurement.MeasurementRepository
import com.banghe.measure.data.notification.NotificationRepository
import com.banghe.measure.data.task.TaskRepository
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch
import java.util.Calendar
import java.util.concurrent.TimeUnit

class App : Application() {
    lateinit var preferencesStore: PreferencesStore
        private set
    lateinit var database: AppDatabase
        private set
    lateinit var authRepository: AuthRepository
        private set
    lateinit var dashboardRepository: DashboardRepository
        private set
    lateinit var taskRepository: TaskRepository
        private set
    lateinit var notificationRepository: NotificationRepository
        private set
    lateinit var measurementRepository: MeasurementRepository
        private set
    lateinit var clientRepository: ClientRepository
        private set
    lateinit var constructionRepository: ConstructionRepository
        private set
    lateinit var assignmentRepository: AssignmentRepository
        private set
    lateinit var draftManager: DraftManager
        private set
    lateinit var webSocketManager: WebSocketManager
        private set
    lateinit var ttsManager: TTSManager
        private set
    lateinit var connectivityObserver: ConnectivityObserver
        private set
    private val appScope = CoroutineScope(Dispatchers.IO + SupervisorJob())

    override fun onCreate() {
        super.onCreate()
        instance = this

        preferencesStore = PreferencesStore(this)
        database = AppDatabase.getDatabase(this)
        ApiClient.initialize(preferencesStore)
        connectivityObserver = ConnectivityObserver(this)
        connectivityObserver.startListening()
        authRepository = AuthRepository(preferencesStore)
        dashboardRepository = DashboardRepository()
        taskRepository = TaskRepository(database)
        notificationRepository = NotificationRepository()
        measurementRepository = MeasurementRepository()
        clientRepository = ClientRepository()
        constructionRepository = ConstructionRepository()
        assignmentRepository = AssignmentRepository()
        draftManager = DraftManager(database.measurementDraftDao())
        webSocketManager = WebSocketManager(preferencesStore)
        ttsManager = TTSManager(this)
        ttsManager.init()
        webSocketManager.connect()

        // WebSocket 收到通知时触发语音播报
        // WebSocket 收到通知时触发语音播报
        appScope.launch {
            webSocketManager.newNotification.collect { notification ->
                val voiceEnabled = preferencesStore.getVoiceEnabled()
                if (voiceEnabled) {
                    // 播报具体通知内容
                    val message = notification.content ?: notification.title
                    ttsManager.speak(message)
                }
            }
        }

        // 网络恢复时自动重连 WebSocket
        appScope.launch {
            connectivityObserver.state.collect { state ->
                if (state is com.banghe.measure.core.network.ConnectionState.Available) {
                    if (!webSocketManager.isConnected.value) {
                        webSocketManager.connect()
                    }
                }
            }
        }

        scheduleCleanupWorker()
    }

    private fun scheduleCleanupWorker() {
        val delay = calculateDelayTo3AM()
        val cleanupRequest = PeriodicWorkRequestBuilder<CleanupWorker>(24, TimeUnit.HOURS)
            .setInitialDelay(delay, TimeUnit.MILLISECONDS)
            .build()
        WorkManager.getInstance(this).enqueueUniquePeriodicWork(
            "draft_cleanup",
            ExistingPeriodicWorkPolicy.KEEP,
            cleanupRequest
        )
    }

    private fun calculateDelayTo3AM(): Long {
        val now = Calendar.getInstance()
        val target = Calendar.getInstance().apply {
            set(Calendar.HOUR_OF_DAY, 3)
            set(Calendar.MINUTE, 0)
            set(Calendar.SECOND, 0)
            set(Calendar.MILLISECOND, 0)
            if (before(now)) add(Calendar.DAY_OF_MONTH, 1)
        }
        return target.timeInMillis - now.timeInMillis
    }

    companion object {
        lateinit var instance: App
            private set
    }
}
