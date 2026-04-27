package com.banghe.measure.presentation.tasks

import androidx.compose.foundation.ExperimentalFoundationApi
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.pager.HorizontalPager
import androidx.compose.foundation.pager.rememberPagerState
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.layout.ContentScale
import androidx.lifecycle.viewmodel.compose.viewModel
import coil.compose.AsyncImage
import com.banghe.measure.core.App
import com.banghe.measure.core.theme.*
import com.banghe.measure.presentation.components.StageItem
import com.banghe.measure.presentation.components.StageProgressBar

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun WorkOrderDetailScreen(
    workOrderId: Int,
    onBack: () -> Unit,
    onAssigned: () -> Unit = {},
    viewModel: WorkOrderDetailViewModel = viewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    var userRole by remember { mutableStateOf<String?>(null) }
    var showAssignDialog by remember { mutableStateOf(false) }

    LaunchedEffect(workOrderId) {
        viewModel.loadWorkOrder(workOrderId)
    }

    LaunchedEffect(Unit) {
        userRole = App.instance.preferencesStore.getUserRole()
    }

    Scaffold(
        topBar = {
            TopAppBar(
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "返回")
                    }
                },
                title = { Text("工单详情", fontWeight = FontWeight.Bold) }
            )
        }
    ) { paddingValues ->
        when {
            uiState.isLoading -> {
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(paddingValues),
                    contentAlignment = Alignment.Center
                ) {
                    CircularProgressIndicator()
                }
            }
            uiState.error != null -> {
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(paddingValues),
                    contentAlignment = Alignment.Center
                ) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text(uiState.error!!, color = Error)
                        Spacer(modifier = Modifier.height(12.dp))
                        Button(onClick = { viewModel.loadWorkOrder(workOrderId) }) {
                            Text("重试")
                        }
                    }
                }
            }
            uiState.workOrder != null -> {
                WorkOrderContent(
                    workOrder = uiState.workOrder!!,
                    paddingValues = paddingValues,
                    isAdmin = userRole == "admin",
                    onAssignClick = { showAssignDialog = true }
                )
            }
        }
    }

    // 派工弹窗
    if (showAssignDialog && uiState.workOrder != null) {
        AssignDialog(
            workOrderId = workOrderId,
            stage = uiState.workOrder?.currentStage ?: "measurement",
            onDismiss = { showAssignDialog = false },
            onSuccess = {
                showAssignDialog = false
                viewModel.loadWorkOrder(workOrderId)
                onAssigned()
            }
        )
    }
}

