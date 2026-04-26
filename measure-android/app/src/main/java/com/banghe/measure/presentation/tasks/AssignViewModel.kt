package com.banghe.measure.presentation.tasks

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.banghe.measure.core.App
import com.banghe.measure.data.assignment.FieldWorkerResponse
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch

data class AssignUiState(
    val workers: List<FieldWorkerResponse> = emptyList(),
    val isLoading: Boolean = false,
    val isSubmitting: Boolean = false,
    val notes: String = "",
    val error: String? = null
)

class AssignViewModel : ViewModel() {
    private val _uiState = MutableStateFlow(AssignUiState())
    val uiState: StateFlow<AssignUiState> = _uiState.asStateFlow()

    var selectedWorker: FieldWorkerResponse? = null

    fun loadWorkers() {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true) }
            val result = App.instance.assignmentRepository.getFieldWorkers()
            result.getOrNull()?.let { workers ->
                _uiState.update { it.copy(workers = workers, isLoading = false) }
            } ?: _uiState.update { it.copy(isLoading = false, error = "加载失败") }
        }
    }

    fun selectWorker(worker: FieldWorkerResponse) {
        selectedWorker = worker
    }

    fun setNotes(notes: String) {
        _uiState.update { it.copy(notes = notes) }
    }

    fun assign(workOrderId: Int, stage: String, onSuccess: () -> Unit) {
        val worker = selectedWorker ?: return
        val type = if (stage == "measurement") "measurement" else "construction"
        viewModelScope.launch {
            _uiState.update { it.copy(isSubmitting = true) }
            val result = App.instance.assignmentRepository.assign(type, workOrderId, worker.id, _uiState.value.notes)
            result.getOrNull()?.let { onSuccess() }
            _uiState.update { it.copy(isSubmitting = false, error = if (result.isError) "派工失败" else null) }
        }
    }

    fun clearError() {
        _uiState.update { it.copy(error = null) }
    }
}