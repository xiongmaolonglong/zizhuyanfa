package com.banghe.measure.presentation.design

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

data class DesignTask(
    val id: Int,
    val title: String,
    val status: String,
    val designer: String?,
    val deadline: String?,
    val priority: String
)

data class DesignUiState(
    val isLoading: Boolean = false,
    val tasks: List<DesignTask> = emptyList(),
    val error: String? = null
)

class DesignViewModel : ViewModel() {
    private val _uiState = MutableStateFlow(DesignUiState())
    val uiState: StateFlow<DesignUiState> = _uiState

    fun loadTasks() {
        _uiState.value = _uiState.value.copy(isLoading = true)
        // TODO: 从 API 加载
        _uiState.value = _uiState.value.copy(isLoading = false, tasks = emptyList())
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DesignTaskScreen(
    viewModel: DesignViewModel = viewModel()
) {
    val uiState by viewModel.uiState.collectAsState()

    LaunchedEffect(Unit) {
        viewModel.loadTasks()
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("设计任务", fontWeight = FontWeight.Bold) }
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
                        Icon(Icons.Default.Create, contentDescription = null, modifier = Modifier.size(64.dp))
                        Spacer(Modifier.height(16.dp))
                        Text("暂无设计任务")
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
                        DesignTaskCard(task)
                    }
                }
            }
        }
    }
}

@Composable
private fun DesignTaskCard(task: DesignTask) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        onClick = { /* TODO: Navigate to detail */ }
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Text(task.title, fontWeight = FontWeight.Medium)
                PriorityChip(task.priority)
            }
            if (task.designer != null) {
                Spacer(Modifier.height(4.dp))
                Text("设计师: ${task.designer}", style = MaterialTheme.typography.bodySmall)
            }
            if (task.deadline != null) {
                Spacer(Modifier.height(4.dp))
                Text("截止: ${task.deadline}", style = MaterialTheme.typography.bodySmall)
            }
        }
    }
}

@Composable
private fun PriorityChip(priority: String) {
    val color = when (priority) {
        "high" -> MaterialTheme.colorScheme.error
        "medium" -> MaterialTheme.colorScheme.tertiary
        else -> MaterialTheme.colorScheme.outline
    }
    Surface(
        shape = MaterialTheme.shapes.small,
        color = color.copy(alpha = 0.1f)
    ) {
        Text(priority, modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp), color = color)
    }
}