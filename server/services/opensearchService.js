const { Client } = require("@opensearch-project/opensearch");

let client;

const initializeOpenSearch = async () => {
  const protocol = process.env.OPENSEARCH_PROTOCOL || "http";
  const host = process.env.OPENSEARCH_HOST || "localhost";
  const port = process.env.OPENSEARCH_PORT || 9200;
  const username = process.env.OPENSEARCH_USERNAME || "admin";
  const password = process.env.OPENSEARCH_PASSWORD || "admin";

  client = new Client({
    node: `${protocol}://${host}:${port}`,
    auth: {
      username,
      password,
    },
    ssl: {
      rejectUnauthorized: false,
    },
  });

  // Test connection
  try {
    const response = await client.info();
    console.log("OpenSearch cluster info:", response.body);

    // Create index if it doesn't exist
    await createIndexIfNotExists();

    return client;
  } catch (error) {
    console.error("Failed to connect to OpenSearch:", error);
    throw error;
  }
};

const createIndexIfNotExists = async () => {
  // Create documents index
  const documentsIndex = "documents";
  const documentsIndexExists = await client.indices.exists({ index: documentsIndex });

  if (!documentsIndexExists.body) {
    const documentsIndexConfig = {
      index: documentsIndex,
      body: {
        settings: {
          analysis: {
            analyzer: {
              text_analyzer: {
                type: "custom",
                tokenizer: "standard",
                filter: ["lowercase", "stop", "snowball"],
                char_filter: ["html_strip"],
              },
            },
          },
        },
        mappings: {
          properties: {
            doc_id: { type: "keyword" },
            page_number: { type: "integer" },
            content: { type: "text", analyzer: "text_analyzer" },
            tags: { type: "keyword" },
            filename: { type: "keyword" },
            fileType: { type: "keyword" },
            fileSize: { type: "long" },
            uploadDate: { type: "date" },
            is_parent: { type: "boolean" },
            metadata: { type: "object", enabled: true },
          },
        },
      },
    };

    await client.indices.create(documentsIndexConfig);
    console.log(`✅ Created index: ${documentsIndex}`);
  }

  // Create search_logs index
  const searchLogsIndex = "search_logs";
  const searchLogsIndexExists = await client.indices.exists({ index: searchLogsIndex });

  if (!searchLogsIndexExists.body) {
    const searchLogsIndexConfig = {
      index: searchLogsIndex,
      body: {
        mappings: {
          properties: {
            query: { type: "text" },
            timestamp: { type: "date" },
            duration: { type: "long" },
          },
        },
      },
    };

    await client.indices.create(searchLogsIndexConfig);
    console.log(`✅ Created index: ${searchLogsIndex}`);
  }
};

const indexDocument = async (documentData) => {
  try {
    const response = await client.index({
      index: "documents",
      body: {
        title: documentData.title,
        content: documentData.content,
        filename: documentData.filename,
        fileType: documentData.fileType,
        fileSize: documentData.fileSize,
        uploadDate: new Date().toISOString(),
        tags: documentData.tags || [],
        metadata: documentData.metadata || {},
      },
    });

    return response.body._id;
  } catch (error) {
    console.error("Error indexing document:", error);
    throw error;
  }
};

