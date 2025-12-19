# PowerShell script to start all services (ML - Backend - Frontend)
# Usage: .\start-all.ps1

Write-Host "Starting LLM ChatBot services..." -ForegroundColor Green
Write-Host ""

# Get the script directory
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptDir

Write-Host ""
Write-Host "Starting services..." -ForegroundColor Cyan
Write-Host ""

# Start Python ML Service
Write-Host "[1/3] Starting Python ML Service (port 5000)..." -ForegroundColor Yellow
$pythonJob = Start-Job -ScriptBlock {
    $ErrorActionPreference = "Continue"
    Set-Location $using:scriptDir
    Set-Location python-service
    if (Test-Path "venv\Scripts\Activate.ps1") {
        & "venv\Scripts\Activate.ps1"
    }
    python -m uvicorn app.main:app --host 0.0.0.0 --port 5000 2>&1
} -Name "PythonService"

# Start Backend (Go)
Write-Host "[2/3] Starting Backend (Go) (port 8080)..." -ForegroundColor Yellow
$backendJob = Start-Job -ScriptBlock {
    $ErrorActionPreference = "Continue"
    Set-Location $using:scriptDir
    Set-Location backend
    if (Test-Path "server.exe") {
        .\server.exe 2>&1
    } else {
        go run cmd/server/main.go 2>&1
    }
} -Name "BackendService"

# Start Frontend
Write-Host "[3/3] Starting Frontend (React) (port 3000)..." -ForegroundColor Yellow
$frontendJob = Start-Job -ScriptBlock {
    $ErrorActionPreference = "Continue"
    Set-Location $using:scriptDir
    Set-Location frontend
    npm run dev 2>&1
} -Name "FrontendService"

# Wait a bit for services to start
Start-Sleep -Seconds 3

# Show job status
Write-Host ""
Write-Host "Services started. Status:" -ForegroundColor Green
Get-Job | Format-Table -AutoSize

Write-Host ""
Write-Host "Service URLs:" -ForegroundColor Cyan
Write-Host "  - Python ML Service: http://localhost:5000" -ForegroundColor White
Write-Host "  - Backend API:       http://localhost:8080" -ForegroundColor White
Write-Host "  - Frontend:          http://localhost:3000" -ForegroundColor White
Write-Host ""
Write-Host "Press Ctrl+C to stop all services" -ForegroundColor Yellow
Write-Host ""

# Function to cleanup on exit
function Cleanup {
    Write-Host ""
    Write-Host "Stopping all services..." -ForegroundColor Red
    Get-Job | Stop-Job
    Get-Job | Remove-Job
    Write-Host "All services stopped." -ForegroundColor Green
}

# Register cleanup on script exit
Register-EngineEvent PowerShell.Exiting -Action { Cleanup } | Out-Null

# Monitor jobs and show output
try {
    while ($true) {
        Start-Sleep -Seconds 1
        
        # Check if any job failed
        $failedJobs = Get-Job | Where-Object { $_.State -eq "Failed" }
        if ($failedJobs) {
            Write-Host ""
            Write-Host "One or more services failed!" -ForegroundColor Red
            $failedJobs | ForEach-Object {
                Write-Host "  - $($_.Name): $($_.State)" -ForegroundColor Red
                $output = Receive-Job -Job $_ -ErrorAction SilentlyContinue
                if ($output) {
                    Write-Host $output -ForegroundColor Red
                }
            }
        }
        
        # Show recent output from jobs (only errors/warnings to avoid spam)
        Get-Job | Where-Object { $_.State -eq "Running" } | ForEach-Object {
            $output = Receive-Job -Job $_ -ErrorAction SilentlyContinue
            if ($output) {
                # Filter important messages
                $important = $output | Where-Object { 
                    $_ -match "error|Error|ERROR|warning|Warning|WARNING|started|Started|listening|Listening" 
                }
                if ($important) {
                    Write-Host "[$($_.Name)] $important" -ForegroundColor Gray
                }
            }
        }
    }
} catch {
    Write-Host ""
    Write-Host "Interrupted: $($_.Exception.Message)" -ForegroundColor Yellow
} finally {
    Cleanup
}

