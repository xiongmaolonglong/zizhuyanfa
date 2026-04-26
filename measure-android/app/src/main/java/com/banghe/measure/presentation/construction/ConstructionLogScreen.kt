package com.banghe.measure.presentation.construction

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

data class ConstructionLog(
    val id: Int,
    val date: String,
    val content: String,
    val status: String,
    val photos: List<String> = emptyList()
)

data class ConstructionLogUiState(
    val isLoading: Boolean = false,
    val logs: List<ConstructionLog> = emptyList(),
    val error: String? = null
)

class ConstructionLogViewModel : ViewModel() {
    private val _uiState = MutableStateFlow(ConstructionLogUiState())
    val uiState: StateFlow<ConstructionLogUiState> = _uiState

    suspend fun loadLogs(orderId: Int) {
        _uiState.value = _uiState.value.copy(isLoading = true)
        // TODO: 从 API 加载
        _uiState.value = _uiState.value.copy(isLoading = false, logs = emptyList())
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ConstructionLogScreen(
    orderId: Int,
    viewModel: ConstructionLogViewModel = viewModel()
) {
    val uiState by viewModel.uiState.collectAsState()

    LaunchedEffect(orderId) {
        viewModel.loadLogs(orderId)
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("施工记录", fontWeight = FontWeight.Bold) }
            )
        },
        floatingActionButton = {
            FloatingActionButton(onClick = { /* TODO: Add new log */ }) {
                Icon(Icons.Default.Add, contentDescription = "添加记录")
            }
        }
    ) { paddingValues ->
        when {
            uiState.isLoading -> {
                Box(
                    modifier = Modifier.fillMaxSize().padding(paddingValues),
                    contentAlignment = Alignment.Center
                ) {
                    CircularProgressIndicator()
                }
            }
            uiState.logs.isEmpty() -> {
                Box(
                    modifier = Modifier.fillMaxSize().padding(paddingValues),
                    contentAlignment = Alignment.Center
                ) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Icon(Icons.Default.History, contentDescription = null, modifier = Modifier.size(64.dp))
                        Spacer(modifier = Modifier.height(16.dp))
                        Text("暂无施工记录")
                    }
                }
            }
            else -> {
                LazyColumn(
                    modifier = Modifier.fillMaxSize().padding(paddingValues),
                    contentPadding = PaddingValues(16.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    items(uiState.logs) { log ->
                        ConstructionLogCard(log)
                    }
                }
            }
        }
    }
}

@Composable
private fun ConstructionLogCard(log: ConstructionLog) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surfaceVariant
        )
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Text(log.date, style = MaterialTheme.typography.labelMedium)
                StatusChip(log.status)
            }
            Spacer(modifier = Modifier.height(8.dp))
            Text(log.content, style = MaterialTheme.typography.bodyMedium)
            if (log.photos.isNotEmpty()) {
                Spacer(modifier = Modifier.height(8.dp))
                Text("照片: ${log.photos.size}张", style = MaterialTheme.typography.labelSmall)
            }
        }
    }
}

@Composable
private fun StatusChip(status: String) {
    val (text, color) = when (status) {
        "completed" -> "已完成" to MaterialTheme.colorScheme.primary
        "in_progress" -> "进行中" to MaterialTheme.colorScheme.secondary
        else -> status to MaterialTheme.colorScheme.outline
    }
    Surface(
        shape = MaterialTheme.shapes.small,
        color = color.copy(alpha = 0.1f)
    ) {
        Text(text, modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp), color = color)
    }
}