// src/GameScene.js
import LevelRunner from './LevelRunner.js'
import UI from './UI.js'
import LEVELS from '../data/levels.js'
import { loadProgress, markLevelComplete } from './storage.js'
import { init as trackerInit, track } from './tracker.js'
import { userShare } from './share.js'

export default class GameScene {
  constructor(canvas) {
    trackerInit('') // 真机部署后填云开发环境 ID
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')
    this.width = canvas.width
    this.height = canvas.height
    const progress = loadProgress()
    this.levelIndex = Math.min(Math.max(progress.unlockedLevel - 1, 0), LEVELS.length - 1)
    this.runner = null
    this.ui = new UI(this.ctx, this.width, this.height)
    this._touchPos = null // { x, y, toolId } 擦拭时工具跟随触点
    this.uiState = {
      wrongToolHintAt: 0,
      stepAdvancedAt: 0,
      showWin: false,
      isLastLevel: false
    }
    track('app_launch', { unlockedLevel: this.levelIndex + 1 })
    this._enterLevel(this.levelIndex)
    this._bindTouch()
    this._loop()
  }

  _shoeRect() {
    const areaW = this.width * 0.8
    const areaH = this.height * 0.6
    const x = (this.width - areaW) / 2
    const y = (this.height - areaH) / 2
    return { x, y, w: areaW, h: areaH }
  }

  _computeShoeRect(img) {
    const area = this._shoeRect()
    const levelRatio = this.runner && this.runner.level.aspectRatio
    const imgRatio = levelRatio || (img.width / img.height)
    const areaRatio = area.w / area.h
    let w, h
    if (imgRatio > areaRatio) { w = area.w; h = area.w / imgRatio }
    else { h = area.h; w = area.h * imgRatio }
    return { x: area.x + (area.w - w) / 2, y: area.y + (area.h - h) / 2, w, h }
  }

  _enterLevel(index) {
    if (this.runner) this.runner.destroy()
    const level = LEVELS[index]
    track('level_start', { levelId: level.id, category: level.category })
    this._levelStartedAt = Date.now()
    this.uiState.showWin = false
    this.uiState.isLastLevel = (index === LEVELS.length - 1)
    const initRect = this._shoeRect()
    this.runner = new LevelRunner(level, { rect: initRect, canvasW: this.width, canvasH: this.height }, {
      onReady: () => {
        const newRect = this._computeShoeRect(this.runner.objectImage)
        this.runner.shoeRect = { rect: newRect, canvasW: this.width, canvasH: this.height }
        this.runner.refreshLayout()
      },
      onWrongTool: ({ expected, got }) => {
        this.uiState.wrongToolHintAt = Date.now()
        const level = LEVELS[this.levelIndex]
        track('wrong_tool', { levelId: level.id, stepIndex: this.runner.stepIndex, expected, got: got || null })
      },
      onStepComplete: ({ stepIndex, durationMs }) => {
        this.uiState.stepAdvancedAt = Date.now()
        const level = LEVELS[this.levelIndex]
        track('step_complete', { levelId: level.id, stepIndex, durationMs })
      },
      onLevelComplete: ({ durationMs }) => {
        const level = LEVELS[this.levelIndex]
        markLevelComplete(level.id)
        track('level_complete', { levelId: level.id, durationMs })
        this.uiState.showWin = true
      }
    })
  }

  _bindTouch() {
    wx.onTouchStart(e => this._onTouchStart(e))
    wx.onTouchMove(e => this._onTouchMove(e))
    wx.onTouchEnd(e => this._onTouchEnd(e))
  }

  _onTouchStart(e) {
    const t = e.changedTouches[0]
    if (this.uiState.showWin) {
      const action = this.ui.hitWinButton(t.clientX, t.clientY)
      if (action === 'replay') this._replayCurrent()
      else if (action === 'next') this._nextLevel()
      else if (action === 'share') {
        const level = LEVELS[this.levelIndex]
        track('share_click', { levelId: level.id, completedCount: loadProgress().completedLevels.length })
        userShare()
      }
      return
    }
    // 检查工具栏翻页箭头
    const pageAction = this.ui.handleToolbarClick(t.clientX, t.clientY)
    if (pageAction && pageAction.type === 'page_change') return

    const toolHit = this.ui.hitTool(t.clientX, t.clientY)
    if (toolHit !== null) {
      if (this.runner) this.runner.setSelectedTool(toolHit)
      this._touchPos = { x: t.clientX, y: t.clientY, toolId: toolHit }
      return
    }
    if (this.runner && this.runner.selectedTool) {
      this._touchPos = { x: t.clientX, y: t.clientY, toolId: this.runner.selectedTool }
      this.runner.erase(t.clientX, t.clientY)
    }
  }

