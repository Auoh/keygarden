/* global window, document */
(() => {
  const api = window.keygarden;
  const $ = (selector) => document.querySelector(selector);
  const statusPill = $("#statusPill");
  const statusText = $("#statusText");
  const welcome = $("#welcome");
  const postcardHeading = $("#postcardHeading");
  const todayDate = $("#todayDate");
  const weekSection = $("#weekSection");
  const pcDay = $("#pcDay");
  const pcTitle = $("#pcTitle");
  const pcSubtitle = $("#pcSubtitle");
  const pcLine = $("#pcLine");
  const pcKeys = $("#pcKeys");
  const pcActive = $("#pcActive");
  const pcPauses = $("#pcPauses");
  const pcPlant = $("#pcPlant");
  const pcDate = $("#pcDate");
  const weekStrip = $("#weekStrip");
  const weatherPill = $("#weatherPill");
  const rhythmLine = $("#rhythmLine");
  const todayKeys = $("#todayKeys");
  const todayActive = $("#todayActive");
  const todayPauses = $("#todayPauses");
  const todayBursts = $("#todayBursts");
  const plantDots = $("#plantDots");
  const gardenMeta = $("#gardenMeta");
  const gardenSummaryText = $("#gardenSummaryText");
  const gardenChips = $("#gardenChips");
  const captureDot = $("#captureDot");
  const captureText = $("#captureText");
  const captureFallback = $("#captureFallback");
  const modeList = $("#modeList");
  const journeyModeTag = $("#journeyModeTag");
  const journeyToday = $("#journeyToday");
  const journeyTotal = $("#journeyTotal");
  const journeySouvenirs = $("#journeySouvenirs");
  const journeyLeg = $("#journeyLeg");
  const journeyPostcard = $("#journeyPostcard");
  const journeySwitch = $("#journeySwitch");
  const pauseToggle = $("#pauseToggle");
  const overlayToggle = $("#overlayToggle");
  const loginToggle = $("#loginToggle");
  const toast = $("#toast");

  const RHYTHM_COLORS = {
    morning: "#9dbfa2",
    night: "#8f9fca",
    steady: "#8fb8ae",
    burst: "#d8b482",
    quiet: "#77877e",
  };

  let current = null;
  let currentJourneyMode = "garden";
  let toastTimer = null;

  function pad(value) {
    return String(value).padStart(2, "0");
  }

  function dateKey(date) {
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  }

  function parseDateKey(key) {
    const [year, month, day] = String(key).split("-").map(Number);
    return new Date(year, month - 1, day);
  }

  function formatNumber(value) {
    return new Intl.NumberFormat("zh-CN").format(Math.max(0, Number(value) || 0));
  }

  function formatMinutes(ms) {
    return Math.max(0, Math.round((Number(ms) || 0) / 60000));
  }

  function formatKm(meters) {
    return (Math.max(0, Number(meters) || 0) / 1000).toFixed(1);
  }

  function formatDateShort(key) {
    if (!key) return "—";
    const date = parseDateKey(key);
    return `${pad(date.getMonth() + 1)} / ${pad(date.getDate())}`;
  }

  function formatToday() {
    return new Intl.DateTimeFormat("zh-CN", {
      month: "2-digit",
      day: "2-digit",
      weekday: "short",
    }).format(new Date());
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;");
  }

  function showToast(message) {
    toast.textContent = message;
    toast.hidden = false;
    requestAnimationFrame(() => toast.classList.add("visible"));
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toast.classList.remove("visible");
      toastTimer = setTimeout(() => {
        toast.hidden = true;
        toastTimer = null;
      }, 180);
    }, 2800);
  }

  function statusFor(data) {
    const runtime = data.runtime || {};
    const capture = runtime.capture || {};
    if (runtime.autoPaused) return { text: "屏幕休息中", className: "paused" };
    if (data.settings?.paused) return { text: "已暂停", className: "paused" };
    if (capture.error || capture.running === false) return { text: "观察器未连接", className: "error" };
    if (capture.running && capture.healthy) return { text: "正在聆听", className: "" };
    return { text: "正在连接", className: "" };
  }

  function renderStatus(data) {
    const status = statusFor(data);
    statusText.textContent = status.text;
    statusPill.className = `status-pill ${status.className}`.trim();
  }

  function renderPostcard(data) {
    const postcard = data.latestPostcard;
    const today = data.today || {};
    const daysTogether = data.daysTogether || 1;
    const rhythm = data.rhythmPreview || {};
    pcDay.textContent = `DAY ${String(daysTogether).padStart(3, "0")}`;
    todayDate.textContent = formatToday();

    const dayKeyOfToday = dateKey(new Date());
    if (postcard) {
      postcardHeading.textContent = postcard.date === (today.date || dayKeyOfToday) ? "今天的明信片" : "最近一张明信片";
      pcTitle.textContent = postcard.title || rhythm.label || "今天的天气";
      pcSubtitle.textContent = postcard.description || rhythm.description || "花园把今天记下来了。";
      pcLine.textContent = postcard.line || "今天的花园，长了一点点。";
      pcKeys.textContent = formatNumber(postcard.stats?.keys);
      pcActive.textContent = `${formatMinutes(postcard.stats?.activeMs)} 分钟`;
      pcPauses.textContent = formatNumber(postcard.stats?.pauses);
      pcPlant.textContent = postcard.newPlant?.species
        ? `今天新长出的：${postcard.newPlant.species}`
        : "今天没有新的种子，土在休息。";
      pcDate.textContent = formatDateShort(postcard.date);
    } else {
      postcardHeading.textContent = "第一张明信片";
      pcTitle.textContent = today.keys ? "雨还在下" : "第一张明信片";
      pcSubtitle.textContent = today.keys
        ? "等今天结束，我会把它写给你。"
        : "雨还没有下，花园先替你等着。";
      pcLine.textContent = today.keys
        ? "你继续工作，我继续长。结束时，这里会有一张今天的明信片。"
        : "等你开始今天的第一段工作，我会在角落慢慢长起来。";
      pcKeys.textContent = formatNumber(today.keys);
      pcActive.textContent = `${formatMinutes(today.activeMs)} 分钟`;
      pcPauses.textContent = formatNumber(today.pauses);
      pcPlant.textContent = "还没有新的种子";
      pcDate.textContent = formatDateShort(today.date);
    }
  }

  function renderWeek(data) {
    const history = Array.isArray(data.history) ? data.history : [];
    const byDate = new Map(history.map((entry) => [entry.date, entry]));
    const today = new Date();
    const todayKey = dateKey(today);
    const todayEntry = data.today || {};
    const cards = [];

    for (let offset = 6; offset >= 0; offset -= 1) {
      const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() - offset);
      const key = dateKey(date);
      const entry = byDate.get(key);
      const isToday = key === todayKey;
      let label = "安静";
      let color = "#4e5e55";
      let empty = true;

      if (entry) {
        label = entry.rhythmLabel || "一场雨";
        color = RHYTHM_COLORS[entry.rhythm] || "#8fb8ae";
        empty = false;
      } else if (isToday && todayEntry.keys > 0) {
        label = data.rhythmPreview?.label || "正在下";
        color = RHYTHM_COLORS[data.rhythmPreview?.key] || "#e7bd7e";
        empty = false;
      } else if (isToday) {
        label = data.weather?.label === "安静" ? "安静" : "正在下";
        color = "#e7bd7e";
        empty = false;
      }

      cards.push(`
        <div class="day-card ${isToday ? "today" : ""} ${empty ? "empty" : ""}">
          <div class="date">${isToday ? "今天" : `${pad(date.getMonth() + 1)}.${pad(date.getDate())}`}</div>
          <div class="weather-dot" style="background:${color}"></div>
          <div class="rhythm" title="${escapeHtml(label)}">${escapeHtml(label)}</div>
        </div>
      `);
    }

    weekStrip.innerHTML = cards.join("");
  }

  function renderToday(data) {
    const today = data.today || {};
    const rhythm = data.rhythmPreview || {};
    const settings = data.settings || {};
    const runtime = data.runtime || {};
    const capture = runtime.capture || {};
    const paused = Boolean(settings.paused || runtime.autoPaused);

    weatherPill.textContent = paused ? "暂歇" : (data.weather?.label || "等风");
    rhythmLine.textContent = today.keys
      ? `${rhythm.label || "一场雨"} · ${rhythm.description || "花园正在记录今天的节奏。"}`
      : "雨还没开始，花园在等第一声键盘。";

    todayKeys.textContent = formatNumber(today.keys);
    todayActive.textContent = formatNumber(Math.round((today.activeMs || 0) / 60000));
    todayPauses.textContent = formatNumber(today.pauses);
    todayBursts.textContent = formatNumber(today.bursts);

    const plants = Array.isArray(data.plants) ? data.plants : [];
    plantDots.innerHTML = plants
      .slice(0, 9)
      .map((plant) => `<i class="${escapeHtml(plant.type)}"></i>`)
      .join("");
    gardenMeta.textContent = `${plants.length} 株植物 · 第 ${data.daysTogether || 1} 天${data.garden?.archived ? ` · 已收藏 ${data.garden.archived} 株` : ""}`;

    if (paused) {
      captureDot.className = "capture-dot paused";
      captureText.textContent = runtime.autoPaused ? "屏幕休息中，观察器已停止" : "已暂停记录";
      captureFallback.textContent = "";
    } else if (capture.error || capture.running === false) {
      captureDot.className = "capture-dot error";
      captureText.textContent = "键盘观察器未连接";
      captureFallback.textContent = capture.error ? "查看日志" : "";
    } else if (capture.running && capture.healthy) {
      captureDot.className = "capture-dot on";
      captureText.textContent = "正在聆听键盘节奏";
      captureFallback.textContent = "只读节奏";
    } else {
      captureDot.className = "capture-dot";
      captureText.textContent = "观察器连接中";
      captureFallback.textContent = "";
    }
  }

  function renderGardenSummary(data) {
    const plants = Array.isArray(data.plants) ? data.plants : [];
    const labels = { fern: "蕨", mushroom: "菌", flower: "花", moss: "苔" };
    if (!plants.length) {
      gardenSummaryText.textContent = "还没有植物，第一颗种子在等今天的工作。";
      gardenChips.innerHTML = "";
      return;
    }
    gardenSummaryText.textContent = `${plants.length} 株植物正在屏幕角落慢慢长。${data.garden?.archived ? ` 另有 ${data.garden.archived} 株被收进了旧花园。` : ""}`;
    const shown = plants.slice(0, 6);
    gardenChips.innerHTML = shown
      .map((plant) => {
        const species = plant.species || labels[plant.type] || "芽";
        return `<span class="gchip" title="${escapeHtml(species)}"><i class="${escapeHtml(plant.type)}"></i>${escapeHtml(species)}</span>`;
      })
      .join("") + (plants.length > shown.length ? `<span class="gchip">+${plants.length - shown.length}</span>` : "");
  }

  function renderJourney(data) {
    const journey = data.journey || {};
    const mode = data.mode || "garden";
    currentJourneyMode = mode;
    const leg = journey.leg || {};
    const postcard = journey.latestPostcard;
    journeyModeTag.textContent = mode === "journey"
      ? "正在远行"
      : (journey.totalDistanceM > 0 ? "可切换" : "待出发");
    journeyToday.textContent = formatKm(journey.todayDistanceM);
    journeyTotal.textContent = formatKm(journey.totalDistanceM);
    journeySouvenirs.textContent = formatNumber((journey.souvenirs || []).length);
    journeyLeg.textContent = `${leg.name || "雾之谷"} → ${leg.next || "松针坡"}`;
    journeyPostcard.textContent = postcard
      ? `${postcard.title} · ${postcard.line}${postcard.souvenir ? ` · 拾到 ${postcard.souvenir}` : ""}`
      : "还没有旅行明信片。开始工作，他就会出发。";
    journeySwitch.textContent = mode === "journey" ? "回到键息花园" : "进入桌边远行";
  }

  function renderModes(data) {
    const modes = Array.isArray(data.modes) ? data.modes : [];
    const currentMode = data.mode || "garden";
    modeList.innerHTML = modes
      .map((mode) => {
        const active = mode.id === currentMode;
        const available = mode.status === "ready";
        const className = active ? "active" : available ? "ready" : "soon";
        return `
          <button class="mode-card ${className}" data-mode="${escapeHtml(mode.id)}" type="button">
            <span class="mode-index">${escapeHtml(mode.index)}</span>
            <span class="mode-copy">
              <span class="mode-name">${escapeHtml(mode.name)} <small>${escapeHtml(mode.english)}</small></span>
              <span class="mode-tagline">${escapeHtml(mode.tagline)}</span>
            </span>
            <span class="mode-state">${active ? "当前" : available ? "可切换" : "SOON"}</span>
          </button>
        `;
      })
      .join("");
  }

  function renderSettings(data) {
    const settings = data.settings || {};
    pauseToggle.checked = Boolean(settings.paused);
    overlayToggle.checked = Boolean(settings.overlayVisible);
    loginToggle.checked = Boolean(settings.launchAtLogin);
  }

  function renderWelcome(data) {
    welcome.hidden = !data.firstRun;
    weekSection.hidden = Boolean(data.firstRun);
  }

  function render(data) {
    if (!data) return;
    current = data;
    renderStatus(data);
    renderWelcome(data);
    renderPostcard(data);
    renderWeek(data);
    renderToday(data);
    renderGardenSummary(data);
    renderJourney(data);
    renderModes(data);
    renderSettings(data);
  }

  async function callApi(promise, fallbackMessage) {
    if (!api) {
      showToast(fallbackMessage || "这是预览模式，打开桌面应用后生效。");
      return null;
    }
    try {
      return await promise;
    } catch (error) {
      showToast("操作失败：" + (error?.message || "未知错误"));
      return null;
    }
  }

  function bindUi() {
    $("#minimizeBtn").addEventListener("click", () => callApi(api?.minimize()));
    $("#closeBtn").addEventListener("click", () => callApi(api?.hide()));
    $("#startBtn").addEventListener("click", async () => {
      await callApi(api?.completeFirstRun());
      await callApi(api?.hide());
    });
    $("#welcomePrivacyBtn").addEventListener("click", () => callApi(api?.openPrivacy()));
    $("#moveOverlayTitle").addEventListener("click", () => callApi(api?.moveOverlay()));
    $("#moveOverlayBtn").addEventListener("click", () => callApi(api?.moveOverlay()));
    $("#resetOverlayBtn").addEventListener("click", () => callApi(api?.resetOverlayPosition()));
    $("#dataBtn").addEventListener("click", () => callApi(api?.openDataFolder()));
    $("#privacyBtn").addEventListener("click", () => callApi(api?.openPrivacy()));
    $("#quitBtn").addEventListener("click", () => {
      if (api) api.quit();
      else showToast("这是预览模式，打开桌面应用后可以退出。");
    });

    pauseToggle.addEventListener("change", async () => {
      await callApi(api?.setPaused(pauseToggle.checked));
    });
    overlayToggle.addEventListener("change", async () => {
      await callApi(api?.setOverlayVisible(overlayToggle.checked));
    });
    loginToggle.addEventListener("change", async () => {
      await callApi(api?.setLaunchAtLogin(loginToggle.checked));
    });

    journeySwitch.addEventListener("click", async () => {
      const target = currentJourneyMode === "journey" ? "garden" : "journey";
      const result = await callApi(api?.setMode(target));
      if (result && result.ok === false) {
        showToast(result.reason || "这个模式还在路上。");
      } else if (!api) {
        showToast("这是预览模式，打开桌面应用后可以切换。");
      }
    });

    modeList.addEventListener("click", async (event) => {
      const card = event.target.closest(".mode-card");
      if (!card) return;
      const mode = card.dataset.mode;
      const result = await callApi(api?.setMode(mode));
      if (result && result.ok === false) showToast(result.reason || "这个模式还在路上。");
      if (!api && mode !== "garden") {
        const name = card.querySelector(".mode-name")?.textContent || "这个模式";
        showToast(`${name.trim()}正在路上。现在先让 A 键息花园陪你。`);
      }
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        callApi(api?.hide());
      }
    });
  }

  function demoDashboard() {
    const now = new Date();
    const todayKey = dateKey(now);
    const history = [
      {
        date: "2026-10-24",
        rhythm: "night",
        rhythmLabel: "夜间细雨",
        postcard: {
          date: "2026-10-24",
          title: "夜间细雨",
          line: "灯亮着，花园也跟着醒着。",
          description: "灯亮得晚，雨声很轻。",
          newPlant: { type: "fern", species: "月影蕨" },
          stats: { keys: 3180, activeMs: 4300000, pauses: 5, bursts: 18 },
        },
        newPlant: { type: "fern", species: "月影蕨" },
      },
      {
        date: "2026-10-23",
        rhythm: "steady",
        rhythmLabel: "绵长溪流",
        postcard: null,
        newPlant: null,
      },
      {
        date: "2026-10-22",
        rhythm: "morning",
        rhythmLabel: "晨间阵雨",
        postcard: null,
        newPlant: { type: "flower", species: "晨光花" },
      },
      {
        date: "2026-10-21",
        rhythm: "burst",
        rhythmLabel: "一阵风",
        postcard: null,
        newPlant: { type: "mushroom", species: "雨后菌" },
      },
      {
        date: "2026-10-20",
        rhythm: "quiet",
        rhythmLabel: "零星小雨",
        postcard: null,
        newPlant: null,
      },
    ];
    return {
      clock: "23:10",
      period: "夜里",
      daysTogether: 12,
      firstRun: false,
      mode: "garden",
      paused: false,
      settings: { paused: false, overlayVisible: true, launchAtLogin: false },
      hasNewPostcard: true,
      weather: { key: "rain", label: "微雨" },
      rhythmPreview: { key: "night", label: "夜间细雨", description: "灯亮得晚，雨声很轻。" },
      today: {
        date: todayKey,
        keys: 2140,
        activeMs: 3100000,
        pauses: 3,
        bursts: 11,
        categories: { letter: 1600, digit: 120, punct: 280, space: 120, enter: 18, backspace: 2 },
      },
      latestPostcard: {
        date: "2026-10-24",
        title: "夜间细雨",
        description: "灯亮得晚，雨声很轻。",
        line: "灯亮着，花园也跟着醒着。",
        newPlant: { type: "fern", species: "月影蕨" },
        stats: { keys: 3180, activeMs: 4300000, pauses: 5, bursts: 18 },
      },
      history,
      modes: [
        { id: "garden", index: "A", name: "键息花园", english: "Between Keys", tagline: "你工作，它下雨。你停下，它入夜。", status: "ready" },
        { id: "journey", index: "B", name: "桌边远行", english: "Deskbound", tagline: "你工作，他赶路；你停下，他扎营。", status: "ready" },
        { id: "town", index: "C", name: "键盘小镇", english: "Key Town", tagline: "每一下敲击，亮一盏灯。", status: "soon" },
      ],
      plants: [
        { type: "fern", species: "月影蕨", growth: 0.86, slot: 0 },
        { type: "mushroom", species: "灯下菌", growth: 0.68, slot: 1 },
        { type: "flower", species: "夜灯花", growth: 0.62, slot: 2 },
        { type: "fern", species: "溪畔蕨", growth: 0.48, slot: 3 },
        { type: "flower", species: "晨光花", growth: 0.78, slot: 4 },
        { type: "mushroom", species: "苔间菌", growth: 0.36, slot: 5 },
        { type: "moss", species: "月苔", growth: 0.88, slot: 6 },
      ],
      garden: { archived: 2 },
      journey: {
        totalDistanceM: 9420,
        todayDistanceM: 2520,
        souvenirs: ["旧车票", "松果"],
        leg: { name: "旧车站", next: "风蚀原", progress: 0.57 },
        latestPostcard: {
          title: "松针坡",
          line: "松针落在肩上，路比想象中更软。",
          souvenir: "松果",
        },
      },
      runtime: { capture: { running: true, healthy: true, error: null }, autoPaused: false },
    };
  }

  async function init() {
    bindUi();
    if (!api) {
      render(demoDashboard());
      return;
    }
    api.onUpdate((data) => render(data));
    try {
      const data = await api.getDashboard();
      render(data);
    } catch (error) {
      showToast("手帐加载失败：" + (error?.message || "未知错误"));
    }
  }

  init();
})();
