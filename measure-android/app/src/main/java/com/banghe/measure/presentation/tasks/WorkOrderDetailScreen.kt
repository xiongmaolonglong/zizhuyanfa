package com.banghe.measure.presentation.tasks

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
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
    // 表单字段映射：field_key → (label, type)
    val formFieldMap = buildMap<String, Pair<String, String>> {
        workOrder.formFields?.forEach { f ->
            put(f.fieldKey, f.fieldLabel to f.fieldType)
        }
    }

    val items = listOfNotNull(
        "甲方企业" to (workOrder.clientName ?: "-"),
        "店铺名字" to workOrder.title,
        "活动项目" to (workOrder.projectType ?: "-"),
        "项目地址" to (workOrder.address ?: "-"),
        "联系人" to (workOrder.contactName ?: "-"),
        "联系电话" to (workOrder.contactPhone ?: "-"),
        "需求描述" to (workOrder.description ?: "-"),
        "截止时间" to workOrder.deadline?.let { formatDateTime(it) },
        "申报人" to workOrder.creatorName?.let { "由 $it 申报" }
    )

    // 两列布局
    items.chunked(2).forEach { row ->
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            row.forEach { (label, value) ->
                GridItem(label, value, modifier = Modifier.weight(1f))
            }
            if (row.size == 1) {
                Spacer(modifier = Modifier.weight(1f))
            }
        }
        Spacer(modifier = Modifier.height(12.dp))
    }

    // 自定义表单字段（按表单配置顺序渲染）
    workOrder.customData?.let { customData ->
        val customEntries = mutableListOf<Triple<String, String, Any?>>()
        val remaining = customData.toMutableMap()

        // 先按表单配置的顺序渲染
        workOrder.formFields?.forEach { field ->
            remaining[field.fieldKey]?.let { value ->
                if (value != null) {
                    customEntries.add(Triple(field.fieldKey, field.fieldLabel, value))
                    remaining.remove(field.fieldKey)
                }
            }
        }
        // 再渲染未在配置中的字段
        remaining.forEach { (key, value) ->
            if (value != null) {
                customEntries.add(Triple(key, key.replace("_", ""), value))
            }
        }

        if (customEntries.isNotEmpty()) {
            Spacer(modifier = Modifier.height(12.dp))
            HorizontalDivider(modifier = Modifier.padding(vertical = 4.dp))
            Spacer(modifier = Modifier.height(8.dp))

            customEntries.forEach { (key, label, value) ->
                val type = formFieldMap[key]?.second ?: ""
                when {
                    type == "image" && value is List<*> && value.isNotEmpty() ->
                        ImageFieldRow(label, value.filterIsInstance<String>(), modifier = Modifier.fillMaxWidth())
                    else -> {
                        val displayValue = formatCustomValue(value)
                        if (displayValue != null) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.spacedBy(16.dp)
                            ) {
                                GridItem(label, displayValue, modifier = Modifier.weight(1f))
                                Spacer(modifier = Modifier.weight(1f))
                            }
                            Spacer(modifier = Modifier.height(8.dp))
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun ImageFieldRow(
    label: String,
    urls: List<String>,
    modifier: Modifier = Modifier
) {
    Column(modifier = modifier) {
        Text(
            text = label,
            style = MaterialTheme.typography.bodySmall,
            color = TextMuted
        )
        Spacer(modifier = Modifier.height(6.dp))
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            urls.take(4).forEach { url ->
                Card(
                    modifier = Modifier.size(64.dp),
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
                    modifier = Modifier.size(64.dp),
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