package com.banghe.measure.presentation.update

import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.lifecycle.ViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AppUpdateDialog(
    version: String,
    changelog: String,
    isForce: Boolean,
    onUpdate: () -> Unit,
    onDismiss: () -> Unit
) {
    AlertDialog(
        onDismissRequest = { if (!isForce) onDismiss() },
        title = {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(Icons.Default.SystemUpdate, contentDescription = null)
                Spacer(Modifier.width(8.dp))
                Text("发现新版本")
            }
        },
        text = {
            Column {
                Text(
                    text = "v$version",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold
                )
                Spacer(Modifier.height(16.dp))
                Text(
                    text = "更新内容:",
                    style = MaterialTheme.typography.labelMedium
                )
                Spacer(Modifier.height(8.dp))
                Text(
                    text = changelog,
                    style = MaterialTheme.typography.bodyMedium
                )
                if (isForce) {
                    Spacer(Modifier.height(16.dp))
                    Surface(
                        color = MaterialTheme.colorScheme.errorContainer,
                        shape = MaterialTheme.shapes.small
                    ) {
                        Text(
                            text = "此版本为强制更新",
                            modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp),
                            color = MaterialTheme.colorScheme.onErrorContainer,
                            style = MaterialTheme.typography.labelSmall
                        )
                    }
                }
            }
        },
        confirmButton = {
            Button(onClick = onUpdate) {
                Text("立即更新")
            }
        },
        dismissButton = {
            if (!isForce) {
                TextButton(onClick = onDismiss) {
                    Text("稍后提醒")
                }
            }
        }
    )
}

data class AppUpdateInfo(
    val versionCode: Int,
    val versionName: String,
    val changelog: String,
    val downloadUrl: String,
    val isForce: Boolean
)

class AppUpdateViewModel : ViewModel() {
    private val _updateInfo = MutableStateFlow<AppUpdateInfo?>(null)
    val updateInfo: StateFlow<AppUpdateInfo?> = _updateInfo

    private val _isChecking = MutableStateFlow(false)
    val isChecking: StateFlow<Boolean> = _isChecking

    suspend fun checkUpdate() {
        _isChecking.value = true
        // TODO: 从 API 检查更新
        _isChecking.value = false
    }

    fun downloadAndInstall() {
        // TODO: 下载 APK 并安装
    }
}