package com.banghe.measure.data.assignment

import com.banghe.measure.core.network.ApiClient
import com.banghe.measure.utils.Result
import com.banghe.measure.utils.safeCall

class AssignmentRepository {
    private val api: AssignmentApi by lazy { ApiClient.createApi(AssignmentApi::class.java) }

    suspend fun getFieldWorkers(): Result<List<FieldWorkerResponse>> = safeCall {
        val response = api.getFieldWorkers()
        if (response.isSuccess && response.data != null) response.data
        else throw Exception(response.message ?: "获取人员列表失败")
    }

    suspend fun assign(type: String, workOrderId: Int, assigneeId: Int, notes: String?): Result<Unit> = safeCall {
        val response = api.assign(AssignmentRequest(type, workOrderId, assigneeId, notes))
        if (response.isSuccess) Unit
        else throw Exception(response.message ?: "派工失败")
    }
}