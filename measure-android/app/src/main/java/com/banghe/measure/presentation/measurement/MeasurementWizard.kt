package com.banghe.measure.presentation.measurement

import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MeasurementWizard(
    mode: WizardMode = WizardMode.NewOrder,
    onComplete: () -> Unit,
    onCancel: () -> Unit,
    onOpenCamera: (String) -> Unit = {},
    viewModel: MeasurementViewModel = viewModel()
) {
    var currentStep by remember { mutableIntStateOf(0) }
    val uiState by viewModel.uiState.collectAsState()
    val draft = uiState.draft

    LaunchedEffect(mode) {
        viewModel.setMode(mode)
    }

    LaunchedEffect(uiState.submitSuccess) {
        if (uiState.submitSuccess) {
            onComplete()
        }
    }

    val steps = listOf("基本信息", "材料测量", "客户签名", "确认提交")

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("量尺记录", fontWeight = FontWeight.Bold) },
                navigationIcon = {
                    IconButton(onClick = onCancel) {
                        Icon(Icons.Default.Close, contentDescription = "取消")
                    }
                }
            )
        }
    ) { paddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
        ) {
            StepIndicator(
                steps = steps,
                currentStep = currentStep,
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp, vertical = 8.dp)
            )

            if (uiState.error != null) {
                Snackbar(
                    modifier = Modifier.padding(16.dp),
                    action = {
                        TextButton(onClick = { viewModel.submitDraft() }) {
                            Text("重试")
                        }
                    }
                ) {
                    Text(uiState.error!!)
                }
            }

            when (currentStep) {
                0 -> StepBasicInfo(
                    mode = uiState.mode,
                    draft = draft,
                    clients = uiState.clients,
                    selectedClient = uiState.selectedClient,
                    duplicateWarning = uiState.duplicateWarning,
                    onClientSelected = { viewModel.selectClient(it) },
                    onSearchClients = { viewModel.searchClients(it) },
                    onDismissDuplicate = { viewModel.dismissDuplicateWarning() },
                    onUpdate = { viewModel.updateDraft(it) },
                    onNext = { currentStep = 1 }
                )
                1 -> StepMaterials(
                    materials = draft?.materials ?: emptyList(),
                    onAddMaterial = { viewModel.addMaterial(it) },
                    onUpdateMaterial = { index, material -> viewModel.updateMaterial(index, material) },
                    onRemoveMaterial = { index -> viewModel.removeMaterial(index) },
                    onNext = { currentStep = 2 },
                    onPrev = { currentStep = 0 },
                    onTakePhoto = { _, _ ->
                        val orderId = when (mode) {
                            is WizardMode.ExistingOrder -> mode.orderId.toString()
                            is WizardMode.NewOrder -> "new"
                        }
                        onOpenCamera(orderId)
                    }
                )
                2 -> StepSignature(
                    signaturePath = draft?.signaturePath,
                    onSignatureSaved = { path -> viewModel.setSignature(path) },
                    onNext = { currentStep = 3 },
                    onPrev = { currentStep = 1 }
                )
                3 -> StepReview(
                    draft = draft,
                    isSubmitting = uiState.isSubmitting,
                    onSubmit = { viewModel.submitDraft() },
                    onPrev = { currentStep = 2 }
                )
            }
        }
    }
}

@Composable
private fun StepIndicator(
    steps: List<String>,
    currentStep: Int,
    modifier: Modifier = Modifier
) {
    Row(
        modifier = modifier,
        horizontalArrangement = Arrangement.spacedBy(4.dp)
    ) {
        steps.forEachIndexed { index, _ ->
            val isActive = index == currentStep
            val isCompleted = index < currentStep

            Row(
                modifier = Modifier.weight(1f),
                horizontalArrangement = Arrangement.Center
            ) {
                Box(
                    modifier = Modifier.size(28.dp),
                    contentAlignment = androidx.compose.ui.Alignment.Center
                ) {
                    if (isCompleted) {
                        Icon(
                            Icons.Default.CheckCircle,
                            contentDescription = null,
                            tint = MaterialTheme.colorScheme.primary,
                            modifier = Modifier.size(28.dp)
                        )
                    } else {
                        Surface(
                            shape = MaterialTheme.shapes.small,
                            color = if (isActive) MaterialTheme.colorScheme.primary
                                    else MaterialTheme.colorScheme.surfaceVariant,
                            modifier = Modifier.size(28.dp)
                        ) {
                            Text(
                                text = "${index + 1}",
                                style = MaterialTheme.typography.labelMedium,
                                fontWeight = FontWeight.Bold,
                                color = if (isActive) MaterialTheme.colorScheme.onPrimary
                                        else MaterialTheme.colorScheme.onSurfaceVariant,
                                modifier = Modifier.padding(4.dp)
                            )
                        }
                    }
                }
            }
        }
    }
}