# backend/Dockerfile
# from python:3.10-alpine
FROM python:3.10-slim-bookworm

# 1) Pull OS security patches
RUN apt-get update \
 && apt-get upgrade -y \
 && apt-get install --no-install-recommends -y gcc libpq-dev \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY ./app ./app

EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
