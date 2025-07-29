import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "react-query";
import { useNavigate } from "react-router-dom";
import {
  FileText,
  Search,
  Filter,
  Trash2,
  Download,
  Eye,
  MoreVertical,
  Calendar,
  File,
} from "lucide-react";
import { getDocuments, deleteDocument } from "../services/api";

const DocumentsPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [fileTypeFilter, setFileTypeFilter] = useState("");
  const [sortBy, setSortBy] = useState("uploadDate");
  const [sortOrder, setSortOrder] = useState("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const {
    data: documentsData,
    isLoading,
    error,
  } = useQuery(
    ["documents", currentPage, searchTerm, fileTypeFilter, sortBy, sortOrder],
    () =>
      getDocuments({
        page: currentPage,
        limit: 20,
        sortBy,
        sortOrder,
      }),
    {
      keepPreviousData: true,
    },
  );

  const deleteMutation = useMutation(deleteDocument, {
    onSuccess: () => {
      queryClient.invalidateQueries("documents");
      console.log("Document deleted successfully");
    },
    onError: (error) => {
      console.error("Error deleting document:", error);
      alert("Failed to delete document. Please try again.");
    },
  });

  const handleDelete = (id: string) => {
    console.log("Attempting to delete document with ID:", id);
    if (window.confirm("Are you sure you want to delete this document?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleViewDocument = (id: string) => {
    navigate(`/documents/${id}`);
  };

  const handleDownloadDocument = (id: string) => {
    // Implement download logic here
    console.log("Downloading document with ID:", id);
    alert("Download functionality not yet implemented.");
  };

  const filteredDocuments =
    documentsData?.documents?.filter((doc: any) => {
      const title = doc.source?.title || doc.source?.filename || "";
      const filename = doc.source?.filename || "";
      const matchesSearch =
        title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        filename.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType =
        !fileTypeFilter || doc.source?.fileType === fileTypeFilter;
      return matchesSearch && matchesType;
    }) || [];

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getFileIcon = (fileType: string) => {
    switch (fileType.toLowerCase()) {
      case "pdf":
        return "📄";
      case "docx":
      case "doc":
        return "📝";
      case "txt":
        return "📄";
      case "html":
      case "htm":
        return "🌐";
      case "rtf":
        return "📄";
      default:
        return "📄";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Documents</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage and view all uploaded documents
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-500">
            {documentsData?.pagination?.total || 0} documents
          </span>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="card">
        <div className="card-body">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Search Documents
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input pl-10"
                  placeholder="Search by title or filename..."
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                File Type
              </label>
              <select
                value={fileTypeFilter}
                onChange={(e) => setFileTypeFilter(e.target.value)}
                className="input"
              >
                <option value="">All Types</option>
                <option value="pdf">PDF</option>
                <option value="docx">DOCX</option>
                <option value="doc">DOC</option>
                <option value="txt">TXT</option>
                <option value="html">HTML</option>
                <option value="rtf">RTF</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sort By
              </label>
              <select
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [field, order] = e.target.value.split("-");
                  setSortBy(field);
                  setSortOrder(order);
                }}
                className="input"
              >
                <option value="uploadDate-desc">Date (Newest)</option>
                <option value="uploadDate-asc">Date (Oldest)</option>
                <option value="title-asc">Title (A-Z)</option>
                <option value="title-desc">Title (Z-A)</option>
                <option value="fileSize-desc">Size (Largest)</option>
                <option value="fileSize-asc">Size (Smallest)</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Documents List */}
      {isLoading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-2 text-gray-500">Loading documents...</p>
        </div>
      ) : error ? (
        <div className="text-center py-8">
          <p className="text-red-500">Error loading documents</p>
        </div>
      ) : filteredDocuments.length > 0 ? (
        <div className="space-y-4">
          {filteredDocuments.map((doc: any) => (
            <div key={doc.id} className="card">
              <div className="card-body">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="text-2xl">
                      {getFileIcon(doc.source?.fileType || "unknown")}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-medium text-gray-900">
                        {doc.source?.title || doc.source?.filename || "Untitled Document"}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {doc.source?.filename || "Unknown filename"}
                      </p>
                      <div className="flex items-center space-x-4 mt-2">
                        <span className="flex items-center text-xs text-gray-500">
                          <Calendar className="h-3 w-3 mr-1" />
                          {formatDate(doc.source?.uploadDate || new Date().toISOString())}
                        </span>
                        <span className="text-xs text-gray-500">
                          {formatFileSize(doc.source?.fileSize || 0)}
                        </span>
                        <span className="badge badge-secondary">
                          {(doc.source?.fileType || "unknown").toUpperCase()}
                        </span>
                      </div>
                      {doc.source?.tags?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {doc.source.tags
                            .slice(0, 3)
                            .map((tag: string, index: number) => (
                              <span
                                key={index}
                                className="badge badge-primary text-xs"
                              >
                                {tag}
                              </span>
                            ))}
                          {doc.source.tags.length > 3 && (
                            <span className="text-xs text-gray-500">
                              +{doc.source.tags.length - 3} more
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleViewDocument(doc.id)}
                      className="btn btn-secondary text-xs"
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </button>
                    <button
                      onClick={() => handleDownloadDocument(doc.id)}
                      className="btn btn-secondary text-xs"
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Download
                    </button>
                    <button
                      onClick={() => handleDelete(doc.id)}
                      className="btn btn-danger text-xs"
                      disabled={deleteMutation.isLoading}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No documents found
          </h3>
          <p className="text-gray-500">
            {searchTerm || fileTypeFilter
              ? "Try adjusting your search criteria"
              : "Upload your first document to get started"}
          </p>
        </div>
      )}

      {/* Pagination */}
      {documentsData?.pagination?.pages > 1 && (
        <div className="flex justify-center">
          <nav className="flex items-center space-x-1">
            <button
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage <= 1}
              className="btn btn-secondary disabled:opacity-50"
            >
              Previous
            </button>

            {Array.from(
              { length: Math.min(5, documentsData.pagination.pages) },
              (_, i) => {
                const page = i + 1;
                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-2 text-sm font-medium rounded-md ${
                      page === currentPage
                        ? "bg-primary-600 text-white"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    {page}
                  </button>
                );
              },
            )}

            <button
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage >= documentsData.pagination.pages}
              className="btn btn-secondary disabled:opacity-50"
            >
              Next
            </button>
          </nav>
        </div>
      )}
    </div>
  );
};

export default DocumentsPage;
