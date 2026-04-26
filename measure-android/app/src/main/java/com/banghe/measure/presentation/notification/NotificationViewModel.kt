package com.banghe.measure.presentation.notification

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.banghe.measure.core.App
import com.banghe.measure.data.notification.Notification
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import kotlinx.coroutines.withTimeoutOrNull

data class NotificationUiState(
    val notifications: List<Notification> = emptyList(),
    val isLoading: Boolean = false,
    val error: String? = null
)

class NotificationViewModel : ViewModel() {
    private val _uiState = MutableStateFlow(NotificationUiState())
    val uiState: StateFlow<NotificationUiState> = _uiState.asStateFlow()

    init {
        // 立即显示空列表
        _uiState.value = NotificationUiState(notifications = emptyList(), isLoading = false)
        loadNotifications()
    }

    fun loadNotifications() {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, error = null) }
            try {
                val repository = App.instance.notificationRepository
                val result = withTimeoutOrNull(5000) {
                    repository.getNotifications()
                }

                result?.getOrNull()?.let { notifications ->
                    _uiState.update {
                        NotificationUiState(notifications = notifications, isLoading = false)
                    }
                } ?: run {
                    _uiState.update {
                        it.copy(isLoading = false)
                    }
                }
            } catch (e: Exception) {
                _uiState.update {
                    it.copy(isLoading = false)
                }
            }
        }
    }

    fun markAllAsRead() {
        viewModelScope.launch {
            try {
                App.instance.notificationRepository.markAllAsRead()
                loadNotifications()
            } catch (e: Exception) {
                // Ignore
            }
        }
    }
}