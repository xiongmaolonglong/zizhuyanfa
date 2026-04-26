package com.banghe.measure.core.network

import com.squareup.moshi.Json
import com.squareup.moshi.JsonClass

@JsonClass(generateAdapter = true)
data class ApiResponse<T>(
    @Json(name = "code") val code: Int,
    @Json(name = "message") val message: String?,
    @Json(name = "data") val data: T?
) {
    val isSuccess: Boolean get() = code == 0
}

@JsonClass(generateAdapter = true)
data class PaginatedResponse<T>(
    @Json(name = "code") val code: Int,
    @Json(name = "message") val message: String?,
    @Json(name = "data") val data: List<T>?,
    @Json(name = "pagination") val pagination: Pagination?
)

@JsonClass(generateAdapter = true)
data class Pagination(
    @Json(name = "page") val page: Int,
    @Json(name = "limit") val limit: Int,
    @Json(name = "total") val total: Int,
    @Json(name = "pages") val totalPages: Int
)