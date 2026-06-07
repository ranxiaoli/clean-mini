// src/UI.js
import TOOLS_META from '../data/tools.js'

const TOP_H = 56
const BOTTOM_H = 100
const BUTTON_H = 50
const TOOLS_PER_PAGE = 4
const ARROW_W = 40

export default class UI {
  constructor(ctx, width, height) {
    this.ctx = ctx
    this.width = width
    this.height = height
    this._toolRects = []
    this._winButtons = []
    this._toolPage = 0
    this._totalTools = 0
    this._leftArrowRect = null
    this._rightArrowRect = null
  }

  draw(state) {
    this._drawTop(state)
    this._drawToolbar(state)
    this._drawHints(state)
    if (state.touchPos) this._drawFollowingTool(state.touchPos)
    if (state.uiState.showWin) this._drawWin(state)
  }

  _drawTop(state) {
    const ctx = this.ctx
    const { levelIndex, totalLevels, overallProgress } = state
    ctx.fillStyle = 'rgba(0,0,0,0.55)'
    ctx.fillRect(0, 0, this.width, TOP_H)

    ctx.fillStyle = '#fff'
    ctx.font = 'bold 16px sans-serif'
    ctx.textAlign = 'left'
    ctx.fillText(`关卡 ${levelIndex + 1}/${totalLevels}`, 14, 24)

    const barX = 14, barW = this.width - 28, barY = 38, barH = 8
    ctx.fillStyle = 'rgba(255,255,255,0.2)'
    ctx.fillRect(barX, barY, barW, barH)
    ctx.fillStyle = overallProgress >= 0.99 ? '#4CAF50' : '#2196F3'
    ctx.fillRect(barX, barY, barW * Math.min(overallProgress, 1), barH)

    ctx.fillStyle = '#fff'
    ctx.font = '11px sans-serif'
    ctx.textAlign = 'right'
    ctx.fillText(`${Math.floor(overallProgress * 100)}%`, this.width - 14, 22)
  }

  _drawToolbar(state) {
    const ctx = this.ctx
    const usedTools = state.usedTools || []
    const required = state.requiredTool
    const selected = state.selectedTool

    const toolbarY = this.height - BOTTOM_H
    ctx.fillStyle = 'rgba(0,0,0,0.55)'
    ctx.fillRect(0, toolbarY, this.width, BOTTOM_H)

    if (usedTools.length === 0) {
      this._toolRects = []
      this._totalTools = 0
      this._leftArrowRect = null
      this._rightArrowRect = null
      return
    }

    this._totalTools = usedTools.length
    const totalPages = Math.ceil(usedTools.length / TOOLS_PER_PAGE)
    this._toolPage = Math.max(0, Math.min(this._toolPage, totalPages - 1))

    const start = this._toolPage * TOOLS_PER_PAGE
    const end = Math.min(start + TOOLS_PER_PAGE, usedTools.length)
    const pageTools = usedTools.slice(start, end)

    const needArrows = usedTools.length > TOOLS_PER_PAGE
    const toolW = 76, toolH = 76, gap = 18
    const contentW = needArrows ? this.width - ARROW_W * 2 - 20 : this.width
    const totalW = pageTools.length * toolW + (pageTools.length - 1) * gap
    const startX = (this.width - totalW) / 2
    const y = toolbarY + (BOTTOM_H - toolH) / 2

    this._toolRects = pageTools.map((id, i) => ({
      id,
      x: startX + i * (toolW + gap),
      y,
      w: toolW,
      h: toolH
    }))

    for (const r of this._toolRects) {
      const meta = TOOLS_META[r.id]
      const isSelected = selected === r.id

      ctx.fillStyle = isSelected ? meta.color : 'rgba(255,255,255,0.12)'
      this._roundRect(r.x, r.y, r.w, r.h, 12); ctx.fill()

      this._drawToolIcon(r.id, r.x + r.w / 2, r.y + r.h / 2 - 8)

      ctx.fillStyle = '#fff'
      ctx.font = '12px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(meta.name, r.x + r.w / 2, r.y + r.h - 8)
    }

    // 左右箭头(在工具栏上方,避免跟工具按钮重叠)
    if (needArrows) {
      const arrowY = toolbarY - 24
      const arrowH = 36
      const arrowW = 56

      this._leftArrowRect = { x: 16, y: arrowY - arrowH / 2, w: arrowW, h: arrowH }
      this._rightArrowRect = { x: this.width - arrowW - 16, y: arrowY - arrowH / 2, w: arrowW, h: arrowH }

      // 左箭头背景 + 三角
      if (this._toolPage > 0) {
        ctx.fillStyle = 'rgba(0,0,0,0.5)'
        this._roundRect(this._leftArrowRect.x, this._leftArrowRect.y, this._leftArrowRect.w, this._leftArrowRect.h, 18)
        ctx.fill()
        ctx.fillStyle = 'rgba(255,255,255,0.95)'
        const cx = this._leftArrowRect.x + arrowW / 2
        ctx.beginPath()
        ctx.moveTo(cx + 6, arrowY - 9)
        ctx.lineTo(cx - 6, arrowY)
        ctx.lineTo(cx + 6, arrowY + 9)
        ctx.fill()
      }

      // 右箭头背景 + 三角
      if (this._toolPage < totalPages - 1) {
        ctx.fillStyle = 'rgba(0,0,0,0.5)'
        this._roundRect(this._rightArrowRect.x, this._rightArrowRect.y, this._rightArrowRect.w, this._rightArrowRect.h, 18)
        ctx.fill()
        ctx.fillStyle = 'rgba(255,255,255,0.95)'
        const cx = this._rightArrowRect.x + arrowW / 2
        ctx.beginPath()
        ctx.moveTo(cx - 6, arrowY - 9)
        ctx.lineTo(cx + 6, arrowY)
        ctx.lineTo(cx - 6, arrowY + 9)
        ctx.fill()
      }
    } else {
      this._leftArrowRect = null
      this._rightArrowRect = null
    }
  }

