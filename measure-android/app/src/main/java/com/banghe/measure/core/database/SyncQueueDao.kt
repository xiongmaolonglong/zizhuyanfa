package com.banghe.measure.core.database

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import androidx.room.Update

@Dao
interface SyncQueueDao {
    @Query("SELECT * FROM sync_queue WHERE status = 'pending' ORDER BY created_at ASC")
    suspend fun getPending(): List<SyncQueueEntity>

    @Query("SELECT COUNT(*) FROM sync_queue WHERE status = 'pending'")
    suspend fun getPendingCount(): Int

    @Query("SELECT * FROM sync_queue ORDER BY created_at DESC")
    suspend fun getAll(): List<SyncQueueEntity>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(item: SyncQueueEntity)

    @Update
    suspend fun update(item: SyncQueueEntity)

    @Query("UPDATE sync_queue SET status = 'synced' WHERE id = :id")
    suspend fun markSynced(id: Int)

    @Query("UPDATE sync_queue SET retry_count = retry_count + 1 WHERE id = :id")
    suspend fun incrementAttempts(id: Int)

    @Query("DELETE FROM sync_queue WHERE status = 'synced'")
    suspend fun clearSynced()
}