package com.banghe.measure.core.database

import androidx.room.ColumnInfo
import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "tasks")
data class TaskEntity(
    @PrimaryKey val id: Int,
    @ColumnInfo(name = "work_order_id") val workOrderId: Int,
    @ColumnInfo(name = "type") val type: String,
    @ColumnInfo(name = "title") val title: String,
    @ColumnInfo(name = "status") val status: String,
    @ColumnInfo(name = "deadline") val deadline: String?,
    @ColumnInfo(name = "address") val address: String?,
    @ColumnInfo(name = "created_at") val createdAt: Long = System.currentTimeMillis()
)
