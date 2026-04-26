package com.banghe.measure.core.work

import android.content.Context
import androidx.work.*
import com.banghe.measure.core.App
import java.util.concurrent.TimeUnit

class CleanupWorker(ctx: Context, params: WorkerParameters) : CoroutineWorker(ctx, params) {
    override suspend fun doWork(): Result {
        val expireTime = System.currentTimeMillis() - 7 * 24 * 60 * 60 * 1000L
        App.instance.database.measurementDraftDao().deleteExpired(expireTime)
        return Result.success()
    }
}