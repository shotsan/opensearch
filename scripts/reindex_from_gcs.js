/*
  One-time reindex script: Read PDFs from GCS and index metadata + content into Elasticsearch/OpenSearch
  Usage:
    OPENSEARCH_URL=http://34.67.27.172:9200 GCS_BUCKET=opensearch-documents-opensearch-doc-search node scripts/reindex_from_gcs.js --limit=3
*/
const { Client } = require('@opensearch-project/opensearch');
const { Storage } = require('@google-cloud/storage');
const pdfParse = require('pdf-parse');

const OPENSEARCH_URL = process.env.OPENSEARCH_URL || 'http://34.67.27.172:9200';
const GCS_BUCKET = process.env.GCS_BUCKET;
const LIMIT = parseInt((process.argv.find(a => a.startsWith('--limit=')) || '').split('=')[1] || '10', 10);

if (!GCS_BUCKET) {
  console.error('GCS_BUCKET env var required');
  process.exit(1);
}

const opensearch = new Client({ node: OPENSEARCH_URL });
const storage = new Storage();
const bucket = storage.bucket(GCS_BUCKET);

function parseObjectName(name) {
  // Expect: <uuid>-<originalname>
  const dashIndex = name.indexOf('-');
  if (dashIndex === -1) return { docId: null, filename: name };
  const docId = name.slice(0, dashIndex);
  const filename = name.slice(dashIndex + 1);
  return { docId, filename };
}

async function ensureIndex() {
  const exists = await opensearch.indices.exists({ index: 'documents' });
  if (!exists.body) {
    await opensearch.indices.create({
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
    console.log('Created index documents');
  }
}

async function main() {
  await ensureIndex();
  const [files] = await bucket.getFiles({ autoPaginate: false, maxResults: LIMIT });
  console.log(`Found ${files.length} objects (processing up to ${LIMIT})`);

  for (const file of files) {
    const name = file.name;
    const { docId, filename } = parseObjectName(name);
    if (!docId || !filename) {
      console.log(`Skipping non-standard name: ${name}`);
      continue;
    }

    console.log(`Processing ${name}`);
    const [metadata] = await file.getMetadata();
    const contentType = metadata.contentType || 'application/pdf';
    const fileSize = parseInt(metadata.size || '0', 10);

    let content = '';
    if (contentType === 'application/pdf') {
      const buffer = await file.download().then(([buf]) => buf);
      const parsed = await pdfParse(buffer).catch(() => ({ text: '' }));
      content = parsed.text || '';
    }

    const document = {
      doc_id: docId,
      filename,
      title: filename,
      content,
      fileType: contentType,
      fileSize,
      uploadDate: new Date().toISOString(),
      is_parent: true
    };

    await opensearch.index({ index: 'documents', id: docId, body: document });
    console.log(`Indexed ${docId}`);
  }

  await opensearch.indices.refresh({ index: 'documents' });
  console.log('Refresh complete');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});



