package com.banghe.measure.presentation.worker.completed

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

data class CompletedUiState(
    val measurementRecords: List<WorkOrder> = emptyList(),
    val constructionRecords: List<WorkOrder> = emptyList(),
    val isLoading: Boolean = false,
    val error: String? = null
)

class CompletedViewModel : ViewModel() {
    private val _uiState = MutableStateFlow(CompletedUiState())
    val uiState: StateFlow<CompletedUiState> = _uiState.asStateFlow()

    init {
        loadCompletedRecords()
    }

    fun loadCompletedRecords() {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, error = null) }

            try {
                val repository = App.instance.taskRepository

                // 加载已完工测量：stage=measurement, 状态为已完成
                val measurementResult = withTimeoutOrNull(5000) {
                    repository.getTasks(stage = "measurement", status = "completed")
                }

                // 加载已完工施工：stage=construction, 状态为已完成
                val constructionResult = withTimeoutOrNull(5000) {
                    repository.getTasks(stage = "construction", status = "completed")
                }

                _uiState.update {
                    it.copy(
                        measurementRecords = measurementResult?.getOrNull() ?: emptyList(),
                        constructionRecords = constructionResult?.getOrNull() ?: emptyList(),
                        isLoading = false
                    )
                }
            } catch (e: Exception) {
                _uiState.update {
                    it.copy(isLoading = false, error = e.message ?: "加载失败")
                }
            }
        }
    }
}