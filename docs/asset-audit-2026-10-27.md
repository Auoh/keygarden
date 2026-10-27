# 贴图一致性审计与修复提示词

日期：2026-10-27  
范围：A 键息花园（浅色 / 深色）、B 桌边远行（背景、旅人、营地）、C 键盘小镇（未开始）  
目的：先统一判断哪些图要重做；再给出一套**不靠“每次都重新描述”**的提示词与生成流程，保证前后是同一个瓶子、同一个人、同一套镜头。

---

## 一、结论先行

| 优先级 | 资产 | 判断 | 处理 |
|---|---|---|---|
| **P0** | A 浅色 `stage-4.jpg` | **必须重做** | 瓶子放大约 15–20%，桌面从深灰石板变成浅色石板，背景从窗边植物变成白墙/陶盆，和 0–3 明显不是同一张照片 |
| **P0** | B 旅人六状态 | **需要统一重做** | `arrive` 明显更瘦、`walk-b` 背包比例不同、`camp-sit` 多出树桩和第二个背包；目前靠“高度 54px”掩盖，放大看会穿帮 |
| **P1** | B `camp.png` | **建议重做（可选）** | 帐篷/火是插画质感，六个背景是电影感照片；放在一起像两个图层 |
| **P1** | B 六张背景 | **保留，但需固定规格** | 当前是 2.35:1，运行时裁成 4.8:1；画面能用，但上下被裁掉约一半。以后重做必须直接出 24:5 |
| **P1** | B `05-north-shore` | **可选** | 它是“第一缕晨光”，比前五张亮很多；如果北岸代表旅程终点，这样是成立的；如果希望全程蓝调，需要重做 |
| **保留** | A 浅色 0–3 | 好 | 同一只瓶子、同一张石板桌、同一扇窗、同一侧光，可继续用 |
| **保留** | A 深色 0–4 | 好 | 五张的瓶子、黑石板、暗背景、机位基本一致；stage-4 的蓝绿荧光是阶段变化，不算穿帮 |
| **保留** | B 背景 00–04 | 可用 | 电影感、蓝调、暖色点光一致；按焦点裁切后没有明显镜头跳变 |
| **保留** | B `walk` / `rest` / `walk-rain` | 可用 | 身份基本稳定；雨天长大衣属于“天气状态”，可接受 |
| **未开始** | C 键盘小镇 | 无贴图 | 还没有可审计的素材 |

**一句话：** 真正必须修的是 **A 浅色 stage-4** 和 **B 旅人整套状态图**；营地是“建议升级”，背景是“下次按规格生成”，其余先不要动。

---

## 二、逐项证据

### A · 浅色 0–3（保留）

- 同一只带软木塞的宽口玻璃瓶，瓶口在画面上部约 12% 处，瓶底在约 82% 处。
- 同一块深灰石板桌，桌子边缘、投影方向、窗边植物背景一致。
- 同一侧逆光，玻璃高光位置一致；植物从稀疏到茂盛，是同一场景内的时间变化。
- 结论：可作为 A 浅色的**基准序列**。

### A · 浅色 stage-4（必须重做）

- 瓶子明显更大：瓶口更靠上、瓶身更宽，视觉上像把镜头推近了 15–20%。
- 桌面从深灰石板变成浅色石板，桌沿形状和投影都不同。
- 背景从“窗 + 绿植 + 画笔”变成“白墙 + 陶盆 + 木架”，景深关系也变了。
- 结果：A 模式从 stage-3 交叉淡化到 stage-4 时，会同时发生“植物长满 + 镜头推近 + 换桌子 + 换房间”四种变化。
- **更隐蔽的根因：** 现有浅色提示词写的是 `pale plaster stone surface`（浅色石膏石板），而 0–3 实拍是**深灰石板**。stage-4 基本照着这句错误描述生成，所以桌子和整体亮度都变了。这说明不能只改图，还要把“已批准素材的事实描述”反过来写回提示词。
- 结论：**只重做 `light/stage-4.jpg`**，0–3 不要重做，否则会引入新的漂移。

### A · 深色 0–4（保留）

