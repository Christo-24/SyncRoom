# 🚀 SyncRoom - Quick Start Guide

**Status:** ✅ Production Ready - All fixes applied and Docker configured

---

## ⚡ Get Started in 2 Minutes

### Step 1: Run the Startup Script

**Windows (PowerShell):**
```powershell
cd Fun_Chat
.\start-docker.ps1
```

**macOS/Linux (Bash):**
```bash
cd Fun_Chat
chmod +x start-docker.sh
./start-docker.sh
```

### Step 2: Access the Application

Once the script completes, open your browser:

```
http://localhost:3000
```

**That's it!** 🎉

---

## 📋 What the Script Does

The startup script automatically:

1. ✅ Checks Docker is installed and running
2. ✅ Checks Docker Compose is installed
3. ✅ Builds backend and frontend images
4. ✅ Starts all services (DB, Redis, Backend, Frontend, Nginx)
5. ✅ Runs database migrations
6. ✅ Verifies Redis connectivity
7. ✅ Displays application URLs and logs

---

## 🌐 Access Points

After startup, you can access:

| Service | URL |
|---------|-----|
| **Frontend (UI)** | http://localhost:3000 |
| **Backend API** | http://localhost:3000/api |
| **WebSocket** | ws://localhost:3000/ws/chat/{room}/?token={token} |
| **Database** | localhost:5432 (pgAdmin or psql) |
| **Redis** | localhost:6379 (redis-cli) |

---

## 🔧 Common Tasks

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f nginx
```

### Stop Services
```bash
# Stop but keep data
docker-compose down

# Stop and remove everything
docker-compose down -v
```

### Restart Services
```bash
# Restart all
docker-compose restart

# Restart specific service
docker-compose restart backend
docker-compose restart frontend
```

### Access Container
```bash
# Backend shell
docker exec -it funchat-backend bash

# Database
docker exec -it funchat-db psql -U fun_chat_user -d fun_chat_db

# Redis CLI
docker exec -it redis-chat redis-cli
```

### Check Service Status
```bash
docker-compose ps
```

---

## 📱 Test the Application

### 1. Create Account
- Click "Register" on the login page
- Enter username, password (min 8 chars)
- Click "Create Account"

### 2. Login
- Enter your credentials
- Click "Login"

### 3. Create/Join Chat Room
- Click "Create Room" or join an existing public room
- Type a message and press Enter
- Your message appears instantly!

### 4. Test Real-time Features
- **Typing Indicators:** See when others are typing
- **Online Status:** See who's online (in DMs)
- **Message Status:** See if message is sent/delivered/seen
- **Auto-reconnect:** Disconnect internet briefly, app reconnects automatically

---

## 🆘 Troubleshooting

### Services won't start
```bash
# Check Docker is running
docker ps

# Check for errors
docker-compose logs

# Clean start (removes all data)
.\start-docker.ps1 -Clean

# Or manually:
docker-compose down -v
docker-compose up --build
```

### Port 3000 already in use
```bash
# Find what's using port 3000
lsof -i :3000  # macOS/Linux
netstat -ano | findstr :3000  # Windows

# Kill the process or use different port
# Edit docker-compose.yml:
#   ports:
#     - "3001:80"  # Use 3001 instead
```

### Database connection failed
```bash
# Wait longer for database to start (30-60 seconds is normal)
# Or restart database
docker-compose restart db
sleep 10
docker-compose restart backend
```

### WebSocket connection failed
```bash
# Check backend logs
docker-compose logs backend

# Check if backend is running
docker-compose ps

# Restart backend
docker-compose restart backend
```

### Frontend shows "Cannot GET" errors
```bash
# Frontend might not be running
docker-compose logs frontend

# Restart frontend
docker-compose restart frontend
```

### Redis connection error
```bash
# Check Redis is running
docker-compose ps

# Check Redis logs
docker-compose logs redis

# Restart Redis
docker-compose restart redis
```

---

## 🔐 Default Credentials & Configuration

### Database
- **Host:** localhost:5432
- **Database:** fun_chat_db
- **Username:** fun_chat_user
- **Password:** 1234

### Django Admin (Optional)
```bash
# Create superuser
docker exec -it funchat-backend python manage.py createsuperuser

