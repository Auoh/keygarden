# 图 05 · 浅色 · 晨光 / 完全长成

**目标文件**：`src/renderer/overlay/assets/garden/light/stage-4.jpg`  
**规格**：2:3 vertical, 848×1264 or larger, sRGB, JPEG quality 90+. The final overlay crops to 220×280, so keep the jar and plants inside the central 80%.

> **2026-10-27 修复：** 当前 `stage-4.jpg` 的瓶子被放大、桌面变成浅色石板、背景变成白墙，和 0–3 不是同一张照片。这一张必须从 `light/stage-3.jpg` 做参考图/局部重绘，不能只靠文字重新生成。完整审计见 [asset-audit-2026-10-27.md](../asset-audit-2026-10-27.md)。

## 正向提示词（复制这一段）

```text
Use the attached light/stage-3.jpg as the exact reference image. Keep the glass jar, cork lid, camera distance, framing, dark charcoal slate table, softly blurred window and green plant background, side-light direction, shadows, color grade, depth of field and film grain 100% unchanged. Only repaint the interior of the jar: a fully grown, lush terrarium with a dense moss floor, taller layered ferns, small pale pink and white flowers, three or four small brown mushrooms, dew on leaves, light condensation on the inside of the glass, and two or three tiny warm fireflies. Keep every plant below the jar shoulder and inside the glass; do not change the jar silhouette, cork, table, backdrop or camera. Photorealistic macro photograph, vertical 2:3, 848x1264, same lens and exposure as the reference.
```

## 负向提示词（单独填，或接在正向后面）

```text
zoomed in, zoomed out, larger jar, smaller jar, different jar, no cork, open jar, different cork, different table, pale plaster table, white stone table, different background, white wall, pots, shelves, paint brushes, different window, different lighting, different shadows, new props, person, hands, text, watermark, logo, UI, border, multiple jars, cartoon, illustration, 3D render, oversaturated, blurry, deformed leaves
```

## 放图

1. 打开 `src/renderer/overlay/assets/garden/light/stage-3.jpg` 作为参考图。
2. 只框选瓶口以内的植物区域做蒙版；瓶子、软木塞、桌面、背景都不要选。
3. 用上面的 prompt 做局部重绘（inpainting），denoise 0.45–0.55，固定 seed。
4. 把蒙版外的像素用 stage-3 原图贴回，确保桌面/背景/瓶身完全没变。
5. 导出 848×1264 或更高，覆盖 `light/stage-4.jpg`，重启应用。
