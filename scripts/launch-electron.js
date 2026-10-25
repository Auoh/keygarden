/**
 * Launch Electron with a clean environment.
 *
 * Some agent shells set ELECTRON_RUN_AS_NODE=1 globally, which makes the
 * Electron binary behave like plain Node and never open a window. Strip that
 * variable for the child process so `npm start` works everywhere.
 */
const { spawn } = require("node:child_process");
const electron = require("electron");

const env = { ...process.env };
delete env.ELECTRON_RUN_AS_NODE;

const args = process.argv.slice(2);

// Chromium's sandbox cannot start inside the agent's Windows job object. These
// flags are only added for DSH-launched development; a normal user launch keeps
// Chromium's sandbox intact.
if (env.DSH_SESSION_ID || env.KEYGARDEN_NO_SANDBOX === "1") {
  args.unshift("--no-sandbox", "--no-zygote", "--disable-gpu");
}

const child = spawn(electron, args, {
  stdio: "inherit",
  windowsHide: false,
  env,
});

child.on("error", (error) => {
  console.error("Failed to launch Electron:", error);
  process.exit(1);
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 0);
});
