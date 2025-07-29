# 🚀 Google Cloud App Engine Deployment Guide

This guide will help you deploy the OpenSearch Document Search application to Google Cloud App Engine with serverless scaling.

## 📋 Prerequisites

### 1. Google Cloud Account
- [Create a Google Cloud account](https://cloud.google.com/)
- [Enable billing](https://console.cloud.google.com/billing)
- [Create a new project](https://console.cloud.google.com/projectcreate)

### 2. Install Google Cloud CLI
```bash
# macOS
brew install google-cloud-sdk

# Windows
# Download from: https://cloud.google.com/sdk/docs/install

# Linux
curl https://sdk.cloud.google.com | bash
exec -l $SHELL
```

### 3. Authenticate with Google Cloud
```bash
gcloud auth login
gcloud config set project YOUR_PROJECT_ID
```

## 🔧 Setup Steps

### Step 1: Enable Required APIs
```bash
gcloud services enable appengine.googleapis.com
gcloud services enable cloudbuild.googleapis.com
gcloud services enable cloudresourcemanager.googleapis.com
```

### Step 2: Set Up OpenSearch (Choose One Option)

#### Option A: Managed OpenSearch Service
1. **AWS OpenSearch Service** (Recommended for production)
   - Create a domain in AWS OpenSearch Service
   - Note the endpoint URL, username, and password
   - Update `app.yaml` with the endpoint

2. **Elastic Cloud**
   - Sign up at [elastic.co](https://www.elastic.co/cloud/)
   - Create a deployment
   - Get the endpoint and credentials

3. **Self-hosted OpenSearch**
   - Deploy on Google Compute Engine
   - Set up proper security and networking

#### Option B: Google Cloud Managed Service
```bash
# Enable Cloud Search API (if using Google's search service)
gcloud services enable cloudsearch.googleapis.com
```

### Step 3: Configure Environment Variables

1. **Update `app.yaml`**:
   ```yaml
   env_variables:
     OPENSEARCH_URL: "https://your-opensearch-endpoint.com"
     OPENSEARCH_USERNAME: "admin"
     OPENSEARCH_PASSWORD: "your-secure-password"
   ```

2. **Set up Google Cloud Storage** (Optional):
   ```bash
   # Create a bucket for document storage
   gsutil mb gs://your-document-bucket
   gsutil iam ch allUsers:objectViewer gs://your-document-bucket
   ```

### Step 4: Set Up GitHub Actions (Optional)

1. **Create Service Account**:
   ```bash
   # Create service account
   gcloud iam service-accounts create github-actions \
     --display-name="GitHub Actions Service Account"
   
   # Grant App Engine Admin role
   gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
     --member="serviceAccount:github-actions@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
     --role="roles/appengine.admin"
   
   # Create and download key
   gcloud iam service-accounts keys create key.json \
     --iam-account=github-actions@YOUR_PROJECT_ID.iam.gserviceaccount.com
   ```

2. **Add GitHub Secrets**:
   - Go to your GitHub repository → Settings → Secrets
   - Add `GCP_SA_KEY` with the content of `key.json`
   - Update `PROJECT_ID` in `.github/workflows/deploy.yml`

## 🚀 Deployment Methods

### Method 1: Manual Deployment
```bash
# Build and deploy
npm run build:prod
gcloud app deploy app.yaml

# Deploy to specific version
gcloud app deploy app.yaml --version staging
gcloud app deploy app.yaml --version prod
```

### Method 2: Using Deployment Script
```bash
# Deploy to staging (default)
./scripts/deploy.sh

# Deploy to production
./scripts/deploy.sh prod
```

### Method 3: Automated Deployment (GitHub Actions)
1. Push to `main` branch
2. GitHub Actions will automatically:
   - Run tests
   - Build the application
   - Deploy to staging
   - Deploy to production

## 📊 Monitoring and Management

### View Application Logs
```bash
# View recent logs
gcloud app logs tail

# View logs for specific version
gcloud app logs tail --version=prod
```

### Monitor Performance
```bash
# View application versions
gcloud app versions list

# View traffic allocation
gcloud app services describe default
```

### Scale Application
```bash
# Update scaling configuration
gcloud app deploy app.yaml --version=prod

# Manual scaling (if needed)
gcloud app versions migrate prod --quiet
```

## 🔒 Security Best Practices

### 1. Environment Variables
- Never commit secrets to git
- Use Google Cloud Secret Manager for sensitive data
- Rotate passwords regularly

### 2. Network Security
- Enable HTTPS only
- Configure CORS properly
- Use App Engine's built-in security features

### 3. Access Control
- Use IAM roles with minimal permissions
- Enable audit logging
- Monitor access patterns

## 💰 Cost Optimization

### 1. App Engine Settings
```yaml
automatic_scaling:
  target_cpu_utilization: 0.65
  min_instances: 0  # Scale to zero when not in use
  max_instances: 10 # Limit maximum instances
```

### 2. Resource Limits
```yaml
resources:
  cpu: 1
  memory_gb: 0.5  # Start with minimum
  disk_size_gb: 10
```

### 3. Monitoring Costs
```bash
# View App Engine costs
gcloud billing accounts list
gcloud billing projects describe YOUR_PROJECT_ID
```

## 🚨 Troubleshooting

### Common Issues

1. **Build Failures**:
   ```bash
   # Check build logs
   gcloud app logs tail --service=default
   
   # Verify dependencies
   npm ci
   cd client && npm ci
   ```

2. **Runtime Errors**:
   ```bash
   # Check application logs
   gcloud app logs tail
   
   # Test locally
   npm run dev
   ```

3. **OpenSearch Connection Issues**:
   - Verify endpoint URL
   - Check credentials
   - Test connection manually

### Performance Issues

1. **Slow Response Times**:
   - Check OpenSearch performance
   - Optimize database queries
   - Enable caching

2. **High Memory Usage**:
   - Increase memory allocation
   - Optimize file processing
   - Implement streaming for large files

## 📈 Scaling Considerations

### Automatic Scaling
- **CPU-based**: Scale based on CPU utilization
- **Request-based**: Scale based on request rate
- **Custom metrics**: Scale based on custom metrics

### Manual Scaling
- **Fixed instances**: Always run specified number of instances
- **Basic scaling**: Scale based on request rate with minimum instances

### Traffic Splitting
```bash
# Split traffic between versions
gcloud app services set-traffic default \
  --splits=prod=0.9,staging=0.1
```

## 🔄 Continuous Deployment

### GitHub Actions Workflow
The repository includes a GitHub Actions workflow that:
1. Runs tests on pull requests
2. Deploys to staging on main branch push
3. Deploys to production on main branch push
4. Provides deployment URLs

### Manual Rollback
```bash
# Rollback to previous version
gcloud app versions list
gcloud app services set-traffic default --splits=PREVIOUS_VERSION=1.0
```

## 📞 Support

For issues and questions:
1. Check [Google Cloud App Engine documentation](https://cloud.google.com/appengine/docs)
2. Review application logs
3. Check [GitHub Issues](https://github.com/shotsan/opensearch/issues)

---

**Happy Deploying! 🚀** 