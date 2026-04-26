package com.banghe.measure.presentation.measurement

import android.net.Uri
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.banghe.measure.core.App
import com.banghe.measure.data.measurement.*
import com.banghe.measure.data.task.CreateWorkOrderRequest
import com.banghe.measure.domain.model.Client
import com.banghe.measure.domain.model.MeasurementDraft
import com.banghe.measure.domain.model.MaterialData
import com.banghe.measure.domain.model.WorkOrder
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import kotlinx.coroutines.withTimeoutOrNull

sealed class WizardMode {
    data class ExistingOrder(val orderId: Int) : WizardMode()
    data object NewOrder : WizardMode()
}

data class MeasurementUiState(
    val mode: WizardMode = WizardMode.NewOrder,
    val draft: MeasurementDraft? = null,
    val clients: List<Client> = emptyList(),
    val selectedClient: Client? = null,
    val duplicateWarning: WorkOrder? = null,
    val isSubmitting: Boolean = false,
    val submitSuccess: Boolean = false,
    val error: String? = null
)

class MeasurementViewModel : ViewModel() {
    private val _uiState = MutableStateFlow(MeasurementUiState())
    val uiState: StateFlow<MeasurementUiState> = _uiState.asStateFlow()

    fun setMode(mode: WizardMode) {
        _uiState.update { it.copy(mode = mode) }
        when (mode) {
            is WizardMode.ExistingOrder -> initDraft(mode.orderId)
            is WizardMode.NewOrder -> loadClients()
        }
    }

    private fun initDraft(orderId: Int) {
        _uiState.value = MeasurementUiState(
            mode = WizardMode.ExistingOrder(orderId),
            draft = MeasurementDraft(orderId = orderId)
        )
    }

    private fun loadClients(keyword: String? = null) {
        viewModelScope.launch {
            App.instance.clientRepository.getClients(keyword).getOrNull()?.let {
                _uiState.update { state -> state.copy(clients = it) }
            }
        }
    }

    fun searchClients(keyword: String) {
        loadClients(keyword.takeIf { it.isNotBlank() })
    }

    fun selectClient(client: Client) {
        _uiState.update { state ->
            state.copy(
                selectedClient = client,
                draft = state.draft?.copy(
                    contactName = client.contactName,
                    contactPhone = client.contactPhone,
                    address = client.address
                )
            )
        }
        // 检查去重
        checkDuplicate(client.id, client.address ?: "")
    }

    private fun checkDuplicate(clientId: Int, address: String) {
        viewModelScope.launch {
            val result = withTimeoutOrNull(5000) {
                App.instance.taskRepository.checkDuplicate(clientId, address)
            }
            result?.getOrNull()?.firstOrNull()?.let { duplicate ->
                _uiState.update { it.copy(duplicateWarning = duplicate) }
            }
        }
    }

    fun dismissDuplicateWarning() {
        _uiState.update { it.copy(duplicateWarning = null) }
    }

    fun updateDraft(newDraft: MeasurementDraft) {
        _uiState.update { it.copy(draft = newDraft, error = null) }
    }

    fun addMaterial(material: MaterialData) {
        _uiState.value.draft?.let { current ->
            _uiState.update {
                it.copy(draft = current.copy(materials = current.materials + material))
            }
        }
    }

    fun updateMaterial(index: Int, material: MaterialData) {
        _uiState.value.draft?.let { current ->
            val newMaterials = current.materials.toMutableList()
            if (index in newMaterials.indices) {
                newMaterials[index] = material
                _uiState.update { it.copy(draft = current.copy(materials = newMaterials)) }
            }
        }
    }

    fun removeMaterial(index: Int) {
        _uiState.value.draft?.let { current ->
            val newMaterials = current.materials.toMutableList()
            if (index in newMaterials.indices) {
                newMaterials.removeAt(index)
                _uiState.update { it.copy(draft = current.copy(materials = newMaterials)) }
            }
        }
    }

    fun setSignature(path: String) {
        _uiState.value.draft?.let { current ->
            _uiState.update { it.copy(draft = current.copy(signaturePath = path)) }
        }
    }

    fun submitDraft() {
        val draft = _uiState.value.draft ?: return
        val selectedClient = _uiState.value.selectedClient

        viewModelScope.launch {
            _uiState.update { it.copy(isSubmitting = true, error = null) }

            try {
                when (val mode = _uiState.value.mode) {
                    is WizardMode.ExistingOrder -> submitExistingOrder(mode.orderId, draft)
                    is WizardMode.NewOrder -> {
                        if (selectedClient == null) {
                            _uiState.update { it.copy(error = "请选择客户", isSubmitting = false) }
                            return@launch
                        }
                        createWorkOrderAndSubmit(selectedClient, draft)
                    }
                }
            } catch (e: Exception) {
                _uiState.update { it.copy(isSubmitting = false, error = e.message ?: "提交失败") }
            }
        }
    }

    private suspend fun submitExistingOrder(workOrderId: Int, draft: MeasurementDraft) {
        val basicInfo = BasicInfoRequest(
            contact_name = draft.contactName,
            contact_phone = draft.contactPhone,
            address = draft.address,
            project_type = draft.projectType,
            notes = draft.notes
        )

        val materials = draft.materials.map { mat ->
            MaterialSubmitRequest(
                type = mat.type,
                faces = mat.faces?.map { face ->
                    FaceSubmitRequest(
                        name = face.name,
                        width = face.width,
                        height = face.height,
                        area = face.area ?: face.calculatedArea,
                        depth = face.depth,
                        photos = face.photos,
                        notes = face.notes
                    )
                },
                notes = mat.notes
            )
        }

        val result = withTimeoutOrNull(10000) {
            App.instance.measurementRepository.submitMeasurement(
                workOrderId = workOrderId,
                basicInfo = basicInfo,
                materials = materials,
                signaturePath = draft.signaturePath
            )
        }

        result?.getOrNull()?.let {
            _uiState.update { it.copy(isSubmitting = false, submitSuccess = true) }
        } ?: run {
            _uiState.update { it.copy(isSubmitting = false, error = "提交超时，请重试") }
        }
    }

    private suspend fun createWorkOrderAndSubmit(client: Client, draft: MeasurementDraft) {
        // 1. 创建工单
        val createRequest = CreateWorkOrderRequest(
            client_id = client.id,
            title = draft.notes ?: "${client.name} - 现场测量",
            address = draft.address ?: client.address ?: "",
            description = draft.notes,
            source = "field_created"
        )

        val createResult = withTimeoutOrNull(10000) {
            App.instance.taskRepository.createWorkOrder(createRequest)
        }

        val workOrder = createResult?.getOrNull()
            ?: run {
                _uiState.update { it.copy(error = "创建工单失败", isSubmitting = false) }
                return
            }

        // 2. 提交测量数据
        submitExistingOrder(workOrder.id, draft.copy(orderId = workOrder.id))
    }

    fun resetState() {
        _uiState.value = MeasurementUiState()
    }
}