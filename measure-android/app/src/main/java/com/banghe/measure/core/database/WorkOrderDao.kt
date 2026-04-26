package com.banghe.measure.core.database

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query

@Dao
interface WorkOrderDao {
    @Query("SELECT * FROM work_orders ORDER BY updated_at DESC")
    suspend fun getAll(): List<WorkOrderEntity>

    @Query("SELECT * FROM work_orders WHERE id = :id")
    suspend fun getById(id: Int): WorkOrderEntity?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(workOrder: WorkOrderEntity)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAll(workOrders: List<WorkOrderEntity>)

    @Query("DELETE FROM work_orders")
    suspend fun clearAll()
}
