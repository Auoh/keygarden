/* global window */
(() => {
  const WIDTH = 396;
  const HEIGHT = 520;
  const SLOTS = [
    { x: 86, y: 448, scale: 1.0 },
    { x: 160, y: 470, scale: 0.93 },
    { x: 235, y: 452, scale: 1.0 },
    { x: 318, y: 432, scale: 0.9 },
    { x: 112, y: 403, scale: 0.68 },
    { x: 197, y: 414, scale: 0.66 },
    { x: 276, y: 396, scale: 0.7 },
    { x: 354, y: 416, scale: 0.58 },
    { x: 52, y: 430, scale: 0.62 },
  ];

  const STARS = [
    [42, 74, 1.1, 0.42], [91, 48, 0.8, 0.28], [140, 96, 1.0, 0.36],
    [195, 54, 0.7, 0.25], [244, 76, 1.2, 0.42], [284, 42, 0.75, 0.24],
    [372, 148, 0.9, 0.28], [115, 142, 0.65, 0.20], [62, 190, 0.8, 0.16],
    [208, 120, 0.6, 0.22], [346, 108, 0.7, 0.24],
  ];

  const FIREFLIES = [
    [99, 384, 1.0], [252, 378, 0.85], [336, 361, 0.7],
    [292, 407, 0.55], [174, 358, 0.5], [58, 397, 0.45],
  ];

  const RAIN = Array.from({ length: 52 }, (_, index) => ({
    x: (index * 97 + 31) % 420 - 12,
    baseX: (index * 97 + 31) % 420 - 12,
    y: (index * 53) % 520,
    length: 10 + ((index * 17) % 17),
    speed: 110 + ((index * 29) % 130),
    alpha: 0.08 + ((index * 7) % 10) / 100,
  }));

  const MOSS = Array.from({ length: 30 }, (_, index) => ({
    x: (index * 79 + 21) % 396,
    y: 392 + ((index * 37) % 108),
    r: 2 + ((index * 13) % 6),
    alpha: 0.2 + ((index * 11) % 30) / 100,
  }));

  function rgba(hex, alpha) {
    const value = hex.replace("#", "");
    const n = parseInt(value, 16);
    return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function leaf(ctx, x, y, angle, length, width, color) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(length * 0.45, -width, length, 0);
    ctx.quadraticCurveTo(length * 0.45, width, 0, 0);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.restore();
  }

  function drawSky(ctx, state, time) {
    const gradient = ctx.createLinearGradient(0, 0, 0, HEIGHT);
    gradient.addColorStop(0, "#071617");
    gradient.addColorStop(0.42, "#0b2623");
    gradient.addColorStop(0.72, "#133a30");
    gradient.addColorStop(1, "#08130f");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // Moon halo
    const halo = ctx.createRadialGradient(332, 88, 20, 332, 88, 108);
    halo.addColorStop(0, "rgba(246, 232, 190, 0.33)");
    halo.addColorStop(0.42, "rgba(214, 227, 194, 0.11)");
    halo.addColorStop(1, "rgba(214, 227, 194, 0)");
    ctx.fillStyle = halo;
    ctx.fillRect(210, 0, 186, 210);

    ctx.fillStyle = "#f1e3b7";
    ctx.beginPath();
    ctx.arc(332, 88, 30, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#e7d4a3";
    ctx.globalAlpha = 0.30;
    ctx.beginPath();
    ctx.arc(323, 80, 3.2, 0, Math.PI * 2);
    ctx.arc(340, 99, 2.1, 0, Math.PI * 2);
    ctx.arc(328, 106, 1.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;

    for (const [x, y, radius, alpha] of STARS) {
      const twinkle = 0.66 + Math.sin(time * 0.7 + x * 0.15) * 0.34;
      ctx.globalAlpha = alpha * twinkle;
      ctx.fillStyle = "#d9ece0";
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // Far hills
    ctx.fillStyle = "#102c25";
    ctx.beginPath();
    ctx.moveTo(0, 310);
    ctx.bezierCurveTo(58, 268, 112, 274, 158, 300);
    ctx.bezierCurveTo(214, 326, 259, 268, 316, 280);
    ctx.bezierCurveTo(357, 288, 389, 300, 396, 292);
    ctx.lineTo(396, HEIGHT);
    ctx.lineTo(0, HEIGHT);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "#0d231d";
    ctx.beginPath();
    ctx.moveTo(0, 340);
    ctx.bezierCurveTo(66, 305, 120, 316, 178, 338);
    ctx.bezierCurveTo(238, 360, 294, 316, 344, 330);
    ctx.bezierCurveTo(379, 340, 396, 352, 396, 348);
    ctx.lineTo(396, HEIGHT);
    ctx.lineTo(0, HEIGHT);
    ctx.closePath();
    ctx.fill();
  }

  function drawVine(ctx, state, time) {
    const wind = state.paused || state.runtime?.autoPaused ? 0 : 1 + (state.intensity || 0) * 3;
    const sway = Math.sin(time * 0.55) * wind * 1.4;
    ctx.save();
    ctx.translate(34, -2);
    ctx.strokeStyle = "#456f52";
    ctx.lineWidth = 1.45;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(7 + sway * 0.2, 32, -3 + sway * 0.5, 64, 5 + sway, 103);
    ctx.stroke();

    const leafPoints = [
      [4, 18, 0.65, 1],
      [1, 38, -0.78, 0.9],
      [7, 58, 0.55, 1.05],
      [2, 77, -0.7, 0.82],
      [7, 94, 0.45, 0.7],
    ];
    for (const [x, y, angle, scale] of leafPoints) {
      ctx.globalAlpha = 0.72;
      leaf(ctx, x - 2, y, angle, 12 * scale, 3.4 * scale, "#5f946e");
      ctx.globalAlpha = 1;
    }
    ctx.restore();
  }

  function drawGround(ctx) {
    ctx.fillStyle = "#0a1a15";
    ctx.beginPath();
    ctx.moveTo(0, 367);
    ctx.bezierCurveTo(78, 336, 156, 350, 220, 362);
    ctx.bezierCurveTo(290, 376, 350, 355, 396, 368);
    ctx.lineTo(396, HEIGHT);
    ctx.lineTo(0, HEIGHT);
    ctx.closePath();
    ctx.fill();

    const ground = ctx.createLinearGradient(0, 365, 0, HEIGHT);
    ground.addColorStop(0, "#183329");
    ground.addColorStop(0.45, "#10241d");
    ground.addColorStop(1, "#07100d");
    ctx.fillStyle = ground;
    ctx.beginPath();
    ctx.moveTo(0, 407);
    ctx.bezierCurveTo(68, 360, 147, 377, 210, 397);
    ctx.bezierCurveTo(281, 420, 337, 387, 396, 372);
    ctx.lineTo(396, HEIGHT);
    ctx.lineTo(0, HEIGHT);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "#0b1a14";
    ctx.beginPath();
    ctx.moveTo(0, 421);
    ctx.bezierCurveTo(89, 390, 164, 408, 232, 425);
    ctx.bezierCurveTo(302, 443, 355, 411, 396, 396);
    ctx.lineTo(396, HEIGHT);
    ctx.lineTo(0, HEIGHT);
    ctx.closePath();
    ctx.fill();

    // Mossy patches
    for (const moss of MOSS) {
      ctx.globalAlpha = moss.alpha;
      ctx.fillStyle = "#2e4d3b";
      ctx.beginPath();
      ctx.ellipse(moss.x, moss.y, moss.r * 3.2, moss.r, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // Pond
    const pond = ctx.createLinearGradient(0, 424, 0, 462);
    pond.addColorStop(0, "#3b7a70");
    pond.addColorStop(0.55, "#22534f");
    pond.addColorStop(1, "#0e2a29");
    ctx.fillStyle = pond;
    ctx.beginPath();
    ctx.ellipse(304, 444, 79, 23, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "rgba(140, 200, 179, 0.28)";
    ctx.lineWidth = 0.8;
    for (let index = 0; index < 3; index += 1) {
      ctx.beginPath();
      ctx.ellipse(304, 444, 22 + index * 18, 5 + index * 3, 0, 0.15, Math.PI - 0.15);
      ctx.stroke();
    }

    ctx.fillStyle = "rgba(201, 240, 218, 0.38)";
    for (const [x, y] of [[279, 440], [327, 447], [349, 438]]) {
      ctx.beginPath();
      ctx.arc(x, y, 0.9, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawFern(ctx, growth, sway, palette) {
    const fronds = 3 + Math.floor(growth * 2);
    const length = 42 + growth * 58;
    for (let index = 0; index < fronds; index += 1) {
      const side = index - (fronds - 1) / 2;
      const baseAngle = -Math.PI / 2 + side * 0.32 + sway * 0.018;
      const tipX = Math.cos(baseAngle) * length + side * 10 + sway;
      const tipY = Math.sin(baseAngle) * length;
      const controlX = Math.cos(baseAngle) * length * 0.42 - side * 6;
      const controlY = Math.sin(baseAngle) * length * 0.62 + 8;

      ctx.strokeStyle = palette.stem;
      ctx.lineWidth = 1.15;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(controlX, controlY, tipX, tipY);
      ctx.stroke();

      const leaves = 3 + Math.floor(growth * 2);
      for (let leafIndex = 0; leafIndex < leaves; leafIndex += 1) {
        const t = 0.24 + (leafIndex / leaves) * 0.68;
        const x = (1 - t) * (1 - t) * 0 + 2 * (1 - t) * t * controlX + t * t * tipX;
        const y = (1 - t) * (1 - t) * 0 + 2 * (1 - t) * t * controlY + t * t * tipY;
        const angle = baseAngle + (leafIndex % 2 === 0 ? 0.8 : -0.8);
        leaf(ctx, x, y, angle, 8 + growth * 7, 2.4 + growth * 1.4, palette.leaf);
        if (leafIndex % 2 === 0) {
          leaf(ctx, x, y, angle + Math.PI, 6 + growth * 6, 2.1 + growth, palette.leafDark);
        }
      }
    }
  }

  function drawMushroom(ctx, growth, sway, palette, time) {
    const height = 20 + growth * 42;
    const width = 19 + growth * 29;
    const x = sway * 0.35;
    const glow = ctx.createRadialGradient(x, -height, 1, x, -height, width * 1.7);
    glow.addColorStop(0, "rgba(246, 189, 123, 0.18)");
    glow.addColorStop(1, "rgba(246, 189, 123, 0)");
    ctx.fillStyle = glow;
    ctx.fillRect(x - width * 2, -height - width * 2, width * 4, width * 3.2);

    ctx.fillStyle = "#d8c39b";
    ctx.beginPath();
    ctx.roundRect(-3.5, -height, 7, height + 2, 3);
    ctx.fill();

    ctx.fillStyle = palette.cap;
    ctx.beginPath();
    ctx.moveTo(-width / 2, -height);
    ctx.bezierCurveTo(-width / 2, -height - 22 * growth - 8, width / 2, -height - 22 * growth - 8, width / 2, -height);
    ctx.quadraticCurveTo(0, -height + 6, -width / 2, -height);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = palette.capLight;
    ctx.globalAlpha = 0.48;
    ctx.beginPath();
    ctx.ellipse(-width * 0.12, -height - 5, width * 0.27, 3.2, -0.22, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;

    ctx.fillStyle = "rgba(249, 226, 183, 0.74)";
    const spots = [[-0.18, -4.5, 1.5], [0.17, -9, 1.1], [0.04, -2.3, 1.0]];
    for (const [px, py, radius] of spots) {
      ctx.beginPath();
      ctx.arc(px * width, -height + py, radius * (0.7 + growth * 0.5), 0, Math.PI * 2);
      ctx.fill();
    }

    if (growth > 0.72) {
      const pulse = 0.5 + Math.sin(time * 1.1) * 0.18;
      ctx.globalAlpha = pulse;
      ctx.fillStyle = "rgba(250, 210, 142, 0.6)";
      ctx.beginPath();
      ctx.arc(x, -height - 2, 1.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  }

  function drawFlower(ctx, growth, sway, palette, time) {
    const height = 30 + growth * 48;
    const stemTopX = sway * 0.8;
    const stemTopY = -height;
    ctx.strokeStyle = palette.stem;
    ctx.lineWidth = 1.25;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(sway * 0.3, -height * 0.55, stemTopX, stemTopY);
    ctx.stroke();

    leaf(ctx, -1, -height * 0.28, -0.6, 12 + growth * 7, 3.2, palette.leafDark);
    leaf(ctx, 0, -height * 0.48, -2.3, 10 + growth * 6, 2.8, palette.leaf);

    const petals = 5;
    const radius = 3.5 + growth * 4.2;
    ctx.save();
    ctx.translate(stemTopX, stemTopY);
    ctx.rotate(Math.sin(time * 0.5) * 0.05);
    for (let index = 0; index < petals; index += 1) {
      const angle = (Math.PI * 2 * index) / petals + time * 0.02;
      ctx.beginPath();
      ctx.ellipse(Math.cos(angle) * radius, Math.sin(angle) * radius, radius * 0.72, radius * 0.42, angle, 0, Math.PI * 2);
      ctx.fillStyle = palette.petal;
      ctx.fill();
    }
    ctx.beginPath();
    ctx.arc(0, 0, 2.1, 0, Math.PI * 2);
    ctx.fillStyle = "#e7bc6f";
    ctx.fill();
    ctx.restore();
  }

  function drawMoss(ctx, growth, sway, palette) {
    const count = 7 + Math.floor(growth * 11);
    for (let index = 0; index < count; index += 1) {
      const angle = (index / count) * Math.PI * 2 + index * 0.7;
      const distance = 5 + (index % 5) * 4 + growth * 15;
      const x = Math.cos(angle) * distance + sway * 0.12;
      const y = Math.sin(angle) * distance * 0.28;
      const radius = 2.2 + (index % 3) * 0.7 + growth * 1.2;
      ctx.fillStyle = index % 2 === 0 ? palette.leaf : palette.leafDark;
      ctx.globalAlpha = 0.55 + growth * 0.35;
      ctx.beginPath();
      ctx.ellipse(x, y, radius * 1.5, radius, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function drawPlant(ctx, plant, slot, time, state) {
    const growth = clamp(Number(plant.growth) || 0.14, 0.08, 1);
    const paused = Boolean(state.paused || state.runtime?.autoPaused);
    const wind = paused ? 0 : 0.8 + (state.intensity || 0) * 5.5;
    const sway = Math.sin(time * 0.9 + slot.x * 0.04) * wind * (0.35 + growth * 0.65);
    const size = slot.scale * (0.62 + growth * 0.6);
    const palette = plant.type === "mushroom"
      ? { cap: "#e0a66d", capLight: "#f0c58b", stem: "#7d936b", leaf: "#6f9b75", leafDark: "#4d7a5b", petal: "#f0d7a4" }
      : plant.type === "flower"
        ? { stem: "#638b63", leaf: "#7fa66e", leafDark: "#4f7a5b", petal: "#e9dfbf", cap: "#e9dfbf", capLight: "#f6eccd" }
        : { stem: "#4f7f5f", leaf: "#7eae7c", leafDark: "#5a8a63", petal: "#e9dfbf", cap: "#e0a66d", capLight: "#f0c58b" };

    ctx.save();
    ctx.translate(slot.x, slot.y);
    ctx.scale(size, size);

    const shadow = ctx.createRadialGradient(0, 2, 1, 0, 2, 18);
    shadow.addColorStop(0, "rgba(0, 0, 0, 0.25)");
    shadow.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = shadow;
    ctx.beginPath();
    ctx.ellipse(0, 3, 19, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    if (plant.type === "mushroom") drawMushroom(ctx, growth, sway, palette, time);
    else if (plant.type === "flower") drawFlower(ctx, growth, sway, palette, time);
    else if (plant.type === "moss") drawMoss(ctx, growth, sway, palette);
    else drawFern(ctx, growth, sway, palette);

    if (growth > 0.86) {
      const glow = ctx.createRadialGradient(0, -12, 1, 0, -12, 28);
      glow.addColorStop(0, "rgba(209, 235, 172, 0.10)");
      glow.addColorStop(1, "rgba(209, 235, 172, 0)");
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(0, -12, 28, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  function drawRain(ctx, state, delta, time) {
    if (state.paused || state.runtime?.autoPaused) return;
    const intensity = state.intensity || 0;
    if (intensity <= 0.01) return;
    const count = Math.floor(5 + intensity * 38);
    ctx.save();
    ctx.strokeStyle = "#c8e4d7";
    ctx.lineWidth = 0.75;
    for (let index = 0; index < count; index += 1) {
      const drop = RAIN[index % RAIN.length];
      drop.y += drop.speed * delta;
      if (drop.y > HEIGHT + 20) {
        drop.y = -20;
        drop.x = drop.baseX;
      }
      const drift = intensity > 0.5 ? -2.4 : -0.8;
      ctx.globalAlpha = drop.alpha * (0.45 + intensity * 0.7);
      ctx.beginPath();
      ctx.moveTo(drop.x, drop.y);
      ctx.lineTo(drop.x + drift * 2.1, drop.y + drop.length * (0.7 + intensity * 0.45));
      ctx.stroke();
      drop.x += drift * 0.2;
    }
    ctx.restore();
  }

  function drawFireflies(ctx, state, time) {
    if (state.paused || state.runtime?.autoPaused) return;
    const idle = state.idleMs || 0;
    const visibility = clamp(idle / 90000, 0.34, 1) * (state.intensity > 0.45 ? 0.45 : 1);
    for (let index = 0; index < FIREFLIES.length; index += 1) {
      const [baseX, baseY, scale] = FIREFLIES[index];
      const x = baseX + Math.sin(time * 0.28 + index * 2.1) * 13;
      const y = baseY + Math.cos(time * 0.22 + index) * 7;
      const pulse = 0.5 + Math.sin(time * 1.5 + index * 1.7) * 0.5;
      ctx.globalAlpha = visibility * (0.24 + pulse * 0.65) * scale;
      const glow = ctx.createRadialGradient(x, y, 0, x, y, 13);
      glow.addColorStop(0, "rgba(255, 246, 201, 0.8)");
      glow.addColorStop(0.28, "rgba(234, 233, 167, 0.25)");
      glow.addColorStop(1, "rgba(234, 233, 167, 0)");
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(x, y, 13, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#fff5c4";
      ctx.beginPath();
      ctx.arc(x, y, 1.3 * scale, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function drawSnail(ctx, state, time) {
    const idle = state.idleMs || 0;
    if (idle < 90000 || state.paused || state.runtime?.autoPaused) return;
    const progress = clamp((idle - 90000) / 50000, 0, 1);
    const x = 168 + progress * 36 + Math.sin(time * 0.2) * 3;
    const y = 482;
    ctx.save();
    ctx.translate(x, y);
    ctx.globalAlpha = clamp(progress * 1.5, 0, 1) * 0.85;
    ctx.fillStyle = "#9b9772";
    ctx.beginPath();
    ctx.ellipse(0, 7, 19, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#b0a982";
    ctx.beginPath();
    ctx.ellipse(-10, 3, 9, 4, -0.12, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#b3a77d";
    ctx.beginPath();
    ctx.arc(2, -3, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#777452";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(2, -3, 5, 0.5, Math.PI * 1.7);
    ctx.stroke();
    ctx.strokeStyle = "#9b9772";
    ctx.beginPath();
    ctx.moveTo(-15, 1);
    ctx.lineTo(-22, -6);
    ctx.moveTo(-17, 3);
    ctx.lineTo(-23, 1);
    ctx.stroke();
    ctx.restore();
  }

  function drawFog(ctx, time) {
    ctx.save();
    ctx.globalAlpha = 0.055;
    const fog = ctx.createRadialGradient(190, 430, 10, 190, 430, 210);
    fog.addColorStop(0, "rgba(184, 217, 198, 0.8)");
    fog.addColorStop(1, "rgba(184, 217, 198, 0)");
    ctx.fillStyle = fog;
    ctx.beginPath();
    ctx.ellipse(190, 430, 210, 32, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawForegroundLeaves(ctx) {
    ctx.save();
    ctx.globalAlpha = 0.9;
    ctx.fillStyle = "#294c3b";
    ctx.beginPath();
    ctx.moveTo(0, 520);
    ctx.bezierCurveTo(18, 474, 52, 452, 91, 443);
    ctx.bezierCurveTo(74, 482, 42, 508, 0, 520);
    ctx.fill();
    ctx.fillStyle = "#356049";
    ctx.beginPath();
    ctx.moveTo(396, 520);
    ctx.bezierCurveTo(370, 466, 330, 444, 292, 440);
    ctx.bezierCurveTo(318, 482, 350, 508, 396, 520);
    ctx.fill();
    ctx.restore();
  }

  function drawGlass(ctx) {
    ctx.save();
    ctx.strokeStyle = "rgba(217, 255, 239, 0.16)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, 34);
    ctx.bezierCurveTo(0, 15, 15, 0, 34, 0);
    ctx.lineTo(172, 0);
    ctx.stroke();
    ctx.strokeStyle = "rgba(217, 255, 239, 0.08)";
    ctx.beginPath();
    ctx.moveTo(0, 76);
    ctx.bezierCurveTo(28, 61, 53, 42, 72, 16);
    ctx.stroke();
    ctx.restore();
  }

  function create(canvas) {
    const ctx = canvas.getContext("2d");
    let dpr = 1;
    let state = {
      plants: [],
      paused: false,
      intensity: 0,
      idleMs: 0,
      runtime: {},
    };
    let started = false;
    let frame = 0;
    let last = 0;
    let start = 0;

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
      const elapsedSinceFrame = timestamp - last;
      if (elapsedSinceFrame < 30) {
        frame = requestAnimationFrame(draw);
        return;
      }
      const delta = Math.min(0.05, elapsedSinceFrame / 1000 || 0.016);
      last = timestamp;
      const time = (timestamp - start) / 1000;

      ctx.clearRect(0, 0, WIDTH, HEIGHT);
      drawSky(ctx, state, time);
      drawVine(ctx, state, time);
      drawGround(ctx);
      const plants = Array.isArray(state.plants) ? state.plants.slice() : [];
      plants.sort((a, b) => {
        const slotA = SLOTS[a.slot] || SLOTS[0];
        const slotB = SLOTS[b.slot] || SLOTS[0];
        return slotA.y - slotB.y;
      });
      for (const plant of plants) {
        const slot = SLOTS[plant.slot] || SLOTS[0];
        drawPlant(ctx, plant, slot, time, state);
      }
      drawRain(ctx, state, delta, time);
      drawFireflies(ctx, state, time);
      drawSnail(ctx, state, time);
      drawFog(ctx, time);
      drawForegroundLeaves(ctx);
      drawGlass(ctx);

      if (state.paused || state.runtime?.autoPaused) {
        ctx.fillStyle = "rgba(4, 10, 8, 0.18)";
        ctx.fillRect(0, 0, WIDTH, HEIGHT);
      }

      frame = requestAnimationFrame(draw);
    }

    function startLoop() {
      if (started) return;
      started = true;
      start = performance.now() - 12000;
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

    return {
      setState(next) {
        state = { ...state, ...next };
      },
      stop: stopLoop,
    };
  }

  window.GardenCanvas = { create };
})();
