package com.banghe.measure.presentation.admin

import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.List
import androidx.compose.material.icons.filled.Notifications
import androidx.compose.material.icons.filled.Person
import com.banghe.measure.core.App
import androidx.compose.material3.Badge
import androidx.compose.material3.BadgedBox
import androidx.compose.material3.Icon
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
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
import com.banghe.measure.presentation.dashboard.DashboardScreen
import com.banghe.measure.presentation.measurement.MeasurementWizard
import com.banghe.measure.presentation.measurement.WizardMode
import com.banghe.measure.presentation.design.DesignTaskScreen
import com.banghe.measure.presentation.finance.FinanceScreen
import com.banghe.measure.presentation.notification.NotificationScreen
import com.banghe.measure.presentation.production.ProductionTaskScreen
import com.banghe.measure.presentation.profile.ProfileScreen
import com.banghe.measure.presentation.tasks.TaskListScreen
import com.banghe.measure.presentation.tasks.WorkOrderDetailScreen

data class AdminTab(
    val title: String,
    val icon: ImageVector,
    val route: String
)

val adminTabs = listOf(
    AdminTab("工作台", Icons.Default.Home, "dashboard"),
    AdminTab("工单", Icons.Default.List, "tasks"),
    AdminTab("消息", Icons.Default.Notifications, "notifications"),
    AdminTab("我的", Icons.Default.Person, "profile")
)

@Composable
fun AdminHome(
    onLogout: () -> Unit = {}
) {
    val navController = rememberNavController()
    val navBackStackEntry by navController.currentBackStackEntryAsState()
    val currentRoute = navBackStackEntry?.destination?.route

    // 判断是否显示底部导航栏（详情页不显示）
    val showBottomBar = currentRoute in adminTabs.map { it.route } ||
                        currentRoute?.startsWith("task_detail") == true && currentRoute == "dashboard" ||
                        currentRoute in listOf("dashboard", "tasks", "notifications", "profile")

    Scaffold(
        bottomBar = {
            if (currentRoute in adminTabs.map { it.route } || currentRoute == null) {
                AdminBottomBar(
                    tabs = adminTabs,
                    navController = navController
                )
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
                    onNavigateToReview = { navController.navigate("review") },
                    onNavigateToMeasurement = { navController.navigate("measurement") },
                    onNavigateToConstruction = { navController.navigate("construction") },
                    onNavigateToMeasurementList = { navController.navigate("measurement_list") },
                    onNavigateToConstructionList = { navController.navigate("construction_list") },
                    onNavigateToDesign = { navController.navigate("design") },
                    onNavigateToProduction = { navController.navigate("production") },
                    onNavigateToFinance = { navController.navigate("finance") },
                    onNavigateToTaskDetail = { taskId ->
                        navController.navigate("task_detail/$taskId")
                    },
                    onNavigateToTaskList = { status ->
                        navController.navigate("tasks?status=${status ?: ""}") {
                            popUpTo("dashboard") { saveState = true }
                            launchSingleTop = true
                            restoreState = true
                        }
                    },
                    onNavigateToPendingWork = { navController.navigate("pending_work") },
                    onNavigateToSearch = { navController.navigate("tasks") }
                )
            }
            composable("measurement") {
                MeasurementWizard(
                    mode = WizardMode.NewOrder,
                    onComplete = { navController.popBackStack() },
                    onCancel = { navController.popBackStack() },
                    onOpenCamera = { orderId ->
                        navController.navigate("camera/$orderId")
                    }
                )
            }
            composable("camera/{orderId}") { backStackEntry ->
                val orderId = backStackEntry.arguments?.getString("orderId") ?: ""
                com.banghe.measure.presentation.camera.WatermarkCameraScreen(
                    orderId = orderId,
                    onPhotoTaken = { uri ->
                        navController.previousBackStackEntry?.savedStateHandle?.set("photo_uri", uri.toString())
                        navController.popBackStack()
                    },
                    onCancel = { navController.popBackStack() }
                )
            }
            composable("design") {
                DesignTaskScreen()
            }
            composable("production") {
                ProductionTaskScreen()
            }
            composable("finance") {
                FinanceScreen()
            }
            composable("construction") {
                com.banghe.measure.presentation.construction.ConstructionLogScreen(
                    orderId = 0
                )
            }
            composable("measurement_list") {
                com.banghe.measure.presentation.measurement.MeasurementTaskListScreen(
                    onBack = { navController.popBackStack() },
                    onTaskClick = { taskId ->
                        navController.navigate("task_detail/$taskId")
                    },
                    onNewMeasurement = { navController.navigate("measurement") }
                )
            }
            composable("construction_list") {
                com.banghe.measure.presentation.construction.ConstructionTaskListScreen(
                    onBack = { navController.popBackStack() },
                    onTaskClick = { taskId ->
                        navController.navigate("task_detail/$taskId")
                    },
                    onStartConstruction = { orderId ->
                        navController.navigate("construction_wizard/$orderId")
                    }
                )
            }
            composable(
                route = "tasks?status={status}",
                arguments = listOf(navArgument("status") { type = NavType.StringType; nullable = true; defaultValue = null })
            ) { backStackEntry ->
                val status = backStackEntry.arguments?.getString("status")
                TaskListScreen(
                    initialStatus = status,
                    onTaskClick = { taskId ->
                        navController.navigate("task_detail/$taskId")
                    }
                )
            }
            composable("review") {
                com.banghe.measure.presentation.admin.review.ReviewCenterScreen(
                    onBack = { navController.popBackStack() }
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
            composable("profile") {
                ProfileScreen(
                    onLogout = onLogout
                )
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
private fun AdminBottomBar(
    tabs: List<AdminTab>,
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
