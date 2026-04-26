package com.banghe.measure.presentation.update

import android.app.DownloadManager
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Environment
import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.SystemUpdate
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.core.content.FileProvider
import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import com.banghe.measure.core.App
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.withContext
import org.json.JSONObject
import java.io.File
import java.net.HttpURLConnection
import java.net.URL

data class AppUpdateInfo(
    val latestVersion: String,
    val changelog: List<String>,
    val downloadUrl: String,
    val isForce: Boolean
)

class AppUpdateViewModel : ViewModel() {
    private val _updateInfo = MutableStateFlow<AppUpdateInfo?>(null)
    val updateInfo: StateFlow<AppUpdateInfo?> = _updateInfo.asStateFlow()

    private val _isChecking = MutableStateFlow(false)
    val isChecking: StateFlow<Boolean> = _isChecking.asStateFlow()

    private val _downloadProgress = MutableStateFlow(0f)
    val downloadProgress: StateFlow<Float> = _downloadProgress.asStateFlow()

    suspend fun checkUpdate(currentVersion: String) {
        _isChecking.value = true
        try {
            val url = URL("https://www.fsbhgg.com/api/v1/app/check-version")
            val conn = url.openConnection() as HttpURLConnection
            conn.requestMethod = "POST"
            conn.setRequestProperty("Content-Type", "application/json")
            conn.doOutput = true
            conn.connectTimeout = 8000
            conn.readTimeout = 8000

            val body = JSONObject().apply {
                put("app_name", "measure-app")
                put("platform", "android")
                put("current_version", currentVersion)
            }
            conn.outputStream.write(body.toString().toByteArray())

            val responseCode = conn.responseCode
            if (responseCode == 200) {
                val resp = JSONObject(conn.inputStream.bufferedReader().readText())
                val data = resp.getJSONObject("data")
                if (data.optBoolean("has_update", false)) {
                    val changelogRaw = data.optJSONArray("changelog")
                    val changelogList = if (changelogRaw != null) {
                        List(changelogRaw.length()) { changelogRaw.getString(it) }
                    } else {
                        listOf(data.optString("update_type", ""))
                    }
                    _updateInfo.value = AppUpdateInfo(
                        latestVersion = data.getString("latest_version"),
                        changelog = changelogList,
                        downloadUrl = data.optString("download_url", ""),
                        isForce = data.optBoolean("force_update", false)
                    )
                }
            }
            conn.disconnect()
        } catch (_: Exception) {
            // 检查失败，静默跳过
        } finally {
            _isChecking.value = false
        }
    }

    /**
     * 使用系统 DownloadManager 下载 APK
     */
    fun downloadApk(context: Context, url: String): Long? {
        val request = DownloadManager.Request(Uri.parse(url))
            .setTitle("邦和量尺 版本更新")
            .setDescription("正在下载最新版本...")
            .setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED)
            .setDestinationInExternalPublicDir(Environment.DIRECTORY_DOWNLOADS, "banghe-measure.apk")
            .setMimeType("application/vnd.android.package-archive")
            .setAllowedOverMetered(true)
            .setAllowedOverRoaming(false)

        val dm = context.getSystemService(Context.DOWNLOAD_SERVICE) as DownloadManager
        return dm.enqueue(request)
    }

    /**
     * 检查下载是否完成
     */
    suspend fun checkDownloadComplete(downloadId: Long): Boolean = withContext(Dispatchers.IO) {
        val dm = App.instance.getSystemService(Context.DOWNLOAD_SERVICE) as DownloadManager
        val cursor = dm.query(DownloadManager.Query().setFilterById(downloadId))
        val complete = cursor.use {
            if (it.moveToFirst()) {
                val status = it.getInt(it.getColumnIndexOrThrow(DownloadManager.COLUMN_STATUS))
                status == DownloadManager.STATUS_SUCCESSFUL
            } else false
        }
        complete
    }

    /**
     * 安装已下载的 APK
     */
    fun installApk(context: Context) {
        val dm = context.getSystemService(Context.DOWNLOAD_SERVICE) as DownloadManager
        val uri = dm.getUriForDownloadedFile(
            dm.query(DownloadManager.Query().setFilterByStatus(DownloadManager.STATUS_SUCCESSFUL)).use { cursor ->
                if (cursor.moveToFirst()) {
                    cursor.getLong(cursor.getColumnIndexOrThrow(DownloadManager.COLUMN_ID))
                } else return
            }
        )

        val intent = Intent(Intent.ACTION_VIEW).apply {
            setDataAndType(uri, "application/vnd.android.package-archive")
            addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION or Intent.FLAG_ACTIVITY_NEW_TASK)
        }

        // Android 7.0+ 使用 FileProvider
        if (uri.toString().startsWith("content://")) {
            intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
        }

        context.startActivity(intent)
    }

    fun dismiss() { _updateInfo.value = null }

    companion object {
        val Factory = object : ViewModelProvider.Factory {
            @Suppress("UNCHECKED_CAST")
            override fun <T : ViewModel> create(modelClass: Class<T>): T {
                return AppUpdateViewModel() as T
            }
        }
    }
}

@Composable
fun UpdateDialog(
    info: AppUpdateInfo,
    onUpdate: () -> Unit,
    onDismiss: () -> Unit
) {
    AlertDialog(
        onDismissRequest = { if (!info.isForce) onDismiss() },
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
                    text = "v${info.latestVersion}",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold
                )
                if (info.changelog.isNotEmpty()) {
                    Spacer(Modifier.height(16.dp))
                    Text(
                        text = "更新内容:",
                        style = MaterialTheme.typography.labelMedium
                    )
                    Spacer(Modifier.height(8.dp))
                    info.changelog.forEach { item ->
                        Text(
                            text = "• $item",
                            style = MaterialTheme.typography.bodyMedium,
                            modifier = Modifier.padding(vertical = 2.dp)
                        )
                    }
                }
                if (info.isForce) {
                    Spacer(Modifier.height(16.dp))
                    Surface(
                        color = MaterialTheme.colorScheme.errorContainer,
                        shape = MaterialTheme.shapes.small
                    ) {
                        Text(
                            text = "此版本为强制更新，必须升级后才能继续使用",
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
            if (!info.isForce) {
                TextButton(onClick = onDismiss) {
                    Text("稍后提醒")
                }
            }
        }
    )
}
