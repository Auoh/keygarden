# 桌边远行 · B 模式贴图提示词（按图拆分）

这份文档按“一张图 = 一条完整提示词”组织。每条都已经包含风格、机位、画幅、场景描述和“不要文字/UI”的约束，不需要再拼接。

## 需要哪些图

B 的底部风景带是 960×200；建议生成 6 张背景 + 2 个透明道具。背景的原生 2.35:1 图会由 `scripts/prepare-journey-assets.py` 按场景焦点裁成 24:5（1584×330），不会横向拉伸。只做背景也能明显提升画面，人物和营地缺失时会回退到代码绘制。

| 图 | 内容 | 文件 | 提示词 |
|---|---|---|---|
| 图 01 | 雾之谷 | `backgrounds/00-mist-valley.jpg` | [单图](journey-prompts/01-00-mist-valley.md) |
| 图 02 | 松针坡 | `backgrounds/01-pine-slope.jpg` | [单图](journey-prompts/02-01-pine-slope.md) |
| 图 03 | 旧车站 | `backgrounds/02-old-station.jpg` | [单图](journey-prompts/03-02-old-station.md) |
| 图 04 | 风蚀原 | `backgrounds/03-wind-plain.jpg` | [单图](journey-prompts/04-03-wind-plain.md) |
| 图 05 | 星见湖 | `backgrounds/04-star-lake.jpg` | [单图](journey-prompts/05-04-star-lake.md) |
| 图 06 | 北岸 | `backgrounds/05-north-shore.jpg` | [单图](journey-prompts/06-05-north-shore.md) |
| 图 07 | 旅人 · 行走 | `traveler/walk.png` | [单图](journey-prompts/07-traveler-walk.md) |
| 图 08 | 扎营 · 帐篷与火 | `props/camp.png` | [单图](journey-prompts/08-camp.md) |

## 放图路径

```text
src/renderer/journey/assets/
  backgrounds/00-mist-valley.jpg … 05-north-shore.jpg
  traveler/walk.png
  props/camp.png
```

背景支持 JPG / PNG / WebP，推荐 JPG 质量 90+；道具需要透明 PNG。

## 一致性规则

6 张背景必须是同一套视觉语言：同一侧视机位、同样 55% 地平线、同样蓝调色板、同样颗粒和对比度。场景可以换，但镜头不能换。人物和营地是透明道具，单独生成，不要画进背景。

如果模型不支持 24:5，先生成 16:9，再裁一条 1920×400、以地平线和道路为中心的横带。不要直接拉伸。

## 八张完整提示词

## 图 01 · 雾之谷

**目标文件**：`src/renderer/journey/assets/backgrounds/00-mist-valley.jpg`  
**规格**：24:5, 1920×400 recommended, JPG quality 90+. If your model cannot do 24:5, generate 16:9 and crop a 1920×400 band around the horizon/path.

### 正向提示词（复制这一段）

```text
Cinematic ultra-wide matte painting for a quiet desktop ambient game, 24:5 aspect, 1920×400. A side-on landscape at blue hour, horizon at 55%, an empty dirt path winding across the lower third, deep teal and desaturated greens, a few warm amber highlights, soft atmospheric depth, fine film grain, painterly photoreal detail. Camera at human eye level, static, side-on, composition designed for a 960×200 bottom screen strip. No people, no traveler, no tent, no text, no logo, no UI, no border, no watermark. A low misty valley at blue hour, layers of faint pine silhouettes, a pale moon behind the mist, a narrow path disappearing into fog. Quiet, cinematic, sparse.
```

### 负向提示词（单独填，或接在正向后面）

```text
text, letters, numbers, logo, watermark, UI, interface, border, frame, collage, multiple panels, person, traveler, tent, campfire, vehicle, building interior, cartoon, illustration, 3D render, low resolution, blurry, oversaturated, HDR, deformed trees
```

> 单图文件：[journey-prompts/01-00-mist-valley.md](journey-prompts/01-00-mist-valley.md)

## 图 02 · 松针坡

**目标文件**：`src/renderer/journey/assets/backgrounds/01-pine-slope.jpg`  
**规格**：24:5, 1920×400 recommended, JPG quality 90+. If your model cannot do 24:5, generate 16:9 and crop a 1920×400 band around the horizon/path.

### 正向提示词（复制这一段）

```text
Cinematic ultra-wide matte painting for a quiet desktop ambient game, 24:5 aspect, 1920×400. A side-on landscape at blue hour, horizon at 55%, an empty dirt path winding across the lower third, deep teal and desaturated greens, a few warm amber highlights, soft atmospheric depth, fine film grain, painterly photoreal detail. Camera at human eye level, static, side-on, composition designed for a 960×200 bottom screen strip. No people, no traveler, no tent, no text, no logo, no UI, no border, no watermark. A steep pine-covered slope, needle-covered trail, broken amber late light through the trunks, a distant ridge fading into the evening. Calm, grounded.
```

