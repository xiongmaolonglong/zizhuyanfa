const path = require('path')
const { deleteFromCOS } = require('../middleware/upload')

/**
 * POST /api/v1/files
 * 上传单个文件
 */
function uploadFile(req, res) {
  if (!req.file) {
    return res.status(400).json({ error: '未选择文件' })
  }

  return res.status(201).json({
    code: 0,
    data: {
      url: req.file.url,
      original_name: req.file.originalname,
      size: req.file.size,
      mime_type: req.file.mimetype,
    },
  })
}

/**
 * POST /api/v1/files/batch
 * 批量上传文件（最多 9 个）
 */
function uploadBatch(req, res) {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: '未选择文件' })
  }

  const files = req.files.map((f) => ({
    url: f.url,
    original_name: f.originalname,
    size: f.size,
    mime_type: f.mimetype,
  }))

  return res.status(201).json({
    code: 0,
    data: { files },
  })
}

module.exports = {
  uploadFile,
  uploadBatch,
}
