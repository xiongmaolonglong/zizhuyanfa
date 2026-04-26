package com.banghe.measure.presentation.dashboard

import androidx.compose.animation.core.*
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsPressedAsState
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.hapticfeedback.HapticFeedbackType
import androidx.compose.ui.platform.LocalHapticFeedback
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.banghe.measure.core.theme.*
import com.banghe.measure.domain.model.WorkOrderStats
import com.banghe.measure.domain.model.WorkOrderStatus

data class StatBento(
    val label: String,
    val value: Int,
    val colorStart: Color,
    val colorEnd: Color,
    val status: String? = null
)

@Composable
fun StatsBentoGrid(stats: WorkOrderStats, onStatClick: (String?) -> Unit = {}) {
    val items = listOf(
        StatBento("待处理", stats.pending, StatPendingStart, StatPendingEnd, WorkOrderStatus.PENDING),
        StatBento("进行中", stats.inProgress, StatInProgressStart, StatInProgressEnd, WorkOrderStatus.IN_PROGRESS),
        StatBento("已完成", stats.completed, StatCompletedStart, StatCompletedEnd, WorkOrderStatus.COMPLETED),
        StatBento("已逾期", stats.overdue, StatOverdueStart, StatOverdueEnd, WorkOrderStatus.OVERDUE)
    )

    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 8.dp)
    ) {
        Row(
            modifier = Modifier.padding(horizontal = 16.dp),
            horizontalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            items.take(2).forEach { StatBentoCard(it, Modifier.weight(1f), onStatClick) }
        }
        Spacer(modifier = Modifier.height(10.dp))
        Row(
            modifier = Modifier.padding(horizontal = 16.dp),
            horizontalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            items.drop(2).forEach { StatBentoCard(it, Modifier.weight(1f), onStatClick) }
        }

        Spacer(modifier = Modifier.height(12.dp))
        StatsOverviewCard(stats, onStatClick)
    }
}

@Composable
private fun StatsOverviewCard(stats: WorkOrderStats, onStatClick: (String?) -> Unit) {
    val animatedTotal by animateIntAsState(
        targetValue = stats.total,
        animationSpec = tween(durationMillis = 800, easing = FastOutSlowInEasing),
        label = "total_animation"
    )
    val completionRate = if (stats.total > 0) stats.completed * 100 / stats.total else 0
    val animatedRate by animateIntAsState(
        targetValue = completionRate,
        animationSpec = tween(durationMillis = 800, easing = FastOutSlowInEasing),
        label = "rate_animation"
    )

    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp)
            .clickable { onStatClick(null) },
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = Color.Transparent)
    ) {
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .background(
                    Brush.linearGradient(
                        colors = listOf(WelcomeGradientStart, WelcomeGradientEnd)
                    ),
                    RoundedCornerShape(16.dp)
                )
                .padding(horizontal = 20.dp, vertical = 16.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Column {
                    Text(text = "工单总数", fontSize = 13.sp, color = Color.White.copy(alpha = 0.7f))
                    Text(
                        text = animatedTotal.toString(),
                        fontSize = 32.sp,
                        fontWeight = FontWeight.Bold,
                        color = Color.White
                    )
                }
                Column(horizontalAlignment = androidx.compose.ui.Alignment.End) {
                    Text(text = "完成率", fontSize = 13.sp, color = Color.White.copy(alpha = 0.7f))
                    Text(
                        text = "${animatedRate}%",
                        fontSize = 32.sp,
                        fontWeight = FontWeight.Bold,
                        color = Color.White
                    )
                }
            }
        }
    }
}

@Composable
fun StatBentoCard(item: StatBento, modifier: Modifier = Modifier, onStatClick: (String?) -> Unit = {}) {
    val animatedValue by animateIntAsState(
        targetValue = item.value,
        animationSpec = tween(durationMillis = 600, easing = FastOutSlowInEasing),
        label = "stat_animation"
    )
    val haptic = LocalHapticFeedback.current
    val emoji = remember(item.label) {
        when (item.label) {
            "待处理" -> "⏰"
            "进行中" -> "🔧"
            "已完成" -> "✅"
            "已逾期" -> "⚠️"
            else -> "📋"
        }
    }

    val interactionSource = remember { MutableInteractionSource() }
    val isPressed by interactionSource.collectIsPressedAsState()
    val scale by animateFloatAsState(
        targetValue = if (isPressed) 0.95f else 1f,
        animationSpec = tween(100),
        label = "scale_animation"
    )

    Card(
        modifier = modifier
            .scale(scale)
            .clickable(
                interactionSource = interactionSource,
                indication = null,
                onClick = {
                    haptic.performHapticFeedback(HapticFeedbackType.TextHandleMove)
                    onStatClick(item.status)
                }
            )
            .semantics { contentDescription = "${item.label}: ${item.value}个" },
        shape = RoundedCornerShape(18.dp),
        colors = CardDefaults.cardColors(containerColor = Color.Transparent)
    ) {
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .background(
                    Brush.linearGradient(colors = listOf(item.colorStart, item.colorEnd)),
                    RoundedCornerShape(18.dp)
                )
                .padding(18.dp)
        ) {
            Column {
                Text(text = emoji, fontSize = 22.sp)
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    text = animatedValue.toString(),
                    fontSize = 32.sp,
                    fontWeight = FontWeight.Bold,
                    color = Color.White
                )
                Text(
                    text = item.label,
                    fontSize = 13.sp,
                    color = Color.White.copy(alpha = 0.85f),
                    modifier = Modifier.padding(top = 3.dp)
                )
            }
        }
    }
}