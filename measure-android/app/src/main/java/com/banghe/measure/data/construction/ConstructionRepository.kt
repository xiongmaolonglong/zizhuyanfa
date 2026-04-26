package com.banghe.measure.data.construction

import com.banghe.measure.core.network.ApiClient
import com.banghe.measure.domain.model.ConstructionDraft
import com.banghe.measure.domain.model.MaterialInfo
import com.banghe.measure.utils.Result
import com.banghe.measure.utils.safeCall

class ConstructionRepository {
    private val api: ConstructionApi by lazy { ApiClient.createApi(ConstructionApi::class.java) }

    suspend fun getTaskDetail(workOrderId: Int): Result<ConstructionTaskData> = safeCall {
        val response = api.getTaskDetail(workOrderId)
        if (response.isSuccess && response.data != null) {
            ConstructionTaskData(
                address = response.data.address,
                designImages = response.data.design_images ?: emptyList(),
                materialList = response.data.material_list?.map { it.toDomain() } ?: emptyList(),
                beforePhotos = response.data.before_photos ?: emptyList(),
                afterPhotos = response.data.after_photos ?: emptyList()
            )
        } else {
            throw Exception(response.message ?: "获取施工任务失败")
        }
    }

    suspend fun submitConstruction(
        workOrderId: Int,
        draft: ConstructionDraft
    ): Result<Unit> = safeCall {
        val request = ConstructionSubmitRequest(
            before_photos = draft.beforePhotos,
            after_photos = draft.afterPhotos,
            notes = draft.notes,
            signature = draft.signaturePath ?: throw Exception("请签名后再提交")
        )
        val response = api.submitConstruction(workOrderId, request)
        if (response.isSuccess) Unit
        else throw Exception(response.message ?: "提交施工记录失败")
    }

    suspend fun reportException(
        workOrderId: Int,
        reason: String,
        photos: List<String>,
        notes: String? = null
    ): Result<Unit> = safeCall {
        val request = ExceptionReportRequest(reason = reason, photos = photos, notes = notes)
        val response = api.reportException(workOrderId, request)
        if (response.isSuccess) Unit
        else throw Exception(response.message ?: "上报异常失败")
    }
}

data class ConstructionTaskData(
    val address: String? = null,
    val designImages: List<String> = emptyList(),
    val materialList: List<MaterialInfo> = emptyList(),
    val beforePhotos: List<String> = emptyList(),
    val afterPhotos: List<String> = emptyList()
)