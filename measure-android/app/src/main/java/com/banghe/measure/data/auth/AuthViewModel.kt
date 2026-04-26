package com.banghe.measure.data.auth

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.banghe.measure.core.App
import com.banghe.measure.domain.model.User
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class AuthState(
    val isLoggedIn: Boolean = false,
    val user: User? = null,
    val isLoading: Boolean = true,
    val error: String? = null
)

class AuthViewModel(
    private val repository: AuthRepository
) : ViewModel() {
    private val _authState = MutableStateFlow(AuthState())
    val authState: StateFlow<AuthState> = _authState.asStateFlow()

    init {
        checkAuth()
    }

    private fun checkAuth() {
        viewModelScope.launch {
            _authState.update { it.copy(isLoading = true, error = null) }
            try {
                if (repository.isLoggedIn()) {
                    val result = repository.validateToken()
                    result.getOrNull()?.let { user ->
                        _authState.update {
                            AuthState(isLoggedIn = true, user = user)
                        }
                        // 已登录用户重连 WebSocket
                        App.instance.webSocketManager.disconnect()
                        App.instance.webSocketManager.connect()
                    } ?: run {
                        repository.logout()
                        _authState.update { AuthState(isLoading = false) }
                    }
                } else {
                    _authState.update { AuthState(isLoading = false) }
                }
            } catch (e: Exception) {
                _authState.update { AuthState(isLoading = false) }
            }
        }
    }

    fun loginWithPassword(phone: String, password: String) {
        viewModelScope.launch {
            _authState.update { it.copy(isLoading = true, error = null) }
            try {
                val result = repository.loginWithPassword(phone, password)
                result.getOrNull()?.let { response ->
                    _authState.update {
                        AuthState(isLoggedIn = true, user = response.user)
                    }
                    // 登录成功后连接 WebSocket
                    App.instance.webSocketManager.connect()
                } ?: run {
                    _authState.update {
                        it.copy(isLoading = false, error = "登录失败，请检查手机号和密码")
                    }
                }
            } catch (e: Exception) {
                _authState.update {
                    it.copy(isLoading = false, error = e.message ?: "登录失败")
                }
            }
        }
    }

    fun loginWithSms(phone: String, code: String) {
        viewModelScope.launch {
            _authState.update { it.copy(isLoading = true, error = null) }
            try {
                val result = repository.loginWithSms(phone, code)
                result.getOrNull()?.let { response ->
                    _authState.update {
                        AuthState(isLoggedIn = true, user = response.user)
                    }
                    // 登录成功后连接 WebSocket
                    App.instance.webSocketManager.connect()
                } ?: run {
                    _authState.update {
                        it.copy(isLoading = false, error = "验证码错误，请重试")
                    }
                }
            } catch (e: Exception) {
                _authState.update {
                    it.copy(isLoading = false, error = e.message ?: "登录失败")
                }
            }
        }
    }

    fun sendSmsCode(phone: String) {
        viewModelScope.launch {
            try {
                repository.sendSmsCode(phone)
            } catch (e: Exception) {
                // Ignore
            }
        }
    }

    fun logout() {
        viewModelScope.launch {
            // 断开 WebSocket
            App.instance.webSocketManager.disconnect()
            repository.logout()
            _authState.update { AuthState() }
        }
    }

    fun clearError() {
        _authState.update { it.copy(error = null) }
    }
}