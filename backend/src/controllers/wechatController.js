const { success, error } = require('../utils/response')
const wechatService = require('../services/wechatService')
const { ClientUser, TenantUser, WorkOrder, WoDeclaration } = require('../models')

/**
 * POST /api/v1/wechat/login
 * 微信小程序登录：用 code 换 openid，自动关联用户
 */
async function wechatLogin(req, res) {
  try {
    const { code, user_type } = req.body

    if (!code) {
      return error(res, '缺少 code 参数', 400)
    }

    const { openid, session_key } = await wechatService.code2Session(code)

    // 查找关联的用户
    let user = null
    let userType = user_type || 'client'

    if (userType === 'client') {
      user = await ClientUser.findOne({
        where: { wechat_openid: openid, status: 'active' },
        include: [{ association: 'department' }],
      })
    } else {
      user = await TenantUser.findOne({
        where: { wechat_openid: openid, status: 'active' },
        include: [{ association: 'department' }],
      })
    }

    if (!user) {
      return error(res, '未绑定微信账号，请先在系统中绑定', 404)
    }

    return success(res, {
      openid,
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        role: user.role,
        user_type: userType,
      },
    })
  } catch (err) {
    console.error('WeChat login error:', err)
    return error(res, `微信登录失败: ${err.message}`, 500)
  }
}

/**
 * POST /api/v1/wechat/bind
 * 绑定微信 openid 到用户
 */
async function bindWechat(req, res) {
  try {
    const { openid } = req.body

    if (!openid) {
      return error(res, '缺少 openid 参数', 400)
    }

    const userId = req.user.user_id
    const userType = req.user.user_type

    const model = userType === 'client' ? ClientUser : TenantUser
    const user = await model.findByPk(userId)

    if (!user) {
      return error(res, '用户不存在', 404)
    }

    await user.update({ wechat_openid: openid })

    return success(res, { message: '绑定成功' })
  } catch (err) {
    console.error('Bind wechat error:', err)
    return error(res, '绑定失败', 500)
  }
}

/**
 * POST /api/v1/wechat/subscribe
 * 接收前端推送的订阅授权（存储待发送标记）
 */
async function subscribe(req, res) {
  // 微信小程序的订阅是前端 wx.requestSubscribeMessage 完成的
  // 后端只需在需要发送时调用 sendSubscriptionMessage
  // 这个接口用于记录用户订阅偏好（可选）
  return success(res, { message: '订阅记录成功' })
}

/**
 * POST /api/v1/wechat/test-message
 * 测试发送订阅消息（开发用）
 */
async function testMessage(req, res) {
  try {
    const { openid } = req.body

    if (!openid) {
      return error(res, '缺少 openid 参数', 400)
    }

    const result = await wechatService.sendSubscriptionMessage(
      openid,
      process.env.WECHAT_TEMPLATE_STATUS_CHANGE || 'test_template',
      {
        thing1: { value: 'GG-2026-TEST' },
        thing2: { value: '测试工单' },
        phrase3: { value: '测试' },
        thing4: { value: '设计' },
        date5: { value: new Date().toLocaleDateString('zh-CN') },
      },
    )

    return success(res, result)
  } catch (err) {
    console.error('Test message error:', err)
    return error(res, `发送失败: ${err.message}`, 500)
  }
}

module.exports = {
  wechatLogin,
  bindWechat,
  subscribe,
  testMessage,
}
