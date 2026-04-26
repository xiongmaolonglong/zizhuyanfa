package com.banghe.measure.presentation.camera

import android.Manifest
import android.content.ContentValues
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Canvas
import android.graphics.Paint
import android.graphics.Typeface
import android.location.Address
import android.location.Geocoder
import android.location.Location
import android.net.Uri
import android.os.Environment
import android.provider.MediaStore
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.camera.core.CameraSelector
import androidx.camera.core.ImageCapture
import androidx.camera.core.ImageCaptureException
import androidx.camera.core.Preview
import androidx.camera.lifecycle.ProcessCameraProvider
import androidx.camera.view.PreviewView
import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color as ComposeColor
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalLifecycleOwner
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.core.content.ContextCompat
import com.google.android.gms.location.FusedLocationProviderClient
import com.google.android.gms.location.LocationServices
import java.io.File
import java.text.SimpleDateFormat
import java.util.*
import java.util.concurrent.ExecutorService
import java.util.concurrent.Executors

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun WatermarkCameraScreen(
    orderId: String,
    onPhotoTaken: (Uri) -> Unit,
    onCancel: () -> Unit
) {
    val context = LocalContext.current
    val lifecycleOwner = LocalLifecycleOwner.current

    var hasCameraPermission by remember { mutableStateOf(false) }
    var hasLocationPermission by remember { mutableStateOf(false) }
    var currentAddress by remember { mutableStateOf<String?>(null) }
    var imageCapture by remember { mutableStateOf<ImageCapture?>(null) }
    var isCapturing by remember { mutableStateOf(false) }

    val cameraExecutor = remember { Executors.newSingleThreadExecutor() }
    val fusedLocationClient = remember { LocationServices.getFusedLocationProviderClient(context) }

    val permissionLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.RequestMultiplePermissions()
    ) { permissions ->
        hasCameraPermission = permissions[Manifest.permission.CAMERA] ?: false
        hasLocationPermission = permissions[Manifest.permission.ACCESS_FINE_LOCATION] ?: false
        if (hasLocationPermission) {
            fetchLocation(context, fusedLocationClient) { address ->
                currentAddress = address
            }
        }
    }

    LaunchedEffect(Unit) {
        permissionLauncher.launch(
            arrayOf(
                Manifest.permission.CAMERA,
                Manifest.permission.ACCESS_FINE_LOCATION,
                Manifest.permission.ACCESS_COARSE_LOCATION
            )
        )
    }

    val currentTime = SimpleDateFormat("yyyy-MM-dd HH:mm:ss", Locale.getDefault()).format(Date())

    DisposableEffect(Unit) {
        onDispose {
            cameraExecutor.shutdown()
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("水印相机", fontWeight = FontWeight.Bold) },
                navigationIcon = {
                    IconButton(onClick = onCancel) {
                        Icon(Icons.Default.Close, contentDescription = "关闭")
                    }
                }
            )
        }
    ) { paddingValues ->
        if (!hasCameraPermission) {
            Box(
                modifier = Modifier.fillMaxSize().padding(paddingValues),
                contentAlignment = Alignment.Center
            ) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Icon(Icons.Default.Camera, contentDescription = null, modifier = Modifier.size(64.dp))
                    Spacer(Modifier.height(16.dp))
                    Text("需要相机权限")
                    Spacer(Modifier.height(16.dp))
                    Button(onClick = {
                        permissionLauncher.launch(arrayOf(Manifest.permission.CAMERA))
                    }) {
                        Text("授予权限")
                    }
                }
            }
        } else {
            Box(
                modifier = Modifier.fillMaxSize().padding(paddingValues)
            ) {
                // CameraX Preview
                AndroidView(
                    modifier = Modifier.fillMaxSize(),
                    factory = { ctx ->
                        val previewView = PreviewView(ctx)
                        val cameraProviderFuture = ProcessCameraProvider.getInstance(ctx)
                        cameraProviderFuture.addListener({
                            val cameraProvider = cameraProviderFuture.get()
                            val preview = Preview.Builder().build()
                            preview.setSurfaceProvider(previewView.getSurfaceProvider())

                            imageCapture = ImageCapture.Builder()
                                .setCaptureMode(ImageCapture.CAPTURE_MODE_MINIMIZE_LATENCY)
                                .build()

                            val cameraSelector = CameraSelector.DEFAULT_BACK_CAMERA
                            cameraProvider.unbindAll()
                            cameraProvider.bindToLifecycle(
                                lifecycleOwner,
                                cameraSelector,
                                preview,
                                imageCapture
                            )
                        }, ContextCompat.getMainExecutor(ctx))
                        previewView
                    }
                )

                // 水印预览层
                Card(
                    modifier = Modifier
                        .align(Alignment.BottomStart)
                        .padding(16.dp),
                    colors = CardDefaults.cardColors(
                        containerColor = ComposeColor(0x80000000)
                    )
                ) {
                    Column(modifier = Modifier.padding(12.dp)) {
                        Text(
                            text = "工单: $orderId",
                            fontSize = 14.sp,
                            color = ComposeColor.White,
                            fontWeight = FontWeight.Medium
                        )
                        Spacer(Modifier.height(4.dp))
                        Text(
                            text = "时间: $currentTime",
                            fontSize = 12.sp,
                            color = ComposeColor.White
                        )
                        currentAddress?.let { addr ->
                            Text(
                                text = "地址: $addr",
                                fontSize = 12.sp,
                                color = ComposeColor.White
                            )
                        }
                    }
                }

                // 拍照按钮
                FloatingActionButton(
                    onClick = {
                        if (!isCapturing && imageCapture != null) {
                            isCapturing = true
                            takePhotoWithWatermark(
                                context,
                                imageCapture!!,
                                cameraExecutor,
                                orderId,
                                currentTime,
                                currentAddress ?: "位置未知"
                            ) { uri ->
                                isCapturing = false
                                if (uri != null) {
                                    onPhotoTaken(uri)
                                }
                            }
                        }
                    },
                    modifier = Modifier
                        .align(Alignment.BottomCenter)
                        .padding(32.dp),
                    containerColor = if (isCapturing) MaterialTheme.colorScheme.secondary
                    else MaterialTheme.colorScheme.primary
                ) {
                    Icon(
                        Icons.Default.Camera,
                        contentDescription = "拍照",
                        modifier = Modifier.size(32.dp)
                    )
                }
            }
        }
    }
}

