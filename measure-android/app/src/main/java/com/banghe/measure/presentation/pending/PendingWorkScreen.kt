package com.banghe.measure.presentation.pending

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.material3.pulltorefresh.PullToRefreshBox
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import androidx.lifecycle.viewmodel.compose.viewModel
import com.banghe.measure.core.App
import com.banghe.measure.core.constants.StageConstants
import com.banghe.measure.core.theme.*
import com.banghe.measure.domain.model.WorkOrder
import com.banghe.measure.presentation.common.ActionMenu
import com.banghe.measure.presentation.common.MenuAction
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import kotlinx.coroutines.withTimeoutOrNull

data class PendingGroup(
    val stage: String,
    val label: String,
    val tasks: List<WorkOrder>
)

data class PendingWorkUiState(
    val groups: List<PendingGroup> = emptyList(),
    val isLoading: Boolean = false,
    val isRefreshing: Boolean = false,
    val error: String? = null,
    val totalPending: Int = 0,
    val approvalCount: Int = 0,
    val assignmentCount: Int = 0,
    val measurementCount: Int = 0,
    val constructionCount: Int = 0
)

class PendingWorkViewModel : ViewModel() {
    private val _uiState = MutableStateFlow(PendingWorkUiState())
    val uiState: StateFlow<PendingWorkUiState> = _uiState.asStateFlow()

    init {
        loadAll()
    }

