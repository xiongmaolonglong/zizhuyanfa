package com.banghe.measure.presentation.archive

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

data class ArchiveItem(
    val id: Int,
    val title: String,
    val type: String,
    val createdAt: String
)

data class ArchiveUiState(
    val isLoading: Boolean = false,
    val archives: List<ArchiveItem> = emptyList(),
    val error: String? = null,
    val searchQuery: String = ""
)

class ArchiveViewModel : ViewModel() {
    private val _uiState = MutableStateFlow(ArchiveUiState())
    val uiState: StateFlow<ArchiveUiState> = _uiState

    fun loadArchives() {
        _uiState.value = _uiState.value.copy(isLoading = true)
        // TODO: 从 API 加载
        _uiState.value = _uiState.value.copy(isLoading = false, archives = emptyList())
    }

    fun search(query: String) {
        _uiState.value = _uiState.value.copy(searchQuery = query)
        // TODO: 搜索
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ArchiveScreen(
    viewModel: ArchiveViewModel = viewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    var searchQuery by remember { mutableStateOf("") }

    LaunchedEffect(Unit) {
        viewModel.loadArchives()
    }

    Scaffold(
        topBar = {
            Column {
                TopAppBar(
                    title = { Text("档案管理", fontWeight = FontWeight.Bold) }
                )
                OutlinedTextField(
                    value = searchQuery,
                    onValueChange = {
                        searchQuery = it
                        viewModel.search(it)
                    },
                    placeholder = { Text("搜索档案...") },
                    leadingIcon = { Icon(Icons.Default.Search, contentDescription = null) },
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp, vertical = 8.dp),
                    singleLine = true
                )
            }
        }
    ) { paddingValues ->
        when {
            uiState.isLoading -> {
                Box(Modifier.fillMaxSize().padding(paddingValues), contentAlignment = Alignment.Center) {
                    CircularProgressIndicator()
                }
            }
            uiState.archives.isEmpty() -> {
                Box(Modifier.fillMaxSize().padding(paddingValues), contentAlignment = Alignment.Center) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Icon(Icons.Default.Folder, contentDescription = null, modifier = Modifier.size(64.dp))
                        Spacer(Modifier.height(16.dp))
                        Text("暂无档案")
                    }
                }
            }
            else -> {
                LazyColumn(
                    modifier = Modifier.fillMaxSize().padding(paddingValues),
                    contentPadding = PaddingValues(16.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    items(uiState.archives) { archive ->
                        ArchiveCard(archive)
                    }
                }
            }
        }
    }
}

@Composable
private fun ArchiveCard(item: ArchiveItem) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        onClick = { /* TODO: View detail */ }
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(
                when (item.type) {
                    "contract" -> Icons.Default.Description
                    "photo" -> Icons.Default.Image
                    else -> Icons.Default.Folder
                },
                contentDescription = null,
                modifier = Modifier.size(40.dp),
                tint = MaterialTheme.colorScheme.primary
            )
            Spacer(Modifier.width(16.dp))
            Column(modifier = Modifier.weight(1f)) {
                Text(item.title, fontWeight = FontWeight.Medium)
                Spacer(Modifier.height(4.dp))
                Text(item.createdAt, style = MaterialTheme.typography.labelSmall)
            }
            Icon(Icons.Default.KeyboardArrowRight, contentDescription = null)
        }
    }
}