package com.banghe.measure.data.notification

import com.banghe.measure.core.network.ApiClient
import com.banghe.measure.core.network.PaginatedResponse
import com.squareup.moshi.Json
import com.squareup.moshi.JsonClass
import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.Path
import retrofit2.http.Query

interface NotificationApi {
    @GET("/api/v1/notifications")
    suspend fun getNotifications(
        @Query("page") page: Int = 1,
        @Query("limit") limit: Int = 20,
        @Query("is_read") isRead: String? = null
    ): PaginatedResponse<Notification>

    @GET("/api/v1/notifications/unread-count")
    suspend fun getUnreadCount(): UnreadCountResponse

    @POST("/api/v1/notifications/{id}/read")
    suspend fun markAsRead(@Path("id") id: Int): Unit

    @POST("/api/v1/notifications/read-all")
    suspend fun markAllAsRead(): Unit
}

@JsonClass(generateAdapter = true)
data class Notification(
    @Json(name = "id") val id: Int,
    @Json(name = "title") val title: String,
    @Json(name = "content") val content: String,
    @Json(name = "type") val type: String? = null,
    @Json(name = "work_order_id") val workOrderId: Int? = null,
    @Json(name = "is_read") val isRead: Boolean,
    @Json(name = "read_at") val readAt: String? = null,
    @Json(name = "created_at") val createdAt: String
)

@JsonClass(generateAdapter = true)
data class UnreadCountResponse(
    @Json(name = "code") val code: Int,
    @Json(name = "message") val message: String?,
    @Json(name = "data") val data: UnreadCountData?
)

@JsonClass(generateAdapter = true)
data class UnreadCountData(
    @Json(name = "unread_count") val unreadCount: Int
)