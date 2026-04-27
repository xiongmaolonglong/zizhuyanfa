package com.banghe.measure.data.dashboard

import com.banghe.measure.core.network.ApiClient
import com.banghe.measure.domain.model.WorkOrderStats
import com.banghe.measure.utils.Result
import com.banghe.measure.utils.safeCall

class DashboardRepository {
    private val api: DashboardApi by lazy { ApiClient.createApi(DashboardApi::class.java) }

    suspend fun getStats(): Result<WorkOrderStats> = safeCall {
        val response = api.getStats()
        if (response.isSuccess && response.data != null) {
            val data = response.data
            WorkOrderStats(
                total = data.total,
                pending = data.by_status["pending"] ?: 0,
                inProgress = data.in_progress,
                completed = data.by_status["completed"] ?: 0,
                overdue = data.timeout_count
            )
        } else {
            throw Exception(response.message ?: "获取数据失败")
        }
    }
}