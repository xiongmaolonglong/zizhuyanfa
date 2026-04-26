package com.banghe.measure.presentation.components

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

/**
 * 横向阶段进度条
 */
@Composable
fun StageProgressBar(
    stages: List<StageItem>,
    currentStageKey: String?,
    modifier: Modifier = Modifier
) {
    val currentIdx = stages.indexOfFirst { it.key == currentStageKey }.coerceAtLeast(0)

    LazyRow(
        modifier = modifier
            .fillMaxWidth()
            .padding(vertical = 8.dp),
        horizontalArrangement = Arrangement.spacedBy(0.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        itemsIndexed(stages) { index, stage ->
            val state = when {
                index < currentIdx -> StageState.COMPLETED
                index == currentIdx -> StageState.CURRENT
                else -> StageState.PENDING
            }

            StageNode(
                stage = stage,
                state = state,
                isLast = index == stages.lastIndex
            )
        }
    }
}

@Composable
private fun StageNode(
    stage: StageItem,
    state: StageState,
    isLast: Boolean
) {
    val (dotColor, textColor, bgColor) = when (state) {
        StageState.COMPLETED -> Triple(
            MaterialTheme.colorScheme.primary,
            MaterialTheme.colorScheme.primary,
            MaterialTheme.colorScheme.primary.copy(alpha = 0.1f)
        )
        StageState.CURRENT -> Triple(
            MaterialTheme.colorScheme.primary,
            MaterialTheme.colorScheme.primary,
            MaterialTheme.colorScheme.primaryContainer
        )
        StageState.PENDING -> Triple(
            MaterialTheme.colorScheme.outlineVariant,
            MaterialTheme.colorScheme.outline,
            Color.Transparent
        )
    }

    Row(
        verticalAlignment = Alignment.CenterVertically,
        modifier = Modifier.padding(horizontal = 2.dp)
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            modifier = Modifier.width(56.dp)
        ) {
            // 圆点
            Box(
                modifier = Modifier
                    .size(24.dp)
                    .clip(CircleShape)
                    .background(bgColor),
                contentAlignment = Alignment.Center
            ) {
                Box(
                    modifier = Modifier
                        .size(12.dp)
                        .clip(CircleShape)
                        .background(dotColor)
                )
            }

            Spacer(modifier = Modifier.height(4.dp))

            // 标签
            Text(
                text = stage.label,
                fontSize = 11.sp,
                fontWeight = if (state == StageState.CURRENT) FontWeight.Bold else FontWeight.Normal,
                color = textColor,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis,
                textAlign = TextAlign.Center
            )
        }

        // 连接线（最后一个不显示）
        if (!isLast) {
            Box(
                modifier = Modifier
                    .width(8.dp)
                    .height(2.dp)
                    .background(
                        if (state == StageState.COMPLETED) dotColor
                        else MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.5f)
                    )
            )
        }
    }
}

data class StageItem(
    val key: String,
    val label: String
)

enum class StageState {
    COMPLETED,
    CURRENT,
    PENDING
}
