# Multi-Stage Dockerfile for MedVision AI
# Stage 1: Build React Frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# Stage 2: Python Backend & Static Asset Serving
FROM python:3.11-slim
WORKDIR /app

# Install system dependencies for OpenCV and image processing
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1 \
    libglib2.0-0 \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy backend requirements & install
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend application
COPY backend/ /app/backend/

# Copy built frontend assets into static directory
COPY --from=frontend-builder /app/frontend/dist /app/frontend/dist

WORKDIR /app/backend

# Expose port (Render/HuggingFace Spaces default is 8000 or $PORT)
EXPOSE 8000
ENV PORT=8000

# Start FastAPI server
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT}"]
