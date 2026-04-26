package com.banghe.measure.core.network

import com.banghe.measure.core.App
import com.banghe.measure.core.storage.PreferencesStore
import okhttp3.Interceptor
import okhttp3.Response

class AuthInterceptor(
    private val preferencesStore: PreferencesStore
) : Interceptor {
    override fun intercept(chain: Interceptor.Chain): Response {
        val token = preferencesStore.getTokenBlocking()
        val request = chain.request().newBuilder().apply {
            token?.let { addHeader("Authorization", "Bearer $it") }
            addHeader("Content-Type", "application/json")
        }.build()

        val response = chain.proceed(request)

        if (response.code == 401) {
            preferencesStore.clearAuthBlocking()
            try {
                App.instance.webSocketManager.disconnect()
            } catch (_: Exception) {
                // App 未初始化时忽略
            }
        }

        return response
    }
}