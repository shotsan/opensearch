const {
  searchDocuments,
  getSearchSuggestions,
  getClient,
} = require("../services/opensearchService");

const logSearch = async (query, duration) => {
  try {
    const client = getClient();
    await client.index({
      index: 'search_logs',
      body: {
        query,
        timestamp: new Date().toISOString(),
        duration
      }
    });
  } catch (e) {
    console.error('Failed to log search:', e);
  }
};

// Search documents
const search = async (req, res) => {
  try {
    const {
      q = "",
      page = 1,
      limit = 10,
      fileType,
      dateFrom,
      dateTo,
      sortBy = "_score",
      sortOrder = "desc",
    } = req.query;

    if (!q.trim()) {
      return res.status(400).json({ error: "Search query is required" });
    }

    const start = Date.now();
    const result = await searchDocuments(q, {
      page: parseInt(page),
      limit: parseInt(limit),
      fileType,
      dateFrom,
      dateTo,
      sortBy,
      sortOrder,
    });
    const duration = Date.now() - start;
    await logSearch(q, duration);

    // Format search results with snippets
    const formattedResults = result.results.map((hit) => ({
      id: hit.id,
      title: hit.document.title,
      titleHighlight: hit.titleHighlight,
      filename: hit.document.filename,
      fileType: hit.document.fileType,
      fileSize: hit.document.fileSize,
      uploadDate: hit.document.uploadDate,
      tags: hit.document.tags,
      score: hit.score,
      snippets: hit.snippets,
      totalSnippets: hit.totalSnippets,
    }));

    res.json({
      query: q,
      results: formattedResults,
      pagination: result.pagination,
      searchTime: duration,
      filters: {
        fileType,
        dateFrom,
        dateTo,
      },
    });
  } catch (error) {
    console.error("Error searching documents:", error);
    res.status(500).json({
      error: "Failed to search documents",
      message: error.message,
    });
  }
};

// Get search suggestions
const getSuggestions = async (req, res) => {
  try {
    const { q = "" } = req.query;

    if (!q.trim()) {
      return res.json({ suggestions: [] });
    }

    const suggestions = await getSearchSuggestions(q);

    res.json({ suggestions });
  } catch (error) {
    console.error("Error getting search suggestions:", error);
    res.status(500).json({
      error: "Failed to get search suggestions",
      message: error.message,
    });
  }
};

