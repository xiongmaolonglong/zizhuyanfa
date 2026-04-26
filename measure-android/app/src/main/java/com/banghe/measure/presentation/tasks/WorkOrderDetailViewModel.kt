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

data class WorkOrderDetailUiState(
    val workOrder: WorkOrder? = null,
    val isLoading: Boolean = false,
    val error: String? = null
)

class WorkOrderDetailViewModel : ViewModel() {
    private val _uiState = MutableStateFlow(WorkOrderDetailUiState())
    val uiState: StateFlow<WorkOrderDetailUiState> = _uiState.asStateFlow()

    fun loadWorkOrder(id: Int) {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, error = null) }
            try {
                val result = withTimeoutOrNull(5000) {
                    App.instance.taskRepository.getTaskDetail(id)
                }
                result?.getOrNull()?.let { workOrder ->
                    _uiState.update { WorkOrderDetailUiState(workOrder = workOrder, isLoading = false) }
                } ?: run {
                    _uiState.update { it.copy(isLoading = false, error = "加载失败") }
                }
            } catch (e: Exception) {
                _uiState.update { it.copy(isLoading = false, error = e.message ?: "加载失败") }
            }
        }
    }
}