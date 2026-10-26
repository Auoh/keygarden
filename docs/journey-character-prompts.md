# 桌边远行 · 旅人状态与提示词

这份文档只解决一件事：**同一个旅人，在旅程里多几个可信的状态**，而不是每张图都重新设计一个角色。

现有的 `walk.png` 是基准：黑色剪影、暖琥珀色轮廓光、侧视、向右行走、背包 + 鸭舌帽 + 登山杖、没有五官和内部细节。下面的提示词全部以它为参考。

---

## 需要哪些状态

按优先级：

| 优先级 | 状态 | 文件名 | 触发时机 | 是否必须 |
|---|---|---|---|---|
| P0 | 行走第二帧 | `traveler/walk-b.png` | 行走时与 `walk.png` 交替，形成步态 | 推荐 |
| P0 | 营地坐姿 | `traveler/camp-sit.png` | 扎营后坐在火边，营地不再空 | 推荐 |
| P1 | 短休息 | `traveler/rest.png` | 停止输入 20 秒～5 分钟，尚未扎营 | 推荐 |
| P2 | 到达地标 | `traveler/arrive.png` | 路段进度 90%～100%，到达下一站 | 可选 |
| P2 | 雨天行走 | `traveler/rain.png` | 雨天，略微缩肩、压低重心 | 可选 |

**结论：** 当前主循环最低只需要 `walk` + 营地；但要让“他在赶路”这件事成立，最值得补的是 **walk-b（步态）** 和 **camp-sit（营地有人）**。`rest` 次之，`arrive` / `rain` 属于锦上添花。

> 现在代码只加载 `walk.png` 和 `camp.png`。上面的新状态图产好后，我再把画布状态机接上：行走交替、停留/扎营切换、到站停顿。

---

## 共同约束：风格连贯性

每张图都必须满足：

- **同一个角色**：侧视、面向右、全身；鸭舌帽、双肩包、背包侧袋、登山杖、短靴
- **同样的剪影**：纯黑填充（约 `#0A0B0C`），不画衣服纹理、不画脸、不画五官
- **同样的轮廓光**：只在头顶、帽檐、背包上缘、肩、手臂外侧、腿后缘有一圈暖琥珀色（约 `#D9A05B`），宽 1～2px；左侧不要描边
- **同样的比例**：约 6.5 头身；背包宽度约为躯干宽的 1.6 倍；登山杖长度约等于身高
- **同样的机位**：平视、正侧视、没有透视缩短
- **同样的输出**：1024×1024，角色占画面高度约 75～80%，脚底在画面底部约 88% 处，居中
- **透明背景**；如果模型不支持透明，用纯绿幕 `#00FF00` 生成，再抠图
- **不要投影、地面、文字、边框、场景**；人物单独一张，背景由 B 模式提供

### 通用负面提示词

```text
photorealistic, 3D render, colored clothing, visible face, facial features, skin, hair, extra limbs, extra fingers, different backpack, different hat, hood, umbrella, shadow, ground, floor, scenery, background gradient, text, watermark, frame, multiple characters, front view, three-quarter view, perspective, motion blur, soft blurry edges, white outline, gray fill, interior highlights, logo
```

---

## P0 · 行走第二帧 `walk-b.png`

用途：和 `walk.png` 每 0.28～0.35 秒交替一次。两张图的**脚底位置、角色高度、背包和帽子**必须完全一致，只换腿和手臂。

```text
A single full-body side-view silhouette of the same traveler as the reference image: a slim hiker facing right, black matte silhouette (#0A0B0C), thin warm amber rim light (#D9A05B) only along the top and back edges of the cap, backpack, shoulders, arms, legs and trekking pole, no facial features, no interior detail, no texture, no cast shadow, no ground, clean vector-like edges, transparent background, 1024x1024, character occupies about 78% of the frame height, feet near the bottom margin, centered.

Pose: the opposite walking stride to the reference — left leg forward and planted, right leg trailing behind, right arm forward gripping the trekking pole, left arm relaxed at the side, torso upright with a slight forward lean. Same cap, same backpack with side pocket and rolled mat, same pole length, same boot shape, same body proportions. The character must read as the same person as the reference, only the gait phase changes.
```

**检查点：** 与 `walk.png` 叠在一起时，帽顶、背包最高点、脚底高度误差不超过 2%；不能出现“另一个人”。

---

## P0 · 营地坐姿 `camp-sit.png`

用途：扎营后把人物放在帐篷和火堆旁。**不要画帐篷、火、地面**，这些已经在 `camp.png` 里。

