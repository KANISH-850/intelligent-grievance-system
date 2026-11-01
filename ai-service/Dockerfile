# Production Dockerfile for Python FastAPI AI Microservice
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies (curl for healthcheck probes)
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install python packages
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy FastAPI application source and trained model weights
COPY app ./app
COPY models ./models

# Set default port fallback (Render dynamically assigns $PORT)
ENV PORT=8001
EXPOSE 8001

# Start uvicorn server respecting Render's dynamic PORT environment variable
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8001}"]
