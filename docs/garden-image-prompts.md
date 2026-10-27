# 键息花园 · 右下角生长贴图提示词（按图拆分）

这份文档按 **一张图 = 一条完整提示词** 组织。每条都已经包含风格、机位、画幅、阶段描述和“不要文字/UI”的约束，不再需要从基础段拼接。

## 先看清单

运行时完整一套是 10 张整幅生态瓶照片：

| 图 | 主题 | 文件 | 阶段 |
|---|---|---|---|
| 图 01 | 浅色 · 晨光 | `light/stage-0.jpg` | [刚种下](prompts/01-light-stage-0.md) |
| 图 02 | 浅色 · 晨光 | `light/stage-1.jpg` | [发芽](prompts/02-light-stage-1.md) |
| 图 03 | 浅色 · 晨光 | `light/stage-2.jpg` | [长起来](prompts/03-light-stage-2.md) |
| 图 04 | 浅色 · 晨光 | `light/stage-3.jpg` | [茂盛](prompts/04-light-stage-3.md) |
| 图 05 | 浅色 · 晨光 | `light/stage-4.jpg` | [完全长成](prompts/05-light-stage-4.md) |
| 图 06 | 深色 · 苔夜 | `dark/stage-0.jpg` | [刚种下](prompts/06-dark-stage-0.md) |
| 图 07 | 深色 · 苔夜 | `dark/stage-1.jpg` | [发芽](prompts/07-dark-stage-1.md) |
| 图 08 | 深色 · 苔夜 | `dark/stage-2.jpg` | [长起来](prompts/08-dark-stage-2.md) |
| 图 09 | 深色 · 苔夜 | `dark/stage-3.jpg` | [茂盛](prompts/09-dark-stage-3.md) |
| 图 10 | 深色 · 苔夜 | `dark/stage-4.jpg` | [完全长成](prompts/10-dark-stage-4.md) |

**最小可用**：只做浅色 1–5，或只做深色 6–10。两套都有时应用默认用浅色。

当前渲染器不使用蕨/菌/花/苔的透明小贴图；雨、雾、萤火虫、孢子都是运行时 Canvas 绘制。每张图都是整幅照片，不需要透明背景。

## 放图路径

```text
src/renderer/overlay/assets/garden/
  light/stage-0.jpg … stage-4.jpg   # 图 01–05
  dark/stage-0.jpg  … stage-4.jpg   # 图 06–10
```

支持 JPG、PNG、WebP；照片建议 JPG 质量 90+。

## 一致性规则

> **2026-10-27 审计补充：** 当前浅色 `stage-4` 与 0–3 的瓶子大小、桌面和背景不一致。**不要再用当前这张 stage-4 当主参考**。请以 `light/stage-3.jpg` 为参考，只对瓶内植物做局部重绘；修复提示词和蒙版流程见 [asset-audit-2026-10-27.md](asset-audit-2026-10-27.md)。

10 张里同一个主题的 5 张，必须是同一个瓶子、同一张桌面、同一个机位、同一束光。先生成一张被批准的 `stage-3` 作为主参考，再用图生图依次做 `stage-2 → stage-1 → stage-0`，最后从 `stage-3` 往 `stage-4` 做局部重绘；每张只改植物密度，强调：

`same jar, same table, same camera, same lighting, same composition; only the plant density changes.`

图生图 denoise 建议 `0.35–0.55`。不要中途换模型、画幅或风格。

## 十条完整提示词

## 图 01 · 浅色 · 晨光 / 刚种下

**目标文件**：`src/renderer/overlay/assets/garden/light/stage-0.jpg`  
**规格**：2:3 vertical, 1024×1536 or 1536×2304, sRGB, JPEG quality 90+. The final overlay crops to 220×280, so keep the jar and plants inside the central 80%.

### 正向提示词（复制这一段）

