package com.banghe.measure.data.construction

import com.banghe.measure.core.network.ApiResponse
import com.banghe.measure.core.network.PaginatedResponse
import com.banghe.measure.domain.model.MaterialInfo
import retrofit2.http.*

interface ConstructionApi {
    @GET("/api/v1/construction/tasks/{workOrderId}")
    suspend fun getTaskDetail(@Path("workOrderId") id: Int): ApiResponse<ConstructionTaskResponse>

    @POST("/api/v1/construction/{workOrderId}")
    suspend fun submitConstruction(
        @Path("workOrderId") id: Int,
        @Body request: ConstructionSubmitRequest
    ): ApiResponse<Unit>

    @POST("/api/v1/construction/{workOrderId}/exception")
    suspend fun reportException(
        @Path("workOrderId") id: Int,
        @Body request: ExceptionReportRequest
    ): ApiResponse<Unit>
}

data class ConstructionTaskResponse(
    val id: Int?,
    val work_order_id: Int?,
    val work_order_no: String?,
    val title: String?,
    val status: String?,
    val address: String?,
    val client_name: String?,
    val design_images: List<String>?,
    val material_list: List<MaterialInfoResponse>?,
    val before_photos: List<String>?,
    val after_photos: List<String>?,
    val notes: String?,
    val constructor_name: String?
)

data class MaterialInfoResponse(
    val name: String?,
    val quantity: Int?,
    val dimensions: String?
)

data class ConstructionSubmitRequest(
    val before_photos: List<String> = emptyList(),
    val after_photos: List<String> = emptyList(),
    val notes: String? = null,
    val signature: String
)

data class ExceptionReportRequest(
    val reason: String,
    val photos: List<String> = emptyList(),
    val notes: String? = null
)

fun MaterialInfoResponse.toDomain() = MaterialInfo(
    name = name ?: "",
    quantity = quantity ?: 1,
    dimensions = dimensions
)