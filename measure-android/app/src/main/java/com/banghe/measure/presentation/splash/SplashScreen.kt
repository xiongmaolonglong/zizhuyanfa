package com.banghe.measure.presentation.splash

import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.LinearEasing
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.rotate
import androidx.compose.ui.draw.scale
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.banghe.measure.R
import kotlinx.coroutines.delay

@Composable
fun SplashScreen(
    onNavigateToLogin: () -> Unit,
    onNavigateToHome: () -> Unit,
    isLoggedIn: Boolean
) {
    LaunchedEffect(Unit) {
        delay(800)
        if (isLoggedIn) {
            onNavigateToHome()
        } else {
            onNavigateToLogin()
        }
    }

    // 动画状态
    val scaleAnim = remember { Animatable(0.6f) }
    val alphaAnim = remember { Animatable(0f) }
    val textOffsetY = remember { Animatable(20f) }
    val textAlpha = remember { Animatable(0f) }
    val progressAlpha = remember { Animatable(0f) }

    // Logo 缩放淡入
    LaunchedEffect(Unit) {
        scaleAnim.animateTo(
            targetValue = 1f,
            animationSpec = tween(400, easing = LinearEasing)
        )
        alphaAnim.animateTo(
            targetValue = 1f,
            animationSpec = tween(400)
        )
    }

    // 文字上移淡入
    LaunchedEffect(Unit) {
        delay(200)
        textAlpha.animateTo(1f, animationSpec = tween(400))
        textOffsetY.animateTo(0f, animationSpec = tween(400))
    }

    // 进度条出现
    LaunchedEffect(Unit) {
        delay(500)
        progressAlpha.animateTo(1f, animationSpec = tween(300))
    }

    val bgGradient = Brush.verticalGradient(
        colors = listOf(
            Color(0xFF1E3A5F),
            Color(0xFF2563EB),
            Color(0xFF60A5FA)
        )
    )

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(bgGradient),
        contentAlignment = Alignment.Center
    ) {
        // 装饰矩形
        Box(
            modifier = Modifier
                .offset(x = (-40).dp, y = 40.dp)
                .size(70.dp, 95.dp)
                .rotate(-5f)
                .border(1.5.dp, Color.White.copy(alpha = 0.1f))
        )
        Box(
            modifier = Modifier
                .offset(x = 30.dp, y = (-60).dp)
                .size(50.dp, 70.dp)
                .rotate(-8f)
                .border(1.5.dp, Color.White.copy(alpha = 0.07f))
        )
        Box(
            modifier = Modifier
                .offset(x = 50.dp, y = 100.dp)
                .size(35.dp, 50.dp)
                .rotate(-15f)
                .border(1.5.dp, Color.White.copy(alpha = 0.05f))
        )

        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            modifier = Modifier.graphicsLayer {
                translationY = textOffsetY.value
                alpha = textAlpha.value
            }
        ) {
            // Logo
            Image(
                painter = painterResource(R.drawable.logo_small),
                contentDescription = "Logo",
                modifier = Modifier
                    .size(72.dp)
                    .clip(CircleShape)
                    .scale(scaleAnim.value)
                    .graphicsLayer { alpha = alphaAnim.value }
                    .border(2.dp, Color.White.copy(alpha = 0.2f), CircleShape)
            )

            Spacer(modifier = Modifier.height(24.dp))

            // 品牌名
            Text(
                text = "邦和广告",
                color = Color.White,
                fontSize = 22.sp,
                fontWeight = FontWeight.Bold,
                letterSpacing = 2.sp
            )
            Text(
                text = "广告工程全流程管理",
                color = Color.White.copy(alpha = 0.6f),
                fontSize = 13.sp,
                modifier = Modifier.padding(top = 6.dp)
            )

            Spacer(modifier = Modifier.height(32.dp))

            // 加载指示器
            CircularProgressIndicator(
                color = Color.White,
                strokeWidth = 2.dp,
                modifier = Modifier
                    .size(24.dp)
                    .graphicsLayer { alpha = progressAlpha.value }
            )
        }
    }
}
