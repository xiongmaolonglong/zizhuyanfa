package com.banghe.measure.data.auth

import com.banghe.measure.core.network.ApiResponse
import com.banghe.measure.domain.model.User
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.POST

interface AuthApi {
    @POST("/api/v1/auth/tenant/login")
    suspend fun loginWithPassword(
        @Body request: LoginRequest
    ): ApiResponse<LoginResponse>

    @POST("/api/v1/auth/sms/send")
    suspend fun sendSmsCode(
        @Body request: SmsSendRequest
    ): ApiResponse<Unit>

    @POST("/api/v1/auth/sms/login")
    suspend fun loginWithSms(
        @Body request: SmsLoginRequest
    ): ApiResponse<LoginResponse>

    @GET("/api/v1/auth/me")
    suspend fun validateToken(): ApiResponse<User>
}

data class LoginRequest(
    val phone: String,
    val password: String
)

data class SmsSendRequest(
    val phone: String
)

data class SmsLoginRequest(
    val phone: String,
    val code: String
)

data class LoginResponse(
    val token: String,
    val user: User
)
