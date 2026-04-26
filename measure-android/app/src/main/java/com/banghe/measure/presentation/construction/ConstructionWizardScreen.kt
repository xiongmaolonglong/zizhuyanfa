package com.banghe.measure.presentation.construction

import android.content.Context
import android.content.Intent
import android.net.Uri
import android.provider.MediaStore
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import coil.compose.AsyncImage
import com.banghe.measure.domain.model.MaterialInfo

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ConstructionWizard(
    workOrderId: Int,
    onComplete: () -> Unit,
    onCancel: () -> Unit,
    viewModel: ConstructionWizardViewModel = viewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    val context = LocalContext.current
    var showExceptionDialog by remember { mutableStateOf(false) }

    LaunchedEffect(workOrderId) {
        viewModel.loadTask(workOrderId)
    }

    LaunchedEffect(uiState.submitSuccess) {
        if (uiState.submitSuccess) onComplete()
    }

    val cameraLauncher = rememberLauncherForActivityResult(
        ActivityResultContracts.StartActivityForResult()
    ) { result ->
        result.data?.data?.let { uri ->
            // 通过水印相机或直接拍照添加照片
            // 默认添加到安装前照片
            viewModel.addBeforePhoto(uri)
        }
    }

    val afterCameraLauncher = rememberLauncherForActivityResult(
        ActivityResultContracts.StartActivityForResult()
    ) { result ->
        result.data?.data?.let { uri ->
            viewModel.addAfterPhoto(uri)
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("施工记录", fontWeight = FontWeight.Bold) },
                navigationIcon = {
                    IconButton(onClick = onCancel) {
                        Icon(Icons.Default.Close, contentDescription = "关闭")
                    }
                }
            )
        }
    ) { paddingValues ->
        if (uiState.isLoading) {
            Box(modifier = Modifier.fillMaxSize().padding(paddingValues), contentAlignment = Alignment.Center) {
                CircularProgressIndicator()
            }
        } else {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(paddingValues)
                    .verticalScroll(rememberScrollState())
            ) {
                if (uiState.error != null) {
                    Snackbar(modifier = Modifier.padding(16.dp)) { Text(uiState.error!!) }
                }

                // 设计效果图
                val designImages = uiState.taskData?.designImages ?: emptyList()
                if (designImages.isNotEmpty()) {
                    Text("设计效果图", style = MaterialTheme.typography.titleSmall, fontWeight = FontWeight.SemiBold)
                    Spacer(modifier = Modifier.height(8.dp))
                    LazyVerticalGrid(
                        columns = GridCells.Fixed(3),
                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                        verticalArrangement = Arrangement.spacedBy(8.dp),
                        modifier = Modifier.height(200.dp)
                    ) {
                        items(designImages) { url ->
                            Card(modifier = Modifier.height(180.dp)) {
                                AsyncImage(model = url, contentDescription = null, modifier = Modifier.fillMaxSize())
                            }
                        }
                    }
                    Spacer(modifier = Modifier.height(16.dp))
                }

                // 材料清单
                val materials = uiState.taskData?.materialList ?: emptyList()
                if (materials.isNotEmpty()) {
                    Text("材料清单", style = MaterialTheme.typography.titleSmall, fontWeight = FontWeight.SemiBold)
                    Spacer(modifier = Modifier.height(8.dp))
                    materials.forEach { material ->
                        ListItem(
                            headlineContent = { Text(material.name) },
                            supportingContent = {
                                Text("数量: ${material.quantity}${material.dimensions?.let { " | $it" } ?: ""}")
                            }
                        )
                    }
                    Spacer(modifier = Modifier.height(16.dp))
                }

                // 一键导航
                val address = uiState.draft?.address
                if (!address.isNullOrBlank()) {
                    Button(
                        onClick = { openNavigation(context, address) },
                        modifier = Modifier.fillMaxWidth().height(48.dp)
                    ) {
                        Icon(Icons.Default.Navigation, contentDescription = null)
                        Spacer(modifier = Modifier.width(8.dp))
                        Text("导航到店铺")
                    }
                    Spacer(modifier = Modifier.height(16.dp))
                }

                // 安装前照片
                PhotoSection(
                    title = "安装前照片",
                    photos = uiState.draft?.beforePhotos ?: emptyList(),
                    onAdd = { cameraLauncher.launch(Intent(MediaStore.ACTION_IMAGE_CAPTURE)) },
                    onRemove = { viewModel.removeBeforePhoto(it) }
                )

                // 安装后照片
                PhotoSection(
                    title = "安装后照片",
                    photos = uiState.draft?.afterPhotos ?: emptyList(),
                    onAdd = { afterCameraLauncher.launch(Intent(MediaStore.ACTION_IMAGE_CAPTURE)) },
                    onRemove = { viewModel.removeAfterPhoto(it) }
                )

                // 备注
                Spacer(modifier = Modifier.height(8.dp))
                OutlinedTextField(
                    value = uiState.draft?.notes ?: "",
                    onValueChange = { viewModel.setNotes(it) },
                    label = { Text("施工备注") },
                    modifier = Modifier.fillMaxWidth().height(100.dp),
                    maxLines = 3
                )

                // 异常上报
                Spacer(modifier = Modifier.height(16.dp))
                OutlinedButton(
                    onClick = { showExceptionDialog = true },
                    modifier = Modifier.fillMaxWidth(),
                    colors = ButtonDefaults.outlinedButtonColors(contentColor = MaterialTheme.colorScheme.error)
                ) {
                    Icon(Icons.Default.Warning, contentDescription = null)
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("异常上报")
                }

                // 签名区域
                Spacer(modifier = Modifier.height(16.dp))
                Text("店家签名", style = MaterialTheme.typography.titleSmall, fontWeight = FontWeight.SemiBold)
                Spacer(modifier = Modifier.height(8.dp))
                // 简易签名：使用现有的 StepSignature 或简化版
                // TODO: 集成签名组件

                // 提交按钮
                Spacer(modifier = Modifier.height(24.dp))
                Button(
                    onClick = { viewModel.submit() },
                    enabled = !uiState.isSubmitting && uiState.draft?.afterPhotos?.isNotEmpty() == true,
                    modifier = Modifier.fillMaxWidth().height(56.dp)
                ) {
                    if (uiState.isSubmitting) CircularProgressIndicator(modifier = Modifier.size(20.dp), color = MaterialTheme.colorScheme.onPrimary)
                    else {
                        Icon(Icons.Default.Check, contentDescription = null)
                        Spacer(modifier = Modifier.width(8.dp))
                        Text("提交施工记录")
                    }
                }
                Spacer(modifier = Modifier.height(32.dp))
            }
        }
    }

    // 异常上报对话框
    if (showExceptionDialog) {
        ExceptionReportDialog(
            onDismiss = { showExceptionDialog = false },
            onConfirm = { reason, notes ->
                viewModel.reportException(reason, emptyList(), notes)
                showExceptionDialog = false
            }
        )
    }
}