private fun fetchLocation(
    context: android.content.Context,
    fusedLocationClient: FusedLocationProviderClient,
    onAddressReceived: (String) -> Unit
) {
    try {
        fusedLocationClient.lastLocation.addOnSuccessListener { location: Location? ->
            if (location != null) {
                getAddressFromLocation(context, location, onAddressReceived)
            } else {
                onAddressReceived("获取位置失败")
            }
        }.addOnFailureListener {
            onAddressReceived("获取位置失败")
        }
    } catch (e: SecurityException) {
        onAddressReceived("无位置权限")
    }
}

private fun getAddressFromLocation(
    context: android.content.Context,
    location: Location,
    onAddressReceived: (String) -> Unit
) {
    try {
        val geocoder = Geocoder(context, Locale.getDefault())
        val addresses: List<Address>? = geocoder.getFromLocation(
            location.latitude,
            location.longitude,
            1
        )
        if (addresses != null && addresses.isNotEmpty()) {
            val address = addresses[0]
            val addressText = StringBuilder()
            // 优先显示详细地址
            address.thoroughfare?.let { addressText.append(it) }
            address.subThoroughfare?.let { addressText.append(it).append("号") }
            if (addressText.isEmpty()) {
                address.locality?.let { addressText.append(it) }
                address.subLocality?.let { addressText.append(it) }
            }
            if (addressText.isEmpty()) {
                address.adminArea?.let { addressText.append(it) }
                address.subAdminArea?.let { addressText.append(it) }
            }
            if (addressText.isEmpty()) {
                addressText.append("${location.latitude}, ${location.longitude}")
            }
            onAddressReceived(addressText.toString())
        } else {
            onAddressReceived("${location.latitude}, ${location.longitude}")
        }
    } catch (e: Exception) {
        onAddressReceived("${location.latitude}, ${location.longitude}")
    }
}

