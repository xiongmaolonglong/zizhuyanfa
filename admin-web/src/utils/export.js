let XLSX = null

async function ensureXLSX() {
  if (!XLSX) {
    const mod = await import('xlsx')
    XLSX = mod
  }
  return XLSX
}

/**
 * 将数据导出为 Excel 文件
 * @param {Array} data - 数据数组，每个元素是一个对象
 * @param {Array} columns - 列定义 [{ key: 'id', label: '编号' }]
 * @param {string} filename - 文件名（不含扩展名）
 */
export async function exportToExcel(data, columns, filename = 'export') {
  const xlsx = await ensureXLSX()
  const header = columns.map(col => col.label)
  const rows = data.map(item => columns.map(col => {
    const val = col.map ? col.map(item) : (item[col.key] ?? '')
    return val ?? ''
  }))
  const ws = xlsx.utils.aoa_to_sheet([header, ...rows])
  const wb = xlsx.utils.book_new()
  xlsx.utils.book_append_sheet(wb, ws, 'Sheet1')
  xlsx.writeFile(wb, `${filename}.xlsx`)
}

/**
 * 导出当前筛选数据（带时间戳）
 */
export function exportWithTimestamp(data, columns, prefix = 'export') {
  const now = new Date()
  const ts = `${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}_${String(now.getHours()).padStart(2,'0')}${String(now.getMinutes()).padStart(2,'0')}`
  exportToExcel(data, columns, `${prefix}_${ts}`)
}
