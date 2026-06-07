// src/share.js
import { loadProgress } from './storage.js'

function buildShareCard() {
  const completedCount = loadProgress().completedLevels.length
  return {
    title: completedCount > 0
      ? `我已清洁了 ${completedCount} 件物品,你来挑战?`
      : `太治愈了,来一起清理吧`,
    imageUrl: 'images/share/cover.png'
  }
}

export function setupSystemShare() {
  if (typeof wx === 'undefined') return
  if (wx.showShareMenu) wx.showShareMenu({ withShareTicket: false })
  if (wx.onShareAppMessage) wx.onShareAppMessage(() => buildShareCard())
}

export function userShare() {
  if (typeof wx === 'undefined' || !wx.shareAppMessage) return
  wx.shareAppMessage(buildShareCard())
}
