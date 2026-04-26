package com.banghe.measure.data.task

import com.banghe.measure.core.network.ApiResponse
import com.banghe.measure.core.network.PaginatedResponse
import com.banghe.measure.domain.model.WorkOrder
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.Path
import retrofit2.http.Query

interface TaskApi {
    @GET("/api/v1/work-orders")
    suspend fun getTasks(
        @Query("status") status: String? = null,
        @Query("stage") stage: String? = null,
        @Query("keyword") keyword: String? = null,
        @Query("assigned_to") assignedTo: Int? = null,
        @Query("page") page: Int = 1,
        @Query("limit") limit: Int = 20
    ): PaginatedResponse<WorkOrderResponse>

    @GET("/api/v1/work-orders/{id}")
    suspend fun getTaskDetail(@Path("id") id: Int): ApiResponse<WorkOrderDetailResponse>

    @POST("/api/v1/work-orders")
    suspend fun createWorkOrder(@Body request: CreateWorkOrderRequest): ApiResponse<WorkOrderResponse>

    @GET("/api/v1/work-orders")
    suspend fun checkDuplicate(
        @Query("client_id") clientId: Int,
        @Query("address") address: String
    ): PaginatedResponse<WorkOrderResponse>

    @GET("/api/v1/work-orders/reviews/tasks")
    suspend fun getReviewTasks(): ApiResponse<List<ReviewTaskResponse>>
}

data class CreateWorkOrderRequest(
    val client_id: Int,
    val title: String,
    val address: String,
    val activity_type: String? = null,
    val ad_type: String? = null,
    val description: String? = null,
    val source: String = "field_created",
    val current_stage: String = "measurement"
)

data class WorkOrderResponse(
    val id: Int,
    val work_order_no: String,
    val title: String,
    val status: String,
    val current_stage: String,
    val priority: String?,
    val deadline: String?,
    val created_at: String?,
    val client: ClientInfo?,
    val WoDeclaration: DeclarationInfo?,
    val creator_name: String? = null,
    val assigned_at: String? = null,
    val measurement_status: String? = null
)

data class WorkOrderDetailResponse(
    val id: Int,
    val work_order_no: String,
    val title: String,
    val status: String,
    val current_stage: String,
    val priority: String?,
    val deadline: String?,
    val created_at: String?,
    val client: ClientInfo?,
    val client_name: String?,
    val activity_name: String?,
    val description: String?,
    val project_type: String?,
    val address: String?,
    val contact_name: String?,
    val contact_phone: String?,
    val photos: List<String>?,
    val attachments: List<String>?,
    val declaration: DeclarationDetailInfo?,
    val assignment: AssignmentInfo?,
    val approval: ApprovalInfo?,
    val measurements: List<MeasurementDetailInfo>?,
    val designs: List<DesignDetailInfo>?,
    val constructions: List<ConstructionDetailInfo>?,
    val finance_summary: FinanceSummaryInfo?,
    val logs: List<WorkOrderLogInfo>?,
    val remarks: List<Map<String, Any?>>?
)

data class ClientInfo(
    val id: Int,
    val name: String
)

data class DeclarationInfo(
    val project_type: String?,
    val full_address: String?,
    val contact_name: String?,
    val contact_phone: String?
)

data class DeclarationDetailInfo(
    val id: Int?,
    val project_type: String?,
    val full_address: String?,
    val contact_name: String?,
    val contact_phone: String?,
    val photos: List<String>?
)

data class AssignmentInfo(
    val id: Int?,
    val assignee_id: Int?,
    val assignee_name: String?,
    val assigner_name: String?,
    val assigned_at: String?,
    val deadline: String?,
    val notes: String?
)

data class ApprovalInfo(
    val id: Int?,
    val approver_name: String?,
    val status: String?,
    val comment: String?,
    val approved_at: String?
)

data class MeasurementDetailInfo(
    val id: Int?,
    val measurer_name: String?,
    val materials: List<Map<String, Any?>>?,
    val measured_at: String?,
    val status: String?
)

data class DesignDetailInfo(
    val id: Int?,
    val designer_name: String?,
    val reviewer_name: String?,
    val status: String?
)

