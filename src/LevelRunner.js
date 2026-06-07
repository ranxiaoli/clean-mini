// src/LevelRunner.js
import TOOLS_META from '../data/tools.js'

// 工具粒子配置 - particleSet 支持多种粒子混合
const PARTICLE_CONFIGS = {
  // 梳叶子: 绿叶 + 黄叶 + 棕色毛碎片,零碎几片
  comb: {
    count: 1,
    particleSet: [
      { type: 'leaf', color: '#7cb342', weight: 0.4, size: [4, 8] },
      { type: 'leaf', color: '#c9a227', weight: 0.4, size: [4, 8] },
      { type: 'hair', color: '#8b6f47', weight: 0.2, size: [3, 6] }
    ],
    gravity: 0.3, vyMin: 0.5, vyMax: 2
  },
  // 花洒: 流水线条 + 冲出的棕色卷毛/羊毛团子
  shower: {
    count: 8,
    particleSet: [
      { type: 'streak', color: 'rgba(79, 195, 247, 0.85)', weight: 0.55, size: [10, 18] },
      { type: 'streak', color: 'rgba(255, 255, 255, 0.7)', weight: 0.15, size: [8, 14] },
      { type: 'curl', color: '#8b6f47', weight: 0.15, size: [4, 8] },
      { type: 'tuft', color: 'rgba(139, 110, 74, 0.55)', weight: 0.15, size: [6, 12] }
    ],
    gravity: 0.55, vyMin: 2.5, vyMax: 4.5
  },
  spray: {
    type: 'bubble', color: '#ffffff', count: 5,
    gravity: 0.1, vyMin: -1, vyMax: 1, size: [4, 8]
  },
  brush: {
    type: 'bubble', color: '#ffffff', count: 8,
    gravity: 0.05, vyMin: -0.5, vyMax: 0.5, size: [6, 12]
  },
  // 吹风机: 风线 + 白色卷毛
  dryer: {
    count: 5,
    particleSet: [
      { type: 'wind', color: '#bbdefb', weight: 0.6, size: [4, 8] },
      { type: 'curl', color: '#f5f5f5', weight: 0.4, size: [3, 6] }
    ],
    gravity: 0.05, vyMin: 0.5, vyMax: 2
  },
  // 剪刀: 一撮羊毛
  scissors: {
    type: 'tuft', color: '#e8e8e8', count: 5,
    gravity: 0.2, vyMin: 0.5, vyMax: 1.5, size: [5, 9]
  },
  // 剃须刀: 一坨羊毛
  trimmer: {
    type: 'wool', color: '#f0f0f0', count: 6,
    gravity: 0.25, vyMin: 0.5, vyMax: 2, size: [7, 12]
  },
  cloth: { type: 'dust', color: '#bdbdbd', count: 3, gravity: 0.15, vyMin: 0.3, vyMax: 1, size: [3, 5] },
  sponge: { type: 'bubble', color: '#ffffff', count: 4, gravity: 0.1, vyMin: -0.5, vyMax: 1, size: [4, 8] },
  polish: { type: 'sparkle', color: '#ffd700', count: 3, gravity: -0.1, vyMin: -1, vyMax: 0.5, size: [4, 7] },
  // 拍打: 红色爱心冲击波
  clap: { type: 'sparkle', color: '#ff5252', count: 8, gravity: -0.05, vyMin: -2, vyMax: 0, size: [6, 10] }
}

export default class LevelRunner {
  constructor(levelData, shoeRect, callbacks = {}) {
    this.level = levelData
    this.shoeRect = shoeRect
    this.callbacks = callbacks
    this.stepIndex = 0
    this.selectedTool = null
    this.startedAt = Date.now()
    this.stepStartedAt = Date.now()
    this._currentImg = null   // 当前状态图(可擦除,显示在上层)
    this._nextImg = null      // 下一状态图(在下层,被露出)
    this._objectCanvas = null // 当前状态图的离屏画布
    this._objectCtx = null
    this._maxObjectPixels = 0
    this._bgImg = null
    this._completed = false
    this._frozen = false
    this._foamCanvas = null
    this._foamCtx = null
    this._maxFoamPixels = 0
    this._brushGrowth = 0
    this._particles = []
    this._wetDroplets = []
    this._clapLeftCount = 0
    this._clapRightCount = 0
    this._loadInitial()
  }

