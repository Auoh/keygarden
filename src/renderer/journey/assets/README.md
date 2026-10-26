# Mode B journey assets

The bottom travel strip loads optional generated art. Everything falls back to
the code-drawn landscape if a file is missing, so you can add assets
incrementally.

## Backgrounds

Six ultra-wide plates, one per route leg. The strip is `960×200`, so export at
**1920×400** (or any 24:5 image) with the horizon and path in the central band.

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

## Optional props

```
traveler/walk.png    # side-view walking traveler, transparent, 256×256+
props/camp.png       # tent + campfire, side view, transparent, 512×256+
```

If these are missing, the original silhouette traveler / code-drawn tent is
used. Transparent PNG is preferred. If your generator cannot output alpha, use
a flat chroma-key background and remove it before saving.

## Prompt pack

- Index: [`docs/journey-image-prompts.md`](../../../../docs/journey-image-prompts.md)
- Per-image: [`docs/journey-prompts/`](../../../../docs/journey-prompts/)
