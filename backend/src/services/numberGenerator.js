/**
 * Unified number generator for all business document numbers.
 * Format: {PREFIX}-{YYYYMMDD}-{XXXX} where XXXX is a random 4-digit number.
 *
 * Usage:
 *   generateNo('PROD')  →  PROD-20260424-0847
 *   generateNo('PB')    →  PB-20260424-3291
 */
function generateNo(prefix) {
  const now = new Date()
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '')
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
  return `${prefix}-${dateStr}-${random}`
}

module.exports = { generateNo }
