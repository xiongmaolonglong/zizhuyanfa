package com.banghe.measure.data.draft

import com.banghe.measure.core.database.MeasurementDraftDao
import com.banghe.measure.core.database.MeasurementDraftEntity
import kotlinx.coroutines.flow.Flow
import com.squareup.moshi.Moshi
import com.squareup.moshi.kotlin.reflect.KotlinJsonAdapterFactory

class DraftManager(private val dao: MeasurementDraftDao) {
    private val moshi = Moshi.Builder().add(KotlinJsonAdapterFactory()).build()
    private val listAdapter = moshi.adapter<List<String>>(List::class.java)

    suspend fun saveDraft(
        workOrderId: Int,
        step: Int,
        basicInfoJson: String? = null,
        materialsJson: String? = null,
        signaturePath: String? = null,
        photos: List<String> = emptyList()
    ) {
        val existing = dao.getByWorkOrderId(workOrderId)
        val entity = MeasurementDraftEntity(
            id = existing?.id ?: 0,
            workOrderId = workOrderId,
            step = step,
            basicInfoJson = basicInfoJson ?: existing?.basicInfoJson,
            materialsJson = materialsJson ?: existing?.materialsJson,
            signaturePath = signaturePath ?: existing?.signaturePath,
            photosJson = if (photos.isNotEmpty()) listAdapter.toJson(photos) else existing?.photosJson,
            createdAt = existing?.createdAt ?: System.currentTimeMillis(),
            updatedAt = System.currentTimeMillis()
        )
        dao.insert(entity)
    }

    suspend fun loadDraft(workOrderId: Int): MeasurementDraftEntity? = dao.getByWorkOrderId(workOrderId)

    suspend fun deleteDraft(workOrderId: Int) {
        val draft = dao.getByWorkOrderId(workOrderId)
        draft?.let { dao.deleteById(it.id) }
    }

    fun getPendingDrafts(): Flow<List<MeasurementDraftEntity>> = dao.getAll()
}