private fun takePhotoWithWatermark(
    context: android.content.Context,
    imageCapture: ImageCapture,
    executor: ExecutorService,
    orderId: String,
    time: String,
    address: String,
    onResult: (Uri?) -> Unit
) {
    // 创建临时文件
    val photoFile = File(
        context.getExternalFilesDir(Environment.DIRECTORY_PICTURES),
        "temp_photo_${System.currentTimeMillis()}.jpg"
    )

    val outputOptions = ImageCapture.OutputFileOptions.Builder(photoFile).build()

    imageCapture.takePicture(
        outputOptions,
        executor,
        object : ImageCapture.OnImageSavedCallback {
            override fun onError(error: ImageCaptureException) {
                onResult(null)
            }

            override fun onImageSaved(output: ImageCapture.OutputFileResults) {
                try {
                    // 加载原始照片
                    val originalBitmap = BitmapFactory.decodeFile(photoFile.absolutePath)
                    if (originalBitmap != null) {
                        // 添加水印
                        val watermarkedBitmap = addWatermark(originalBitmap, orderId, time, address)

                        // 保存到 MediaStore
                        val uri = saveToMediaStore(context, watermarkedBitmap, orderId)

                        // 清理临时文件
                        photoFile.delete()

                        onResult(uri)
                    } else {
                        onResult(null)
                    }
                } catch (e: Exception) {
                    onResult(null)
                }
            }
        }
    )
}

private fun addWatermark(
    photoBitmap: Bitmap,
    orderId: String,
    time: String,
    address: String
): Bitmap {
    val result = photoBitmap.copy(Bitmap.Config.ARGB_8888, true)
    val canvas = Canvas(result)

    // 底部半透明黑色背景条，高度 8% 照片高度
    val barHeight = result.height * 0.08f
    val bgPaint = Paint().apply { color = android.graphics.Color.parseColor("#80000000") }
    canvas.drawRect(
        0f,
        result.height - barHeight,
        result.width.toFloat(),
        result.height.toFloat(),
        bgPaint
    )

    // 白色文字
    val textPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        color = android.graphics.Color.WHITE
        textSize = result.width * 0.028f
        typeface = Typeface.DEFAULT_BOLD
    }
    val smallTextPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        color = android.graphics.Color.WHITE
        textSize = result.width * 0.022f
    }

    val textMargin = 16f
    val textStartY = result.height - barHeight + barHeight * 0.25f

    // 第一行：工单号
    canvas.drawText("工单: $orderId", textMargin, textStartY, textPaint)

    // 第二行：时间
    canvas.drawText(time, textMargin, textStartY + barHeight * 0.35f, smallTextPaint)

    // 第三行：地址
    canvas.drawText(address, textMargin, textStartY + barHeight * 0.65f, smallTextPaint)

    return result
}

private fun saveToMediaStore(context: android.content.Context, bitmap: Bitmap, orderId: String): Uri? {
    val contentValues = ContentValues().apply {
        put(MediaStore.Images.Media.DISPLAY_NAME, "measure_${orderId}_${System.currentTimeMillis()}.jpg")
        put(MediaStore.Images.Media.MIME_TYPE, "image/jpeg")
        put(MediaStore.Images.Media.RELATIVE_PATH, Environment.DIRECTORY_PICTURES + "/MeasurePhotos")
    }

    val contentResolver = context.contentResolver
    val uri = contentResolver.insert(MediaStore.Images.Media.EXTERNAL_CONTENT_URI, contentValues)

    uri?.let {
        contentResolver.openOutputStream(it)?.use { outputStream ->
            bitmap.compress(Bitmap.CompressFormat.JPEG, 90, outputStream)
        }
    }

    return uri
}