### 负向提示词（单独填，或接在正向后面）

```text
text, letters, numbers, logo, watermark, UI, interface, border, frame, collage, multiple panels, person, traveler, tent, campfire, vehicle, building interior, cartoon, illustration, 3D render, low resolution, blurry, oversaturated, HDR, deformed trees
```

> 单图文件：[journey-prompts/02-01-pine-slope.md](journey-prompts/02-01-pine-slope.md)

## 图 03 · 旧车站

**目标文件**：`src/renderer/journey/assets/backgrounds/02-old-station.jpg`  
**规格**：24:5, 1920×400 recommended, JPG quality 90+. If your model cannot do 24:5, generate 16:9 and crop a 1920×400 band around the horizon/path.

### 正向提示词（复制这一段）

```text
Cinematic ultra-wide matte painting for a quiet desktop ambient game, 24:5 aspect, 1920×400. A side-on landscape at blue hour, horizon at 55%, an empty dirt path winding across the lower third, deep teal and desaturated greens, a few warm amber highlights, soft atmospheric depth, fine film grain, painterly photoreal detail. Camera at human eye level, static, side-on, composition designed for a 960×200 bottom screen strip. No people, no traveler, no tent, no text, no logo, no UI, no border, no watermark. An abandoned rural railway station at dusk, a single warm lamp, old rails crossing the path, fog between the platform and the hills. Melancholic but safe.
```

### 负向提示词（单独填，或接在正向后面）

```text
text, letters, numbers, logo, watermark, UI, interface, border, frame, collage, multiple panels, person, traveler, tent, campfire, vehicle, building interior, cartoon, illustration, 3D render, low resolution, blurry, oversaturated, HDR, deformed trees
```

> 单图文件：[journey-prompts/03-02-old-station.md](journey-prompts/03-02-old-station.md)

## 图 04 · 风蚀原

**目标文件**：`src/renderer/journey/assets/backgrounds/03-wind-plain.jpg`  
**规格**：24:5, 1920×400 recommended, JPG quality 90+. If your model cannot do 24:5, generate 16:9 and crop a 1920×400 band around the horizon/path.

### 正向提示词（复制这一段）

```text
Cinematic ultra-wide matte painting for a quiet desktop ambient game, 24:5 aspect, 1920×400. A side-on landscape at blue hour, horizon at 55%, an empty dirt path winding across the lower third, deep teal and desaturated greens, a few warm amber highlights, soft atmospheric depth, fine film grain, painterly photoreal detail. Camera at human eye level, static, side-on, composition designed for a 960×200 bottom screen strip. No people, no traveler, no tent, no text, no logo, no UI, no border, no watermark. A windswept open plain, long grass bending, scattered dark rocks, a storm front far away, cold blue-grey light with a thin band of amber on the horizon. Vast and quiet.
```

### 负向提示词（单独填，或接在正向后面）

```text
text, letters, numbers, logo, watermark, UI, interface, border, frame, collage, multiple panels, person, traveler, tent, campfire, vehicle, building interior, cartoon, illustration, 3D render, low resolution, blurry, oversaturated, HDR, deformed trees
```

> 单图文件：[journey-prompts/04-03-wind-plain.md](journey-prompts/04-03-wind-plain.md)

## 图 05 · 星见湖

**目标文件**：`src/renderer/journey/assets/backgrounds/04-star-lake.jpg`  
**规格**：24:5, 1920×400 recommended, JPG quality 90+. If your model cannot do 24:5, generate 16:9 and crop a 1920×400 band around the horizon/path.

### 正向提示词（复制这一段）

```text
Cinematic ultra-wide matte painting for a quiet desktop ambient game, 24:5 aspect, 1920×400. A side-on landscape at blue hour, horizon at 55%, an empty dirt path winding across the lower third, deep teal and desaturated greens, a few warm amber highlights, soft atmospheric depth, fine film grain, painterly photoreal detail. Camera at human eye level, static, side-on, composition designed for a 960×200 bottom screen strip. No people, no traveler, no tent, no text, no logo, no UI, no border, no watermark. A still lake at night, reeds at the edge, a path following the shore, stars and a soft moon reflected in the water. Deep teal, almost silent.
```

### 负向提示词（单独填，或接在正向后面）

```text
text, letters, numbers, logo, watermark, UI, interface, border, frame, collage, multiple panels, person, traveler, tent, campfire, vehicle, building interior, cartoon, illustration, 3D render, low resolution, blurry, oversaturated, HDR, deformed trees
```

