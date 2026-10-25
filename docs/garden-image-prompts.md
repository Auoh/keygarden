# 键息花园 · 右下角生长贴图提示词（完整版）

这份文档只解决一件事：把 A 模式右下角生态瓶的 **5 个生长阶段**生成出来，并放进项目。

## 1. 运行时到底需要哪些图

当前生长效果是“整幅生态瓶照片”的交叉淡化，不是单独的小植物贴图。因此完整一套只需要：

| 主题 | 文件 | 用途 |
|---|---|---|
| 浅色 | `light/stage-0.jpg` | 刚种下，最稀疏 |
| 浅色 | `light/stage-1.jpg` | 发芽 |
| 浅色 | `light/stage-2.jpg` | 长起来 |
| 浅色 | `light/stage-3.jpg` | 茂盛 |
| 浅色 | `light/stage-4.jpg` | 完全长成 |
| 深色 | `dark/stage-0.jpg` … `dark/stage-4.jpg` | 同一套阶段，深色版 |

**最小可用：只做浅色或深色其中一套的 5 张。** 两套都有时 app 默认用浅色。

不需要生成的：

- 单独的蕨/菌/花/苔透明贴图：当前渲染器不用
- 雨、雾、萤火虫、孢子：Canvas 实时绘制
- 玻璃瓶、边框、文字、按钮：界面层自己画
- 动态视频/序列帧：只做 5 张静态照片

## 2. 规格

| 项目 | 要求 |
|---|---|
| 画幅 | **2:3 竖图**，例如 `1024×1536`、`1536×2304` |
| 格式 | JPG 质量 90+，或 PNG |
| 背景 | 不需要透明；整幅照片 |
| 机位 | 平视，略高于瓶口，整个玻璃瓶完整 |
| 构图 | 主体居中；重要内容放在画面中间 80% |
| 光线 | 5 张完全一致；只改变植物密度 |
| 文字 | 不要文字、字母、数字、水印、UI、边框 |
| 输出 | sRGB，JPEG 质量 90+ |

悬浮窗最终显示为 `220×280`，会做 `cover` 裁切，所以不要把所有东西贴到画面边缘。

## 3. 放到哪里

```text
src/renderer/overlay/assets/garden/
  light/stage-0.jpg ... stage-4.jpg
  dark/stage-0.jpg  ... stage-4.jpg
```

放好后重启 `npm start`，或重新打包安装版。渲染器会自动读取；不需要改代码。

## 4. 统一风格

### 浅色 · 晨光

```text
Photorealistic macro photograph of a small hand-blown glass terrarium, vertical 2:3 composition. The jar sits on a pale plaster stone surface in a bright, airy studio. Inside: living green moss, miniature ferns, one tiny mushroom and one small flower. Soft warm morning side light, translucent glass with clean highlights, pale sage and lime greens, subtle natural shadows, shallow depth of field, fine film grain, calm editorial color grading. Camera at eye level, straight-on, slightly above the jar, centered composition, the whole jar visible, generous negative space at the top and bottom. No person, no hands, no text, no logo, no UI, no border, no watermark.
```

### 深色 · 苔夜

```text
Photorealistic macro photograph of a small hand-blown glass terrarium, vertical 2:3 composition. The jar sits on dark charcoal stone in a low-key studio. Inside: living green moss, miniature ferns, one tiny mushroom and one small flower. Cinematic side light, deep forest-green shadows, a few warm amber highlights, condensation on the glass, shallow depth of field, fine film grain, natural moody color grading. Camera at eye level, straight-on, slightly above the jar, centered composition, the whole jar visible, generous negative space at the top and bottom. No person, no hands, no text, no logo, no UI, no border, no watermark.
```

## 5. 五个阶段

### stage-0 · 刚种下

```text
Newly planted. About 70% bare dark soil, only a few small moss patches and two tiny sprouts with thin stems. No open flowers. Very sparse, fragile, just after planting. Same jar, same table, same camera, same light.
```

### stage-1 · 发芽

```text
Young. Moss is spreading across the soil, a few small fern fiddleheads are unfurling, one tiny mushroom and one closed flower bud. Sparse but alive. Same jar, same table, same camera, same light.
```

### stage-2 · 长起来

```text
Establishing. A moss carpet covers about half of the floor, ferns are opening, one small flower is open, one mushroom is visible. Medium density. Same jar, same table, same camera, same light.
```

### stage-3 · 茂盛

```text
Lush. Dense moss carpet, layered ferns, several mushrooms and flowers, dew on the leaves, light condensation on the glass. Rich and healthy. Same jar, same table, same camera, same light.
```

### stage-4 · 完全长成

```text
Fully grown. Very lush layered terrarium, ferns at different heights, moss covering the floor, several flowers and mushrooms, heavy dew and condensation, two or three tiny fireflies. Cinematic and alive, still the same jar and camera.
```

## 6. 完整提示词（直接复制）

把“统一风格”和“阶段”拼在一起即可。下面是 5 个浅色完整版；深色只需把开头替换成“深色 · 苔夜”统一风格。

### 浅色 stage-0

```text
Photorealistic macro photograph of a small hand-blown glass terrarium, vertical 2:3 composition. The jar sits on a pale plaster stone surface in a bright, airy studio. Inside: living green moss, miniature ferns, one tiny mushroom and one small flower. Soft warm morning side light, translucent glass with clean highlights, pale sage and lime greens, subtle natural shadows, shallow depth of field, fine film grain, calm editorial color grading. Camera at eye level, straight-on, slightly above the jar, centered composition, the whole jar visible, generous negative space at the top and bottom. Newly planted. About 70% bare dark soil, only a few small moss patches and two tiny sprouts with thin stems. No open flowers. Very sparse, fragile, just after planting. No person, no hands, no text, no logo, no UI, no border, no watermark.
```

