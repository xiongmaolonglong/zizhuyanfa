package com.banghe.measure.presentation.construction

import android.net.Uri
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.banghe.measure.core.App
import com.banghe.measure.data.construction.ConstructionTaskData
import com.banghe.measure.domain.model.ConstructionDraft
import com.banghe.measure.domain.model.MaterialInfo
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import kotlinx.coroutines.withTimeoutOrNull

data class ConstructionUiState(
    val draft: ConstructionDraft? = null,
    val taskData: ConstructionTaskData? = null,
    val isLoading: Boolean = false,
    val isSubmitting: Boolean = false,
    val submitSuccess: Boolean = false,
    val error: String? = null
)

class ConstructionWizardViewModel : ViewModel() {
    private val _uiState = MutableStateFlow(ConstructionUiState())
    val uiState: StateFlow<ConstructionUiState> = _uiState.asStateFlow()

    fun loadTask(workOrderId: Int) {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, error = null) }

            val result = withTimeoutOrNull(10000) {
                App.instance.constructionRepository.getTaskDetail(workOrderId)
            }

            result?.getOrNull()?.let { taskData ->
                _uiState.update {
                    it.copy(
                        isLoading = false,
                        taskData = taskData,
                        draft = ConstructionDraft(
                            workOrderId = workOrderId,
                            address = taskData.address,
                            beforePhotos = taskData.beforePhotos,
                            afterPhotos = taskData.afterPhotos
                        )
                    )
                }
            } ?: run {
                _uiState.update { it.copy(isLoading = false, error = "加载任务失败") }
            }
        }
    }

    fun addBeforePhoto(uri: Uri) {
        _uiState.value.draft?.let { current ->
            _uiState.update {
                it.copy(draft = current.copy(beforePhotos = current.beforePhotos + uri.toString()))
            }
        }
    }

    fun addAfterPhoto(uri: Uri) {
        _uiState.value.draft?.let { current ->
            _uiState.update {
                it.copy(draft = current.copy(afterPhotos = current.afterPhotos + uri.toString()))
            }
        }
    }

    fun removeBeforePhoto(index: Int) {
        _uiState.value.draft?.let { current ->
            val newPhotos = current.beforePhotos.toMutableList()
            if (index in newPhotos.indices) {
                newPhotos.removeAt(index)
                _uiState.update { it.copy(draft = current.copy(beforePhotos = newPhotos)) }
            }
        }
    }

    fun removeAfterPhoto(index: Int) {
        _uiState.value.draft?.let { current ->
            val newPhotos = current.afterPhotos.toMutableList()
            if (index in newPhotos.indices) {
                newPhotos.removeAt(index)
                _uiState.update { it.copy(draft = current.copy(afterPhotos = newPhotos)) }
            }
        }
    }

    fun setNotes(notes: String) {
        _uiState.value.draft?.let { current ->
            _uiState.update { it.copy(draft = current.copy(notes = notes.ifBlank { null })) }
        }
    }

    fun setSignature(path: String) {
        _uiState.value.draft?.let { current ->
            _uiState.update { it.copy(draft = current.copy(signaturePath = path)) }
        }
    }

    fun reportException(reason: String, photos: List<String>, notes: String?) {
        val workOrderId = _uiState.value.draft?.workOrderId ?: return

        viewModelScope.launch {
            _uiState.update { it.copy(isSubmitting = true, error = null) }

            val result = withTimeoutOrNull(10000) {
                App.instance.constructionRepository.reportException(workOrderId, reason, photos, notes)
            }

            result?.getOrNull()?.let {
                _uiState.update { it.copy(isSubmitting = false, submitSuccess = true) }
            } ?: run {
                _uiState.update { it.copy(isSubmitting = false, error = "上报异常失败") }
            }
        }
    }

    fun submit() {
        val draft = _uiState.value.draft ?: return

        viewModelScope.launch {
            _uiState.update { it.copy(isSubmitting = true, error = null) }

            val result = withTimeoutOrNull(10000) {
                App.instance.constructionRepository.submitConstruction(draft.workOrderId, draft)
            }

            result?.getOrNull()?.let {
                _uiState.update { it.copy(isSubmitting = false, submitSuccess = true) }
            } ?: run {
                _uiState.update { it.copy(isSubmitting = false, error = "提交失败") }
            }
        }
    }

    fun resetState() {
        _uiState.value = ConstructionUiState()
    }
}