#!/bin/bash

# Local Development Startup Script
echo "🚀 Starting OpenSearch Document Search Application (Local Development)"

# Check if OpenSearch is running
if ! curl -s http://localhost:9200 > /dev/null; then
    echo "⚠️  OpenSearch is not running on port 9200"
    echo "   Please start OpenSearch first:"
    echo "   cd elasticsearch-8.11.0 && ./bin/elasticsearch"
    echo ""
fi

# Start the backend server
echo "📡 Starting backend server on port 4001..."
node index.js &

# Wait a moment for the server to start
sleep 2

# Check if backend is running
if curl -s http://localhost:4001/api/health > /dev/null; then
    echo "✅ Backend server is running at http://localhost:4001"
else
    echo "❌ Backend server failed to start"
    exit 1
fi

echo ""
echo "🌐 Application URLs:"
echo "   Frontend: http://localhost:4000"
echo "   Backend API: http://localhost:4001"
echo "   OpenSearch: http://localhost:9200"
echo ""
echo "📝 To stop the servers, run: pkill -f 'node index.js'"