@Composable
private fun WorkOrderContent(
    workOrder: com.banghe.measure.domain.model.WorkOrder,
    paddingValues: PaddingValues,
    isAdmin: Boolean = false,
    onAssignClick: () -> Unit = {}
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(paddingValues)
            .verticalScroll(rememberScrollState())
    ) {
        // 顶部状态卡片
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.primaryContainer)
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = workOrder.workOrderNo,
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.onPrimaryContainer
                    )
                    StatusBadge(workOrder.status)
                }
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    text = workOrder.title,
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onPrimaryContainer
                )
            }
        }

        // 派工按钮（管理员 + 待处理状态）
        if (isAdmin && workOrder.status == "pending") {
            Button(
                onClick = onAssignClick,
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp, vertical = 8.dp)
            ) {
                Icon(Icons.Default.PersonAdd, contentDescription = "派工")
                Spacer(modifier = Modifier.width(8.dp))
                Text("派工")
            }
        }

        // 流程进度卡片
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp, vertical = 8.dp),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(
                        Icons.Default.Timeline,
                        contentDescription = null,
                        tint = Primary,
                        modifier = Modifier.size(18.dp)
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        text = "流程进度",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold
                    )
                }
                Spacer(modifier = Modifier.height(8.dp))
                StageProgressBar(
                    stages = buildStageItems(),
                    currentStageKey = workOrder.currentStage
                )
            }
        }

        // 基本信息卡片
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp, vertical = 8.dp),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                // 标题行
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(
                            Icons.Default.Info,
                            contentDescription = null,
                            tint = Success,
                            modifier = Modifier.size(16.dp)
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = "基本信息",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold
                        )
                    }
                    Text(
                        text = "已完成",
                        style = MaterialTheme.typography.labelSmall,
                        color = Success,
                        modifier = Modifier.background(
                            color = Success.copy(alpha = 0.1f),
                            shape = RoundedCornerShape(4.dp)
                        ).padding(horizontal = 8.dp, vertical = 2.dp)
                    )
                }

                HorizontalDivider(modifier = Modifier.padding(vertical = 12.dp))

                // 表单内容（两列布局）
                DeclarationGrid(workOrder)
            }
        }

        // 量尺信息（如果有）
        if (workOrder.measurement != null) {
            Spacer(modifier = Modifier.height(8.dp))
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(
                            Icons.Default.Build,
                            contentDescription = null,
                            tint = Primary,
                            modifier = Modifier.size(18.dp)
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = "量尺信息",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold
                        )
                    }
                    Spacer(modifier = Modifier.height(12.dp))
                    HorizontalDivider()
                    Spacer(modifier = Modifier.height(8.dp))
                    workOrder.measurement?.let { m ->
                        InfoRow("量尺员", m.measurerName ?: "未指派")
                        Spacer(modifier = Modifier.height(8.dp))
                        InfoRow("量尺时间", m.measuredAt ?: "未量尺")
                    }
                }
            }
        }

        // 设计信息（如果有）
        workOrder.designs?.firstOrNull()?.let { design ->
            Spacer(modifier = Modifier.height(8.dp))
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(
                            Icons.Default.Create,
                            contentDescription = null,
                            tint = Primary,
                            modifier = Modifier.size(18.dp)
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = "设计信息",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold
                        )
                    }
                    Spacer(modifier = Modifier.height(12.dp))
                    HorizontalDivider()
                    Spacer(modifier = Modifier.height(8.dp))
                    InfoRow("设计师", design.designerName ?: "未指派")
                    if (design.reviewerName != null) {
                        Spacer(modifier = Modifier.height(8.dp))
                        InfoRow("审核人", design.reviewerName)
                    }
                }
            }
        }

        // 施工信息（如果有）
        workOrder.constructions?.firstOrNull()?.let { construction ->
            Spacer(modifier = Modifier.height(8.dp))
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(
                            Icons.Default.Home,
                            contentDescription = null,
                            tint = Primary,
                            modifier = Modifier.size(18.dp)
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = "施工信息",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold
                        )
                    }
                    Spacer(modifier = Modifier.height(12.dp))
                    HorizontalDivider()
                    Spacer(modifier = Modifier.height(8.dp))
                    InfoRow("施工员", construction.constructorName ?: "未指派")
                }
            }
        }

        // 备注（如果有）
        workOrder.remarks?.takeIf { it.isNotEmpty() }?.let { remarks ->
            Spacer(modifier = Modifier.height(8.dp))
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(
                            Icons.Default.ChatBubbleOutline,
                            contentDescription = null,
                            tint = Primary,
                            modifier = Modifier.size(18.dp)
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = "备注",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold
                        )
                    }
                    Spacer(modifier = Modifier.height(12.dp))
                    remarks.forEach { remark ->
                        val content = remark["content"]?.toString()
                        if (!content.isNullOrBlank()) {
                            Text(
                                text = content,
                                style = MaterialTheme.typography.bodyMedium,
                                color = TextSecondary
                            )
                            Spacer(modifier = Modifier.height(4.dp))
                        }
                    }
                }
            }
        }

        Spacer(modifier = Modifier.height(24.dp))
    }
}

@Composable
private fun DeclarationGrid(workOrder: com.banghe.measure.domain.model.WorkOrder) {
    val fields = workOrder.formValues
    if (fields.isNullOrEmpty()) return

    // 两列布局：按表单配置顺序渲染所有字段
    fields.chunked(2).forEach { row ->
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            row.forEach { field ->
                DynamicFieldItem(field, modifier = Modifier.weight(1f))
            }
            if (row.size == 1) {
                Spacer(modifier = Modifier.weight(1f))
            }
        }
        Spacer(modifier = Modifier.height(12.dp))
    }
}

