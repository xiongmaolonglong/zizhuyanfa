/**
 * 请求验证中间件
 * 用法：router.post('/path', validate(rules), handler)
 *
 * rules 格式:
 * {
 *   fieldName: {
 *     required: true,
 *     type: 'string' | 'number' | 'boolean' | 'email' | 'phone',
 *     enum: ['a', 'b'],
 *     min: 1,
 *     max: 100
 *   }
 * }
 */

const validators = {
  string: (v) => typeof v === 'string',
  number: (v) => typeof v === 'number' && !Number.isNaN(v),
  boolean: (v) => typeof v === 'boolean',
  email: (v) => typeof v === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
  phone: (v) => typeof v === 'string' && /^1[3-9]\d{9}$/.test(v),
}

function validate(rules) {
  return (req, res, next) => {
    const body = req.body || {}
    const errors = []

    for (const [field, rule] of Object.entries(rules)) {
      const value = body[field]

      // 必填校验
      if (rule.required && (value === undefined || value === null || value === '')) {
        errors.push({ field, message: `${field} 为必填字段` })
        continue
      }

      // 非必填且为空则跳过
      if (value === undefined || value === null || value === '') {
        continue
      }

      // 类型校验
      if (rule.type) {
        const check = validators[rule.type]
        if (check && !check(value)) {
          errors.push({ field, message: `${field} 格式不正确，期望 ${rule.type}` })
        }
      }

      // 枚举校验
      if (rule.enum && !rule.enum.includes(value)) {
        errors.push({ field, message: `${field} 值不在允许范围内: ${rule.enum.join(', ')}` })
      }

      // 长度校验 (string)
      if (typeof value === 'string') {
        if (rule.min !== undefined && value.length < rule.min) {
          errors.push({ field, message: `${field} 长度不能少于 ${rule.min} 个字符` })
        }
        if (rule.max !== undefined && value.length > rule.max) {
          errors.push({ field, message: `${field} 长度不能超过 ${rule.max} 个字符` })
        }
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({ error: '字段验证失败', details: errors })
    }

    next()
  }
}

module.exports = { validate }
