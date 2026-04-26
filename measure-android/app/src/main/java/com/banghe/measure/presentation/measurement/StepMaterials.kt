package com.banghe.measure.presentation.measurement

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.banghe.measure.domain.model.MaterialData
import com.banghe.measure.domain.model.MaterialFace

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun StepMaterials(
    materials: List<MaterialData>,
    onAddMaterial: (MaterialData) -> Unit,
    onUpdateMaterial: (Int, MaterialData) -> Unit,
    onRemoveMaterial: (Int) -> Unit,
    onNext: () -> Unit,
    onPrev: () -> Unit,
    onTakePhoto: (Int, Int) -> Unit = { _, _ -> } // materialIndex, faceIndex
) {
    var showAddDialog by remember { mutableStateOf(false) }
    var editingIndex by remember { mutableIntStateOf(-1) }
    var editingMaterial by remember { mutableStateOf<MaterialData?>(null) }

    Column(
        modifier = Modifier.fillMaxSize()
    ) {
        // 标题和添加按钮
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Text(
                text = "材料清单",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.SemiBold
            )
            IconButton(onClick = { showAddDialog = true }) {
                Icon(Icons.Default.Add, contentDescription = "添加材料")
            }
        }

        if (materials.isEmpty()) {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .weight(1f),
                contentAlignment = androidx.compose.ui.Alignment.Center
            ) {
                Column(horizontalAlignment = androidx.compose.ui.Alignment.CenterHorizontally) {
                    Icon(
                        Icons.Default.Inventory,
                        contentDescription = null,
                        modifier = Modifier.size(64.dp),
                        tint = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    Spacer(modifier = Modifier.height(16.dp))
                    Text(
                        text = "暂无材料",
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    TextButton(onClick = { showAddDialog = true }) {
                        Text("添加第一个材料")
                    }
                }
            }
        } else {
            LazyColumn(
                modifier = Modifier.weight(1f),
                contentPadding = PaddingValues(horizontal = 16.dp, vertical = 8.dp)
            ) {
                itemsIndexed(materials) { index, material ->
                    MaterialCard(
                        material = material,
                        onEdit = {
                            editingIndex = index
                            editingMaterial = material
                        },
                        onDelete = { onRemoveMaterial(index) }
                    )
                }
            }
        }

        // 底部按钮
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            OutlinedButton(
                onClick = onPrev,
                modifier = Modifier.weight(1f).height(56.dp)
            ) {
                Icon(Icons.Default.ArrowBack, contentDescription = null)
                Spacer(modifier = Modifier.width(8.dp))
                Text("上一步")
            }
            Button(
                onClick = onNext,
                modifier = Modifier.weight(1f).height(56.dp),
                enabled = materials.isNotEmpty()
            ) {
                Text("下一步")
                Spacer(modifier = Modifier.width(8.dp))
                Icon(Icons.Default.ArrowForward, contentDescription = null)
            }
        }
    }

    // 添加材料对话框
    if (showAddDialog) {
        MaterialDialog(
            initialMaterial = null,
            onDismiss = { showAddDialog = false },
            onSave = { material ->
                onAddMaterial(material)
                showAddDialog = false
            },
            onTakePhoto = { onTakePhoto(-1, -1) }
        )
    }

    // 编辑材料对话框
    if (editingMaterial != null && editingIndex >= 0) {
        MaterialDialog(
            initialMaterial = editingMaterial,
            onDismiss = {
                editingMaterial = null
                editingIndex = -1
            },
            onSave = { material ->
                onUpdateMaterial(editingIndex, material)
                editingMaterial = null
                editingIndex = -1
            },
            onTakePhoto = { onTakePhoto(editingIndex, -1) }
        )
    }
}

