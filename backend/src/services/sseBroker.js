const EventEmitter = require('events')

class SSEBroker {
  constructor() {
    this.emitter = new EventEmitter()
    this.clients = new Map() // tenantId -> Set<Response>
  }

  /**
   * Register a new SSE client for a tenant.
   * @param {string} tenantId
   * @param {Response} res
   * @returns {Function} cleanup function to call on disconnect
   */
  subscribe(tenantId, res) {
    if (!this.clients.has(tenantId)) {
      this.clients.set(tenantId, new Set())
    }
    this.clients.get(tenantId).add(res)

    return () => {
      const set = this.clients.get(tenantId)
      if (set) {
        set.delete(res)
        if (set.size === 0) {
          this.clients.delete(tenantId)
        }
      }
    }
  }

  /**
   * Emit an event to all SSE clients of a specific tenant.
   * @param {string} tenantId
   * @param {string} eventType - e.g. 'declaration:new', 'declaration:updated'
   * @param {Object} payload
   */
  emitToTenant(tenantId, eventType, payload) {
    const clients = this.clients.get(tenantId)
    if (!clients || clients.size === 0) return

    const data = JSON.stringify({ type: eventType, ...payload, ts: Date.now() })
    const msg = `data: ${data}\n\n`

    // Remove stale connections
    const stale = []
    for (const res of clients) {
      try {
        res.write(msg)
      } catch {
        stale.push(res)
      }
    }
    for (const res of stale) {
      clients.delete(res)
    }
    if (clients.size === 0) {
      this.clients.delete(tenantId)
    }
  }
}

module.exports = new SSEBroker()