const searchDocuments = async (query, options = {}) => {
  const {
    page = 1,
    limit = 20,
    sortBy = '_score',
    sortOrder = 'desc',
    fileType = null,
    dateFrom = null,
    dateTo = null
  } = options;

  const from = (page - 1) * limit;
  const size = limit;

  // Build query
  let searchQuery = {
    multi_match: {
      query: query,
      fields: ['content^2', 'title^3', 'tags'],
      type: 'best_fields',
      fuzziness: 'AUTO'
    }
  };

  // Add filters
  const filters = [];
  
  if (fileType) {
    filters.push({ term: { fileType: fileType.toLowerCase() } });
  }
  
  if (dateFrom || dateTo) {
    const dateFilter = { range: { uploadDate: {} } };
    if (dateFrom) dateFilter.range.uploadDate.gte = dateFrom;
    if (dateTo) dateFilter.range.uploadDate.lte = dateTo;
    filters.push(dateFilter);
  }

  // Combine query with filters
  const finalQuery = filters.length > 0 
    ? { bool: { must: [searchQuery], filter: filters } }
    : searchQuery;

  const searchBody = {
    query: finalQuery,
    highlight: {
      fields: {
        content: {
          fragment_size: 200,
          number_of_fragments: 5,
          pre_tags: ['<mark>'],
          post_tags: ['</mark>'],
          type: 'unified'
        },
        title: {
          fragment_size: 100,
          number_of_fragments: 1,
          pre_tags: ['<mark>'],
          post_tags: ['</mark>']
        }
      }
    },
    _source: ['title', 'filename', 'fileType', 'uploadDate', 'tags', 'fileSize'],
    sort: [{ [sortBy]: { order: sortOrder } }],
    from,
    size
  };

  try {
    const response = await client.search({
      index: 'documents',
      body: searchBody
    });

    // Process results with highlights
    const processedResults = response.body.hits.hits.map(hit => ({
      id: hit._id,
      score: hit._score,
      document: hit._source,
      snippets: hit.highlight?.content || [],
      titleHighlight: hit.highlight?.title?.[0] || hit._source.title,
      totalSnippets: hit.highlight?.content?.length || 0
    }));

    return {
      results: processedResults,
      total: response.body.hits.total.value,
      pagination: {
        page,
        limit,
        total: response.body.hits.total.value,
        pages: Math.ceil(response.body.hits.total.value / limit)
      }
    };
  } catch (error) {
    console.error('Error in enhanced search:', error);
    throw error;
  }
};

const getDocumentById = async (id) => {
  try {
    const response = await client.get({
      index: "documents",
      id: id,
    });

    return response.body._source;
  } catch (error) {
    console.error("Error getting document:", error);
    throw error;
  }
};

const deleteDocument = async (id) => {
  try {
    const response = await client.delete({
      index: "documents",
      id: id,
    });

    return response.body;
  } catch (error) {
    console.error("Error deleting document:", error);
    throw error;
  }
};

const getAllDocuments = async (options = {}) => {
  const {
    from = 0,
    size = 50,
    sortBy = "uploadDate",
    sortOrder = "desc",
  } = options;

  const searchBody = {
    query: {
      match_all: {},
    },
    sort: [{ [sortBy]: { order: sortOrder } }],
    from,
    size,
  };

  try {
    const response = await client.search({
      index: "documents",
      body: searchBody,
    });

    return {
      hits: response.body.hits.hits.map((hit) => ({
        id: hit._id,
        source: hit._source,
      })),
      total: response.body.hits.total.value,
    };
  } catch (error) {
    console.error("Error getting all documents:", error);
    throw error;
  }
};

const getSearchSuggestions = async (query) => {
  const searchBody = {
    query: {
      match_phrase_prefix: {
        title: {
          query: query,
        },
      },
    },
    _source: ["title"],
    size: 5,
  };

  try {
    const response = await client.search({
      index: "documents",
      body: searchBody,
    });
    return response.body.hits.hits.map((hit) => hit._source.title);
  } catch (error) {
    console.error("Error getting search suggestions:", error);
    return [];
  }
};

const getAllDocumentPages = async (docId) => {
  try {
    const searchBody = {
      query: {
        bool: {
          must: [
            { term: { doc_id: docId } },
            { term: { is_parent: false } }
          ]
        }
      },
      size: 1000
    };

    const response = await client.search({
      index: "documents",
      body: searchBody,
    });

    // Sort by page_number in JavaScript since it's not mapped for sorting
    const pages = response.body.hits.hits.map((hit) => ({
      id: hit._id,
      ...hit._source
    })).sort((a, b) => (a.page_number || 0) - (b.page_number || 0));

    return pages;
  } catch (error) {
    console.error("Error getting document pages:", error);
    throw error;
  }
};

module.exports = {
  initializeOpenSearch,
  indexDocument,
  searchDocuments,
  getDocumentById,
  deleteDocument,
  getAllDocuments,
  getSearchSuggestions,
  getAllDocumentPages,
  getClient: () => client,
};
