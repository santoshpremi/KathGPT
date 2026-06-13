# KathaGPT one-line installer for Windows.
# Usage (PowerShell):
#   irm https://santoshpremi.github.io/KathaGPT/install-windows.ps1 | iex

$ErrorActionPreference = "Stop"

$Version = "0.1.0"
$BaseUrl = "https://santoshpremi.github.io/KathaGPT/downloads"
$InstallerName = "KathaGPT_${Version}_x64-setup.exe"
$Url = "$BaseUrl/$InstallerName"
$TempDir = Join-Path $env:TEMP "kathagpt-install"
$Dest = Join-Path $TempDir $InstallerName

Write-Host "KathaGPT installer — Windows x64"
Write-Host ""

New-Item -ItemType Directory -Force -Path $TempDir | Out-Null

Write-Host "Downloading $InstallerName ..."
Invoke-WebRequest -Uri $Url -OutFile $Dest -UseBasicParsing

Write-Host "Launching setup ..."
Start-Process -FilePath $Dest -Wait

Write-Host "Done. Open KathaGPT from the Start menu."
