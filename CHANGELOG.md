# 清理大师小游戏 - 变更日志

## 2026-06-05

### 水壶改为覆盖式叠加水污,不切换状态

#### 新增 `effect: 'wet'` 步骤模式
- **改动**: step 配置新增 `effect` 字段,值为 `'wet'` 时表示覆盖式步骤
- **影响文件**: `src/LevelRunner.js`, `data/levels.js`
- **新增方法**:
  - `_addWetMark(x, y)` 在 foamCanvas 叠加蓝色半透明水污 `rgba(60,130,200,0.25-0.5)`,并用物体形状裁剪
  - `_getOverlayCoverage()` 计算 foamCanvas 不透明像素占物体形状的比例,作为覆盖式步骤的进度
- **修改方法**: `erase()` / `tick()` / `currentStepProgress` / `overallProgress` 都根据 `step.effect` 分支
- **效果**:
  - watering 划过羊身 → 蓝色水污覆盖 + 水滴粒子飘落 + state 不变
  - 进度 = 水污覆盖羊身的比例
  - 完成后步骤切换,foamCanvas 清空,state 保持 state1
- **配置示例**:
  ```js
  { name: '浇水湿润', tool: 'watering', passThreshold: 0.9,
    effect: 'wet',          // 覆盖式标记
    layer: { brushRadius: 50 } }  // 无需 image / nextObjectImage
  ```

#### 第一关步骤路径顺移
- **改动**: 第二步(浇水)不切换 state 后,后续步骤的 nextObjectImage 顺移
- **新状态序列**: state0 → state1(梳叶)→ state1(浇水不变)→ state2(刷洗)→ state3(梳毛)→ state4(吹干)→ state5(修剪)→ final(剃须)

### 状态命名改为从 state0 开始

#### state0 表示初始状态
- **改动**: 文件重命名 + levels.js 配置更新
  - `sheep_state1.png` → `sheep_state0.png` (初始)
  - `sheep_state2.png` → `sheep_state1.png` (step 1 完成后)
  - ...依次顺移
  - `sheep_state7.png` 删除,最后一步直接到 `sheep_final.png`
- **影响文件**: `data/levels.js`, `images/placeholder/level01/`
- **原因**: 命名更直观 — `stateN` 对应擦完 step N 后的状态,state0 = 初始最脏
- **新对应关系**:
  | 阶段 | 文件 |
  |---|---|
  | 初始 | sheep_state0.png |
  | step 1 完成 | sheep_state1.png |
  | step 2 完成 | sheep_state2.png |
  | ... | ... |
  | step 6 完成 | sheep_state6.png |
  | step 7 完成 | sheep_final.png |

### 水壶不产生白色泡沫

#### 区分喷雾/水壶的视觉效果
- **改动**: watering(水壶)在擦除时不再调用 `_addFoam`,只通过水滴粒子表现冲水效果
- **影响文件**: `src/LevelRunner.js` (`erase()` 方法的 foam 分支)
- **原因**: 用户反馈水壶冲水时不应该叠加白色泡沫层(泡沫是肥皂水的视觉,清水冲洗不该有)
- **效果对比**:
  - 之前: watering 擦除时产生白色泡沫(和 spray 共用 `_addFoam(x, y, 'spray')`)
  - 现在: watering 仅有蓝色水滴粒子飘落,无白色泡沫
- **保留行为**: watering 的 mode 仍为 'foam'(用于其他逻辑判定),但 erase 时跳过 `_addFoam`

---

## 2026-06-02

### 修复擦除时下一图未及时显示

#### 同步加载状态图,避免擦除空白
- **改动**:
  1. `_loadInitial` 同时加载 currentImg + nextImg,都加载完才触发 onReady
  2. `_advanceStep` 切换步骤时,异步加载下一图,等加载完才解除 `_frozen`
  3. 新增 `_loadNextImageAsync(src, onDone)` 支持回调
