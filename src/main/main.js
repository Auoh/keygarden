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

const gotLock = app.requestSingleInstanceLock();
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
    hotkeys: { ...hotkeyStatus },
    dataDir: store?.getDataDir() || "",
    version: app.getVersion(),
    packaged: isPackaged,
    helperPath: resourcePath("KeygardenKeys.exe"),
  };
}

function overlayPayload() {
  return {
    ...engine.snapshot(Date.now()),
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

function positionOverlay() {
  if (!overlayWindow || overlayWindow.isDestroyed()) return;
  const display = screen.getPrimaryDisplay();
  const width = 430;
  const height = 580;
  const x = Math.round(display.workArea.x + display.workArea.width - width - 16);
  const y = Math.round(display.workArea.y + display.workArea.height - height - 16);
  overlayWindow.setBounds({ x, y, width, height });
}

function createOverlayWindow() {
  overlayWindow = new BrowserWindow({
    width: 430,
    height: 580,
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
    alwaysOnTop: true,
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
  overlayWindow.setAlwaysOnTop(true, "floating");
  overlayWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: false });
  overlayWindow.setIgnoreMouseEvents(true, { forward: true });
  overlayWindow.webContents.on("did-finish-load", () => sendOverlayState());
  overlayWindow.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
  overlayWindow.on("closed", () => {
    overlayWindow = null;
  });
  overlayWindow.loadFile(rendererFile("overlay", "index.html"));
  positionOverlay();

  overlayWindow.once("ready-to-show", () => {
    if (engine.getState().settings.overlayVisible) overlayWindow.showInactive();
  });
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
    backgroundColor: "#080d12",
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
  engine.setOverlayVisible(visible);
  if (overlayWindow && !overlayWindow.isDestroyed()) {
    if (visible) overlayWindow.showInactive();
    else overlayWindow.hide();
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
      label: "角落花园",
      type: "checkbox",
      checked: overlayVisible,
      click: () => setOverlayVisible(!overlayVisible),
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
  ipcMain.handle("app:set-mode", (_event, mode) => {
    if (mode === "garden") {
      return { ok: true, mode: "garden" };
    }
    const candidate = MODES.find((item) => item.id === mode);
    return {
      ok: false,
      reason: candidate ? `${candidate.name}正在路上` : "未知模式",
    };
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