- 五张都是同一只无软木塞的玻璃瓶、黑石板、暗绿背景、同一侧光。
- 瓶口/瓶底位置基本一致；stage-4 的蓝绿荧光是“夜晚长成”的阶段效果，可以保留。
- 结论：不改；如果以后要统一“有塞/无塞”，再整套重做，不要单改一张。

### B · 旅人六状态（需要统一）

| 文件 | 问题 | 影响 |
|---|---|---|
| `walk.png` | 基准；低分辨率裁切（369×655） | 作为参考可以，但不要再用它继续抠新图 |
| `walk-b.png` | 背包更大、身体略壮；和 `walk` 不是严格的反向步态 | 两帧交替时有轻微“换人”感 |
| `rest.png` | 站姿略僵，但身份接近 | 可用 |
| `arrive.png` | 身体明显更瘦、背包更小 | 同一高度下像另一个角色 |
| `walk-rain.png` | 长大衣改变了整体轮廓 | 作为雨天限定可以接受；但不要让它成为主行走图 |
| `camp-sit.png` | 多出树桩和第二个背包；人物戴着包坐着 | 48px 下树桩/第二只包会变成一团黑块 |

**根因：** 这些图是分别用“文字描述 + 同一段风格词”生成的，模型每次都会重新解释“背包多大、帽子多宽、身体多瘦”。只靠提示词无法完全锁死身份，必须用**参考图 / 角色设定图**。

### B · 营地（建议升级）

- 帐篷和火是干净的插画，边缘和色块很整；背景是照片，颗粒、光影、景深都不同。
- 在 58px 高度下还能接受，但用户一旦放大看，会看出“贴纸感”。
- 结论：不是 bug；如果追求统一，重做一张**照片质感、透明背景、无投影**的帐篷 + 火。

### B · 六张背景（保留，固定规格）

- 当前源图 1584×672（2.35:1），运行时按焦点裁成 1584×330（24:5）；视觉上可用，但上下被裁掉约一半。
- 六张的镜头、地平线、蓝调、暖色点光基本一致；`05-north-shore` 是晨光，亮度最高，作为终点是合理的。
- 以后重做时直接出 **1920×400（24:5）**，重要内容放在中间 70% 高度内；不要先生成 2.35 再裁。
- 结论：**本轮不重做六张背景**；只在重做北岸或新增场景时使用下面的 Style Lock。

### C · 键盘小镇

- 目前没有正式贴图；只有模式卡和占位。等开始做时，直接复用本文件的“参考图 + 固定画布”流程。

---

## 三、为什么之前的提示词没有锁住一致性

现在的提示词都写了 “same jar / same character / same camera”，但这是**文字约束**，不是**像素约束**。模型每次生成都会重新发明：

- 瓶子：瓶肩弧度、瓶口厚度、软木塞高度、桌面材质；
- 角色：背包体积、帽子宽度、腿长、站姿重心；
- 背景：窗、陶盆、白墙、光源方向。

只改 prompt 不能保证前后一致。要保证一致性，必须做下面四件事：

1. **先做一个被批准的基准图（master）**，不要五张并行生成。
2. **用参考图 / 图生图 / 局部重绘**，让模型只改“应该变的部分”。
3. **锁定画布、机位、角色占比、脚底基线**；不要生成后随手裁切。
4. **固定 seed / 模型 / 采样器 / 画幅**；一次只改一个变量，批准后再做下一张。

> 最可靠的方式不是“把提示词写得更长”，而是：**参考图 + 蒙版 + 低 denoise + 固定 seed**。

---

## 四、A 修复：只重做浅色 stage-4

### 4.0 以已批准素材为准的 Canonical 描述

不要再沿用旧提示词里的 `pale plaster stone surface`。浅色 0–3 的事实是：

- 透明玻璃罐，**软木塞**，瓶口较宽；
- **深灰/炭灰石板桌**，石板边缘有自然崩边；
- 背景是**窗边 + 模糊绿植 + 画笔/工作台**，不是白墙；
- 暖色晨光从画面**左上/左侧**来，玻璃高光偏左；
- 2:3 竖构图，瓶底约在画面 82%，瓶口约 12%，主体居中。