  get currentStep() { return this.level.steps[this.stepIndex] }
  get totalSteps() { return this.level.steps.length }

  get overallProgress() {
    if (this._completed) return 1
    const step = this.currentStep
    const effect = step.effect
    let stepRatio
    if (effect === 'wet') stepRatio = this._getSparseMarkProgress(step.layer && step.layer.targetMarks || 5)
    else if (effect === 'overlay') stepRatio = this._getOverlayCoverage()
    else if (effect === 'flip') {
      const target = (step.layer && step.layer.clapTarget) || 2
      const l = Math.min(1, (this._clapLeftCount || 0) / target)
      const r = Math.min(1, (this._clapRightCount || 0) / target)
      stepRatio = (l + r) / 2
    }
    else stepRatio = this._getEraseRatio()
    return Math.min(1, (this.stepIndex + Math.min(stepRatio, 1)) / this.totalSteps)
  }

  get currentStepProgress() {
    const step = this.currentStep
    const effect = step.effect
    if (effect === 'wet') return this._getSparseMarkProgress(step.layer && step.layer.targetMarks || 5)
    if (effect === 'overlay') return this._getOverlayCoverage()
    if (effect === 'flip') {
      const target = (step.layer && step.layer.clapTarget) || 2
      const l = Math.min(1, (this._clapLeftCount || 0) / target)
      const r = Math.min(1, (this._clapRightCount || 0) / target)
      return (l + r) / 2
    }
    return this._getEraseRatio()
  }

  get usedTools() {
    const set = new Set()
    for (const s of this.level.steps) set.add(s.tool)
    return [...set]
  }

  get foamCanvas() { return this._foamCanvas }
  get objectCanvas() { return this._objectCanvas }
  get nextObjectImage() { return this._nextImg }
  get objectImage() { return this._currentImg }
  get bgImage() { return this._bgImg }
  get particles() { return this._particles }

  setSelectedTool(toolId) { this.selectedTool = toolId }

  // GameScene 在拿到图片真实尺寸后调用,重新适配 shoeRect 并重画离屏画布
  refreshLayout() {
    this._initObjectCanvas()
    this._initFoamCanvas()
  }

  erase(x, y) {
    if (this._completed || this._frozen) return
    const r = this.shoeRect.rect
    if (x < r.x || x > r.x + r.w || y < r.y || y > r.y + r.h) return
    const required = this.currentStep.tool
    if (this.selectedTool !== required) {
      if (this.callbacks.onWrongTool) {
        this.callbacks.onWrongTool({ expected: required, got: this.selectedTool })
      }
      return
    }

    const step = this.currentStep
    const effect = step.effect

    if (effect === 'wet') {
      // 浇水: 维护 4-5 个动态水滴(轻微抖动位置),持久保留
      this._addWetDroplet(x, y, step.layer && step.layer.markColor || 'rgba(120, 80, 40, 0.55)')
    } else if (effect === 'overlay') {
      // 喷雾/刷子覆盖: 在 foamCanvas 上叠加颜色,不切 state
      const color = step.layer && step.layer.overlayColor || 'rgba(180, 150, 100, 0.65)'
      const isBrush = this.selectedTool === 'brush'
      if (isBrush) this._brushGrowth = Math.min(this._brushGrowth + 0.3, 2.5)
      this._addOverlay(x, y, color, isBrush)
    } else if (effect === 'rinse') {
      // 冲洗: 同时擦 foamCanvas 和 objectCanvas, 露出下一图
      this._rinse(x, y)
    } else if (effect === 'flip') {
      // 拍打翻面: 累计左右两边各自的点击次数
      const cx = this.shoeRect.rect.x + this.shoeRect.rect.w / 2
      if (x < cx) this._clapLeftCount = (this._clapLeftCount || 0) + 1
      else this._clapRightCount = (this._clapRightCount || 0) + 1
    } else {
      // 默认: 擦露图 (擦 objectCanvas, 露出 nextImg)
      this._eraseObjectCanvas(x, y)
    }

    // 生成粒子效果
    this._spawnParticles(x, y, this.selectedTool)
  }