  _onTouchMove(e) {
    if (this.uiState.showWin || !this.runner) return
    const t = e.touches[0]
    if (this.runner.selectedTool) {
      this._touchPos = { x: t.clientX, y: t.clientY, toolId: this.runner.selectedTool }
      this.runner.erase(t.clientX, t.clientY)
    }
  }

  _onTouchEnd() {
    this._touchPos = null
  }

  _replayCurrent() {
    const level = LEVELS[this.levelIndex]
    track('level_replay', { levelId: level.id })
    this._enterLevel(this.levelIndex)
  }

  _nextLevel() {
    if (this.levelIndex + 1 < LEVELS.length) {
      this.levelIndex++
      track('next_level_click', { toLevelId: LEVELS[this.levelIndex].id })
      this._enterLevel(this.levelIndex)
    } else {
      this._replayCurrent()
    }
  }

  _loop() {
    const step = (ts) => { this._draw(ts); requestAnimationFrame(step) }
    requestAnimationFrame(step)
  }

  _draw(ts) {
    const ctx = this.ctx
    ctx.clearRect(0, 0, this.width, this.height)

    if (this.runner) {
      const bg = this.runner.level.bgImage
      if (bg) {
        if (bg.startsWith('#') || bg.startsWith('rgb')) {
          ctx.fillStyle = bg
          ctx.fillRect(0, 0, this.width, this.height)
        } else if (this.runner.bgImage) {
          ctx.drawImage(this.runner.bgImage, 0, 0, this.width, this.height)
        }
      }
    }
    // 下一状态图(在下层,被露出)— 按自身宽高比 contain 居中,不拉伸
    if (this.runner && this.runner.nextObjectImage) {
      const r = this.runner.getImageRect(this.runner.nextObjectImage)
      ctx.drawImage(this.runner.nextObjectImage, r.x, r.y, r.w, r.h)
    }
    // 当前状态图(可擦除,显示在上层)
    if (this.runner && this.runner.objectCanvas) {
      ctx.drawImage(this.runner.objectCanvas, 0, 0)
    }
    // 泡沫层
    if (this.runner && this.runner.foamCanvas) {
      ctx.drawImage(this.runner.foamCanvas, 0, 0)
    }
    // 动态水滴(每帧位置抖动)
    if (this.runner && this.runner.wetDroplets && this.runner.wetDroplets.length) {
      this._drawWetDroplets(this.runner.wetDroplets)
    }
    // 粒子效果
    if (this.runner && this.runner.particles) {
      this._drawParticles(this.runner.particles)
    }
    if (this.runner) this.runner.tick(ts)

    this.ui.draw({
      level: this.runner ? this.runner.level : null,
      levelIndex: this.levelIndex,
      totalLevels: LEVELS.length,
      overallProgress: this.runner ? this.runner.overallProgress : 0,
      requiredTool: this.runner ? this.runner.currentStep.tool : null,
      selectedTool: this.runner ? this.runner.selectedTool : null,
      usedTools: this.runner ? this.runner.usedTools : [],
      uiState: this.uiState,
      touchPos: this._touchPos
    })
  }