    fun loadAll() {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true) }

            // 并行加载各阶段待处理任务
            val approval = loadTasksByStage("approval")
            val assignment = loadTasksByStage("assignment")
            val measurement = loadTasksByStage("measurement")
            val construction = loadTasksByStage("construction")

            val groups = mutableListOf<PendingGroup>()
            if (approval.isNotEmpty()) {
                groups.add(PendingGroup("approval", "待审批", approval))
            }
            if (assignment.isNotEmpty()) {
                groups.add(PendingGroup("assignment", "待派工", assignment))
            }
            if (measurement.isNotEmpty()) {
                groups.add(PendingGroup("measurement", "量尺中", measurement))
            }
            if (construction.isNotEmpty()) {
                groups.add(PendingGroup("construction", "施工中", construction))
            }

            _uiState.update {
                it.copy(
                    groups = groups,
                    totalPending = approval.size + assignment.size + measurement.size + construction.size,
                    approvalCount = approval.size,
                    assignmentCount = assignment.size,
                    measurementCount = measurement.size,
                    constructionCount = construction.size,
                    isLoading = false,
                    isRefreshing = false
                )
            }
        }
    }

    private suspend fun loadTasksByStage(stage: String): List<WorkOrder> {
        return withTimeoutOrNull(10000) {
            App.instance.taskRepository.getTasks(stage = stage, limit = 50).getOrNull() ?: emptyList()
        } ?: emptyList()
    }

    fun refresh() {
        _uiState.update { it.copy(isRefreshing = true) }
        loadAll()
    }

    fun approve(workOrderId: Int, onResult: (Boolean) -> Unit) {
        viewModelScope.launch {
            val result = withTimeoutOrNull(10000) {
                App.instance.measurementRepository.approveMeasurement(workOrderId, null)
            }
            if (result?.isSuccess == true) {
                loadAll()
                onResult(true)
            } else {
                onResult(false)
            }
        }
    }

    fun reject(workOrderId: Int, reason: String, onResult: (Boolean) -> Unit) {
        viewModelScope.launch {
            val result = withTimeoutOrNull(10000) {
                App.instance.measurementRepository.rejectMeasurement(workOrderId, reason)
            }
            if (result?.isSuccess == true) {
                loadAll()
                onResult(true)
            } else {
                onResult(false)
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun PendingWorkScreen(
    viewModel: PendingWorkViewModel = viewModel(),
    onBack: () -> Unit = {},
    onNavigateToDetail: (Int) -> Unit = {},
    onNavigateToAssign: (Int) -> Unit = {},
    onNavigateToMeasurement: (Int) -> Unit = {},
    onNavigateToConstruction: (Int) -> Unit = {}
) {
    val uiState by viewModel.uiState.collectAsState()

    var showRejectDialog by remember { mutableStateOf<Int?>(null) }
    var rejectReason by remember { mutableStateOf("") }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("待处理工作台", fontWeight = FontWeight.Bold) },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = Surface),
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "返回")
                    }
                }
            )
        },
        containerColor = Surface
    ) { padding ->
        Column(modifier = Modifier.padding(padding).fillMaxSize()) {
            // 统计摘要
            Row(
                modifier = Modifier.fillMaxWidth().padding(16.dp),
                horizontalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                StatChip("待审批", uiState.approvalCount, Primary)
                StatChip("待派工", uiState.assignmentCount, Warning)
                StatChip("量尺中", uiState.measurementCount, Success)
                StatChip("施工中", uiState.constructionCount, Error)
            }

            // 内容
            PullToRefreshBox(
                isRefreshing = uiState.isRefreshing,
                onRefresh = { viewModel.refresh() },
                modifier = Modifier.fillMaxSize()
            ) {
                when {
                    uiState.isLoading && uiState.groups.isEmpty() -> {
                        Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                            CircularProgressIndicator()
                        }
                    }
                    uiState.groups.isEmpty() -> {
                        Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                            Text("暂无待处理任务", color = TextMuted)
                        }
                    }
                    else -> {
                        LazyColumn(
                            modifier = Modifier.fillMaxSize(),
                            contentPadding = PaddingValues(16.dp),
                            verticalArrangement = Arrangement.spacedBy(16.dp)
                        ) {
                            uiState.groups.forEach { group ->
                                // 分组标题
                                item {
                                    Row(
                                        verticalAlignment = Alignment.CenterVertically,
                                        modifier = Modifier.padding(vertical = 4.dp)
                                    ) {
                                        Text(
                                            text = group.label,
                                            fontSize = 16.sp,
                                            fontWeight = FontWeight.Bold,
                                            color = TextPrimary
                                        )
                                        Spacer(modifier = Modifier.width(8.dp))
                                        Surface(
                                            shape = RoundedCornerShape(12.dp),
                                            color = Primary.copy(alpha = 0.1f)
                                        ) {
                                            Text(
                                                text = group.tasks.size.toString(),
                                                modifier = Modifier.padding(horizontal = 8.dp, vertical = 2.dp),
                                                fontSize = 12.sp,
                                                color = Primary
                                            )
                                        }
                                    }
                                }

                                // 分组内的任务卡片
                                items(group.tasks, key = { "${group.stage}_${it.id}" }) { task ->
                                    PendingTaskCard(
                                        task = task,
                                        stage = group.stage,
                                        onApprove = {
                                            viewModel.approve(task.id) { success ->
                                                // 可以显示 toast
                                            }
                                        },
                                        onReject = { showRejectDialog = task.id },
                                        onAssign = { onNavigateToAssign(task.id) },
                                        onViewDetail = { onNavigateToDetail(task.id) },
                                        onStartMeasurement = { onNavigateToMeasurement(task.id) },
                                        onStartConstruction = { onNavigateToConstruction(task.id) }
                                    )
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    // 驳回对话框
    showRejectDialog?.let { workOrderId ->
        AlertDialog(
            onDismissRequest = { showRejectDialog = null },
            title = { Text("驳回原因") },
            text = {
                OutlinedTextField(
                    value = rejectReason,
                    onValueChange = { rejectReason = it },
                    label = { Text("请输入驳回原因") },
                    modifier = Modifier.fillMaxWidth()
                )
            },
            confirmButton = {
                TextButton(
                    onClick = {
                        if (rejectReason.isNotBlank()) {
                            viewModel.reject(workOrderId, rejectReason) { }
                            showRejectDialog = null
                            rejectReason = ""
                        }
                    },
                    enabled = rejectReason.isNotBlank()
                ) { Text("确认驳回") }
            },
            dismissButton = {
                TextButton(onClick = { showRejectDialog = null }) { Text("取消") }
            }
        )
    }
}

@Composable
private fun StatChip(label: String, count: Int, color: Color) {
    Surface(
        shape = RoundedCornerShape(8.dp),
        color = color.copy(alpha = 0.1f)
    ) {
        Row(
            modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(label, fontSize = 12.sp, color = color)
            Spacer(modifier = Modifier.width(6.dp))
            Text(count.toString(), fontSize = 14.sp, fontWeight = FontWeight.Bold, color = color)
        }
    }
}

@Composable
private fun PendingTaskCard(
    task: WorkOrder,
    stage: String,
    onApprove: () -> Unit,
    onReject: () -> Unit,
    onAssign: () -> Unit,
    onViewDetail: () -> Unit,
    onStartMeasurement: () -> Unit,
    onStartConstruction: () -> Unit
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
        shape = RoundedCornerShape(12.dp)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth().padding(14.dp),
            verticalAlignment = Alignment.Top
        ) {
            Column(modifier = Modifier.weight(1f)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(task.workOrderNo, fontSize = 12.sp, color = TextMuted)
                    Spacer(modifier = Modifier.width(8.dp))
                    // 阶段标签
                    Surface(
                        shape = RoundedCornerShape(4.dp),
                        color = getStageColor(stage).copy(alpha = 0.15f)
                    ) {
                        Text(
                            text = StageConstants.getStageLabel(stage),
                            modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp),
                            fontSize = 11.sp,
                            color = getStageColor(stage)
                        )
                    }
                }
                Spacer(modifier = Modifier.height(6.dp))
                Text(
                    text = task.title,
                    fontSize = 14.sp,
                    fontWeight = FontWeight.Medium,
                    maxLines = 2,
                    overflow = TextOverflow.Ellipsis
                )
                if (!task.address.isNullOrBlank()) {
                    Spacer(modifier = Modifier.height(4.dp))
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Default.LocationOn, contentDescription = null, modifier = Modifier.size(14.dp), tint = TextMuted)
                        Spacer(modifier = Modifier.width(4.dp))
                        Text(task.address ?: "", fontSize = 12.sp, color = TextMuted, maxLines = 1)
                    }
                }
                if (!task.deadline.isNullOrBlank()) {
                    Spacer(modifier = Modifier.height(2.dp))
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Default.Schedule, contentDescription = null, modifier = Modifier.size(14.dp), tint = TextMuted)
                        Spacer(modifier = Modifier.width(4.dp))
                        Text("截止: ${task.deadline ?: ""}", fontSize = 11.sp, color = TextMuted)
                    }
                }
            }

            // 按阶段显示不同操作菜单
            val actions = when (stage) {
                "approval" -> listOf(
                    MenuAction("通过", Icons.Default.Check, onApprove),
                    MenuAction("驳回", Icons.Default.Close, onReject),
                    MenuAction("详情", Icons.Default.Visibility, onViewDetail)
                )
                "assignment" -> listOf(
                    MenuAction("派工", Icons.Default.PersonAdd, onAssign),
                    MenuAction("详情", Icons.Default.Visibility, onViewDetail)
                )
                "measurement" -> listOf(
                    MenuAction("开始量尺", Icons.Default.Edit, onStartMeasurement),
                    MenuAction("详情", Icons.Default.Visibility, onViewDetail)
                )
                "construction" -> listOf(
                    MenuAction("开始施工", Icons.Default.Build, onStartConstruction),
                    MenuAction("详情", Icons.Default.Visibility, onViewDetail)
                )
                else -> listOf(
                    MenuAction("详情", Icons.Default.Visibility, onViewDetail)
                )
            }
            ActionMenu(actions = actions)
        }
    }
}

@Composable
private fun getStageColor(stage: String): Color = when (stage) {
    "approval" -> Primary
    "assignment" -> Warning
    "measurement" -> Success
    "construction" -> Error
    else -> TextMuted
}