  tick(now) {
    this._updateParticles()
    this._updateWetDroplets()
    if (this._completed || this._frozen) return
    if (!this._objectCtx) return
    const step = this.currentStep
    let ratio
    if (step.effect === 'wet') {
      ratio = this._getSparseMarkProgress(step.layer && step.layer.targetMarks || 5)
    } else if (step.effect === 'overlay') {
      ratio = this._getOverlayCoverage()
    } else if (step.effect === 'flip') {
      const target = (step.layer && step.layer.clapTarget) || 2
      const left = Math.min(1, (this._clapLeftCount || 0) / target)
      const right = Math.min(1, (this._clapRightCount || 0) / target)
      ratio = (left + right) / 2
    } else {
      // erase / rinse 都用 erase 比例(rinse 同时擦了 objectCanvas)
      ratio = this._getEraseRatio()
    }
    if (ratio >= step.passThreshold) {
      this._advanceStep()
    }
  }

  destroy() {
    this._currentImg = null
    this._nextImg = null
    this._objectCanvas = null
    this._objectCtx = null
    this._foamCanvas = null
    this._foamCtx = null
    this._particles = []
  }

  _loadInitial() {
    // 同时加载 currentImg 和 nextImg, 都加载完才 onReady
    // 否则玩家擦掉 currentImg 时,nextImg 还没加载,会看到空白
    let pending = 1
    const tryReady = () => {
      pending--
      if (pending <= 0) {
        this._initObjectCanvas()
        this._initFoamCanvas()
        if (this.callbacks.onReady) this.callbacks.onReady()
      }
    }

    // 加载初始 currentImg
    const img = wx.createImage()
    img.onload = () => {
      this._currentImg = img
      tryReady()
    }
    img.onerror = () => { tryReady() }
    img.src = this.level.objectImage

    // 同步加载首步的 nextImg
    const nextSrc = this.currentStep.nextObjectImage
    if (nextSrc) {
      pending++
      const nimg = wx.createImage()
      nimg.onload = () => {
        this._nextImg = nimg
        tryReady()
      }
      nimg.onerror = () => {
        this._nextImg = null
        tryReady()
      }
      nimg.src = nextSrc
    }

    if (this.level.bgImage) {
      const bgImg = wx.createImage()
      bgImg.onload = () => { this._bgImg = bgImg }
      bgImg.src = this.level.bgImage
    }
  }

  _loadNextImage(src) {
    return this._loadNextImageAsync(src, null)
  }

  _loadNextImageAsync(src, onDone) {
    if (!src) {
      this._nextImg = null
      if (onDone) onDone()
      return
    }
    const img = wx.createImage()
    img.onload = () => {
      this._nextImg = img
      if (onDone) onDone()
    }
    img.onerror = () => {
      this._nextImg = null
      if (onDone) onDone()
    }
    img.src = src
  }

  _initObjectCanvas() {
    if (!this._objectCanvas) {
      const c = wx.createCanvas()
      c.width = this.shoeRect.canvasW
      c.height = this.shoeRect.canvasH
      this._objectCanvas = c
      this._objectCtx = c.getContext('2d')
    }
    this._redrawObjectCanvas()
    this._recalcMaxObjectPixels()
  }

  _redrawObjectCanvas() {
    if (!this._objectCtx || !this._currentImg) return
    const ctx = this._objectCtx
    ctx.clearRect(0, 0, this._objectCanvas.width, this._objectCanvas.height)
    const r = this._getImageRect(this._currentImg)
    ctx.drawImage(this._currentImg, r.x, r.y, r.w, r.h)
  }

  // 按图片自身宽高比 contain 适配 shoeRect.rect,居中显示,不拉伸
  _getImageRect(img) {
    if (!img) return this.shoeRect.rect
    const area = this.shoeRect.rect
    const imgRatio = img.width / img.height
    const areaRatio = area.w / area.h
    let w, h
    if (imgRatio > areaRatio) { w = area.w; h = area.w / imgRatio }
    else { h = area.h; w = area.h * imgRatio }
    return {
      x: area.x + (area.w - w) / 2,
      y: area.y + (area.h - h) / 2,
      w, h
    }
  }

