package com.banghe.measure.core.navigation

import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.platform.LocalContext
import androidx.lifecycle.viewmodel.compose.viewModel
import kotlinx.coroutines.GlobalScope
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import androidx.navigation.NavHostController
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.navArgument
import com.banghe.measure.BuildConfig
import com.banghe.measure.core.App
import com.banghe.measure.data.auth.AuthViewModel
import com.banghe.measure.presentation.admin.AdminHome
import com.banghe.measure.presentation.camera.WatermarkCameraScreen
import com.banghe.measure.presentation.login.LoginScreen
import com.banghe.measure.presentation.measurement.MeasurementWizard
import com.banghe.measure.presentation.measurement.WizardMode
import com.banghe.measure.presentation.profile.ProfileScreen
import com.banghe.measure.presentation.splash.SplashScreen
import com.banghe.measure.presentation.tasks.WorkOrderDetailScreen
import com.banghe.measure.presentation.update.UpdateDialog
import com.banghe.measure.presentation.update.AppUpdateViewModel
import com.banghe.measure.presentation.worker.WorkerHome

@Composable
fun AppNavGraph(
    navController: NavHostController,
    authViewModel: AuthViewModel = viewModel(factory = com.banghe.measure.data.auth.AuthViewModelFactory),
    updateViewModel: AppUpdateViewModel = viewModel(factory = AppUpdateViewModel.Factory)
) {
    val authState by authViewModel.authState.collectAsState()
    val updateInfo by updateViewModel.updateInfo.collectAsState()
    val context = LocalContext.current
    val currentVersion = BuildConfig.VERSION_NAME

    // 登录成功后检查版本更新
    LaunchedEffect(authState.isLoggedIn) {
        if (authState.isLoggedIn) {
            updateViewModel.checkUpdate(currentVersion)
        }
    }

    NavHost(
        navController = navController,
        startDestination = Screen.Splash.route
    ) {
        composable(Screen.Splash.route) {
            SplashScreen(
                onNavigateToLogin = {
                    navController.navigate(Screen.Login.route) {
                        popUpTo(Screen.Splash.route) { inclusive = true }
                    }
                },
                onNavigateToHome = {
                    val homeRoute = when {
                        authState.user?.isAdmin() == true -> Screen.AdminHome.route
                        else -> Screen.WorkerHome.route
                    }
                    navController.navigate(homeRoute) {
                        popUpTo(Screen.Splash.route) { inclusive = true }
                    }
                },
                isLoggedIn = authState.isLoggedIn
            )
        }

        composable(Screen.Login.route) {
            LoginScreen(
                onLoginSuccess = {
                    val user = authState.user
                    val homeRoute = when {
                        user?.isAdmin() == true -> Screen.AdminHome.route
                        else -> Screen.WorkerHome.route
                    }
                    navController.navigate(homeRoute) {
                        popUpTo(Screen.Login.route) { inclusive = true }
                    }
                }
            )
        }

        composable(Screen.AdminHome.route) {
            AdminHome(
                onLogout = {
                    authViewModel.logout()
                    navController.navigate(Screen.Login.route) {
                        popUpTo(0) { inclusive = true }
                    }
                }
            )
        }

        composable(Screen.WorkerHome.route) {
            WorkerHome(
                onLogout = {
                    authViewModel.logout()
                    navController.navigate(Screen.Login.route) {
                        popUpTo(0) { inclusive = true }
                    }
                },
                onOpenMeasurement = {
                    navController.navigate(Screen.MeasurementWizard.route)
                }
            )
        }

        composable(Screen.Profile.route) {
            ProfileScreen(
                onLogout = {
                    authViewModel.logout()
                    navController.navigate(Screen.Login.route) {
                        popUpTo(0) { inclusive = true }
                    }
                }
            )
        }

        composable(Screen.MeasurementWizard.route) {
            MeasurementWizard(
                mode = WizardMode.NewOrder,
                onComplete = {
                    navController.popBackStack()
                },
                onCancel = {
                    navController.popBackStack()
                },
                onOpenCamera = { orderId ->
                    navController.navigate(Screen.Camera.createRoute(orderId))
                }
            )
        }

        composable(
            route = Screen.MeasurementWizardEdit.route,
            arguments = listOf(
                navArgument("id") { type = NavType.IntType }
            )
        ) { backStackEntry ->
            val id = backStackEntry.arguments?.getInt("id") ?: 0
            MeasurementWizard(
                mode = WizardMode.ExistingOrder(id),
                onComplete = {
                    navController.popBackStack()
                },
                onCancel = {
                    navController.popBackStack()
                },
                onOpenCamera = { orderId ->
                    navController.navigate(Screen.Camera.createRoute(orderId))
                }
            )
        }

        composable(
            route = Screen.WorkOrderDetail.route,
            arguments = listOf(
                navArgument("id") { type = NavType.IntType }
            )
        ) { backStackEntry ->
            val id = backStackEntry.arguments?.getInt("id") ?: 0
            WorkOrderDetailScreen(
                workOrderId = id,
                onBack = { navController.popBackStack() }
            )
        }

        composable(
            route = Screen.Camera.route,
            arguments = listOf(
                navArgument("orderId") { type = NavType.StringType }
            )
        ) { backStackEntry ->
            val orderId = backStackEntry.arguments?.getString("orderId") ?: ""
            WatermarkCameraScreen(
                orderId = orderId,
                onPhotoTaken = { uri ->
                    navController.previousBackStackEntry?.savedStateHandle?.set("photo_uri", uri.toString())
                    navController.popBackStack()
                },
                onCancel = {
                    navController.popBackStack()
                }
            )
        }
    }

    // 版本更新弹窗
    updateInfo?.let { info ->
        UpdateDialog(
            info = info,
            onUpdate = {
                val downloadId = updateViewModel.downloadApk(context, info.downloadUrl)
                if (downloadId != null) {
                    // 下载完成后检查并安装
                    GlobalScope.launch {
                        while (!updateViewModel.checkDownloadComplete(downloadId)) {
                            delay(1000)
                        }
                        updateViewModel.installApk(context)
                    }
                }
                updateViewModel.dismiss()
            },
            onDismiss = { updateViewModel.dismiss() }
        )
    }
}
