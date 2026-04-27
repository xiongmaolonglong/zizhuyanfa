package com.banghe.measure.data.dashboard

import com.banghe.measure.core.network.ApiResponse
import retrofit2.http.GET

interface DashboardApi {
    @GET("/api/v1/work-orders/stats")
    suspend fun getStats(): ApiResponse<WorkOrderStatsResponse>
}

data class WorkOrderStatsResponse(
    val total: Int,
    val by_stage: Map<String, Int>,
    val by_status: Map<String, Int>,
    val in_progress: Int = 0,
    val timeout_count: Int,
    val timeout_orders: List<TimeoutOrder>?,
    val month_stats: MonthStats?
)

data class TimeoutOrder(
    val id: Int,
    val work_order_no: String,
    val title: String,
    val current_stage: String,
    val deadline: String?
)

data class MonthStats(
    val this_month_new: Int,
    val this_month_done: Int,
    val last_month_new: Int,
    val last_month_done: Int
)