- **影响文件**: `src/LevelRunner.js`
- **原因**: 用户反馈"用梳子梳理时图片没变化,完成后才直接跳到 state2"
- **根因**: nextImg 是异步加载的,玩家开始擦时 nextImg 可能还没加载完,擦掉 currentImg 露出的是空白(背景)。要等步骤完成、currentImg 切换为 state2 才看到完整图。
- **效果**: 玩家梳子划过时,**立即露出 state2 的对应区域**,有连续的视觉反馈

### 初始状态从 state1 开始

#### objectImage 直接指向 state1
- **改动**: 第一关 objectImage 从 sheep.png 改为 sheep_state1.png,各步骤 nextObjectImage 顺移
- **影响文件**: `data/levels.js`, `images/placeholder/level01/`
- **目录调整**: 删除 sheep.png,新增 sheep_state7.png(state6 复制占位)
- **新状态序列**: state1 → state2 → state3 → state4 → state5 → state6 → state7 → final (7 步切换)
- **原因**: 用户认为 objectImage 字段就表示初始状态,不需要单独有 state1 文件,直接用 state1 作为初始更清晰

### 状态图按 contain 适配,不拉伸

#### 修复状态图拉伸问题
- **改动**: 物体图(currentImg/nextImg)绘制改为 contain 模式,按自身宽高比居中,不拉伸
- **影响文件**: `src/LevelRunner.js`, `src/GameScene.js`
- **原因**: 用户反馈 state1 和 state2 图片没重叠,感觉被拉伸
- **新增方法**: `LevelRunner._getImageRect(img)` / `LevelRunner.getImageRect(img)`
- **修改方法**: `_redrawObjectCanvas()`, `_recalcMaxObjectPixels()`, `GameScene._draw()`
- **逻辑**:
  ```js
  // 按图片自身宽高比 contain 适配 shoeRect 区域
  const imgRatio = img.width / img.height
  const areaRatio = area.w / area.h
  if (imgRatio > areaRatio) { w = area.w; h = area.w / imgRatio }
  else { h = area.h; w = area.h * imgRatio }
  // 居中放置,不拉伸
  ```
- **美术建议**: 所有状态图保持相同尺寸(如 800×800 透明 PNG),物体位置一致,可完美重叠

### 第一关第一步改为梳理叶子渣渣

#### 第一步从浇水改为梳理
- **改动**: 第一关第一步 `watering` → `comb`，名称"浇水湿润"→"梳理叶子渣渣"
- **影响文件**: `data/levels.js`
- **原因**: 用户希望开局先用梳子梳理掉羊身上的叶子渣渣
- **效果**:
  - 梳子划过的地方擦掉 `sheep.png`，露出 `sheep_state1.png` 局部
  - 每次划过生成 4 个绿色叶子粒子（带重力飘落）
  - comb 是 `clean` 模式，无白色泡沫
- **新顺序**: 梳理叶子 → 浇水 → 刷洗 → 梳理毛发 → 吹干 → 修剪 → 剃须

### 步骤切换清空泡沫层

#### 步骤切换时清空泡沫和粒子
- **改动**: 步骤切换时清空 foamCanvas 和 _particles 数组
- **影响文件**: `src/LevelRunner.js` (`_advanceStep()` 方法)
- **原因**: 用户反馈用梳子梳理时，画面还残留之前喷雾/刷子产生的白色泡沫
- **修复**:
  ```js
  // 在 _advanceStep 的 setTimeout 回调中添加
  if (this._foamCtx) {
    this._foamCtx.clearRect(0, 0, this._foamCanvas.width, this._foamCanvas.height)
  }
  this._particles = []
  ```
- **效果**: 进入新步骤时画面干净，只显示新步骤工具产生的视觉效果

---

## 2026-06-01

### 交互优化

#### 工具选择模式
- **改动**: 点击工具按钮后保持选中状态,可以持续擦除,松手后工具仍然选中
- **影响文件**: `src/GameScene.js`
- **原因**: 避免每次擦除都要重新选择工具

#### 步骤完成提示延长
- **改动**: "做得好"提示从 1.2 秒延长到 2.5 秒,步骤切换增加 1.5 秒冻结期
- **影响文件**: `src/UI.js`, `src/LevelRunner.js`
- **原因**: 提示太快,玩家没来得及反应就进入下一步

