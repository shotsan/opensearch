import axios from "axios";

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:4001/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add any auth tokens here if needed
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("API Error:", error);
    return Promise.reject(error);
  },
);

// Document API
export const uploadDocument = async (file: File, metadata?: any) => {
  console.log("🚀 Starting upload process...");
  console.log("📄 File details:", {
    name: file.name,
    size: file.size,
    type: file.type,
    lastModified: new Date(file.lastModified).toISOString()
  });
  
  const formData = new FormData();
  formData.append("file", file); // Fixed: was "document", now "file"
  
  if (metadata) {
    Object.keys(metadata).forEach((key) => {
      formData.append(key, metadata[key]);
    });
  }

  console.log("📤 Uploading to:", `${API_BASE_URL}/documents/upload`);
  console.log("📊 FormData contents:");
  Array.from(formData.entries()).forEach(([key, value]) => {
    if (value instanceof File) {
      console.log(`  ${key}: File(${value.name}, ${value.size} bytes, ${value.type})`);
    } else {
      console.log(`  ${key}: ${value}`);
    }
  });

  try {
    const startTime = Date.now();
    console.log("⏱️ Upload started at:", new Date().toISOString());
    
    const response = await api.post("/documents/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      timeout: 300000, // 5 minutes timeout for large files
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total) {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          console.log(`📈 Upload progress: ${percentCompleted}% (${progressEvent.loaded}/${progressEvent.total} bytes)`);
        }
      },
    });
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.log("✅ Upload successful!");
    console.log("⏱️ Upload duration:", duration + "ms");
    console.log("📊 Response:", response.data);
    
    return response.data;
  } catch (error: any) {
    console.error("❌ Upload failed!");
    console.error("🚨 Error details:", {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      headers: error.response?.headers,
      config: {
        url: error.config?.url,
        method: error.config?.method,
        timeout: error.config?.timeout,
        headers: error.config?.headers
      }
    });
    
    if (error.code === 'ECONNABORTED') {
      console.error("⏰ Upload timed out - file may be too large or network too slow");
    }
    
    throw error;
  }
};

export const getDocuments = async (params?: {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: string;
}) => {
  const response = await api.get("/documents", { params });
  const data = response.data;
  
  // Add pagination info to match frontend expectations
  return {
    ...data,
    pagination: {
      page: data.page || 1,
      limit: data.limit || 20,
      total: data.total || 0,
      pages: Math.ceil((data.total || 0) / (data.limit || 20))
    }
  };
};

export const getDocument = async (id: string) => {
  const response = await api.get(`/documents/${id}`);
  return response.data;
};

export const getDocumentPages = async (id: string, page?: number) => {
  const params = page ? { page } : {};
  const response = await api.get(`/documents/${id}/pages`, { params });
  return response.data;
};

export const getPDFUrl = (id: string) => {
  return `${API_BASE_URL}/documents/${id}/pdf`;
};

export const deleteDocument = async (id: string) => {
  const response = await api.delete(`/documents/${id}`);
  return response.data;
};

export const getSupportedFileTypes = async () => {
  const response = await api.get("/documents/types/supported");
  return response.data;
};

// Search API
export const searchDocuments = async (params: {
  q: string;
  page?: number;
  limit?: number;
  fileType?: string;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: string;
  sortOrder?: string;
}) => {
  const response = await api.get("/search", { params });
  const data = response.data;
  
  // Transform backend response to frontend expected format
  const transformedResults = (data.hits || []).map((hit: any) => ({
    id: hit.id,
    title: hit.title || hit.filename,
    titleHighlight: hit.highlights?.title?.[0] || hit.title || hit.filename,
    filename: hit.filename,
    fileType: hit.fileType,
    fileSize: hit.fileSize,
    uploadDate: hit.uploadDate,
    tags: hit.tags || [],
    score: hit._score || 0,
    snippets: hit.highlights?.content || [],
    totalSnippets: hit.highlights?.content?.length || 0
  }));
  
  return {
    query: data.query,
    total: data.total,
    results: transformedResults,
    searchTime: data.searchTime || 0,
    pagination: {
      page: params.page || 1,
      limit: params.limit || 10,
      pages: Math.ceil((data.total || 0) / (params.limit || 10))
    }
  };
};

export const getSearchSuggestions = async (query: string) => {
  const response = await api.get("/search/suggestions", {
    params: { q: query },
  });
  return response.data;
};

export const getSearchAnalytics = async (period?: string) => {
  const response = await api.get("/search/analytics", {
    params: { period },
  });
  return response.data;
};

export const advancedSearch = async (criteria: {
  query?: string;
  title?: string;
  content?: string;
  tags?: string[];
  fileType?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}) => {
  const response = await api.post("/search/advanced", criteria);
  return response.data;
};

// Health check
export const checkHealth = async () => {
  const response = await api.get("/health");
  return response.data;
};

export default api;
