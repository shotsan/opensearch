const { Client } = require('@opensearch-project/opensearch');
require('dotenv').config();

const opensearchClient = new Client({
  node: process.env.OPENSEARCH_URL,
  ssl: { rejectUnauthorized: false },
  maxRetries: 5
});

async function resetIndex() {
  try {
    console.log('🔄 Resetting OpenSearch index...');
    
    // Delete existing index if it exists
    const indexExists = await opensearchClient.indices.exists({ index: 'documents' });
    if (indexExists.body) {
      await opensearchClient.indices.delete({ index: 'documents' });
      console.log('✅ Deleted existing documents index');
    }
    
    // Create new index with correct mappings
    await opensearchClient.indices.create({
      index: 'documents',
      body: {
        mappings: {
          properties: {
            doc_id: { type: 'keyword' },
            filename: { type: 'keyword' },
            title: { type: 'text' },
            content: { type: 'text' },
            fileType: { type: 'keyword' },
            fileSize: { type: 'long' },
            uploadDate: { type: 'date' },
            is_parent: { type: 'boolean' }
          }
        }
      }
    });
    
    console.log('✅ Created documents index with correct mappings');
    console.log('🎉 Index reset complete!');
  } catch (error) {
    console.error('❌ Failed to reset index:', error);
    process.exit(1);
  }
}

resetIndex();