### 浅色 stage-1

```text
Photorealistic macro photograph of a small hand-blown glass terrarium, vertical 2:3 composition. The jar sits on a pale plaster stone surface in a bright, airy studio. Inside: living green moss, miniature ferns, one tiny mushroom and one small flower. Soft warm morning side light, translucent glass with clean highlights, pale sage and lime greens, subtle natural shadows, shallow depth of field, fine film grain, calm editorial color grading. Camera at eye level, straight-on, slightly above the jar, centered composition, the whole jar visible, generous negative space at the top and bottom. Young. Moss is spreading across the soil, a few small fern fiddleheads are unfurling, one tiny mushroom and one closed flower bud. Sparse but alive. No person, no hands, no text, no logo, no UI, no border, no watermark.
```

### 浅色 stage-2

```text
Photorealistic macro photograph of a small hand-blown glass terrarium, vertical 2:3 composition. The jar sits on a pale plaster stone surface in a bright, airy studio. Inside: living green moss, miniature ferns, one tiny mushroom and one small flower. Soft warm morning side light, translucent glass with clean highlights, pale sage and lime greens, subtle natural shadows, shallow depth of field, fine film grain, calm editorial color grading. Camera at eye level, straight-on, slightly above the jar, centered composition, the whole jar visible, generous negative space at the top and bottom. Establishing. A moss carpet covers about half of the floor, ferns are opening, one small flower is open, one mushroom is visible. Medium density. No person, no hands, no text, no logo, no UI, no border, no watermark.
```

### 浅色 stage-3

```text
Photorealistic macro photograph of a small hand-blown glass terrarium, vertical 2:3 composition. The jar sits on a pale plaster stone surface in a bright, airy studio. Inside: living green moss, miniature ferns, one tiny mushroom and one small flower. Soft warm morning side light, translucent glass with clean highlights, pale sage and lime greens, subtle natural shadows, shallow depth of field, fine film grain, calm editorial color grading. Camera at eye level, straight-on, slightly above the jar, centered composition, the whole jar visible, generous negative space at the top and bottom. Lush. Dense moss carpet, layered ferns, several mushrooms and flowers, dew on the leaves, light condensation on the glass. Rich and healthy. No person, no hands, no text, no logo, no UI, no border, no watermark.
```

### 浅色 stage-4

```text
Photorealistic macro photograph of a small hand-blown glass terrarium, vertical 2:3 composition. The jar sits on a pale plaster stone surface in a bright, airy studio. Inside: living green moss, miniature ferns, one tiny mushroom and one small flower. Soft warm morning side light, translucent glass with clean highlights, pale sage and lime greens, subtle natural shadows, shallow depth of field, fine film grain, calm editorial color grading. Camera at eye level, straight-on, slightly above the jar, centered composition, the whole jar visible, generous negative space at the top and bottom. Fully grown. Very lush layered terrarium, ferns at different heights, moss covering the floor, several flowers and mushrooms, heavy dew and condensation, two or three tiny fireflies. Cinematic and alive. No person, no hands, no text, no logo, no UI, no border, no watermark.
```

> 深色版：把上面的 `pale plaster ... bright, airy studio ... Soft warm morning side light ...` 换成“深色 · 苔夜”段落，其他不变。

## 7. 负面提示词

每次生成都加上：

```text
text, letters, numbers, logo, watermark, UI, interface, border, frame, collage, multiple jars, different jar, different table, different camera angle, top-down view, hands, person, cartoon, illustration, 3D render, plastic plant, toy, oversaturated, HDR, low resolution, blurry, deformed leaves
```

## 8. 一致性工作流

不要五张分别盲抽，否则瓶子、桌面、光线会跳。

1. **先生成 `stage-4`**，挑一张构图、玻璃、光线都满意的，作为主参考图。
2. 用同一个模型、同一个 seed，把主参考图作为 image reference。
3. 依次生成 `stage-3 → stage-2 → stage-1 → stage-0`。
4. 每张都强调：`same jar, same table, same camera, same lighting, same composition; only the plant density changes`.
5. 图生图 denoise 建议 `0.35–0.55`；太高会改掉瓶子和构图。
6. 不要中途换模型、换风格或换画幅。
7. 如果模型支持参考图权重，把参考图权重调高，只改植物密度。

Midjourney 可用 `--ar 2:3 --style raw`，把 stage-4 作为 image prompt；不同版本参数会变，以你用的工具为准。DALL·E / GPT Image 直接把 stage-4 附上，并要求“exact same jar and camera”。

## 9. 验收

- [ ] 5 张的瓶口、瓶身弧度、桌面位置一致
- [ ] 5 张的主光方向一致
- [ ] stage-0 → stage-4 是同一个瓶子里越来越满
- [ ] 没有文字、水印、UI、多个瓶子
- [ ] 2:3 竖图，主体在中间 80%
- [ ] stage-4 足够丰富，但仍有呼吸感
- [ ] 缩到 220×280 时，仍能一眼看出是生态瓶
- [ ] 浅色/深色只选一套也能跑

生成完按第 3 节路径放好，重启应用即可。当前仓库里的 `placeholder/` 是临时 Pexels 图，不需要保留。