// Get search analytics
const getAnalytics = async (req, res) => {
  try {
    const client = getClient();
    
    // 1. Total Documents
    let totalDocuments = 0;
    try {
      const docCountResp = await client.count({ index: "documents" });
      totalDocuments = docCountResp.body?.count || docCountResp.count || 0;
    } catch (e) {
      console.error("Analytics: Error getting document count:", e);
    }

    // 2. Total Searches
    let totalSearches = 0;
    try {
      const searchCountResp = await client.count({
        index: "search_logs",
      });
      totalSearches = searchCountResp.body?.count || searchCountResp.count || 0;
    } catch (e) {
      console.error("Analytics: Error getting search count:", e);
    }

    // 3. Popular Queries
    let popularQueries = [];
    try {
      const popQueryResp = await client.search({
        index: "search_logs",
        body: {
          size: 0,
          aggs: {
            popular_queries: {
              terms: { field: "query.keyword", size: 5 },
            },
          },
        },
      });
      popularQueries = (
        popQueryResp.body?.aggregations?.popular_queries?.buckets || []
      ).map((b) => ({
        query: b.key,
        count: b.doc_count,
      }));
    } catch (e) {}

    // 4. File Type Distribution
    let fileTypeDistribution = [];
    try {
      const fileTypeResp = await client.search({
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
    } catch (e) {}

    // 5. Recent Activity
    let recentActivity = {
      documentsUploaded: 0,
      searchesPerformed: 0,
      averageSearchTime: 0,
    };
    try {
      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      // Documents uploaded in last 7 days
      try {
        const docsUploadedResp = await client.count({
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
      } catch (e) {}

      // Searches performed in last 7 days
      try {
        const searchesPerformedResp = await client.count({
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
        recentActivity.searchesPerformed = searchesPerformedResp.body?.count || searchesPerformedResp.count || 0;
      } catch (e) {}

      // Average search time
      try {
        const avgSearchTimeResp = await client.search({
          index: "search_logs",
          body: {
            size: 0,
            aggs: {
              avg_duration: { avg: { field: "duration" } },
            },
          },
        });
        
        // Get average search time from aggregation
        const avgDuration = avgSearchTimeResp.body?.aggregations?.avg_duration?.value;
        
        // If no search logs exist, set to null to indicate no data
        if (avgDuration === null || avgDuration === undefined) {
          recentActivity.averageSearchTime = null;
        } else {
          recentActivity.averageSearchTime = Math.round(avgDuration);
        }
      } catch (e) {
        console.error("Analytics: Error calculating average search time:", e);
      }
    } catch (e) {}

    res.json({
      analytics: {
        totalDocuments,
        totalSearches,
        popularQueries,
        fileTypeDistribution,
        recentActivity,
      },
    });
  } catch (error) {
    console.error("Error getting search analytics:", error);
    res.status(500).json({
      error: "Failed to get search analytics",
      message: error.message,
    });
  }
};

// Advanced search with multiple criteria
const advancedSearch = async (req, res) => {
  try {
    const {
      query = "",
      title,
      content,
      tags,
      fileType,
      dateFrom,
      dateTo,
      page = 1,
      limit = 10,
    } = req.body;

    if (!query.trim() && !title && !content && !tags) {
      return res
        .status(400)
        .json({ error: "At least one search criteria is required" });
    }

    const from = (parseInt(page) - 1) * parseInt(limit);
    const size = parseInt(limit);

    // Build advanced search query
    const searchQuery = {
      bool: {
        must: [],
        filter: [],
      },
    };

    // Add text search
    if (query.trim()) {
      searchQuery.bool.must.push({
        multi_match: {
          query: query,
          fields: ["title^2", "content", "tags"],
          type: "best_fields",
          fuzziness: "AUTO",
        },
      });
    }

    // Add specific field searches
    if (title) {
      searchQuery.bool.must.push({
        match: { title: title },
      });
    }

    if (content) {
      searchQuery.bool.must.push({
        match: { content: content },
      });
    }

    if (tags && tags.length > 0) {
      searchQuery.bool.must.push({
        terms: { tags: tags },
      });
    }

    // Add filters
    if (fileType) {
      searchQuery.bool.filter.push({
        term: { fileType: fileType },
      });
    }

    if (dateFrom || dateTo) {
      searchQuery.bool.filter.push({
        range: {
          uploadDate: {
            gte: dateFrom || "1970-01-01",
            lte: dateTo || new Date().toISOString().split("T")[0],
          },
        },
      });
    }

    // Execute search with custom query
    const result = await searchDocuments(searchQuery, {
      from,
      size,
      sortBy: "_score",
      sortOrder: "desc",
    });

    const formattedResults = result.hits.map((hit) => ({
      id: hit.id,
      title: hit.source.title,
      filename: hit.source.filename,
      fileType: hit.source.fileType,
      fileSize: hit.source.fileSize,
      uploadDate: hit.source.uploadDate,
      tags: hit.source.tags,
      score: hit.score,
      highlights: hit.highlights,
      contentPreview: hit.source.content.substring(0, 200) + "...",
    }));

    res.json({
      results: formattedResults,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: result.total,
        pages: Math.ceil(result.total / parseInt(limit)),
      },
      searchTime: result.took,
      criteria: {
        query,
        title,
        content,
        tags,
        fileType,
        dateFrom,
        dateTo,
      },
    });
  } catch (error) {
    console.error("Error performing advanced search:", error);
    res.status(500).json({
      error: "Failed to perform advanced search",
      message: error.message,
    });
  }
};

module.exports = {
  search,
  getSuggestions,
  getAnalytics,
  advancedSearch,
};
