FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy only the API code (not the frontend)
COPY api/ ./api/

# Default port (Railway will override with PORT env var)
ENV PORT=8080
EXPOSE 8080

# Run with gunicorn using shell form to expand $PORT
CMD gunicorn api.index:app --bind 0.0.0.0:$PORT