#### 移除工具推荐提示
- **改动**: 去掉工具栏金色脉冲描边提示和红色"工具不对"toast
- **影响文件**: `src/UI.js`
- **原因**: 让玩家自己判断该用哪个工具,增加探索性

#### 选错工具提示优化
- **改动**: 恢复错误提示,但改为通用的"换个工具试试",不透露具体工具名
- **影响文件**: `src/UI.js`
- **原因**: 给予反馈但不直接告知答案

#### 擦拭时工具跟随手指
- **改动**: 擦拭时工具图标跟随触点移动(偏移手指上方 40px)
- **影响文件**: `src/GameScene.js`, `src/UI.js`
- **新增**: `_touchPos` 状态, `_drawFollowingTool()` 方法
- **原因**: 视觉反馈,让玩家知道当前使用的工具

---

### 污垢系统

#### 支持图片污垢
- **改动**: 污垢层支持使用图片代替程序生成噪点
- **影响文件**: `src/DirtLayer.js`
- **新增字段**: `layer.image`, `layer.imageMode` ('cover' / 'tile')
- **配置示例**:
  ```js
  layer: {
    image: 'images/dirt/mud.png',
    imageMode: 'cover',
    baseAlpha: 0.85,
    brushRadius: 50
  }
  ```
- **工具**: `tools/dirt-generator.html` (浏览器版污垢生成器,生成 6 种污垢 PNG)

#### 全部 20 关配置图片污垢
- **改动**: 所有关卡的所有步骤都改用图片污垢,每步不同污垢类型
- **影响文件**: `data/levels.js`
- **污垢类型**: mud / dust / oil / rust / water / soap (6 种)
- **分配策略**: 
  - 重污染期(前期步骤): mud / oil / dust
  - 中度清洁(中间步骤): soap / rust / dust
  - 轻度收尾(后期步骤): water / dust / soap

---

### 工具行为差异化

#### 喷雾散射效果
- **改动**: spray 工具从圆形擦除改为散射小泡沫点
- **影响文件**: `src/DirtLayer.js` (新增 `spray()` 方法), `src/LevelRunner.js`
- **效果**: 触点周围随机散射 8-14 个小圆点,模拟喷雾

#### 刷子泡沫扩散
- **改动**: brush 工具笔刷从小到大递增,模拟泡沫被刷开
- **影响文件**: `src/LevelRunner.js`
- **新增状态**: `_brushGrowth` (刷子增长系数)
- **效果**: 初始半径 50%,持续刷动增长到 150%

#### 泡沫层系统
- **改动**: 新增独立的泡沫层,spray/brush 产生泡沫,cloth/sponge/polish 擦掉泡沫
- **影响文件**: `src/LevelRunner.js`, `src/GameScene.js`
- **新增**: `_foamCanvas` (泡沫层), `_addFoam()`, `_clearFoam()`, `_clipFoamToShape()` 方法
- **渲染层次**: 底图 → 物品 → 污垢层 → 泡沫层
- **跨步骤保留**: 泡沫层在步骤切换时不清空

#### 工具模式配置化
- **改动**: 在 `data/tools.js` 中为每个工具添加 `mode` 字段
- **影响文件**: `data/tools.js`, `src/LevelRunner.js`
- **模式类型**:
  - `mode: 'foam'` — 产生泡沫(spray / brush)
  - `mode: 'clean'` — 清洁污垢和泡沫(cloth / sponge / polish)

---

### 关卡污垢叠加机制

#### 初始化时叠加所有步骤污垢
- **改动**: 关卡开始时一次性叠加所有步骤的污垢层,玩家逐步清理
- **影响文件**: `src/DirtLayer.js` (新增 `addStep()` 和 `_overlayNewDirt()` 方法), `src/LevelRunner.js`
- **原理**: 
  - 第一步创建 DirtLayer 并叠加后续所有步骤的污垢
  - 步骤切换时不重建 layer,只更新工具要求
  - 已擦干净的区域保持干净(用 `source-atop` 模式叠加新污垢)