以后写任何浅色 stage prompt，都先复制这段事实，再写植物变化。

### 4.1 推荐流程（最稳）

1. 打开 `src/renderer/overlay/assets/garden/light/stage-3.jpg` 作为参考图。
2. 在图片编辑/生成工具里，只框选**瓶口以内的植物区域**作为蒙版；瓶子、软木塞、桌面、背景全部不选。
3. 用下面的 prompt 做局部重绘（inpainting），denoise **0.45–0.55**；固定 seed。
4. 生成后把蒙版外的像素**原样贴回 stage-3**，确保桌子/背景/瓶身像素完全没变。
5. 导出 848×1264 或更高、2:3、JPG 90+，覆盖 `light/stage-4.jpg`。
6. 把 stage-3 和 stage-4 以 50% 透明度叠在一起检查：瓶口、瓶底、桌沿必须对齐。

### 4.2 正向提示词（复制）

```text
Use the attached light/stage-3.jpg as the exact reference image. Keep the glass jar, cork lid, camera distance, framing, slate table, window and plant background, side-light direction, shadows, color grade, depth of field and film grain 100% unchanged. Only repaint the interior of the jar: a fully grown, lush terrarium with a dense moss floor, taller layered ferns, small pale pink and white flowers, three or four small brown mushrooms, dew on leaves, light condensation on the inside of the glass, and two or three tiny warm fireflies. Keep every plant below the jar shoulder and inside the glass; do not change the jar silhouette, cork, table, backdrop or camera. Photorealistic macro photograph, vertical 2:3, 848x1264, same lens and exposure as the reference.
```

### 4.3 负向提示词

```text
zoomed in, zoomed out, larger jar, smaller jar, different jar, no cork, open jar, different cork, different table, pale stone table, white table, different background, white wall, pots, shelves, paint brushes, different window, different lighting, different shadows, new props, person, hands, text, watermark, logo, UI, border, multiple jars, cartoon, illustration, 3D render, oversaturated, blurry, deformed leaves
```

### 4.4 如果工具不支持蒙版

不要直接整图重生成。至少要做这两步：

- 用 stage-3 做 **image-to-image**，denoise ≤ 0.35，让构图基本不动；
- 生成后只取瓶内区域，瓶外全部用 stage-3 原图像素合成。

否则会重复现在的问题：瓶子、桌子、背景一起变。

---

## 五、B 修复：先做一张“角色设定图”，再从它派生六状态

### 5.1 为什么先做设定图

分别生成六张，模型会分别决定“这个人长什么样”。正确顺序是：

1. 先用 `walk.png` 作为身份参考，生成一张**六姿态角色设定图**（同一张画布、同一比例、同一脚底基线）。
2. 批准这张设定图；它成为后续唯一的身份参考。
3. 从设定图裁出六个格子，或用它作为 reference 分别重绘；每次只改姿态。
4. 所有图统一去背、统一裁切到同一高度，再放入 `assets/traveler/`。

### 5.2 角色设定图提示词（主方案，复制）

```text
Character reference sheet, 3 columns by 2 rows, 1536x1024, solid chroma green background (#00B140), six full-body side-view poses of the exact same traveler, all facing right, all at identical scale, all with feet on the same baseline, each pose centered in its cell and occupying about 78% of the cell height. The character is a slim hiker in a matte near-black silhouette (#0A0B0C), with a thin warm amber rim light (#D9A05B) only along the top and back edges of the cap, backpack, shoulders, arms, legs and trekking pole. No facial features, no skin, no interior clothing detail, no texture, no cast shadow, no ground, no border, no text, no logo, no extra objects except the single trekking pole and the small log in the last pose. Same cap, same single large backpack with a side pocket and a rolled mat on top, same boots, same trekking pole in every pose. The six poses, left to right, top to bottom: (1) walk A, left leg forward; (2) walk B, right leg forward, opposite arm swing, otherwise identical; (3) rest, standing still with weight on the back leg and both hands on a planted pole; (4) arrive, one hand on hip, pole planted, chest open; (5) rain walk, shoulders slightly hunched, head lowered, long coat hem lifted by wind; (6) camp sit, seated on a small low log, forearms on knees, pole across the lap, wearing the same single backpack, no second backpack, no tent, no campfire, no ground. Clean cutout-ready edges, no green fringe.
```