@Composable
private fun MaterialCard(
    material: MaterialData,
    onEdit: () -> Unit,
    onDelete: () -> Unit
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surfaceVariant
        )
    ) {
        Column(
            modifier = Modifier.padding(16.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Text(
                    text = material.type,
                    style = MaterialTheme.typography.titleSmall,
                    fontWeight = FontWeight.SemiBold
                )
                Row {
                    IconButton(onClick = onEdit) {
                        Icon(Icons.Default.Edit, contentDescription = "编辑")
                    }
                    IconButton(onClick = onDelete) {
                        Icon(Icons.Default.Delete, contentDescription = "删除")
                    }
                }
            }

            Spacer(modifier = Modifier.height(8.dp))

            material.faces?.forEach { face ->
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Text(
                        text = "${face.name}:",
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        modifier = Modifier.width(60.dp)
                    )
                    val widthDisplay = face.width ?: 0.0
                    val heightDisplay = face.height ?: 0.0
                    Text(
                        text = "${widthDisplay}×${heightDisplay}m",
                        style = MaterialTheme.typography.bodyMedium,
                        fontWeight = FontWeight.Medium
                    )
                    Text(
                        text = "=${String.format("%.2f", face.calculatedArea)}m²",
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.primary
                    )
                }
            }

            if (!material.notes.isNullOrBlank()) {
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = "备注: ${material.notes}",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun MaterialDialog(
    initialMaterial: MaterialData?,
    onDismiss: () -> Unit,
    onSave: (MaterialData) -> Unit,
    onTakePhoto: () -> Unit = {}
) {
    var type by remember { mutableStateOf(initialMaterial?.type ?: "") }
    var faces by remember { mutableStateOf(initialMaterial?.faces ?: emptyList()) }
    var notes by remember { mutableStateOf(initialMaterial?.notes ?: "") }
    var showFaceDialog by remember { mutableStateOf(false) }
    var editingFaceIndex by remember { mutableIntStateOf(-1) }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text(if (initialMaterial == null) "添加材料" else "编辑材料") },
        text = {
            Column {
                OutlinedTextField(
                    value = type,
                    onValueChange = { type = it },
                    label = { Text("材料类型") },
                    placeholder = { Text("如：铝塑板、不锈钢") },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true
                )

                Spacer(modifier = Modifier.height(16.dp))

                Text("尺寸面", style = MaterialTheme.typography.labelLarge)
                Spacer(modifier = Modifier.height(8.dp))

                faces.forEachIndexed { index, face ->
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Text("${face.name}: ${face.width ?: 0.0}×${face.height ?: 0.0}m")
                        Row {
                            IconButton(onClick = {
                                editingFaceIndex = index
                                showFaceDialog = true
                            }) {
                                Icon(Icons.Default.Edit, contentDescription = null, modifier = Modifier.size(20.dp))
                            }
                            IconButton(onClick = { faces = faces.toMutableList().apply { removeAt(index) } }) {
                                Icon(Icons.Default.Delete, contentDescription = null, modifier = Modifier.size(20.dp))
                            }
                        }
                    }
                }

                TextButton(onClick = {
                    editingFaceIndex = -1
                    showFaceDialog = true
                }) {
                    Icon(Icons.Default.Add, contentDescription = null)
                    Spacer(modifier = Modifier.width(4.dp))
                    Text("添加尺寸面")
                }

                Spacer(modifier = Modifier.height(12.dp))

                OutlinedTextField(
                    value = notes,
                    onValueChange = { notes = it },
                    label = { Text("备注") },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true
                )
            }
        },
        confirmButton = {
            TextButton(
                onClick = {
                    onSave(MaterialData(
                        type = type,
                        faces = faces,
                        notes = notes.ifBlank { null }
                    ))
                },
                enabled = type.isNotBlank()
            ) {
                Text("保存")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("取消")
            }
        }
    )

    if (showFaceDialog) {
        FaceDialog(
            initialFace = if (editingFaceIndex >= 0) faces[editingFaceIndex] else null,
            onDismiss = { showFaceDialog = false },
            onSave = { face ->
                if (editingFaceIndex >= 0) {
                    faces = faces.toMutableList().apply { this[editingFaceIndex] = face }
                } else {
                    faces = faces + face
                }
                showFaceDialog = false
            },
            onTakePhoto = onTakePhoto
        )
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun FaceDialog(
    initialFace: MaterialFace?,
    onDismiss: () -> Unit,
    onSave: (MaterialFace) -> Unit,
    onTakePhoto: () -> Unit = {}
) {
    var name by remember { mutableStateOf(initialFace?.name ?: "正面") }
    var width by remember { mutableStateOf(initialFace?.width?.toString() ?: "") }
    var height by remember { mutableStateOf(initialFace?.height?.toString() ?: "") }
    var notes by remember { mutableStateOf(initialFace?.notes ?: "") }
    var photos by remember { mutableStateOf(initialFace?.photos ?: emptyList()) }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text(if (initialFace == null) "添加尺寸面" else "编辑尺寸面") },
        text = {
            Column {
                OutlinedTextField(
                    value = name,
                    onValueChange = { name = it },
                    label = { Text("面标识") },
                    placeholder = { Text("正面、侧面、顶部等") },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true
                )

                Spacer(modifier = Modifier.height(12.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    OutlinedTextField(
                        value = width,
                        onValueChange = { width = it },
                        label = { Text("宽度(m)") },
                        modifier = Modifier.weight(1f),
                        singleLine = true
                    )
                    OutlinedTextField(
                        value = height,
                        onValueChange = { height = it },
                        label = { Text("高度(m)") },
                        modifier = Modifier.weight(1f),
                        singleLine = true
                    )
                }

                Spacer(modifier = Modifier.height(12.dp))

                // 照片区域
                Text("现场照片", style = MaterialTheme.typography.labelLarge)
                Spacer(modifier = Modifier.height(8.dp))

                if (photos.isNotEmpty()) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        photos.forEach { photoPath ->
                            Card(
                                modifier = Modifier.size(60.dp),
                                colors = CardDefaults.cardColors(
                                    containerColor = MaterialTheme.colorScheme.surfaceVariant
                                )
                            ) {
                                Box(
                                    modifier = Modifier.fillMaxSize(),
                                    contentAlignment = androidx.compose.ui.Alignment.Center
                                ) {
                                    Icon(
                                        Icons.Default.Image,
                                        contentDescription = "照片",
                                        tint = MaterialTheme.colorScheme.primary
                                    )
                                }
                            }
                        }
                    }
                    Spacer(modifier = Modifier.height(8.dp))
                }

                OutlinedButton(
                    onClick = {
                        onTakePhoto()
                        photos = photos + "photo_${System.currentTimeMillis()}.jpg"
                    },
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Icon(Icons.Default.CameraAlt, contentDescription = null, modifier = Modifier.size(18.dp))
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("拍照 (${photos.size}张)")
                }

                Spacer(modifier = Modifier.height(12.dp))

                OutlinedTextField(
                    value = notes,
                    onValueChange = { notes = it },
                    label = { Text("备注") },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true
                )
            }
        },
        confirmButton = {
            TextButton(
                onClick = {
                    onSave(MaterialFace(
                        name = name,
                        width = width.toDoubleOrNull(),
                        height = height.toDoubleOrNull(),
                        notes = notes.ifBlank { null },
                        photos = photos
                    ))
                },
                enabled = width.toDoubleOrNull() != null && height.toDoubleOrNull() != null
            ) {
                Text("保存")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("取消")
            }
        }
    )
}