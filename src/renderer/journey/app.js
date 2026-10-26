/* global window, document, JourneyCanvas */
(() => {
  const bridge = window.keygardenOverlay;
  const canvas = document.getElementById("world");
  const strip = document.getElementById("strip");
  const tripKicker = document.getElementById("tripKicker");
  const legName = document.getElementById("legName");
  const distance = document.getElementById("distance");
  const weather = document.getElementById("weather");
  const campBadge = document.getElementById("campBadge");
  const postcardDot = document.getElementById("postcardDot");
  const status = document.getElementById("status");
  const todayDistance = document.getElementById("todayDistance");
  const nextLeg = document.getElementById("nextLeg");
  const routeProgress = document.getElementById("routeProgress");

  const world = JourneyCanvas.create(canvas);

  const pad3 = (value) => String(Math.max(0, Number(value) || 0)).padStart(3, "0");
  const km = (meters) => `${(Math.max(0, Number(meters) || 0) / 1000).toFixed(1)} km`;

  function updateChrome(state) {
    const paused = Boolean(state.paused || state.runtime?.autoPaused || state.runtime?.paused);
    const leg = state.leg || {};
    tripKicker.textContent = `DESKBOUND / TRIP ${pad3(state.daysTogether || 1)}`;
    legName.textContent = leg.name || "雾之谷";
    distance.textContent = km(state.totalDistanceM);
    weather.textContent = paused ? "停驻" : (state.weather?.label || "晴");
    todayDistance.textContent = `今天 ${km(state.todayDistanceM)}`;
    nextLeg.textContent = `下一站 ${leg.next || "松针坡"}`;
    routeProgress.style.width = `${Math.round((leg.progress || 0) * 100)}%`;
    postcardDot.hidden = !state.hasNewPostcard || paused;
    campBadge.hidden = !(state.camped && !paused);
    strip.classList.toggle("is-paused", paused);

    if (paused) status.textContent = "停驻";
    else if (!state.today?.keys && !state.totalDistanceM) status.textContent = "等待出发";
    else if (state.camped) status.textContent = "扎营";
    else if (state.weather?.key === "rain") status.textContent = "雨里赶路";
    else if ((state.idleMs || 0) > 10 * 60 * 1000) status.textContent = "停一会儿";
    else status.textContent = "正在赶路";
  }

  function fallbackDemo() {
    return {
      mode: "journey",
      clock: "21:42",
      hour: 21,
      period: "夜里",
      daysTogether: 12,
      paused: false,
      camped: false,
      intensity: 0.16,
      idleMs: 24000,
      weather: { key: "fog", label: "夜雾" },
      leg: { name: "雾之谷", next: "松针坡", progress: 0.42 },
      totalDistanceM: 2520,
      todayDistanceM: 2520,
      today: { keys: 1140, distanceM: 2520, pauses: 3 },
      hasNewPostcard: true,
      runtime: { autoPaused: false, capture: { running: true, healthy: true } },
    };
  }

  function applyState(next) {
    if (!next) return;
    world.setState(next);
    updateChrome(next);
  }

  if (bridge) {
    bridge.onState(applyState);
    bridge.onMoveMode?.((moving) => {
      document.body.classList.toggle("is-moving", moving);
    });
    bridge.onHover?.((hovering) => {
      document.body.classList.toggle("is-hovering", hovering);
    });
    bridge
      .getState()
      .then((state) => {
        if (state) applyState(state);
        bridge.ready();
      })
      .catch(() => bridge.ready());
  } else {
    const demo = fallbackDemo();
    applyState(demo);
    let progress = demo.leg.progress;
    setInterval(() => {
      progress = (progress + 0.006) % 1;
      applyState({
        ...demo,
        leg: { ...demo.leg, progress },
        totalDistanceM: demo.totalDistanceM + progress * 100,
        camped: false,
        hasNewPostcard: true,
      });
    }, 2400);
  }

  document.addEventListener("mousedown", () => {
    if (!document.body.classList.contains("is-moving")) window.focus();
  });

  function endDrag(event) {
    if (strip.hasPointerCapture?.(event.pointerId)) strip.releasePointerCapture(event.pointerId);
    bridge?.endDrag?.();
  }

  strip.addEventListener("pointerdown", (event) => {
    if (event.button !== 0 || document.body.classList.contains("is-moving")) return;
    event.preventDefault();
    strip.setPointerCapture?.(event.pointerId);
    bridge?.startDrag?.();
  });
  strip.addEventListener("pointerup", endDrag);
  strip.addEventListener("pointercancel", endDrag);

  document.addEventListener("keydown", (event) => {
    if (!document.body.classList.contains("is-moving")) return;
    if (event.key === "Escape" || event.key === "Enter") {
      event.preventDefault();
      bridge?.endMoveMode?.();
    }
  });

  window.__keygardenJourney = { applyState };
})();
