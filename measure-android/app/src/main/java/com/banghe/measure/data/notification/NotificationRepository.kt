package com.banghe.measure.data.notification

import com.banghe.measure.core.network.ApiClient
import com.banghe.measure.utils.Result
import com.banghe.measure.utils.safeCall

class NotificationRepository {
    private val api: NotificationApi by lazy { ApiClient.createApi(NotificationApi::class.java) }

    suspend fun getNotifications(page: Int = 1): Result<List<Notification>> = safeCall {
        val response = api.getNotifications(page = page)
        if (response.code == 0 && response.data != null) {
            response.data
        } else {
            throw Exception(response.message ?: "获取消息失败")
        }
    }

    suspend fun getUnreadCount(): Result<Int> = safeCall {
        val response = api.getUnreadCount()
        if (response.code == 0 && response.data != null) {
            response.data.unreadCount
        } else {
            0
        }
    }

    suspend fun markAsRead(id: Int): Result<Unit> = safeCall {
        api.markAsRead(id)
    }

    suspend fun markAllAsRead(): Result<Unit> = safeCall {
        api.markAllAsRead()
    }
}