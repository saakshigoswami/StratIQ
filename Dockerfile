# Backend (FastAPI) only — use this on Railway to avoid Railpack "Error creating build plan"
FROM python:3.12-slim

WORKDIR /app

# Install dependencies first (better layer caching)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Application code and data
COPY app/ ./app/
COPY data/ ./data/

# Railway sets PORT; default 8000 for local Docker
ENV PORT=8000
EXPOSE 8000

# Use shell so $PORT is expanded (Railway injects PORT at runtime)
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
