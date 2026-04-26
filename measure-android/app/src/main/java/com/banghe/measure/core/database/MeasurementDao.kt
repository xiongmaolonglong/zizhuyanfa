package com.banghe.measure.core.database

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query

@Dao
interface MeasurementDao {
    @Query("SELECT * FROM measurements ORDER BY created_at DESC")
    suspend fun getAll(): List<MeasurementEntity>

    @Query("SELECT * FROM measurements WHERE order_id = :orderId")
    suspend fun getByOrderId(orderId: Int): MeasurementEntity?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(measurement: MeasurementEntity)
}
