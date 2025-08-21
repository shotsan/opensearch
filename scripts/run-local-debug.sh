#!/bin/bash

echo "=== Building Docker Image ==="
docker build -t opensearch-backend .

echo -e "\n=== Starting Backend Container ==="
docker run -p 8080:8080 opensearch-backend 