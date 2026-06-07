import GameScene from './src/GameScene.js'
import { setupSystemShare } from './src/share.js'

setupSystemShare()

const info = wx.getSystemInfoSync()
const canvas = wx.createCanvas()
canvas.width = info.windowWidth
canvas.height = info.windowHeight

new GameScene(canvas)