@Composable
private fun PhotoSection(
    title: String,
    photos: List<String>,
    onAdd: () -> Unit,
    onRemove: (Int) -> Unit
) {
    Text(title, style = MaterialTheme.typography.titleSmall, fontWeight = FontWeight.SemiBold)
    Spacer(modifier = Modifier.height(8.dp))

    LazyVerticalGrid(
        columns = GridCells.Fixed(3),
        horizontalArrangement = Arrangement.spacedBy(8.dp),
        verticalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        items(photos.size) { index ->
            Card(modifier = Modifier.height(100.dp)) {
                Box(modifier = Modifier.fillMaxSize()) {
                    AsyncImage(model = photos[index], contentDescription = null, modifier = Modifier.fillMaxSize())
                    IconButton(
                        onClick = { onRemove(index) },
                        modifier = Modifier.align(Alignment.TopEnd)
                    ) {
                        Icon(Icons.Default.Close, contentDescription = "删除", tint = MaterialTheme.colorScheme.error)
                    }
                }
            }
        }
        item {
            Card(
                modifier = Modifier.height(100.dp).clickable(onClick = onAdd),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant)
            ) {
                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Icon(Icons.Default.Add, contentDescription = null, tint = MaterialTheme.colorScheme.primary)
                        Text("拍照", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.primary)
                    }
                }
            }
        }
    }
    Spacer(modifier = Modifier.height(16.dp))
}

@Composable
private fun ExceptionReportDialog(
    onDismiss: () -> Unit,
    onConfirm: (reason: String, notes: String?) -> Unit
) {
    var selectedReason by remember { mutableStateOf("") }
    var notes by remember { mutableStateOf("") }

    val reasons = listOf("甲方拒绝", "尺寸不符", "材料问题", "现场条件不允许", "其他")

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("异常上报") },
        text = {
            Column {
                reasons.forEach { reason ->
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable { selectedReason = reason }
                            .padding(vertical = 8.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        RadioButton(
                            selected = selectedReason == reason,
                            onClick = { selectedReason = reason }
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(reason)
                    }
                }

                Spacer(modifier = Modifier.height(12.dp))

                OutlinedTextField(
                    value = notes,
                    onValueChange = { notes = it },
                    label = { Text("补充说明") },
                    modifier = Modifier.fillMaxWidth().height(80.dp),
                    maxLines = 3
                )
            }
        },
        confirmButton = {
            TextButton(
                onClick = { if (selectedReason.isNotBlank()) onConfirm(selectedReason, notes.ifBlank { null }) },
                enabled = selectedReason.isNotBlank()
            ) {
                Text("提交上报")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) { Text("取消") }
        }
    )
}

private fun openNavigation(context: Context, address: String) {
    try {
        val encodedAddress = Uri.encode(address)
        val amapUri = Uri.parse("androidamap://route?sourceApplication=measure&dname=$encodedAddress")
        val amapIntent = Intent(Intent.ACTION_VIEW, amapUri).setPackage("com.autonavi.minimap")
        if (amapIntent.resolveActivity(context.packageManager) != null) {
            context.startActivity(amapIntent)
            return
        }

        val baiduUri = Uri.parse("baidumap://map/direction?destination=$encodedAddress")
        val baiduIntent = Intent(Intent.ACTION_VIEW, baiduUri).setPackage("com.baidu.BaiduMap")
        if (baiduIntent.resolveActivity(context.packageManager) != null) {
            context.startActivity(baiduIntent)
            return
        }

        context.startActivity(Intent(Intent.ACTION_VIEW, Uri.parse("market://search?q=地图导航")))
    } catch (e: Exception) {
        android.widget.Toast.makeText(context, "请安装高德或百度地图", android.widget.Toast.LENGTH_SHORT).show()
    }
}