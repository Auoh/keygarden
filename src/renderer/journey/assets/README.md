# Mode B journey assets

The bottom travel strip loads optional generated art. Everything falls back to
the code-drawn landscape if a file is missing, so you can add assets
incrementally.

## Backgrounds

Six ultra-wide plates, one per route leg. The strip is `960×200`, so the
prepared plates here are **1584×330** (exactly 24:5). The original cinematic
2.35:1 source is kept in [`docs/journey-source/`](../../../../docs/journey-source/)
and can be re-cropped with `scripts/prepare-journey-assets.py`.

```
backgrounds/
  00-mist-valley.jpg     # 雾之谷
  01-pine-slope.jpg      # 松针坡
  02-old-station.jpg     # 旧车站
  03-wind-plain.jpg      # 风蚀原
  04-star-lake.jpg       # 星见湖
  05-north-shore.jpg     # 北岸
```

- No traveler, tent, text, logo, UI or watermark
- Same side-on camera, horizon height and color grade across all six
- Leave the road/path empty so the overlay character can walk on it
- JPG, PNG or WebP; JPG quality 90+

The renderer crossfades to the next plate near the end of a leg.

## Props

```
traveler/walk.png    # walking traveler cutout, 369×655
props/camp.png       # tent + campfire cutout, 1028×495
```

The supplied `walk.jpg` / `camp.jpg` were chroma/white-background images, so
the PNGs here are cutouts with their backgrounds removed. If they are missing,
the original silhouette traveler / code-drawn tent is used.

## Prompt pack

- Index: [`docs/journey-image-prompts.md`](../../../../docs/journey-image-prompts.md)
- Per-image: [`docs/journey-prompts/`](../../../../docs/journey-prompts/)
- Traveler states (walk-b / camp-sit / rest / arrive / rain): [`docs/journey-character-prompts.md`](../../../../docs/journey-character-prompts.md)
