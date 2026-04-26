package com.banghe.measure.core.network

import android.content.Context
import android.net.ConnectivityManager
import android.net.Network
import android.net.NetworkCapabilities
import android.net.NetworkRequest
import androidx.compose.runtime.Composable
import androidx.compose.runtime.State
import androidx.compose.runtime.produceState
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow

sealed class ConnectionState {
    object Available : ConnectionState()
    object Unavailable : ConnectionState()
}

class ConnectivityObserver(context: Context) {
    private val connectivityManager = context.getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager
    private val _state = MutableStateFlow<ConnectionState>(ConnectionState.Unavailable)
    val state: StateFlow<ConnectionState> = _state

    private val networkCallback = object : ConnectivityManager.NetworkCallback() {
        override fun onAvailable(network: Network) {
            _state.value = ConnectionState.Available
        }

        override fun onLost(network: Network) {
            _state.value = ConnectionState.Unavailable
        }

        override fun onUnavailable() {
            _state.value = ConnectionState.Unavailable
        }
    }

    fun startListening() {
        val request = NetworkRequest.Builder()
            .addCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
            .build()
        connectivityManager.registerNetworkCallback(request, networkCallback)
        // 初始状态
        val currentNetwork = connectivityManager.activeNetwork
        _state.value = if (currentNetwork != null) ConnectionState.Available else ConnectionState.Unavailable
    }

    fun stopListening() {
        connectivityManager.unregisterNetworkCallback(networkCallback)
    }
}

@Composable
fun observeConnectivity(observer: ConnectivityObserver): State<ConnectionState> {
    return produceState(initialValue = ConnectionState.Available as ConnectionState) {
        observer.state.collect { value = it }
    }
}