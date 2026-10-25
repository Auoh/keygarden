# 键息花园 · 生长图提示词

这份提示词用于生成 **5 个生长阶段的整幅生态瓶照片**。运行时不会实时生图，只在 5 张图之间交叉淡化，所以五张图必须像同一个生态瓶的 5 个时间点。

## 先看规格

- 画幅：**2:3 竖图**，建议 `1024×1536` 或 `1536×2304`
- 内容：完整玻璃生态瓶 + 苔藓 + 蕨 + 小菌 + 小花
- 相机、玻璃瓶、桌面、光线在 5 张里必须完全一致
- 只改变植物密度和生长阶段，不改变构图
- 不要文字、UI、边框、水印、人手、多个瓶子
- 重要内容放在画面中间 80%，因为悬浮窗会做 `cover` 裁切
- 输出 JPG（质量 90+）或 PNG；不需要透明背景

## 文件放这里

```
src/renderer/overlay/assets/garden/
  light/stage-0.jpg ... stage-4.jpg
  dark/stage-0.jpg  ... stage-4.jpg
```

先做浅色或深色任意一套即可。两套都存在时默认使用浅色。放好后重启 app 就会自动读取，不需要改代码。

## 基础提示词

### 浅色 · 晨光

```text
Photorealistic macro photograph of a small hand-blown glass terrarium, vertical 2:3 composition. The jar sits on a pale plaster stone surface in a bright, airy studio. Inside: living green moss, miniature ferns, one tiny mushroom and one small flower. Soft warm morning side light, translucent glass with clean highlights, pale sage and lime greens, subtle natural shadows, shallow depth of field, fine film grain, calm editorial color grading. Camera at eye level, straight-on, slightly above the jar, centered composition, the whole jar visible, generous negative space at the top and bottom. No person, no hands, no text, no logo, no UI, no border, no watermark.
```

### 深色 · 苔夜

```text
Photorealistic macro photograph of a small hand-blown glass terrarium, vertical 2:3 composition. The jar sits on dark charcoal stone in a low-key studio. Inside: living green moss, miniature ferns, one tiny mushroom and one small flower. Cinematic side light, deep forest-green shadows, a few warm amber highlights, condensation on the glass, shallow depth of field, fine film grain, natural moody color grading. Camera at eye level, straight-on, slightly above the jar, centered composition, the whole jar visible, generous negative space at the top and bottom. No person, no hands, no text, no logo, no UI, no border, no watermark.
```

## 五个阶段只改这一段

把下面的阶段描述接在基础提示词后面。

| 文件 | 阶段描述（接在基础提示词后） |
|---|---|
| `stage-0.jpg` | `Newly planted. About 70% bare dark soil, only a few small moss patches and two tiny sprouts with thin stems. No open flowers. Very sparse, fragile, just after planting.` |
| `stage-1.jpg` | `Young. Moss is spreading across the soil, a few small fern fiddleheads are unfurling, one tiny mushroom and one closed flower bud. Sparse but alive.` |
| `stage-2.jpg` | `Establishing. A moss carpet covers about half of the floor, ferns are opening, one small flower is open, one mushroom is visible. Medium density.` |
| `stage-3.jpg` | `Lush. Dense moss carpet, layered ferns, several mushrooms and flowers, dew on the leaves, light condensation on the glass. Rich and healthy.` |
| `stage-4.jpg` | `Fully grown. Very lush layered terrarium, ferns at different heights, moss covering the floor, several flowers and mushrooms, heavy dew and condensation, two or three tiny fireflies. Cinematic and alive, still the same jar and camera.` |

## 一致性工作流

这是整件事最关键的部分。不要分别盲抽 5 张，否则瓶子、桌面、光线会跳。

1. **先生成 `stage-4`**，挑一张构图、玻璃、光线都满意的，作为主参考图。
2. 用同一个模型、同一个 seed，把主参考图作为 image reference。
3. 依次生成 `stage-3 → stage-2 → stage-1 → stage-0`；每张都强调：
   `same jar, same table, same camera, same lighting, same composition; only the plant density changes`.
4. 如果使用图生图，denoise 建议 `0.35–0.55`；太高会改掉瓶子和构图。
5. 如果模型支持参考图权重，把参考图权重调高，文字描述只改植物密度。
6. 同一套图尽量在一次会话里完成；不要中途换模型或风格。

Midjourney 可以用 `--ar 2:3 --style raw`，并把 stage-4 作为 image prompt（`--iw 1.5` 左右）；不同版本参数会变，以你用的工具为准。DALL·E / GPT Image 直接把主参考图附上，并要求“exact same jar and camera”。

## 负面提示词

```text
text, letters, numbers, logo, watermark, UI, interface, border, frame, collage, multiple jars, different jar, different table, different camera angle, top-down view, hands, person, cartoon, illustration, 3D render, plastic plant, toy, oversaturated, HDR, low resolution, blurry, deformed leaves
```

## 检查清单

- [ ] 5 张的瓶口、瓶身弧度、桌面位置一致
- [ ] 5 张的主光方向一致
- [ ] stage-0 到 stage-4 是同一个瓶子里越来越满，不是换了一个瓶
- [ ] 没有文字/水印/UI
- [ ] 2:3 竖图，主体在中间 80%
- [ ] stage-4 足够丰富，但不要塞满到没有呼吸感
- [ ] 缩到 220×280 时，仍能一眼看出是生态瓶

生成完成后按上面的路径放好，重启 `npm start` 或安装版即可。浅色和深色可以只做一套，app 会自动回退。
