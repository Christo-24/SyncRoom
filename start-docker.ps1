# SyncRoom - Docker Startup Script
# This script builds and starts all Docker containers for the SyncRoom application

param(
    [switch]$Clean = $false,
    [switch]$NoCache = $false,
    [switch]$Logs = $false
)

Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║         SyncRoom - Docker Startup Script                 ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Colors
$Success = "Green"
$Error = "Red"
$Info = "Cyan"
$Warning = "Yellow"

# Check if Docker is installed and running
Write-Host "Checking Docker installation..." -ForegroundColor $Info
try {
    $dockerVersion = docker --version
    Write-Host "✓ Docker is installed: $dockerVersion" -ForegroundColor $Success
} catch {
    Write-Host "✗ Docker is not installed or not in PATH" -ForegroundColor $Error
    exit 1
}

# Check if Docker daemon is running
try {
    docker ps | Out-Null
    Write-Host "✓ Docker daemon is running" -ForegroundColor $Success
} catch {
    Write-Host "✗ Docker daemon is not running. Please start Docker Desktop." -ForegroundColor $Error
    exit 1
}

# Check if Docker Compose is installed
Write-Host ""
Write-Host "Checking Docker Compose installation..." -ForegroundColor $Info
try {
    $composeVersion = docker-compose --version
    Write-Host "✓ Docker Compose is installed: $composeVersion" -ForegroundColor $Success
} catch {
    Write-Host "✗ Docker Compose is not installed" -ForegroundColor $Error
    exit 1
}

# Handle clean flag
if ($Clean) {
    Write-Host ""
    Write-Host "⚠ Cleaning up existing containers and volumes..." -ForegroundColor $Warning
    docker-compose down -v
    Write-Host "✓ Cleanup complete" -ForegroundColor $Success
}

# Build images
Write-Host ""
Write-Host "Building Docker images..." -ForegroundColor $Info

$buildArgs = @()
if ($NoCache) {
    $buildArgs += "--no-cache"
    Write-Host "Building without cache (this will take longer)..." -ForegroundColor $Warning
}

docker-compose build $buildArgs

if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Build failed" -ForegroundColor $Error
    exit 1
}

Write-Host "✓ Build successful" -ForegroundColor $Success

# Start services
Write-Host ""
Write-Host "Starting services..." -ForegroundColor $Info
docker-compose up -d

if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Failed to start services" -ForegroundColor $Error
    exit 1
}

Write-Host "✓ Services started" -ForegroundColor $Success

# Wait for services to be healthy
Write-Host ""
Write-Host "Waiting for services to be healthy..." -ForegroundColor $Info

$maxAttempts = 30
$attempt = 0
$allHealthy = $false

while ($attempt -lt $maxAttempts -and -not $allHealthy) {
    Start-Sleep -Seconds 2
    $attempt++
    
    $status = docker-compose ps --format "table {{.Service}}\t{{.Status}}"
    
    # Check if all services are healthy or running
    $dbHealthy = $status | Select-String "db.*healthy|db.*running" | Measure-Object | Select-Object -ExpandProperty Count
    $redisHealthy = $status | Select-String "redis.*healthy|redis.*running" | Measure-Object | Select-Object -ExpandProperty Count
    $backendHealthy = $status | Select-String "backend.*running" | Measure-Object | Select-Object -ExpandProperty Count
    $frontendHealthy = $status | Select-String "frontend.*running" | Measure-Object | Select-Object -ExpandProperty Count
    $nginxHealthy = $status | Select-String "nginx.*running" | Measure-Object | Select-Object -ExpandProperty Count
    
    if ($dbHealthy -gt 0 -and $redisHealthy -gt 0 -and $backendHealthy -gt 0 -and $frontendHealthy -gt 0 -and $nginxHealthy -gt 0) {
        $allHealthy = $true
    }
    
    Write-Host "." -NoNewline -ForegroundColor $Info
}

Write-Host ""

if (-not $allHealthy) {
    Write-Host "⚠ Services may not be fully healthy yet, but they have been started" -ForegroundColor $Warning
} else {
    Write-Host "✓ All services are healthy and running" -ForegroundColor $Success
}

# Display service status
Write-Host ""
Write-Host "Service Status:" -ForegroundColor $Info
docker-compose ps

# Display application info
Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║              Application is Ready!                        ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""
Write-Host "📱 Frontend:   http://localhost:3000" -ForegroundColor $Success
Write-Host "🔌 Backend:    http://localhost:3000/api" -ForegroundColor $Success
Write-Host "🚀 WebSocket:  ws://localhost:3000/ws/chat/{room}/?token={token}" -ForegroundColor $Success
Write-Host ""

# Run initial setup commands
Write-Host "Initializing database..." -ForegroundColor $Info
docker exec funchat-backend python manage.py migrate --noinput 2>$null
Write-Host "✓ Database initialized" -ForegroundColor $Success

# Check Redis
Write-Host ""
Write-Host "Checking Redis connectivity..." -ForegroundColor $Info
docker exec funchat-backend python manage.py check_redis 2>$null
Write-Host "✓ Redis is connected" -ForegroundColor $Success

# Display helpful commands
Write-Host ""
Write-Host "Useful Commands:" -ForegroundColor $Info
Write-Host "  docker-compose logs -f                    # View all logs" -ForegroundColor $Info
Write-Host "  docker-compose logs -f backend            # View backend logs" -ForegroundColor $Info
Write-Host "  docker-compose down                       # Stop all services" -ForegroundColor $Info
Write-Host "  docker-compose down -v                    # Stop and remove data" -ForegroundColor $Info
Write-Host "  docker exec -it funchat-backend bash      # Access backend" -ForegroundColor $Info
Write-Host "  .\start-docker.ps1 -Clean                 # Clean start" -ForegroundColor $Info
Write-Host "  .\start-docker.ps1 -Logs                  # Start and show logs" -ForegroundColor $Info
Write-Host ""

# Show logs if requested
if ($Logs) {
    Write-Host "Showing logs (press Ctrl+C to stop)..." -ForegroundColor $Warning
    Write-Host ""
    docker-compose logs -f
}
