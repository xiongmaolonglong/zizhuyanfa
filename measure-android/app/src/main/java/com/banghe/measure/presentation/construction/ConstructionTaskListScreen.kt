package com.banghe.measure.presentation.construction

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.material3.pulltorefresh.PullToRefreshBox
import androidx.compose.material3.pulltorefresh.rememberPullToRefreshState
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.banghe.measure.core.constants.StageConstants
import com.banghe.measure.core.theme.*
import com.banghe.measure.domain.model.WorkOrder
import com.banghe.measure.presentation.common.ActionMenu
import com.banghe.measure.presentation.common.MenuAction

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ConstructionTaskListScreen(
    viewModel: ConstructionTaskListViewModel = viewModel(),
    onBack: () -> Unit = {},
    onTaskClick: (Int) -> Unit = {},
    onStartConstruction: (Int) -> Unit = {}
) {
    val uiState by viewModel.uiState.collectAsState()

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("施工任务", fontWeight = FontWeight.Bold) },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "返回")
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
            // 统计摘要行
            StatsSummaryRow(
                stats = uiState.stats,
                modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp)
            )

            // Tab Row
            TabRow(selectedTabIndex = uiState.currentTab.ordinal) {
                ConstructionTab.entries.forEach { tab ->
                    Tab(
                        selected = uiState.currentTab == tab,
                        onClick = { viewModel.selectTab(tab) },
                        text = { Text(tab.label) }
                    )
                }
            }

            // 内容区域 - 使用 PullToRefreshBox
            PullToRefreshBox(
                isRefreshing = uiState.isRefreshing,
                onRefresh = { viewModel.refresh() },
                modifier = Modifier.fillMaxSize()
            ) {
                when {
                    uiState.isLoading && uiState.tasks.isEmpty() -> {
                        Box(
                            modifier = Modifier.fillMaxSize(),
                            contentAlignment = Alignment.Center
                        ) {
                            CircularProgressIndicator()
                        }
                    }

                    uiState.error != null && uiState.tasks.isEmpty() -> {
                        Box(
                            modifier = Modifier.fillMaxSize(),
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
                            modifier = Modifier.fillMaxSize(),
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
                            modifier = Modifier.fillMaxSize(),
                            contentPadding = PaddingValues(16.dp),
                            verticalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            items(uiState.tasks, key = { it.id }) { task ->
                                ConstructionTaskCard(
                                    task = task,
                                    currentTab = uiState.currentTab,
                                    onClick = { onTaskClick(task.id) },
                                    onStartConstruction = { onStartConstruction(task.id) }
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
}

@Composable
private fun StatsSummaryRow(
    stats: ConstructionStats,
    modifier: Modifier = Modifier
) {
    Row(
        modifier = modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        StatChip(
            label = "待施工",
            count = stats.pendingCount,
            color = Warning,
            modifier = Modifier.weight(1f)
        )
        StatChip(
            label = "施工中",
            count = stats.inProgressCount,
            color = Primary,
            modifier = Modifier.weight(1f)
        )
        StatChip(
            label = "已完成",
            count = stats.completedCount,
            color = Success,
            modifier = Modifier.weight(1f)
        )
    }
}

@Composable
private fun StatChip(
    label: String,
    count: Int,
    color: Color,
    modifier: Modifier = Modifier
) {
    Row(
        modifier = modifier
            .clip(RoundedCornerShape(8.dp))
            .background(color.copy(alpha = 0.1f))
            .padding(horizontal = 12.dp, vertical = 8.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.Center
    ) {
        Text(
            text = "$label ",
            style = MaterialTheme.typography.bodySmall,
            color = color
        )
        Text(
            text = count.toString(),
            style = MaterialTheme.typography.titleMedium,
            fontWeight = FontWeight.Bold,
            color = color
        )
    }
}

@Composable
private fun ConstructionTaskCard(
    task: WorkOrder,
    currentTab: ConstructionTab,
    onClick: () -> Unit,
    onStartConstruction: () -> Unit
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        onClick = onClick,
        colors = CardDefaults.cardColors(containerColor = CardBackground),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.Top
        ) {
            Column(
                modifier = Modifier.weight(1f)
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Text(
                        text = task.workOrderNo,
                        style = MaterialTheme.typography.labelMedium,
                        color = TextMuted
                    )
                    StatusBadge(status = task.status)
                }

                Spacer(modifier = Modifier.height(8.dp))

                Text(
                    text = task.title,
                    style = MaterialTheme.typography.bodyLarge,
                    fontWeight = FontWeight.Medium,
                    maxLines = 2,
                    overflow = TextOverflow.Ellipsis
                )

                if (!task.address.isNullOrBlank()) {
                    Spacer(modifier = Modifier.height(6.dp))
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

                if (!task.deadline.isNullOrBlank()) {
                    Spacer(modifier = Modifier.height(4.dp))
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(
                            Icons.Default.Schedule,
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

            // 操作菜单
            val actions = remember(currentTab, task.id) {
                mutableListOf<MenuAction>().apply {
                    when (currentTab) {
                        ConstructionTab.Pending -> {
                            add(
                                MenuAction(
                                    label = "开始施工",
                                    icon = Icons.Default.PlayArrow,
                                    onClick = onStartConstruction
                                )
                            )
                            add(
                                MenuAction(
                                    label = "查看详情",
                                    icon = Icons.Default.Description,
                                    onClick = onClick
                                )
                            )
                        }
                        ConstructionTab.InProgress,
                        ConstructionTab.Completed,
                        ConstructionTab.Accepted -> {
                            add(
                                MenuAction(
                                    label = "查看详情",
                                    icon = Icons.Default.Description,
                                    onClick = onClick
                                )
                            )
                        }
                    }
                }
            }

            ActionMenu(actions = actions)
        }
    }
}

@Composable
private fun StatusBadge(status: String?) {
    val label = StageConstants.getStatusLabel(status ?: "")
    val color = getStatusColor(status)

    Box(
        modifier = Modifier
            .background(
                color.copy(alpha = 0.12f),
                RoundedCornerShape(4.dp)
            )
            .padding(horizontal = 8.dp, vertical = 2.dp)
    ) {
        Text(
            text = label,
            style = MaterialTheme.typography.labelSmall,
            color = color,
            fontWeight = FontWeight.Medium
        )
    }
}
