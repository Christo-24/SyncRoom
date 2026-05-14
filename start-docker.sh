#!/bin/bash

# SyncRoom - Docker Startup Script
# This script builds and starts all Docker containers for the SyncRoom application

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Flags
CLEAN=false
NO_CACHE=false
LOGS=false

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -c|--clean) CLEAN=true; shift ;;
        -n|--no-cache) NO_CACHE=true; shift ;;
        -l|--logs) LOGS=true; shift ;;
        *) echo "Unknown flag: $1"; exit 1 ;;
    esac
done

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║         SyncRoom - Docker Startup Script                 ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check if Docker is installed and running
echo -e "${BLUE}Checking Docker installation...${NC}"
if ! command -v docker &> /dev/null; then
    echo -e "${RED}✗ Docker is not installed${NC}"
    exit 1
fi
DOCKER_VERSION=$(docker --version)
echo -e "${GREEN}✓ Docker is installed: $DOCKER_VERSION${NC}"

# Check if Docker daemon is running
if ! docker ps &> /dev/null; then
    echo -e "${RED}✗ Docker daemon is not running${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Docker daemon is running${NC}"

# Check if Docker Compose is installed
echo ""
echo -e "${BLUE}Checking Docker Compose installation...${NC}"
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}✗ Docker Compose is not installed${NC}"
    exit 1
fi
COMPOSE_VERSION=$(docker-compose --version)
echo -e "${GREEN}✓ Docker Compose is installed: $COMPOSE_VERSION${NC}"

# Handle clean flag
if [ "$CLEAN" = true ]; then
    echo ""
    echo -e "${YELLOW}⚠ Cleaning up existing containers and volumes...${NC}"
    docker-compose down -v
    echo -e "${GREEN}✓ Cleanup complete${NC}"
fi

# Build images
echo ""
echo -e "${BLUE}Building Docker images...${NC}"

BUILD_ARGS=""
if [ "$NO_CACHE" = true ]; then
    BUILD_ARGS="--no-cache"
    echo -e "${YELLOW}Building without cache (this will take longer)...${NC}"
fi

docker-compose build $BUILD_ARGS
echo -e "${GREEN}✓ Build successful${NC}"

# Start services
echo ""
echo -e "${BLUE}Starting services...${NC}"
docker-compose up -d
echo -e "${GREEN}✓ Services started${NC}"

# Wait for services to be healthy
echo ""
echo -e "${BLUE}Waiting for services to be healthy...${NC}"

MAX_ATTEMPTS=30
ATTEMPT=0

while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
    sleep 2
    ATTEMPT=$((ATTEMPT + 1))
    
    # Check service status
    STATUS=$(docker-compose ps 2>/dev/null || echo "")
    
    # Count healthy/running services
    DB_READY=$(echo "$STATUS" | grep -c "db.*healthy\|db.*running" || echo 0)
    REDIS_READY=$(echo "$STATUS" | grep -c "redis.*healthy\|redis.*running" || echo 0)
    BACKEND_READY=$(echo "$STATUS" | grep -c "backend.*running" || echo 0)
    FRONTEND_READY=$(echo "$STATUS" | grep -c "frontend.*running" || echo 0)
    NGINX_READY=$(echo "$STATUS" | grep -c "nginx.*running" || echo 0)
    
    if [ $DB_READY -gt 0 ] && [ $REDIS_READY -gt 0 ] && [ $BACKEND_READY -gt 0 ] && [ $FRONTEND_READY -gt 0 ] && [ $NGINX_READY -gt 0 ]; then
        break
    fi
    
    echo -n "."
done

echo ""
echo -e "${GREEN}✓ All services are running${NC}"

# Display service status
echo ""
echo -e "${BLUE}Service Status:${NC}"
docker-compose ps

# Display application info
echo ""
echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║              Application is Ready!                        ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${GREEN}📱 Frontend:   http://localhost:3000${NC}"
echo -e "${GREEN}🔌 Backend:    http://localhost:3000/api${NC}"
echo -e "${GREEN}🚀 WebSocket:  ws://localhost:3000/ws/chat/{room}/?token={token}${NC}"
echo ""

# Run initial setup commands
echo -e "${BLUE}Initializing database...${NC}"
docker exec funchat-backend python manage.py migrate --noinput 2>/dev/null
echo -e "${GREEN}✓ Database initialized${NC}"

# Check Redis
echo ""
echo -e "${BLUE}Checking Redis connectivity...${NC}"
docker exec funchat-backend python manage.py check_redis 2>/dev/null
echo -e "${GREEN}✓ Redis is connected${NC}"

# Display helpful commands
echo ""
echo -e "${BLUE}Useful Commands:${NC}"
echo -e "${BLUE}  docker-compose logs -f                    # View all logs${NC}"
echo -e "${BLUE}  docker-compose logs -f backend            # View backend logs${NC}"
echo -e "${BLUE}  docker-compose down                       # Stop all services${NC}"
echo -e "${BLUE}  docker-compose down -v                    # Stop and remove data${NC}"
echo -e "${BLUE}  docker exec -it funchat-backend bash      # Access backend${NC}"
echo -e "${BLUE}  ./start-docker.sh -c                      # Clean start${NC}"
echo -e "${BLUE}  ./start-docker.sh -l                      # Start and show logs${NC}"
echo ""

# Show logs if requested
if [ "$LOGS" = true ]; then
    echo -e "${YELLOW}Showing logs (press Ctrl+C to stop)...${NC}"
    echo ""
    docker-compose logs -f
fi