```text
Photorealistic macro photograph of a small hand-blown glass terrarium, vertical 2:3 composition. The jar sits on a dark charcoal slate table in a bright, airy studio, with a softly blurred window and green plants behind it. Inside: living green moss, miniature ferns, mossy stones and a few small plants. Soft warm morning side light, translucent glass with clean highlights, pale sage and lime greens, subtle natural shadows, shallow depth of field, fine film grain, calm editorial color grading. Camera at eye level, straight-on, slightly above the jar, centered composition, the whole jar visible, generous negative space at the top and bottom. No person, no hands, no text, no logo, no UI, no border, no watermark. Newly planted. About 70% bare dark soil, only a few small moss patches, two tiny sprouts with thin stems and one closed bud. No open flowers, no mushroom. Very sparse, fragile, just after planting. Same jar, same table, same camera, same light.
```

### 负向提示词（单独填，或接在正向后面）

```text
text, letters, numbers, logo, watermark, UI, interface, border, frame, collage, multiple jars, different jar, different table, pale plaster table, white stone table, different camera angle, top-down view, hands, person, cartoon, illustration, 3D render, plastic plant, toy, oversaturated, HDR, low resolution, blurry, deformed leaves
```

> 单图文件：[prompts/01-light-stage-0.md](prompts/01-light-stage-0.md)

## 图 02 · 浅色 · 晨光 / 发芽

**目标文件**：`src/renderer/overlay/assets/garden/light/stage-1.jpg`  
**规格**：2:3 vertical, 1024×1536 or 1536×2304, sRGB, JPEG quality 90+. The final overlay crops to 220×280, so keep the jar and plants inside the central 80%.

### 正向提示词（复制这一段）

```text
Photorealistic macro photograph of a small hand-blown glass terrarium, vertical 2:3 composition. The jar sits on a dark charcoal slate table in a bright, airy studio, with a softly blurred window and green plants behind it. Inside: living green moss, miniature ferns, mossy stones and a few small plants. Soft warm morning side light, translucent glass with clean highlights, pale sage and lime greens, subtle natural shadows, shallow depth of field, fine film grain, calm editorial color grading. Camera at eye level, straight-on, slightly above the jar, centered composition, the whole jar visible, generous negative space at the top and bottom. No person, no hands, no text, no logo, no UI, no border, no watermark. Young. Moss is spreading across the soil, a few small fern fiddleheads are unfurling, one tiny mushroom and one closed flower bud are visible. Sparse but alive. Same jar, same table, same camera, same light.
```

### 负向提示词（单独填，或接在正向后面）

```text
text, letters, numbers, logo, watermark, UI, interface, border, frame, collage, multiple jars, different jar, different table, pale plaster table, white stone table, different camera angle, top-down view, hands, person, cartoon, illustration, 3D render, plastic plant, toy, oversaturated, HDR, low resolution, blurry, deformed leaves
```

> 单图文件：[prompts/02-light-stage-1.md](prompts/02-light-stage-1.md)

## 图 03 · 浅色 · 晨光 / 长起来

**目标文件**：`src/renderer/overlay/assets/garden/light/stage-2.jpg`  
**规格**：2:3 vertical, 1024×1536 or 1536×2304, sRGB, JPEG quality 90+. The final overlay crops to 220×280, so keep the jar and plants inside the central 80%.

### 正向提示词（复制这一段）

```text
Photorealistic macro photograph of a small hand-blown glass terrarium, vertical 2:3 composition. The jar sits on a dark charcoal slate table in a bright, airy studio, with a softly blurred window and green plants behind it. Inside: living green moss, miniature ferns, mossy stones and a few small plants. Soft warm morning side light, translucent glass with clean highlights, pale sage and lime greens, subtle natural shadows, shallow depth of field, fine film grain, calm editorial color grading. Camera at eye level, straight-on, slightly above the jar, centered composition, the whole jar visible, generous negative space at the top and bottom. No person, no hands, no text, no logo, no UI, no border, no watermark. Establishing. A moss carpet covers about half of the floor, ferns are opening, one small flower is open, one mushroom is visible. Medium density. Same jar, same table, same camera, same light.
```

### 负向提示词（单独填，或接在正向后面）

```text
text, letters, numbers, logo, watermark, UI, interface, border, frame, collage, multiple jars, different jar, different table, pale plaster table, white stone table, different camera angle, top-down view, hands, person, cartoon, illustration, 3D render, plastic plant, toy, oversaturated, HDR, low resolution, blurry, deformed leaves
```

