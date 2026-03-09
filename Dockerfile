FROM python:3.11-slim

WORKDIR /app

# System dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements from backend folder
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy all files
COPY . .

# Set working directory to backend for the application to find 'app' module
WORKDIR /app/backend

# Expose port
EXPOSE 8000

# Start application using uvicorn from the backend folder
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
