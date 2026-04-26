package com.banghe.measure.presentation.sketch

import android.app.Activity
import android.content.ContentValues
import android.graphics.Bitmap
import android.graphics.Canvas as AndroidCanvas
import android.graphics.Color as AndroidColor
import android.graphics.Paint
import android.graphics.Path as AndroidPath
import android.graphics.RectF
import android.net.Uri
import android.os.Build
import android.provider.MediaStore
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Create
import androidx.compose.material.icons.filled.CropSquare
import androidx.compose.material.icons.filled.HorizontalRule
import androidx.compose.material.icons.filled.Save
import androidx.compose.material.icons.filled.TextFields
import androidx.compose.material.icons.filled.Undo
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilledTonalButton
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SegmentedButton
import androidx.compose.material3.SegmentedButtonDefaults
import androidx.compose.material3.SingleChoiceSegmentedButtonRow
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.viewinterop.AndroidView
import java.io.File
import java.io.FileOutputStream

private enum class DrawTool { FREEHAND, LINE, RECTANGLE, TEXT }

private data class DrawColor(val value: Color, val label: String, val androidColor: Int)

private val DRAW_COLORS = listOf(
    DrawColor(Color.Black, "黑", AndroidColor.BLACK),
    DrawColor(Color.Red, "红", AndroidColor.RED),
    DrawColor(Color.Blue, "蓝", AndroidColor.BLUE),
    DrawColor(Color.White, "白", AndroidColor.WHITE),
)

