package com.banghe.measure.core.database

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "measurement_drafts")
data class MeasurementDraftEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val workOrderId: Int,
    val step: Int,
    val basicInfoJson: String?,
    val materialsJson: String?,
    val signaturePath: String?,
    val photosJson: String?,
    val createdAt: Long = System.currentTimeMillis(),
    val updatedAt: Long = System.currentTimeMillis()
)