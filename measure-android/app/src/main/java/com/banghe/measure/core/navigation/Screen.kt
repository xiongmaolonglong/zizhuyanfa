package com.banghe.measure.core.navigation

sealed class Screen(val route: String) {
    data object Splash : Screen("splash")
    data object Login : Screen("login")
    data object AdminHome : Screen("admin_home")
    data object WorkerHome : Screen("worker_home")
    data object Dashboard : Screen("dashboard")
    data object Tasks : Screen("tasks")
    data object TaskDetail : Screen("task_detail/{id}") {
        fun createRoute(id: Int) = "task_detail/$id"
    }
    data object WorkOrderDetail : Screen("work_order_detail/{id}") {
        fun createRoute(id: Int) = "work_order_detail/$id"
    }
    data object Profile : Screen("profile")
    data object Notifications : Screen("notifications")
    data object MeasurementWizard : Screen("measurement_wizard")
    data object MeasurementWizardEdit : Screen("measurement_wizard/{id}") {
        fun createRoute(id: Int) = "measurement_wizard/$id"
    }
    data object Camera : Screen("camera/{orderId}") {
        fun createRoute(orderId: String) = "camera/$orderId"
    }
    data object Construction : Screen("construction")
    data object DesignTasks : Screen("design_tasks")
    data object ProductionTasks : Screen("production_tasks")
    data object Finance : Screen("finance")
    data object Archive : Screen("archive")
    data object Aftersale : Screen("aftersale")
    data object Dispatch : Screen("dispatch")
    data object DataBoard : Screen("data_board")
}

object AdminNav {
    val items = listOf(
        Screen.Dashboard,
        Screen.Tasks,
        Screen.Notifications,
        Screen.Profile
    )
}

object WorkerNav {
    val items = listOf(
        Screen.Tasks,
        Screen.Profile
    )
}
