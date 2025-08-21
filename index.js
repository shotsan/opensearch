// Load environment variables
require('dotenv').config();
const express = require('express');
const multer = require('multer');
const cors = require('cors');
const { Client } = require('@opensearch-project/opensearch');
const { Storage } = require('@google-cloud/storage');
const pdfParse = require('pdf-parse');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
const allowedOrigins = [
  'https://opensearch-doc-search.uc.r.appspot.com',
  'http://localhost:3000',
  'http://localhost:4000',
];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(null, false);
  },
  methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: false,
  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.json());

// Multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

// OpenSearch client configuration
const opensearchClient = new Client({
  node: process.env.OPENSEARCH_URL,
  ssl: { rejectUnauthorized: false },
  maxRetries: 5
});

// Storage configuration
let storageType = 'local';
let storageClient = null;

if (process.env.NODE_ENV === 'production' && process.env.GCS_BUCKET) {
  // Use Google Cloud Storage in production
  storageType = 'gcs';
  storageClient = new Storage();
  bucket = storageClient.bucket(process.env.GCS_BUCKET);
} else {
  // Use local file system for development
  storageType = 'local';
  const fs = require('fs');
  const path = require('path');
  
  // Ensure uploads directory exists
  const uploadsDir = path.join(__dirname, 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
}

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Upload document
app.post('/api/documents/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const file = req.file;
    const docId = uuidv4();
    const fileName = `${docId}-${file.originalname}`;

    console.log(`📤 Uploading ${file.originalname} with ID: ${docId}`);

    // 1. Store file (local or GCS)
    if (storageType === 'gcs') {
      const gcsFile = bucket.file(fileName);
      await gcsFile.save(file.buffer, {
        metadata: { contentType: file.mimetype }
      });
      console.log(`✅ File uploaded to GCS: ${fileName}`);
    } else {
      // Local file storage
      const fs = require('fs');
      const path = require('path');
      const filePath = path.join(__dirname, 'uploads', fileName);
      fs.writeFileSync(filePath, file.buffer);
      console.log(`✅ File saved locally: ${fileName}`);
    }

    // 2. Parse file content (best-effort, keep fast)
    let content = '';
    if (file.mimetype === 'application/pdf') {
      try {
        const pdfData = await pdfParse(file.buffer);
        content = pdfData.text || '';
      } catch (_) {
        content = '';
      }
    } else if (file.mimetype === 'text/plain' || file.mimetype === 'text/html') {
      // For text files, use the buffer directly
      content = file.buffer.toString('utf8');
    }

    // 3. Index in OpenSearch
    const document = {
      doc_id: docId,
      filename: file.originalname,
      title: file.originalname,
      content: content,
      fileType: file.mimetype,
      fileSize: file.size,
      uploadDate: new Date().toISOString(),
      is_parent: true
    };

    try {
      await opensearchClient.index({
        index: 'documents',
        id: docId,
        body: document
      });
      console.log(`✅ Document indexed in OpenSearch: ${docId}`);
      return res.json({
        message: 'Document uploaded successfully',
        doc_id: docId,
        filename: file.originalname,
        fileType: file.mimetype,
        fileSize: file.size,
        indexed: true
      });
    } catch (indexErr) {
      console.error('⚠️ Indexing deferred due to error:', indexErr && indexErr.message ? indexErr.message : indexErr);
      return res.status(202).json({
        message: 'File stored; indexing deferred',
        doc_id: docId,
        filename: file.originalname,
        fileType: file.mimetype,
        fileSize: file.size,
        indexed: false
      });
    }

  } catch (error) {
    console.error('❌ Upload error:', error);
    res.status(500).json({ error: 'Upload failed', details: error.message });
  }
});

// Get document by ID
app.get('/api/documents/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const response = await opensearchClient.get({
      index: 'documents',
      id: id
    });

    res.json(response.body._source);
  } catch (error) {
    console.error('❌ Get document error:', error);
    res.status(404).json({ error: 'Document not found' });
  }
});

