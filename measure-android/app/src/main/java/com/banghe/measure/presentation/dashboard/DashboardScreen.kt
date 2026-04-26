package com.banghe.measure.presentation.dashboard

import androidx.compose.animation.core.*
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.fadeIn
import androidx.compose.animation.slideInVertically
import androidx.compose.foundation.ExperimentalFoundationApi
import androidx.compose.foundation.background
import androidx.compose.foundation.combinedClickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.material3.pulltorefresh.PullToRefreshBox
import androidx.compose.material3.pulltorefresh.rememberPullToRefreshState
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.hapticfeedback.HapticFeedbackType
import androidx.compose.ui.platform.LocalHapticFeedback
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.banghe.measure.core.theme.*
import com.banghe.measure.core.network.ConnectionState
import com.banghe.measure.core.network.observeConnectivity
import com.banghe.measure.core.App
import com.banghe.measure.domain.model.WorkOrderStatus
import java.time.LocalDate
import androidx.compose.ui.tooling.preview.Preview

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DashboardScreen(
    viewModel: DashboardViewModel = viewModel(),
    onNavigateToReview: () -> Unit = {},
    onNavigateToMeasurement: () -> Unit = {},
    onNavigateToConstruction: () -> Unit = {},
    onNavigateToMeasurementList: () -> Unit = {},
    onNavigateToConstructionList: () -> Unit = {},
    onNavigateToDesign: () -> Unit = {},
    onNavigateToProduction: () -> Unit = {},
    onNavigateToFinance: () -> Unit = {},
    onNavigateToTaskDetail: (Int) -> Unit = {},
    onNavigateToTaskList: (String?) -> Unit = {},
    onNavigateToPendingWork: () -> Unit = {},
    onNavigateToSearch: () -> Unit = {}
) {
    val uiState by viewModel.uiState.collectAsState()
    val snackbarHostState = remember { SnackbarHostState() }
    val haptic = LocalHapticFeedback.current

    val connectionState = observeConnectivity(App.instance.connectivityObserver)
    val isOffline = connectionState.value is ConnectionState.Unavailable

    LaunchedEffect(uiState.error) {
        uiState.error?.let { error ->
            snackbarHostState.showSnackbar(error)
            viewModel.clearError()
        }
    }

    Scaffold(
        containerColor = Surface,
        snackbarHost = { SnackbarHost(snackbarHostState) },
        topBar = {
            TopAppBar(
                title = { Text("工作台", fontWeight = FontWeight.Bold, color = TextPrimary) },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = Surface,
                    titleContentColor = TextPrimary
                ),
                actions = {
                    IconButton(onClick = onNavigateToSearch) {
                        Icon(Icons.Default.Search, contentDescription = "搜索", tint = TextSecondary)
                    }
                }
            )
        }
    ) { paddingValues ->
        val pullToRefreshState = rememberPullToRefreshState()

        PullToRefreshBox(
            isRefreshing = uiState.isRefreshing,
            onRefresh = viewModel::refresh,
            state = pullToRefreshState,
            modifier = Modifier
                .fillMaxSize()
                .background(Surface)
                .padding(paddingValues)
        ) {
            Column(modifier = Modifier.fillMaxSize()) {
                OfflineBanner(isOffline = isOffline)

                LazyColumn(
                    modifier = Modifier.fillMaxSize(),
                    contentPadding = PaddingValues(vertical = 8.dp)
                ) {
                    item {
                        AnimatedVisibility(
                            visible = true,
                            enter = fadeIn(tween(400)) + slideInVertically(tween(400)) { -it }
                        ) {
                            WelcomeCard(
                                userName = uiState.userName,
                                pendingCount = uiState.stats?.pending ?: 0,
                                overdueCount = uiState.stats?.overdue ?: 0
                            )
                        }
                    }

                    item {
                        val todayDeadlineOrder = remember(uiState.recentOrders) {
                            derivedStateOf {
                                uiState.recentOrders.firstOrNull { order ->
                                    order.deadline != null && isToday(order.deadline)
                                }
                            }
                        }.value

                        AnimatedVisibility(
                            visible = todayDeadlineOrder != null,
                            enter = fadeIn(tween(400, delayMillis = 100))
                        ) {
                            todayDeadlineOrder?.let { order ->
                                TodayDeadlineBar(
                                    orderTitle = order.title,
                                    onClick = { onNavigateToTaskDetail(order.id) }
                                )
                            }
                        }
                    }

                    item {
                        AnimatedVisibility(
                            visible = uiState.stats != null || uiState.isLoading,
                            enter = fadeIn(tween(400, delayMillis = 200))
                        ) {
                            if (uiState.stats != null) {
                                StatsBentoGrid(
                                    stats = uiState.stats!!,
                                    onStatClick = { status ->
                                        if (status == "pending") onNavigateToPendingWork() else onNavigateToTaskList(status)
                                    }
                                )
                            } else if (uiState.isLoading) {
                                StatsSkeletonGrid()
                            }
                        }
                    }

                    item {
                        AnimatedVisibility(
                            visible = true,
                            enter = fadeIn(tween(400, delayMillis = 300))
                        ) {
                            val quickActions = remember(uiState.userRole) {
                                when (uiState.userRole) {
                                    "measurer" -> listOf(
                                        QuickAction("量尺", Icons.Default.Edit, onNavigateToMeasurementList)
                                    )
                                    "constructor" -> listOf(
                                        QuickAction("施工", Icons.Default.Build, onNavigateToConstructionList)
                                    )
                                    else -> listOf(
                                        QuickAction("量尺", Icons.Default.Edit, onNavigateToMeasurementList),
                                        QuickAction("施工", Icons.Default.Build, onNavigateToConstructionList),
                                        QuickAction("设计", Icons.Default.Create, onNavigateToDesign),
                                        QuickAction("生产", Icons.Default.Domain, onNavigateToProduction),
                                        QuickAction("审批", Icons.Default.ThumbUp, onNavigateToReview),
                                        QuickAction("财务", Icons.Default.AccountBalanceWallet, onNavigateToFinance)
                                    )
                                }
                            }
                            QuickActionsRow(actions = quickActions)
                        }
                    }

                    item {
                        Text(
                            text = "最近工单",
                            fontSize = 15.sp,
                            fontWeight = FontWeight.Bold,
                            color = TextPrimary,
                            modifier = Modifier.padding(start = 16.dp, top = 12.dp, bottom = 8.dp)
                        )
                    }

                    if (uiState.recentOrders.isNotEmpty()) {
                        items(
                            items = uiState.recentOrders.take(3),
                            key = { it.id }
                        ) { order ->
                            AnimatedVisibility(
                                visible = true,
                                enter = fadeIn(tween(300)) + slideInVertically(tween(300)) { it }
                            ) {
                                OrderCard(
                                    order = order,
                                    onClick = {
                                        haptic.performHapticFeedback(HapticFeedbackType.TextHandleMove)
                                        onNavigateToTaskDetail(order.id)
                                    }
                                )
                            }
                        }
                    } else if (uiState.recentOrdersError != null) {
                        val errorMsg = uiState.recentOrdersError!!
                        item {
                            ErrorRetryCard(
                                errorMessage = errorMsg,
                                onRetry = viewModel::refresh
                            )
                        }
                    } else if (uiState.stats != null) {
                        item {
                            EmptyOrdersState(onNavigateToTaskList)
                        }
                    }

                    item {
                        Spacer(modifier = Modifier.height(20.dp))
                    }
                }
            }
        }
    }
}

@Composable
private fun ErrorRetryCard(errorMessage: String, onRetry: () -> Unit) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp),
        shape = RoundedCornerShape(14.dp),
        colors = CardDefaults.cardColors(containerColor = Color(0xFFFEF2F2))
    ) {
        Row(
            modifier = Modifier.padding(14.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(Icons.Default.Warning, contentDescription = "错误", tint = Error, modifier = Modifier.size(20.dp))
            Spacer(modifier = Modifier.width(8.dp))
            Text(text = errorMessage, fontSize = 13.sp, color = Error, modifier = Modifier.weight(1f))
            TextButton(onClick = onRetry) {
                Text("重试", color = Error)
            }
        }
    }
}

private fun isToday(deadline: String?): Boolean {
    if (deadline.isNullOrEmpty()) return false
    return try {
        val today = LocalDate.now()
        val dateStr = if (deadline.length >= 10) deadline.substring(0, 10) else deadline
        val deadlineDate = LocalDate.parse(dateStr)
        today == deadlineDate
    } catch (e: Exception) {
        false
    }
}

@Preview(showBackground = true)
@Composable
private fun DashboardScreenPreview() {
    MaterialTheme {
        DashboardScreen()
    }
}