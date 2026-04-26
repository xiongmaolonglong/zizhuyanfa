package com.banghe.measure.data.task

import com.banghe.measure.core.database.AppDatabase
import com.banghe.measure.core.network.ApiClient
import com.banghe.measure.domain.model.WorkOrder
import com.banghe.measure.presentation.admin.review.ReviewTask
import com.banghe.measure.presentation.admin.review.ReviewType
import com.banghe.measure.utils.Result
import com.banghe.measure.utils.safeCall

class TaskRepository(
    private val database: AppDatabase
) {
    private val api: TaskApi by lazy { ApiClient.createApi(TaskApi::class.java) }
    private val dao = database.workOrderDao()

    suspend fun getTasks(
        status: String? = null,
        stage: String? = null,
        keyword: String? = null,
        page: Int = 1,
        limit: Int = 20
    ): Result<List<WorkOrder>> = safeCall {
        val response = api.getTasks(
            status = status,
            stage = stage,
            keyword = keyword,
            page = page,
            limit = limit
        )
        if (response.code == 0 && response.data != null) {
            val orders = response.data.map { it.toDomain() }
            // Cache to local DB
            dao.insertAll(orders.map { it.toEntity() })
            orders
        } else {
            throw Exception(response.message ?: "获取任务失败")
        }
    }

    suspend fun getTasksFromCache(): List<WorkOrder> {
        return dao.getAll().map { it.toDomain() }
    }

    suspend fun getTaskDetail(id: Int): Result<WorkOrder> = safeCall {
        val response = api.getTaskDetail(id)
        if (response.isSuccess && response.data != null) {
            response.data.toDomain()
        } else {
            throw Exception(response.message ?: "获取详情失败")
        }
    }

    suspend fun createWorkOrder(request: CreateWorkOrderRequest): Result<WorkOrder> = safeCall {
        val response = api.createWorkOrder(request)
        if (response.isSuccess && response.data != null) {
            response.data.toDomain()
        } else {
            throw Exception(response.message ?: "创建工单失败")
        }
    }

    suspend fun checkDuplicate(clientId: Int, address: String): Result<List<WorkOrder>> = safeCall {
        val response = api.checkDuplicate(clientId, address)
        if (response.code == 0 && response.data != null) {
            response.data.map { it.toDomain() }
        } else {
            emptyList()
        }
    }

    suspend fun getReviewTasks(): Result<List<ReviewTask>> = safeCall {
        val response = api.getReviewTasks()
        if (response.isSuccess && response.data != null) {
            response.data.map { task ->
                ReviewTask(
                    id = task.id,
                    type = when (task.review_type) {
                        "measurement" -> ReviewType.MEASUREMENT
                        "internal_verification" -> ReviewType.INTERNAL_VERIFICATION
                        else -> ReviewType.MEASUREMENT
                    },
                    workOrderNo = task.work_order_no ?: "",
                    title = task.title,
                    clientName = task.client_name,
                    submitterName = task.submitter_name,
                    submittedAt = task.submitted_at,
                    address = task.address
                )
            }
        } else {
            throw Exception(response.message ?: "获取审核任务失败")
        }
    }
}

private fun WorkOrder.toEntity() = com.banghe.measure.core.database.WorkOrderEntity(
    id = id,
    workOrderNo = workOrderNo,
    title = title,
    taskType = taskType,
    address = address,
    contactName = contactName,
    contactPhone = contactPhone,
    description = null,
    deadline = deadline,
    status = status,
    currentStage = currentStage,
    priority = priority
)

private fun com.banghe.measure.core.database.WorkOrderEntity.toDomain() = WorkOrder(
    id = id,
    workOrderNo = workOrderNo,
    title = title,
    taskType = taskType,
    address = address,
    contactName = contactName,
    contactPhone = contactPhone,
    status = status,
    currentStage = currentStage,
    priority = priority,
    deadline = deadline
)