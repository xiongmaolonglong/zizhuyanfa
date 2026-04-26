package com.banghe.measure.core.database

import androidx.room.ColumnInfo
import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "work_orders")
data class WorkOrderEntity(
    @PrimaryKey val id: Int,
    @ColumnInfo(name = "work_order_no") val workOrderNo: String,
    @ColumnInfo(name = "title") val title: String,
    @ColumnInfo(name = "task_type") val taskType: String,
    @ColumnInfo(name = "address") val address: String?,
    @ColumnInfo(name = "contact_name") val contactName: String?,
    @ColumnInfo(name = "contact_phone") val contactPhone: String?,
    @ColumnInfo(name = "description") val description: String?,
    @ColumnInfo(name = "deadline") val deadline: String?,
    @ColumnInfo(name = "status") val status: String,
    @ColumnInfo(name = "current_stage") val currentStage: String,
    @ColumnInfo(name = "priority") val priority: String?,
    @ColumnInfo(name = "assigned_to_user_id") val assignedToUserId: Int?,
    @ColumnInfo(name = "updated_at") val updatedAt: Long = System.currentTimeMillis()
)
