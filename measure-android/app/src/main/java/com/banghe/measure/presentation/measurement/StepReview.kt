package com.banghe.measure.presentation.measurement

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
import com.banghe.measure.domain.model.MeasurementDraft

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun StepReview(
    draft: MeasurementDraft?,
    isSubmitting: Boolean = false,
    onSubmit: () -> Unit,
    onPrev: () -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp)
            .verticalScroll(rememberScrollState())
    ) {
        Text(
            text = "确认提交",
            style = MaterialTheme.typography.titleMedium,
            fontWeight = FontWeight.SemiBold
        )

        Spacer(modifier = Modifier.height(16.dp))

        if (draft == null) {
            Text("数据未准备好，请返回检查")
        } else {
            // 基本信息
            ReviewSection(title = "基本信息") {
                ReviewItem("联系人", draft.contactName ?: "未填写")
                ReviewItem("联系电话", draft.contactPhone ?: "未填写")
                ReviewItem("项目地址", draft.address ?: "未填写")
                ReviewItem("项目类型", draft.projectType ?: "未填写")
                ReviewItem("天气", draft.weather ?: "未填写")
                ReviewItem("备注", draft.notes ?: "无")
            }

            Spacer(modifier = Modifier.height(12.dp))

            // 材料清单
            ReviewSection(title = "材料清单") {
                if (draft.materials.isEmpty()) {
                    Text("无材料", color = MaterialTheme.colorScheme.onSurfaceVariant)
                } else {
                    draft.materials.forEach { material ->
                        Text(
                            text = material.type,
                            style = MaterialTheme.typography.labelLarge,
                            fontWeight = FontWeight.Medium
                        )
                        Spacer(modifier = Modifier.height(4.dp))
                        material.faces?.forEach { face ->
                            val areaDisplay = String.format("%.2f", face.calculatedArea)
                            Text(
                                text = "${face.name}: ${face.width ?: 0.0}×${face.height ?: 0.0}m = ${areaDisplay}m²",
                                style = MaterialTheme.typography.bodyMedium
                            )
                        }
                        if (!material.notes.isNullOrBlank()) {
                            Text(
                                text = "备注: ${material.notes}",
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                        Spacer(modifier = Modifier.height(8.dp))
                    }

                    // 总面积计算
                    val totalArea = draft.materials.sumOf { m ->
                        m.faces?.sumOf { f -> f.calculatedArea } ?: 0.0
                    }
                    Text(
                        text = "总面积: ${String.format("%.2f", totalArea)} m²",
                        style = MaterialTheme.typography.titleSmall,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.primary
                    )
                }
            }

            Spacer(modifier = Modifier.height(12.dp))

            // 签名
            ReviewSection(title = "客户签名") {
                if (draft.signaturePath != null) {
                    Row(verticalAlignment = androidx.compose.ui.Alignment.CenterVertically) {
                        Icon(
                            Icons.Default.CheckCircle,
                            contentDescription = null,
                            tint = MaterialTheme.colorScheme.primary
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text("已签名", color = MaterialTheme.colorScheme.primary)
                    }
                } else {
                    Text("未签名", color = MaterialTheme.colorScheme.error)
                }
            }

            Spacer(modifier = Modifier.height(24.dp))

            // 提示
            Card(
                colors = CardDefaults.cardColors(
                    containerColor = MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.3f)
                )
            ) {
                Row(
                    modifier = Modifier.padding(12.dp),
                    verticalAlignment = androidx.compose.ui.Alignment.CenterVertically
                ) {
                    Icon(
                        Icons.Default.Info,
                        contentDescription = null,
                        tint = MaterialTheme.colorScheme.primary
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        text = "提交后将保存并同步到服务器",
                        style = MaterialTheme.typography.bodySmall
                    )
                }
            }

            Spacer(modifier = Modifier.height(24.dp))

            // 底部按钮
            Row(
                modifier = Modifier.fillMaxWidth(),
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
                    onClick = onSubmit,
                    modifier = Modifier.weight(1f).height(56.dp),
                    enabled = !isSubmitting && draft.materials.isNotEmpty()
                ) {
                    if (isSubmitting) {
                        CircularProgressIndicator(
                            modifier = Modifier.size(24.dp),
                            strokeWidth = 2.dp,
                            color = MaterialTheme.colorScheme.onPrimary
                        )
                    } else {
                        Icon(Icons.Default.Send, contentDescription = null)
                        Spacer(modifier = Modifier.width(8.dp))
                        Text("提交")
                    }
                }
            }
        }
    }
}

@Composable
private fun ReviewSection(
    title: String,
    content: @Composable ColumnScope.() -> Unit
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surfaceVariant
        )
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Text(
                text = title,
                style = MaterialTheme.typography.titleSmall,
                fontWeight = FontWeight.SemiBold
            )
            Spacer(modifier = Modifier.height(12.dp))
            content()
        }
    }
}

@Composable
private fun ReviewItem(label: String, value: String) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 4.dp)
    ) {
        Text(
            text = "$label:",
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            modifier = Modifier.width(80.dp)
        )
        Text(
            text = value,
            style = MaterialTheme.typography.bodyMedium
        )
    }
}