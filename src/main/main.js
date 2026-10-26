const path = require("node:path");
const fs = require("node:fs");
const {
  app,
  BrowserWindow,
  Menu,
  Tray,
  nativeImage,
  globalShortcut,
  ipcMain,
  screen,
  shell,
  powerMonitor,
} = require("electron");

const { GameEngine } = require("./engine");
const { StateStore } = require("./store");
const { KeyObserver } = require("./observer");
const { MODES } = require("../shared/modes");

const APP_ROOT = path.resolve(__dirname, "../..");
const isPackaged = app.isPackaged;
const isDev = !isPackaged;
const DEMO_MODE = process.env.KEYGARDEN_DEMO === "1";

app.setName("Keygarden");
app.setAppUserModelId("com.auoh.keygarden");
app.disableHardwareAcceleration();

if (DEMO_MODE) {
  // Never let a screenshot/demo session write into a real player's garden.
  app.setPath("userData", path.join(app.getPath("temp"), "keygarden-demo"));
}

let engine = null;
let store = null;
let observer = null;
let overlayWindow = null;
let journalWindow = null;
let tray = null;
let isQuitting = false;
let isAutoPaused = false;
let firstRun = false;
let broadcastTimer = null;
let fastBroadcastTimer = null;
let hotkeyStatus = {};
let captureTimer = null;
let overlayMoveMode = false;
let overlayMoveTimer = null;
let overlayInteractive = false;
let overlayHitTestTimer = null;
let overlayDragTimer = null;
let overlayDragSafety = null;
let overlayDragOffset = { x: 0, y: 0 };

const gotLock = process.env.KEYGARDEN_CAPTURE === "1" ? true : app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on("second-instance", () => showJournal());
  app.whenReady().then(init);
}

function resourcePath(name) {
  return isPackaged
    ? path.join(process.resourcesPath, name)
    : path.join(APP_ROOT, "resources", name);
}

function appFilePath(...parts) {
  return path.join(__dirname, ...parts);
}

function rendererFile(folder, file) {
  return path.join(__dirname, "..", "renderer", folder, file);
}

function preloadFile(file) {
  return path.join(__dirname, "..", "preload", file);
}

function log(...args) {
  if (!isDev && process.env.KEYGARDEN_DEBUG !== "1") return;
  console.log("[keygarden]", ...args);
}

function readIcon(size = 32) {
  const base = resourcePath("icon.png");
  if (!fs.existsSync(base)) return nativeImage.createEmpty();
  const image = nativeImage.createFromPath(base);
  return size ? image.resize({ width: size, height: size }) : image;
}

function runtimeStatus() {
  return {
    capture: observer ? observer.getStatus() : { running: false, healthy: false, error: "not started" },
    autoPaused: isAutoPaused,
    paused: Boolean(engine?.getState().settings.paused),
    overlayVisible: Boolean(engine?.getState().settings.overlayVisible),
    launchAtLogin: Boolean(engine?.getState().settings.launchAtLogin),
    mode: engine?.getState().profile.mode || "garden",
    hotkeys: { ...hotkeyStatus },
    dataDir: store?.getDataDir() || "",
    version: app.getVersion(),
    packaged: isPackaged,
    helperPath: resourcePath("KeygardenKeys.exe"),
  };
}

function overlayPayload() {
  const mode = engine.getState().profile.mode;
  const state = mode === "journey" ? engine.journeySnapshot(Date.now()) : engine.snapshot(Date.now());
  return {
    ...state,
    mode,
    runtime: runtimeStatus(),
  };
}

function journalPayload() {
  return {
    ...engine.dashboard(Date.now()),
    runtime: runtimeStatus(),
  };
}

function sendOverlayState() {
  if (!overlayWindow || overlayWindow.isDestroyed()) return;
  overlayWindow.webContents.send("overlay:state", overlayPayload());
}

function sendJournalState() {
  if (!journalWindow || journalWindow.isDestroyed()) return;
  if (!journalWindow.isVisible()) return;
  journalWindow.webContents.send("journal:update", journalPayload());
}

function broadcast() {
  sendOverlayState();
  sendJournalState();
}

function queueFastBroadcast() {
  if (fastBroadcastTimer) return;
  fastBroadcastTimer = setTimeout(() => {
    fastBroadcastTimer = null;
    broadcast();
  }, 160);
}

function scheduleSave() {
  if (store && engine) store.scheduleSave(engine.getState(), 5000);
}

