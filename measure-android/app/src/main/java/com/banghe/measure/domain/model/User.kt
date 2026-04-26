package com.banghe.measure.domain.model

import com.squareup.moshi.Json
import com.squareup.moshi.JsonClass

@JsonClass(generateAdapter = true)
data class User(
    @Json(name = "id") val id: Int,
    @Json(name = "name") val name: String,
    @Json(name = "phone") val phone: String,
    @Json(name = "role") val role: String,
    @Json(name = "department") val department: String? = null,
    @Json(name = "tenant_id") val tenantId: Int? = null,
    @Json(name = "status") val status: String = "active"
) {
    fun isAdmin(): Boolean = role == "admin"
    fun isMeasurer(): Boolean = role == "measurer"
    fun isConstructor(): Boolean = role == "constructor"
}
