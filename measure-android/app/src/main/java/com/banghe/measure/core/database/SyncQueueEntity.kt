package com.banghe.measure.core.database

import androidx.room.ColumnInfo
import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "sync_queue")
data class SyncQueueEntity(
    @PrimaryKey(autoGenerate = true) val id: Int = 0,
    @ColumnInfo(name = "type") val type: String,
    @ColumnInfo(name = "order_id") val orderId: Int,
    @ColumnInfo(name = "payload") val payload: String,
    @ColumnInfo(name = "status") val status: String,
    @ColumnInfo(name = "error_msg") val errorMsg: String?,
    @ColumnInfo(name = "retry_count") val retryCount: Int = 0,
    @ColumnInfo(name = "created_at") val createdAt: Long = System.currentTimeMillis()
)
