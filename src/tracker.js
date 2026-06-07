// src/tracker.js
let inited = false
let envId = ''

export function init(env) {
  if (inited) return
  envId = env || ''
  if (typeof wx !== 'undefined' && wx.cloud && envId) {
    try {
      wx.cloud.init({ env: envId, traceUser: true })
      inited = true
    } catch (e) {
      console.warn('[tracker] init failed', e)
    }
  }
}

export function track(name, payload = {}) {
  if (!inited || typeof wx === 'undefined' || !wx.cloud) return
  try {
    wx.cloud.callFunction({
      name: 'trackEvent',
      data: { name, payload }
    }).catch(err => console.warn('[tracker]', name, 'failed', err))
  } catch (e) {
    console.warn('[tracker] callFunction throw', e)
  }
}
