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
traveler/walk.png       # walking traveler cutout, 369×655
traveler/walk-b.png     # second walking frame, 560×998
traveler/rest.png       # standing rest pose, 531×939
traveler/arrive.png     # arrival pose, 416×893
traveler/walk-rain.png  # rain-coat walking pose, 554×911
props/camp.png          # tent + campfire cutout, 1028×495
traveler/camp-sit.png   # seated traveler with log, 762×928
```

The supplied `walk.jpg` / `camp.jpg` and the five state JPGs are
chroma/white-background images. The PNGs here are alpha cutouts with their
backgrounds removed; the originals live in
[`docs/journey-source/traveler/`](../../../../docs/journey-source/traveler/)
and can be rebuilt with `scripts/prepare-journey-assets.py`.

Runtime selection:

- walking: `walk.png` and `walk-b.png` alternate every ~0.42s
- resting: `rest.png` after 20s without keys (but before the 5min camp)
- arriving: `arrive.png` at 90% of a leg
- rain: `walk-rain.png` when the current weather is rain
- camp: `camp.png` plus `camp-sit.png`, with the seated figure in front of the tent

If any file is missing, the renderer keeps the previous image or falls back to
the original silhouette traveler / code-drawn tent. Adding a replacement with
the same filename requires no code change.

## Prompt pack

- Index: [`docs/journey-image-prompts.md`](../../../../docs/journey-image-prompts.md)
- Per-image: [`docs/journey-prompts/`](../../../../docs/journey-prompts/)
- Traveler states (walk-b / camp-sit / rest / arrive / rain): [`docs/journey-character-prompts.md`](../../../../docs/journey-character-prompts.md)
