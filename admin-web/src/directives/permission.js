import { useAuthStore } from '../store/auth'

/**
 * v-permission 指令
 * 用法:
 *   v-permission="'admin'"          - 仅 admin 角色可见
 *   v-permission="['admin', 'manager']" - 任一角色可见
 *   v-permission:action="'create'"  - 需要有 create 权限点
 */
export default {
  mounted(el, binding) {
    const auth = useAuthStore()
    const role = auth.user?.role || ''
    const userPerms = auth.user?.permissions || []

    // 超管拥有所有权限
    if (role === 'super_admin') return

    let requiredRoles = []
    let requiredPerms = []

    if (binding.arg === 'action') {
      requiredPerms = Array.isArray(binding.value) ? binding.value : [binding.value]
    } else {
      requiredRoles = Array.isArray(binding.value) ? binding.value : [binding.value]
    }

    // 检查角色
    if (requiredRoles.length && !requiredRoles.includes(role)) {
      el.parentNode?.removeChild(el)
      return
    }

    // 检查权限点
    if (requiredPerms.length && !requiredPerms.some(p => userPerms.includes(p))) {
      el.parentNode?.removeChild(el)
    }
  },
}
