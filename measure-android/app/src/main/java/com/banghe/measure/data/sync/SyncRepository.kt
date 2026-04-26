package com.banghe.measure.data.sync

import com.banghe.measure.core.database.AppDatabase
import com.banghe.measure.core.database.SyncQueueEntity

class SyncRepository(
    private val database: AppDatabase
) {
    private val dao = database.syncQueueDao()

    suspend fun addToQueue(
        type: String,
        orderId: Int,
        payload: String?
    ) {
        val entity = SyncQueueEntity(
            type = type,
            orderId = orderId,
            payload = payload ?: "",
            status = "pending",
            errorMsg = null
        )
        dao.insert(entity)
    }

    suspend fun getPendingCount(): Int = dao.getPendingCount()

    suspend fun getPending(): List<SyncQueueEntity> = dao.getPending()
}