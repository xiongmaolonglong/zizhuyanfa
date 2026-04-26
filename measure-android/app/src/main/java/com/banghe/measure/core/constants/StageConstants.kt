package com.banghe.measure.core.constants

/**
 * 环节相关常量
 */
object StageConstants {
    // 环节顺序
    val STAGE_ORDER = listOf(
        "declaration", "approval", "assignment", "measurement",
        "design", "production", "construction", "finance", "archive", "aftersale"
    )

    // 环节中文标签
    val STAGE_LABELS = mapOf(
        "declaration" to "申报接收",
        "approval" to "待审批",
        "assignment" to "待派单",
        "measurement" to "测量中",
        "design" to "设计中",
        "production" to "生产中",
        "construction" to "施工中",
        "finance" to "费用管理",
        "archive" to "已归档",
        "aftersale" to "售后"
    )

    // 状态中文标签
    val STATUS_LABELS = mapOf(
        "pending" to "待处理",
        "in_progress" to "进行中",
        "completed" to "已完成",
        "overdue" to "已逾期",
        "cancelled" to "已取消",
        "submitted" to "已提交",
        "assigned" to "已分配"
    )

    fun getStageLabel(stage: String?): String {
        return STAGE_LABELS[stage] ?: stage ?: "未知"
    }

    fun getStatusLabel(status: String?): String {
        return STATUS_LABELS[status] ?: status ?: "未知"
    }
}