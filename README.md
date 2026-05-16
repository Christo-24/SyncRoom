# SyncRoom - Real-time Messaging App

SyncRoom is a real-time chat application with:
- Django + Channels backend
- React + Vite frontend
- PostgreSQL + Redis
- Docker Compose + Nginx for deployment

## What is included
- Public rooms and private DMs
- Real-time messaging over WebSockets
- JWT authentication
- Online presence + typing indicators
- DM message status flow (sent, delivered, seen)
- Unread counts and message pagination

## Tech stack

Backend:
- Django 6.0.2
- Django REST Framework 3.17.1
- Channels 4.3.2
- Daphne 4.1.2
- SimpleJWT 5.5.1
- PostgreSQL + Redis

Frontend:
- React 19.2.4
- Vite 8.0.4
- Tailwind CSS 3.3.3
- Axios + Lucide React

Infrastructure:
- Docker + Docker Compose
- Nginx reverse proxy

## Project structure

```text
Fun_Chat/
├── backend/
│   ├── core/
│   ├── user_app/
│   ├── room_app/
│   ├── message_app/
│   ├── requirements.txt
│   └── funchatbackend.dockerfile
├── frontend/
│   ├── src/
│   ├── package.json
│   └── funchatfrontend.dockerfile
├── docker-compose.yml
├── nginx.conf
├── .env
├── .gitignore
├── QUICKSTART.md
├── start-docker.ps1
└── start-docker.sh
```

## Quick start (Docker)

Windows PowerShell:
```powershell
cd Fun_Chat
.\start-docker.ps1
```

macOS/Linux:
```bash
cd Fun_Chat
chmod +x start-docker.sh
./start-docker.sh
```

Manual Docker Compose:
```bash
docker-compose up --build
```

App URLs:
- Frontend: http://localhost:3000
- API: http://localhost:3000/api
- WebSocket: ws://localhost:3000/ws/chat/{room}/?token={token}
 - Deployed: https://syncroom-eight.vercel.app

## Local development

Backend:
```bash
cd backend
python -m venv venv
# Windows
venv\Scripts\activate
# macOS/Linux
# source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver 8000
```

Frontend:
```bash
cd frontend
npm install
npm run dev
```

Local URLs:
- Frontend: http://localhost:5173
- API (proxied by Vite): /api -> http://localhost:8000
- WebSocket (proxied by Vite): /ws -> ws://localhost:8000

## Configuration

Create/update `.env` in project root.

Minimum values used by Docker setup:

```env
DEBUG=False
SECRET_KEY=change-this-in-production
ALLOWED_HOSTS=backend,localhost,127.0.0.1,funchat-backend,*.localhost,syncroom-eight.vercel.app

# include your deployed frontend origin(s) here (example: Vercel)
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://frontend:3000,http://127.0.0.1:3000,http://localhost,http://funchat-nginx,https://syncroom-eight.vercel.app
CSRF_TRUSTED_ORIGINS=http://localhost:3000,http://frontend:3000,http://127.0.0.1:3000,http://localhost,http://funchat-nginx,https://syncroom-eight.vercel.app

DB_ENGINE=django.db.backends.postgresql
DB_NAME=fun_chat_db
DB_USER=fun_chat_user
DB_PASSWORD=change-me-strong-password
DB_HOST=db
DB_PORT=5432

REDIS_HOST=redis
REDIS_PORT=6379

VITE_BACKEND_URL=http://localhost:3000
VITE_API_URL=http://localhost:3000/api
```

## Common operations

View logs:
```bash
docker-compose logs -f
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f nginx
```

Stop/restart:
```bash
docker-compose down
docker-compose down -v
docker-compose restart
docker-compose restart backend
```

Shell access:
```bash
docker exec -it funchat-backend bash
docker exec -it funchat-db psql -U fun_chat_user -d fun_chat_db
docker exec -it redis-chat redis-cli
```

## Deployment checklist

Before deploying:
- Set a strong `SECRET_KEY`
- Set a strong `DB_PASSWORD`
- Keep `DEBUG=False`
- Update `ALLOWED_HOSTS`, `CORS_ALLOWED_ORIGINS`, and `CSRF_TRUSTED_ORIGINS`
- Verify ports and domain routing in `nginx.conf`
- Verify `docker-compose.yml` health checks pass

Recommended deploy sanity check:
```bash
docker-compose config -q
docker-compose up --build -d
docker-compose ps
docker-compose logs --tail=100 backend
```

## GitHub safety notes

This repository is prepared to avoid committing local secrets/artifacts:
- Root `.gitignore` excludes `.env`, `venv`, `.cursor`, logs, and build outputs
- Use `backend/.env.example` as a template reference
- Do not commit real credentials

## Troubleshooting

Services fail to start:
```bash
docker-compose down -v
docker-compose up --build
```

Backend issues:
```bash
docker-compose logs backend
docker-compose restart backend
```

Database issues:
```bash
docker-compose logs db
docker-compose restart db
```

WebSocket issues:
```bash
docker-compose logs nginx
docker-compose logs backend
```

## License

For educational/development use.
