package com.banghe.measure.domain.model

data class MeasurementDraft(
    val orderId: Int,
    val contactName: String? = null,
    val contactPhone: String? = null,
    val address: String? = null,
    val projectType: String? = null,
    val weather: String? = null,
    val accessCondition: String? = null,
    val vehicleAccess: Boolean = false,
    val workingHeight: Double? = null,
    val powerDistance: Double? = null,
    val notes: String? = null,
    val materials: List<MaterialData> = emptyList(),
    val signaturePath: String? = null,
    val photos: List<String> = emptyList()
)

data class MaterialData(
    val type: String,
    val faces: List<MaterialFace>? = emptyList(),
    val totalArea: Double? = null,
    val notes: String? = null
)

data class MaterialFace(
    val name: String,
    val width: Double? = null,
    val height: Double? = null,
    val area: Double? = null,
    val depth: Double? = null,
    val notes: String? = null,
    val photos: List<String>? = emptyList()
) {
    val calculatedArea: Double get() = area ?: ((width ?: 0.0) * (height ?: 0.0))
}