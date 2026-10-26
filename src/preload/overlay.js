const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("keygardenOverlay", {
  ready: () => ipcRenderer.send("overlay:ready"),
  getState: () => ipcRenderer.invoke("app:get-overlay-state"),
  onState: (callback) => {
    const listener = (_event, payload) => callback(payload);
    ipcRenderer.on("overlay:state", listener);
    return () => ipcRenderer.removeListener("overlay:state", listener);
  },
  onMoveMode: (callback) => {
    const listener = (_event, moving) => callback(Boolean(moving));
    ipcRenderer.on("overlay:move-mode", listener);
    return () => ipcRenderer.removeListener("overlay:move-mode", listener);
  },
  onHover: (callback) => {
    const listener = (_event, hovering) => callback(Boolean(hovering));
    ipcRenderer.on("overlay:hover", listener);
    return () => ipcRenderer.removeListener("overlay:hover", listener);
  },
  startDrag: () => ipcRenderer.send("overlay:drag-start"),
  endDrag: () => ipcRenderer.send("overlay:drag-end"),
  endMoveMode: () => ipcRenderer.send("overlay:move-end"),
});
