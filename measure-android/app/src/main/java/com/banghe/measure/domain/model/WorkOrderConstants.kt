package com.banghe.measure.domain.model

/**
 * 工单状态常量
 */
object WorkOrderStatus {
    const val PENDING = "pending"
    const val IN_PROGRESS = "in_progress"
    const val COMPLETED = "completed"
    const val OVERDUE = "overdue"

    fun getLabel(status: String?): String = when (status) {
        PENDING -> "待处理"
        IN_PROGRESS -> "进行中"
        COMPLETED -> "已完成"
        OVERDUE -> "已逾期"
        else -> "未知"
    }
}

/**
 * 工单阶段常量 - 与后端 STAGE_MAP 保持一致
 */
object WorkOrderStage {
    const val DECLARATION = "declaration"
    const val APPROVAL = "approval"
    const val ASSIGNMENT = "assignment"
    const val MEASUREMENT = "measurement"
    const val DESIGN = "design"
    const val PRODUCTION = "production"
    const val CONSTRUCTION = "construction"
    const val FINANCE = "finance"
    const val ARCHIVE = "archive"
    const val AFTERSALE = "aftersale"

    /**
     * 获取阶段标签 - 基础映射
     */
    fun getLabel(stage: String?): String = when (stage) {
        DECLARATION -> "申报接收"
        APPROVAL -> "待审批"
        ASSIGNMENT -> "待派单"
        MEASUREMENT -> "测量中"
        DESIGN -> "设计中"
        PRODUCTION -> "生产中"
        CONSTRUCTION -> "施工中"
        FINANCE -> "费用管理"
        ARCHIVE -> "已归档"
        AFTERSALE -> "售后"
        else -> stage ?: "未知"
    }

    /**
     * 显示阶段标签 - 考虑量尺子状态
     * 与前端 displayStageLabel 逻辑一致
     */
    fun displayLabel(currentStage: String?, measurementStatus: String?, orderStatus: String?): String {
        if (currentStage == MEASUREMENT) {
            if (measurementStatus == "measured" || orderStatus == "measured") return "待审核"
            if (measurementStatus == "rejected") return "驳回重测"
        }
        return getLabel(currentStage)
    }
}