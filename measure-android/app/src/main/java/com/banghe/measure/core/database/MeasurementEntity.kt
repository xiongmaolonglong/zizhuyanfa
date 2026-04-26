package com.banghe.measure.core.database

import androidx.room.ColumnInfo
import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "measurements")
data class MeasurementEntity(
    @PrimaryKey(autoGenerate = true) val id: Int = 0,
    @ColumnInfo(name = "order_id") val orderId: Int,
    @ColumnInfo(name = "weather") val weather: String?,
    @ColumnInfo(name = "access_condition") val accessCondition: String?,
    @ColumnInfo(name = "vehicle_access") val vehicleAccess: Boolean = false,
    @ColumnInfo(name = "environment_flags") val environmentFlags: String?,
    @ColumnInfo(name = "working_height") val workingHeight: Double?,
    @ColumnInfo(name = "power_distance") val powerDistance: Double?,
    @ColumnInfo(name = "notes") val notes: String?,
    @ColumnInfo(name = "materials_json") val materialsJson: String?,
    @ColumnInfo(name = "signature_path") val signaturePath: String?,
    @ColumnInfo(name = "photo_paths") val photoPaths: String?,
    @ColumnInfo(name = "status") val status: String,
    @ColumnInfo(name = "created_at") val createdAt: Long = System.currentTimeMillis()
)
