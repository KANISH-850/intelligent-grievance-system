# Production Dockerfile for Python FastAPI AI Microservice
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install python packages
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy FastAPI application
COPY app ./app

# Expose microservice port
EXPOSE 8001

# Start uvicorn server
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8001"]
