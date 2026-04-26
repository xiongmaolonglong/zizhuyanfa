package com.banghe.measure.data.measurement

import com.banghe.measure.core.network.ApiResponse
import com.banghe.measure.data.task.DeclarationInfo
import retrofit2.http.*

interface MeasurementApi {
    @GET("/api/v1/measurements/tasks")
    suspend fun getMeasurementTasks(): ApiResponse<List<MeasurementTaskResponse>>

    @GET("/api/v1/measurements/tasks/{workOrderId}")
    suspend fun getMeasurementTask(@Path("workOrderId") workOrderId: Int): ApiResponse<MeasurementTaskResponse>

    @POST("/api/v1/measurements/{workOrderId}")
    suspend fun submitMeasurement(
        @Path("workOrderId") workOrderId: Int,
        @Body request: MeasurementSubmitRequest
    ): ApiResponse<MeasurementResponse>

    @PUT("/api/v1/measurements/{workOrderId}")
    suspend fun updateMeasurement(
        @Path("workOrderId") workOrderId: Int,
        @Body request: MeasurementSubmitRequest
    ): ApiResponse<MeasurementResponse>

    @GET("/api/v1/measurements/{workOrderId}/history")
    suspend fun getMeasurementHistory(@Path("workOrderId") workOrderId: Int): ApiResponse<List<WorkOrderHistoryResponse>>

    @POST("/api/v1/measurements/{workOrderId}/review")
    suspend fun reviewMeasurement(
        @Path("workOrderId") workOrderId: Int,
        @Body request: ReviewRequest
    ): ApiResponse<Unit>
}

data class MeasurementTaskResponse(
    val id: Int,
    val work_order_id: Int,
    val work_order_no: String?,
    val title: String?,
    val status: String?,
    val current_stage: String?,
    val deadline: String?,
    val WoDeclaration: DeclarationInfo?,
    val measurements: List<MeasurementResponse>?
)

data class MeasurementResponse(
    val id: Int,
    val work_order_id: Int,
    val measurer_id: Int?,
    val basic_info: BasicInfo?,
    val materials: List<MaterialDataResponse>?,
    val signature_path: String?,
    val status: String?,
    val measured_at: String?,
    val photos: List<String>?,
    val face_name: String?,
    val width: Double?,
    val height: Double?,
    val area: Double?,
    val depth: Double?,
    val notes: String?
)

data class BasicInfo(
    val contact_name: String?,
    val contact_phone: String?,
    val address: String?,
    val project_type: String?,
    val notes: String?
)

data class MaterialDataResponse(
    val type: String?,
    val faces: List<FaceDataResponse>?,
    val total_area: Double?,
    val notes: String?
)

data class FaceDataResponse(
    val name: String?,
    val width: Double?,
    val height: Double?,
    val area: Double?,
    val depth: Double?,
    val photos: List<String>?,
    val notes: String?
)

data class WorkOrderHistoryResponse(
    val id: Int,
    val work_order_no: String?,
    val title: String?,
    val status: String?,
    val created_at: String?
)

data class MeasurementSubmitRequest(
    val basic_info: BasicInfoRequest,
    val materials: List<MaterialSubmitRequest>?,
    val signature_path: String?
)

data class BasicInfoRequest(
    val contact_name: String?,
    val contact_phone: String?,
    val address: String?,
    val project_type: String?,
    val notes: String?
)

data class MaterialSubmitRequest(
    val type: String?,
    val faces: List<FaceSubmitRequest>?,
    val notes: String?
)

data class FaceSubmitRequest(
    val name: String?,
    val width: Double?,
    val height: Double?,
    val area: Double?,
    val depth: Double?,
    val photos: List<String>?,
    val notes: String?
)

data class ReviewRequest(
    val action: String, // "approve" or "reject"
    val comment: String? = null,
    val reject_reason: String? = null
)