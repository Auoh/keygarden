/* global window, document */
(() => {
  const WIDTH = 960;
  const HEIGHT = 200;
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

  const TREES = Array.from({ length: 26 }, (_, index) => ({
    x: (index * 137 + 41) % 1100 - 70,
    y: 148 + ((index * 31) % 22),
    h: 22 + ((index * 17) % 34),
    w: 5 + ((index * 13) % 9),
    layer: index % 3,
  }));

  const STARS = Array.from({ length: 42 }, (_, index) => ({
    x: (index * 83 + 17) % WIDTH,
    y: 12 + ((index * 37) % 86),
    r: 0.4 + ((index * 7) % 12) / 10,
    a: 0.16 + ((index * 11) % 30) / 100,
  }));

  const RAIN = Array.from({ length: 44 }, (_, index) => ({
    x: (index * 71 + 23) % (WIDTH + 30) - 15,
    y: (index * 47) % HEIGHT,
    len: 7 + ((index * 11) % 12),
    speed: 95 + ((index * 17) % 70),
    a: 0.12 + ((index * 7) % 10) / 100,
  }));

  const LEG_FILES = [
    "00-mist-valley",
    "01-pine-slope",
    "02-old-station",
    "03-wind-plain",
    "04-star-lake",
    "05-north-shore",
  ];

  function loadImage(path) {
    return new Promise((resolve) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => resolve(null);
      image.src = path;
    });
  }

  async function loadStage(path) {
    for (const ext of ["jpg", "png", "webp"]) {
      const image = await loadImage(`${path}.${ext}`);
      if (image) return image;
    }
    return null;
  }

  function rgba(hex, alpha) {
    const value = hex.replace("#", "");
    const n = parseInt(value, 16);
    return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
  }

  function drawSky(ctx, state, time) {
    const hour = Number.isFinite(state.hour) ? state.hour : 21;
    const night = hour >= 20 || hour < 6;
    const dawn = hour >= 6 && hour < 9;
    const dusk = hour >= 17 && hour < 20;
    const gradient = ctx.createLinearGradient(0, 0, 0, HEIGHT);
    if (night) {
      gradient.addColorStop(0, "#07121a");
      gradient.addColorStop(0.56, "#0d2528");
      gradient.addColorStop(1, "#122f2d");
    } else if (dawn) {
      gradient.addColorStop(0, "#314b55");
      gradient.addColorStop(0.55, "#58746f");
      gradient.addColorStop(1, "#8c9a7d");
    } else if (dusk) {
      gradient.addColorStop(0, "#1d2e3a");
      gradient.addColorStop(0.55, "#394d4f");
      gradient.addColorStop(1, "#796f5b");
    } else {
      gradient.addColorStop(0, "#607e80");
      gradient.addColorStop(0.58, "#83998e");
      gradient.addColorStop(1, "#b4b28f");
    }
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    if (night || dusk) {
      for (const star of STARS) {
        const twinkle = 0.65 + Math.sin(time * 0.7 + star.x * 0.2) * 0.35;
        ctx.globalAlpha = star.a * twinkle;
        ctx.fillStyle = "#e8f3dd";
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }

    const orbX = 776;
    const orbY = 43;
    const halo = ctx.createRadialGradient(orbX, orbY, 3, orbX, orbY, 84);
    halo.addColorStop(0, night ? "rgba(239,245,211,.22)" : "rgba(255,235,184,.30)");
    halo.addColorStop(1, "rgba(239,245,211,0)");
    ctx.fillStyle = halo;
    ctx.fillRect(orbX - 90, 0, 180, 150);
    ctx.fillStyle = night ? "#e9f0d4" : "#f4e3b8";
    ctx.beginPath();
    ctx.arc(orbX, orbY, night ? 17 : 20, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(235,245,220,.12)";
    ctx.beginPath();
    ctx.arc(orbX, orbY, 31, 0, Math.PI * 2);
    ctx.stroke();

    // Thin atmospheric bands.
    ctx.globalAlpha = 0.08;
    ctx.fillStyle = "#e9f4e3";
    for (let index = 0; index < 3; index += 1) {
      const y = 96 + index * 13 + Math.sin(time * 0.16 + index) * 3;
      ctx.fillRect(0, y, WIDTH, 1);
    }
    ctx.globalAlpha = 1;
  }

  function drawCover(ctx, image) {
    const scale = Math.max(WIDTH / image.width, HEIGHT / image.height);
    const width = image.width * scale;
    const height = image.height * scale;
    ctx.drawImage(image, (WIDTH - width) / 2, (HEIGHT - height) / 2, width, height);
  }

  function drawBackground(ctx, state, backgrounds) {
    const index = Number.isInteger(state.leg?.index) ? state.leg.index : 0;
    const image = backgrounds[index % LEG_FILES.length];
    if (!image) return false;
    drawCover(ctx, image);
    const next = backgrounds[(index + 1) % LEG_FILES.length];
    const progress = clamp(state.leg?.progress || 0, 0, 1);
    if (next && progress > 0.82) {
      ctx.save();
      ctx.globalAlpha = (progress - 0.82) / 0.18;
      drawCover(ctx, next);
      ctx.restore();
    }
    const hour = Number.isFinite(state.hour) ? state.hour : 21;
    const night = hour >= 20 || hour < 6;
    const dawn = hour >= 6 && hour < 9;
    ctx.save();
    ctx.fillStyle = night
      ? "rgba(3, 12, 18, 0.10)"
      : dawn
        ? "rgba(255, 210, 160, 0.02)"
        : "rgba(20, 32, 28, 0.00)";
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    ctx.restore();
    return true;
  }

  function drawRidge(ctx, scroll, color, baseY, amplitude, frequency, phase) {    ctx.save();
    ctx.translate(-((scroll * frequency) % 240), 0);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(-240, HEIGHT);
    ctx.lineTo(-240, baseY);
    for (let x = -240; x <= WIDTH + 240; x += 24) {
      const y = baseY - Math.sin((x + phase) * 0.008) * amplitude - Math.sin((x + phase) * 0.021) * amplitude * 0.38;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(WIDTH + 240, HEIGHT);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function drawTree(ctx, tree, tint) {
    ctx.save();
    ctx.translate(tree.x, tree.y);
    ctx.fillStyle = tint;
    ctx.fillRect(-tree.w * 0.08, -tree.h * 0.44, tree.w * 0.16, tree.h * 0.5);
    ctx.beginPath();
    ctx.moveTo(0, -tree.h);
    ctx.lineTo(tree.w, -tree.h * 0.22);
    ctx.lineTo(tree.w * 0.32, -tree.h * 0.22);
    ctx.lineTo(tree.w * 0.65, 0);
    ctx.lineTo(-tree.w * 0.65, 0);
    ctx.lineTo(-tree.w * 0.32, -tree.h * 0.22);
    ctx.lineTo(-tree.w, -tree.h * 0.22);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function drawLandscape(ctx, state, time) {
    const progress = clamp(state.leg?.progress || 0, 0, 1);
    const scroll = progress * 150 + (time * 0.5) % 1;
    const night = (state.hour >= 20 || state.hour < 6);
    drawRidge(ctx, scroll * 0.16, night ? "#0c2022" : "#4a625b", 113, 17, 0.12, 30);
    drawRidge(ctx, scroll * 0.28, night ? "#0b1a1b" : "#3d574f", 132, 12, 0.18, 90);
    drawRidge(ctx, scroll * 0.42, night ? "#081413" : "#2c453f", 151, 9, 0.24, 150);

    // Tiny forest silhouettes, with a lighter rim on the near layer.
    for (const tree of TREES) {
      const x = ((tree.x - scroll * (0.22 + tree.layer * 0.18)) % 1100 + 1100) % 1100 - 70;
      const y = tree.y + (tree.layer === 2 ? 4 : 0);
      const tint = night
        ? (tree.layer === 0 ? "#0a1b1c" : tree.layer === 1 ? "#0b2020" : "#0f2826")
        : (tree.layer === 0 ? "#29433d" : tree.layer === 1 ? "#223a35" : "#19312e");
      drawTree(ctx, { ...tree, x, y }, tint);
    }

    // Road / trail.
    ctx.strokeStyle = night ? "rgba(180,210,184,.20)" : "rgba(236,235,205,.32)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, 173);
    ctx.bezierCurveTo(200, 164, 430, 170, 620, 166);
    ctx.bezierCurveTo(760, 163, 850, 166, 960, 160);
    ctx.stroke();

    ctx.setLineDash([4, 8]);
    ctx.strokeStyle = night ? "rgba(180,210,184,.12)" : "rgba(236,235,205,.18)";
    ctx.beginPath();
    ctx.moveTo(0, 181);
    ctx.bezierCurveTo(220, 173, 440, 178, 640, 174);
    ctx.bezierCurveTo(780, 171, 870, 174, 960, 169);
    ctx.stroke();
    ctx.setLineDash([]);

    // Landmark sign at the next leg.
    ctx.strokeStyle = night ? "rgba(220,235,204,.34)" : "rgba(248,242,209,.52)";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(844, 165);
    ctx.lineTo(844, 135);
    ctx.stroke();
    ctx.fillStyle = night ? "rgba(220,235,204,.14)" : "rgba(248,242,209,.20)";
    ctx.beginPath();
    ctx.moveTo(844, 136);
    ctx.lineTo(873, 141);
    ctx.lineTo(844, 148);
    ctx.closePath();
    ctx.fill();
  }

  function drawFootShadow(ctx, x, baseY, width, alpha = 0.3) {
    ctx.save();
    ctx.translate(x, baseY);
    ctx.scale(1, 0.16);
    const shadow = ctx.createRadialGradient(0, 0, 1, 0, 0, width);
    shadow.addColorStop(0, `rgba(2, 7, 8, ${alpha})`);
    shadow.addColorStop(0.7, `rgba(2, 7, 8, ${alpha * 0.45})`);
    shadow.addColorStop(1, "rgba(2, 7, 8, 0)");
    ctx.fillStyle = shadow;
    ctx.beginPath();
    ctx.arc(0, 0, width, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawTraveler(ctx, state, time, assets) {
    const camped = Boolean(state.camped) || Boolean(state.runtime?.autoPaused) || Boolean(state.runtime?.paused);
    const progress = clamp(state.leg?.progress || 0, 0, 1);
    const idleMs = Number(state.idleMs) || 0;
    // Walk the character across the strip as the leg advances, instead of
    // pinning them to one spot for the whole journey.
    const travelX = 236 + progress * 488;
    if (camped && assets?.camp) {
      const image = assets.camp;
      const height = 58;
      const width = image.width / image.height * height;
      const x = travelX - width / 2;
      const y = 176 - height;
      ctx.save();
      ctx.translate(travelX, 175);
      ctx.scale(1, 0.12);
      const shadow = ctx.createRadialGradient(0, 0, 6, 0, 0, 92);
      shadow.addColorStop(0, "rgba(2, 7, 8, 0.55)");
      shadow.addColorStop(0.65, "rgba(2, 7, 8, 0.22)");
      shadow.addColorStop(1, "rgba(2, 7, 8, 0)");
      ctx.fillStyle = shadow;
      ctx.beginPath();
      ctx.arc(0, 0, 92, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      ctx.save();
      ctx.globalAlpha = 0.96;
      ctx.drawImage(image, x, y, width, height);
      ctx.restore();

      if (assets.campSit) {
        // The seated cutout includes its own log, so keep it in front of the
        // tent and let the log provide the ground contact.
        const sitHeight = 48;
        const sitWidth = assets.campSit.width / assets.campSit.height * sitHeight;
        const sitX = travelX - 46;
        ctx.save();
        ctx.translate(sitX, 176);
        ctx.scale(1, 0.1);
        const sitShadow = ctx.createRadialGradient(0, 0, 5, 0, 0, sitWidth * 0.68);
        sitShadow.addColorStop(0, "rgba(2, 7, 8, 0.48)");
        sitShadow.addColorStop(1, "rgba(2, 7, 8, 0)");
        ctx.fillStyle = sitShadow;
        ctx.beginPath();
        ctx.arc(0, 0, sitWidth * 0.68, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        ctx.save();
        ctx.globalAlpha = 0.98;
        ctx.drawImage(
          assets.campSit,
          sitX - sitWidth / 2,
          176 - sitHeight,
          sitWidth,
          sitHeight,
        );
        ctx.restore();
      }
      return;
    }

    if (!camped && assets?.traveler) {
      let image = assets.traveler;
      // A leg's last stretch uses the arrival pose; a long pause uses the
      // resting pose. Both are optional, so older asset folders still work.
      if (idleMs >= 20000 && idleMs < 5 * 60 * 1000 && assets.rest) {
        image = assets.rest;
      } else if (progress >= 0.9 && assets.arrive) {
        image = assets.arrive;
      } else if (state.weather?.key === "rain" && assets.walkRain) {
        image = assets.walkRain;
      } else if (assets.walkB) {
        const frame = Math.floor(time * 2.4) % 2 === 0 ? assets.walkB : assets.traveler;
        image = frame || assets.walkB;
      }
      const height = 54;
      const width = image.width / image.height * height;
      const stride = state.weather?.key === "rain" ? Math.sin(time * 5.6) : Math.sin(time * 4.2);
      const bob = image === assets.rest || image === assets.arrive ? 0 : stride * 1.2;
      const lean = image === assets.rest || image === assets.arrive ? 0 : stride * 0.012;
      drawFootShadow(ctx, travelX, 176, width * 0.72, image === assets.rest ? 0.2 : 0.3);
      ctx.save();
      ctx.translate(travelX, 176 + bob);
      ctx.rotate(lean);
      ctx.drawImage(image, -width / 2, -height, width, height);
      ctx.restore();
      return;
    }
    const x = travelX;
    const y = 176;
    if (camped) {
      // Tent
      ctx.fillStyle = "#0a1715";
      ctx.strokeStyle = "rgba(235,214,166,.22)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(704, 166);
      ctx.lineTo(736, 112);
      ctx.lineTo(770, 166);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(736, 112);
      ctx.lineTo(736, 166);
      ctx.stroke();

      // Fire
      const glow = ctx.createRadialGradient(672, 154, 1, 672, 154, 38);
      glow.addColorStop(0, "rgba(255,194,105,.30)");
      glow.addColorStop(1, "rgba(255,194,105,0)");
      ctx.fillStyle = glow;
      ctx.fillRect(636, 120, 72, 60);
      ctx.fillStyle = "rgba(236,181,101,.78)";
      ctx.beginPath();
      ctx.moveTo(672, 158);
      ctx.quadraticCurveTo(664, 149, 672, 140);
      ctx.quadraticCurveTo(680, 149, 672, 158);
      ctx.fill();

      // Sitting traveler
      ctx.fillStyle = "#071312";
      ctx.beginPath();
      ctx.arc(640, 139, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(636, 144);
      ctx.quadraticCurveTo(650, 144, 653, 158);
      ctx.lineTo(632, 158);
      ctx.closePath();
      ctx.fill();
      return;
    }

    const phase = Math.sin(time * 4.2);
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = "#071312";
    // Backpack
    ctx.beginPath();
    ctx.ellipse(-3, -33, 9, 13, -0.12, 0, Math.PI * 2);
    ctx.fill();
    // Head
    ctx.beginPath();
    ctx.arc(0, -48, 5.2, 0, Math.PI * 2);
    ctx.fill();
    // Body / coat
    ctx.beginPath();
    ctx.moveTo(-6, -42);
    ctx.quadraticCurveTo(0, -45, 8, -39);
    ctx.lineTo(5, -22);
    ctx.lineTo(-5, -22);
    ctx.closePath();
    ctx.fill();
    // Legs
    ctx.strokeStyle = "#071312";
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(-3, -23);
    ctx.lineTo(-5 + phase * 3, -6);
    ctx.moveTo(3, -23);
    ctx.lineTo(5 - phase * 3, -6);
    ctx.stroke();
    // Walking stick / small rim light
    ctx.strokeStyle = "rgba(235,214,166,.34)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(8, -38);
    ctx.lineTo(15, -5);
    ctx.stroke();
    ctx.restore();
  }

  function drawWeather(ctx, state, delta) {
    const weather = state.weather?.key || "clear";
    if (weather === "rain") {
      const count = Math.floor(8 + (state.intensity || 0) * 26);
      ctx.save();
      ctx.strokeStyle = "rgba(212,235,222,.55)";
      ctx.lineWidth = 0.6;
      for (let index = 0; index < count; index += 1) {
        const drop = RAIN[index % RAIN.length];
        drop.y += drop.speed * delta;
        if (drop.y > HEIGHT) drop.y = -10;
        ctx.globalAlpha = drop.a;
        ctx.beginPath();
        ctx.moveTo(drop.x, drop.y);
        ctx.lineTo(drop.x - 2.4, drop.y + drop.len);
        ctx.stroke();
      }
      ctx.restore();
    }
    if (weather === "fog" || weather === "camp" || state.camped) {
      ctx.save();
      const fog = ctx.createLinearGradient(0, 130, 0, 200);
      fog.addColorStop(0, "rgba(196,220,211,0)");
      fog.addColorStop(0.6, "rgba(196,220,211,.08)");
      fog.addColorStop(1, "rgba(196,220,211,0)");
      ctx.fillStyle = fog;
      ctx.fillRect(0, 120, WIDTH, 80);
      ctx.restore();
    }
  }

  function create(canvas) {
    const ctx = canvas.getContext("2d");
    let dpr = 1;
    let state = {
      leg: { name: "雾之谷", next: "松针坡", progress: 0 },
      weather: { key: "clear" },
      todayDistanceM: 0,
      totalDistanceM: 0,
      hour: 21,
      intensity: 0,
      camped: false,
      runtime: {},
    };
    let started = false;
    let frame = 0;
    let last = 0;
    let start = 0;
    const backgrounds = [];
    const assets = {
      traveler: null,
      walkB: null,
      rest: null,
      campSit: null,
      arrive: null,
      walkRain: null,
      camp: null,
    };

    function resize() {
      dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.round(WIDTH * dpr);
      canvas.height = Math.round(HEIGHT * dpr);
      canvas.style.width = `${WIDTH}px`;
      canvas.style.height = `${HEIGHT}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
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
      ctx.clearRect(0, 0, WIDTH, HEIGHT);
      const hasBackground = drawBackground(ctx, state, backgrounds);
      if (!hasBackground) {
        drawSky(ctx, state, time);
        drawLandscape(ctx, state, time);
      }
      drawWeather(ctx, state, delta);
      drawTraveler(ctx, state, time, assets);

      if (state.runtime?.autoPaused || state.runtime?.paused || state.paused) {
        ctx.fillStyle = "rgba(3, 8, 7, 0.24)";
        ctx.fillRect(0, 0, WIDTH, HEIGHT);
      }
      frame = requestAnimationFrame(draw);
    }

    function loop() {
      if (started) return;
      started = true;
      start = performance.now();
      last = performance.now();
      frame = requestAnimationFrame(draw);
    }

    resize();
    window.addEventListener("resize", resize);
    loop();

    (async () => {
      for (let index = 0; index < LEG_FILES.length; index += 1) {
        backgrounds[index] = await loadStage(`assets/backgrounds/${LEG_FILES[index]}`);
      }
      assets.traveler = await loadStage("assets/traveler/walk");
      assets.walkB = await loadStage("assets/traveler/walk-b");
      assets.rest = await loadStage("assets/traveler/rest");
      assets.campSit = await loadStage("assets/traveler/camp-sit");
      assets.arrive = await loadStage("assets/traveler/arrive");
      assets.walkRain = await loadStage("assets/traveler/walk-rain");
      assets.camp = await loadStage("assets/props/camp");
    })();

    return {
      setState(next) {
        if (next) state = { ...state, ...next };
      },
      stop() {
        started = false;
        cancelAnimationFrame(frame);
      },
    };
  }

  window.JourneyCanvas = { create };
})();