data class ConstructionDetailInfo(
    val id: Int?,
    val constructor_name: String?
)

data class FinanceSummaryInfo(
    val quote_amount: Double?,
    val budget_used: Double?,
    val status: String?
)

data class WorkOrderLogInfo(
    val id: Int,
    val action: String?,
    val from_stage: String?,
    val to_stage: String?,
    val created_at: String?,
    val operator_name: String?
)

fun WorkOrderResponse.toDomain(): WorkOrder {
    return WorkOrder(
        id = id,
        workOrderNo = work_order_no,
        title = title,
        taskType = current_stage,
        status = status,
        currentStage = current_stage,
        priority = priority,
        deadline = deadline,
        createdAt = created_at,
        creatorName = creator_name,
        assignedAt = assigned_at,
        measurementStatus = measurement_status
    )
}

fun WorkOrderDetailResponse.toDomain(): WorkOrder {
    return WorkOrder(
        id = id,
        workOrderNo = work_order_no,
        title = title,
        taskType = current_stage,
        status = status,
        currentStage = current_stage,
        priority = priority,
        deadline = deadline,
        createdAt = created_at,
        // 申报基本信息
        clientName = client_name,
        activityName = activity_name,
        projectType = project_type,
        address = address,
        contactName = contact_name,
        contactPhone = contact_phone,
        description = description,
        photos = photos,
        attachments = attachments,
        // 审批
        approval = approval?.toDomainApproval(),
        // 指派
        assignment = assignment?.toDomainAssignment(),
        // 量尺
        measurements = measurements?.map { it.toDomainMeasurement() },
        // 设计
        designs = designs?.map { it.toDomainDesign() },
        // 施工
        constructions = constructions?.map { it.toDomainConstruction() },
        // 财务
        financeSummary = finance_summary?.toDomainFinance(),
        // 日志
        logs = logs?.map { it.toDomainLog() },
        // 备注
        remarks = remarks
    )
}

fun ApprovalInfo.toDomainApproval(): com.banghe.measure.domain.model.ApprovalInfo {
    return com.banghe.measure.domain.model.ApprovalInfo(
        approverName = approver_name,
        status = status,
        comment = comment,
        approvedAt = approved_at
    )
}

fun AssignmentInfo.toDomainAssignment(): com.banghe.measure.domain.model.AssignmentInfo {
    return com.banghe.measure.domain.model.AssignmentInfo(
        assigneeName = assignee_name,
        assignerName = assigner_name,
        assignedAt = assigned_at,
        deadline = deadline,
        notes = notes
    )
}

fun MeasurementDetailInfo.toDomainMeasurement(): com.banghe.measure.domain.model.MeasurementInfo {
    return com.banghe.measure.domain.model.MeasurementInfo(
        measurerName = measurer_name,
        materials = materials,
        measuredAt = measured_at,
        status = status
    )
}

fun DesignDetailInfo.toDomainDesign(): com.banghe.measure.domain.model.DesignInfo {
    return com.banghe.measure.domain.model.DesignInfo(
        designerName = designer_name,
        reviewerName = reviewer_name,
        status = status
    )
}

fun ConstructionDetailInfo.toDomainConstruction(): com.banghe.measure.domain.model.ConstructionInfo {
    return com.banghe.measure.domain.model.ConstructionInfo(
        constructorName = constructor_name
    )
}

fun FinanceSummaryInfo.toDomainFinance(): com.banghe.measure.domain.model.FinanceInfo {
    return com.banghe.measure.domain.model.FinanceInfo(
        quoteAmount = quote_amount,
        budgetUsed = budget_used,
        status = status
    )
}

fun WorkOrderLogInfo.toDomainLog(): com.banghe.measure.domain.model.WorkOrderLog {
    return com.banghe.measure.domain.model.WorkOrderLog(
        action = action,
        fromStage = from_stage,
        toStage = to_stage,
        createdAt = created_at,
        operatorName = operator_name
    )
}

data class ReviewTaskResponse(
    val id: Int,
    val work_order_id: Int,
    val work_order_no: String?,
    val review_type: String?,
    val title: String?,
    val client_name: String?,
    val submitter_name: String?,
    val submitted_at: String?,
    val address: String?
)