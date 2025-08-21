#!/bin/bash

echo "🔍 DEBUGGING SCRIPT - Test Each Component"
echo "=========================================="

echo ""
echo "1️⃣ Testing OpenSearch (should return version):"
curl -s "http://localhost:9200" | jq '.version.number' 2>/dev/null || echo "❌ OpenSearch not running on port 9200"

echo ""
echo "2️⃣ Testing Backend API (should return OK):"
curl -s "http://localhost:4001/api/health" | jq '.status' 2>/dev/null || echo "❌ Backend not running on port 4001"

echo ""
echo "3️⃣ Testing Frontend (should return HTML):"
curl -s "http://localhost:3000" | head -1 2>/dev/null || echo "❌ Frontend not running on port 3000"

echo ""
echo "4️⃣ Testing Search API (should return results):"
curl -s "http://localhost:4001/api/search?q=JavaScript" | jq '.total' 2>/dev/null || echo "❌ Search API failed"

echo ""
echo "5️⃣ Testing Documents API (should return count):"
curl -s "http://localhost:4001/api/documents" | jq '.total' 2>/dev/null || echo "❌ Documents API failed"

echo ""
echo "6️⃣ Testing Frontend Proxy (should return same as backend):"
curl -s "http://localhost:3000/api/search?q=JavaScript" | jq '.total' 2>/dev/null || echo "❌ Frontend proxy failed"

echo ""
echo "=========================================="
echo "🎯 RESULTS:"
echo "- If you see ❌ errors, that component needs to be started"
echo "- If you see numbers/results, that component is working"
echo ""
echo "📋 COMMANDS TO START SERVICES:"
echo "1. OpenSearch: cd elasticsearch-8.11.0 && ./bin/elasticsearch"
echo "2. Backend: node index.js"
echo "3. Frontend: cd client && npm start"