  // 暴露给 GameScene 计算 nextImg 的绘制 rect
  getImageRect(img) {
    return this._getImageRect(img)
  }

  _recalcMaxObjectPixels() {
    this._maxObjectPixels = 0
    if (!this._objectCtx || !this._currentImg) return
    const r = this._getImageRect(this._currentImg)
    const ix = Math.floor(r.x), iy = Math.floor(r.y)
    const iw = Math.floor(r.w), ih = Math.floor(r.h)
    if (iw <= 0 || ih <= 0) return
    const data = this._objectCtx.getImageData(ix, iy, iw, ih).data
    let opaque = 0
    for (let i = 3; i < data.length; i += 4) if (data[i] > 20) opaque++
    this._maxObjectPixels = opaque || 1
  }

  _eraseObjectCanvas(x, y) {
    if (!this._objectCtx) return
    const ctx = this._objectCtx
    const r = this._brushRadius()
    ctx.globalCompositeOperation = 'destination-out'
    ctx.beginPath()
    ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.fill()
    ctx.globalCompositeOperation = 'source-over'
  }

  _brushRadius() {
    const step = this.currentStep
    return (step.layer && step.layer.brushRadius) || 40
  }

  _getEraseRatio() {
    if (!this._objectCtx || !this._maxObjectPixels) return 0
    const now = Date.now()
    if (this._lastEraseSampleTime && now - this._lastEraseSampleTime < 300) {
      return this._cachedEraseRatio || 0
    }
    this._lastEraseSampleTime = now
    const { x, y, w, h } = this.shoeRect.rect
    const ix = Math.floor(x), iy = Math.floor(y)
    const iw = Math.floor(w), ih = Math.floor(h)
    if (iw <= 0 || ih <= 0) return 0
    const data = this._objectCtx.getImageData(ix, iy, iw, ih).data
    let opaque = 0
    for (let i = 3; i < data.length; i += 4) if (data[i] > 20) opaque++
    const erased = this._maxObjectPixels - opaque
    this._cachedEraseRatio = Math.min(1, Math.max(0, erased / this._maxObjectPixels))
    return this._cachedEraseRatio
  }

  // ---- 泡沫层(spray/brush 视觉效果)----
  _initFoamCanvas() {
    if (!this._foamCanvas) {
      const c = wx.createCanvas()
      c.width = this.shoeRect.canvasW
      c.height = this.shoeRect.canvasH
      this._foamCanvas = c
      this._foamCtx = c.getContext('2d')
    }
  }

