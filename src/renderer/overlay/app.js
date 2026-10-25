/* global window, document, PhotoGarden */
(() => {
  const bridge = window.keygardenOverlay;
  const canvas = document.getElementById("garden");
  const card = document.getElementById("gardenCard");
  const clock = document.getElementById("clock");
  const weather = document.getElementById("weather");
  const weatherIcon = document.getElementById("weatherIcon");
  const weatherLabel = document.getElementById("weatherLabel");
  const dayLabel = document.getElementById("dayLabel");
  const hint = document.getElementById("hint");
  const pauseLayer = document.getElementById("pauseLayer");
  const pauseHint = document.getElementById("pauseHint");
  const postcardDot = document.getElementById("postcardDot");

  const garden = PhotoGarden.create(canvas, {
    onTheme(theme) {
      document.body.dataset.theme = theme;
      card.dataset.theme = theme;
    },
  });
  let current = null;

  function fallbackDemoState() {
    const now = new Date();
    const hour = now.getHours();
    const period = hour < 5 ? "深夜" : hour < 9 ? "清晨" : hour < 12 ? "上午" : hour < 14 ? "正午" : hour < 18 ? "下午" : hour < 22 ? "傍晚" : "夜里";
    const plants = [
      { type: "fern", growth: 0.92, slot: 0, species: "溪畔蕨" },
      { type: "mushroom", growth: 0.72, slot: 1, species: "灯下菌" },
      { type: "flower", growth: 0.62, slot: 2, species: "夜灯花" },
      { type: "fern", growth: 0.48, slot: 3, species: "月影蕨" },
      { type: "flower", growth: 0.78, slot: 4, species: "晨光花" },
      { type: "mushroom", growth: 0.36, slot: 5, species: "苔间菌" },
      { type: "moss", growth: 0.88, slot: 6, species: "月苔" },
    ];
    return {
      clock: `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`,
      period,
      daysTogether: 12,
      paused: false,
      intensity: 0.18,
      idleMs: 0,
      firstRun: false,
      hasNewPostcard: true,
      weather: { key: "rain", label: "微雨", detail: "雨声很轻" },
      plants,
      lastInput: null,
      runtime: { autoPaused: false, capture: { healthy: true } },
    };
  }

  function updateChrome(state) {
    const paused = Boolean(state.paused || state.runtime?.autoPaused);
    const isAutoPaused = Boolean(state.runtime?.autoPaused);
    const captureError = state.runtime?.capture?.error;
    const captureRunning = state.runtime?.capture?.running !== false;

    card.classList.toggle("is-paused", paused);
    clock.textContent = state.clock || "--:--";
    dayLabel.textContent = `第 ${state.daysTogether || 1} 天 · ${state.period || "此刻"}`;

    const weatherKey = paused ? "paused" : (state.weather?.key || "calm");
    weatherIcon.className = `weather-icon ${["rain", "breeze", "quiet", "paused"].includes(weatherKey) ? weatherKey : "quiet"}`;
    weatherLabel.textContent = paused ? "暂停" : (state.weather?.label || "等风");
    weather.title = state.weather?.detail || "";

    pauseLayer.hidden = !paused;
    pauseHint.textContent = isAutoPaused ? "解锁后继续" : "Ctrl+Alt+空格 继续";

    postcardDot.hidden = !state.hasNewPostcard || paused;

    if (paused) {
      hint.textContent = isAutoPaused ? "屏幕休息，花园也休息" : "花园在等你";
    } else if (captureError || !captureRunning) {
      hint.textContent = "观察器未连接，打开手帐看看";
    } else if (state.firstRun) {
      hint.textContent = "先开始工作吧，我会慢慢长";
    } else if (state.hasNewPostcard) {
      hint.textContent = "今晚有一张明信片";
    } else if ((state.idleMs || 0) > 10 * 60 * 1000) {
      hint.textContent = "你休息，我也休息";
    } else {
      hint.textContent = "继续工作，别管我";
    }
  }

  function applyState(next) {
    if (!next) return;
    current = next;
    garden.setState(next);
    updateChrome(next);
  }

  if (bridge) {
    bridge.onState(applyState);
    bridge
      .getState()
      .then((state) => {
        if (state) applyState(state);
        bridge.ready();
      })
      .catch(() => {
        bridge.ready();
      });
  } else {
    // The standalone HTML preview (used for visual development) gets a small
    // deterministic scene so the overlay can be inspected without Electron.
    const demo = fallbackDemoState();
    applyState(demo);
    let phase = 0;
    setInterval(() => {
      phase += 1;
      const intensity = [0.08, 0.3, 0.55, 0.2, 0.04][phase % 5];
      applyState({
        ...demo,
        clock: new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" }),
        intensity,
        lastInput: { category: phase % 3 === 0 ? "punct" : "letter", at: Date.now() },
        weather: {
          key: intensity > 0.4 ? "rain" : intensity > 0.1 ? "breeze" : "calm",
          label: intensity > 0.4 ? "骤雨" : intensity > 0.1 ? "微雨" : "等风",
          detail: "",
        },
      });
    }, 3200);
  }

  // A small hook for screenshot tooling.
  window.__keygardenOverlay = { applyState, get current() { return current; } };
})();
