const KEY = 'clean_mini_progress'

const DEFAULT = { unlockedLevel: 1, completedLevels: [], lastPlayedAt: 0 }

export function loadProgress() {
  try {
    const raw = wx.getStorageSync(KEY)
    if (!raw) return { ...DEFAULT }
    const p = typeof raw === 'string' ? JSON.parse(raw) : raw
    return {
      unlockedLevel: typeof p.unlockedLevel === 'number' ? p.unlockedLevel : 1,
      completedLevels: Array.isArray(p.completedLevels) ? p.completedLevels : [],
      lastPlayedAt: typeof p.lastPlayedAt === 'number' ? p.lastPlayedAt : 0
    }
  } catch (e) {
    return { ...DEFAULT }
  }
}

export function saveProgress(progress) {
  try {
    wx.setStorageSync(KEY, JSON.stringify(progress))
  } catch (e) {
    // 静默失败
  }
}

export function markLevelComplete(levelId) {
  const p = loadProgress()
  const completed = p.completedLevels.includes(levelId)
    ? p.completedLevels
    : [...p.completedLevels, levelId]
  const unlockedLevel = Math.max(p.unlockedLevel, levelId + 1)
  const next = { ...p, completedLevels: completed, unlockedLevel, lastPlayedAt: Date.now() }
  saveProgress(next)
  return next
}

export function reset() {
  try { wx.removeStorageSync(KEY) } catch (e) {}
}
