# Garden plate assets

The overlay is a 5-stage photo sequence. It crossfades between plates as the
garden grows; typing also triggers a small pulse, spores and weather particles.

## Drop-in paths

```
src/renderer/overlay/assets/garden/
  light/
    stage-0.jpg   # sparse, just planted
    stage-1.jpg
    stage-2.jpg
    stage-3.jpg
    stage-4.jpg   # lush, fully grown
  dark/
    stage-0.jpg
    ...
    stage-4.jpg
  placeholder/     # temporary Pexels plates; delete or ignore
```

The renderer looks for assets in this order:

1. `light/stage-0..4`
2. `dark/stage-0..4`
3. `placeholder/light/...`
4. `placeholder/dark/...`

So you only need to generate one theme. If both are present, light wins.
`jpg`, `png` and `webp` are accepted; `.jpg` is preferred.

## Specs

- Aspect ratio: **2:3 vertical** (for example 1024×1536 or 1536×2304)
- Full-frame, no text, no UI, no border, no watermark
- Same camera, same jar, same light for all five stages
- Stage 0 → 4 increases plant density; the app crossfades between them
- Keep the important garden content in the central 80%: the overlay crops to
  220×280 with `object-fit: cover`
- sRGB, JPEG quality 90+

Per-image prompts (one complete standalone prompt per plate):

- Index: [`docs/garden-image-prompts.md`](../../../../../docs/garden-image-prompts.md)
- Single-image files: [`docs/prompts/`](../../../../../docs/prompts/) — `01-light-stage-0.md` … `10-dark-stage-4.md`

## Placeholder credits

The temporary plates in `placeholder/` are cropped from Pexels photographs:

- dark: Pexels photo **35451963** by Mr. Pugo
- light: Pexels photo **1400375**

Pexels license: <https://www.pexels.com/license/>. Replace these with your own
generated/commissioned art before shipping.
