#!/bin/bash

echo "🚀 Setting up OpenSearch Document Search Application"
echo "=================================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 16 or higher."
    echo "   Download from: https://nodejs.org/"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 16 ]; then
    echo "❌ Node.js version 16 or higher is required. Current version: $(node -v)"
    echo "   Please upgrade Node.js from: https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js version: $(node -v)"

# Check if Java is installed (required for OpenSearch)
JAVA_VERSION=""
if command -v java &> /dev/null; then
    JAVA_VERSION=$(java -version 2>&1 | head -n 1 | cut -d'"' -f2 | cut -d'.' -f1)
    if [ "$JAVA_VERSION" -ge 11 ]; then
        echo "✅ Java version: $(java -version 2>&1 | head -n 1)"
    else
        echo "❌ Java version 11 or higher is required. Current version: $(java -version 2>&1 | head -n 1)"
        echo "   Please upgrade Java from: https://adoptium.net/"
        exit 1
    fi
else
    echo "❌ Java is not installed. OpenSearch requires Java 11 or higher."
    echo "   Please install Java from: https://adoptium.net/"
    echo ""
    echo "   On macOS with Homebrew: brew install --cask temurin"
    echo "   On Ubuntu/Debian: sudo apt install openjdk-11-jdk"
    echo "   On CentOS/RHEL: sudo yum install java-11-openjdk"
    exit 1
fi

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cp env.example .env
    echo "✅ .env file created"
else
    echo "✅ .env file already exists"
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm run install-all

if [ $? -eq 0 ]; then
    echo "✅ Dependencies installed successfully"
else
    echo "❌ Failed to install dependencies"
    exit 1
fi

# Create uploads directory
mkdir -p uploads
echo "✅ Created uploads directory"

# Check system architecture
ARCH=$(uname -m)
echo "🔍 Detected architecture: $ARCH"

if [[ "$ARCH" == "arm64" ]]; then
    echo "⚠️  Apple Silicon detected!"
    echo "   OpenSearch doesn't provide native binaries for Apple Silicon Macs."
    echo "   We'll use a simple alternative: Elasticsearch (which works on Apple Silicon)"
    echo ""
    
    # Download Elasticsearch instead (which works on Apple Silicon)
    echo "📥 Setting up Elasticsearch (OpenSearch alternative)..."
    ES_VERSION="8.11.0"
    ES_DIR="elasticsearch-${ES_VERSION}"
    
    if [ ! -d "$ES_DIR" ]; then
        echo "Downloading Elasticsearch ${ES_VERSION}..."
        DOWNLOAD_URL="https://artifacts.elastic.co/downloads/elasticsearch/elasticsearch-${ES_VERSION}-darwin-aarch64.tar.gz"
        
        if curl -L -o elasticsearch.tar.gz "$DOWNLOAD_URL"; then
            echo "Extracting Elasticsearch..."
            if tar -xzf elasticsearch.tar.gz; then
                rm elasticsearch.tar.gz
                echo "✅ Elasticsearch downloaded and extracted"
            else
                echo "❌ Failed to extract Elasticsearch archive"
                rm -f elasticsearch.tar.gz
                exit 1
            fi
        else
            echo "❌ Failed to download Elasticsearch"
            exit 1
        fi
    else
        echo "✅ Elasticsearch already exists"
    fi
    
    # Configure Elasticsearch
    echo "⚙️  Configuring Elasticsearch..."
    mkdir -p "$ES_DIR/config"
    
    cat > "$ES_DIR/config/elasticsearch.yml" << EOF
cluster.name: opensearch-cluster
node.name: node-1
path.data: ./data
path.logs: ./logs
network.host: 0.0.0.0
http.port: 9200
discovery.type: single-node
xpack.security.enabled: false
EOF
    
    echo "✅ Elasticsearch configured"
    
    # Create start script for Elasticsearch
    cat > start-opensearch.sh << 'EOF'
#!/bin/bash
echo "🚀 Starting Elasticsearch (OpenSearch alternative)..."
cd elasticsearch-8.11.0
./bin/elasticsearch
EOF
    
    chmod +x start-opensearch.sh
    
    # Update .env to use Elasticsearch
    sed -i '' 's/OPENSEARCH_HOST=localhost/OPENSEARCH_HOST=localhost/' .env
    sed -i '' 's/OPENSEARCH_PORT=9200/OPENSEARCH_PORT=9200/' .env
    