  _drawHints(state) {
    const ctx = this.ctx
    const now = Date.now()
    const { wrongToolHintAt, stepAdvancedAt } = state.uiState

    if (wrongToolHintAt && now - wrongToolHintAt < 1500) {
      const a = 1 - (now - wrongToolHintAt) / 1500
      ctx.fillStyle = `rgba(220,40,40,${0.85 * a})`
      this._roundRect(this.width / 2 - 100, this.height / 2 - 30, 200, 60, 12)
      ctx.fill()
      ctx.fillStyle = `rgba(255,255,255,${a})`
      ctx.font = 'bold 16px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('换个工具试试', this.width / 2, this.height / 2 + 5)
    }

    if (stepAdvancedAt && now - stepAdvancedAt < 2500) {
      const a = now - stepAdvancedAt < 2000 ? 1 : 1 - (now - stepAdvancedAt - 2000) / 500
      ctx.fillStyle = `rgba(76,175,80,${0.8 * a})`
      this._roundRect(this.width / 2 - 100, this.height / 2 - 85, 200, 50, 12)
      ctx.fill()
      ctx.fillStyle = `rgba(255,255,255,${a})`
      ctx.font = 'bold 18px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('做得好!', this.width / 2, this.height / 2 - 55)
    }
  }

  _drawWin(state) {
    const ctx = this.ctx
    const isLast = state.uiState.isLastLevel

    ctx.fillStyle = 'rgba(0,0,0,0.5)'
    ctx.fillRect(0, 0, this.width, this.height)

    const cardW = 280, cardH = 200
    const cardX = (this.width - cardW) / 2
    const cardY = (this.height - cardH) / 2
    ctx.fillStyle = '#fff'
    this._roundRect(cardX, cardY, cardW, cardH, 16); ctx.fill()

    ctx.fillStyle = '#333'
    ctx.font = 'bold 24px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('清洁完成!', this.width / 2, cardY + 50)

    ctx.fillStyle = '#666'
    ctx.font = '14px sans-serif'
    ctx.fillText('焕然一新', this.width / 2, cardY + 78)

    const btnW = 110, btnH = BUTTON_H, btnGap = 16
    const totalW = btnW * 2 + btnGap
    const btnY = cardY + cardH - btnH - 20
    const leftX = (this.width - totalW) / 2

    const replay = { id: 'replay', x: leftX, y: btnY, w: btnW, h: btnH, label: '再玩一次', color: '#9e9e9e' }
    const nextOrShare = isLast
      ? { id: 'share', x: leftX + btnW + btnGap, y: btnY, w: btnW, h: btnH, label: '分享', color: '#FF9800' }
      : { id: 'next', x: leftX + btnW + btnGap, y: btnY, w: btnW, h: btnH, label: '下一关', color: '#2196F3' }

    this._winButtons = [replay, nextOrShare]

    for (const b of this._winButtons) {
      ctx.fillStyle = b.color
      this._roundRect(b.x, b.y, b.w, b.h, 10); ctx.fill()
      ctx.fillStyle = '#fff'
      ctx.font = '17px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(b.label, b.x + b.w / 2, b.y + b.h / 2 + 6)
    }
  }

