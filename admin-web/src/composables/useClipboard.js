import { ElMessage } from 'element-plus'

/**
 * Copy text to clipboard with fallback for browsers that don't support navigator.clipboard.
 * @param {string} text - Text to copy
 * @param {string} [successMsg='已复制到剪贴板'] - Success message
 */
export async function copyToClipboard(text, successMsg = '已复制到剪贴板') {
  try {
    await navigator.clipboard.writeText(text)
  } catch {
    const ta = document.createElement('textarea')
    ta.value = text
    document.body.appendChild(ta)
    ta.select()
    document.execCommand('copy')
    document.body.removeChild(ta)
  }
  ElMessage.success(successMsg)
}
