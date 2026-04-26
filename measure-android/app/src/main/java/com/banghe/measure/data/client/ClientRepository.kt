package com.banghe.measure.data.client

import com.banghe.measure.core.network.ApiClient
import com.banghe.measure.domain.model.Client
import com.banghe.measure.utils.Result
import com.banghe.measure.utils.safeCall

class ClientRepository {
    private val api: ClientApi by lazy { ApiClient.createApi(ClientApi::class.java) }

    suspend fun getClients(keyword: String? = null): Result<List<Client>> = safeCall {
        val response = api.getClients(keyword = keyword)
        if (response.code == 0 && response.data != null) {
            response.data.map { it.toDomain() }
        } else {
            throw Exception(response.message ?: "获取客户列表失败")
        }
    }
}