#### foam 工具不擦污垢
- **改动**: `mode: 'foam'` 的工具只产生泡沫,不擦除污垢
- **影响文件**: `src/LevelRunner.js`
- **原因**: 配合污垢叠加机制,foam 步骤用于"软化"(视觉上盖泡沫),clean 步骤才真正擦除

#### foam 步骤进度判定
- **改动**: foam 步骤用泡沫覆盖率判定进度,clean 步骤用污垢清除率
- **影响文件**: `src/LevelRunner.js`
- **新增方法**: `_getFoamCoverage()` (统计泡沫层不透明像素占比,500ms 节流采样)
- **修改**: `currentStepProgress` 和 `tick()` 根据工具 mode 选择判定方式

---

### 清洁区域配置

#### 限定清洁区域
- **改动**: 清洁区域改为屏幕宽 80%、高 60%,居中显示
- **影响文件**: `src/GameScene.js` (`_shoeRect()` 方法)
- **原因**: 避免物体占满全屏,留出边距

#### 触点边界检查
- **改动**: 触点必须在物体矩形区域内才响应擦除
- **影响文件**: `src/LevelRunner.js` (`erase()` 方法入口检查)

#### 泡沫层形状裁剪
- **改动**: 泡沫层用物体 mask 裁剪,泡沫只显示在物体形状内
- **影响文件**: `src/LevelRunner.js` (`_clipFoamToShape()` 方法)
- **原理**: 每次 `_addFoam()` 后用 `destination-in` 套物体 mask

#### 宽高比可配置
- **改动**: 每关可配置 `aspectRatio` 字段,控制清洁区域宽高比
- **影响文件**: `src/GameScene.js` (`_computeShoeRect()` 方法)
- **配置示例**:
  ```js
  {
    id: 1,
    aspectRatio: 1.2,  // 宽/高比,不填则用图片原始比例
    objectImage: 'images/placeholder/shoe.png',
    ...
  }
  ```

#### 背景图支持
- **改动**: 每关可配置 `bgImage` 作为清洁区域底图,支持纯色或图片
- **影响文件**: `src/LevelRunner.js`, `src/GameScene.js`
- **配置示例**:
  ```js
  // 纯色背景
  bgImage: '#f5f5f5'
  
  // 图片背景
  bgImage: 'images/bg/table.png'
  ```
- **渲染层次**: bgImage → objectImage → dirtCanvas → foamCanvas

---

## 配置文件结构总结

### `data/tools.js`
```js
export default {
  spray:  { name: '喷雾',   color: '#4FC3F7', mode: 'foam' },
  brush:  { name: '刷子',   color: '#FF9800', mode: 'foam' },
  cloth:  { name: '抹布',   color: '#8BC34A', mode: 'clean' },
  sponge: { name: '海绵',   color: '#FFEB3B', mode: 'clean' },
  polish: { name: '抛光布', color: '#E91E63', mode: 'clean' }
}
```

### `data/levels.js`
```js
{
  id: 1,
  name: '运动鞋',
  category: 'shoe',
  aspectRatio: 1.2,                    // 可选,清洁区域宽高比
  bgImage: '#f5f5f5',                  // 可选,背景(纯色或图片)
  objectImage: 'images/placeholder/shoe.png',  // 物品干净状态
  steps: [
    {
      name: '预洗',
      tool: 'spray',
      passThreshold: 0.85,
      layer: {
        image: 'images/dirt/mud.png',  // 污垢图片
        imageMode: 'cover',            // 'cover' 或 'tile'
        baseAlpha: 0.85,               // 透明度
        brushRadius: 50                // 笔刷半径
      }
    }
  ]
}
```

---

## 待办事项

- [ ] 真机自测(Task 14)
- [ ] 云开发环境 ID 填入 `src/GameScene.js:11`
- [ ] 用 `tools/dirt-generator.html` 生成真实污垢图,替换 `images/dirt/` 占位图
- [ ] 为每关配置合适的 `bgImage` 和 `aspectRatio`