> 单图文件：[prompts/03-light-stage-2.md](prompts/03-light-stage-2.md)

## 图 04 · 浅色 · 晨光 / 茂盛

**目标文件**：`src/renderer/overlay/assets/garden/light/stage-3.jpg`  
**规格**：2:3 vertical, 1024×1536 or 1536×2304, sRGB, JPEG quality 90+. The final overlay crops to 220×280, so keep the jar and plants inside the central 80%.

### 正向提示词（复制这一段）

```text
Photorealistic macro photograph of a small hand-blown glass terrarium, vertical 2:3 composition. The jar sits on a dark charcoal slate table in a bright, airy studio, with a softly blurred window and green plants behind it. Inside: living green moss, miniature ferns, mossy stones and a few small plants. Soft warm morning side light, translucent glass with clean highlights, pale sage and lime greens, subtle natural shadows, shallow depth of field, fine film grain, calm editorial color grading. Camera at eye level, straight-on, slightly above the jar, centered composition, the whole jar visible, generous negative space at the top and bottom. No person, no hands, no text, no logo, no UI, no border, no watermark. Lush. Dense moss carpet, layered ferns, several mushrooms and flowers, dew on the leaves, light condensation on the glass. Rich and healthy. Same jar, same table, same camera, same light.
```

### 负向提示词（单独填，或接在正向后面）

```text
text, letters, numbers, logo, watermark, UI, interface, border, frame, collage, multiple jars, different jar, different table, pale plaster table, white stone table, different camera angle, top-down view, hands, person, cartoon, illustration, 3D render, plastic plant, toy, oversaturated, HDR, low resolution, blurry, deformed leaves
```

> 单图文件：[prompts/04-light-stage-3.md](prompts/04-light-stage-3.md)

## 图 05 · 浅色 · 晨光 / 完全长成

**目标文件**：`src/renderer/overlay/assets/garden/light/stage-4.jpg`  
**规格**：2:3 vertical, 1024×1536 or 1536×2304, sRGB, JPEG quality 90+. The final overlay crops to 220×280, so keep the jar and plants inside the central 80%.

### 正向提示词（复制这一段）

```text
Use the attached light/stage-3.jpg as the exact reference image. Keep the glass jar, cork lid, camera distance, framing, dark charcoal slate table, softly blurred window and green plant background, side-light direction, shadows, color grade, depth of field and film grain 100% unchanged. Only repaint the interior of the jar: a fully grown, lush terrarium with a dense moss floor, taller layered ferns, small pale pink and white flowers, three or four small brown mushrooms, dew on leaves, light condensation on the inside of the glass, and two or three tiny warm fireflies. Keep every plant below the jar shoulder and inside the glass; do not change the jar silhouette, cork, table, backdrop or camera. Photorealistic macro photograph, vertical 2:3, 848x1264, same lens and exposure as the reference.
```

**这一张必须用参考图/局部重绘，不能只靠文字重新生成。** 以 `light/stage-3.jpg` 为底，只在瓶内做蒙版，denoise 0.45–0.55；瓶外像素原样保留。完整流程见 [asset-audit-2026-10-27.md](asset-audit-2026-10-27.md)。

### 负向提示词（单独填，或接在正向后面）

```text
text, letters, numbers, logo, watermark, UI, interface, border, frame, collage, multiple jars, different jar, different table, pale plaster table, white stone table, different camera angle, top-down view, hands, person, cartoon, illustration, 3D render, plastic plant, toy, oversaturated, HDR, low resolution, blurry, deformed leaves
```

> 单图文件：[prompts/05-light-stage-4.md](prompts/05-light-stage-4.md)

## 图 06 · 深色 · 苔夜 / 刚种下

**目标文件**：`src/renderer/overlay/assets/garden/dark/stage-0.jpg`  
**规格**：2:3 vertical, 1024×1536 or 1536×2304, sRGB, JPEG quality 90+. The final overlay crops to 220×280, so keep the jar and plants inside the central 80%.

### 正向提示词（复制这一段）