function overlayMode() {
  return engine?.getState().profile.mode === "journey" ? "journey" : "garden";
}

function overlayRendererFile() {
  return overlayMode() === "journey" ? rendererFile("journey", "index.html") : rendererFile("overlay", "index.html");
}

function overlaySize() {
  return overlayMode() === "journey" ? { width: 1000, height: 240 } : { width: 260, height: 320 };
}

function clampOverlayBounds(bounds) {
  const display = screen.getDisplayNearestPoint({
    x: Math.round(bounds.x + bounds.width / 2),
    y: Math.round(bounds.y + bounds.height / 2),
  });
  const area = display.workArea;
  const width = Math.min(bounds.width, Math.max(320, area.width - 24));
  const height = Math.min(bounds.height, area.height);
  return {
    width,
    height,
    x: Math.round(Math.max(area.x, Math.min(bounds.x, area.x + area.width - width))),
    y: Math.round(Math.max(area.y, Math.min(bounds.y, area.y + area.height - height))),
  };
}

function positionOverlay() {
  if (!overlayWindow || overlayWindow.isDestroyed()) return;
  const display = screen.getPrimaryDisplay();
  const { width, height } = overlaySize();
  const mode = overlayMode();
  const saved = engine.getState().settings.overlayPositions?.[mode];
  let bounds;
  if (saved && Number.isFinite(saved.x) && Number.isFinite(saved.y)) {
    bounds = clampOverlayBounds({ x: saved.x, y: saved.y, width, height });
  } else {
    const safeWidth = Math.min(width, Math.max(320, display.workArea.width - 24));
    bounds = clampOverlayBounds({
      width: safeWidth,
      height,
      x: mode === "journey"
        ? display.workArea.x + (display.workArea.width - safeWidth) / 2
        : display.workArea.x + display.workArea.width - safeWidth - 16,
      y: display.workArea.y + display.workArea.height - height - 16,
    });
  }
  overlayWindow.setBounds(bounds);
}

function overlayCardRect() {
  if (!overlayWindow || overlayWindow.isDestroyed()) return null;
  const bounds = overlayWindow.getBounds();
  const card = overlayMode() === "journey"
    ? { x: 20, y: 20, width: 960, height: 200 }
    : { x: 20, y: 20, width: 220, height: 280 };
  return {
    x: bounds.x + card.x,
    y: bounds.y + card.y,
    width: card.width,
    height: card.height,
  };
}

function setOverlayInteractive(interactive) {
  if (!overlayWindow || overlayWindow.isDestroyed()) return;
  if (overlayInteractive === interactive) return;
  overlayInteractive = interactive;
  if (interactive) {
    overlayWindow.setIgnoreMouseEvents(false);
    overlayWindow.setFocusable(true);
  } else {
    if (overlayWindow.isFocused()) overlayWindow.blur();
    overlayWindow.setIgnoreMouseEvents(true, { forward: true });
    overlayWindow.setFocusable(false);
  }
  if (!overlayWindow.webContents.isDestroyed()) {
    overlayWindow.webContents.send("overlay:hover", interactive);
  }
}

function updateOverlayHitTest() {
  if (!overlayWindow || overlayWindow.isDestroyed()) return;
  if (overlayMoveMode) {
    setOverlayInteractive(true);
    return;
  }
  if (!engine?.getState().settings.overlayVisible || !overlayWindow.isVisible()) {
    setOverlayInteractive(false);
    return;
  }
  const rect = overlayCardRect();
  if (!rect) return;
  const point = screen.getCursorScreenPoint();
  const inside = point.x >= rect.x && point.x <= rect.x + rect.width
    && point.y >= rect.y && point.y <= rect.y + rect.height;
  setOverlayInteractive(inside);
}

function startOverlayHitTest() {
  if (overlayHitTestTimer) clearInterval(overlayHitTestTimer);
  overlayHitTestTimer = setInterval(updateOverlayHitTest, 50);
  overlayHitTestTimer.unref?.();
  updateOverlayHitTest();
}

function startOverlayDrag() {
  if (!overlayWindow || overlayWindow.isDestroyed() || overlayMoveMode) return;
  if (overlayDragTimer) return;
  const cursor = screen.getCursorScreenPoint();
  const [windowX, windowY] = overlayWindow.getPosition();
  overlayDragOffset = { x: cursor.x - windowX, y: cursor.y - windowY };
  setOverlayInteractive(true);
  overlayDragTimer = setInterval(() => {
    if (!overlayWindow || overlayWindow.isDestroyed()) return;
    const point = screen.getCursorScreenPoint();
    overlayWindow.setPosition(Math.round(point.x - overlayDragOffset.x), Math.round(point.y - overlayDragOffset.y));
  }, 16);
  overlayDragSafety = setTimeout(endOverlayDrag, 30000);
}

