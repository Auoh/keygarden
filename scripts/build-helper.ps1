$ErrorActionPreference = "Stop"
$project = Split-Path -Parent $PSScriptRoot
$csc = Join-Path $env:WINDIR "Microsoft.NET\Framework64\v4.0.30319\csc.exe"
if (-not (Test-Path $csc)) {
  throw "csc.exe was not found. .NET Framework 4.x is required to build the key observer."
}
$source = Join-Path $project "src\input\KeygardenKeys.cs"
$output = Join-Path $project "resources\KeygardenKeys.exe"
& $csc /nologo /target:exe /platform:x64 /optimize+ /out:$output $source
if ($LASTEXITCODE -ne 0) { throw "csc failed with exit code $LASTEXITCODE" }
Write-Host "Built $output"
