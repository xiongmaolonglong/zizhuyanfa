package com.banghe.measure.data.measurement

import com.banghe.measure.core.network.ApiClient
import com.banghe.measure.utils.Result
import com.banghe.measure.utils.safeCall

class MeasurementRepository {
    private val api: MeasurementApi by lazy { ApiClient.createApi(MeasurementApi::class.java) }

    suspend fun getMeasurementTasks(): Result<List<MeasurementTaskResponse>> = safeCall {
        val response = api.getMeasurementTasks()
        if (response.isSuccess && response.data != null) {
            response.data
        } else {
            throw Exception(response.message ?: "获取任务失败")
        }
    }

    suspend fun getMeasurementTask(workOrderId: Int): Result<MeasurementTaskResponse> = safeCall {
        val response = api.getMeasurementTask(workOrderId)
        if (response.isSuccess && response.data != null) {
            response.data
        } else {
            throw Exception(response.message ?: "获取任务详情失败")
        }
    }

    suspend fun submitMeasurement(
        workOrderId: Int,
        basicInfo: BasicInfoRequest,
        materials: List<MaterialSubmitRequest>?,
        signaturePath: String?
    ): Result<MeasurementResponse> = safeCall {
        val request = MeasurementSubmitRequest(
            basic_info = basicInfo,
            materials = materials,
            signature_path = signaturePath
        )
        val response = api.submitMeasurement(workOrderId, request)
        if (response.isSuccess && response.data != null) {
            response.data
        } else {
            throw Exception(response.message ?: "提交失败")
        }
    }

    suspend fun updateMeasurement(
        workOrderId: Int,
        basicInfo: BasicInfoRequest,
        materials: List<MaterialSubmitRequest>?,
        signaturePath: String?
    ): Result<MeasurementResponse> = safeCall {
        val request = MeasurementSubmitRequest(
            basic_info = basicInfo,
            materials = materials,
            signature_path = signaturePath
        )
        val response = api.updateMeasurement(workOrderId, request)
        if (response.isSuccess && response.data != null) {
            response.data
        } else {
            throw Exception(response.message ?: "更新失败")
        }
    }

    suspend fun getMeasurementHistory(workOrderId: Int): Result<List<WorkOrderHistoryResponse>> = safeCall {
        val response = api.getMeasurementHistory(workOrderId)
        if (response.isSuccess && response.data != null) {
            response.data
        } else {
            throw Exception(response.message ?: "获取历史失败")
        }
    }

    suspend fun approveMeasurement(workOrderId: Int, comment: String?): Result<Unit> = safeCall {
        val request = ReviewRequest(action = "approve", comment = comment)
        val response = api.reviewMeasurement(workOrderId, request)
        if (response.isSuccess) Unit
        else throw Exception(response.message ?: "审核失败")
    }

    suspend fun rejectMeasurement(workOrderId: Int, reason: String): Result<Unit> = safeCall {
        val request = ReviewRequest(action = "reject", reject_reason = reason)
        val response = api.reviewMeasurement(workOrderId, request)
        if (response.isSuccess) Unit
        else throw Exception(response.message ?: "驳回失败")
    }
}
