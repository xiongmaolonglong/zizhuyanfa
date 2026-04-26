package com.banghe.measure.data.client

import com.banghe.measure.core.network.ApiResponse
import com.banghe.measure.core.network.PaginatedResponse
import com.banghe.measure.domain.model.Client
import retrofit2.http.GET
import retrofit2.http.Query

interface ClientApi {
    @GET("/api/v1/clients")
    suspend fun getClients(
        @Query("keyword") keyword: String? = null,
        @Query("page") page: Int = 1,
        @Query("limit") limit: Int = 50
    ): PaginatedResponse<ClientResponse>
}

data class ClientResponse(
    val id: Int,
    val name: String,
    val contact_name: String?,
    val contact_phone: String?,
    val address: String?
)

fun ClientResponse.toDomain() = Client(id, name, contact_name, contact_phone, address)