private data class DrawElement(
    val tool: DrawTool,
    val color: DrawColor,
    val strokeWidth: Float,
    val points: List<Offset> = emptyList(),
    val startX: Float = 0f,
    val startY: Float = 0f,
    val endX: Float = 0f,
    val endY: Float = 0f,
    val text: String = "",
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SketchCanvasScreen(
    backgroundImageUri: Uri? = null,
    onExport: (Uri) -> Unit,
    onBack: () -> Unit,
) {
    val context = LocalContext.current
    var elements by remember { mutableStateOf<List<DrawElement>>(emptyList()) }
    var currentTool by remember { mutableStateOf(DrawTool.FREEHAND) }
    var currentColor by remember { mutableStateOf(DRAW_COLORS[0]) }
    var strokeWidth by remember { mutableFloatStateOf(4f) }
    var currentPoints by remember { mutableStateOf<List<Offset>>(emptyList()) }
    var dragStart by remember { mutableStateOf<Offset?>(null) }
    var currentEnd by remember { mutableStateOf<Offset?>(null) }
    var showTextDialog by remember { mutableStateOf(false) }
    var textPosition by remember { mutableStateOf<Offset?>(null) }

    fun undo() {
        if (elements.isNotEmpty()) {
            elements = elements.dropLast(1)
        }
    }

    fun clearAll() {
        elements = emptyList()
        currentPoints = emptyList()
        dragStart = null
        currentEnd = null
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Text("草图绘制", fontWeight = FontWeight.Bold)
                },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "返回")
                    }
                },
                actions = {
                    IconButton(onClick = { undo() }, enabled = elements.isNotEmpty()) {
                        Icon(Icons.Default.Undo, contentDescription = "撤销")
                    }
                    IconButton(onClick = {
                        if (elements.isNotEmpty()) {
                            clearAll()
                        }
                    }, enabled = elements.isNotEmpty()) {
                        Icon(Icons.Default.Close, contentDescription = "清除")
                    }
                    IconButton(
                        onClick = {
                            exportSketch(
                                context = context,
                                elements = elements,
                                strokeWidth = strokeWidth,
                                backgroundImageUri = backgroundImageUri,
                                onResult = onExport
                            )
                        },
                        enabled = elements.isNotEmpty()
                    ) {
                        Icon(Icons.Default.Save, contentDescription = "保存")
                    }
                }
            )
        }
    ) { paddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
        ) {
            // Canvas area
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .weight(1f)
                    .padding(8.dp)
            ) {
                AndroidView(
                    factory = { ctx ->
                        SketchDrawView(ctx, backgroundImageUri)
                    },
                    update = { view ->
                        view.backgroundImageUri = backgroundImageUri
                        view.elements = elements
                        view.currentTool = currentTool
                        view.currentColor = currentColor.androidColor
                        view.strokeWidth = strokeWidth
                        view.currentPoints = currentPoints
                        view.dragStart = dragStart
                        view.currentEnd = currentEnd
                        view.invalidate()
                    },
                    modifier = Modifier
                        .fillMaxSize()
                        .clip(RoundedCornerShape(8.dp))
                        .border(1.dp, MaterialTheme.colorScheme.outlineVariant, RoundedCornerShape(8.dp))
                        .pointerInput(currentTool) {
                            awaitPointerEventScope {
                                while (true) {
                                    val down = awaitPointerEvent()
                                    val pos = down.changes.firstOrNull()?.position ?: continue
                                    down.changes.first().consume()

                                    when (currentTool) {
                                        DrawTool.FREEHAND -> {
                                            currentPoints = listOf(pos)
                                            do {
                                                val move = awaitPointerEvent()
                                                val newPos = move.changes.firstOrNull()?.position
                                                if (newPos != null) {
                                                    move.changes.first().consume()
                                                    currentPoints = currentPoints + newPos
                                                }
                                            } while (move.changes.any { it.pressed })
                                            if (currentPoints.size > 1) {
                                                elements = elements + DrawElement(
                                                    tool = DrawTool.FREEHAND,
                                                    color = currentColor,
                                                    strokeWidth = strokeWidth,
                                                    points = currentPoints.toList()
                                                )
                                            }
                                            currentPoints = emptyList()
                                        }
                                        DrawTool.LINE -> {
                                            dragStart = pos
                                            do {
                                                val move = awaitPointerEvent()
                                                val newPos = move.changes.firstOrNull()?.position
                                                if (newPos != null) {
                                                    move.changes.first().consume()
                                                    currentEnd = newPos
                                                }
                                            } while (move.changes.any { it.pressed })
                                            val end = currentEnd
                                            val start = dragStart
                                            if (start != null && end != null) {
                                                elements = elements + DrawElement(
                                                    tool = DrawTool.LINE,
                                                    color = currentColor,
                                                    strokeWidth = strokeWidth,
                                                    startX = start.x,
                                                    startY = start.y,
                                                    endX = end.x,
                                                    endY = end.y
                                                )
                                            }
                                            dragStart = null
                                            currentEnd = null
                                        }
                                        DrawTool.RECTANGLE -> {
                                            dragStart = pos
                                            do {
                                                val move = awaitPointerEvent()
                                                val newPos = move.changes.firstOrNull()?.position
                                                if (newPos != null) {
                                                    move.changes.first().consume()
                                                    currentEnd = newPos
                                                }
                                            } while (move.changes.any { it.pressed })
                                            val end = currentEnd
                                            val start = dragStart
                                            if (start != null && end != null) {
                                                elements = elements + DrawElement(
                                                    tool = DrawTool.RECTANGLE,
                                                    color = currentColor,
                                                    strokeWidth = strokeWidth,
                                                    startX = start.x,
                                                    startY = start.y,
                                                    endX = end.x,
                                                    endY = end.y
                                                )
                                            }
                                            dragStart = null
                                            currentEnd = null
                                        }
                                        DrawTool.TEXT -> {
                                            textPosition = pos
                                            showTextDialog = true
                                        }
                                    }
                                }
                            }
                        }
                )
            }

            // Tool bar
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(MaterialTheme.colorScheme.surface)
                    .padding(horizontal = 12.dp, vertical = 8.dp)
            ) {
                // Tool selection
                SingleChoiceSegmentedButtonRow(modifier = Modifier.fillMaxWidth()) {
                    listOf(
                        Triple(DrawTool.FREEHAND, "画笔", Icons.Default.Create),
                        Triple(DrawTool.LINE, "直线", Icons.Default.HorizontalRule),
                        Triple(DrawTool.RECTANGLE, "矩形", Icons.Default.CropSquare),
                        Triple(DrawTool.TEXT, "文字", Icons.Default.TextFields),
                    ).forEachIndexed { index, (tool, label, icon) ->
                        SegmentedButton(
                            selected = currentTool == tool,
                            onClick = { currentTool = tool },
                            shape = SegmentedButtonDefaults.itemShape(index, 4),
                            icon = {}
                        ) {
                            Icon(icon, contentDescription = null, modifier = Modifier.size(18.dp))
                            Spacer(modifier = Modifier.width(4.dp))
                            Text(label, fontSize = 13.sp)
                        }
                    }
                }

                Spacer(modifier = Modifier.height(8.dp))

                // Color selection + stroke width
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Row(
                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text("颜色:", style = MaterialTheme.typography.labelMedium)
                        DRAW_COLORS.forEach { color ->
                            Box(
                                modifier = Modifier
                                    .size(32.dp)
                                    .clip(RoundedCornerShape(4.dp))
                                    .background(color.value)
                                    .then(
                                        if (currentColor == color) Modifier.border(
                                            2.dp,
                                            MaterialTheme.colorScheme.primary,
                                            RoundedCornerShape(4.dp)
                                        ) else Modifier.border(
                                            1.dp,
                                            Color.Gray,
                                            RoundedCornerShape(4.dp)
                                        )
                                    )
                                    .clickable { currentColor = color },
                                contentAlignment = Alignment.Center
                            ) {}
                        }
                    }

                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(4.dp)
                    ) {
                        Text("粗细:", style = MaterialTheme.typography.labelMedium)
                        FilledTonalButton(
                            onClick = { if (strokeWidth > 2f) strokeWidth -= 2f },
                            contentPadding = PaddingValues(horizontal = 8.dp)
                        ) {
                            Text("-", fontSize = 14.sp)
                        }
                        Text(
                            "%.0f".format(strokeWidth),
                            style = MaterialTheme.typography.labelMedium,
                            modifier = Modifier.width(24.dp)
                        )
                        FilledTonalButton(
                            onClick = { if (strokeWidth < 20f) strokeWidth += 2f },
                            contentPadding = PaddingValues(horizontal = 8.dp)
                        ) {
                            Text("+", fontSize = 14.sp)
                        }
                    }
                }
            }
        }
    }

    // Text input dialog
    if (showTextDialog && textPosition != null) {
        var inputText by remember { mutableStateOf("") }
        AlertDialog(
            onDismissRequest = {
                showTextDialog = false
                textPosition = null
            },
            title = { Text("输入文字标注") },
            text = {
                OutlinedTextField(
                    value = inputText,
                    onValueChange = { inputText = it },
                    placeholder = { Text("请输入文字") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )
            },
            confirmButton = {
                Button(
                    onClick = {
                        val pos = textPosition
                        if (pos != null && inputText.isNotBlank()) {
                            elements = elements + DrawElement(
                                tool = DrawTool.TEXT,
                                color = currentColor,
                                strokeWidth = strokeWidth,
                                startX = pos.x,
                                startY = pos.y,
                                text = inputText.trim()
                            )
                        }
                        showTextDialog = false
                        textPosition = null
                        inputText = ""
                    }
                ) {
                    Text("确认")
                }
            },
            dismissButton = {
                TextButton(onClick = {
                    showTextDialog = false
                    textPosition = null
                    inputText = ""
                }) {
                    Text("取消")
                }
            }
        )
    }
}

