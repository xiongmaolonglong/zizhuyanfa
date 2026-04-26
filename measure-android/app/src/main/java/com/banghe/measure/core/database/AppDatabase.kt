package com.banghe.measure.core.database

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase
import androidx.room.TypeConverters

@Database(
    entities = [
        WorkOrderEntity::class,
        TaskEntity::class,
        MeasurementEntity::class,
        SyncQueueEntity::class,
        MeasurementDraftEntity::class
    ],
    version = 2,
    exportSchema = false
)
@TypeConverters(Converters::class)
abstract class AppDatabase : RoomDatabase() {
    abstract fun workOrderDao(): WorkOrderDao
    abstract fun taskDao(): TaskDao
    abstract fun measurementDao(): MeasurementDao
    abstract fun syncQueueDao(): SyncQueueDao
    abstract fun measurementDraftDao(): MeasurementDraftDao

    companion object {
        @Volatile private var instance: AppDatabase? = null

        fun getDatabase(context: Context): AppDatabase {
            return instance ?: synchronized(this) {
                Room.databaseBuilder(
                    context.applicationContext,
                    AppDatabase::class.java,
                    "measure_database"
                )
                .fallbackToDestructiveMigration()
                .build()
                .also { instance = it }
            }
        }
    }
}
