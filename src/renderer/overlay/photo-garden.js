/* global window, document, Image, GardenView */
(() => {
  const WIDTH = 220;
  const HEIGHT = 280;
  const ASSET_ROOT = "assets/garden";
  const STAGE_COUNT = 5;
  const THEMES = ["light", "dark"];

  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

  function loadImage(src) {
    return new Promise((resolve) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => resolve(null);
      image.src = src;
    });
  }

  async function loadStage(theme, index) {
    const base = `${ASSET_ROOT}/${theme}/stage-${index}`;
    for (const extension of ["jpg", "png", "webp"]) {
      const image = await loadImage(`${base}.${extension}`);
      if (image) return image;
    }
    return null;
  }

  async function loadSet(theme) {
    const images = await Promise.all(Array.from({ length: STAGE_COUNT }, (_, index) => loadStage(theme, index)));
    return images.every(Boolean) ? images : null;
  }

  function drawCover(ctx, image, zoom) {
    const scale = Math.max(WIDTH / image.width, HEIGHT / image.height) * zoom;
    const width = image.width * scale;
    const height = image.height * scale;
    ctx.drawImage(image, (WIDTH - width) / 2, (HEIGHT - height) / 2, width, height);
  }

  function gradientFallback(ctx, theme) {
    const gradient = ctx.createLinearGradient(0, 0, 0, HEIGHT);
    if (theme === "light") {
      gradient.addColorStop(0, "#e8ece3");
      gradient.addColorStop(0.55, "#d7dfd1");
      gradient.addColorStop(1, "#b9c8b2");
    } else {
      gradient.addColorStop(0, "#07110e");
      gradient.addColorStop(0.55, "#0c1c15");
      gradient.addColorStop(1, "#13271c");
    }
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    const glow = ctx.createRadialGradient(164, 72, 2, 164, 72, 78);
    glow.addColorStop(0, theme === "light" ? "rgba(200,239,80,.24)" : "rgba(216,255,99,.16)");
    glow.addColorStop(1, "rgba(216,255,99,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(60, 0, 160, 180);
  }

  function create(canvas, options = {}) {
    const ctx = canvas.getContext("2d");
    const onTheme = typeof options.onTheme === "function" ? options.onTheme : null;
    let dpr = 1;
    let images = null;
    let theme = "light";
    let started = false;
    let frame = 0;
    let start = 0;
    let last = 0;
    let lastInputAt = 0;
    let pulse = 0;
    let state = {
      plants: [],
      paused: false,
      intensity: 0,
      idleMs: 0,
      weather: null,
      runtime: {},
    };

    const spores = Array.from({ length: 40 }, () => ({ life: 0, x: 0, y: 0, vx: 0, vy: 0, size: 1, hue: 0 }));
    const rain = Array.from({ length: 30 }, (_, index) => ({
      x: (index * 61 + 17) % (WIDTH + 20) - 10,
      y: (index * 43) % HEIGHT,
      speed: 86 + ((index * 23) % 80),
      length: 7 + ((index * 11) % 13),
      alpha: 0.09 + ((index * 7) % 8) / 100,
    }));

    function resize() {
      dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.round(WIDTH * dpr);
      canvas.height = Math.round(HEIGHT * dpr);
      canvas.style.width = `${WIDTH}px`;
      canvas.style.height = `${HEIGHT}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function spawnSpores(category) {
      const count = 10;
      for (let index = 0; index < count; index += 1) {
        const spore = spores.find((entry) => entry.life <= 0) || spores[index % spores.length];
        const categoryOffset = category === "digit" ? 24 : category === "punct" ? 44 : 0;
        spore.life = 0.9 + Math.random() * 0.9;
        spore.x = 52 + Math.random() * 118 + categoryOffset;
        spore.y = 224 + Math.random() * 36;
        spore.vx = (Math.random() - 0.5) * 8;
        spore.vy = -18 - Math.random() * 22;
        spore.size = 1.1 + Math.random() * 1.8;
        spore.hue = category === "punct" ? 1 : 0;
      }
    }

    function triggerPulse(input) {
      pulse = 1;
      spawnSpores(input?.category || "letter");
    }

    function drawSpores(delta) {
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      for (const spore of spores) {
        if (spore.life <= 0) continue;
        spore.life -= delta;
        spore.x += spore.vx * delta;
        spore.y += spore.vy * delta;
        spore.vy += 4.5 * delta;
        const alpha = clamp(spore.life, 0, 1) * 0.7;
        ctx.globalAlpha = alpha;
        ctx.fillStyle = spore.hue ? "#e7dfb4" : "#d8ff63";
        ctx.beginPath();
        ctx.arc(spore.x, spore.y, spore.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    function drawRain(delta) {
      if (state.paused || state.runtime?.autoPaused) return;
      const intensity = Number(state.intensity) || 0;
      if (intensity <= 0.02) return;
      const count = Math.floor(4 + intensity * 26);
      ctx.save();
      ctx.strokeStyle = theme === "light" ? "rgba(75,95,70,.32)" : "rgba(225,243,229,.62)";
      ctx.lineWidth = 0.55;
      for (let index = 0; index < count; index += 1) {
        const drop = rain[index % rain.length];
        drop.y += drop.speed * delta;
        if (drop.y > HEIGHT + 12) {
          drop.y = -12;
          drop.x = (drop.x + 19) % (WIDTH + 20) - 10;
        }
        ctx.globalAlpha = drop.alpha * (0.5 + intensity * 0.8);
        ctx.beginPath();
        ctx.moveTo(drop.x, drop.y);
        ctx.lineTo(drop.x - 1.8, drop.y + drop.length);
        ctx.stroke();
      }
      ctx.restore();
    }

    function drawFireflies(time) {
      if (state.paused || state.runtime?.autoPaused) return;
      const idle = Number(state.idleMs) || 0;
      if (idle < 70000) return;
      const visibility = clamp((idle - 70000) / 60000, 0, 1) * 0.7;
      const dots = [
        [74, 198, 1.0], [154, 214, 0.7], [188, 188, 0.55], [46, 224, 0.5], [124, 174, 0.45],
      ];
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      for (let index = 0; index < dots.length; index += 1) {
        const [baseX, baseY, scale] = dots[index];
        const x = baseX + Math.sin(time * 0.3 + index * 2.1) * 9;
        const y = baseY + Math.cos(time * 0.24 + index) * 5;
        const alpha = visibility * (0.45 + Math.sin(time * 1.7 + index) * 0.22);
        const glow = ctx.createRadialGradient(x, y, 0, x, y, 10);
        glow.addColorStop(0, "rgba(246,255,190,.85)");
        glow.addColorStop(0.3, "rgba(216,255,99,.22)");
        glow.addColorStop(1, "rgba(216,255,99,0)");
        ctx.globalAlpha = Math.max(0, alpha);
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(x, y, 10 * scale, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    function drawPulse(time) {
      if (pulse <= 0.01) return;
      const alpha = pulse * 0.24;
      const gradient = ctx.createRadialGradient(WIDTH * 0.55, HEIGHT * 0.8, 4, WIDTH * 0.55, HEIGHT * 0.8, 150);
      gradient.addColorStop(0, `rgba(216,255,99,${alpha})`);
      gradient.addColorStop(1, "rgba(216,255,99,0)");
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, WIDTH, HEIGHT);
      ctx.globalAlpha = pulse * 0.26;
      ctx.strokeStyle = "#d8ff63";
      ctx.lineWidth = 0.7;
      ctx.beginPath();
      ctx.ellipse(WIDTH * 0.54, HEIGHT * 0.82, 38 + (1 - pulse) * 34, 9 + (1 - pulse) * 8, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    function draw(timestamp) {
      if (!started) return;
      const elapsed = timestamp - last;
      if (elapsed < 30) {
        frame = requestAnimationFrame(draw);
        return;
      }
      const delta = Math.min(0.05, elapsed / 1000 || 0.016);
      last = timestamp;
      const time = (timestamp - start) / 1000;
      pulse = Math.max(0, pulse - delta * 2.8);

      ctx.clearRect(0, 0, WIDTH, HEIGHT);

      if (images) {
        const blend = GardenView.stageBlend(GardenView.gardenGrowth(state.plants), STAGE_COUNT);
        const zoom = 1 + pulse * 0.022 + Math.sin(time * 0.34) * 0.0018;
        ctx.save();
        ctx.translate(WIDTH / 2, HEIGHT / 2);
        ctx.scale(zoom, zoom);
        ctx.translate(-WIDTH / 2, -HEIGHT / 2);
        drawCover(ctx, images[blend.index], 1);
        if (blend.next !== blend.index && blend.mix > 0.001) {
          ctx.globalAlpha = blend.mix;
          drawCover(ctx, images[blend.next], 1);
        }
        ctx.restore();
      } else {
        gradientFallback(ctx, theme);
      }

      drawRain(delta);
      drawFireflies(time);
      drawPulse(time);
      drawSpores(delta);

      if (state.paused || state.runtime?.autoPaused) {
        ctx.fillStyle = theme === "light" ? "rgba(247,248,243,.22)" : "rgba(3,8,6,.24)";
        ctx.fillRect(0, 0, WIDTH, HEIGHT);
      }

      frame = requestAnimationFrame(draw);
    }

    function startLoop() {
      if (started) return;
      started = true;
      start = performance.now();
      last = performance.now();
      frame = requestAnimationFrame(draw);
    }

    function stopLoop() {
      started = false;
      cancelAnimationFrame(frame);
    }

    resize();
    window.addEventListener("resize", resize);
    startLoop();

    (async () => {
      for (const candidate of THEMES) {
        const loaded = await loadSet(candidate);
        if (loaded) {
          images = loaded;
          theme = candidate;
          break;
        }
      }
      if (!images) {
        for (const candidate of THEMES) {
          const loaded = await loadSet(`placeholder/${candidate}`);
          if (loaded) {
            images = loaded;
            theme = candidate;
            break;
          }
        }
      }
      if (onTheme) onTheme(theme);
    })();

    return {
      setState(next) {
        if (!next) return;
        const input = next.lastInput;
        state = { ...state, ...next };
        if (input && input.at && input.at !== lastInputAt) {
          lastInputAt = input.at;
          if (!state.paused && !state.runtime?.autoPaused) triggerPulse(input);
        }
      },
      getTheme() {
        return theme;
      },
      stop: stopLoop,
    };
  }

  window.PhotoGarden = { create };
})();
