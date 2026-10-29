from pathlib import Path
from textwrap import dedent

ROOT = Path(__file__).resolve().parent.parent
DOCS = ROOT / "docs"
PROMPTS = DOCS / "journey-prompts"

BACKGROUND_STYLE = (
    "Cinematic ultra-wide matte painting for a quiet desktop ambient game, 24:5 aspect, 1920×400. "
    "A side-on landscape at blue hour, horizon at 55%, an empty dirt path winding across the lower "
    "third, deep teal and desaturated greens, a few warm amber highlights, soft atmospheric depth, "
    "fine film grain, painterly photoreal detail. Camera at human eye level, static, side-on, "
    "composition designed for a 960×200 bottom screen strip. No people, no traveler, no tent, "
    "no text, no logo, no UI, no border, no watermark."
)

BACKGROUNDS = [
    (
        "00-mist-valley",
        "雾之谷",
        "A low misty valley at blue hour, layers of faint pine silhouettes, a pale moon behind the "
        "mist, a narrow path disappearing into fog. Quiet, cinematic, sparse.",
    ),
    (
        "01-pine-slope",
        "松针坡",
        "A steep pine-covered slope, needle-covered trail, broken amber late light through the "
        "trunks, a distant ridge fading into the evening. Calm, grounded.",
    ),
    (
        "02-old-station",
        "旧车站",
        "An abandoned rural railway station at dusk, a single warm lamp, old rails crossing the "
        "path, fog between the platform and the hills. Melancholic but safe.",
    ),
    (
        "03-wind-plain",
        "风蚀原",
        "A windswept open plain, long grass bending, scattered dark rocks, a storm front far away, "
        "cold blue-grey light with a thin band of amber on the horizon. Vast and quiet.",
    ),
    (
        "04-star-lake",
        "星见湖",
        "A still lake at night, reeds at the edge, a path following the shore, stars and a soft "
        "moon reflected in the water. Deep teal, almost silent.",
    ),
    (
        "05-north-shore",
        "北岸",
        "A cold northern shoreline at first light, low cliffs, a small distant cabin window, a pale "
        "amber dawn behind blue mist. The end of a long walk.",
    ),
]

NEGATIVE_BG = (
    "text, letters, numbers, logo, watermark, UI, interface, border, frame, collage, multiple "
    "panels, person, traveler, tent, campfire, vehicle, building interior, cartoon, illustration, "
    "3D render, low resolution, blurry, oversaturated, HDR, deformed trees"
)

NEGATIVE_SPRITE = (
    "background, landscape, ground, shadow, text, letters, logo, watermark, UI, border, frame, "
    "cartoon, chibi, face detail, low resolution, blurry, green screen fringe, extra limbs"
)

TRAVELER = (
    "A small side-view silhouette of a lone traveler with a backpack, walking pose, full body, "
    "matte near-black with a thin warm amber rim light, cinematic and restrained, isolated on a "
    "fully transparent background, PNG with alpha, 256×256, centered, no shadow, no ground, "
    "no text, no logo, no UI, no face detail. Designed to sit on a blue-hour landscape at about "
    "54 px tall without looking cartoonish."
)

CAMP = (
    "A small side-view canvas tent and a low campfire, cinematic blue-hour palette, warm fire glow "
    "on the tent edge, isolated on a fully transparent background, PNG with alpha, 512×256, "
    "centered, no person, no ground plane, no long shadow, no text, no logo, no UI, clean cutout, "
    "designed to sit on a blue-hour landscape at about 58 px tall."
)


def prompt_files():
    items = []
    for index, (slug, label, detail) in enumerate(BACKGROUNDS, 1):
        items.append(
            {
                "index": index,
                "kind": "background",
                "slug": f"{index:02d}-{slug}",
                "label": label,
                "path": f"backgrounds/{slug}.jpg",
                "positive": f"{BACKGROUND_STYLE} {detail}",
                "negative": NEGATIVE_BG,
                "spec": "24:5, 1920×400 recommended, JPG quality 90+. If your model cannot do 24:5, generate 16:9 and crop a 1920×400 band around the horizon/path.",
            }
        )
    items.append(
        {
            "index": 7,
            "kind": "sprite",
            "slug": "07-traveler-walk",
            "label": "旅人 · 行走",
            "path": "traveler/walk.png",
            "positive": TRAVELER,
            "negative": NEGATIVE_SPRITE,
            "spec": "256×256 or larger, transparent PNG. Side view facing right; the app draws it around 54 px tall.",
        }
    )
    items.append(
        {
            "index": 8,
            "kind": "sprite",
            "slug": "08-camp",
            "label": "扎营 · 帐篷与火",
            "path": "props/camp.png",
            "positive": CAMP,
            "negative": NEGATIVE_SPRITE,
            "spec": "512×256 or larger, transparent PNG. No person; the app draws it around 58 px tall.",
        }
    )
    return items


def one_file(item):
    return dedent(
        f"""\
        # 图 {item['index']:02d} · {item['label']}

        **目标文件**：`src/renderer/journey/assets/{item['path']}`  
        **规格**：{item['spec']}

        ## 正向提示词（复制这一段）

        ```text
        {item['positive']}
        ```

        ## 负向提示词（单独填，或接在正向后面）

        ```text
        {item['negative']}
        ```

        ## 放图

        生成后覆盖到 `src/renderer/journey/assets/{item['path']}`，重启应用即可。
        """
    )


def main_doc(items):
    rows = "\n".join(
        f"| 图 {item['index']:02d} | {item['label']} | `{item['path']}` | [单图](journey-prompts/{item['slug']}.md) |"
        for item in items
    )
    sections = []
    for item in items:
        sections.append(
            dedent(
                f"""\
                ## 图 {item['index']:02d} · {item['label']}

                **目标文件**：`src/renderer/journey/assets/{item['path']}`  
                **规格**：{item['spec']}

                ### 正向提示词（复制这一段）

                ```text
                {item['positive']}
                ```

                ### 负向提示词（单独填，或接在正向后面）

                ```text
                {item['negative']}
                ```

                > 单图文件：[journey-prompts/{item['slug']}.md](journey-prompts/{item['slug']}.md)
                """
            )
        )

    doc = dedent(
        f"""\
        # 桌边远行 · B 模式贴图提示词（按图拆分）

        这份文档按“一张图 = 一条完整提示词”组织。每条都已经包含风格、机位、画幅、场景描述和“不要文字/UI”的约束，不需要再拼接。

        ## 需要哪些图

        B 的底部风景带是 960×200；建议生成 6 张背景 + 2 个透明道具。只做背景也能明显提升画面，人物和营地会回退到代码绘制。

        | 图 | 内容 | 文件 | 提示词 |
        |---|---|---|---|
        {rows}

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

        {chr(10).join(sections)}

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
        """
    )
    lines = [line[8:] if line.startswith("        ") else line for line in doc.splitlines()]
    return "\n".join(lines) + "\n"


def main():
    PROMPTS.mkdir(parents=True, exist_ok=True)
    items = prompt_files()
    for item in items:
        (PROMPTS / f"{item['slug']}.md").write_text(one_file(item), encoding="utf-8")
    (DOCS / "journey-image-prompts.md").write_text(main_doc(items), encoding="utf-8")
    print(f"wrote {len(items)} journey prompt files")


if __name__ == "__main__":
    main()
