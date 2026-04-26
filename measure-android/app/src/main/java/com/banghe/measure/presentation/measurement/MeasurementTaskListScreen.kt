package com.banghe.measure.presentation.measurement

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
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
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.banghe.measure.core.theme.*
import com.banghe.measure.domain.model.WorkOrder
import com.banghe.measure.presentation.common.ActionMenu
import com.banghe.measure.presentation.common.MenuAction

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MeasurementTaskListScreen(
    viewModel: MeasurementTaskListViewModel = viewModel(),
    onBack: () -> Unit = {},
    onTaskClick: (Int) -> Unit = {},
    onNewMeasurement: () -> Unit = {}
) {
    val uiState by viewModel.uiState.collectAsState()

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("量尺任务", fontWeight = FontWeight.Bold) },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "返回")
                    }
                }
            )
        },
        floatingActionButton = {
            FloatingActionButton(
                onClick = onNewMeasurement,
                containerColor = Primary
            ) {
                Icon(Icons.Default.Add, contentDescription = "新建量尺")
            }
        }
    ) { paddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .padding(horizontal = 16.dp)
        ) {
            // 统计摘要行
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(vertical = 8.dp),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                StatChip(
                    label = "待量尺",
                    count = uiState.stats.pendingCount,
                    color = Warning
                )
                StatChip(
                    label = "已提交",
                    count = uiState.stats.submittedCount,
                    color = Primary
                )
                StatChip(
                    label = "已完成",
                    count = uiState.stats.completedCount,
                    color = Success
                )
            }

            // TabRow
            TabRow(
                selectedTabIndex = uiState.currentTab.ordinal,
                containerColor = Surface,
                contentColor = TextPrimary
            ) {
                MeasurementTab.entries.forEach { tab ->
                    Tab(
                        selected = uiState.currentTab == tab,
                        onClick = { viewModel.selectTab(tab) },
                        text = { Text(tab.label) }
                    )
                }
            }

            Spacer(modifier = Modifier.height(8.dp))

            // 内容区域
            when {
                uiState.isLoading && uiState.tasks.isEmpty() -> {
                    Box(
                        modifier = Modifier.weight(1f),
                        contentAlignment = Alignment.Center
                    ) {
                        CircularProgressIndicator()
                    }
                }

                uiState.error != null && uiState.tasks.isEmpty() -> {
                    Box(
                        modifier = Modifier.weight(1f),
                        contentAlignment = Alignment.Center
                    ) {
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            Text(uiState.error!!, color = Error)
                            Spacer(modifier = Modifier.height(12.dp))
                            Button(onClick = { viewModel.loadTasks(refresh = true) }) {
                                Text("重试")
                            }
                        }
                    }
                }

                uiState.tasks.isEmpty() -> {
                    Box(
                        modifier = Modifier.weight(1f),
                        contentAlignment = Alignment.Center
                    ) {
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            Text(
                                text = "暂无${uiState.currentTab.label}任务",
                                color = TextMuted,
                                style = MaterialTheme.typography.bodyLarge
                            )
                        }
                    }
                }

                else -> {
                    LazyColumn(
                        modifier = Modifier.weight(1f),
                        verticalArrangement = Arrangement.spacedBy(8.dp),
                        contentPadding = PaddingValues(vertical = 8.dp)
                    ) {
                        items(uiState.tasks, key = { it.id }) { task ->
                            MeasurementTaskCard(
                                task = task,
                                currentTab = uiState.currentTab,
                                onClick = { onTaskClick(task.id) },
                                onStartMeasurement = { onTaskClick(task.id) }
                            )
                        }

                        if (uiState.hasMore && !uiState.isLoading) {
                            item {
                                Box(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .padding(vertical = 16.dp),
                                    contentAlignment = Alignment.Center
                                ) {
                                    TextButton(onClick = { viewModel.loadTasks() }) {
                                        Text("加载更多")
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun StatChip(
    label: String,
    count: Int,
    color: Color
) {
    Box(
        modifier = Modifier
            .background(
                color.copy(alpha = 0.12f),
                RoundedCornerShape(16.dp)
            )
            .padding(horizontal = 12.dp, vertical = 6.dp)
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Text(
                text = label,
                style = MaterialTheme.typography.bodySmall,
                color = color
            )
            Spacer(modifier = Modifier.width(4.dp))
            Text(
                text = count.toString(),
                style = MaterialTheme.typography.bodySmall,
                color = color,
                fontWeight = FontWeight.Bold
            )
        }
    }
}

@Composable
private fun MeasurementTaskCard(
    task: WorkOrder,
    currentTab: MeasurementTab,
    onClick: () -> Unit,
    onStartMeasurement: () -> Unit
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        onClick = onClick,
        colors = CardDefaults.cardColors(containerColor = SurfaceVariant)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp)
        ) {
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
                // 根据状态显示不同操作菜单
                ActionMenu(
                    actions = when (currentTab) {
                        MeasurementTab.Pending -> listOf(
                            MenuAction(
                                label = "开始量尺",
                                icon = Icons.Default.Edit,
                                onClick = onStartMeasurement
                            ),
                            MenuAction(
                                label = "查看详情",
                                icon = Icons.Default.Visibility,
                                onClick = onClick
                            )
                        )
                        MeasurementTab.Submitted -> listOf(
                            MenuAction(
                                label = "查看详情",
                                icon = Icons.Default.Visibility,
                                onClick = onClick
                            )
                        )
                        MeasurementTab.Completed -> listOf(
                            MenuAction(
                                label = "查看详情",
                                icon = Icons.Default.Visibility,
                                onClick = onClick
                            )
                        )
                    }
                )
            }

            Spacer(modifier = Modifier.height(8.dp))

            Text(
                text = task.title,
                style = MaterialTheme.typography.bodyLarge,
                fontWeight = FontWeight.Medium,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis
            )

            if (task.address != null) {
                Spacer(modifier = Modifier.height(4.dp))
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(
                        Icons.Default.LocationOn,
                        contentDescription = null,
                        modifier = Modifier.size(14.dp),
                        tint = TextMuted
                    )
                    Spacer(modifier = Modifier.width(4.dp))
                    Text(
                        text = task.address,
                        style = MaterialTheme.typography.bodySmall,
                        color = TextMuted,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                }
            }

            if (task.deadline != null) {
                Spacer(modifier = Modifier.height(4.dp))
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(
                        Icons.Default.HourglassTop,
                        contentDescription = null,
                        modifier = Modifier.size(14.dp),
                        tint = TextMuted
                    )
                    Spacer(modifier = Modifier.width(4.dp))
                    Text(
                        text = "截止: ${task.deadline}",
                        style = MaterialTheme.typography.bodySmall,
                        color = TextMuted
                    )
                }
            }
        }
    }
}