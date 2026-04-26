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

            val pendingResult = withTimeoutOrNull(5000) {
                repository.getTasks(stage = "measurement", status = "pending", limit = 1)
            }
            val submittedResult = withTimeoutOrNull(5000) {
                repository.getTasks(stage = "measurement", status = "submitted", limit = 1)
            }
            val completedResult = withTimeoutOrNull(5000) {
                repository.getTasks(stage = "measurement", status = "completed", limit = 1)
            }

            _uiState.update {
                it.copy(
                    stats = MeasurementStats(
                        pendingCount = pendingResult?.getOrNull()?.size ?: 0,
                        submittedCount = submittedResult?.getOrNull()?.size ?: 0,
                        completedCount = completedResult?.getOrNull()?.size ?: 0
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
                val statusParam = _uiState.value.currentTab.status

                val result = withTimeoutOrNull(10000) {
                    repository.getTasks(
                        status = statusParam,
                        stage = "measurement",
                        page = page,
                        limit = 20
                    )
                }

                result?.getOrNull()?.let { tasks ->
                    _uiState.update {
                        it.copy(
                            tasks = if (refresh) tasks else it.tasks + tasks,
                            currentPage = page,
                            hasMore = tasks.size >= 20,
                            isLoading = false,
                            isRefreshing = false
                        )
                    }
                } ?: run {
                    _uiState.update {
                        it.copy(
                            isLoading = false,
                            isRefreshing = false,
                            hasMore = false
                        )
                    }
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