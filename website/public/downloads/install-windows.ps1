# KathaGPT Windows installer — works with any downloaded setup.exe or .msi.
# Searches Downloads and Desktop for the newest KathaGPT* installer.
#
# Usage (PowerShell):
#   irm https://santoshpremi.github.io/KathaGPT/downloads/install-windows.ps1 | iex
#   .\install-windows.ps1
#   .\install-windows.ps1 C:\Users\you\Downloads\KathaGPT_0.1.0_x64-setup.exe

$ErrorActionPreference = "Stop"

function Find-Installer {
    param([string]$ExplicitPath)

    if ($ExplicitPath -and (Test-Path -LiteralPath $ExplicitPath)) {
        return (Resolve-Path -LiteralPath $ExplicitPath).Path
    }

    $searchDirs = @(
        [Environment]::GetFolderPath("UserProfile") + "\Downloads",
        [Environment]::GetFolderPath("Desktop")
    )

    $candidates = @()
    foreach ($dir in $searchDirs) {
        if (-not (Test-Path $dir)) { continue }
        $candidates += Get-ChildItem -Path $dir -File -ErrorAction SilentlyContinue |
            Where-Object { $_.Name -like "KathaGPT*" -and ($_.Extension -eq ".exe" -or $_.Extension -eq ".msi") }
    }

    $best = $candidates | Sort-Object LastWriteTime -Descending | Select-Object -First 1
    if ($best) {
        return $best.FullName
    }

    Write-Error @"
No KathaGPT installer found in Downloads or Desktop.
Download from https://santoshpremi.github.io/KathaGPT/#download
Or pass the path explicitly:
  .\install-windows.ps1 C:\path\to\KathaGPT_0.1.0_x64-setup.exe
"@
}

$installerPath = Find-Installer -ExplicitPath $args[0]
Write-Host "Using: $installerPath"

if ($installerPath -match '\.msi$') {
    Write-Host "Launching MSI installer ..."
    Start-Process "msiexec.exe" -ArgumentList "/i `"$installerPath`"" -Wait
} else {
    Write-Host "Launching setup ..."
    Start-Process -FilePath $installerPath -Wait
}

Write-Host "Done. Open KathaGPT from the Start menu."
