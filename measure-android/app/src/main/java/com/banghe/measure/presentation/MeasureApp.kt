package com.banghe.measure.presentation

import android.widget.Toast
import androidx.activity.compose.BackHandler
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableLongStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.platform.LocalContext
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import com.banghe.measure.core.navigation.AppNavGraph
import com.banghe.measure.data.auth.AuthViewModel
import com.banghe.measure.data.auth.AuthViewModelFactory

@Composable
fun MeasureApp() {
    val navController = rememberNavController()
    val authViewModel: AuthViewModel = viewModel(factory = AuthViewModelFactory)
    val navBackStackEntry by navController.currentBackStackEntryAsState()
    val currentRoute = navBackStackEntry?.destination?.route

    // 根页面列表 - 只在这些页面拦截返回
    val rootRoutes = listOf("admin_home", "worker_home", "login", "splash")

    // 只在根页面时拦截返回，实现"再按一次退出"
    var backPressedTime by remember { mutableLongStateOf(0L) }
    val context = LocalContext.current

    BackHandler(enabled = currentRoute in rootRoutes) {
        if (System.currentTimeMillis() - backPressedTime < 2000) {
            (context as? android.app.Activity)?.finish()
        } else {
            backPressedTime = System.currentTimeMillis()
            Toast.makeText(context, "再按一次退出", Toast.LENGTH_SHORT).show()
        }
    }

    AppNavGraph(
        navController = navController,
        authViewModel = authViewModel
    )
}
