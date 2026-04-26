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
        loadStats()
        loadRecentOrders()
    }

    private fun loadUserName() {
        viewModelScope.launch {
            val name = App.instance.preferencesStore.getUserName()
            val role = App.instance.preferencesStore.getUserRole() ?: "admin"
            _uiState.update { it.copy(userName = name, userRole = role) }
        }
    }

    fun loadStats() {
        if (isLoadingStats) return // 防止重复加载
        isLoadingStats = true
        viewModelScope.launch {
            loadStatsInternal()
            isLoadingStats = false
        }
    }

    private suspend fun loadStatsInternal() {
        _uiState.update { it.copy(isLoading = true, error = null) }
        try {
            val result = withTimeoutOrNull(5000) {
                App.instance.dashboardRepository.getStats()
            }
            result?.getOrNull()?.let { stats ->
                _uiState.update { it.copy(stats = stats, isLoading = false) }
            } ?: run {
                _uiState.update { it.copy(isLoading = false) }
            }
        } catch (e: Exception) {
            _uiState.update { it.copy(isLoading = false, error = e.message) }
        }
    }

    fun refresh() {
        // 防止重复刷新：如果正在刷新，取消上一次
        refreshJob?.cancel()

        refreshJob = viewModelScope.launch {
            _uiState.update { it.copy(isRefreshing = true) }
            try {
                listOf(
                    async { loadStatsInternal() },
                    async { loadRecentOrdersInternal() }
                ).awaitAll()
            } finally {
                _uiState.update { it.copy(isRefreshing = false) }
            }
        }
    }

    private fun loadRecentOrders() {
        if (isLoadingOrders) return
        isLoadingOrders = true
        viewModelScope.launch {
            loadRecentOrdersInternal()
            isLoadingOrders = false
        }
    }

    private suspend fun loadRecentOrdersInternal() {
        try {
            val result = withTimeoutOrNull(5000) {
                App.instance.taskRepository.getTasks(page = 1, limit = 5)
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