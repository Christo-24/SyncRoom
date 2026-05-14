# Use official Python runtime as base image
FROM python:3.12-slim

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1

# Set work directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    postgresql-client \
    gcc \
    bash \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY backend/requirements.txt .
RUN pip install --upgrade pip && \
    pip install -r requirements.txt

# Copy backend code
COPY backend /app

# Create necessary directories
RUN mkdir -p /app/staticfiles /app/logs

# Expose port
EXPOSE 8000

# Create entrypoint script - part 1: shebang and initial setup
RUN printf '#!/bin/bash\nset -e\n\n' > /app/entrypoint.sh

# Add main startup logic
RUN printf '%s\n' \
    'echo "================================"' \
    'echo "SyncRoom Backend - Starting..."' \
    'echo "================================"' \
    'echo "⏳ Waiting for PostgreSQL at ${DB_HOST}:${DB_PORT}..."' \
    'max_attempts=30' \
    'attempt=0' \
    '' \
    'while [ $attempt -lt $max_attempts ]; do' \
    '    if pg_isready -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" 2>/dev/null; then' \
    '        echo "✅ PostgreSQL is ready!"' \
    '        break' \
    '    fi' \
    '    attempt=$((attempt + 1))' \
    '    echo "  Attempt $attempt/$max_attempts... (waiting 1 second)"' \
    '    sleep 1' \
    'done' \
    '' \
    'if [ $attempt -eq $max_attempts ]; then' \
    '    echo "❌ PostgreSQL did not become ready in time"' \
    '    exit 1' \
    'fi' \
    >> /app/entrypoint.sh

# Add database migrations
RUN printf '%s\n' \
    '' \
    'echo ""' \
    'echo "🔄 Running database migrations..."' \
    'if python manage.py migrate --noinput; then' \
    '    echo "✅ Migrations completed successfully"' \
    'else' \
    '    echo "❌ Migrations failed"' \
    '    exit 1' \
    'fi' \
    >> /app/entrypoint.sh

# Add static files collection
RUN printf '%s\n' \
    '' \
    'echo ""' \
    'echo "📦 Collecting static files..."' \
    'python manage.py collectstatic --noinput --clear 2>/dev/null || true' \
    >> /app/entrypoint.sh

# Add Redis check
RUN printf '%s\n' \
    '' \
    'echo ""' \
    'echo "🔍 Checking Redis connectivity..."' \
    'if python manage.py check_redis 2>/dev/null; then' \
    '    echo "✅ Redis is connected"' \
    'else' \
    '    echo "⚠️  Redis check failed (this may be expected in some setups)"' \
    'fi' \
    >> /app/entrypoint.sh

# Add Daphne startup
RUN printf '%s\n' \
    '' \
    'echo ""' \
    'echo "🚀 Starting Daphne ASGI server on 0.0.0.0:8000..."' \
    'echo "================================"' \
    'exec daphne -b 0.0.0.0 -p 8000 core.asgi:application' \
    >> /app/entrypoint.sh

# Make entrypoint executable and verify
RUN chmod +x /app/entrypoint.sh && \
    test -x /app/entrypoint.sh && \
    echo "✅ Entrypoint script verified"

ENTRYPOINT ["/app/entrypoint.sh"]