/**
 * Custom View for sketch drawing - handles onDraw with background image and all draw elements.
 */
private class SketchDrawView(
    context: android.content.Context,
    var backgroundImageUri: Uri? = null
) : android.view.View(context) {

    var elements: List<DrawElement> = emptyList()
    var currentTool: DrawTool = DrawTool.FREEHAND
    var currentColor: Int = AndroidColor.BLACK
    var strokeWidth: Float = 4f
    var currentPoints: List<Offset> = emptyList()
    var dragStart: Offset? = null
    var currentEnd: Offset? = null

    private var bgBitmap: Bitmap? = null
    private val bgPaint = Paint(Paint.ANTI_ALIAS_FLAG)
    private val drawPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        style = Paint.Style.STROKE
        strokeCap = Paint.Cap.ROUND
        strokeJoin = Paint.Join.ROUND
    }
    private val textPaint = Paint(Paint.ANTI_ALIAS_FLAG)

    override fun onDraw(canvas: AndroidCanvas) {
        super.onDraw(canvas)
        canvas.drawColor(AndroidColor.WHITE)

        // Draw background image if available
        loadBackgroundImage()
        bgBitmap?.let { bmp ->
            val src = android.graphics.Rect(0, 0, bmp.width, bmp.height)
            val dst = android.graphics.Rect(0, 0, width, height)
            canvas.drawBitmap(bmp, src, dst, bgPaint)
        }

        // Draw all confirmed elements
        elements.forEach { element ->
            drawElement(canvas, element)
        }

        // Draw current preview
        drawPreview(canvas)
    }

    private fun drawElement(canvas: AndroidCanvas, element: DrawElement) {
        when (element.tool) {
            DrawTool.FREEHAND -> {
                if (element.points.size < 2) return
                drawPaint.color = element.color.androidColor
                drawPaint.strokeWidth = element.strokeWidth
                drawPaint.style = Paint.Style.STROKE
                val path = AndroidPath()
                path.moveTo(element.points.first().x, element.points.first().y)
                for (i in 1 until element.points.size) {
                    path.lineTo(element.points[i].x, element.points[i].y)
                }
                canvas.drawPath(path, drawPaint)
            }
            DrawTool.LINE -> {
                drawPaint.color = element.color.androidColor
                drawPaint.strokeWidth = element.strokeWidth
                drawPaint.style = Paint.Style.STROKE
                canvas.drawLine(
                    element.startX, element.startY,
                    element.endX, element.endY,
                    drawPaint
                )
            }
            DrawTool.RECTANGLE -> {
                drawPaint.color = element.color.androidColor
                drawPaint.strokeWidth = element.strokeWidth
                drawPaint.style = Paint.Style.STROKE
                val rect = RectF(
                    element.startX, element.startY,
                    element.endX, element.endY
                )
                canvas.drawRect(rect, drawPaint)
            }
            DrawTool.TEXT -> {
                textPaint.color = element.color.androidColor
                textPaint.textSize = element.strokeWidth * 5f
                canvas.drawText(element.text, element.startX, element.startY, textPaint)
            }
        }
    }

    private fun drawPreview(canvas: AndroidCanvas) {
        drawPaint.color = currentColor
        drawPaint.strokeWidth = strokeWidth

        when (currentTool) {
            DrawTool.FREEHAND -> {
                if (currentPoints.size < 2) return
                drawPaint.style = Paint.Style.STROKE
                val path = AndroidPath()
                path.moveTo(currentPoints.first().x, currentPoints.first().y)
                for (i in 1 until currentPoints.size) {
                    path.lineTo(currentPoints[i].x, currentPoints[i].y)
                }
                canvas.drawPath(path, drawPaint)
            }
            DrawTool.LINE -> {
                val start = dragStart ?: return
                val end = currentEnd ?: return
                drawPaint.style = Paint.Style.STROKE
                canvas.drawLine(start.x, start.y, end.x, end.y, drawPaint)
            }
            DrawTool.RECTANGLE -> {
                val start = dragStart ?: return
                val end = currentEnd ?: return
                drawPaint.style = Paint.Style.STROKE
                canvas.drawRect(RectF(start.x, start.y, end.x, end.y), drawPaint)
            }
            DrawTool.TEXT -> {
                // No preview for text tool
            }
        }
    }

    private fun loadBackgroundImage() {
        val uri = backgroundImageUri ?: return
        if (bgBitmap != null) return
        try {
            val inputStream = context.contentResolver.openInputStream(uri)
            val options = android.graphics.BitmapFactory.Options().apply {
                inJustDecodeBounds = true
            }
            android.graphics.BitmapFactory.decodeStream(inputStream, null, options)
            inputStream?.close()

            val inputStream2 = context.contentResolver.openInputStream(uri)
            val sampleSize = calculateInSampleSize(options, width, height)
            val decodeOptions = android.graphics.BitmapFactory.Options().apply {
                inSampleSize = sampleSize
            }
            bgBitmap = android.graphics.BitmapFactory.decodeStream(inputStream2, null, decodeOptions)
            inputStream2?.close()
        } catch (_: Exception) {
            bgBitmap = null
        }
    }

    private fun calculateInSampleSize(
        options: android.graphics.BitmapFactory.Options,
        reqWidth: Int,
        reqHeight: Int
    ): Int {
        val height = options.outHeight
        val width = options.outWidth
        var inSampleSize = 1
        if (height > reqHeight || width > reqWidth) {
            val halfHeight = height / 2
            val halfWidth = width / 2
            while (halfHeight / inSampleSize >= reqHeight && halfWidth / inSampleSize >= reqWidth) {
                inSampleSize *= 2
            }
        }
        return inSampleSize
    }
}

