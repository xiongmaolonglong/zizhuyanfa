package com.banghe.measure.presentation.construction

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

enum class ConstructionTab(val label: String, val status: String?) {
    Pending("待施工", "assigned"),
    InProgress("施工中", "in_progress"),
    Completed("已完成", "completed"),
    Accepted("已验收", "accepted")
}

data class ConstructionStats(
    val pendingCount: Int = 0,
    val inProgressCount: Int = 0,
    val completedCount: Int = 0
)

data class ConstructionTaskListUiState(
    val tasks: List<WorkOrder> = emptyList(),
    val stats: ConstructionStats = ConstructionStats(),
    val currentTab: ConstructionTab = ConstructionTab.Pending,
    val isLoading: Boolean = false,
    val isRefreshing: Boolean = false,
    val currentPage: Int = 1,
    val hasMore: Boolean = true,
    val error: String? = null
)

class ConstructionTaskListViewModel : ViewModel() {
    private val _uiState = MutableStateFlow(ConstructionTaskListUiState())
    val uiState: StateFlow<ConstructionTaskListUiState> = _uiState.asStateFlow()

    init {
        loadAll()
    }

    fun loadAll() {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, error = null) }
            loadStats()
            loadTasks(refresh = true)
            _uiState.update { it.copy(isLoading = false) }
        }
    }

    private suspend fun loadStats() {
        val repository = App.instance.taskRepository

        // 并行加载各状态数量
        val pendingResult = withTimeoutOrNull(5000) {
            repository.getTasks(stage = "construction", status = "assigned", limit = 1000)
        }
        val inProgressResult = withTimeoutOrNull(5000) {
            repository.getTasks(stage = "construction", status = "in_progress", limit = 1000)
        }
        val completedResult = withTimeoutOrNull(5000) {
            repository.getTasks(stage = "construction", status = "completed", limit = 1000)
        }

        _uiState.update {
            it.copy(
                stats = ConstructionStats(
                    pendingCount = pendingResult?.getOrNull()?.size ?: 0,
                    inProgressCount = inProgressResult?.getOrNull()?.size ?: 0,
                    completedCount = completedResult?.getOrNull()?.size ?: 0
                )
            )
        }
    }

    fun loadTasks(refresh: Boolean = false) {
        viewModelScope.launch {
            val page = if (refresh) 1 else _uiState.value.currentPage

            if (!refresh && _uiState.value.tasks.isEmpty()) {
                _uiState.update { it.copy(isLoading = true, error = null) }
            }

            try {
                val repository = App.instance.taskRepository
                val statusParam = _uiState.value.currentTab.status

                val result = withTimeoutOrNull(5000) {
                    repository.getTasks(
                        status = statusParam,
                        stage = "construction",
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
                    _uiState.update { it.copy(isLoading = false, isRefreshing = false, hasMore = false) }
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

    fun selectTab(tab: ConstructionTab) {
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
        _uiState.update { it.copy(isRefreshing = true) }
        loadAll()
    }
}