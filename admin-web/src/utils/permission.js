import { useAuthStore } from '../store/auth'

/**
 * 权限检查工具
 * @returns {object} 权限检查方法
 */
export function usePermission() {
  const auth = useAuthStore()
  const role = auth.user?.role || ''

  /**
   * 检查是否有指定角色
   * @param {string|string[]} roles - 允许的角色
   */
  function hasRole(roles) {
    const roleList = Array.isArray(roles) ? roles : [roles]
    return roleList.includes(role)
  }

  /**
   * 检查是否有指定权限点
   * @param {string|string[]} permissions - 权限点列表
   */
  function hasPermission(permissions) {
    const perms = Array.isArray(permissions) ? permissions : [permissions]
    const userPerms = auth.user?.permissions || []
    // 超管拥有所有权限
    if (role === 'super_admin') return true
    return perms.some(p => userPerms.includes(p))
  }

  return { hasRole, hasPermission, role }
}
