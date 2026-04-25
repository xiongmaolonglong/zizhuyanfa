const axios = require('axios')

/**
 * 微信小程序订阅消息服务
 *
 * 使用方式：
 * 1. 在微信公众平台配置订阅消息模板，获取 templateId
 * 2. 前端调用 wx.requestSubscribeMessage 获取用户授权
 * 3. 后端在业务触发点调用 sendSubscriptionMessage
 *
 * 环境变量配置：
 * - WECHAT_APP_ID: 小程序 AppID
 * - WECHAT_APP_SECRET: 小程序 AppSecret
 */

const APP_ID = process.env.WECHAT_APP_ID
const APP_SECRET = process.env.WECHAT_APP_SECRET

// 内存缓存 access_token（生产环境建议用 Redis）
let accessToken = null
let tokenExpiresAt = 0

/**
 * 获取微信 access_token
 */
async function getAccessToken() {
  if (accessToken && Date.now() < tokenExpiresAt) {
    return accessToken
  }

  const url = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${APP_ID}&secret=${APP_SECRET}`
  const { data } = await axios.get(url)

  if (data.errcode) {
    throw new Error(`获取 access_token 失败: ${data.errmsg}`)
  }

  accessToken = data.access_token
  tokenExpiresAt = Date.now() + (data.expires_in - 300) * 1000 // 提前5分钟过期
  return accessToken
}

/**
 * 发送订阅消息
 * @param {string} openid - 接收者 openid
 * @param {string} templateId - 消息模板 ID
 * @param {object} data - 模板数据，格式: { thing1: { value: 'xxx' }, time2: { value: '2024-01-01 12:00' } }
 * @param {string} page - 点击消息跳转的小程序页面路径
 */
async function sendSubscriptionMessage(openid, templateId, data, page = '') {
  if (!APP_ID || !APP_SECRET) {
    console.warn('[WeChat] 未配置 WECHAT_APP_ID/WECHAT_APP_SECRET，跳过消息发送')
    return { skipped: true, reason: '未配置微信凭证' }
  }

  const token = await getAccessToken()
  const url = `https://api.weixin.qq.com/cgi-bin/message/subscribe/send?access_token=${token}`

  const body = {
    touser: openid,
    template_id: templateId,
    page,
    data,
  }

  const { data: result } = await axios.post(url, body)

  if (result.errcode !== 0 && result.errcode !== undefined) {
    console.error('[WeChat] 订阅消息发送失败:', result)
    return { success: false, error: result.errmsg, errcode: result.errcode }
  }

  return { success: true }
}

/**
 * 通过 code 换取 openid（用于小程序登录）
 * @param {string} code - wx.login 获取的 code
 */
async function code2Session(code) {
  if (!APP_ID || !APP_SECRET) {
    throw new Error('未配置 WECHAT_APP_ID/WECHAT_APP_SECRET')
  }

  const url = `https://api.weixin.qq.com/sns/jscode2session?appid=${APP_ID}&secret=${APP_SECRET}&js_code=${code}&grant_type=authorization_code`
  const { data } = await axios.get(url)

  if (data.errcode) {
    throw new Error(`code2Session 失败: ${data.errmsg}`)
  }

  return { openid: data.openid, unionid: data.unionid, session_key: data.session_key }
}

/**
 * 工单状态变更时自动发送订阅消息
 * @param {string} openid - 接收者 openid
 * @param {object} workOrder - 工单对象
 * @param {string} action - 操作类型
 */
async function notifyWorkOrderChange(openid, workOrder, action) {
  // 模板 ID 需要在微信公众平台配置
  const TEMPLATE_IDS = {
    status_change: process.env.WECHAT_TEMPLATE_STATUS_CHANGE,
    assigned: process.env.WECHAT_TEMPLATE_ASSIGNED,
    completed: process.env.WECHAT_TEMPLATE_COMPLETED,
  }

  const stageLabels = {
    declaration: '申报',
    approval: '审批',
    assignment: '分配',
    measurement: '测量',
    design: '设计',
    production: '制作',
    construction: '施工',
    finance: '结算',
    archive: '归档',
    aftersale: '售后',
  }

  const actionLabels = {
    assigned: '已分配',
    measuring: '测量中',
    measured: '测量完成',
    designing: '设计中',
    design_reviewed: '设计已审核',
    design_confirmed: '设计已确认',
    producing: '制作中',
    produced: '制作完成',
    constructing: '施工中',
    completed: '施工完成',
    accepted: '已验收',
  }

  const templateId = TEMPLATE_IDS.status_change
  if (!templateId) {
    return { skipped: true, reason: '未配置状态变更模板ID' }
  }

  return sendSubscriptionMessage(
    openid,
    templateId,
    {
      thing1: { value: workOrder.work_order_no || '' }, // 工单编号
      thing2: { value: workOrder.title || '' }, // 工单标题
      phrase3: { value: actionLabels[action] || action || '状态变更' }, // 状态
      thing4: { value: stageLabels[workOrder.current_stage] || '' }, // 当前环节
      date5: { value: new Date().toLocaleDateString('zh-CN') }, // 时间
    },
    '/pages/declare-detail/declare-detail',
  )
}

module.exports = {
  getAccessToken,
  sendSubscriptionMessage,
  code2Session,
  notifyWorkOrderChange,
}
