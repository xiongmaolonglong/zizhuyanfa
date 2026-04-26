package com.banghe.measure.presentation.measurement

import android.graphics.Bitmap
import android.graphics.Canvas as AndroidCanvas
import android.graphics.Color
import android.graphics.Paint
import android.graphics.Path as AndroidPath
import androidx.compose.foundation.background
import androidx.compose.foundation.gestures.detectDragGestures
import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import java.io.File
import java.io.FileOutputStream

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun StepSignature(
    signaturePath: String?,
    onSignatureSaved: (String) -> Unit,
    onNext: () -> Unit,
    onPrev: () -> Unit
) {
    var paths by remember { mutableStateOf<List<List<Offset>>>(emptyList()) }
    var currentPath by remember { mutableStateOf<List<Offset>>(emptyList()) }
    var hasSignature by remember { mutableStateOf(signaturePath != null) }
    var canvasSize by remember { mutableStateOf<androidx.compose.ui.geometry.Size>(androidx.compose.ui.geometry.Size.Zero) }
    val context = LocalContext.current

    Column(
        modifier = Modifier.fillMaxSize()
    ) {
        Text(
            text = "客户签名",
            style = MaterialTheme.typography.titleMedium,
            fontWeight = FontWeight.SemiBold,
            modifier = Modifier.padding(16.dp)
        )

        Text(
            text = "请在下方空白区域签名",
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            modifier = Modifier.padding(horizontal = 16.dp)
        )

        Spacer(modifier = Modifier.height(16.dp))

        // 签名画布
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .weight(1f)
                .padding(horizontal = 16.dp)
                .background(androidx.compose.ui.graphics.Color.White)
                .drawBehind {
                    canvasSize = size
                    // 绘制边框
                    drawRect(
                        color = androidx.compose.ui.graphics.Color.LightGray,
                        style = Stroke(width = 1f)
                    )
                    // 绘制所有已完成的路径
                    paths.forEach { pathPoints ->
                        if (pathPoints.size > 1) {
                            val path = Path()
                            path.moveTo(pathPoints.first().x, pathPoints.first().y)
                            for (i in 1 until pathPoints.size) {
                                path.lineTo(pathPoints[i].x, pathPoints[i].y)
                            }
                            drawPath(
                                path = path,
                                color = androidx.compose.ui.graphics.Color.Black,
                                style = Stroke(width = 4f, cap = StrokeCap.Round)
                            )
                        }
                    }
                    // 绘制当前路径
                    if (currentPath.size > 1) {
                        val path = Path()
                        path.moveTo(currentPath.first().x, currentPath.first().y)
                        for (i in 1 until currentPath.size) {
                            path.lineTo(currentPath[i].x, currentPath[i].y)
                        }
                        drawPath(
                            path = path,
                            color = androidx.compose.ui.graphics.Color.Black,
                            style = Stroke(width = 4f, cap = StrokeCap.Round)
                        )
                    }
                }
                .pointerInput(Unit) {
                    detectDragGestures(
                        onDragStart = { offset ->
                            currentPath = listOf(offset)
                        },
                        onDrag = { change, _ ->
                            change.consume()
                            currentPath = currentPath + change.position
                        },
                        onDragEnd = {
                            if (currentPath.isNotEmpty()) {
                                paths = paths + listOf(currentPath)
                                currentPath = emptyList()
                                hasSignature = true
                            }
                        }
                    )
                },
            contentAlignment = Alignment.Center
        ) {
            if (paths.isEmpty() && currentPath.isEmpty()) {
                Text(
                    text = "在此处签名",
                    color = androidx.compose.ui.graphics.Color.LightGray
                )
            }
        }

        // 操作按钮
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            OutlinedButton(
                onClick = {
                    paths = emptyList()
                    currentPath = emptyList()
                    hasSignature = false
                },
                enabled = hasSignature
            ) {
                Icon(Icons.Default.Refresh, contentDescription = null)
                Spacer(modifier = Modifier.width(4.dp))
                Text("清除")
            }
        }

        // 底部按钮
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            OutlinedButton(
                onClick = onPrev,
                modifier = Modifier.weight(1f).height(56.dp)
            ) {
                Icon(Icons.Default.ArrowBack, contentDescription = null)
                Spacer(modifier = Modifier.width(8.dp))
                Text("上一步")
            }
            Button(
                onClick = {
                    // 保存签名图片
                    if (hasSignature && canvasSize.width > 0 && canvasSize.height > 0) {
                        val savedPath = saveSignatureToFile(
                            paths = paths,
                            width = canvasSize.width.toInt(),
                            height = canvasSize.height.toInt(),
                            cacheDir = context.cacheDir
                        )
                        savedPath?.let { onSignatureSaved(it) }
                    }
                    onNext()
                },
                modifier = Modifier.weight(1f).height(56.dp),
                enabled = hasSignature
            ) {
                Text("下一步")
                Spacer(modifier = Modifier.width(8.dp))
                Icon(Icons.Default.ArrowForward, contentDescription = null)
            }
        }
    }
}

private fun saveSignatureToFile(
    paths: List<List<Offset>>,
    width: Int,
    height: Int,
    cacheDir: File
): String? {
    if (width <= 0 || height <= 0) return null

    val bitmap = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888)
    val canvas = AndroidCanvas(bitmap)
    canvas.drawColor(Color.WHITE)

    val paint = Paint().apply {
        color = Color.BLACK
        strokeWidth = 4f
        style = Paint.Style.STROKE
        strokeCap = Paint.Cap.ROUND
        strokeJoin = Paint.Join.ROUND
        isAntiAlias = true
    }

    paths.forEach { pathPoints ->
        if (pathPoints.size > 1) {
            val path = AndroidPath()
            path.moveTo(pathPoints.first().x, pathPoints.first().y)
            for (i in 1 until pathPoints.size) {
                path.lineTo(pathPoints[i].x, pathPoints[i].y)
            }
            canvas.drawPath(path, paint)
        }
    }

    val file = File(cacheDir, "signature_${System.currentTimeMillis()}.png")
    return try {
        FileOutputStream(file).use { out ->
            bitmap.compress(Bitmap.CompressFormat.PNG, 100, out)
        }
        bitmap.recycle()
        file.absolutePath
    } catch (e: Exception) {
        null
    }
}