  hitTool(x, y) {
    for (const r of this._toolRects) {
      if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) return r.id
    }
    return null
  }

  hitWinButton(x, y) {
    for (const b of this._winButtons) {
      if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) return b.id
    }
    return null
  }

  _drawToolIcon(toolId, cx, cy) {
    const ctx = this.ctx
    ctx.save()
    if (toolId === 'brush') {
      ctx.fillStyle = '#8b5a2b'; ctx.fillRect(cx - 18, cy - 4, 24, 8)
      ctx.fillStyle = '#e0c080'; ctx.fillRect(cx + 6, cy - 8, 14, 16)
      ctx.strokeStyle = '#a08050'; ctx.lineWidth = 1
      for (let i = 0; i < 5; i++) {
        ctx.beginPath(); ctx.moveTo(cx + 6, cy - 8 + i * 4); ctx.lineTo(cx + 20, cy - 8 + i * 4); ctx.stroke()
      }
    } else if (toolId === 'cloth') {
      ctx.fillStyle = '#66c2ff'; this._roundRect(cx - 14, cy - 10, 28, 20, 4); ctx.fill()
      ctx.strokeStyle = '#3388cc'; ctx.lineWidth = 1
      ctx.beginPath(); ctx.moveTo(cx - 10, cy - 6); ctx.lineTo(cx + 10, cy - 6)
      ctx.moveTo(cx - 10, cy + 2); ctx.lineTo(cx + 10, cy + 2); ctx.stroke()
    } else if (toolId === 'spray') {
      ctx.fillStyle = '#bbb'; ctx.fillRect(cx - 6, cy - 14, 12, 18)
      ctx.fillStyle = '#888'; ctx.fillRect(cx - 8, cy + 4, 16, 6)
      ctx.fillStyle = 'rgba(120,200,255,0.7)'
      for (let i = 0; i < 6; i++) {
        ctx.beginPath(); ctx.arc(cx + 12 + i * 2, cy - 10 + (i % 2) * 4, 2, 0, Math.PI * 2); ctx.fill()
      }
    } else if (toolId === 'sponge') {
      ctx.fillStyle = '#ffd84d'; this._roundRect(cx - 16, cy - 10, 32, 20, 6); ctx.fill()
      ctx.fillStyle = 'rgba(0,0,0,0.15)'
      for (let i = 0; i < 5; i++) {
        ctx.beginPath(); ctx.arc(cx - 12 + i * 6, cy + (i % 2) * 4 - 2, 2, 0, Math.PI * 2); ctx.fill()
      }
    } else if (toolId === 'polish') {
      ctx.fillStyle = '#fff'; this._roundRect(cx - 14, cy - 10, 28, 20, 4); ctx.fill()
      ctx.fillStyle = 'rgba(233,30,99,0.6)'
      ctx.beginPath(); ctx.arc(cx, cy, 5, 0, Math.PI * 2); ctx.fill()
    }
    ctx.restore()
  }

  _drawFollowingTool(touchPos) {
    const ctx = this.ctx
    const { toolId, x, y } = touchPos
    const meta = TOOLS_META[toolId]
    ctx.save()
    ctx.globalAlpha = 0.8
    ctx.fillStyle = meta.color
    ctx.beginPath()
    ctx.arc(x, y - 40, 28, 0, Math.PI * 2)
    ctx.fill()
    ctx.globalAlpha = 1
    this._drawToolIcon(toolId, x, y - 40)
    ctx.restore()
  }

  handleToolbarClick(x, y) {
    // 检查左右箭头
    if (this._leftArrowRect && this._hitTest(x, y, this._leftArrowRect)) {
      if (this._toolPage > 0) {
        this._toolPage--
        return { type: 'page_change' }
      }
    }
    if (this._rightArrowRect && this._hitTest(x, y, this._rightArrowRect)) {
      const totalPages = Math.ceil(this._totalTools / TOOLS_PER_PAGE)
      if (this._toolPage < totalPages - 1) {
        this._toolPage++
        return { type: 'page_change' }
      }
    }
    return null
  }

  _hitTest(x, y, rect) {
    return x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h
  }

  _roundRect(x, y, w, h, r) {
    const ctx = this.ctx
    ctx.beginPath()
    ctx.moveTo(x + r, y)
    ctx.lineTo(x + w - r, y); ctx.arcTo(x + w, y, x + w, y + r, r)
    ctx.lineTo(x + w, y + h - r); ctx.arcTo(x + w, y + h, x + w - r, y + h, r)
    ctx.lineTo(x + r, y + h); ctx.arcTo(x, y + h, x, y + h - r, r)
    ctx.lineTo(x, y + r); ctx.arcTo(x, y, x + r, y, r)
    ctx.closePath()
  }
}
