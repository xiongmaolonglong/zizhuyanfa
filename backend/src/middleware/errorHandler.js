function errorHandler(err, req, res, next) {
  console.error('[ErrorHandler]', req.method, req.originalUrl, err.message, err.stack)
  // Multer 文件上传错误
  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ error: '文件过大，请压缩后重试（图片限 10MB，其他文件限 500MB）' })
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({ error: err.message })
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ error: '文件数量超限' })
    }
    return res.status(400).json({ error: err.message })
  }
  if (err.name === 'SequelizeValidationError') {
    return res.status(400).json({ error: '数据验证失败', details: err.errors.map(e => e.message) })
  }
  if (err.name === 'SequelizeUniqueConstraintError') {
    return res.status(409).json({ error: '数据冲突', details: err.errors.map(e => e.message) })
  }
  if (err.name === 'SequelizeForeignKeyConstraintError') {
    return res.status(400).json({ error: '关联数据不存在' })
  }
  res.status(err.status || 500).json({ error: err.message || '服务器内部错误' })
}

module.exports = errorHandler