**输出后：** 先按绿幕抠成透明 PNG，再把六格拆成 `walk.png`、`walk-b.png`、`rest.png`、`arrive.png`、`walk-rain.png`、`camp-sit.png`；每格统一裁到同一高度和脚底基线。不要直接把整张设定图塞进应用。

### 5.3 负向提示词

```text
different character, different body proportions, different backpack, second backpack, extra bag, duffel bag, tent, campfire, ground, floor, shadow, cast shadow, scenery, background gradient, white background, text, watermark, logo, UI, frame, border, grid lines, multiple characters per cell, front view, three-quarter view, perspective, motion blur, soft blurry edges, white outline, gray fill, skin, face, facial features, extra limbs, extra fingers, umbrella, hood, different hat, different boots, cropped feet, cropped head
```

### 5.4 如果模型做不了六宫格

按下面的顺序一张一张做，但**每一张都必须带同一张已批准的设定图/`walk.png` 作为 reference**，不要只用文字：

1. `walk-b`：只改腿和手臂，背包、帽子、杖长不变。
2. `rest`：只改重心，脚仍在地面。
3. `arrive`：只改手和胸廓，身体宽度不能变。
4. `walk-rain`：只加“缩肩 + 大衣下摆”，其他不变。
5. `camp-sit`：只改坐姿；**只保留一个背包**，树桩可以保留作为坐具，但不要帐篷/火/地面。

每张生成后叠在 `walk.png` 上检查：帽顶、背包最高点、脚底基线误差不超过 2%。

### 5.5 单张 `camp-sit` 修正提示词

如果只想先修最明显的 `camp-sit.png`，用这段：

```text
Use the attached walk.png as the exact character reference. One full-body side-view silhouette of the same traveler, facing right, seated on a small low log, forearms resting on the knees, leaning slightly forward toward a campfire off-frame to the right, trekking pole laid across the lap. Same cap, same single large backpack worn on the back, same boots, same body proportions. Only one backpack; no second bag on the ground; no tent, no campfire, no ground plane, no cast shadow, no text. Matte near-black silhouette #0A0B0C with a thin warm amber rim light #D9A05B on the top and back edges only. Solid chroma green background #00B140, 1024x1024, character and log centered, feet/lower log near the bottom margin, clean cutout edges.
```

负向提示词沿用 5.3，另外加上：

```text
two backpacks, second bag, ground bag, backpack leaning on log, tent, fire, rocks, grass, floor
```

**合成建议：** 保留树桩作为“坐具”，但不要让树桩比人物还宽；代码里 `camp-sit` 高度为 48px，放在帐篷左前方，脚底和帐篷底边对齐。

---

## 六、B 可选修复：照片质感营地

如果觉得现在的插画营地和照片背景不搭，重做 `props/camp.png`。目标是**只有帐篷 + 火，没有人物、地面、投影**。

```text
A small two-person canvas tent with a warm interior glow, beside a low campfire with small orange flames and dark stones, three-quarter side view, cinematic blue-hour photographic style, deep teal shadows and restrained warm amber light, isolated on a solid chroma green background (#00B140), no person, no ground plane, no cast shadow, no long shadow, no text, no logo, no UI, 1024x512, object centered with 8% padding, clean cutout-ready edges, same lens and grain as a 35mm night landscape photograph.
```

负向提示词：

```text
person, traveler, hands, ground, floor, grass, rocks outside the fire ring, shadow, reflection, white background, gray background, text, watermark, logo, UI, frame, border, cartoon, illustration, 3D render, low resolution, blurry, extra tents, multiple campfires
```

生成后先按绿幕抠成透明 PNG，再放到 `src/renderer/journey/assets/props/camp.png`，保持文件名不变；代码会按 58px 高度绘制。没有抠图条件时，也可以直接给一张白底图，由 `scripts/prepare-journey-assets.py` 处理。

---

## 七、B 背景：保留本轮，未来按 24:5 生成