/** 动态渲染单个表单字段，根据 field_type 决定显示方式 */
@Composable
private fun DynamicFieldItem(
    field: com.banghe.measure.domain.model.FormFieldValue,
    modifier: Modifier = Modifier
) {
    val imageUrls = extractImageUrls(field)
    if (imageUrls.isNotEmpty()) {
        ImageFieldRow(field.fieldLabel, imageUrls, modifier = modifier)
        return
    }

    val displayValue = formatFieldValue(field)
    if (displayValue != null) {
        GridItem(field.fieldLabel, displayValue, modifier = modifier)
    }
}

/** 判断字段值是否为图片并提取 URL 列表 */
private fun extractImageUrls(field: com.banghe.measure.domain.model.FormFieldValue): List<String> {
    val type = field.fieldType
    val value = field.value
    val isImageType = type == "image" || type == "photo" || field.fieldKey.contains("photo", ignoreCase = true)
    return when {
        isImageType && value is List<*> && value.isNotEmpty() ->
            value.filterIsInstance<String>().filter { it.isNotBlank() && it.startsWith("http") }
        isImageType && value is String && value.isNotBlank() && value.startsWith("http") ->
            listOf(value)
        value is String && value.isNotBlank() && value.startsWith("http") &&
            (value.endsWith(".jpg", ignoreCase = true) || value.endsWith(".jpeg", ignoreCase = true) ||
                value.endsWith(".png", ignoreCase = true) || value.endsWith(".webp", ignoreCase = true)) ->
            listOf(value)
        value is List<*> && value.isNotEmpty() && value.any { it is String && it.toString().startsWith("http") } ->
            value.filterIsInstance<String>().filter { it.startsWith("http") }
        else -> emptyList()
    }
}

/** 格式化字段值为显示文本 */
private fun formatFieldValue(field: com.banghe.measure.domain.model.FormFieldValue): String? {
    val value = field.value ?: return null
    val type = field.fieldType
    return when {
        type == "datetime" || type == "date" -> {
            when (value) {
                is String -> formatDateTime(value)
                else -> value.toString()
            }
        }
        type == "client_select" -> {
            // 甲方选择：value 可能是对象 {id, name} 或字符串
            when (value) {
                is String -> value
                is Map<*, *> -> value["name"]?.toString() ?: value.toString()
                else -> value.toString()
            }
        }
        is List<*> -> if (value.isEmpty()) null else value.joinToString(", ")
        is String -> value.ifBlank { null }
        else -> value.toString()
    }
}

@Composable
private fun ImageFieldRow(
    label: String,
    urls: List<String>,
    modifier: Modifier = Modifier
) {
    var previewIndex by remember { mutableIntStateOf(-1) }

    Column(modifier = modifier) {
        Text(
            text = label,
            style = MaterialTheme.typography.bodySmall,
            color = TextMuted
        )
        Spacer(modifier = Modifier.height(6.dp))
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            urls.take(4).forEachIndexed { idx, url ->
                Card(
                    modifier = Modifier
                        .size(64.dp)
                        .clickable { previewIndex = idx },
                    shape = RoundedCornerShape(8.dp)
                ) {
                    coil.compose.AsyncImage(
                        model = url,
                        contentDescription = null,
                        modifier = Modifier.fillMaxSize(),
                        contentScale = androidx.compose.ui.layout.ContentScale.Crop
                    )
                }
            }
            if (urls.size > 4) {
                Box(
                    modifier = Modifier
                        .size(64.dp)
                        .clickable { previewIndex = 4 },
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = "+${urls.size - 4}",
                        style = MaterialTheme.typography.bodyMedium,
                        color = TextMuted
                    )
                }
            }
        }
    }

    if (previewIndex >= 0 && previewIndex < urls.size) {
        ImagePreviewDialog(
            urls = urls,
            initialIndex = previewIndex,
            onDismiss = { previewIndex = -1 }
        )
    }
}

