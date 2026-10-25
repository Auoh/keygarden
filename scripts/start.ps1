$ErrorActionPreference = "Stop"
$project = Split-Path -Parent $PSScriptRoot
$electron = Join-Path $project "node_modules\electron\dist\electron.exe"

# The agent's Electron copy may inherit a low-integrity label from the
# workspace. Use the host copy when it is available so a developer can still
# test global input from an interactive shell.
if ($env:DSH_SESSION_ID) {
  $hostElectron = Join-Path $env:USERPROFILE ".dsh\electron\electron.exe"
  if (Test-Path $hostElectron) { $electron = $hostElectron }
}

if (-not (Test-Path $electron)) {
  throw "Electron was not installed. Run: npm install"
}

# Agent shells can set this globally; it prevents Electron from starting as a GUI.
Remove-Item Env:ELECTRON_RUN_AS_NODE -ErrorAction SilentlyContinue

$electronArgs = @()
if ($env:DSH_SESSION_ID -or $env:KEYGARDEN_NO_SANDBOX -eq "1") {
  $electronArgs += @("--no-sandbox", "--no-zygote", "--disable-gpu")
}
$electronArgs += $project

& $electron @electronArgs
exit $LASTEXITCODE
