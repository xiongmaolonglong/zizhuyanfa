package com.banghe.measure.presentation.tasks

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

data class TaskFilter(val label: String, val status: String?)

sealed class TaskType(val stage: String, val label: String, val filters: List<TaskFilter>) {
    data object Measurement : TaskType(
        stage = "measurement",
        label = "测量任务",
        filters = listOf(
            TaskFilter("全部", null),
            TaskFilter("待测量", "pending"),
            TaskFilter("已提交", "in_progress"),
            TaskFilter("已完成", "completed")
        )
    )
    data object Construction : TaskType(
        stage = "construction",
        label = "施工任务",
        filters = listOf(
            TaskFilter("全部", null),
            TaskFilter("待施工", "assigned"),
            TaskFilter("施工中", "in_progress"),
            TaskFilter("已完成", "completed"),
            TaskFilter("已验收", "accepted")
        )
    )
}

data class TaskListUiState(
    val tasks: List<WorkOrder> = emptyList(),
    val isLoading: Boolean = false,
    val error: String? = null,
    val currentPage: Int = 1,
    val hasMore: Boolean = true,
    val taskType: TaskType = TaskType.Measurement,
    val selectedFilter: TaskFilter = TaskType.Measurement.filters.first()
)

class TaskListViewModel : ViewModel() {
    private val _uiState = MutableStateFlow(TaskListUiState())
    val uiState: StateFlow<TaskListUiState> = _uiState.asStateFlow()

    var currentSearch: String = ""

    init {
        loadTasks()
    }

    fun setTaskType(type: TaskType) {
        _uiState.update {
            it.copy(
                taskType = type,
                selectedFilter = type.filters.first(),
                tasks = emptyList(),
                currentPage = 1
            )
        }
        loadTasks(refresh = true)
    }

    fun loadTasks(refresh: Boolean = false) {
        viewModelScope.launch {
            val page = if (refresh) 1 else _uiState.value.currentPage
            if (_uiState.value.tasks.isEmpty()) {
                _uiState.update { it.copy(isLoading = true, error = null) }
            }

            try {
                val repository = App.instance.taskRepository

                val statusParam = _uiState.value.selectedFilter.status

                val keywordParam = currentSearch.takeIf { it.isNotBlank() }
                val stageParam = _uiState.value.taskType.stage

                val result = withTimeoutOrNull(5000) {
                    repository.getTasks(
                        status = statusParam,
                        stage = stageParam,
                        keyword = keywordParam,
                        page = page
                    )
                }

                result?.getOrNull()?.let { tasks ->
                    _uiState.update {
                        it.copy(
                            tasks = if (refresh) tasks else it.tasks + tasks,
                            currentPage = page,
                            hasMore = tasks.size >= 20,
                            isLoading = false
                        )
                    }
                } ?: run {
                    _uiState.update { it.copy(isLoading = false, hasMore = false) }
                }
            } catch (e: Exception) {
                _uiState.update { it.copy(isLoading = false, hasMore = false) }
            }
        }
    }

    fun setFilter(filter: TaskFilter) {
        _uiState.update { it.copy(selectedFilter = filter) }
        loadTasks(refresh = true)
    }

    fun setStatusFilter(status: String?) {
        val matchingFilter = _uiState.value.taskType.filters.find { it.status == status }
        matchingFilter?.let {
            setFilter(it)
        }
    }

    fun setSearch(query: String) {
        currentSearch = query
    }

    fun search() {
        loadTasks(refresh = true)
    }
}