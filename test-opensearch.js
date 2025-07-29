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