  _addFoam(x, y, mode) {
    if (!this._foamCtx) return
    const ctx = this._foamCtx
    const r = this._brushRadius()
    const count = mode === 'spray' ? 12 + Math.floor(Math.random() * 8) : 18 + Math.floor(Math.random() * 8)
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2
      const dist = Math.random() * r
      const px = x + Math.cos(angle) * dist
      const py = y + Math.sin(angle) * dist
      const pr = mode === 'spray' ? 6 + Math.random() * 10 : 8 + Math.random() * 14
      const alpha = 0.4 + Math.random() * 0.4
      ctx.fillStyle = `rgba(255,255,255,${alpha})`
      ctx.beginPath()
      ctx.arc(px, py, pr, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  _clearFoam(x, y) {
    if (!this._foamCtx) return
    const r = this._brushRadius() * 1.2
    this._foamCtx.globalCompositeOperation = 'destination-out'
    this._foamCtx.beginPath()
    this._foamCtx.arc(x, y, r, 0, Math.PI * 2)
    this._foamCtx.fill()
    this._foamCtx.globalCompositeOperation = 'source-over'
  }

  // ---- 覆盖层(shower/spray 等覆盖式工具)----
  _addSparseMark(x, y, color) {
    if (!this._foamCtx) return
    const ctx = this._foamCtx
    // 稀疏水印:只画 2-3 个大圆(模拟 4-5 处水印)
    const count = 2 + Math.floor(Math.random() * 2)
    const r = this._brushRadius()
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2
      const dist = Math.random() * r * 0.7
      const px = x + Math.cos(angle) * dist
      const py = y + Math.sin(angle) * dist
      const pr = 12 + Math.random() * 20
      ctx.fillStyle = color
      ctx.beginPath()
      ctx.arc(px, py, pr, 0, Math.PI * 2)
      ctx.fill()
    }
    this._clipToShape()
    this._sparseMarkCount = (this._sparseMarkCount || 0) + 1
  }

  _getSparseMarkProgress(targetMarks) {
    return Math.min(1, (this._wetDroplets ? this._wetDroplets.length : 0) / targetMarks)
  }

  // foamCanvas 覆盖率(overlay 步骤进度)
  _getOverlayCoverage() {
    if (!this._foamCtx || !this._maxObjectPixels) return 0
    const now = Date.now()
    if (this._lastOverlaySampleTime && now - this._lastOverlaySampleTime < 300) {
      return this._cachedOverlayRatio || 0
    }
    this._lastOverlaySampleTime = now
    const r = this._currentImg ? this._getImageRect(this._currentImg) : this.shoeRect.rect
    const ix = Math.floor(r.x), iy = Math.floor(r.y)
    const iw = Math.floor(r.w), ih = Math.floor(r.h)
    if (iw <= 0 || ih <= 0) return 0
    const data = this._foamCtx.getImageData(ix, iy, iw, ih).data
    let opaque = 0
    for (let i = 3; i < data.length; i += 4) if (data[i] > 20) opaque++
    this._cachedOverlayRatio = Math.min(1, opaque / this._maxObjectPixels)
    return this._cachedOverlayRatio
  }

  // overlay 覆盖(喷雾喷剂 / 刷子泡沫覆盖)
  _addOverlay(x, y, color, isBrush) {
    if (!this._foamCtx) return
    const ctx = this._foamCtx
    const r = this._brushRadius() * (isBrush ? (0.8 + this._brushGrowth * 0.4) : 1)
    const count = isBrush ? 18 + Math.floor(Math.random() * 8) : 12 + Math.floor(Math.random() * 8)
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2
      const dist = Math.random() * r
      const px = x + Math.cos(angle) * dist
      const py = y + Math.sin(angle) * dist
      const pr = isBrush ? 8 + Math.random() * 14 : 6 + Math.random() * 10
      ctx.fillStyle = color
      ctx.beginPath()
      ctx.arc(px, py, pr, 0, Math.PI * 2)
      ctx.fill()
    }
    this._clipToShape()
  }

  // rinse 冲洗: 同时擦 foamCanvas + 擦 objectCanvas
  _rinse(x, y) {
    // 擦掉 foamCanvas 上的 overlay/foam
    this._clearFoam(x, y)
    // 同时擦 objectCanvas,露出 nextImg
    this._eraseObjectCanvas(x, y)
  }

  // ---- 动态水滴(wet 步骤,持久存在并轻微抖动)----
  _addWetDroplet(x, y, color) {
    // 已有水滴附近不重复添加(避免一次划过加好多个)
    const minDist = 50
    for (const d of this._wetDroplets) {
      const dx = d.baseX - x, dy = d.baseY - y
      if (dx * dx + dy * dy < minDist * minDist) return
    }
    this._wetDroplets.push({
      baseX: x, baseY: y,
      jitterAngle: Math.random() * Math.PI * 2,
      jitterSpeed: 0.05 + Math.random() * 0.05,
      jitterAmp: 1.5 + Math.random() * 1.5,
      radius: 14 + Math.random() * 8,
      color
    })
  }

  _updateWetDroplets() {
    for (const d of this._wetDroplets) {
      d.jitterAngle += d.jitterSpeed
    }
  }

  get wetDroplets() { return this._wetDroplets }

  // 用物体形状裁剪 foamCanvas
  _clipToShape() {
    if (!this._foamCtx || !this._currentImg) return
    const r = this._getImageRect(this._currentImg)
    this._foamCtx.globalCompositeOperation = 'destination-in'
    this._foamCtx.drawImage(this._currentImg, r.x, r.y, r.w, r.h)
    this._foamCtx.globalCompositeOperation = 'source-over'
  }

