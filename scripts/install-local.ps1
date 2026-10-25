param(
  [switch]$NoLaunch
)

$ErrorActionPreference = "Stop"
$project = Split-Path -Parent $PSScriptRoot
$release = Join-Path $project "release\Keygarden-win64"
$installRoot = Join-Path $env:LOCALAPPDATA "Programs\Keygarden"
$expectedPrefix = (Join-Path $env:LOCALAPPDATA "Programs") + [IO.Path]::DirectorySeparatorChar

if (-not (Test-Path (Join-Path $release "Keygarden.exe"))) {
  Write-Host "Portable build not found. Building it first..."
  Push-Location $project
  try {
    node scripts\package-portable.js
    if ($LASTEXITCODE -ne 0) { throw "Package build failed." }
  } finally {
    Pop-Location
  }
}

$resolvedInstalled = [IO.Path]::GetFullPath($installRoot)
if (-not $resolvedInstalled.StartsWith($expectedPrefix, [StringComparison]::OrdinalIgnoreCase)) {
  throw "Refusing to write outside the per-user Programs folder: $resolvedInstalled"
}

if (Test-Path $resolvedInstalled) {
  Remove-Item -LiteralPath $resolvedInstalled -Recurse -Force
}
New-Item -ItemType Directory -Path $resolvedInstalled -Force | Out-Null
Copy-Item -Path (Join-Path $release "*") -Destination $resolvedInstalled -Recurse -Force

$desktop = [Environment]::GetFolderPath("Desktop")
$shortcutPath = Join-Path $desktop "Keygarden.lnk"
$shell = New-Object -ComObject WScript.Shell
$shortcut = $shell.CreateShortcut($shortcutPath)
$shortcut.TargetPath = Join-Path $resolvedInstalled "Keygarden.exe"
$shortcut.WorkingDirectory = $resolvedInstalled
$shortcut.IconLocation = (Join-Path $resolvedInstalled "resources\icon.ico") + ",0"
$shortcut.Description = "Keygarden - a quiet garden that grows while you work"
$shortcut.Save()

Write-Host "Installed: $resolvedInstalled"
Write-Host "Shortcut: $shortcutPath"

if (-not $NoLaunch) {
  Remove-Item Env:ELECTRON_RUN_AS_NODE -ErrorAction SilentlyContinue
  $launchArgs = @()
  if ($env:DSH_SESSION_ID) {
    $launchArgs = @("--no-sandbox", "--no-zygote", "--disable-gpu")
  }
  Start-Process -FilePath (Join-Path $resolvedInstalled "Keygarden.exe") -WorkingDirectory $resolvedInstalled -ArgumentList $launchArgs
}