# Access at http://localhost:3000/admin/
```

### Configuration File
- **Location:** `.env`
- **Change:** SECRET_KEY, passwords, ALLOWED_HOSTS (for production)

---

## 📊 Architecture

```
Browser (http://localhost:3000)
         ↓
    [Nginx] (Reverse Proxy & WebSocket Router)
    ↙        ↘
[Frontend]  [Backend]
React+Vite  Django+Channels
Port 3000   Port 8000 (Daphne ASGI)
    ↓          ↓
            [PostgreSQL] (DB)
            [Redis] (Cache & Channels)
```

---

## 🚀 Advanced Usage

### Rebuild Images
```bash
# Without cache (clean build)
docker-compose build --no-cache

# Rebuild specific service
docker-compose build backend
```

### Scale Backend
```bash
# Run multiple backend instances
docker-compose up -d --scale backend=3
```

### View Container Processes
```bash
docker exec funchat-backend ps aux
```

### Check Memory Usage
```bash
docker stats
```

### Database Backup
```bash
# Backup
docker exec funchat-db pg_dump -U fun_chat_user -d fun_chat_db > backup.sql

# Restore
docker exec -i funchat-db psql -U fun_chat_user -d fun_chat_db < backup.sql
```

---

## 📝 Startup Script Options

### PowerShell
```powershell
.\start-docker.ps1 -Clean      # Clean start (remove all data)
.\start-docker.ps1 -NoCache    # Rebuild without cache
.\start-docker.ps1 -Logs       # Show logs after startup
.\start-docker.ps1 -Clean -Logs # Clean start with logs
```

### Bash
```bash
./start-docker.sh -c            # Clean start
./start-docker.sh -n            # Rebuild without cache
./start-docker.sh -l            # Show logs
./start-docker.sh -c -l         # Clean start with logs
```

---

## 🐛 Debug Mode

### Enable Debug Logging
Edit `.env`:
```
DEBUG=True
```

Then restart:
```bash
docker-compose restart backend
docker-compose logs -f backend
```

### Check All Endpoints
```bash
# Backend is running
curl http://localhost:3000/api/room/

# API should return list of rooms (might be empty)
```

---

## 📚 Full Documentation

- **Docker:** See [DOCKER_SETUP_GUIDE.md](./DOCKER_SETUP_GUIDE.md)
- **Local Dev:** See [SETUP_GUIDE.md](./SETUP_GUIDE.md)
- **Main README:** See [README.md](./README.md)

---

## ✅ Quick Checklist

Before asking for help:

- [ ] Docker is installed and running
- [ ] Docker Compose is installed
- [ ] Port 3000 is available
- [ ] Ran the startup script
- [ ] Waited 30-60 seconds for services
- [ ] All containers show "running" in `docker-compose ps`
- [ ] No errors in `docker-compose logs`

---

## 🎯 What Works After Startup

✅ **User Registration & Login** - JWT authentication
✅ **Create/Join Rooms** - Public and private chats
✅ **Send Messages** - Real-time instant messaging
✅ **See Online Users** - Live online status
✅ **Typing Indicators** - See when others are typing
✅ **Message Status** - Sent, delivered, seen
✅ **Auto-Reconnect** - Handles connection drops
✅ **XSS Protection** - Input sanitization
✅ **100+ Concurrent Users** - Scalable architecture

---

## 🚨 If Something Goes Wrong

1. **Check Docker is running:**
   ```bash
   docker ps
   ```

2. **View error logs:**
   ```bash
   docker-compose logs
   ```

3. **Restart everything:**
   ```bash
   docker-compose restart
   ```

4. **Clean start:**
   ```bash
   docker-compose down -v
   docker-compose up --build
   ```

5. **Still stuck?** Check [DOCKER_SETUP_GUIDE.md](./DOCKER_SETUP_GUIDE.md) troubleshooting section

---

## 🎓 Learning Resources

- [Django Channels Docs](https://channels.readthedocs.io/)
- [React Docs](https://react.dev/)
- [WebSocket API](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)
- [Docker Compose Docs](https://docs.docker.com/compose/)

---

**Version:** 1.0.0  
**Status:** ✅ Production Ready  
**Last Updated:** May 2026

**Ready to chat? 💬 Run the startup script and open http://localhost:3000**