```text
A single full-body side-view silhouette of the same traveler as the reference image: a slim hiker facing right, black matte silhouette (#0A0B0C), thin warm amber rim light (#D9A05B) along the top and back edges of the cap, backpack, shoulders, arms, legs and trekking pole, no facial features, no interior detail, no texture, no cast shadow, no ground, clean vector-like edges, transparent background, 1024x1024, character occupies about 62% of the frame height, centered.

Pose: seated on an unseen low log, side view facing right, knees bent and feet planted, forearms resting on the knees, leaning slightly forward toward a campfire off-frame at the right, trekking pole laid across the lap, backpack removed and leaning against the log behind the character. Same cap, same backpack shape, same boot shape, same body proportions. Relaxed, quiet, end-of-day posture; no standing, no walking.
```

**合成建议：** 把人物底边对齐到营地火堆左侧，人物高度约为帐篷高度的 55～65%；不要让人物挡住火光。

---

## P1 · 短休息 `rest.png`

用途：停止输入 20 秒到 5 分钟之间，人物站住，但仍“在路上”；超过 5 分钟才切营地。

```text
A single full-body side-view silhouette of the same traveler as the reference image: a slim hiker facing right, black matte silhouette (#0A0B0C), thin warm amber rim light (#D9A05B) along the top and back edges of the cap, backpack, shoulders, arms, legs and trekking pole, no facial features, no interior detail, no texture, no cast shadow, no ground, clean vector-like edges, transparent background, 1024x1024, character occupies about 78% of the frame height, feet near the bottom margin, centered.

Pose: standing still in side view facing right, weight on the back leg, front foot slightly forward and relaxed, trekking pole planted vertically in front, both hands resting on the pole grip, head lifted slightly as if looking at the horizon, shoulders dropped, backpack still on. Same cap, same backpack with side pocket and rolled mat, same pole length, same boot shape, same body proportions. A quiet breathing pause, not a walking pose, not sitting.
```

---

## P2 · 到达地标 `arrive.png`（可选）

用途：路段进度 90%～100%，人物在下一站前停一下，再切场景。没有这个状态也能用 `rest` 替代。

```text
A single full-body side-view silhouette of the same traveler as the reference image: a slim hiker facing right, black matte silhouette (#0A0B0C), thin warm amber rim light (#D9A05B) along the top and back edges of the cap, backpack, shoulders, arms, legs and trekking pole, no facial features, no interior detail, no texture, no cast shadow, no ground, clean vector-like edges, transparent background, 1024x1024, character occupies about 78% of the frame height, feet near the bottom margin, centered.

Pose: standing at the crest of a small rise, side view facing right, chest open, one hand on the hip, the other hand holding the trekking pole planted in front, head up looking into the distance, backpack on. Same cap, same backpack with side pocket and rolled mat, same pole length, same boot shape, same body proportions. A calm arrival pose, not walking, not sitting.
```

---

## P2 · 雨天行走 `rain.png`（可选）

用途：雨天。若不想增加一张图，也可以用现有 `walk.png` + 画布雨丝/压暗层，不一定要新图。

```text
A single full-body side-view silhouette of the same traveler as the reference image: a slim hiker facing right, black matte silhouette (#0A0B0C), thin warm amber rim light (#D9A05B) along the top and back edges of the cap, backpack, shoulders, arms, legs and trekking pole, no facial features, no interior detail, no texture, no cast shadow, no ground, clean vector-like edges, transparent background, 1024x1024, character occupies about 78% of the frame height, feet near the bottom margin, centered.

Pose: walking to the right through rain, shoulders slightly hunched, head lowered a little under the cap, leading with the trekking pole, backpack pulled close, coat hem slightly lifted by the wind. Same cap, same backpack with side pocket and rolled mat, same pole length, same boot shape, same body proportions. No umbrella, no hood, no visible rain, no puddles — the weather is added by the canvas.
```

---

## 生成顺序

1. 先用 `walk.png` 做 **image-to-image / character reference**，强度 0.35～0.5，保持剪影、背包、帽子、杖长不变
2. 先出 `walk-b`，确认与 `walk` 的脚底、头高、背包轮廓对齐
3. 再出 `camp-sit`（姿态变化最大，但身份特征要保留）
4. 最后出 `rest`；`arrive` / `rain` 有余力再做
5. 每张都输出绿幕版；抠图后检查边缘有没有绿边/白边
6. 所有图统一裁到角色外接框 + 8% 留白，保持脚底对齐

## 放图位置

```text
src/renderer/journey/assets/traveler/
  walk.png        # 已有
  walk-b.png      # 新
  rest.png        # 新
  camp-sit.png    # 新
  arrive.png      # 可选
  rain.png        # 可选
```

## 代码接入

接入时只改 `src/renderer/journey/journey-canvas.js` 的 `drawTraveler()`：

- 行走：`walk` / `walk-b` 按时间交替
- 短休息：`rest`
- 扎营：`camp` + `camp-sit`
- 到站：`arrive`
- 天气：`rain`，没有则继续用 `walk`

所有状态图都是可选的；文件缺失时继续用 `walk.png` 或代码剪影回退。位置仍由路段进度控制，不会因为换状态而回到固定点。
