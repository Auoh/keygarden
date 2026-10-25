const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("keygarden", {
  getDashboard: () => ipcRenderer.invoke("app:get-dashboard"),
  onUpdate: (callback) => {
    const listener = (_event, payload) => callback(payload);
    ipcRenderer.on("journal:update", listener);
    return () => ipcRenderer.removeListener("journal:update", listener);
  },
  setPaused: (paused) => ipcRenderer.invoke("app:set-paused", paused),
  setOverlayVisible: (visible) => ipcRenderer.invoke("app:set-overlay-visible", visible),
  setLaunchAtLogin: (enabled) => ipcRenderer.invoke("app:set-launch-at-login", enabled),
  completeFirstRun: () => ipcRenderer.invoke("app:complete-first-run"),
  markPostcardSeen: () => ipcRenderer.invoke("app:mark-postcard-seen"),
  openDataFolder: () => ipcRenderer.invoke("app:open-data-folder"),
  openPrivacy: () => ipcRenderer.invoke("app:open-privacy"),
  setMode: (mode) => ipcRenderer.invoke("app:set-mode", mode),
  minimize: () => ipcRenderer.invoke("app:minimize-journal"),
  hide: () => ipcRenderer.invoke("app:hide-journal"),
  quit: () => ipcRenderer.invoke("app:quit"),
});