### 7.1 统一 Style Lock

以后新增/重做背景，把下面这段**原样**放在每条 prompt 最前面，只改最后一句场景描述：

```text
STYLE LOCK: cinematic ultra-wide matte photograph for a quiet desktop ambient game, exact 24:5 aspect, 1920x400, static side-on camera at human eye level, horizon at 55-60% of frame height, an empty dirt path in the lower third, deep teal and desaturated green palette with restrained warm amber highlights, soft volumetric fog, fine 35mm film grain, natural contrast, painterly-photoreal detail, composition safe for a 960x200 bottom strip with all important content inside the central 70% height. No people, no traveler, no tent, no campfire, no text, no letters, no numbers, no logo, no UI, no border, no watermark.
```

然后接场景句，例如：

```text
A low misty valley at blue hour, layered pine silhouettes, a pale moon behind fog, a narrow path disappearing into mist.
```

### 7.2 北岸（可选重做）

当前 `05-north-shore` 是晨光，和前五张的夜晚/黄昏不同。如果这是“旅程终点”的刻意设计，保留；如果要统一成蓝调，用：

```text
[STYLE LOCK]
A cold northern shoreline just before dawn, low dark cliffs, a single small cabin window with warm light, pale amber only on the horizon, deep blue mist over the sea, wet stones and a narrow coastal path. Not daylight, not sunny, no bright cyan sky. The end of a long walk, quiet and cold.
```

### 7.3 画幅说明

- 目标：**1920×400（24:5）**；如果模型只能出 2.35:1，允许生成 1584×672 后按焦点裁成 1584×330，但这是补救，不是标准。
- 重要内容（地平线、路、房子、月亮）放在画面中间 70% 高度内；因为 4.8:1 裁切会切掉上下。
- 六张保持同一地平线高度、同一调色、同一颗粒；不要一张白天一张黑夜。

---

## 八、执行顺序（建议）

1. **先修 A 浅色 stage-4**：它是玩家每天都会看到的收工画面，收益最高。
2. **再做 B 角色设定图**：先批准一张六姿态图，再派生；不要六张并行。
3. **B 营地**：有时间再做照片质感版；没有就保留插画，至少不崩。
4. **B 背景**：本轮不动；下次新增场景时用 Style Lock + 24:5。
5. 全部替换后，用 960×200 / 220×280 各看一遍，再做一次 0→4 / 行走→扎营的切换录屏。

---

## 九、验收清单

### A

- [ ] 浅色 stage-4 的瓶口、瓶底、桌沿和 stage-3 对齐（50% 叠图误差 < 2%）
- [ ] 桌面材质、背景、光向没有变
- [ ] stage-3 → stage-4 只发生“植物更满”，没有镜头推近
- [ ] 深色 0–4 没有被误改

### B 旅人

- [ ] 六个状态是同一张脸/同一顶帽子/同一个背包/同一根杖（剪影层面）
- [ ] 帽顶、背包最高点、脚底基线在 54px 下误差 < 2%
- [ ] `camp-sit` 只有一个背包，没有帐篷/火/地面
- [ ] 所有图面向右、脚底朝下、无投影、无文字
- [ ] 缩到 54px 后，`arrive` 不会看起来像另一个人

### B 背景 / 营地

- [ ] 六张地平线高度一致；没有一张突然变成白天
- [ ] 重要内容在中间 70% 高度内，裁成 960×200 不丢主体
- [ ] 营地 58px 高度下不遮住火光，不出现白色描边
- [ ] 人物脚底和道路/营地底边有接触感，不悬浮

---

## 十、相关文件

- 现有 A 提示词：[garden-image-prompts.md](garden-image-prompts.md)
- 现有 B 背景提示词：[journey-image-prompts.md](journey-image-prompts.md)
- 现有 B 旅人提示词：[journey-character-prompts.md](journey-character-prompts.md)
- A 浅色当前图：`src/renderer/overlay/assets/garden/light/stage-0.jpg` … `stage-4.jpg`
- B 当前图：`src/renderer/journey/assets/backgrounds/`、`traveler/`、`props/`
- 处理脚本：`scripts/prepare-journey-assets.py`
