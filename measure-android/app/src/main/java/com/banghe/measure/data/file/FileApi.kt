package com.banghe.measure.data.file

import com.banghe.measure.core.network.ApiResponse
import okhttp3.MultipartBody
import okhttp3.RequestBody
import retrofit2.http.*

interface FileApi {
    @Multipart
    @POST("/api/v1/files/upload")
    suspend fun uploadFile(
        @Part file: MultipartBody.Part,
        @Part("type") type: RequestBody
    ): ApiResponse<FileUploadResult>

    @GET("/api/v1/files/{id}")
    suspend fun getFile(@Path("id") id: Int): ApiResponse<FileInfo>
}

data class FileUploadResult(
    val id: Int,
    val url: String,
    val filename: String
)

data class FileInfo(
    val id: Int,
    val url: String,
    val filename: String,
    val mimeType: String,
    val size: Long
)