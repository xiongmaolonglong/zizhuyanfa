package com.banghe.measure.presentation.admin.review

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.banghe.measure.core.App
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import kotlinx.coroutines.withTimeoutOrNull

enum class ReviewType { MEASUREMENT, INTERNAL_VERIFICATION }

enum class ReviewTab(val label: String) {
    Pending("待审批"),
    Approved("已通过"),
    Rejected("已驳回")
}

data class ReviewStats(
    val pendingCount: Int = 0,
    val approvedCount: Int = 0,
    val rejectedCount: Int = 0
)

data class ReviewTask(
    val id: Int,
    val type: ReviewType,
    val workOrderNo: String,
    val title: String?,
    val clientName: String?,
    val submitterName: String?,
    val submittedAt: String?,
    val address: String?,
    val status: String = "pending"
)

data class ReviewCenterUiState(
    val tasks: List<ReviewTask> = emptyList(),
    val stats: ReviewStats = ReviewStats(),
    val currentTab: ReviewTab = ReviewTab.Pending,
    val isLoading: Boolean = false,
    val error: String? = null
)

class ReviewCenterViewModel : ViewModel() {
    private val _uiState = MutableStateFlow(ReviewCenterUiState())
    val uiState: StateFlow<ReviewCenterUiState> = _uiState.asStateFlow()

    init {
        loadAll()
    }

    fun selectTab(tab: ReviewTab) {
        _uiState.update { it.copy(currentTab = tab) }
        loadTasks()
    }

    fun loadAll() {
        loadTasks()
        loadStats()
    }

    private fun loadTasks() {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true) }

            val result = withTimeoutOrNull(10000) {
                App.instance.taskRepository.getReviewTasks()
            }

            result?.getOrNull()?.let { allTasks ->
                val filtered = when (_uiState.value.currentTab) {
                    ReviewTab.Pending -> allTasks.filter { it.status == "pending" }
                    ReviewTab.Approved -> allTasks.filter { it.status == "approved" }
                    ReviewTab.Rejected -> allTasks.filter { it.status == "rejected" }
                }
                _uiState.update {
                    it.copy(
                        tasks = filtered,
                        isLoading = false
                    )
                }
            } ?: run {
                _uiState.update { it.copy(isLoading = false, error = "加载失败") }
            }
        }
    }

    private fun loadStats() {
        viewModelScope.launch {
            val result = withTimeoutOrNull(10000) {
                App.instance.taskRepository.getReviewTasks()
            }

            result?.getOrNull()?.let { allTasks ->
                val stats = ReviewStats(
                    pendingCount = allTasks.count { it.status == "pending" },
                    approvedCount = allTasks.count { it.status == "approved" },
                    rejectedCount = allTasks.count { it.status == "rejected" }
                )
                _uiState.update { it.copy(stats = stats) }
            }
        }
    }

    fun approveMeasurement(workOrderId: Int, comment: String?) {
        viewModelScope.launch {
            val result = withTimeoutOrNull(10000) {
                App.instance.measurementRepository.approveMeasurement(workOrderId, comment)
            }
            if (result?.isSuccess == true) loadAll()
        }
    }

    fun rejectMeasurement(workOrderId: Int, reason: String) {
        viewModelScope.launch {
            val result = withTimeoutOrNull(10000) {
                App.instance.measurementRepository.rejectMeasurement(workOrderId, reason)
            }
            if (result?.isSuccess == true) loadAll()
        }
    }
}
