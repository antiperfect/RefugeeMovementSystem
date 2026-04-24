# Use an official Python runtime as a parent image
# 'slim' versions are smaller and more efficient for production
FROM python:3.10-slim

# Set environment variables
# PYTHONUNBUFFERED=1 ensures logs are sent straight to the terminal
# PYTHONDONTWRITEBYTECODE=1 prevents Python from writing .pyc files
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PORT=5000

# Set the working directory in the container
WORKDIR /app

# Install system dependencies needed for libraries like Scipy/Pandas
# These are often required for building C-extensions
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

# Copy only the requirements file first to leverage Docker's cache
# This means if you change your code but not your requirements, 
# Docker doesn't have to re-install all your heavy ML libraries.
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application code and models (.pkl files)
COPY . .

# Expose the port the app runs on
EXPOSE 5000

# Start the application using Gunicorn (production-grade server)
# We bind to 0.0.0.0 so it's accessible outside the container
# We use the PORT environment variable which is standard for Render/Railway/CloudRun
CMD ["sh", "-c", "gunicorn --bind 0.0.0.0:${PORT} --workers 2 --timeout 120 app:app"]