```text
Photorealistic macro photograph of a small hand-blown glass terrarium, vertical 2:3 composition. The jar sits on dark charcoal stone in a low-key studio. Inside: living green moss, miniature ferns, mossy stones and a few small plants. Cinematic side light, deep forest-green shadows, a few warm amber highlights, condensation on the glass, shallow depth of field, fine film grain, natural moody color grading. Camera at eye level, straight-on, slightly above the jar, centered composition, the whole jar visible, generous negative space at the top and bottom. No person, no hands, no text, no logo, no UI, no border, no watermark. Newly planted. About 70% bare dark soil, only a few small moss patches, two tiny sprouts with thin stems and one closed bud. No open flowers, no mushroom. Very sparse, fragile, just after planting. Same jar, same table, same camera, same light.
```

### 负向提示词（单独填，或接在正向后面）

```text
text, letters, numbers, logo, watermark, UI, interface, border, frame, collage, multiple jars, different jar, different table, pale plaster table, white stone table, different camera angle, top-down view, hands, person, cartoon, illustration, 3D render, plastic plant, toy, oversaturated, HDR, low resolution, blurry, deformed leaves
```

> 单图文件：[prompts/06-dark-stage-0.md](prompts/06-dark-stage-0.md)

## 图 07 · 深色 · 苔夜 / 发芽

**目标文件**：`src/renderer/overlay/assets/garden/dark/stage-1.jpg`  
**规格**：2:3 vertical, 1024×1536 or 1536×2304, sRGB, JPEG quality 90+. The final overlay crops to 220×280, so keep the jar and plants inside the central 80%.

### 正向提示词（复制这一段）

```text
Photorealistic macro photograph of a small hand-blown glass terrarium, vertical 2:3 composition. The jar sits on dark charcoal stone in a low-key studio. Inside: living green moss, miniature ferns, mossy stones and a few small plants. Cinematic side light, deep forest-green shadows, a few warm amber highlights, condensation on the glass, shallow depth of field, fine film grain, natural moody color grading. Camera at eye level, straight-on, slightly above the jar, centered composition, the whole jar visible, generous negative space at the top and bottom. No person, no hands, no text, no logo, no UI, no border, no watermark. Young. Moss is spreading across the soil, a few small fern fiddleheads are unfurling, one tiny mushroom and one closed flower bud are visible. Sparse but alive. Same jar, same table, same camera, same light.
```

### 负向提示词（单独填，或接在正向后面）

```text
text, letters, numbers, logo, watermark, UI, interface, border, frame, collage, multiple jars, different jar, different table, pale plaster table, white stone table, different camera angle, top-down view, hands, person, cartoon, illustration, 3D render, plastic plant, toy, oversaturated, HDR, low resolution, blurry, deformed leaves
```

> 单图文件：[prompts/07-dark-stage-1.md](prompts/07-dark-stage-1.md)

## 图 08 · 深色 · 苔夜 / 长起来

**目标文件**：`src/renderer/overlay/assets/garden/dark/stage-2.jpg`  
**规格**：2:3 vertical, 1024×1536 or 1536×2304, sRGB, JPEG quality 90+. The final overlay crops to 220×280, so keep the jar and plants inside the central 80%.

### 正向提示词（复制这一段）

```text
Photorealistic macro photograph of a small hand-blown glass terrarium, vertical 2:3 composition. The jar sits on dark charcoal stone in a low-key studio. Inside: living green moss, miniature ferns, mossy stones and a few small plants. Cinematic side light, deep forest-green shadows, a few warm amber highlights, condensation on the glass, shallow depth of field, fine film grain, natural moody color grading. Camera at eye level, straight-on, slightly above the jar, centered composition, the whole jar visible, generous negative space at the top and bottom. No person, no hands, no text, no logo, no UI, no border, no watermark. Establishing. A moss carpet covers about half of the floor, ferns are opening, one small flower is open, one mushroom is visible. Medium density. Same jar, same table, same camera, same light.
```

### 负向提示词（单独填，或接在正向后面）

```text
text, letters, numbers, logo, watermark, UI, interface, border, frame, collage, multiple jars, different jar, different table, pale plaster table, white stone table, different camera angle, top-down view, hands, person, cartoon, illustration, 3D render, plastic plant, toy, oversaturated, HDR, low resolution, blurry, deformed leaves
```

