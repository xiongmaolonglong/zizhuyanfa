const AddressDict = require('../models/AddressDict')
const { success, error } = require('../utils/response')

/**
 * 序列化地址节点（排除内部字段）
 */
function serializeAddress(addr, includeChildren = false) {
  const node = {
    code: addr.code,
    name: addr.name,
    level: addr.level,
    parent_code: addr.parent_code,
  }
  if (includeChildren && addr.children) {
    node.children = addr.children.map(child => serializeAddress(child, true))
  }
  return node
}

// ==================== 获取地址列表 ====================

async function getAddressList(req, res) {
  try {
    const { parent_code, level } = req.query

    const where = {}
    if (parent_code !== undefined) {
      where.parent_code = parent_code
    }
    if (level) {
      where.level = level
    }

    const addresses = await AddressDict.findAll({
      where,
      order: [['code', 'ASC']],
    })

    return success(res, addresses.map(a => serializeAddress(a)))
  } catch (err) {
    console.error('Get address list error:', err)
    return error(res, '获取地址列表失败')
  }
}

// ==================== 获取完整地址树 ====================

async function getAddressTree(req, res) {
  try {
    // 一次性查出所有地址数据
    const allAddresses = await AddressDict.findAll({
      order: [['parent_code', 'ASC'], ['code', 'ASC']],
    })

    // 在内存中构建映射
    const map = {}
    const roots = []

    for (const addr of allAddresses) {
      const node = { code: addr.code, name: addr.name, level: addr.level, parent_code: addr.parent_code, children: [] }
      map[addr.code] = node
    }

    for (const addr of allAddresses) {
      const node = map[addr.code]
      if (addr.parent_code && map[addr.parent_code]) {
        map[addr.parent_code].children.push(node)
      } else {
        roots.push(node)
      }
    }

    return success(res, roots)
  } catch (err) {
    console.error('Get address tree error:', err)
    return error(res, '获取地址树失败')
  }
}

// ==================== 单个地址详情 ====================

async function getAddressDetail(req, res) {
  try {
    const { code } = req.params

    const address = await AddressDict.findOne({ where: { code } })
    if (!address) {
      return error(res, '地址不存在', 404)
    }

    return success(res, serializeAddress(address))
  } catch (err) {
    console.error('Get address detail error:', err)
    return error(res, '获取地址详情失败')
  }
}

// ==================== 获取地址子级 ====================

async function getAddressChildren(req, res) {
  try {
    const { code } = req.params

    const parent = await AddressDict.findOne({ where: { code } })
    if (!parent) {
      return error(res, '地址不存在', 404)
    }

    const children = await AddressDict.findAll({
      where: { parent_code: code },
      order: [['code', 'ASC']],
    })

    return success(res, children.map(c => serializeAddress(c)))
  } catch (err) {
    console.error('Get address children error:', err)
    return error(res, '获取地址子级失败')
  }
}

// ==================== 获取地址路径 ====================

async function getAddressPath(req, res) {
  try {
    const { code } = req.params

    const path = []
    let currentCode = code

    while (currentCode) {
      const addr = await AddressDict.findOne({ where: { code: currentCode } })
      if (!addr) {
        return error(res, '地址不存在', 404)
      }

      path.unshift(serializeAddress(addr))
      currentCode = addr.parent_code
    }

    return success(res, path)
  } catch (err) {
    console.error('Get address path error:', err)
    return error(res, '获取地址路径失败')
  }
}

module.exports = {
  getAddressList,
  getAddressTree,
  getAddressDetail,
  getAddressChildren,
  getAddressPath,
}