  _drawParticles(particles) {
    const ctx = this.ctx
    for (const p of particles) {
      ctx.save()
      ctx.globalAlpha = p.alpha
      ctx.translate(p.x, p.y)
      ctx.rotate(p.rotation)
      ctx.fillStyle = p.color
      if (p.type === 'leaf') {
        // 叶子:椭圆 + 中央叶脉
        ctx.beginPath()
        ctx.ellipse(0, 0, p.size * 1.4, p.size * 0.7, 0, 0, Math.PI * 2)
        ctx.fill()
        ctx.strokeStyle = 'rgba(0,0,0,0.2)'
        ctx.lineWidth = 0.8
        ctx.beginPath()
        ctx.moveTo(-p.size * 1.4, 0)
        ctx.lineTo(p.size * 1.4, 0)
        ctx.stroke()
      } else if (p.type === 'drop') {
        // 水滴:圆 + 高光
        ctx.beginPath()
        ctx.arc(0, 0, p.size, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = 'rgba(255,255,255,0.6)'
        ctx.beginPath()
        ctx.arc(-p.size * 0.3, -p.size * 0.3, p.size * 0.3, 0, Math.PI * 2)
        ctx.fill()
      } else if (p.type === 'bubble') {
        // 泡泡:空心圆 + 高光
        ctx.strokeStyle = p.color
        ctx.lineWidth = 1.5
        ctx.beginPath()
        ctx.arc(0, 0, p.size, 0, Math.PI * 2)
        ctx.stroke()
        ctx.fillStyle = 'rgba(255,255,255,0.4)'
        ctx.beginPath()
        ctx.arc(-p.size * 0.3, -p.size * 0.3, p.size * 0.25, 0, Math.PI * 2)
        ctx.fill()
      } else if (p.type === 'wind') {
        // 风线:细长矩形
        ctx.fillRect(-p.size * 1.5, -1, p.size * 3, 1.5)
      } else if (p.type === 'streak') {
        // 流水线条:细长椭圆,垂直方向
        ctx.fillStyle = p.color
        ctx.beginPath()
        ctx.ellipse(0, 0, p.size * 0.18, p.size * 0.9, 0, 0, Math.PI * 2)
        ctx.fill()
      } else if (p.type === 'curl') {
        // 卷毛:小波浪曲线
        ctx.strokeStyle = p.color
        ctx.lineWidth = 1.5
        ctx.beginPath()
        ctx.moveTo(-p.size, 0)
        ctx.quadraticCurveTo(-p.size * 0.5, -p.size * 0.6, 0, 0)
        ctx.quadraticCurveTo(p.size * 0.5, p.size * 0.6, p.size, 0)
        ctx.stroke()
      } else if (p.type === 'tuft') {
        // 毛团:小绒球(多个重叠的小圆)
        ctx.fillStyle = p.color
        for (let j = 0; j < 4; j++) {
          const tx = (Math.random() - 0.5) * p.size * 0.6
          const ty = (Math.random() - 0.5) * p.size * 0.6
          ctx.beginPath()
          ctx.arc(tx, ty, p.size * 0.4, 0, Math.PI * 2)
          ctx.fill()
        }
      } else if (p.type === 'hair') {
        // 毛发:细长曲线
        ctx.strokeStyle = p.color
        ctx.lineWidth = 1.2
        ctx.beginPath()
        ctx.moveTo(-p.size, 0)
        ctx.quadraticCurveTo(0, p.size * 0.5, p.size, 0)
        ctx.stroke()
      } else if (p.type === 'dust') {
        // 灰尘:小圆
        ctx.beginPath()
        ctx.arc(0, 0, p.size * 0.6, 0, Math.PI * 2)
        ctx.fill()
      } else if (p.type === 'sparkle') {
        // 闪光:四角星
        ctx.fillStyle = p.color
        ctx.beginPath()
        ctx.moveTo(0, -p.size)
        ctx.lineTo(p.size * 0.3, -p.size * 0.3)
        ctx.lineTo(p.size, 0)
        ctx.lineTo(p.size * 0.3, p.size * 0.3)
        ctx.lineTo(0, p.size)
        ctx.lineTo(-p.size * 0.3, p.size * 0.3)
        ctx.lineTo(-p.size, 0)
        ctx.lineTo(-p.size * 0.3, -p.size * 0.3)
        ctx.closePath()
        ctx.fill()
      }
      ctx.restore()
    }
  }

  _drawWetDroplets(droplets) {
    const ctx = this.ctx
    for (const d of droplets) {
      const ox = Math.cos(d.jitterAngle) * d.jitterAmp
      const oy = Math.sin(d.jitterAngle * 1.3) * d.jitterAmp
      const x = d.baseX + ox
      const y = d.baseY + oy
      // 主水滴
      ctx.fillStyle = d.color
      ctx.beginPath()
      ctx.arc(x, y, d.radius, 0, Math.PI * 2)
      ctx.fill()
      // 高光(模拟水面反光)
      ctx.fillStyle = 'rgba(255,255,255,0.4)'
      ctx.beginPath()
      ctx.arc(x - d.radius * 0.3, y - d.radius * 0.3, d.radius * 0.3, 0, Math.PI * 2)
      ctx.fill()
    }
  }
}