> 单图文件：[prompts/08-dark-stage-2.md](prompts/08-dark-stage-2.md)

## 图 09 · 深色 · 苔夜 / 茂盛

**目标文件**：`src/renderer/overlay/assets/garden/dark/stage-3.jpg`  
**规格**：2:3 vertical, 1024×1536 or 1536×2304, sRGB, JPEG quality 90+. The final overlay crops to 220×280, so keep the jar and plants inside the central 80%.

### 正向提示词（复制这一段）

```text
Photorealistic macro photograph of a small hand-blown glass terrarium, vertical 2:3 composition. The jar sits on dark charcoal stone in a low-key studio. Inside: living green moss, miniature ferns, mossy stones and a few small plants. Cinematic side light, deep forest-green shadows, a few warm amber highlights, condensation on the glass, shallow depth of field, fine film grain, natural moody color grading. Camera at eye level, straight-on, slightly above the jar, centered composition, the whole jar visible, generous negative space at the top and bottom. No person, no hands, no text, no logo, no UI, no border, no watermark. Lush. Dense moss carpet, layered ferns, several mushrooms and flowers, dew on the leaves, light condensation on the glass. Rich and healthy. Same jar, same table, same camera, same light.
```

### 负向提示词（单独填，或接在正向后面）

```text
text, letters, numbers, logo, watermark, UI, interface, border, frame, collage, multiple jars, different jar, different table, pale plaster table, white stone table, different camera angle, top-down view, hands, person, cartoon, illustration, 3D render, plastic plant, toy, oversaturated, HDR, low resolution, blurry, deformed leaves
```

> 单图文件：[prompts/09-dark-stage-3.md](prompts/09-dark-stage-3.md)

## 图 10 · 深色 · 苔夜 / 完全长成

**目标文件**：`src/renderer/overlay/assets/garden/dark/stage-4.jpg`  
**规格**：2:3 vertical, 1024×1536 or 1536×2304, sRGB, JPEG quality 90+. The final overlay crops to 220×280, so keep the jar and plants inside the central 80%.

### 正向提示词（复制这一段）

```text
Photorealistic macro photograph of a small hand-blown glass terrarium, vertical 2:3 composition. The jar sits on dark charcoal stone in a low-key studio. Inside: living green moss, miniature ferns, mossy stones and a few small plants. Cinematic side light, deep forest-green shadows, a few warm amber highlights, condensation on the glass, shallow depth of field, fine film grain, natural moody color grading. Camera at eye level, straight-on, slightly above the jar, centered composition, the whole jar visible, generous negative space at the top and bottom. No person, no hands, no text, no logo, no UI, no border, no watermark. Fully grown. Very lush layered terrarium, ferns at different heights, moss covering the floor, several flowers and mushrooms, heavy dew and condensation, two or three tiny fireflies. Cinematic and alive, still the same jar and camera.
```

### 负向提示词（单独填，或接在正向后面）

```text
text, letters, numbers, logo, watermark, UI, interface, border, frame, collage, multiple jars, different jar, different table, pale plaster table, white stone table, different camera angle, top-down view, hands, person, cartoon, illustration, 3D render, plastic plant, toy, oversaturated, HDR, low resolution, blurry, deformed leaves
```

> 单图文件：[prompts/10-dark-stage-4.md](prompts/10-dark-stage-4.md)


## 负面提示词说明

每条图下方都单独附了负面提示词。支持独立 negative prompt 字段的工具直接填入；只有一个输入框的工具，可以把 `Negative prompt:` 后面的内容接在正向提示词末尾。

## 验收

- [ ] 同一主题 5 张的瓶口、瓶身弧度、桌面位置一致
- [ ] 主光方向一致
- [ ] stage-0 → stage-4 是同一个瓶子里越来越满
- [ ] 没有文字、水印、UI、多个瓶子
- [ ] 2:3 竖图，主体在中间 80%
- [ ] 缩到 220×280 时，仍能一眼看出是生态瓶
- [ ] 只做一套也能跑

生成后按上面的路径放好，重启应用即可。当前仓库里的 `placeholder/` 是临时 Pexels 图，不需要保留。
