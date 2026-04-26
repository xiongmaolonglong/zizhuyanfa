package com.banghe.measure.presentation.dashboard

import androidx.compose.animation.core.*
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import com.banghe.measure.core.theme.SkeletonColor

@Composable
fun StatsSkeletonGrid() {
    val infiniteTransition = rememberInfiniteTransition(label = "shimmer")
    val alpha by infiniteTransition.animateFloat(
        initialValue = 0.3f,
        targetValue = 0.9f,
        animationSpec = infiniteRepeatable(
            animation = tween(800, easing = LinearEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "shimmer_alpha"
    )

    Column(modifier = Modifier.padding(horizontal = 16.dp)) {
        Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
            repeat(2) {
                SkeletonBox(Modifier.weight(1f), 100.dp, alpha)
            }
        }
        Spacer(modifier = Modifier.height(10.dp))
        Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
            repeat(2) {
                SkeletonBox(Modifier.weight(1f), 100.dp, alpha)
            }
        }
        Spacer(modifier = Modifier.height(12.dp))
        SkeletonBox(Modifier.fillMaxWidth(), 70.dp, alpha)
    }
}

@Composable
private fun SkeletonBox(modifier: Modifier, height: androidx.compose.ui.unit.Dp, alpha: Float) {
    Box(
        modifier = modifier
            .height(height)
            .background(SkeletonColor.copy(alpha = alpha), RoundedCornerShape(16.dp))
    )
}