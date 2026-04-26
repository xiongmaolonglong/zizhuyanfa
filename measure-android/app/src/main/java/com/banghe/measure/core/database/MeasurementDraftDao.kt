package com.banghe.measure.core.database

import androidx.room.*
import kotlinx.coroutines.flow.Flow

@Dao
interface MeasurementDraftDao {
    @Query("SELECT * FROM measurement_drafts ORDER BY updatedAt DESC")
    fun getAll(): Flow<List<MeasurementDraftEntity>>

    @Query("SELECT * FROM measurement_drafts WHERE workOrderId = :workOrderId LIMIT 1")
    suspend fun getByWorkOrderId(workOrderId: Int): MeasurementDraftEntity?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(draft: MeasurementDraftEntity)

    @Query("DELETE FROM measurement_drafts WHERE id = :id")
    suspend fun deleteById(id: Long)

    @Query("DELETE FROM measurement_drafts WHERE createdAt < :expireTime")
    suspend fun deleteExpired(expireTime: Long)
}