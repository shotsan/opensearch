#!/bin/bash

# Deploy script for Google Cloud App Engine
# Usage: ./scripts/deploy.sh [staging|prod]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Default to staging
ENVIRONMENT=${1:-staging}
PROJECT_ID="your-gcp-project-id"

echo -e "${YELLOW}🚀 Starting deployment to $ENVIRONMENT...${NC}"

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo -e "${RED}❌ Google Cloud CLI is not installed. Please install it first.${NC}"
    exit 1
fi

# Check if user is authenticated
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
    echo -e "${YELLOW}⚠️  Not authenticated with Google Cloud. Please run: gcloud auth login${NC}"
    exit 1
fi

# Check if project is set
CURRENT_PROJECT=$(gcloud config get-value project 2>/dev/null)
if [ "$CURRENT_PROJECT" != "$PROJECT_ID" ]; then
    echo -e "${YELLOW}⚠️  Setting project to $PROJECT_ID${NC}"
    gcloud config set project $PROJECT_ID
fi

# Install dependencies
echo -e "${YELLOW}📦 Installing dependencies...${NC}"
npm ci
cd client && npm ci && cd ..

# Build the application
echo -e "${YELLOW}🔨 Building application...${NC}"
npm run build:prod

# Deploy to App Engine
echo -e "${YELLOW}🚀 Deploying to App Engine ($ENVIRONMENT)...${NC}"
gcloud app deploy app.yaml --version $ENVIRONMENT --quiet

# Get the deployed URL
if [ "$ENVIRONMENT" = "prod" ]; then
    APP_URL="https://$PROJECT_ID.appspot.com"
else
    APP_URL="https://$ENVIRONMENT-dot-$PROJECT_ID.appspot.com"
fi

echo -e "${GREEN}✅ Deployment successful!${NC}"
echo -e "${GREEN}🌐 Your app is available at: $APP_URL${NC}"

# Show recent versions
echo -e "${YELLOW}📋 Recent versions:${NC}"
gcloud app versions list --limit=5 