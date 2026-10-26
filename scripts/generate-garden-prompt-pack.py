from pathlib import Path
from textwrap import dedent

ROOT = Path(r"D:\codex\keyboardgame")
DOCS = ROOT / "docs"
PROMPTS = DOCS / "prompts"

LIGHT_STYLE = (
    "Photorealistic macro photograph of a small hand-blown glass terrarium, vertical 2:3 composition. "
    "The jar sits on a pale plaster stone surface in a bright, airy studio. Inside: living green moss, "
    "miniature ferns, mossy stones and a few small plants. Soft warm morning side light, translucent "
    "glass with clean highlights, pale sage and lime greens, subtle natural shadows, shallow depth of "
    "field, fine film grain, calm editorial color grading. Camera at eye level, straight-on, slightly "
    "above the jar, centered composition, the whole jar visible, generous negative space at the top "
    "and bottom. No person, no hands, no text, no logo, no UI, no border, no watermark."
)

DARK_STYLE = (
    "Photorealistic macro photograph of a small hand-blown glass terrarium, vertical 2:3 composition. "
    "The jar sits on dark charcoal stone in a low-key studio. Inside: living green moss, miniature "
    "ferns, mossy stones and a few small plants. Cinematic side light, deep forest-green shadows, "
    "a few warm amber highlights, condensation on the glass, shallow depth of field, fine film grain, "
    "natural moody color grading. Camera at eye level, straight-on, slightly above the jar, centered "
    "composition, the whole jar visible, generous negative space at the top and bottom. No person, "
    "no hands, no text, no logo, no UI, no border, no watermark."
)

STAGES = [
    (
        "stage-0",
        "刚种下",
        "Newly planted. About 70% bare dark soil, only a few small moss patches, two tiny sprouts "
        "with thin stems and one closed bud. No open flowers, no mushroom. Very sparse, fragile, "
        "just after planting. Same jar, same table, same camera, same light.",
    ),
    (
        "stage-1",
        "发芽",
        "Young. Moss is spreading across the soil, a few small fern fiddleheads are unfurling, one "
        "tiny mushroom and one closed flower bud are visible. Sparse but alive. Same jar, same table, "
        "same camera, same light.",
    ),
    (
        "stage-2",
        "长起来",
        "Establishing. A moss carpet covers about half of the floor, ferns are opening, one small "
        "flower is open, one mushroom is visible. Medium density. Same jar, same table, same camera, "
        "same light.",
    ),
    (
        "stage-3",
        "茂盛",
        "Lush. Dense moss carpet, layered ferns, several mushrooms and flowers, dew on the leaves, "
        "light condensation on the glass. Rich and healthy. Same jar, same table, same camera, same light.",
    ),
    (
        "stage-4",
        "完全长成",
        "Fully grown. Very lush layered terrarium, ferns at different heights, moss covering the floor, "
        "several flowers and mushrooms, heavy dew and condensation, two or three tiny fireflies. "
        "Cinematic and alive, still the same jar and camera.",
    ),
]

NEGATIVE = (
    "text, letters, numbers, logo, watermark, UI, interface, border, frame, collage, multiple jars, "
    "different jar, different table, different camera angle, top-down view, hands, person, cartoon, "
    "illustration, 3D render, plastic plant, toy, oversaturated, HDR, low resolution, blurry, "
    "deformed leaves"
)

SPEC = (
    "2:3 vertical, 1024×1536 or 1536×2304, sRGB, JPEG quality 90+. "
    "The final overlay crops to 220×280, so keep the jar and plants inside the central 80%."
)

IMAGES = []
for mode, style, theme_label in [
    ("light", LIGHT_STYLE, "浅色 · 晨光"),
    ("dark", DARK_STYLE, "深色 · 苔夜"),
]:
    for stage, stage_label, stage_text in STAGES:
        index = len(IMAGES) + 1
        IMAGES.append(
            {
                "index": index,
                "mode": mode,
                "theme": theme_label,
                "stage": stage,
                "stage_label": stage_label,
                "prompt": f"{style} {stage_text}",
                "path": f"{mode}/{stage}.jpg",
                "slug": f"{index:02d}-{mode}-{stage}",
            }
        )


def prompt_file(image):
    return dedent(
        f"""\
        # 图 {image['index']:02d} · {image['theme']} / {image['stage_label']}

        **目标文件**：`src/renderer/overlay/assets/garden/{image['path']}`  
        **规格**：{SPEC}

        ## 正向提示词（复制这一段）

        ```text
        {image['prompt']}
        ```

        ## 负向提示词（单独填，或接在正向后面）

        ```text
        {NEGATIVE}
        ```

        ## 放图

        生成后覆盖到 `src/renderer/overlay/assets/garden/{image['path']}`，重启应用即可。
        """
    )


def main_doc():
    rows = "\n".join(
        f"| 图 {image['index']:02d} | {image['theme']} | `{image['path']}` | [{image['stage_label']}](prompts/{image['slug']}.md) |"
        for image in IMAGES
    )
    sections = []
    for image in IMAGES:
        sections.append(
            dedent(
                f"""\
                ## 图 {image['index']:02d} · {image['theme']} / {image['stage_label']}

                **目标文件**：`src/renderer/overlay/assets/garden/{image['path']}`  
                **规格**：{SPEC}

                ### 正向提示词（复制这一段）

                ```text
                {image['prompt']}
                ```

                ### 负向提示词（单独填，或接在正向后面）

                ```text
                {NEGATIVE}
                ```

                > 单图文件：[prompts/{image['slug']}.md](prompts/{image['slug']}.md)
                """
            )
        )

    doc = dedent(
        f"""\
        # 键息花园 · 右下角生长贴图提示词（按图拆分）

        这份文档按 **一张图 = 一条完整提示词** 组织。每条都已经包含风格、机位、画幅、阶段描述和“不要文字/UI”的约束，不再需要从基础段拼接。

        ## 先看清单

        运行时完整一套是 10 张整幅生态瓶照片：

        | 图 | 主题 | 文件 | 阶段 |
        |---|---|---|---|
        {rows}

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

        10 张里同一个主题的 5 张，必须是同一个瓶子、同一张桌面、同一个机位、同一束光。先生成 `stage-4` 作为主参考，再用图生图依次做 `stage-3 → stage-2 → stage-1 → stage-0`；每张只改植物密度，强调：

        `same jar, same table, same camera, same lighting, same composition; only the plant density changes.`

        图生图 denoise 建议 `0.35–0.55`。不要中途换模型、画幅或风格。

        ## 十条完整提示词

        {chr(10).join(sections)}

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
        """
    )
    lines = [line[8:] if line.startswith("        ") else line for line in doc.splitlines()]
    return "\n".join(lines) + "\n"


def main():
    PROMPTS.mkdir(parents=True, exist_ok=True)
    for image in IMAGES:
        (PROMPTS / f"{image['slug']}.md").write_text(prompt_file(image), encoding="utf-8")
    (DOCS / "garden-image-prompts.md").write_text(main_doc(), encoding="utf-8")
    print(f"wrote {len(IMAGES)} prompt files")
    for image in IMAGES:
        print(image["index"], image["theme"], image["path"], image["slug"])


if __name__ == "__main__":
    main()
