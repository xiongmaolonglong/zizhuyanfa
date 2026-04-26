package com.banghe.measure.presentation.dashboard

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.banghe.measure.core.App
import com.banghe.measure.domain.model.WorkOrder
import com.banghe.measure.domain.model.WorkOrderStats
import kotlinx.coroutines.Job
import kotlinx.coroutines.async
import kotlinx.coroutines.awaitAll
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import kotlinx.coroutines.withTimeoutOrNull

data class DashboardUiState(
    val stats: WorkOrderStats? = null,
    val userName: String? = null,
    val userRole: String = "admin",
    val recentOrders: List<WorkOrder> = emptyList(),
    val isLoading: Boolean = false,
    val isRefreshing: Boolean = false,
    val error: String? = null,
    val recentOrdersError: String? = null
)

class DashboardViewModel : ViewModel() {
    private val _uiState = MutableStateFlow(DashboardUiState())
    val uiState: StateFlow<DashboardUiState> = _uiState.asStateFlow()

    // 防止重复请求的锁
    private var refreshJob: Job? = null
    private var isLoadingStats = false
    private var isLoadingOrders = false

    init {
        _uiState.value = DashboardUiState(
            stats = WorkOrderStats(total = 0, pending = 0, inProgress = 0, completed = 0, overdue = 0)
        )
        loadUserName()
        // 先加载用户角色，再加载统计数据
        viewModelScope.launch {
            val role = App.instance.preferencesStore.getUserRole() ?: "admin"
            loadStats(role)
            loadRecentOrders(role)
        }
    }

    private fun loadUserName() {
        viewModelScope.launch {
            val name = App.instance.preferencesStore.getUserName()
            val role = App.instance.preferencesStore.getUserRole() ?: "admin"
            _uiState.update { it.copy(userName = name, userRole = role) }
        }
    }

    fun loadStats(role: String? = null) {
        if (isLoadingStats) return
        isLoadingStats = true
        viewModelScope.launch {
            val userRole = role ?: _uiState.value.userRole
            loadStatsInternal(userRole)
            isLoadingStats = false
        }
    }

    private suspend fun loadStatsInternal(role: String) {
        _uiState.update { it.copy(isLoading = true, error = null) }
        try {
            if (role == "measurer" || role == "constructor") {
                val stage = if (role == "measurer") "measurement" else "construction"
                val userId = App.instance.preferencesStore.getUserId()
                val result = withTimeoutOrNull(5000) {
                    App.instance.taskRepository.getTasks(
                        stage = stage,
                        assignedTo = userId,
                        limit = 100
                    )
                }
                result?.getOrNull()?.let { tasks ->
                    val stats = calculatePersonalStats(tasks)
                    _uiState.update { it.copy(stats = stats, isLoading = false) }
                } ?: run {
                    _uiState.update { it.copy(isLoading = false) }
                }
            } else {
                // 管理员：使用全局统计 API
                val result = withTimeoutOrNull(5000) {
                    App.instance.dashboardRepository.getStats()
                }
                result?.getOrNull()?.let { stats ->
                    _uiState.update { it.copy(stats = stats, isLoading = false) }
                } ?: run {
                    _uiState.update { it.copy(isLoading = false) }
                }
            }
        } catch (e: Exception) {
            _uiState.update { it.copy(isLoading = false, error = e.message) }
        }
    }

    /**
     * 从任务列表计算个人统计数据
     * 测量员/施工员视角：
     * - 待处理：自己提交等待管理员审批的（measurement_status = 'measured'）
     * - 进行中：管理员派发给自己正在做的
     * - 已完成：自己已完成的
     * - 已逾期：派发超过7天没完成的
     */
    private fun calculatePersonalStats(tasks: List<WorkOrder>): WorkOrderStats {
        var pending = 0      // 待审批（自己提交的）
        var inProgress = 0   // 进行中（派发给自己的）
        var completed = 0    // 已完成
        var overdue = 0      // 已逾期

        val now = System.currentTimeMillis()
        val sevenDaysMillis = 7 * 24 * 60 * 60 * 1000L

        for (task in tasks) {
            when {
                // 待处理：自己提交量尺等待审批
                task.measurementStatus == "measured" -> {
                    pending++
                }
                // 已完成
                task.status == "completed" || task.status == "approved" -> {
                    completed++
                }
                // 进行中：派发给自己的
                task.status == "assigned" || task.status == "in_progress" -> {
                    inProgress++
                    // 检查是否逾期：派发超过7天
                    task.assignedAt?.let { assignedAtStr ->
                        try {
                            val assignedTime = parseIsoDate(assignedAtStr)
                            if (now - assignedTime > sevenDaysMillis) {
                                overdue++
                            }
                        } catch (e: Exception) {
                            // 解析失败，忽略
                        }
                    }
                }
            }
        }

        return WorkOrderStats(
            total = pending + inProgress + completed,
            pending = pending,
            inProgress = inProgress,
            completed = completed,
            overdue = overdue
        )
    }

    private fun parseIsoDate(dateStr: String): Long {
        // 支持 ISO 8601 格式：2024-01-15T10:30:00.000Z 或 2024-01-15T10:30:00
        val cleanStr = dateStr.replace("Z", "").replace("T", " ")
        val format = java.text.SimpleDateFormat("yyyy-MM-dd HH:mm:ss", java.util.Locale.getDefault())
        return format.parse(cleanStr)?.time ?: 0L
    }

    fun refresh() {
        refreshJob?.cancel()
        refreshJob = viewModelScope.launch {
            _uiState.update { it.copy(isRefreshing = true) }
            val role = _uiState.value.userRole
            try {
                listOf(
                    async { loadStatsInternal(role) },
                    async { loadRecentOrdersInternal(role) }
                ).awaitAll()
            } finally {
                _uiState.update { it.copy(isRefreshing = false) }
            }
        }
    }

    private fun loadRecentOrders(role: String? = null) {
        if (isLoadingOrders) return
        isLoadingOrders = true
        viewModelScope.launch {
            val userRole = role ?: _uiState.value.userRole
            loadRecentOrdersInternal(userRole)
            isLoadingOrders = false
        }
    }

    private suspend fun loadRecentOrdersInternal(role: String) {
        try {
            val stage = when (role) {
                "measurer" -> "measurement"
                "constructor" -> "construction"
                else -> null
            }
            val userId = App.instance.preferencesStore.getUserId()
            val result = withTimeoutOrNull(5000) {
                App.instance.taskRepository.getTasks(
                    stage = stage,
                    assignedTo = userId,
                    page = 1,
                    limit = 5
                )
            }
            result?.getOrNull()?.let { orders ->
                _uiState.update { it.copy(recentOrders = orders, recentOrdersError = null) }
            } ?: _uiState.update { it.copy(recentOrdersError = "加载超时") }
        } catch (e: Exception) {
            _uiState.update { it.copy(recentOrdersError = "加载最近工单失败") }
        }
    }

    fun clearError() {
        _uiState.update { it.copy(error = null) }
    }
}