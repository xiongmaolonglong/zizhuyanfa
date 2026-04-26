package com.banghe.measure.domain.model

data class ConstructionDraft(
    val workOrderId: Int,
    val address: String? = null,
    val beforePhotos: List<String> = emptyList(),
    val afterPhotos: List<String> = emptyList(),
    val notes: String? = null,
    val signaturePath: String? = null,
    val hasException: Boolean = false,
    val exceptionReason: String? = null,
    val exceptionPhotos: List<String> = emptyList()
)

data class MaterialInfo(
    val name: String,
    val quantity: Int = 1,
    val dimensions: String? = null
)