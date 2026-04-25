/**
 * 统一 API 响应工具
 */

function success(res, data, message = '操作成功', statusCode = 200) {
  return res.status(statusCode).json({
    code: 0,
    message,
    data,
  })
}

function error(res, message = '服务器内部错误', statusCode = 500) {
  return res.status(statusCode).json({
    code: statusCode,
    message,
  })
}

function paginate(res, data, pagination, message = '操作成功') {
  return res.status(200).json({
    code: 0,
    message,
    data,
    pagination,
  })
}

module.exports = { success, error, paginate }
