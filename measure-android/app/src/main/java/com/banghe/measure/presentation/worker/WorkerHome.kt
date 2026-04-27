package com.banghe.measure.presentation.worker

import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.List
import androidx.compose.material.icons.filled.Notifications
import androidx.compose.material.icons.filled.Person
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.unit.sp
import androidx.navigation.NavDestination.Companion.hierarchy
import androidx.navigation.NavGraph.Companion.findStartDestination
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import androidx.navigation.navArgument
import com.banghe.measure.core.App
import com.banghe.measure.presentation.dashboard.DashboardScreen
import com.banghe.measure.presentation.notification.NotificationScreen
import com.banghe.measure.presentation.profile.ProfileScreen
import com.banghe.measure.presentation.tasks.TaskListScreen
import com.banghe.measure.presentation.tasks.WorkOrderDetailScreen
import com.banghe.measure.presentation.worker.completed.CompletedScreen

data class WorkerTab(
    val title: String,
    val icon: ImageVector,
    val route: String
)

val workerTabs = listOf(
    WorkerTab("工作台", Icons.Default.Home, "dashboard"),
    WorkerTab("任务", Icons.Default.List, "tasks"),
    WorkerTab("我的", Icons.Default.Person, "profile")
)

@Composable
fun WorkerHome(
    onLogout: () -> Unit = {},
    onOpenMeasurement: () -> Unit = {}
) {
    val navController = rememberNavController()
    val navBackStackEntry by navController.currentBackStackEntryAsState()
    val currentRoute = navBackStackEntry?.destination?.route

    Scaffold(
        bottomBar = {
            if (currentRoute in workerTabs.map { it.route } || currentRoute == null) {
                WorkerBottomBar(
                    tabs = workerTabs,
                    navController = navController
                )
            }
        },
        floatingActionButton = {
            if (currentRoute == "tasks") {
                FloatingActionButton(
                    onClick = onOpenMeasurement,
                    containerColor = MaterialTheme.colorScheme.primary
                ) {
                    Icon(Icons.Default.Add, contentDescription = "新建量尺")
                }
            }
        }
    ) { paddingValues ->
        NavHost(
            navController = navController,
            startDestination = "dashboard",
            modifier = Modifier.padding(paddingValues)
        ) {
            composable("dashboard") {
                DashboardScreen(
                    onNavigateToMeasurementList = { navController.navigate("measurement_list") },
                    onNavigateToConstructionList = { navController.navigate("construction_list") },
                    onNavigateToTaskDetail = { id -> navController.navigate("task_detail/$id") },
                    onNavigateToTaskList = { status ->
                        navController.navigate("tasks") {
                            popUpTo("dashboard") { saveState = true }
                            launchSingleTop = true
                            restoreState = true
                        }
                    },
                    onNavigateToPendingWork = { navController.navigate("pending_work") },
                    // 其他导航回调留空（测量员/安装员不使用）
                    onNavigateToReview = {},
                    onNavigateToMeasurement = {},
                    onNavigateToConstruction = {},
                    onNavigateToDesign = {},
                    onNavigateToProduction = {},
                    onNavigateToFinance = {},
                    onNavigateToSearch = {}
                )
            }
            composable("tasks") {
                TaskListScreen(
                    onTaskClick = { taskId ->
                        navController.navigate("task_detail/$taskId")
                    }
                )
            }
            composable("measurement_list") {
                com.banghe.measure.presentation.measurement.MeasurementTaskListScreen(
                    onBack = { navController.popBackStack() },
                    onTaskClick = { taskId ->
                        navController.navigate("task_detail/$taskId")
                    },
                    onNewMeasurement = onOpenMeasurement
                )
            }
            composable("construction_list") {
                com.banghe.measure.presentation.construction.ConstructionTaskListScreen(
                    onBack = { navController.popBackStack() },
                    onTaskClick = { taskId ->
                        navController.navigate("task_detail/$taskId")
                    },
                    onStartConstruction = { taskId ->
                        navController.navigate("task_detail/$taskId")
                    }
                )
            }
            composable("pending_work") {
                com.banghe.measure.presentation.pending.PendingWorkScreen(
                    onBack = { navController.popBackStack() },
                    onNavigateToDetail = { taskId ->
                        navController.navigate("task_detail/$taskId")
                    },
                    onNavigateToMeasurement = { orderId ->
                        navController.navigate("measurement_edit/$orderId")
                    },
                    onNavigateToConstruction = { orderId ->
                        navController.navigate("construction_wizard/$orderId")
                    }
                )
            }
            composable("notifications") {
                NotificationScreen()
            }
            composable("completed") {
                CompletedScreen(
                    onRecordClick = { recordId ->
                        navController.navigate("task_detail/$recordId")
                    }
                )
            }
            composable("profile") {
                ProfileScreen(onLogout = onLogout)
            }
            composable(
                route = "task_detail/{id}",
                arguments = listOf(navArgument("id") { type = NavType.IntType })
            ) { backStackEntry ->
                val id = backStackEntry.arguments?.getInt("id") ?: 0
                WorkOrderDetailScreen(
                    workOrderId = id,
                    onBack = { navController.popBackStack() }
                )
            }
        }
    }
}

@Composable
private fun WorkerBottomBar(
    tabs: List<WorkerTab>,
    navController: androidx.navigation.NavHostController
) {
    val navBackStackEntry by navController.currentBackStackEntryAsState()
    val currentDestination = navBackStackEntry?.destination
    val unreadCount by App.instance.webSocketManager.unreadCount.collectAsState()

    NavigationBar {
        tabs.forEach { tab ->
            NavigationBarItem(
                icon = {
                    if (tab.route == "notifications") {
                        BadgedBox(
                            badge = { if (unreadCount > 0) Badge { Text("$unreadCount") } }
                        ) {
                            Icon(tab.icon, contentDescription = tab.title)
                        }
                    } else {
                        Icon(tab.icon, contentDescription = tab.title)
                    }
                },
                label = { Text(tab.title, fontSize = 12.sp) },
                selected = currentDestination?.hierarchy?.any { it.route == tab.route } == true,
                onClick = {
                    if (tab.route == "notifications") {
                        App.instance.webSocketManager.clearUnread()
                    }
                    navController.navigate(tab.route) {
                        popUpTo(navController.graph.findStartDestination().id) {
                            saveState = true
                        }
                        launchSingleTop = true
                        restoreState = true
                    }
                }
            )
        }
    }
}
