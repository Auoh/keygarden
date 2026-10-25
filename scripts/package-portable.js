const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const electronDist = path.join(root, "node_modules", "electron", "dist");
const helper = path.join(root, "resources", "KeygardenKeys.exe");
const releaseDir = path.join(root, "release", "Keygarden-win64");
const appDir = path.join(releaseDir, "resources", "app");

if (!fs.existsSync(electronDist)) {
  console.error("Electron is not installed. Run npm install first.");
  process.exit(1);
}
if (!fs.existsSync(helper)) {
  console.error("The key observer is missing. Run npm run build:helper first.");
  process.exit(1);
}
if (!fs.existsSync(path.join(root, "src", "main", "main.js"))) {
  console.error("Project sources are missing.");
  process.exit(1);
}

console.log("Building portable Keygarden app...");
fs.rmSync(releaseDir, { recursive: true, force: true });
fs.mkdirSync(releaseDir, { recursive: true });
fs.cpSync(electronDist, releaseDir, { recursive: true });

const electronExe = path.join(releaseDir, "electron.exe");
const appExe = path.join(releaseDir, "Keygarden.exe");
if (fs.existsSync(electronExe)) fs.renameSync(electronExe, appExe);

fs.mkdirSync(appDir, { recursive: true });
for (const item of ["src", "package.json", "PRIVACY.md", "README.md"]) {
  const source = path.join(root, item);
  if (fs.existsSync(source)) {
    fs.cpSync(source, path.join(appDir, item), { recursive: true });
  }
}

// process.resourcesPath points here when packaged.
fs.copyFileSync(helper, path.join(releaseDir, "resources", "KeygardenKeys.exe"));
for (const icon of ["icon.png", "icon.ico"]) {
  const source = path.join(root, "resources", icon);
  if (fs.existsSync(source)) {
    fs.copyFileSync(source, path.join(releaseDir, "resources", icon));
  }
}

const totalBytes = (() => {
  let total = 0;
  const walk = (directory) => {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const child = path.join(directory, entry.name);
      if (entry.isDirectory()) walk(child);
      else total += fs.statSync(child).size;
    }
  };
  walk(releaseDir);
  return total;
})();

console.log(`Ready: ${releaseDir}`);
console.log(`Size: ${(totalBytes / 1024 / 1024).toFixed(1)} MB`);
console.log("Install it to a normal folder with: npm run install:local");
