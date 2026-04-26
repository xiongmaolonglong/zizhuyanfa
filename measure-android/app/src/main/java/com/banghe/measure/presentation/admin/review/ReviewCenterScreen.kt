package com.banghe.measure.presentation.admin.review

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.banghe.measure.core.theme.*
import com.banghe.measure.presentation.common.ActionMenu
import com.banghe.measure.presentation.common.MenuAction

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ReviewCenterScreen(
    viewModel: ReviewCenterViewModel = viewModel(),
    onBack: () -> Unit = {}
) {
    val uiState by viewModel.uiState.collectAsState()

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("审批中心") },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "返回")
                    }
                }
            )
        }
    ) { padding ->
        Column(modifier = Modifier.fillMaxSize().padding(padding)) {
            // 统计摘要
            StatsSummary(stats = uiState.stats)

            // Tab 切换
            val tabs = ReviewTab.entries
            ScrollableTabRow(
                selectedTabIndex = tabs.indexOf(uiState.currentTab),
                edgePadding = 16.dp,
                divider = {}
            ) {
                tabs.forEach { tab ->
                    Tab(
                        selected = uiState.currentTab == tab,
                        onClick = { viewModel.selectTab(tab) },
                        text = {
                            val count = when (tab) {
                                ReviewTab.Pending -> uiState.stats.pendingCount
                                ReviewTab.Approved -> uiState.stats.approvedCount
                                ReviewTab.Rejected -> uiState.stats.rejectedCount
                            }
                            Text("${tab.label}($count)")
                        }
                    )
                }
            }

            HorizontalDivider()

            when {
                uiState.isLoading -> {
                    Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                        CircularProgressIndicator()
                    }
                }
                uiState.tasks.isEmpty() -> {
                    Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                        Text("暂无${uiState.currentTab.label}任务", color = TextMuted)
                    }
                }
                else -> {
                    LazyColumn(
                        modifier = Modifier.fillMaxSize(),
                        verticalArrangement = Arrangement.spacedBy(8.dp),
                        contentPadding = PaddingValues(horizontal = 16.dp, vertical = 8.dp)
                    ) {
                        items(uiState.tasks, key = { it.id }) { task ->
                            ReviewTaskCard(task, viewModel = viewModel)
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun StatsSummary(stats: ReviewStats) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 12.dp),
        horizontalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        StatChip(label = "待审批", count = stats.pendingCount, color = Warning)
        StatChip(label = "已通过", count = stats.approvedCount, color = Success)
        StatChip(label = "已驳回", count = stats.rejectedCount, color = Error)
    }
}

@Composable
private fun RowScope.StatChip(label: String, count: Int, color: Color) {
    Surface(
        modifier = Modifier.weight(1f),
        shape = MaterialTheme.shapes.medium,
        color = color.copy(alpha = 0.1f)
    ) {
        Column(
            modifier = Modifier.padding(vertical = 10.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text(
                text = count.toString(),
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold,
                color = color
            )
            Spacer(modifier = Modifier.height(2.dp))
            Text(
                text = label,
                style = MaterialTheme.typography.labelSmall,
                color = color
            )
        }
    }
}

@Composable
private fun ReviewTaskCard(task: ReviewTask, viewModel: ReviewCenterViewModel) {
    var showRejectDialog by remember { mutableStateOf(false) }
    var rejectReason by remember { mutableStateOf("") }

    val isPending = task.status == "pending"

    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = task.workOrderNo,
                    style = MaterialTheme.typography.labelMedium,
                    color = TextMuted
                )
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Surface(
                        shape = MaterialTheme.shapes.extraSmall,
                        color = when (task.type) {
                            ReviewType.MEASUREMENT -> Primary
                            ReviewType.INTERNAL_VERIFICATION -> Success
                        }
                    ) {
                        Text(
                            text = if (task.type == ReviewType.MEASUREMENT) "测量审核" else "内部验收",
                            modifier = Modifier.padding(horizontal = 8.dp, vertical = 2.dp),
                            style = MaterialTheme.typography.labelSmall,
                            color = MaterialTheme.colorScheme.onPrimary
                        )
                    }

                    if (isPending) {
                        ActionMenu(
                            actions = listOf(
                                MenuAction(
                                    label = "通过",
                                    icon = Icons.Default.Check,
                                    onClick = { viewModel.approveMeasurement(task.id, null) }
                                ),
                                MenuAction(
                                    label = "驳回",
                                    icon = Icons.Default.Close,
                                    onClick = { showRejectDialog = true }
                                ),
                                MenuAction(
                                    label = "查看详情",
                                    icon = Icons.Default.Info,
                                    onClick = { /* TODO: 导航到详情页 */ }
                                )
                            )
                        )
                    } else {
                        TextButton(onClick = { /* TODO: 导航到详情页 */ }) {
                            Icon(Icons.Default.Info, contentDescription = null, modifier = Modifier.size(16.dp))
                            Spacer(modifier = Modifier.width(4.dp))
                            Text("详情")
                        }
                    }
                }
            }
            Spacer(modifier = Modifier.height(8.dp))
            Text(
                task.title ?: "",
                style = MaterialTheme.typography.bodyMedium,
                fontWeight = FontWeight.Medium,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis
            )
            if (task.clientName != null) {
                Text("客户: ${task.clientName}", style = MaterialTheme.typography.bodySmall, color = TextMuted)
            }
            if (task.submitterName != null) {
                Text("提交人: ${task.submitterName}", style = MaterialTheme.typography.bodySmall, color = TextMuted)
            }
            if (task.submittedAt != null) {
                Text("提交时间: ${task.submittedAt}", style = MaterialTheme.typography.bodySmall, color = TextMuted)
            }
        }
    }

    if (showRejectDialog) {
        AlertDialog(
            onDismissRequest = { showRejectDialog = false },
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
                            viewModel.rejectMeasurement(task.id, rejectReason)
                            showRejectDialog = false
                        }
                    },
                    enabled = rejectReason.isNotBlank()
                ) { Text("确认驳回") }
            },
            dismissButton = {
                TextButton(onClick = { showRejectDialog = false }) { Text("取消") }
            }
        )
    }
}
