#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Starting Local App Engine Development Server ===${NC}"

# Set path to dev_appserver.py
DEV_APPSERVER="/opt/homebrew/share/google-cloud-sdk/platform/google_appengine/dev_appserver.py"

# Check if dev_appserver.py exists
if [ ! -f "$DEV_APPSERVER" ]; then
    echo -e "${RED}Error: dev_appserver.py not found at $DEV_APPSERVER${NC}"
    echo "Please check your Google Cloud SDK installation"
    exit 1
fi

# Create deploy directory if it doesn't exist
mkdir -p deploy

# Copy necessary files to deploy directory
echo -e "${YELLOW}Copying files to deploy directory...${NC}"
cp -r controllers routes services utils deploy/
cp server.js index.js package.json package-lock.json debug-config.js deploy/
cp deploy/app.yaml deploy/app.yaml.local

# Install dependencies in deploy directory
echo -e "${YELLOW}Installing dependencies...${NC}"
cd deploy && npm install

# Set environment variables
export OPENSEARCH_HOST=localhost
export OPENSEARCH_PORT=9200
export NODE_ENV=development

# Start the development server with debugging enabled
echo -e "${GREEN}Starting development server...${NC}"
python3 "$DEV_APPSERVER" app.yaml \
    --host=localhost \
    --port=8080 \
    --admin_host=localhost \
    --admin_port=8000 \
    --log_level=debug \
    --dev_appserver_log_level=debug \
    --enable_console=yes \
    --automatic_restart=yes \
    --allow_skipped_files=yes \
    --skip_sdk_update_check=yes \
    --env_var="OPENSEARCH_HOST=$OPENSEARCH_HOST" \
    --env_var="OPENSEARCH_PORT=$OPENSEARCH_PORT" \
    --env_var="NODE_ENV=$NODE_ENV"

# Note: The server will be available at:
# - Admin interface: http://localhost:8000
# - Application: http://localhost:8080
# - API Endpoints: http://localhost:8080/api/* 