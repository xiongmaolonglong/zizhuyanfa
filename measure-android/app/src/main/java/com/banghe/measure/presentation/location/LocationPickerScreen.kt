package com.banghe.measure.presentation.location

import android.Manifest
import android.content.Context
import android.location.Geocoder
import android.location.Location
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import java.util.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun LocationPickerScreen(
    onLocationPicked: (Double, Double, String) -> Unit,
    onCancel: () -> Unit
) {
    val context = LocalContext.current
    var hasLocationPermission by remember { mutableStateOf(false) }
    var currentLocation by remember { mutableStateOf<Location?>(null) }
    var addressText by remember { mutableStateOf("正在获取位置...") }
    var isLoading by remember { mutableStateOf(false) }

    val permissionLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.RequestMultiplePermissions()
    ) { permissions ->
        hasLocationPermission = permissions[Manifest.permission.ACCESS_FINE_LOCATION] ?: false
    }

    LaunchedEffect(Unit) {
        permissionLauncher.launch(
            arrayOf(
                Manifest.permission.ACCESS_FINE_LOCATION,
                Manifest.permission.ACCESS_COARSE_LOCATION
            )
        )
    }

    LaunchedEffect(hasLocationPermission) {
        if (hasLocationPermission) {
            isLoading = true
            // TODO: 使用 FusedLocationProviderClient 获取实际位置
            // 模拟位置
            currentLocation = Location("mock").apply {
                latitude = 23.1291
                longitude = 113.2644
            }
            isLoading = false
        }
    }

    LaunchedEffect(currentLocation) {
        currentLocation?.let { loc ->
            try {
                val geocoder = Geocoder(context, Locale.getDefault())
                val addresses = geocoder.getFromLocation(loc.latitude, loc.longitude, 1)
                addressText = addresses?.firstOrNull()?.getAddressLine(0) ?: "未知地址"
            } catch (e: Exception) {
                addressText = "${loc.latitude}, ${loc.longitude}"
            }
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("获取位置", fontWeight = FontWeight.Bold) },
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
                .padding(16.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            if (!hasLocationPermission) {
                Icon(Icons.Default.LocationOn, contentDescription = null, modifier = Modifier.size(64.dp))
                Spacer(Modifier.height(16.dp))
                Text("需要位置权限")
                Spacer(Modifier.height(16.dp))
                Button(onClick = {
                    permissionLauncher.launch(
                        arrayOf(
                            Manifest.permission.ACCESS_FINE_LOCATION,
                            Manifest.permission.ACCESS_COARSE_LOCATION
                        )
                    )
                }) {
                    Text("授予权限")
                }
            } else if (isLoading) {
                CircularProgressIndicator()
                Spacer(Modifier.height(16.dp))
                Text("正在获取位置...")
            } else {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(
                        containerColor = MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.3f)
                    )
                ) {
                    Column(
                        modifier = Modifier.padding(16.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Icon(
                            Icons.Default.LocationOn,
                            contentDescription = null,
                            modifier = Modifier.size(48.dp),
                            tint = MaterialTheme.colorScheme.primary
                        )
                        Spacer(Modifier.height(16.dp))
                        Text(
                            text = "当前位置",
                            style = MaterialTheme.typography.labelMedium
                        )
                        Spacer(Modifier.height(8.dp))
                        Text(
                            text = addressText,
                            style = MaterialTheme.typography.bodyLarge,
                            fontWeight = FontWeight.Medium
                        )
                        currentLocation?.let { loc ->
                            Spacer(Modifier.height(8.dp))
                            Text(
                                text = "经度: ${loc.longitude}\n纬度: ${loc.latitude}",
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    }
                }

                Spacer(Modifier.height(24.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    OutlinedButton(
                        onClick = onCancel,
                        modifier = Modifier.weight(1f).height(56.dp)
                    ) {
                        Text("取消")
                    }
                    Button(
                        onClick = {
                            currentLocation?.let { loc ->
                                onLocationPicked(loc.latitude, loc.longitude, addressText)
                            }
                        },
                        modifier = Modifier.weight(1f).height(56.dp),
                        enabled = currentLocation != null
                    ) {
                        Text("确认位置")
                    }
                }
            }
        }
    }
}