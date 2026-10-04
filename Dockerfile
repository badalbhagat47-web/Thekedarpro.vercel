FROM python:3.11-slim

WORKDIR /app

# Copy application files
COPY . /app

# Expose server port
EXPOSE 8000

# Set environment variable for persistent DB directory
ENV PORT=8000
ENV DB_DIR=/data

# Create persistent data directory
RUN mkdir -p /data

# Start multithreaded production Python server
CMD ["python", "server.py"]
