package com.banghe.measure.presentation.measurement

import androidx.compose.foundation.clickable
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.banghe.measure.domain.model.Client
import com.banghe.measure.domain.model.MeasurementDraft
import com.banghe.measure.domain.model.WorkOrder

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun StepBasicInfo(
    mode: WizardMode,
    draft: MeasurementDraft?,
    clients: List<Client> = emptyList(),
    selectedClient: Client? = null,
    duplicateWarning: WorkOrder? = null,
    onClientSelected: (Client) -> Unit = {},
    onSearchClients: (String) -> Unit = {},
    onDismissDuplicate: () -> Unit = {},
    onUpdate: (MeasurementDraft) -> Unit,
    onNext: () -> Unit
) {
    var contactName by remember { mutableStateOf(draft?.contactName ?: "") }
    var contactPhone by remember { mutableStateOf(draft?.contactPhone ?: "") }
    var address by remember { mutableStateOf(draft?.address ?: "") }
    var projectType by remember { mutableStateOf(draft?.projectType ?: "") }
    var weather by remember { mutableStateOf(draft?.weather ?: "") }
    var notes by remember { mutableStateOf(draft?.notes ?: "") }
    var showClientPicker by remember { mutableStateOf(false) }
    var searchQuery by remember { mutableStateOf("") }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp)
            .verticalScroll(rememberScrollState())
    ) {
        // 现场开单模式：显示客户选择
        if (mode == WizardMode.NewOrder) {
            Text(
                text = "客户信息",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.SemiBold
            )
            Spacer(modifier = Modifier.height(12.dp))

            OutlinedTextField(
                value = selectedClient?.name ?: "",
                onValueChange = {},
                label = { Text("选择客户") },
                readOnly = true,
                trailingIcon = {
                    IconButton(onClick = { showClientPicker = true }) {
                        Icon(Icons.Default.ArrowDropDown, contentDescription = "选择")
                    }
                },
                modifier = Modifier.fillMaxWidth().clickable { showClientPicker = true }
            )

            Spacer(modifier = Modifier.height(12.dp))

            // 去重提示
            if (duplicateWarning != null) {
                Card(
                    colors = CardDefaults.cardColors(
                        containerColor = MaterialTheme.colorScheme.errorContainer
                    ),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(modifier = Modifier.padding(12.dp)) {
                        Text(
                            text = "该客户此地址已有工单",
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.onErrorContainer
                        )
                        Text(
                            text = "工单号：${duplicateWarning.workOrderNo}",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onErrorContainer
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            TextButton(onClick = onDismissDuplicate) {
                                Text("继续创建")
                            }
                            OutlinedButton(onClick = {
                                onDismissDuplicate()
                                // TODO: Navigate to existing order
                            }) {
                                Text("查看现有")
                            }
                        }
                    }
                }
                Spacer(modifier = Modifier.height(12.dp))
            }
        }

        Text(
            text = "基本信息",
            style = MaterialTheme.typography.titleMedium,
            fontWeight = FontWeight.SemiBold
        )
        Spacer(modifier = Modifier.height(12.dp))

        OutlinedTextField(
            value = contactName,
            onValueChange = { contactName = it },
            label = { Text("联系人") },
            modifier = Modifier.fillMaxWidth(),
            singleLine = true
        )

        Spacer(modifier = Modifier.height(12.dp))

        OutlinedTextField(
            value = contactPhone,
            onValueChange = { contactPhone = it },
            label = { Text("联系电话") },
            modifier = Modifier.fillMaxWidth(),
            singleLine = true
        )

        Spacer(modifier = Modifier.height(12.dp))

        OutlinedTextField(
            value = address,
            onValueChange = { address = it },
            label = { Text("项目地址") },
            modifier = Modifier.fillMaxWidth(),
            singleLine = true
        )

        Spacer(modifier = Modifier.height(12.dp))

        OutlinedTextField(
            value = projectType,
            onValueChange = { projectType = it },
            label = { Text("项目类型") },
            placeholder = { Text("如：商场广告、门头招牌") },
            modifier = Modifier.fillMaxWidth(),
            singleLine = true
        )

        Spacer(modifier = Modifier.height(16.dp))

        Text(
            text = "现场环境",
            style = MaterialTheme.typography.titleMedium,
            fontWeight = FontWeight.SemiBold
        )
        Spacer(modifier = Modifier.height(12.dp))

        OutlinedTextField(
            value = weather,
            onValueChange = { weather = it },
            label = { Text("天气状况") },
            placeholder = { Text("如：晴天、阴天、雨天") },
            modifier = Modifier.fillMaxWidth(),
            singleLine = true
        )

        Spacer(modifier = Modifier.height(16.dp))

        OutlinedTextField(
            value = notes,
            onValueChange = { notes = it },
            label = { Text("备注说明") },
            modifier = Modifier.fillMaxWidth().height(120.dp),
            maxLines = 4
        )

        Spacer(modifier = Modifier.height(24.dp))

        Button(
            onClick = {
                val newDraft = draft?.copy(
                    contactName = contactName.ifBlank { null },
                    contactPhone = contactPhone.ifBlank { null },
                    address = address.ifBlank { null },
                    projectType = projectType.ifBlank { null },
                    weather = weather.ifBlank { null },
                    notes = notes.ifBlank { null }
                ) ?: MeasurementDraft(
                    orderId = 0,
                    contactName = contactName.ifBlank { null },
                    contactPhone = contactPhone.ifBlank { null },
                    address = address.ifBlank { null },
                    projectType = projectType.ifBlank { null },
                    weather = weather.ifBlank { null },
                    notes = notes.ifBlank { null }
                )
                onUpdate(newDraft)
                onNext()
            },
            modifier = Modifier.fillMaxWidth().height(56.dp)
        ) {
            Text("下一步")
            Spacer(modifier = Modifier.width(8.dp))
            Icon(Icons.Default.ArrowForward, contentDescription = null)
        }
    }

    // 客户选择对话框
    if (showClientPicker) {
        ClientPickerDialog(
            clients = clients,
            searchQuery = searchQuery,
            onSearchQueryChange = { searchQuery = it; onSearchClients(it) },
            onClientSelected = { client ->
                onClientSelected(client)
                showClientPicker = false
            },
            onDismiss = { showClientPicker = false }
        )
    }
}

@Composable
private fun ClientPickerDialog(
    clients: List<Client>,
    searchQuery: String,
    onSearchQueryChange: (String) -> Unit,
    onClientSelected: (Client) -> Unit,
    onDismiss: () -> Unit
) {
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("选择客户") },
        text = {
            Column {
                OutlinedTextField(
                    value = searchQuery,
                    onValueChange = onSearchQueryChange,
                    placeholder = { Text("搜索客户名称") },
                    leadingIcon = { Icon(Icons.Default.Search, null) },
                    modifier = Modifier.fillMaxWidth()
                )
                Spacer(modifier = Modifier.height(12.dp))
                if (clients.isEmpty()) {
                    Text("暂无客户数据", modifier = Modifier.padding(16.dp))
                } else {
                    LazyColumn(modifier = Modifier.height(300.dp)) {
                        items(clients.size) { index ->
                            val client = clients[index]
                            ListItem(
                                headlineContent = { Text(client.name) },
                                supportingContent = client.contactName?.let { { Text(it) } },
                                modifier = Modifier.clickable { onClientSelected(client) }
                            )
                        }
                    }
                }
            }
        },
        confirmButton = {
            TextButton(onClick = onDismiss) { Text("取消") }
        }
    )
}