  // ---- 粒子系统 ----
  _spawnParticles(x, y, toolId) {
    const cfg = PARTICLE_CONFIGS[toolId]
    if (!cfg) return
    // 梳子降低产出频率,其他工具保持原频率
    const spawnChance = toolId === 'comb' ? 0.15 : 1
    if (Math.random() > spawnChance) return
    for (let i = 0; i < cfg.count; i++) {
      const angle = Math.random() * Math.PI * 2
      const r = 8 + Math.random() * 16
      // 如果有 particleSet,按权重随机选一种
      let pType, pColor, pSize
      if (cfg.particleSet) {
        const roll = Math.random()
        let acc = 0
        for (const s of cfg.particleSet) {
          acc += s.weight
          if (roll < acc) { pType = s.type; pColor = s.color; pSize = s.size; break }
        }
        if (!pType) { const last = cfg.particleSet[cfg.particleSet.length - 1]; pType = last.type; pColor = last.color; pSize = last.size }
      } else {
        pType = cfg.type; pColor = cfg.color; pSize = cfg.size || [4, 8]
      }
      this._particles.push({
        x: x + Math.cos(angle) * r,
        y: y + Math.sin(angle) * r,
        vx: (Math.random() - 0.5) * 1.5,
        vy: cfg.vyMin + Math.random() * (cfg.vyMax - cfg.vyMin),
        gravity: cfg.gravity,
        alpha: 1,
        life: 60 + Math.floor(Math.random() * 30),
        maxLife: 90,
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.15,
        size: pSize[0] + Math.random() * (pSize[1] - pSize[0]),
        type: pType,
        color: pColor
      })
    }
    if (this._particles.length > 300) {
      this._particles = this._particles.slice(-300)
    }
  }

  _updateParticles() {
    const next = []
    for (const p of this._particles) {
      p.vy += p.gravity
      p.x += p.vx
      p.y += p.vy
      p.rotation += p.rotSpeed
      p.life--
      p.alpha = Math.max(0, p.life / p.maxLife)
      if (p.life > 0 && p.y < this.shoeRect.canvasH + 40) next.push(p)
    }
    this._particles = next
  }

  _advanceStep() {
    const now = Date.now()
    const stepDuration = now - this.stepStartedAt
    const finishedIndex = this.stepIndex
    if (this.callbacks.onStepComplete) {
      this.callbacks.onStepComplete({ stepIndex: finishedIndex, durationMs: stepDuration })
    }
    if (this.stepIndex + 1 < this.totalSteps) {
      const prevStep = this.level.steps[this.stepIndex]
      const nextStep = this.level.steps[this.stepIndex + 1]

      // 立即切换到完成状态图并重画,让玩家看到完整结果
      if (prevStep.nextObjectImage && this._nextImg) {
        this._currentImg = this._nextImg
        this._redrawObjectCanvas()
      }

      this._frozen = true
      setTimeout(() => {
        this.stepIndex++
        this.stepStartedAt = Date.now()
        const step = this.currentStep
        const keepFoam = step.effect === 'overlay' || step.effect === 'rinse'

        // objectCanvas 已在上面重画过,这里只需重新计算像素
        this._recalcMaxObjectPixels()

        if (!keepFoam && this._foamCtx) {
          this._foamCtx.clearRect(0, 0, this._foamCanvas.width, this._foamCanvas.height)
        }
        this._particles = []
        this._wetDroplets = []
        this._brushGrowth = 0
        this._sparseMarkCount = 0
        this._clapLeftCount = 0
        this._clapRightCount = 0

        // 加载下一步的 nextImg（如果有）
        this._nextImg = null
        const nextSrc = step.nextObjectImage
        if (nextSrc) {
          this._loadNextImageAsync(nextSrc, () => {
            this._frozen = false
          })
        } else {
          this._frozen = false
        }
      }, 1500)
    } else {
      // 最后一步完成: 立即切换到最终状态图
      const prevStep = this.level.steps[this.stepIndex]
      if (prevStep.nextObjectImage && this._nextImg) {
        this._currentImg = this._nextImg
        this._redrawObjectCanvas()
      }
      this._completed = true
      const totalDuration = now - this.startedAt
      // 延迟 3 秒再触发胜利回调,让玩家欣赏最终结果
      setTimeout(() => {
        if (this.callbacks.onLevelComplete) {
          this.callbacks.onLevelComplete({ durationMs: totalDuration })
        }
      }, 3000)
    }
  }
}
