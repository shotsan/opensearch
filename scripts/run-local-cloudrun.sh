#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Starting Local Cloud Run Development Server ===${NC}"

# Create deploy directory if it doesn't exist
mkdir -p deploy

# Copy necessary files to deploy directory
echo -e "${YELLOW}Copying files to deploy directory...${NC}"
cp -r controllers routes services utils deploy/
cp server.js index.js package.json package-lock.json debug-config.js deploy/

# Create Dockerfile for local development
echo -e "${YELLOW}Creating Dockerfile...${NC}"
cat > deploy/Dockerfile << 'EOF'
FROM node:20-slim

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy application files
COPY . .

# Set environment variables
ENV NODE_ENV=development
ENV PORT=8080
ENV OPENSEARCH_PROTOCOL=http
ENV OPENSEARCH_HOST=host.docker.internal
ENV OPENSEARCH_PORT=9200
ENV DEBUG_LEVEL=debug
ENV ENABLE_REQUEST_LOGGING=true
ENV ENABLE_RESPONSE_LOGGING=true

# Expose port
EXPOSE 8080

# Start the application
CMD ["node", "server.js"]
EOF

# Build and run using Cloud Run emulator
echo -e "${GREEN}Building and running container...${NC}"
cd deploy

# Build the container
docker build -t opensearch-backend:dev .

# Run the container with Cloud Run emulator
docker run -it --rm \
  -p 8080:8080 \
  -e PORT=8080 \
  -e NODE_ENV=development \
  -e OPENSEARCH_HOST=host.docker.internal \
  -e OPENSEARCH_PORT=9200 \
  --name opensearch-backend-dev \
  opensearch-backend:dev

# Note: The server will be available at:
# - Application: http://localhost:8080
# - API Endpoints: http://localhost:8080/api/* 