/**
 * Export the sketch canvas content (background image + all drawn elements) to a Bitmap,
 * save it to MediaStore, and invoke the callback with the resulting Uri.
 */
private fun exportSketch(
    context: android.content.Context,
    elements: List<DrawElement>,
    strokeWidth: Float,
    backgroundImageUri: Uri?,
    onResult: (Uri) -> Unit
) {
    // Decode background image at reduced size to avoid OOM
    val bgBitmap: Bitmap? = if (backgroundImageUri != null) {
        try {
            val inputStream = context.contentResolver.openInputStream(backgroundImageUri)
            val options = android.graphics.BitmapFactory.Options().apply {
                inJustDecodeBounds = true
            }
            android.graphics.BitmapFactory.decodeStream(inputStream, null, options)
            inputStream?.close()

            val targetWidth = 1920
            val targetHeight = 1080
            val inputStream2 = context.contentResolver.openInputStream(backgroundImageUri)
            val sampleSize = calculateSampleSize(options.outWidth, options.outHeight, targetWidth, targetHeight)
            val decodeOptions = android.graphics.BitmapFactory.Options().apply {
                inSampleSize = sampleSize
            }
            val bmp = android.graphics.BitmapFactory.decodeStream(inputStream2, null, decodeOptions)
            inputStream2?.close()
            bmp
        } catch (_: Exception) {
            null
        }
    } else null

    val canvasWidth = bgBitmap?.width ?: 1920
    val canvasHeight = bgBitmap?.height ?: 1080

    // Scale factor from View coordinates to export bitmap coordinates
    val activity = context as? android.app.Activity
    val viewWidth = activity?.window?.decorView?.width ?: canvasWidth
    val viewHeight = activity?.window?.decorView?.height ?: canvasHeight
    val scaleX = canvasWidth.toFloat() / viewWidth.toFloat()
    val scaleY = canvasHeight.toFloat() / viewHeight.toFloat()

    val bitmap = Bitmap.createBitmap(canvasWidth, canvasHeight, Bitmap.Config.ARGB_8888)
    val canvas = AndroidCanvas(bitmap)
    canvas.drawColor(AndroidColor.WHITE)

    // Draw background
    bgBitmap?.let {
        canvas.drawBitmap(it, 0f, 0f, null)
    }

    // Draw all elements
    val paint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        style = Paint.Style.STROKE
        strokeCap = Paint.Cap.ROUND
        strokeJoin = Paint.Join.ROUND
    }
    val textPaint = Paint(Paint.ANTI_ALIAS_FLAG)

    elements.forEach { element ->
        when (element.tool) {
            DrawTool.FREEHAND -> {
                if (element.points.size < 2) return@forEach
                paint.color = element.color.androidColor
                paint.strokeWidth = element.strokeWidth * scaleX
                paint.style = Paint.Style.STROKE
                val path = AndroidPath()
                path.moveTo(element.points.first().x * scaleX, element.points.first().y * scaleY)
                for (i in 1 until element.points.size) {
                    path.lineTo(element.points[i].x * scaleX, element.points[i].y * scaleY)
                }
                canvas.drawPath(path, paint)
            }
            DrawTool.LINE -> {
                paint.color = element.color.androidColor
                paint.strokeWidth = element.strokeWidth * scaleX
                paint.style = Paint.Style.STROKE
                canvas.drawLine(
                    element.startX * scaleX, element.startY * scaleY,
                    element.endX * scaleX, element.endY * scaleY,
                    paint
                )
            }
            DrawTool.RECTANGLE -> {
                paint.color = element.color.androidColor
                paint.strokeWidth = element.strokeWidth * scaleX
                paint.style = Paint.Style.STROKE
                canvas.drawRect(
                    RectF(
                        element.startX * scaleX, element.startY * scaleY,
                        element.endX * scaleX, element.endY * scaleY
                    ),
                    paint
                )
            }
            DrawTool.TEXT -> {
                textPaint.color = element.color.androidColor
                textPaint.textSize = element.strokeWidth * 5f * scaleX
                canvas.drawText(
                    element.text,
                    element.startX * scaleX,
                    element.startY * scaleY,
                    textPaint
                )
            }
        }
    }

    bgBitmap?.recycle()

    // Save to MediaStore
    val filename = "sketch_${System.currentTimeMillis()}.png"
    val contentValues = ContentValues().apply {
        put(MediaStore.Images.Media.DISPLAY_NAME, filename)
        put(MediaStore.Images.Media.MIME_TYPE, "image/png")
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            put(MediaStore.Images.Media.RELATIVE_PATH, "Pictures/MeasureSketch")
            put(MediaStore.Images.Media.IS_PENDING, 1)
        }
    }

    val resolver = context.contentResolver
    val imageUri = resolver.insert(MediaStore.Images.Media.EXTERNAL_CONTENT_URI, contentValues)
    imageUri?.let { uri ->
        try {
            resolver.openOutputStream(uri)?.use { out ->
                bitmap.compress(Bitmap.CompressFormat.PNG, 100, out)
            }
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                contentValues.clear()
                contentValues.put(MediaStore.Images.Media.IS_PENDING, 0)
                resolver.update(uri, contentValues, null, null)
            }
            onResult(uri)
        } catch (_: Exception) {
            // Fallback: save to cache
            val file = File(context.cacheDir, filename)
            FileOutputStream(file).use { out ->
                bitmap.compress(Bitmap.CompressFormat.PNG, 100, out)
            }
            onResult(Uri.fromFile(file))
        }
    }
    bitmap.recycle()
}

private fun calculateSampleSize(srcWidth: Int, srcHeight: Int, reqWidth: Int, reqHeight: Int): Int {
    var inSampleSize = 1
    if (srcHeight > reqHeight || srcWidth > reqWidth) {
        val halfHeight = srcHeight / 2
        val halfWidth = srcWidth / 2
        while (halfHeight / inSampleSize >= reqHeight && halfWidth / inSampleSize >= reqWidth) {
            inSampleSize *= 2
        }
    }
    return inSampleSize
}