@OptIn(ExperimentalFoundationApi::class)
@Composable
private fun ImagePreviewDialog(
    urls: List<String>,
    initialIndex: Int,
    onDismiss: () -> Unit
) {
    Dialog(
        onDismissRequest = onDismiss,
        properties = DialogProperties(usePlatformDefaultWidth = false, dismissOnBackPress = true, dismissOnClickOutside = true)
    ) {
        var currentPage by remember { mutableIntStateOf(initialIndex) }
        val pagerState = rememberPagerState(pageCount = { urls.size }, initialPage = { initialIndex })

        LaunchedEffect(pagerState.currentPage) {
            currentPage = pagerState.currentPage
        }

        Surface(
            modifier = Modifier.fillMaxSize(),
            color = MaterialTheme.colorScheme.surface.copy(alpha = 0.95f)
        ) {
            Box(
                modifier = Modifier.fillMaxSize(),
                contentAlignment = Alignment.Center
            ) {
                Column {
                    HorizontalPager(
                        state = pagerState,
                        modifier = Modifier
                            .weight(1f)
                            .fillMaxWidth()
                    ) { page ->
                        Box(
                            modifier = Modifier
                                .fillMaxSize()
                                .padding(8.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            AsyncImage(
                                model = urls[page],
                                contentDescription = null,
                                modifier = Modifier
                                    .fillMaxSize()
                                    .clip(RoundedCornerShape(12.dp)),
                                contentScale = ContentScale.Fit
                            )
                        }
                    }
                    // 底部指示器
                    if (urls.size > 1) {
                        Row(
                            modifier = Modifier
                                .align(Alignment.CenterHorizontally)
                                .padding(bottom = 16.dp),
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            urls.forEachIndexed { idx, _ ->
                                Box(
                                    modifier = Modifier
                                        .size(8.dp)
                                        .background(
                                            color = if (idx == currentPage) MaterialTheme.colorScheme.primary else Color.White.copy(alpha = 0.3f),
                                            shape = CircleShape
                                        )
                                )
                            }
                        }
                    }
                }
                // 关闭按钮
                IconButton(
                    onClick = onDismiss,
                    modifier = Modifier
                        .align(Alignment.TopEnd)
                        .padding(8.dp)
                ) {
                    Icon(
                        Icons.Default.Close,
                        contentDescription = "关闭",
                        tint = MaterialTheme.colorScheme.onSurface,
                        modifier = Modifier.size(28.dp)
                    )
                }
            }
        }
    }
}

private fun formatCustomValue(value: Any?): String? {
    return when (value) {
        null, "" -> null
        is List<*> -> if (value.isEmpty()) null else value.joinToString(", ")
        is String -> value
        else -> value.toString()
    }
}

@Composable
private fun GridItem(
    label: String,
    value: String?,
    modifier: Modifier = Modifier
) {
    Column(modifier = modifier) {
        Text(
            text = label,
            style = MaterialTheme.typography.bodySmall,
            color = TextMuted
        )
        Spacer(modifier = Modifier.height(4.dp))
        Text(
            text = value ?: "-",
            style = MaterialTheme.typography.bodyMedium,
            fontWeight = FontWeight.Medium
        )
    }
}

@Composable
private fun InfoRow(label: String, value: String) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Text(
            text = label,
            style = MaterialTheme.typography.bodyMedium,
            color = TextMuted
        )
        Text(
            text = value,
            style = MaterialTheme.typography.bodyMedium,
            fontWeight = FontWeight.Medium
        )
    }
}

@Composable
private fun StatusBadge(status: String) {
    val (label, color) = when (status) {
        "pending" -> "待处理" to Warning
        "in_progress" -> "进行中" to Primary
        "completed" -> "已完成" to Success
        "overdue" -> "已逾期" to Error
        "cancelled" -> "已取消" to TextMuted
        else -> status to TextSecondary
    }

    Surface(
        shape = MaterialTheme.shapes.small,
        color = color.copy(alpha = 0.15f)
    ) {
        Text(
            text = label,
            style = MaterialTheme.typography.labelSmall,
            color = color,
            fontWeight = FontWeight.Medium,
            modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
        )
    }
}

private fun buildStageItems(): List<StageItem> {
    return listOf(
        StageItem("declaration", "申报"),
        StageItem("approval", "审批"),
        StageItem("assignment", "派工"),
        StageItem("measurement", "量尺"),
        StageItem("design", "设计"),
        StageItem("production", "生产"),
        StageItem("construction", "施工"),
        StageItem("finance", "财务"),
        StageItem("archive", "归档")
    )
}

private fun formatDateTime(dateTime: String): String {
    return try {
        if (dateTime.contains("T")) {
            dateTime.substring(0, 16).replace("T", " ")
        } else if (dateTime.length > 10) {
            dateTime.substring(0, 16)
        } else {
            dateTime
        }
    } catch (e: Exception) {
        dateTime
    }
}