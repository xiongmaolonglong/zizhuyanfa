package com.banghe.measure.presentation.production

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewmodel.compose.viewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow

data class ProductionTask(
    val id: Int,
    val materialName: String,
    val specifications: String,
    val quantity: Int,
    val status: String,
    val orderId: Int,
    val orderTitle: String
)

data class ProductionUiState(
    val isLoading: Boolean = false,
    val tasks: List<ProductionTask> = emptyList(),
    val error: String? = null
)

class ProductionViewModel : ViewModel() {
    private val _uiState = MutableStateFlow(ProductionUiState())
    val uiState: StateFlow<ProductionUiState> = _uiState

    fun loadTasks() {
        _uiState.value = _uiState.value.copy(isLoading = true)
        // TODO: 从 API 加载
        _uiState.value = _uiState.value.copy(isLoading = false, tasks = emptyList())
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ProductionTaskScreen(
    viewModel: ProductionViewModel = viewModel()
) {
    val uiState by viewModel.uiState.collectAsState()

    LaunchedEffect(Unit) {
        viewModel.loadTasks()
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("生产任务", fontWeight = FontWeight.Bold) }
            )
        }
    ) { paddingValues ->
        when {
            uiState.isLoading -> {
                Box(Modifier.fillMaxSize().padding(paddingValues), contentAlignment = Alignment.Center) {
                    CircularProgressIndicator()
                }
            }
            uiState.tasks.isEmpty() -> {
                Box(Modifier.fillMaxSize().padding(paddingValues), contentAlignment = Alignment.Center) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Icon(Icons.Default.Domain, contentDescription = null, modifier = Modifier.size(64.dp))
                        Spacer(Modifier.height(16.dp))
                        Text("暂无生产任务")
                    }
                }
            }
            else -> {
                LazyColumn(
                    modifier = Modifier.fillMaxSize().padding(paddingValues),
                    contentPadding = PaddingValues(16.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    items(uiState.tasks) { task ->
                        ProductionTaskCard(task)
                    }
                }
            }
        }
    }
}

@Composable
private fun ProductionTaskCard(task: ProductionTask) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        onClick = { /* TODO: Navigate to detail */ }
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Text(task.materialName, fontWeight = FontWeight.Medium)
                ProductionStatusChip(task.status)
            }
            Spacer(Modifier.height(8.dp))
            Text("规格: ${task.specifications}", style = MaterialTheme.typography.bodySmall)
            Text("数量: ${task.quantity}", style = MaterialTheme.typography.bodySmall)
            Text("工单: ${task.orderTitle}", style = MaterialTheme.typography.bodySmall)
        }
    }
}

@Composable
private fun ProductionStatusChip(status: String) {
    val (text, color) = when (status) {
        "pending" -> "待生产" to MaterialTheme.colorScheme.tertiary
        "in_progress" -> "生产中" to MaterialTheme.colorScheme.primary
        "completed" -> "已完成" to MaterialTheme.colorScheme.secondary
        else -> status to MaterialTheme.colorScheme.outline
    }
    Surface(
        shape = MaterialTheme.shapes.small,
        color = color.copy(alpha = 0.1f)
    ) {
        Text(text, modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp), color = color)
    }
}