package com.banghe.measure.data.auth

import com.banghe.measure.core.network.ApiClient
import com.banghe.measure.core.storage.PreferencesStore
import com.banghe.measure.domain.model.User
import com.banghe.measure.utils.Result
import com.banghe.measure.utils.safeCall

class AuthRepository(
    private val preferencesStore: PreferencesStore
) {
    private val api: AuthApi by lazy { ApiClient.createApi(AuthApi::class.java) }

    suspend fun loginWithPassword(phone: String, password: String): Result<LoginResponse> = safeCall {
        val response = api.loginWithPassword(LoginRequest(phone, password))
        if (response.code == 0 && response.data != null) {
            preferencesStore.setToken(response.data.token)
            preferencesStore.setUserInfo(
                response.data.user.id,
                response.data.user.name,
                response.data.user.role
            )
            response.data
        } else {
            throw Exception(response.message ?: "登录失败")
        }
    }

    suspend fun loginWithSms(phone: String, code: String): Result<LoginResponse> = safeCall {
        val response = api.loginWithSms(SmsLoginRequest(phone, code))
        if (response.code == 0 && response.data != null) {
            preferencesStore.setToken(response.data.token)
            preferencesStore.setUserInfo(
                response.data.user.id,
                response.data.user.name,
                response.data.user.role
            )
            response.data
        } else {
            throw Exception(response.message ?: "登录失败")
        }
    }

    suspend fun sendSmsCode(phone: String): Result<Unit> = safeCall {
        val response = api.sendSmsCode(SmsSendRequest(phone))
        if (response.code != 0) throw Exception(response.message ?: "发送验证码失败")
    }

    suspend fun validateToken(): Result<User> = safeCall {
        val response = api.validateToken()
        if (response.code == 0 && response.data != null) {
            response.data
        } else {
            throw Exception("Token 无效")
        }
    }

    suspend fun logout() {
        preferencesStore.clearAuth()
    }

    suspend fun isLoggedIn(): Boolean = preferencesStore.getToken() != null
}