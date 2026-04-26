package com.banghe.measure.data.assignment

import com.banghe.measure.core.network.ApiResponse
import retrofit2.http.*

interface AssignmentApi {
    @GET("/api/v1/users")
    suspend fun getFieldWorkers(@Query("role") role: String = "field_worker"): ApiResponse<List<FieldWorkerResponse>>

    @POST("/api/v1/assignments")
    suspend fun assign(@Body request: AssignmentRequest): ApiResponse<Unit>
}

data class FieldWorkerResponse(
    val id: Int,
    val name: String,
    val phone: String?
)

data class AssignmentRequest(
    val type: String,
    val work_order_id: Int,
    val assignee_id: Int,
    val notes: String?
)