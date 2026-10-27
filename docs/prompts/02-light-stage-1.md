# 图 02 · 浅色 · 晨光 / 发芽

**目标文件**：`src/renderer/overlay/assets/garden/light/stage-1.jpg`  
**规格**：2:3 vertical, 1024×1536 or 1536×2304, sRGB, JPEG quality 90+. The final overlay crops to 220×280, so keep the jar and plants inside the central 80%.

## 正向提示词（复制这一段）

```text
Photorealistic macro photograph of a small hand-blown glass terrarium, vertical 2:3 composition. The jar sits on a dark charcoal slate table in a bright, airy studio, with a softly blurred window and green plants behind it. Inside: living green moss, miniature ferns, mossy stones and a few small plants. Soft warm morning side light, translucent glass with clean highlights, pale sage and lime greens, subtle natural shadows, shallow depth of field, fine film grain, calm editorial color grading. Camera at eye level, straight-on, slightly above the jar, centered composition, the whole jar visible, generous negative space at the top and bottom. No person, no hands, no text, no logo, no UI, no border, no watermark. Young. Moss is spreading across the soil, a few small fern fiddleheads are unfurling, one tiny mushroom and one closed flower bud are visible. Sparse but alive. Same jar, same table, same camera, same light.
```

## 负向提示词（单独填，或接在正向后面）

```text
text, letters, numbers, logo, watermark, UI, interface, border, frame, collage, multiple jars, different jar, different table, different camera angle, top-down view, hands, person, cartoon, illustration, 3D render, plastic plant, toy, oversaturated, HDR, low resolution, blurry, deformed leaves
```

## 放图

生成后覆盖到 `src/renderer/overlay/assets/garden/light/stage-1.jpg`，重启应用即可。
