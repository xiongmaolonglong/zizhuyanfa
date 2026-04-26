package com.banghe.measure.domain.model

import com.squareup.moshi.Json
import com.squareup.moshi.JsonClass

@JsonClass(generateAdapter = true)
data class Client(
    @Json(name = "id") val id: Int,
    @Json(name = "name") val name: String,
    @Json(name = "contact_name") val contactName: String? = null,
    @Json(name = "contact_phone") val contactPhone: String? = null,
    @Json(name = "address") val address: String? = null
)