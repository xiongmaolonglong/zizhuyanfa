const isDev = import.meta.env.DEV

export const logger = {
  log: (...args) => isDev && console.log('[LOG]', ...args),
  warn: (...args) => isDev && console.warn('[WARN]', ...args),
  error: (...args) => isDev && console.error('[ERROR]', ...args),
}
