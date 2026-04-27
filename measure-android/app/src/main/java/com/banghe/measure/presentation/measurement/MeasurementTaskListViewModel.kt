package com.banghe.measure.presentation.measurement

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.banghe.measure.core.App
import com.banghe.measure.domain.model.WorkOrder
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import kotlinx.coroutines.withTimeoutOrNull

enum class MeasurementTab(val label: String, val status: String?) {
    Pending("待量尺", "pending"),
    Submitted("已提交", "submitted"),
    Completed("已完成", "completed")
}

data class MeasurementStats(
    val pendingCount: Int = 0,
    val submittedCount: Int = 0,
    val completedCount: Int = 0
)

data class MeasurementTaskListUiState(
    val tasks: List<WorkOrder> = emptyList(),
    val stats: MeasurementStats = MeasurementStats(),
    val currentTab: MeasurementTab = MeasurementTab.Pending,
    val isLoading: Boolean = false,
    val isRefreshing: Boolean = false,
    val currentPage: Int = 1,
    val hasMore: Boolean = true,
    val error: String? = null
)

class MeasurementTaskListViewModel : ViewModel() {
    private val _uiState = MutableStateFlow(MeasurementTaskListUiState())
    val uiState: StateFlow<MeasurementTaskListUiState> = _uiState.asStateFlow()

    init {
        loadAll()
    }

    fun loadAll() {
        loadStats()
        loadTasks(refresh = true)
    }

    fun loadStats() {
        viewModelScope.launch {
            val repository = App.instance.taskRepository

            // 按环节查全部，本地分类统计
            val allResult = withTimeoutOrNull(5000) {
                repository.getTasks(stage = "measurement", limit = 1000)
            }
            val allTasks = allResult?.getOrNull() ?: emptyList()

            _uiState.update {
                it.copy(
                    stats = MeasurementStats(
                        // 量尺阶段的任务 status = "assigned"（不是 "submitted"）
                        pendingCount = allTasks.count { t -> t.status == "assigned" && t.measurementStatus.isNullOrBlank() },
                        submittedCount = allTasks.count { t -> t.measurementStatus == "measured" },
                        completedCount = allTasks.count { t -> t.status == "completed" }
                    )
                )
            }
        }
    }

    fun loadTasks(refresh: Boolean = false) {
        viewModelScope.launch {
            val page = if (refresh) 1 else _uiState.value.currentPage

            if (refresh) {
                _uiState.update { it.copy(isRefreshing = true, error = null) }
            } else if (_uiState.value.tasks.isEmpty()) {
                _uiState.update { it.copy(isLoading = true, error = null) }
            }

            try {
                val repository = App.instance.taskRepository

                // 按环节查全部，本地按 tab 分类（工单进入测量环节时 status = "submitted"，不是 "pending"）
                val result = withTimeoutOrNull(10000) {
                    repository.getTasks(
                        stage = "measurement",
                        page = page,
                        limit = 500
                    )
                }

                val allTasks = result?.getOrNull() ?: emptyList()
                val filtered = filterByTab(allTasks, _uiState.value.currentTab)

                _uiState.update {
                    it.copy(
                        tasks = filtered,
                        currentPage = page,
                        hasMore = allTasks.size >= 500,
                        isLoading = false,
                        isRefreshing = false
                    )
                }
            } catch (e: Exception) {
                _uiState.update {
                    it.copy(
                        isLoading = false,
                        isRefreshing = false,
                        hasMore = false,
                        error = e.message ?: "加载失败"
                    )
                }
            }
        }
    }

    private fun filterByTab(tasks: List<WorkOrder>, tab: MeasurementTab): List<WorkOrder> {
        return when (tab) {
            // 量尺阶段的任务 status = "assigned"（不是 "submitted"）
            MeasurementTab.Pending -> tasks.filter { it.status == "assigned" && it.measurementStatus.isNullOrBlank() }
            MeasurementTab.Submitted -> tasks.filter { it.measurementStatus == "measured" }
            MeasurementTab.Completed -> tasks.filter { it.status == "completed" }
        }
    }

    fun selectTab(tab: MeasurementTab) {
        _uiState.update {
            it.copy(
                currentTab = tab,
                tasks = emptyList(),
                currentPage = 1,
                hasMore = true
            )
        }
        loadTasks(refresh = true)
    }

    fun refresh() {
        loadAll()
    }
}