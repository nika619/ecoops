# -- Stage 1: Build the Vite React Frontend --
FROM node:20 AS frontend-builder
WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm ci

COPY frontend ./
RUN npm run build

# -- Stage 2: Serve with Python Flask/Gunicorn --
FROM python:3.11-slim
WORKDIR /app

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt gunicorn

# Copy backend code, templates, static, and demo files
COPY backend ./backend
COPY templates ./templates
COPY static ./static
COPY demo ./demo

# Copy built frontend from Stage 1
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Set Cloud Run expected environment variable
ENV PORT=8080
EXPOSE 8080

# Ensure Python output is not buffered
ENV PYTHONUNBUFFERED=1

# Run the app with gunicorn
CMD exec gunicorn --bind :$PORT --workers 1 --threads 8 --timeout 0 "backend.web_app:app"
