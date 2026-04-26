package com.banghe.measure.domain.model

import com.squareup.moshi.Json
import com.squareup.moshi.JsonClass

@JsonClass(generateAdapter = true)
data class WorkOrder(
    @Json(name = "id") val id: Int,
    @Json(name = "work_order_no") val workOrderNo: String,
    @Json(name = "title") val title: String,
    @Json(name = "task_type") val taskType: String,
    @Json(name = "status") val status: String,
    @Json(name = "current_stage") val currentStage: String,
    @Json(name = "priority") val priority: String? = null,
    @Json(name = "deadline") val deadline: String? = null,
    // 申报 - 基本信息
    @Json(name = "client_name") val clientName: String? = null,
    @Json(name = "activity_name") val activityName: String? = null,
    @Json(name = "project_type") val projectType: String? = null,
    @Json(name = "province_code") val provinceCode: String? = null,
    @Json(name = "city_code") val cityCode: String? = null,
    @Json(name = "district_code") val districtCode: String? = null,
    @Json(name = "street_code") val streetCode: String? = null,
    @Json(name = "detail_address") val detailAddress: String? = null,
    @Json(name = "address") val address: String? = null,
    @Json(name = "contact_name") val contactName: String? = null,
    @Json(name = "contact_phone") val contactPhone: String? = null,
    @Json(name = "description") val description: String? = null,
    @Json(name = "photos") val photos: List<String>? = null,
    @Json(name = "attachments") val attachments: List<String>? = null,
    // 申报人
    @Json(name = "creator_name") val creatorName: String? = null,
    @Json(name = "creator_phone") val creatorPhone: String? = null,
    // 时间
    @Json(name = "created_at") val createdAt: String? = null,
    @Json(name = "received_at") val receivedAt: String? = null,
    // 指派
    @Json(name = "assignee_name") val assigneeName: String? = null,
    // 审批
    @Json(name = "approval") val approval: ApprovalInfo? = null,
    // 指派详情
    @Json(name = "assignment") val assignment: AssignmentInfo? = null,
    // 量尺
    @Json(name = "measurement") val measurement: MeasurementInfo? = null,
    @Json(name = "measurements") val measurements: List<MeasurementInfo>? = null,
    // 设计
    @Json(name = "designs") val designs: List<DesignInfo>? = null,
    // 施工
    @Json(name = "constructions") val constructions: List<ConstructionInfo>? = null,
    // 财务
    @Json(name = "finance_summary") val financeSummary: FinanceInfo? = null,
    // 流程记录
    @Json(name = "logs") val logs: List<WorkOrderLog>? = null,
    // 备注
    @Json(name = "remarks") val remarks: List<Map<String, Any?>>? = null
)

@JsonClass(generateAdapter = true)
data class ApprovalInfo(
    @Json(name = "id") val id: Int? = null,
    @Json(name = "approver_name") val approverName: String?,
    @Json(name = "status") val status: String?,
    @Json(name = "comment") val comment: String?,
    @Json(name = "approved_at") val approvedAt: String?
)

@JsonClass(generateAdapter = true)
data class AssignmentInfo(
    @Json(name = "id") val id: Int? = null,
    @Json(name = "assignee_name") val assigneeName: String?,
    @Json(name = "assigner_name") val assignerName: String?,
    @Json(name = "assigned_at") val assignedAt: String?,
    @Json(name = "deadline") val deadline: String?,
    @Json(name = "notes") val notes: String?
)

@JsonClass(generateAdapter = true)
data class MeasurementInfo(
    @Json(name = "id") val id: Int? = null,
    @Json(name = "measurer_name") val measurerName: String?,
    @Json(name = "materials") val materials: List<Map<String, Any?>>?,
    @Json(name = "measured_at") val measuredAt: String?,
    @Json(name = "status") val status: String? = null
)

@JsonClass(generateAdapter = true)
data class DesignInfo(
    @Json(name = "id") val id: Int? = null,
    @Json(name = "designer_name") val designerName: String?,
    @Json(name = "reviewer_name") val reviewerName: String?,
    @Json(name = "status") val status: String? = null
)

@JsonClass(generateAdapter = true)
data class ConstructionInfo(
    @Json(name = "id") val id: Int? = null,
    @Json(name = "constructor_name") val constructorName: String?
)

@JsonClass(generateAdapter = true)
data class FinanceInfo(
    @Json(name = "quote_amount") val quoteAmount: Double?,
    @Json(name = "budget_used") val budgetUsed: Double?,
    @Json(name = "status") val status: String? = null
)

@JsonClass(generateAdapter = true)
data class WorkOrderLog(
    @Json(name = "id") val id: Int? = null,
    @Json(name = "action") val action: String?,
    @Json(name = "from_stage") val fromStage: String?,
    @Json(name = "to_stage") val toStage: String?,
    @Json(name = "created_at") val createdAt: String?,
    @Json(name = "operator_name") val operatorName: String?
)

@JsonClass(generateAdapter = true)
data class WorkOrderStats(
    @Json(name = "total") val total: Int,
    @Json(name = "pending") val pending: Int,
    @Json(name = "in_progress") val inProgress: Int,
    @Json(name = "completed") val completed: Int,
    @Json(name = "overdue") val overdue: Int
)