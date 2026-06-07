const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext()
  const { name, payload } = event
  if (!name) return { ok: false, error: 'missing name' }
  const db = cloud.database()
  await db.collection('events').add({
    data: {
      name: String(name).slice(0, 64),
      payload: payload || {},
      openid: OPENID || 'anonymous',
      ts: Date.now()
    }
  })
  return { ok: true }
}