function endOverlayDrag() {
  if (!overlayDragTimer) return;
  clearInterval(overlayDragTimer);
  overlayDragTimer = null;
  if (overlayDragSafety) clearTimeout(overlayDragSafety);
  overlayDragSafety = null;
  saveOverlayPosition();
  updateOverlayHitTest();
}

function createOverlayWindow() {
  const { width, height } = overlaySize();
  overlayWindow = new BrowserWindow({
    width,
    height,
    show: false,
    transparent: true,
    backgroundColor: "#00000000",
    frame: false,
    resizable: false,
    movable: false,
    minimizable: false,
    maximizable: false,
    fullscreenable: false,
    skipTaskbar: true,
    focusable: false,
    alwaysOnTop: false,
    hasShadow: false,
    acceptFirstMouse: false,
    webPreferences: {
      preload: preloadFile("overlay.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      backgroundThrottling: false,
    },
  });

  overlayWindow.setMenuBarVisibility(false);
  overlayWindow.setVisibleOnAllWorkspaces(false);
  overlayWindow.setIgnoreMouseEvents(true, { forward: true });
  overlayWindow.webContents.on("did-finish-load", () => {
    sendOverlayState();
    if (overlayMoveMode) overlayWindow.webContents.send("overlay:move-mode", true);
  });
  overlayWindow.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
  overlayWindow.on("closed", () => {
    overlayWindow = null;
  });
  overlayWindow.on("move", () => {
    if (overlayMoveMode || overlayInteractive) saveOverlayPosition();
  });
  overlayWindow.loadFile(overlayRendererFile());
  positionOverlay();
  startOverlayHitTest();

  overlayWindow.once("ready-to-show", () => {
    if (engine.getState().settings.overlayVisible) overlayWindow.showInactive();
  });
}

function refreshOverlayMode() {
  if (!overlayWindow || overlayWindow.isDestroyed()) return;
  endOverlayDrag();
  if (overlayMoveMode) setMoveMode(false);
  positionOverlay();
  overlayWindow.loadFile(overlayRendererFile());
  if (engine.getState().settings.overlayVisible) {
    overlayWindow.showInactive();
    startOverlayHitTest();
  }
}

function saveOverlayPosition() {
  if (!overlayWindow || overlayWindow.isDestroyed() || !engine) return;
  const [x, y] = overlayWindow.getPosition();
  engine.setOverlayPosition(overlayMode(), { x, y });
  scheduleSave();
}

function setMoveMode(enabled) {
  if (!overlayWindow || overlayWindow.isDestroyed()) return;
  if (enabled) {
    endOverlayDrag();
    if (overlayMoveMode) {
      if (overlayMoveTimer) clearTimeout(overlayMoveTimer);
      overlayMoveTimer = setTimeout(() => setMoveMode(false), 20000);
      return;
    }
    if (!engine.getState().settings.overlayVisible) setOverlayVisible(true);
    overlayMoveMode = true;
    overlayWindow.setAlwaysOnTop(true, "floating");
    overlayWindow.setMovable(true);
    setOverlayInteractive(true);
    overlayWindow.show();
    overlayWindow.focus();
    overlayWindow.webContents.send("overlay:move-mode", true);
    overlayMoveTimer = setTimeout(() => setMoveMode(false), 20000);
    updateTray();
    log("overlay move mode on");
    return;
  }

  if (!overlayMoveMode) return;
  overlayMoveMode = false;
  if (overlayMoveTimer) clearTimeout(overlayMoveTimer);
  overlayMoveTimer = null;
  saveOverlayPosition();
  overlayWindow.webContents.send("overlay:move-mode", false);
  overlayWindow.setMovable(false);
  overlayWindow.setAlwaysOnTop(false);
  setOverlayInteractive(false);
  updateOverlayHitTest();
  updateTray();
  log("overlay move mode off");
}

function createJournalWindow() {
  const display = screen.getPrimaryDisplay();
  const journalHeight = Math.max(640, Math.min(820, display.workAreaSize.height - 56));
  journalWindow = new BrowserWindow({
    width: 1080,
    height: journalHeight,
    minWidth: 940,
    minHeight: Math.min(640, journalHeight),
    center: true,
    show: false,
    frame: false,
    resizable: true,
    maximizable: false,
    fullscreenable: false,
    backgroundColor: "#f3f5ef",
    icon: readIcon(0),
    title: "键息花园",
    webPreferences: {
      preload: preloadFile("journal.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  journalWindow.setMenuBarVisibility(false);
  journalWindow.loadFile(rendererFile("journal", "index.html"));
  journalWindow.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
  journalWindow.webContents.on("did-finish-load", () => sendJournalState());

  journalWindow.on("close", (event) => {
    if (!isQuitting) {
      event.preventDefault();
      hideJournal();
    }
  });

  journalWindow.on("closed", () => {
    journalWindow = null;
  });
}

function showJournal({ fromTray = false } = {}) {
  if (overlayMoveMode) setMoveMode(false);
  if (!journalWindow || journalWindow.isDestroyed()) createJournalWindow();
  if (journalWindow.isMinimized()) journalWindow.restore();
  journalWindow.show();
  journalWindow.focus();
  engine.markPostcardSeen();
  scheduleSave();
  sendJournalState();
  log("journal shown", { fromTray });
}

function hideJournal() {
  if (!journalWindow || journalWindow.isDestroyed()) return;
  journalWindow.hide();
  engine.completeFirstRun();
  scheduleSave();
}

function setOverlayVisible(visible, { save = true } = {}) {
  if (!visible) {
    endOverlayDrag();
    if (overlayMoveMode) setMoveMode(false);
  }
  engine.setOverlayVisible(visible);
  if (overlayWindow && !overlayWindow.isDestroyed()) {
    if (visible) {
      overlayWindow.showInactive();
      updateOverlayHitTest();
    } else {
      setOverlayInteractive(false);
      overlayWindow.hide();
    }
  }
  if (save) scheduleSave();
  updateTray();
  broadcast();
}

function setPaused(paused) {
  engine.setPaused(paused);
  if (paused) {
    observer?.stop();
  } else {
    isAutoPaused = false;
    observer?.start();
  }
  scheduleSave();
  updateTray();
  broadcast();
  log("paused changed", paused);
}

function setLaunchAtLogin(enabled) {
  engine.setLaunchAtLogin(enabled);
  try {
    app.setLoginItemSettings({
      openAtLogin: Boolean(enabled),
      openAsHidden: true,
      args: ["--hidden"],
    });
  } catch (error) {
    log("login item error", error.message);
  }
  scheduleSave();
  updateTray();
  sendJournalState();
}

function toggleOverlay() {
  setOverlayVisible(!engine.getState().settings.overlayVisible);
}

function togglePause() {
  setPaused(!engine.getState().settings.paused);
}

function buildTrayMenu() {
  const paused = Boolean(engine?.getState().settings.paused);
  const overlayVisible = Boolean(engine?.getState().settings.overlayVisible);
  return Menu.buildFromTemplate([
    {
      label: "打开花园手帐",
      click: () => showJournal({ fromTray: true }),
    },
    { type: "separator" },
    {
      label: "显示花园",
      type: "checkbox",
      checked: overlayVisible,
      click: () => setOverlayVisible(!overlayVisible),
    },
    {
      label: overlayMoveMode ? "锁定窗口" : "移动窗口（20 秒）",
      click: () => setMoveMode(!overlayMoveMode),
    },
    {
      label: "重置窗口位置",
      click: () => {
        engine.resetOverlayPositions();
        positionOverlay();
        scheduleSave();
      },
    },
    {
      label: paused ? "继续记录" : "暂停记录",
      type: "checkbox",
      checked: paused,
      click: () => setPaused(!paused),
    },
    {
      label: "开机启动",
      type: "checkbox",
      checked: Boolean(engine?.getState().settings.launchAtLogin),
      click: () => setLaunchAtLogin(!engine.getState().settings.launchAtLogin),
    },
    { type: "separator" },
    {
      label: "打开数据目录",
      click: () => shell.openPath(store.getDataDir()),
    },
    {
      label: "退出键息花园",
      click: () => {
        isQuitting = true;
        app.quit();
      },
    },
  ]);
}

function updateTray() {
  if (!tray) return;
  tray.setContextMenu(buildTrayMenu());
  const paused = engine?.getState().settings.paused;
  tray.setToolTip(paused ? "键息花园 · 已暂停" : "键息花园 · 正在聆听");
}

function createTray() {
  tray = new Tray(readIcon(32));
  tray.setToolTip("键息花园 · 正在聆听");
  tray.setContextMenu(buildTrayMenu());
  tray.on("click", () => showJournal({ fromTray: true }));
}

function registerHotkeys() {
  hotkeyStatus = {};
  const bindings = [
    ["Control+Alt+G", "打开花园手帐", () => showJournal()],
    ["Control+Alt+H", "显示/隐藏角落花园", () => toggleOverlay()],
    ["Control+Alt+Space", "暂停/继续记录", () => togglePause()],
  ];
  for (const [accelerator, label, handler] of bindings) {
    let ok = false;
    try {
      ok = globalShortcut.register(accelerator, handler);
    } catch {
      ok = false;
    }
    hotkeyStatus[accelerator] = { label, ok };
    if (!ok) log("hotkey registration failed", accelerator);
  }
}

function unregisterHotkeys() {
  for (const accelerator of Object.keys(hotkeyStatus)) {
    try {
      globalShortcut.unregister(accelerator);
    } catch {
      // Ignore.
    }
  }
  hotkeyStatus = {};
}

function bindIpc() {
  ipcMain.handle("app:get-dashboard", () => journalPayload());
  ipcMain.handle("app:get-overlay-state", () => overlayPayload());
  ipcMain.handle("app:set-paused", (_event, paused) => {
    setPaused(Boolean(paused));
    return { ok: true, paused: Boolean(engine.getState().settings.paused) };
  });
  ipcMain.handle("app:set-overlay-visible", (_event, visible) => {
    setOverlayVisible(Boolean(visible));
    return { ok: true, visible: Boolean(engine.getState().settings.overlayVisible) };
  });
  ipcMain.handle("app:set-launch-at-login", (_event, enabled) => {
    setLaunchAtLogin(Boolean(enabled));
    return { ok: true, enabled: Boolean(engine.getState().settings.launchAtLogin) };
  });
  ipcMain.handle("app:complete-first-run", () => {
    engine.completeFirstRun();
    scheduleSave();
    sendJournalState();
    return { ok: true };
  });
  ipcMain.handle("app:mark-postcard-seen", () => {
    engine.markPostcardSeen();
    scheduleSave();
    return { ok: true };
  });
  ipcMain.handle("app:open-data-folder", async () => {
    return shell.openPath(store.getDataDir());
  });
  ipcMain.handle("app:open-privacy", async () => {
    const privacyPath = path.join(APP_ROOT, "PRIVACY.md");
    if (!fs.existsSync(privacyPath)) return "missing";
    return shell.openPath(privacyPath);
  });
  ipcMain.handle("app:move-overlay", () => {
    hideJournal();
    setMoveMode(true);
    return { ok: true };
  });
  ipcMain.handle("app:reset-overlay-position", () => {
    engine.resetOverlayPositions();
    positionOverlay();
    scheduleSave();
    return { ok: true };
  });
  ipcMain.handle("app:set-mode", (_event, mode) => {
    if (mode !== "garden" && mode !== "journey") {
      const candidate = MODES.find((item) => item.id === mode);
      return { ok: false, reason: candidate ? `${candidate.name}正在路上` : "未知模式" };
    }
    engine.setMode(mode);
    scheduleSave();
    refreshOverlayMode();
    broadcast();
    return { ok: true, mode };
  });
  ipcMain.handle("app:minimize-journal", () => {
    journalWindow?.minimize();
  });
  ipcMain.handle("app:hide-journal", () => {
    hideJournal();
  });
  ipcMain.handle("app:quit", () => {
    isQuitting = true;
    app.quit();
  });
  ipcMain.on("overlay:ready", () => sendOverlayState());
  ipcMain.on("overlay:move-end", () => setMoveMode(false));
  ipcMain.on("overlay:drag-start", () => startOverlayDrag());
  ipcMain.on("overlay:drag-end", () => endOverlayDrag());
}

function setupPowerEvents() {
  const suspendCapture = () => {
    if (!engine.getState().settings.paused) {
      isAutoPaused = true;
      observer.stop();
      broadcast();
    }
  };
  const resumeCapture = () => {
    if (isAutoPaused && !engine.getState().settings.paused) {
      isAutoPaused = false;
      observer.start();
      broadcast();
    }
  };
  powerMonitor.on("lock-screen", suspendCapture);
  powerMonitor.on("suspend", suspendCapture);
  powerMonitor.on("unlock-screen", resumeCapture);
  powerMonitor.on("resume", resumeCapture);
}

function onKey(event) {
  if (!engine || engine.getState().settings.paused || isAutoPaused) return;
  const focused = BrowserWindow.getFocusedWindow();
  if (focused && (focused === journalWindow || focused === overlayWindow)) return;

  engine.recordKey(event.category, Date.now());
  scheduleSave();
  queueFastBroadcast();
}

function startEngine() {
  const dataDir = app.getPath("userData");
  store = new StateStore(dataDir);
  const loaded = DEMO_MODE ? null : store.load();
  engine = new GameEngine({ state: loaded });

  if (DEMO_MODE) {
    // Load demo data only when explicitly requested by a developer.
    try {
      const { buildDemoState } = require("./demo");
      engine = new GameEngine({ state: buildDemoState(Date.now()) });
      engine.primeRecentKeys(12, 500);
    } catch (error) {
      log("demo state failed", error.message);
    }
  }

  const desiredState = engine.getState();
  if (process.env.KEYGARDEN_MODE === "journey" || process.env.KEYGARDEN_MODE === "garden") {
    engine.setMode(process.env.KEYGARDEN_MODE);
  }
  if (desiredState.settings.launchAtLogin) {
    try {
      app.setLoginItemSettings({
        openAtLogin: true,
        openAsHidden: true,
        args: ["--hidden"],
      });
    } catch {
      // Ignore.
    }
  }

  observer = new KeyObserver({
    helperPath: resourcePath("KeygardenKeys.exe"),
    logger: console,
  });
  observer.on("key", onKey);
  observer.on("status", () => {
    broadcast();
    updateTray();
  });

  firstRun = DEMO_MODE ? false : !loaded;
  if (!desiredState.settings.paused) observer.start();

  scheduleSave();
  store.flush(engine.getState());
}

function setupCaptureMode() {
  if (process.env.KEYGARDEN_CAPTURE !== "1") return;
  const captureDir = process.env.KEYGARDEN_CAPTURE_DIR || path.join(APP_ROOT, "artifacts");
  try {
    fs.mkdirSync(captureDir, { recursive: true });
  } catch {
    return;
  }
  captureTimer = setTimeout(async () => {
    try {
      showJournal();
      await new Promise((resolve) => setTimeout(resolve, 1600));
      if (overlayWindow && !overlayWindow.isDestroyed()) {
        const image = await overlayWindow.webContents.capturePage();
        fs.writeFileSync(path.join(captureDir, "overlay.png"), image.toPNG());
      }
      if (journalWindow && !journalWindow.isDestroyed()) {
        const image = await journalWindow.webContents.capturePage();
        fs.writeFileSync(path.join(captureDir, "journal.png"), image.toPNG());
      }
      log("capture complete", captureDir);
    } catch (error) {
      log("capture failed", error.stack || error.message);
    } finally {
      setTimeout(() => {
        isQuitting = true;
        app.quit();
      }, 500);
    }
  }, 2200);
}

function init() {
  startEngine();
  bindIpc();
  createOverlayWindow();
  createJournalWindow();
  createTray();
  registerHotkeys();
  setupPowerEvents();

  broadcastTimer = setInterval(broadcast, 1000);
  broadcastTimer.unref?.();

  screen.on("display-metrics-changed", positionOverlay);
  screen.on("display-added", positionOverlay);
  screen.on("display-removed", positionOverlay);

  if (firstRun && !process.argv.includes("--hidden")) {
    setTimeout(() => showJournal(), 900);
  }

  setupCaptureMode();
  log("ready", { dataDir: store.getDataDir(), firstRun, packaged: isPackaged });
}

app.on("before-quit", () => {
  isQuitting = true;
  if (broadcastTimer) clearInterval(broadcastTimer);
  if (fastBroadcastTimer) clearTimeout(fastBroadcastTimer);
  if (captureTimer) clearTimeout(captureTimer);
  if (overlayMoveTimer) clearTimeout(overlayMoveTimer);
  if (overlayHitTestTimer) clearInterval(overlayHitTestTimer);
  if (overlayDragTimer) clearInterval(overlayDragTimer);
  if (overlayDragSafety) clearTimeout(overlayDragSafety);
  observer?.stop();
  if (store && engine) store.flush(engine.getState());
});

app.on("will-quit", () => {
  unregisterHotkeys();
  tray?.destroy();
  tray = null;
});

app.on("window-all-closed", () => {
  // The tray and overlay are meant to outlive the journal window.
});

app.on("activate", () => showJournal());

process.on("uncaughtException", (error) => {
  log("uncaught exception", error.stack || error);
});
