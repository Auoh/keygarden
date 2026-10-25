const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("keygardenOverlay", {
  ready: () => ipcRenderer.send("overlay:ready"),
  getState: () => ipcRenderer.invoke("app:get-overlay-state"),
  onState: (callback) => {
    const listener = (_event, payload) => callback(payload);
    ipcRenderer.on("overlay:state", listener);
    return () => ipcRenderer.removeListener("overlay:state", listener);
  },
});
