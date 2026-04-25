const COS = require('cos-nodejs-sdk-v5')
const multer = require('multer')
const path = require('path')
const crypto = require('crypto')

/**
 * 允许的 MIME 类型扩展
 */
const ALLOWED_EXTENSIONS = new Set([
  'jpg', 'jpeg', 'png', 'gif',
  'pdf', 'cdr',
  'doc', 'docx',
  'xls', 'xlsx',
])

/**
 * 文件大小限制（字节）
 */
const IMAGE_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'gif'])
const MAX_IMAGE_SIZE = 10 * 1024 * 1024     // 10MB
const MAX_FILE_SIZE = 500 * 1024 * 1024     // 500MB

/**
 * COS 客户端
 */
const cos = new COS({
  SecretId: process.env.COS_SECRET_ID,
  SecretKey: process.env.COS_SECRET_KEY,
  Bucket: process.env.COS_BUCKET,
  Region: process.env.COS_REGION,
})

const COS_BUCKET = process.env.COS_BUCKET
const COS_REGION = process.env.COS_REGION
const COS_PROTOCOL = process.env.COS_PROTOCOL || 'https'

/**
 * 生成安全的文件名: {timestamp}-{random}.{ext}
 */
function generateFilename(originalName) {
  const ext = path.extname(originalName).toLowerCase().slice(1)
  const timestamp = Date.now()
  const random = crypto.randomBytes(6).toString('hex')
  return `${timestamp}-${random}.${ext}`
}

/**
 * 文件过滤器 - 按扩展名限制
 */
function fileFilter(req, file, cb) {
  const ext = path.extname(file.originalname).toLowerCase().slice(1)
  if (ALLOWED_EXTENSIONS.has(ext)) {
    cb(null, true)
  } else {
    cb(new multer.MulterError(
      'LIMIT_UNEXPECTED_FILE',
      `不支持的文件类型: .${ext}，允许: ${[...ALLOWED_EXTENSIONS].join(', ')}`
    ))
  }
}

/**
 * 内存存储（用于 COS 上传）
 */
const memoryStorage = multer.memoryStorage()

/**
 * 构建 COS 文件 URL
 */
function buildFileUrl(tenantId, workOrderId, filename) {
  return `${COS_PROTOCOL}://${COS_BUCKET}.cos.${COS_REGION}.myqcloud.com/${tenantId}/${workOrderId}/${filename}`
}

/**
 * 上传文件到 COS
 */
async function uploadToCOS(tenantId, workOrderId, filename, buffer) {
  const key = `${tenantId}/${workOrderId}/${filename}`
  return new Promise((resolve, reject) => {
    cos.putObject({
      Bucket: COS_BUCKET,
      Region: COS_REGION,
      Key: key,
      Body: buffer,
    }, (err, data) => {
      if (err) {
        reject(err)
      } else {
        resolve(buildFileUrl(tenantId, workOrderId, filename))
      }
    })
  })
}

/**
 * 删除 COS 文件
 */
async function deleteFromCOS(key) {
  return new Promise((resolve, reject) => {
    cos.deleteObject({
      Bucket: COS_BUCKET,
      Region: COS_REGION,
      Key: key,
    }, (err) => {
      if (err) reject(err)
      else resolve()
    })
  })
}

/**
 * 单文件上传中间件
 */
function uploadSingle(req, res, next) {
  const ct = req.headers['content-type'] || ''
  const isImage = ct.includes('image/jpeg') || ct.includes('image/png') || ct.includes('image/gif')
  const maxFileSize = isImage ? MAX_IMAGE_SIZE : MAX_FILE_SIZE

  const uploadWithLimits = multer({
    storage: memoryStorage,
    fileFilter,
    limits: { fileSize: maxFileSize },
  }).single('file')

  uploadWithLimits(req, res, async (err) => {
    if (err) return next(err)
    if (!req.file) return next(new Error('未选择文件'))

    try {
      const tenantId = req.user?.tenant_id || req.body?.tenant_id || 'default'
      const workOrderId = req.body?.work_order_id || 'general'
      const filename = generateFilename(req.file.originalname)
      const url = await uploadToCOS(tenantId, workOrderId, filename, req.file.buffer)
      req.file.filename = filename
      req.file.url = url
      next()
    } catch (cosErr) {
      next(cosErr)
    }
  })
}

/**
 * 多文件上传中间件（最多 9 个）
 */
function uploadArray(req, res, next) {
  const uploadWithLimits = multer({
    storage: memoryStorage,
    fileFilter,
    limits: { fileSize: MAX_FILE_SIZE },
  }).array('files', 9)

  uploadWithLimits(req, res, async (err) => {
    if (err) return next(err)
    if (!req.files || req.files.length === 0) return next(new Error('未选择文件'))

    try {
      const tenantId = req.user?.tenant_id || req.body?.tenant_id || 'default'
      const workOrderId = req.body?.work_order_id || 'general'

      for (const file of req.files) {
        const filename = generateFilename(file.originalname)
        const url = await uploadToCOS(tenantId, workOrderId, filename, file.buffer)
        file.filename = filename
        file.url = url
      }
      next()
    } catch (cosErr) {
      next(cosErr)
    }
  })
}

module.exports = {
  uploadSingle,
  uploadArray,
  buildFileUrl,
  deleteFromCOS,
  ALLOWED_EXTENSIONS,
}