// Serve PDF
app.get('/api/documents/:id/pdf', async (req, res) => {
  try {
    const { id } = req.params;

    // Get document from OpenSearch
    const response = await opensearchClient.get({
      index: 'documents',
      id: id
    });

    const document = response.body._source || {};
    const safeTitle = document.title ? String(document.title) : '';
    const safeFilename = document.filename ? String(document.filename) : '';
    const safeDocId = document.doc_id ? String(document.doc_id) : String(id);

    // Candidate filenames to handle legacy and current naming schemes
    const candidateNames = [
      `${safeDocId}-${safeFilename}`,
      `${safeDocId}-${safeTitle}`,
      `${id}-${safeFilename}`,
      `${id}-${safeTitle}`,
      safeFilename,
      safeTitle
    ].filter(Boolean);

    if (storageType === 'gcs') {
      // Handle GCS storage
      let resolvedFile = null;
      for (const name of candidateNames) {
        const f = bucket.file(name);
        // eslint-disable-next-line no-await-in-loop
        const [exists] = await f.exists();
        if (exists) {
          resolvedFile = f;
          break;
        }
      }

      if (!resolvedFile) {
        return res.status(404).json({ error: 'File not found in GCS storage', tried: candidateNames });
      }

      const [metadata] = await resolvedFile.getMetadata();
      res.setHeader('Content-Type', metadata.contentType || 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="${safeFilename || safeTitle || 'document.pdf'}"`);

      resolvedFile.createReadStream().pipe(res);
    } else {
      // Handle local storage
      const fs = require('fs');
      const path = require('path');
      const uploadsDir = process.env.UPLOAD_PATH || './uploads';
      
      let foundFile = null;
      for (const name of candidateNames) {
        const filePath = path.join(uploadsDir, name);
        if (fs.existsSync(filePath)) {
          foundFile = filePath;
          break;
        }
      }

      if (!foundFile) {
        return res.status(404).json({ error: 'File not found in local storage', tried: candidateNames });
      }

      const mimeType = document.fileType || 'application/pdf';
      res.setHeader('Content-Type', mimeType);
      res.setHeader('Content-Disposition', `inline; filename="${safeFilename || safeTitle || 'document.pdf'}"`);

      const fileStream = fs.createReadStream(foundFile);
      fileStream.pipe(res);
    }
  } catch (error) {
    console.error('❌ Serve PDF error:', error);
    res.status(500).json({ error: 'Failed to serve PDF' });
  }
});

// Get all documents
app.get('/api/documents', async (req, res) => {
  try {
    const { page = 1, limit = 20, sortBy = 'uploadDate', sortOrder = 'desc' } = req.query;
    
    const sortField = sortBy === 'uploadDate' ? 'uploadDate' : '_score';
    const sortDirection = sortOrder === 'desc' ? 'desc' : 'asc';
    
    const response = await opensearchClient.search({
      index: 'documents',
      body: {
        from: (parseInt(page) - 1) * parseInt(limit),
        size: parseInt(limit),
        query: {
          match_all: {}
        },
        sort: [
          { [sortField]: { order: sortDirection } }
        ],
        _source: ['filename', 'title', 'fileType', 'fileSize', 'uploadDate', 'is_parent']
      }
    });

    const documents = response.body.hits.hits.map(hit => ({
      id: hit._id,
      source: hit._source
    }));

    res.json({
      total: response.body.hits.total.value,
      documents: documents,
      page: parseInt(page),
      limit: parseInt(limit)
    });
  } catch (error) {
    console.error('❌ Get documents error:', error);
    res.status(500).json({ error: 'Failed to get documents' });
  }
});

// Search documents
app.get('/api/search', async (req, res) => {
  try {
    const { q, fileType, dateFrom, dateTo, page = 1, limit = 10 } = req.query;
    
    if (!q) {
      return res.status(400).json({ error: 'Query parameter required' });
    }

    // Build filter conditions
    const mustConditions = [
      {
        multi_match: {
          query: q,
          fields: ['content^2', 'title^3'],
          type: 'best_fields',
          fuzziness: 'AUTO'
        }
      }
    ];

    // Add file type filter
    if (fileType) {
      mustConditions.push({
        term: { fileType: fileType }
      });
    }

    // Add date range filter
    if (dateFrom || dateTo) {
      const dateFilter = { range: { uploadDate: {} } };
      if (dateFrom) dateFilter.range.uploadDate.gte = dateFrom;
      if (dateTo) dateFilter.range.uploadDate.lte = dateTo;
      mustConditions.push(dateFilter);
    }
    
    const response = await opensearchClient.search({
      index: 'documents',
      body: {
        from: (parseInt(page) - 1) * parseInt(limit),
        size: parseInt(limit),
        query: {
          bool: {
            must: mustConditions
          }
        },
        highlight: {
          fields: {
            content: {
              fragment_size: 200,
              number_of_fragments: 3,
              pre_tags: ['<mark>'],
              post_tags: ['</mark>']
            },
            title: {
              fragment_size: 100,
              number_of_fragments: 1,
              pre_tags: ['<mark>'],
              post_tags: ['</mark>']
            }
          }
        },
        sort: [
          { _score: { order: 'desc' } },
          { uploadDate: { order: 'desc' } }
        ],
        _source: ['doc_id', 'filename', 'title', 'fileType', 'fileSize', 'uploadDate', 'is_parent']
      }
    });
    
    const hits = response.body.hits.hits.map(hit => ({
      id: hit._id,
      ...hit._source,
      highlights: hit.highlight || {}
    }));
    
    res.json({
      query: q,
      total: response.body.hits.total.value,
      hits: hits
    });
    
  } catch (error) {
    console.error('❌ Search error:', error);
    res.status(500).json({ error: 'Search failed' });
  }
});

// Search suggestions (minimal implementation)
app.get('/api/search/suggestions', async (req, res) => {
  try {
    const rawQuery = req.query.q;
    const query = typeof rawQuery === 'string' ? rawQuery.trim() : '';
    if (!query) {
      return res.json({ query: '', suggestions: [] });
    }

    const response = await opensearchClient.search({
      index: 'documents',
      body: {
        size: 5,
        query: {
          multi_match: {
            query,
            fields: ['title^3', 'content^1'],
            type: 'phrase_prefix',
            slop: 2
          }
        },
        _source: ['title', 'filename'],
        sort: [
          { _score: { order: 'desc' } },
          { uploadDate: { order: 'desc' } }
        ]
      }
    });

    const suggestions = [];
    const seen = new Set();
    for (const hit of response.body.hits.hits) {
      const src = hit._source || {};
      const candidate = (src.title && String(src.title).trim()) || (src.filename && String(src.filename).trim());
      if (candidate && !seen.has(candidate)) {
        suggestions.push(candidate);
        seen.add(candidate);
      }
      if (suggestions.length >= 5) break;
    }

    return res.json({ query, suggestions });
  } catch (error) {
    console.error('❌ Suggestions error:', error);
    // Fail soft with empty suggestions to avoid breaking UI
    return res.json({ query: typeof req.query.q === 'string' ? req.query.q : '', suggestions: [] });
  }
});

// Get supported file types
app.get('/api/documents/types/supported', (req, res) => {
  res.json({
    types: [
      { value: 'application/pdf', label: 'PDF Documents' },
      { value: 'text/html', label: 'HTML Files' },
      { value: 'text/plain', label: 'Text Files' },
      { value: 'application/msword', label: 'Word Documents' },
      { value: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', label: 'Word Documents (.docx)' }
    ]
  });
});

// Search analytics endpoint
app.get('/api/search/analytics', async (req, res) => {
  try {
    console.log('📊 Analytics request received');
    
    // 1. Total Documents
    let totalDocuments = 0;
    try {
      const docCountResp = await opensearchClient.count({ index: "documents" });
      totalDocuments = docCountResp.body?.count || docCountResp.count || 0;
      console.log('📊 Total documents:', totalDocuments);
    } catch (e) {
      console.error("Analytics: Error getting document count:", e);
    }

    // 2. File Type Distribution
    let fileTypeDistribution = [];
    try {
      const fileTypeResp = await opensearchClient.search({
        index: "documents",
        body: {
          size: 0,
          aggs: {
            file_types: {
              terms: { field: "fileType.keyword", size: 10 },
            },
          },
        },
      });
      const total = fileTypeResp.body?.hits?.total?.value || totalDocuments;
      fileTypeDistribution = (
        fileTypeResp.body?.aggregations?.file_types?.buckets || []
      ).map((b) => ({
        type: b.key,
        count: b.doc_count,
        percentage: total ? Math.round((b.doc_count / total) * 1000) / 10 : 0,
      }));
      console.log('📊 File type distribution:', fileTypeDistribution);
    } catch (e) {
      console.error("Analytics: Error getting file type distribution:", e);
    }

    // 3. Total Searches and Popular Queries
    let totalSearches = 0;
    let popularQueries = [];
    let averageSearchTime = 0;
    
    try {
      // Get total searches
      const searchCountResp = await opensearchClient.count({ index: "search_logs" });
      totalSearches = searchCountResp.body?.count || searchCountResp.count || 0;
      console.log('📊 Total searches:', totalSearches);
      
      // Get popular queries by enabling fielddata temporarily
      try {
        // First, enable fielddata on the query field
        await opensearchClient.indices.putMapping({
          index: "search_logs",
          body: {
            properties: {
              query: {
                type: "text",
                fielddata: true
              }
            }
          }
        });
        
        // Now get popular queries
        const popQueryResp = await opensearchClient.search({
          index: "search_logs",
          body: {
            size: 0,
            aggs: {
              popular_queries: {
                terms: { field: "query", size: 5 }
              }
            }
          }
        });
        
        popularQueries = (
          popQueryResp.body?.aggregations?.popular_queries?.buckets || []
        ).map((b) => ({
          query: b.key,
          count: b.doc_count,
        }));
        console.log('📊 Popular queries:', popularQueries);
      } catch (e) {
        console.error("Analytics: Error getting popular queries:", e);
        // Fallback: get some recent queries manually
        const recentQueriesResp = await opensearchClient.search({
          index: "search_logs",
          body: {
            size: 10,
            sort: [{ timestamp: { order: "desc" } }],
            _source: ["query"]
          }
        });
        
        const queryCounts = {};
        recentQueriesResp.body.hits.hits.forEach(hit => {
          const query = hit._source.query;
          queryCounts[query] = (queryCounts[query] || 0) + 1;
        });
        
        popularQueries = Object.entries(queryCounts)
          .map(([query, count]) => ({ query, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5);
        console.log('📊 Popular queries (fallback):', popularQueries);
      }
      
      // Get average search time
      const avgTimeResp = await opensearchClient.search({
        index: "search_logs",
        body: {
          size: 0,
          aggs: {
            avg_duration: {
              avg: { field: "duration" },
            },
          },
        },
      });
      averageSearchTime = Math.round(
        avgTimeResp.body?.aggregations?.avg_duration?.value || 0
      );
      console.log('📊 Average search time:', averageSearchTime, 'ms');
      
    } catch (e) {
      console.error("Analytics: Error getting search stats:", e);
    }

    // 4. Recent Activity (last 7 days)
    let recentActivity = {
      documentsUploaded: 0,
      searchesPerformed: 0,
      averageSearchTime: 0,
    };
    try {
      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      // Documents uploaded in last 7 days
      const docsUploadedResp = await opensearchClient.count({
        index: "documents",
        body: {
          query: {
            range: {
              uploadDate: {
                gte: weekAgo.toISOString(),
                lte: now.toISOString(),
              },
            },
          },
        },
      });
      recentActivity.documentsUploaded = docsUploadedResp.body?.count || docsUploadedResp.count || 0;
      
      // Searches performed in last 7 days
      const recentSearchesResp = await opensearchClient.count({
        index: "search_logs",
        body: {
          query: {
            range: {
              timestamp: {
                gte: weekAgo.toISOString(),
                lte: now.toISOString(),
              },
            },
          },
        },
      });
      recentActivity.searchesPerformed = recentSearchesResp.body?.count || recentSearchesResp.count || 0;
      recentActivity.averageSearchTime = averageSearchTime;
      
      console.log('📊 Recent documents uploaded:', recentActivity.documentsUploaded);
      console.log('📊 Recent searches performed:', recentActivity.searchesPerformed);
    } catch (e) {
      console.error("Analytics: Error getting recent activity:", e);
    }

    const analytics = {
      totalDocuments,
      fileTypeDistribution,
      recentActivity,
      popularQueries,
      totalSearches,
    };

    console.log('✅ Analytics response sent');
    res.json({ analytics }); // Wrap in analytics object for frontend
    
  } catch (error) {
    console.error('❌ Analytics error:', error);
    res.status(500).json({ 
      error: 'Failed to get search analytics',
      message: error.message 
    });
  }
});

// Get document pages (for multi-page documents)
app.get('/api/documents/:id/pages', async (req, res) => {
  try {
    const { id } = req.params;
    const { page } = req.query;
    
    // For now, return the main document
    // In a full implementation, this would return specific pages
    const response = await opensearchClient.get({
      index: 'documents',
      id: id
    });
    
    res.json({
      document: response.body._source,
      page: page || 1,
      totalPages: 1
    });
  } catch (error) {
    console.error('❌ Get document pages error:', error);
    res.status(404).json({ error: 'Document not found' });
  }
});

// Initialize OpenSearch index
async function initializeOpenSearch() {
  try {
    // Check if index exists
    const indexExists = await opensearchClient.indices.exists({ index: 'documents' });
    
    if (!indexExists.body) {
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
      console.log('✅ Created documents index');
    }
    
    console.log('✅ OpenSearch initialized');
  } catch (error) {
    console.error('❌ OpenSearch initialization failed:', error);
    throw error;
  }
}

// Start server
async function startServer() {
  try {
    // Start server immediately; initialize index in background to avoid cold-start blocking
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 Health: http://localhost:${PORT}/api/health`);
    });

    initializeOpenSearch().catch((err) => {
      console.error('❌ Background OpenSearch initialization failed:', err);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer(); 