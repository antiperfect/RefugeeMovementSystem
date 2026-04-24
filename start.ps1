# Launch script for Refugee Movement Prediction System
# Run from the prototypes/v1 directory: .\start.ps1

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Refugee Movement Prediction System" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$backendDir = Join-Path $PSScriptRoot "backend"
$frontendDir = Join-Path $PSScriptRoot "refugee-frontend"

# Check directories
if (-not (Test-Path $backendDir)) {
    Write-Host "[ERROR] Backend not found at: $backendDir" -ForegroundColor Red
    exit 1
}
if (-not (Test-Path $frontendDir)) {
    Write-Host "[ERROR] Frontend not found at: $frontendDir" -ForegroundColor Red
    exit 1
}

Write-Host "[1/2] Starting Flask backend (port 5000)..." -ForegroundColor Yellow
$flask = Start-Process -FilePath "python" -ArgumentList "app.py" -WorkingDirectory $backendDir -PassThru -NoNewWindow

Start-Sleep -Seconds 2

Write-Host "[2/2] Starting Vite frontend (port 5173)..." -ForegroundColor Yellow
$vite = Start-Process -FilePath "npm" -ArgumentList "run dev" -WorkingDirectory $frontendDir -PassThru -NoNewWindow

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Both servers running!" -ForegroundColor Green
Write-Host "  Frontend: http://localhost:5173" -ForegroundColor Green
Write-Host "  Backend:  http://localhost:5000" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Press Ctrl+C to stop both servers." -ForegroundColor Gray

try {
    while (!$flask.HasExited -and !$vite.HasExited) {
        Start-Sleep -Seconds 1
    }
} finally {
    Write-Host ""
    Write-Host "Shutting down servers..." -ForegroundColor Yellow
    if (!$flask.HasExited) { Stop-Process -Id $flask.Id -Force -ErrorAction SilentlyContinue }
    if (!$vite.HasExited) { Stop-Process -Id $vite.Id -Force -ErrorAction SilentlyContinue }
    Write-Host "Done." -ForegroundColor Green
}
