package com.banghe.measure.core.theme

import androidx.compose.ui.graphics.Color

// Primary palette
val Primary = Color(0xFF2563EB)
val PrimaryDark = Color(0xFF1D4ED8)
val PrimaryLight = Color(0xFF60A5FA)

// Surface
val Surface = Color(0xFFF8FAFC)
val SurfaceVariant = Color(0xFFFFFFFF)

// Text
val TextPrimary = Color(0xFF0F172A)
val TextSecondary = Color(0xFF64748B)
val TextMuted = Color(0xFF94A3B8)

// Status colors
val Success = Color(0xFF16A34A)
val Warning = Color(0xFFD97706)
val Error = Color(0xFFDC2626)
val Info = Color(0xFF0891B2)

// Stage colors
val StageDeclaration = Color(0xFF5C6BC0)
val StageApproval = Color(0xFFFF9800)
val StageAssignment = Color(0xFF78909C)
val StageMeasurement = Color(0xFFFF9800)
val StageDesign = Color(0xFF5C6BC0)
val StageProduction = Color(0xFF4CAF50)
val StageConstruction = Color(0xFF4CAF50)
val StageFinance = Color(0xFF5C6BC0)
val StageArchive = Color(0xFF78909C)
val StageAftersale = Color(0xFF5C6BC0)

// Background
val Background = Color(0xFFF1F5F9)
val CardBackground = Color(0xFFFFFFFF)

// Border
val Border = Color(0xFFE2E8F0)

// Dashboard 统计卡片渐变色
val StatPendingStart = Color(0xFFF59E0B)
val StatPendingEnd = Color(0xFFFBBF24)
val StatInProgressStart = Color(0xFF3B82F6)
val StatInProgressEnd = Color(0xFF60A5FA)
val StatCompletedStart = Color(0xFF22C55E)
val StatCompletedEnd = Color(0xFF4ADE80)
val StatOverdueStart = Color(0xFFEF4444)
val StatOverdueEnd = Color(0xFFF87171)

// 欢迎卡片渐变色
val WelcomeGradientStart = Color(0xFF1E3A5F)
val WelcomeGradientEnd = Color(0xFF2563EB)

// 提醒卡片背景
val ReminderBackground = Color(0xFFFEF3C7)
val ReminderText = Color(0xFF92400E)

// 骨架屏颜色
val SkeletonColor = Color(0xFFE2E8F0)

// Dark theme variants
val DarkPrimary = Color(0xFF60A5FA)
val DarkSurface = Color(0xFF1E293B)
val DarkSurfaceVariant = Color(0xFF0F172A)
val DarkTextPrimary = Color(0xFFF1F5F9)
val DarkTextSecondary = Color(0xFF94A3B8)
val DarkBackground = Color(0xFF0F172A)
val DarkCardBackground = Color(0xFF1E293B)
val DarkBorder = Color(0xFF334155)

/**
 * 根据环节获取对应颜色
 */
fun getStageColor(stage: String?): Color {
    return when (stage) {
        "declaration" -> StageDeclaration
        "approval" -> StageApproval
        "assignment" -> StageAssignment
        "measurement" -> StageMeasurement
        "design" -> StageDesign
        "production" -> StageProduction
        "construction" -> StageConstruction
        "finance" -> StageFinance
        "archive" -> StageArchive
        "aftersale" -> StageAftersale
        else -> TextSecondary
    }
}

/**
 * 根据状态获取对应颜色
 */
fun getStatusColor(status: String?): Color {
    return when (status) {
        "pending" -> Warning
        "in_progress" -> Primary
        "completed" -> Success
        "overdue" -> Error
        "cancelled" -> TextMuted
        "submitted" -> Primary
        "assigned" -> Success
        else -> TextSecondary
    }
}