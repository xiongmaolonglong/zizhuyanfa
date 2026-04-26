package com.banghe.measure.core

object Constants {
    const val BASE_URL = "https://www.fsbhgg.com"
    const val API_PREFIX = "/api/v1"

    // Auth
    const val KEY_TOKEN = "auth_token"
    const val KEY_USER_ID = "user_id"
    const val KEY_USER_NAME = "user_name"
    const val KEY_USER_ROLE = "user_role"
    const val KEY_REMEMBER_ME = "remember_me"
    const val KEY_PHONE = "saved_phone"

    // Roles
    const val ROLE_ADMIN = "admin"
    const val ROLE_MEASURER = "measurer"
    const val ROLE_CONSTRUCTOR = "constructor"

    // Measurement statuses
    const val STATUS_DRAFT = "draft"
    const val STATUS_SUBMITTED = "submitted"
    const val STATUS_FAILED = "failed"

    // Work order stages
    const val STAGE_DECLARATION = "declaration"
    const val STAGE_MEASUREMENT = "measurement"
    const val STAGE_DESIGN = "design"
    const val STAGE_PRODUCTION = "production"
    const val STAGE_CONSTRUCTION = "construction"
    const val STAGE_FINANCE = "finance"
    const val STAGE_ARCHIVE = "archive"

    // File upload
    const val MAX_FILE_SIZE_IMAGE = 10 * 1024 * 1024L // 10MB
    const val MAX_BATCH_UPLOAD = 9
}