> 单图文件：[journey-prompts/05-04-star-lake.md](journey-prompts/05-04-star-lake.md)

## 图 06 · 北岸

**目标文件**：`src/renderer/journey/assets/backgrounds/05-north-shore.jpg`  
**规格**：24:5, 1920×400 recommended, JPG quality 90+. If your model cannot do 24:5, generate 16:9 and crop a 1920×400 band around the horizon/path.

### 正向提示词（复制这一段）

```text
Cinematic ultra-wide matte painting for a quiet desktop ambient game, 24:5 aspect, 1920×400. A side-on landscape at blue hour, horizon at 55%, an empty dirt path winding across the lower third, deep teal and desaturated greens, a few warm amber highlights, soft atmospheric depth, fine film grain, painterly photoreal detail. Camera at human eye level, static, side-on, composition designed for a 960×200 bottom screen strip. No people, no traveler, no tent, no text, no logo, no UI, no border, no watermark. A cold northern shoreline at first light, low cliffs, a small distant cabin window, a pale amber dawn behind blue mist. The end of a long walk.
```

### 负向提示词（单独填，或接在正向后面）

```text
text, letters, numbers, logo, watermark, UI, interface, border, frame, collage, multiple panels, person, traveler, tent, campfire, vehicle, building interior, cartoon, illustration, 3D render, low resolution, blurry, oversaturated, HDR, deformed trees
```

> 单图文件：[journey-prompts/06-05-north-shore.md](journey-prompts/06-05-north-shore.md)

## 图 07 · 旅人 · 行走

**目标文件**：`src/renderer/journey/assets/traveler/walk.png`  
**规格**：256×256 or larger, transparent PNG. Side view facing right; the app draws it around 54 px tall.

### 正向提示词（复制这一段）

```text
A small side-view silhouette of a lone traveler with a backpack, walking pose, full body, matte near-black with a thin warm amber rim light, cinematic and restrained, isolated on a fully transparent background, PNG with alpha, 256×256, centered, no shadow, no ground, no text, no logo, no UI, no face detail. Designed to sit on a blue-hour landscape at about 54 px tall without looking cartoonish.
```

### 负向提示词（单独填，或接在正向后面）

```text
background, landscape, ground, shadow, text, letters, logo, watermark, UI, border, frame, cartoon, chibi, face detail, low resolution, blurry, green screen fringe, extra limbs
```

> 单图文件：[journey-prompts/07-traveler-walk.md](journey-prompts/07-traveler-walk.md)

## 图 08 · 扎营 · 帐篷与火

**目标文件**：`src/renderer/journey/assets/props/camp.png`  
**规格**：512×256 or larger, transparent PNG. No person; the app draws it around 58 px tall.

### 正向提示词（复制这一段）

```text
A small side-view canvas tent and a low campfire, cinematic blue-hour palette, warm fire glow on the tent edge, isolated on a fully transparent background, PNG with alpha, 512×256, centered, no person, no ground plane, no long shadow, no text, no logo, no UI, clean cutout, designed to sit on a blue-hour landscape at about 58 px tall.
```

### 负向提示词（单独填，或接在正向后面）

```text
background, landscape, ground, shadow, text, letters, logo, watermark, UI, border, frame, cartoon, chibi, face detail, low resolution, blurry, green screen fringe, extra limbs
```

> 单图文件：[journey-prompts/08-camp.md](journey-prompts/08-camp.md)

## 人物状态扩展

现有 `walk.png` 之外，推荐补 **walk-b（步态第二帧）**、**camp-sit（营地坐姿）** 和 **rest（短休息）**；`arrive` / `rain` 可选。完整提示词、风格连贯约束和放图路径见：

- [journey-character-prompts.md](journey-character-prompts.md)

这些状态图都沿用同一套黑色剪影 + 暖琥珀轮廓光，不要重新设计角色。


## 负面提示词说明

每条图下方都单独附了负面提示词。支持独立 negative prompt 字段的工具直接填入；只有一个输入框的工具，可以把负向内容接在正向提示词末尾。

## 验收

- [ ] 6 张背景的地平线和道路高度一致
- [ ] 主光方向与蓝调色板一致
- [ ] 背景里没有人物、帐篷、文字、UI
- [ ] 人物/营地是透明 PNG，边缘没有明显绿边
- [ ] 缩到 960×200 后，人物和道路仍然一眼可读
- [ ] 6 张背景连续切换时没有突然的镜头跳变

生成后按路径放好，重启应用即可。当前代码绘制风景是 fallback，素材缺失也不会崩溃。