else
    # Intel Mac or Linux - use OpenSearch
    echo "📥 Setting up OpenSearch..."
    OPENSEARCH_VERSION="2.11.0"
    OPENSEARCH_DIR="opensearch-${OPENSEARCH_VERSION}"
    
    if [ ! -d "$OPENSEARCH_DIR" ]; then
        echo "Downloading OpenSearch ${OPENSEARCH_VERSION}..."
        
        if [[ "$OSTYPE" == "darwin"* ]]; then
            DOWNLOAD_URL="https://artifacts.opensearch.org/releases/bundle/opensearch/${OPENSEARCH_VERSION}/opensearch-${OPENSEARCH_VERSION}-darwin-x64.tar.gz"
        elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
            DOWNLOAD_URL="https://artifacts.opensearch.org/releases/bundle/opensearch/${OPENSEARCH_VERSION}/opensearch-${OPENSEARCH_VERSION}-linux-x64.tar.gz"
        else
            echo "❌ Unsupported operating system: $OSTYPE"
            exit 1
        fi
        
        if curl -L -o opensearch.tar.gz "$DOWNLOAD_URL"; then
            echo "Extracting OpenSearch..."
            if tar -xzf opensearch.tar.gz; then
                rm opensearch.tar.gz
                echo "✅ OpenSearch downloaded and extracted"
            else
                echo "❌ Failed to extract OpenSearch archive"
                rm -f opensearch.tar.gz
                exit 1
            fi
        else
            echo "❌ Failed to download OpenSearch"
            exit 1
        fi
    else
        echo "✅ OpenSearch already exists"
    fi
    
    # Configure OpenSearch
    echo "⚙️  Configuring OpenSearch..."
    mkdir -p "$OPENSEARCH_DIR/config"
    
    cat > "$OPENSEARCH_DIR/config/opensearch.yml" << EOF
cluster.name: opensearch-cluster
node.name: node-1
path.data: ./data
path.logs: ./logs
network.host: 0.0.0.0
http.port: 9200
discovery.type: single-node
plugins.security.disabled: true
EOF
    
    echo "✅ OpenSearch configured"
    
    # Create start script for OpenSearch
    cat > start-opensearch.sh << 'EOF'
#!/bin/bash
echo "🚀 Starting OpenSearch..."
cd opensearch-2.11.0
./bin/opensearch
EOF
    
    chmod +x start-opensearch.sh
fi

# Create start script for the application
cat > start-app.sh << 'EOF'
#!/bin/bash
echo "🚀 Starting OpenSearch Document Search Application..."
npm run dev
EOF

chmod +x start-app.sh

# Create test script
cat > test-opensearch.js << 'EOF'
const { Client } = require('@opensearch-project/opensearch');

async function testOpenSearch() {
  console.log('🔍 Testing Search Engine Connection...');
  
  const client = new Client({
    node: 'http://localhost:9200',
    ssl: {
      rejectUnauthorized: false,
    },
  });

  try {
    const info = await client.info();
    console.log('✅ Search engine is running!');
    console.log('📊 Cluster info:', info.body);
  } catch (error) {
    console.error('❌ Search engine test failed:', error.message);
    console.log('\n🔧 Troubleshooting tips:');
    console.log('1. Make sure the search engine is running on http://localhost:9200');
    console.log('2. Check that Java 11+ is installed');
    console.log('3. Verify no other service is using port 9200');
    console.log('4. Try running: ./start-opensearch.sh');
  }
}

testOpenSearch();
EOF

echo ""
echo "🎉 Setup complete!"
echo ""
if [[ "$ARCH" == "arm64" ]]; then
    echo "📝 Note: Using Elasticsearch instead of OpenSearch (Apple Silicon compatibility)"
    echo "   The application will work exactly the same way."
    echo ""
fi
echo "Next steps:"
echo ""
echo "1. Start the search engine (in a new terminal):"
echo "   ./start-opensearch.sh"
echo ""
echo "2. Test the connection:"
echo "   node test-opensearch.js"
echo ""
echo "3. Start the application (in another terminal):"
echo "   ./start-app.sh"
echo ""
echo "4. Open your browser:"
echo "   Frontend: http://localhost:3000"
echo "   Backend API: http://localhost:3001"
echo "   Search Engine: http://localhost:9200"
echo ""
echo "Happy searching! 🔍" 