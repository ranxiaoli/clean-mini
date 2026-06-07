export default [
  {
    id: 1,
    name: '宠物美容',
    category: 'pet',
    bgImage: 'images/bg/bg1.png',
    objectImage: 'images/placeholder/level01/sheep_state0.png',
    steps: [
      // step1: 梳叶 — 梳子擦除 state0,露出 state1,绿叶+黄叶+棕毛碎片飘落
      {
        name: '梳理叶子渣渣', tool: 'comb', passThreshold: 0.9,
        nextObjectImage: 'images/placeholder/level01/sheep_state1.png',
        layer: { brushRadius: 25 }
      },
      // step2: 花洒湿润 — 流水冲洗覆盖 80%, 完成后保留若隐若现的水污, state 不变
      {
        name: '花洒湿润', tool: 'shower', passThreshold: 0.8,
        effect: 'overlay',
        layer: {
          brushRadius: 55,
          overlayColor: 'rgba(120, 160, 200, 0.25)'
        }
      },
      // step3: 喷雾 — 土色喷剂覆盖到羊身上,80% 算完成,state 仍是 state1
      {
        name: '喷清洁剂', tool: 'spray', passThreshold: 0.8,
        effect: 'overlay',
        layer: {
          brushRadius: 55,
          overlayColor: 'rgba(160, 130, 80, 0.6)'
        }
      },
      // step4: 刷子 — 刷出白色泡泡覆盖 80%,state 仍是 state1
      // step4: 刷子 — 刷出白色泡泡,覆盖 80%,state 仍是 state1
      {
        name: '刷出泡泡', tool: 'brush', passThreshold: 0.8,
        effect: 'overlay',
        layer: {
          brushRadius: 48,
          overlayColor: 'rgba(255, 255, 255, 0.85)'
        }
      },
      // step5: 再次花洒冲洗 — 冲掉泡泡,露出 state2 (rinse:同时擦 foam 和 object)
      {
        name: '冲洗泡泡', tool: 'shower', passThreshold: 0.9,
        effect: 'rinse',
        nextObjectImage: 'images/placeholder/level01/sheep_state2.png',
        layer: { brushRadius: 55 }
      },
      // step6: 吹风机 — 每吹一处露出 state3,白色卷毛+风线飘落
      {
        name: '吹干毛发', tool: 'dryer', passThreshold: 0.9,
        nextObjectImage: 'images/placeholder/level01/sheep_state3.png',
        layer: { brushRadius: 45 }
      },
      // step7: 剪刀 — 每剪一处露出 state4,白色羊毛一撮飘落
      {
        name: '修剪羊毛', tool: 'scissors', passThreshold: 0.9,
        nextObjectImage: 'images/placeholder/level01/sheep_state4.png',
        layer: { brushRadius: 40 }
      },
      // step8: 剃须刀 — 每剔一处露出 state5,一坨坨羊毛飘落
      {
        name: '剃除羊毛', tool: 'trimmer', passThreshold: 0.9,
        nextObjectImage: 'images/placeholder/level01/sheep_state5.png',
        layer: { brushRadius: 38 }
      },
      // step9: 拍打翻面 — 拍两边屁股 4 下,state5 → state6
      {
        name: '拍打翻面', tool: 'clap', passThreshold: 0.9,
        effect: 'flip',
        nextObjectImage: 'images/placeholder/level01/sheep_state6.png',
        layer: { brushRadius: 50, clapTarget: 4 }
      }
    ]
  },
  {
    id: 2,
    name: '白衬衫',
    category: 'cloth',
    bgImage: '#f5f5f5',
    objectImage: 'images/placeholder/level02/shirt.png',
    steps: [
      { name: '喷洗剂', tool: 'spray', passThreshold: 0.9,
        layer: { image: 'images/dirt/oil.png', imageMode: 'cover', baseAlpha: 0.75, brushRadius: 55 } },
      { name: '海绵搓', tool: 'sponge', passThreshold: 0.9,
        layer: { image: 'images/dirt/soap.png', imageMode: 'cover', baseAlpha: 0.6, brushRadius: 40 } },
      { name: '清水冲', tool: 'spray', passThreshold: 0.9,
        layer: { image: 'images/dirt/water.png', imageMode: 'cover', baseAlpha: 0.45, brushRadius: 50 } },
      { name: '擦干', tool: 'cloth', passThreshold: 0.9,
        layer: { image: 'images/dirt/dust.png', imageMode: 'cover', baseAlpha: 0.3, brushRadius: 30 } }
    ]
  },
  {
    id: 3,
    name: '汽车前盖',
    category: 'car',
    bgImage: '#3a4a5c',
    objectImage: 'images/placeholder/level03/car.png',
    steps: [
      { name: '喷泡沫', tool: 'spray', passThreshold: 0.9,
        layer: { image: 'images/dirt/dust.png', imageMode: 'cover', baseAlpha: 0.75, brushRadius: 60 } },
      { name: '海绵刷', tool: 'sponge', passThreshold: 0.9,
        layer: { image: 'images/dirt/mud.png', imageMode: 'cover', baseAlpha: 0.7, brushRadius: 45 } },
      { name: '抛光', tool: 'polish', passThreshold: 0.9,
        layer: { image: 'images/dirt/soap.png', imageMode: 'cover', baseAlpha: 0.4, brushRadius: 30 } }
    ]
  },
  {
    id: 4,
    name: '木地板',
    category: 'floor',
    bgImage: '#a87c50',
    objectImage: 'images/placeholder/level04/floor.png',
    steps: [
      { name: '喷清洁剂', tool: 'spray', passThreshold: 0.9,
        layer: { image: 'images/dirt/dust.png', imageMode: 'cover', baseAlpha: 0.7, brushRadius: 55 } },
      { name: '海绵擦', tool: 'sponge', passThreshold: 0.9,
        layer: { image: 'images/dirt/mud.png', imageMode: 'cover', baseAlpha: 0.65, brushRadius: 45 } },
      { name: '抹布擦干', tool: 'cloth', passThreshold: 0.9,
        layer: { image: 'images/dirt/water.png', imageMode: 'cover', baseAlpha: 0.4, brushRadius: 30 } }
    ]
  },
  {
    id: 5,
    name: '餐盘',
    category: 'dish',
    bgImage: '#d4c4a8',
    objectImage: 'images/placeholder/level05/dish.png',
    steps: [
      { name: '喷洗洁精', tool: 'spray', passThreshold: 0.9,
        layer: { image: 'images/dirt/oil.png', imageMode: 'cover', baseAlpha: 0.7, brushRadius: 50 } },
      { name: '海绵刷', tool: 'sponge', passThreshold: 0.9,
        layer: { image: 'images/dirt/soap.png', imageMode: 'cover', baseAlpha: 0.65, brushRadius: 38 } },
      { name: '清水冲', tool: 'spray', passThreshold: 0.9,
        layer: { image: 'images/dirt/water.png', imageMode: 'cover', baseAlpha: 0.4, brushRadius: 35 } }
    ]
  },
  {
    id: 6,
    name: '牙齿',
    category: 'teeth',
    bgImage: '#ffc4d4',
    objectImage: 'images/placeholder/level06/teeth.png',
    steps: [
      { name: '漱口', tool: 'spray', passThreshold: 0.9,
        layer: { image: 'images/dirt/water.png', imageMode: 'cover', baseAlpha: 0.6, brushRadius: 45 } },
      { name: '刷牙', tool: 'brush', passThreshold: 0.9,
        layer: { image: 'images/dirt/dust.png', imageMode: 'cover', baseAlpha: 0.7, brushRadius: 30 } },
      { name: '抛光', tool: 'polish', passThreshold: 0.9,
        layer: { image: 'images/dirt/soap.png', imageMode: 'cover', baseAlpha: 0.4, brushRadius: 25 } }
    ]
  },
  {
    id: 7,
    name: '浴室瓷砖',
    category: 'tile',
    bgImage: '#a8c8d8',
    objectImage: 'images/placeholder/level07/tile.png',
    steps: [
      { name: '喷清洁剂', tool: 'spray', passThreshold: 0.9,
        layer: { image: 'images/dirt/water.png', imageMode: 'cover', baseAlpha: 0.65, brushRadius: 55 } },
      { name: '刷洗', tool: 'brush', passThreshold: 0.9,
        layer: { image: 'images/dirt/soap.png', imageMode: 'cover', baseAlpha: 0.7, brushRadius: 42 } },
      { name: '海绵擦', tool: 'sponge', passThreshold: 0.9,
        layer: { image: 'images/dirt/rust.png', imageMode: 'cover', baseAlpha: 0.55, brushRadius: 38 } },
      { name: '擦干', tool: 'cloth', passThreshold: 0.9,
        layer: { image: 'images/dirt/dust.png', imageMode: 'cover', baseAlpha: 0.35, brushRadius: 28 } }
    ]
  },
  {
    id: 8,
    name: '皮鞋',
    category: 'shoe',
    bgImage: '#d8c8b8',
    objectImage: 'images/placeholder/level08/leather_shoe.png',
    steps: [
      { name: '除尘', tool: 'brush', passThreshold: 0.9,
        layer: { image: 'images/dirt/dust.png', imageMode: 'cover', baseAlpha: 0.6, brushRadius: 50 } },
      { name: '上鞋油', tool: 'spray', passThreshold: 0.9,
        layer: { image: 'images/dirt/oil.png', imageMode: 'cover', baseAlpha: 0.65, brushRadius: 45 } },
      { name: '擦匀', tool: 'cloth', passThreshold: 0.9,
        layer: { image: 'images/dirt/mud.png', imageMode: 'cover', baseAlpha: 0.55, brushRadius: 35 } },
      { name: '抛光', tool: 'polish', passThreshold: 0.9,
        layer: { image: 'images/dirt/soap.png', imageMode: 'cover', baseAlpha: 0.4, brushRadius: 30 } }
    ]
  },
  {
    id: 9,
    name: '帆布鞋',
    category: 'shoe',
    bgImage: '#e8d8c0',
    objectImage: 'images/placeholder/level09/canvas_shoe.png',
    steps: [
      { name: '喷预洗剂', tool: 'spray', passThreshold: 0.9,
        layer: { image: 'images/dirt/mud.png', imageMode: 'cover', baseAlpha: 0.75, brushRadius: 55 } },
      { name: '刷洗', tool: 'brush', passThreshold: 0.9,
        layer: { image: 'images/dirt/dust.png', imageMode: 'cover', baseAlpha: 0.65, brushRadius: 42 } },
      { name: '擦干', tool: 'cloth', passThreshold: 0.9,
        layer: { image: 'images/dirt/water.png', imageMode: 'cover', baseAlpha: 0.4, brushRadius: 32 } }
    ]
  },
  {
    id: 10,
    name: '玻璃窗',
    category: 'glass',
    bgImage: '#c8d8e8',
    objectImage: 'images/placeholder/level10/glass.png',
    steps: [
      { name: '喷清洁剂', tool: 'spray', passThreshold: 0.9,
        layer: { image: 'images/dirt/dust.png', imageMode: 'cover', baseAlpha: 0.55, brushRadius: 55 } },
      { name: '海绵擦', tool: 'sponge', passThreshold: 0.9,
        layer: { image: 'images/dirt/water.png', imageMode: 'cover', baseAlpha: 0.5, brushRadius: 45 } },
      { name: '擦干', tool: 'cloth', passThreshold: 0.9,
        layer: { image: 'images/dirt/soap.png', imageMode: 'cover', baseAlpha: 0.35, brushRadius: 32 } }
    ]
  },
  {
    id: 11,
    name: '锅具',
    category: 'dish',
    bgImage: '#5a4838',
    objectImage: 'images/placeholder/level11/pot.png',
    steps: [
      { name: '泡水', tool: 'spray', passThreshold: 0.9,
        layer: { image: 'images/dirt/oil.png', imageMode: 'cover', baseAlpha: 0.85, brushRadius: 55 } },
      { name: '刷洗', tool: 'brush', passThreshold: 0.9,
        layer: { image: 'images/dirt/rust.png', imageMode: 'cover', baseAlpha: 0.75, brushRadius: 45 } },
      { name: '海绵擦', tool: 'sponge', passThreshold: 0.9,
        layer: { image: 'images/dirt/soap.png', imageMode: 'cover', baseAlpha: 0.55, brushRadius: 38 } },
      { name: '擦干', tool: 'cloth', passThreshold: 0.9,
        layer: { image: 'images/dirt/water.png', imageMode: 'cover', baseAlpha: 0.4, brushRadius: 30 } }
    ]
  },
  {
    id: 12,
    name: '毛绒玩具',
    category: 'plush',
    bgImage: '#fde0e8',
    objectImage: 'images/placeholder/level12/plush.png',
    steps: [
      { name: '喷除菌液', tool: 'spray', passThreshold: 0.9,
        layer: { image: 'images/dirt/dust.png', imageMode: 'cover', baseAlpha: 0.6, brushRadius: 55 } },
      { name: '梳理', tool: 'brush', passThreshold: 0.9,
        layer: { image: 'images/dirt/soap.png', imageMode: 'cover', baseAlpha: 0.6, brushRadius: 42 } },
      { name: '擦净', tool: 'cloth', passThreshold: 0.9,
        layer: { image: 'images/dirt/water.png', imageMode: 'cover', baseAlpha: 0.4, brushRadius: 32 } }
    ]
  },
  {
    id: 13,
    name: '牛仔裤',
    category: 'cloth',
    bgImage: '#e0d8d0',
    objectImage: 'images/placeholder/level13/jeans.png',
    steps: [
      { name: '喷预洗', tool: 'spray', passThreshold: 0.9,
        layer: { image: 'images/dirt/mud.png', imageMode: 'cover', baseAlpha: 0.7, brushRadius: 55 } },
      { name: '海绵搓', tool: 'sponge', passThreshold: 0.9,
        layer: { image: 'images/dirt/dust.png', imageMode: 'cover', baseAlpha: 0.7, brushRadius: 42 } },
      { name: '清水冲', tool: 'spray', passThreshold: 0.9,
        layer: { image: 'images/dirt/water.png', imageMode: 'cover', baseAlpha: 0.5, brushRadius: 45 } },
      { name: '擦干', tool: 'cloth', passThreshold: 0.9,
        layer: { image: 'images/dirt/soap.png', imageMode: 'cover', baseAlpha: 0.35, brushRadius: 32 } }
    ]
  },
  {
    id: 14,
    name: '头发',
    category: 'hair',
    bgImage: '#f8e8d8',
    objectImage: 'images/placeholder/level14/hair.png',
    steps: [
      { name: '喷护理素', tool: 'spray', passThreshold: 0.9,
        layer: { image: 'images/dirt/dust.png', imageMode: 'cover', baseAlpha: 0.6, brushRadius: 50 } },
      { name: '梳理', tool: 'brush', passThreshold: 0.9,
        layer: { image: 'images/dirt/soap.png', imageMode: 'cover', baseAlpha: 0.65, brushRadius: 42 } },
      { name: '抛光', tool: 'polish', passThreshold: 0.9,
        layer: { image: 'images/dirt/water.png', imageMode: 'cover', baseAlpha: 0.4, brushRadius: 30 } }
    ]
  },
  {
    id: 15,
    name: '自行车',
    category: 'car',
    bgImage: '#88a878',
    objectImage: 'images/placeholder/level15/bike.png',
    steps: [
      { name: '喷清洁剂', tool: 'spray', passThreshold: 0.9,
        layer: { image: 'images/dirt/dust.png', imageMode: 'cover', baseAlpha: 0.65, brushRadius: 55 } },
      { name: '刷洗', tool: 'brush', passThreshold: 0.9,
        layer: { image: 'images/dirt/mud.png', imageMode: 'cover', baseAlpha: 0.75, brushRadius: 42 } },
      { name: '海绵擦', tool: 'sponge', passThreshold: 0.9,
        layer: { image: 'images/dirt/rust.png', imageMode: 'cover', baseAlpha: 0.55, brushRadius: 38 } },
      { name: '抛光', tool: 'polish', passThreshold: 0.9,
        layer: { image: 'images/dirt/soap.png', imageMode: 'cover', baseAlpha: 0.4, brushRadius: 30 } }
    ]
  },
  {
    id: 16,
    name: '油烟机',
    category: 'kitchen',
    bgImage: '#2a2018',
    objectImage: 'images/placeholder/level16/hood.png',
    steps: [
      { name: '喷除油剂', tool: 'spray', passThreshold: 0.9,
        layer: { image: 'images/dirt/oil.png', imageMode: 'cover', baseAlpha: 0.9, brushRadius: 55 } },
      { name: '刷洗', tool: 'brush', passThreshold: 0.9,
        layer: { image: 'images/dirt/oil.png', imageMode: 'tile', baseAlpha: 0.75, brushRadius: 45 } },
      { name: '海绵擦', tool: 'sponge', passThreshold: 0.9,
        layer: { image: 'images/dirt/soap.png', imageMode: 'cover', baseAlpha: 0.6, brushRadius: 38 } },
      { name: '擦净', tool: 'cloth', passThreshold: 0.9,
        layer: { image: 'images/dirt/water.png', imageMode: 'cover', baseAlpha: 0.45, brushRadius: 32 } },
      { name: '抛光', tool: 'polish', passThreshold: 0.9,
        layer: { image: 'images/dirt/dust.png', imageMode: 'cover', baseAlpha: 0.3, brushRadius: 28 } }
    ]
  },
  {
    id: 17,
    name: '沙发',
    category: 'furniture',
    bgImage: '#8a6a5a',
    objectImage: 'images/placeholder/level17/sofa.png',
    steps: [
      { name: '吸尘', tool: 'brush', passThreshold: 0.9,
        layer: { image: 'images/dirt/dust.png', imageMode: 'cover', baseAlpha: 0.6, brushRadius: 55 } },
      { name: '喷除菌', tool: 'spray', passThreshold: 0.9,
        layer: { image: 'images/dirt/mud.png', imageMode: 'cover', baseAlpha: 0.55, brushRadius: 50 } },
      { name: '海绵搓', tool: 'sponge', passThreshold: 0.9,
        layer: { image: 'images/dirt/soap.png', imageMode: 'cover', baseAlpha: 0.55, brushRadius: 42 } },
      { name: '擦干', tool: 'cloth', passThreshold: 0.9,
        layer: { image: 'images/dirt/water.png', imageMode: 'cover', baseAlpha: 0.4, brushRadius: 32 } }
    ]
  },
  {
    id: 18,
    name: '屏幕',
    category: 'screen',
    bgImage: '#1a1a1a',
    objectImage: 'images/placeholder/level18/screen.png',
    steps: [
      { name: '喷屏幕清洁剂', tool: 'spray', passThreshold: 0.9,
        layer: { image: 'images/dirt/dust.png', imageMode: 'cover', baseAlpha: 0.5, brushRadius: 50 } },
      { name: '擦拭', tool: 'cloth', passThreshold: 0.9,
        layer: { image: 'images/dirt/soap.png', imageMode: 'cover', baseAlpha: 0.45, brushRadius: 40 } },
      { name: '抛光', tool: 'polish', passThreshold: 0.9,
        layer: { image: 'images/dirt/water.png', imageMode: 'cover', baseAlpha: 0.3, brushRadius: 30 } }
    ]
  },
  {
    id: 19,
    name: '地毯',
    category: 'floor',
    bgImage: '#7a5840',
    objectImage: 'images/placeholder/level19/carpet.png',
    steps: [
      { name: '吸尘', tool: 'brush', passThreshold: 0.9,
        layer: { image: 'images/dirt/dust.png', imageMode: 'cover', baseAlpha: 0.7, brushRadius: 55 } },
      { name: '喷除菌', tool: 'spray', passThreshold: 0.9,
        layer: { image: 'images/dirt/mud.png', imageMode: 'cover', baseAlpha: 0.65, brushRadius: 50 } },
      { name: '海绵搓', tool: 'sponge', passThreshold: 0.9,
        layer: { image: 'images/dirt/soap.png', imageMode: 'cover', baseAlpha: 0.55, brushRadius: 42 } },
      { name: '擦干', tool: 'cloth', passThreshold: 0.9,
        layer: { image: 'images/dirt/water.png', imageMode: 'cover', baseAlpha: 0.4, brushRadius: 32 } }
    ]
  },
  {
    id: 20,
    name: '浴缸',
    category: 'tile',
    bgImage: '#b8d8e8',
    objectImage: 'images/placeholder/level20/bathtub.png',
    steps: [
      { name: '喷除垢剂', tool: 'spray', passThreshold: 0.9,
        layer: { image: 'images/dirt/water.png', imageMode: 'cover', baseAlpha: 0.65, brushRadius: 55 } },
      { name: '刷洗', tool: 'brush', passThreshold: 0.9,
        layer: { image: 'images/dirt/soap.png', imageMode: 'cover', baseAlpha: 0.7, brushRadius: 45 } },
      { name: '海绵擦', tool: 'sponge', passThreshold: 0.9,
        layer: { image: 'images/dirt/rust.png', imageMode: 'cover', baseAlpha: 0.55, brushRadius: 38 } },
      { name: '擦干', tool: 'cloth', passThreshold: 0.9,
        layer: { image: 'images/dirt/dust.png', imageMode: 'cover', baseAlpha: 0.4, brushRadius: 32 } },
      { name: '抛光', tool: 'polish', passThreshold: 0.9,
        layer: { image: 'images/dirt/soap.png', imageMode: 'cover', baseAlpha: 0.3, brushRadius: 28 } }
    ]
  }
]
