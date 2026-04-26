package com.banghe.measure.data.sync

import android.content.Context
import androidx.work.*
import com.banghe.measure.core.App
import com.banghe.measure.core.database.SyncQueueEntity
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.util.concurrent.TimeUnit

class SyncWorker(
    context: Context,
    workerParams: WorkerParameters
) : CoroutineWorker(context, workerParams) {

    override suspend fun doWork(): Result = withContext(Dispatchers.IO) {
        try {
            val database = App.instance.database
            val pendingItems = database.syncQueueDao().getPending()

            if (pendingItems.isEmpty()) {
                return@withContext Result.success()
            }

            var hasFailure = false
            for (item in pendingItems) {
                val result = syncItem(item)
                if (result) {
                    database.syncQueueDao().markSynced(item.id)
                } else {
                    hasFailure = true
                    database.syncQueueDao().incrementAttempts(item.id)
                }
            }

            if (hasFailure) {
                Result.retry()
            } else {
                Result.success()
            }
        } catch (e: Exception) {
            Result.retry()
        }
    }

    private suspend fun syncItem(item: SyncQueueEntity): Boolean {
        // TODO: 根据 type 和 payload 执行实际同步
        return true
    }

    companion object {
        const val WORK_NAME = "sync_work"

        fun enqueue(context: Context) {
            val request = PeriodicWorkRequestBuilder<SyncWorker>(
                15, TimeUnit.MINUTES
            )
                .setConstraints(
                    Constraints.Builder()
                        .setRequiredNetworkType(NetworkType.CONNECTED)
                        .build()
                )
                .setBackoffCriteria(
                    BackoffPolicy.LINEAR,
                    WorkRequest.MIN_BACKOFF_MILLIS,
                    TimeUnit.MILLISECONDS
                )
                .build()

            WorkManager.getInstance(context).enqueueUniquePeriodicWork(
                WORK_NAME,
                ExistingPeriodicWorkPolicy.KEEP,
                request
            )
        }

        fun enqueueImmediate(context: Context) {
            val request = OneTimeWorkRequestBuilder<SyncWorker>()
                .setConstraints(
                    Constraints.Builder()
                        .setRequiredNetworkType(NetworkType.CONNECTED)
                        .build()
                )
                .build()

            WorkManager.getInstance(context).enqueue(request)
        }
    }
}