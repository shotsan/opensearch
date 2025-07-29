import axios from "axios";

const API_BASE_URL =
  process.env.REACT_APP_API_URL || "http://localhost:4001/api";

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
  const formData = new FormData();
  formData.append("document", file);
  if (metadata) {
    Object.keys(metadata).forEach((key) => {
      formData.append(key, metadata[key]);
    });
  }

  const response = await api.post("/documents/upload", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
};

export const getDocuments = async (params?: {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: string;
}) => {
  const response = await api.get("/documents", { params });
  return response.data;
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
  return response.data;
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
