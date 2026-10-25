const fs = require("node:fs");
const path = require("node:path");

class StateStore {
  constructor(dataDir) {
    this.dataDir = dataDir;
    this.filePath = path.join(dataDir, "keygarden-state.json");
    this.backupPath = path.join(dataDir, "keygarden-state.corrupt.json");
    this.timer = null;
    this.pendingState = null;
  }

  ensureDirectory() {
    fs.mkdirSync(this.dataDir, { recursive: true });
  }

  load() {
    this.ensureDirectory();
    if (!fs.existsSync(this.filePath)) return null;
    try {
      const raw = fs.readFileSync(this.filePath, "utf8");
      return JSON.parse(raw);
    } catch (error) {
      try {
        fs.copyFileSync(this.filePath, this.backupPath);
        this.ensureDirectory();
      } catch {
        // Ignore backup failure; the game will simply start fresh.
      }
      return null;
    }
  }

  write(state) {
    this.ensureDirectory();
    const tempPath = `${this.filePath}.tmp`;
    fs.writeFileSync(tempPath, JSON.stringify(state, null, 2), "utf8");
    fs.renameSync(tempPath, this.filePath);
  }

  scheduleSave(state, delay = 5000) {
    this.pendingState = state;
    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(() => {
      this.timer = null;
      this.flush();
    }, delay);
    this.timer.unref?.();
  }

  flush(state = this.pendingState) {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    this.pendingState = null;
    if (!state) return;
    try {
      this.write(state);
    } catch (error) {
      console.error("[keygarden] failed to save state:", error);
    }
  }

  getDataDir() {
    return this.dataDir;
  }
}

module.exports = { StateStore };
