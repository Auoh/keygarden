const { EventEmitter } = require("node:events");
const { spawn } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

/**
 * Spawns the tiny compiled Windows key observer. The helper only ever prints
 * coarse categories ("letter", "punct", ...) plus timestamps. Key codes are
 * discarded inside that process.
 */
class KeyObserver extends EventEmitter {
  constructor({ helperPath, logger = console } = {}) {
    super();
    this.helperPath = helperPath;
    this.logger = logger;
    this.child = null;
    this.stopping = false;
    this.desiredRunning = false;
    this.lastHeartbeatAt = 0;
    this.lastError = null;
    this.restartTimer = null;
    this.restartAttempt = 0;
    this.watchdog = null;
    this.stdoutBuffer = "";
  }

  isRunning() {
    return Boolean(this.child && !this.child.killed);
  }

  getStatus() {
    return {
      running: this.isRunning(),
      healthy: this.isRunning() && Date.now() - this.lastHeartbeatAt < 20000,
      lastHeartbeatAt: this.lastHeartbeatAt || null,
      error: this.lastError,
    };
  }

  start() {
    if (this.isRunning()) return;
    this.desiredRunning = true;
    this.stopping = false;
    if (!this.helperPath || !fs.existsSync(this.helperPath)) {
      this.lastError = "找不到键盘观察器 KeygardenKeys.exe";
      this.emit("status", this.getStatus());
      return;
    }

    this.lastError = null;
    this.stdoutBuffer = "";
    this.lastHeartbeatAt = Date.now();

    try {
      this.child = spawn(this.helperPath, [], {
        stdio: ["pipe", "pipe", "pipe"],
        windowsHide: true,
      });
    } catch (error) {
      this.lastError = error.message;
      this.child = null;
      this.scheduleRestart();
      this.emit("status", this.getStatus());
      return;
    }

    this.child.stdout.setEncoding("utf8");
    this.child.stdout.on("data", (chunk) => this.consumeStdout(chunk));
    this.child.stderr.setEncoding("utf8");
    this.child.stderr.on("data", (chunk) => {
      const message = String(chunk).trim();
      if (message) this.lastError = message.slice(0, 300);
    });

    this.child.on("error", (error) => {
      this.lastError = error.message;
      this.logger.error?.("[keygarden] key observer error:", error);
    });

    this.child.on("exit", (code, signal) => {
      this.child = null;
      this.clearWatchdog();
      if (this.desiredRunning && !this.stopping) {
        this.lastError = `键盘观察器已退出（${signal || code}）`;
        this.scheduleRestart();
      }
      this.emit("status", this.getStatus());
    });

    this.startWatchdog();
    this.emit("status", this.getStatus());
  }

  consumeStdout(chunk) {
    this.stdoutBuffer += chunk;
    let boundary = this.stdoutBuffer.indexOf("\n");
    while (boundary >= 0) {
      const line = this.stdoutBuffer.slice(0, boundary).trim();
      this.stdoutBuffer = this.stdoutBuffer.slice(boundary + 1);
      if (line) this.handleLine(line);
      boundary = this.stdoutBuffer.indexOf("\n");
    }
  }

  handleLine(line) {
    let payload;
    try {
      payload = JSON.parse(line);
    } catch {
      return;
    }

    if (payload.type === "ready" || payload.type === "heartbeat") {
      this.lastHeartbeatAt = Date.now();
      this.lastError = null;
      this.restartAttempt = 0;
      this.emit("status", this.getStatus());
      return;
    }

    if (payload.type === "key" && typeof payload.category === "string") {
      this.lastHeartbeatAt = Date.now();
      this.emit("key", {
        category: payload.category,
        observedAt: Number(payload.t) || Date.now(),
      });
    }
  }

  startWatchdog() {
    this.clearWatchdog();
    this.watchdog = setInterval(() => {
      if (!this.isRunning()) return;
      if (Date.now() - this.lastHeartbeatAt > 25000) {
        this.lastError = "键盘观察器没有响应，正在重启";
        this.emit("status", this.getStatus());
        this.restart();
      }
    }, 10000);
    this.watchdog.unref?.();
  }

  clearWatchdog() {
    if (this.watchdog) clearInterval(this.watchdog);
    this.watchdog = null;
  }

  scheduleRestart() {
    if (!this.desiredRunning || this.stopping || this.restartTimer) return;
    const delay = Math.min(15000, 1000 * 2 ** this.restartAttempt);
    this.restartAttempt += 1;
    this.restartTimer = setTimeout(() => {
      this.restartTimer = null;
      if (this.desiredRunning && !this.stopping) this.start();
    }, delay);
    this.restartTimer.unref?.();
  }

  restart() {
    this.stop({ restart: true });
  }

  stop({ restart = false } = {}) {
    this.desiredRunning = restart;
    this.stopping = !restart;
    this.clearWatchdog();
    if (this.restartTimer) {
      clearTimeout(this.restartTimer);
      this.restartTimer = null;
    }
    const child = this.child;
    this.child = null;
    if (!child) {
      this.emit("status", this.getStatus());
      if (restart) setTimeout(() => this.start(), 250);
      return;
    }
    try {
      child.stdin.write("quit\n");
      child.stdin.end();
    } catch {
      // The helper may already be gone.
    }
    const timer = setTimeout(() => {
      if (!child.killed) {
        try {
          child.kill();
        } catch {
          // Ignore.
        }
      }
    }, 900);
    timer.unref?.();
    child.once("exit", () => {
      clearTimeout(timer);
      if (restart) setTimeout(() => this.start(), 250);
    });
    this.emit("status", this.getStatus());
  }
}

module.exports = { KeyObserver };
