import React, { useState, useEffect } from "react";
import { useQuery } from "react-query";
import { useSearchParams, Link } from "react-router-dom";
import {
  Search,
  Filter,
  FileText,
  Calendar,
  Download,
  Eye,
  Tag,
  Clock,
} from "lucide-react";
import { searchDocuments, getSearchSuggestions } from "../services/api";
import SearchSnippetResult from "../components/SearchSnippetResult";

const SearchPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [filters, setFilters] = useState({
    fileType: searchParams.get("fileType") || "",
    dateFrom: searchParams.get("dateFrom") || "",
    dateTo: searchParams.get("dateTo") || "",
  });
  const [showFilters, setShowFilters] = useState(false);

  const {
    data: searchResults,
    isLoading,
    error,
  } = useQuery(
    ["search", query, filters, searchParams.get("page")],
    () =>
      searchDocuments({
        q: query,
        page: parseInt(searchParams.get("page") || "1"),
        limit: 10,
        ...filters,
      }),
    {
      enabled: !!query.trim(),
      keepPreviousData: true,
    },
  );

  const { data: suggestions } = useQuery(
    ["suggestions", query],
    () => getSearchSuggestions(query),
    {
      enabled: query.length > 2,
    },
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      const newSearchParams = new URLSearchParams();
      newSearchParams.set("q", query.trim());
      if (filters.fileType) newSearchParams.set("fileType", filters.fileType);
      if (filters.dateFrom) newSearchParams.set("dateFrom", filters.dateFrom);
      if (filters.dateTo) newSearchParams.set("dateTo", filters.dateTo);
      newSearchParams.set("page", "1");
      setSearchParams(newSearchParams);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const applyFilters = () => {
    const newSearchParams = new URLSearchParams(searchParams);
    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        newSearchParams.set(key, value);
      } else {
        newSearchParams.delete(key);
      }
    });
    newSearchParams.set("page", "1");
    setSearchParams(newSearchParams);
  };

  const clearFilters = () => {
    setFilters({ fileType: "", dateFrom: "", dateTo: "" });
    const newSearchParams = new URLSearchParams();
    newSearchParams.set("q", query);
    setSearchParams(newSearchParams);
  };

  const goToPage = (page: number) => {
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.set("page", page.toString());
    setSearchParams(newSearchParams);
  };

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Search Documents</h1>
        <p className="mt-1 text-sm text-gray-500">
          Find documents using advanced search and filters
        </p>
      </div>

      {/* Search Form */}
      <div className="card">
        <div className="card-body">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-1">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="input pl-10"
                    placeholder="Search for documents..."
                  />
                </div>
                {/* Suggestions */}
                {suggestions?.suggestions?.length > 0 && (
                  <div className="mt-2 bg-white border border-gray-200 rounded-md shadow-lg">
                    {suggestions.suggestions.map(
                      (suggestion: string, index: number) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => setQuery(suggestion)}
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          {suggestion}
                        </button>
                      ),
                    )}
                  </div>
                )}
              </div>
              <button type="submit" className="btn btn-primary">
                Search
              </button>
              <button
                type="button"
                onClick={() => setShowFilters(!showFilters)}
                className="btn btn-secondary"
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </button>
            </div>

            {/* Filters */}
            {showFilters && (
              <div className="border-t pt-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      File Type
                    </label>
                    <select
                      value={filters.fileType}
                      onChange={(e) =>
                        handleFilterChange("fileType", e.target.value)
                      }
                      className="input"
                    >
                      <option value="">All Types</option>
                      <option value="pdf">PDF</option>
                      <option value="docx">DOCX</option>
                      <option value="txt">TXT</option>
                      <option value="html">HTML</option>
                      <option value="rtf">RTF</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Date From
                    </label>
                    <input
                      type="date"
                      value={filters.dateFrom}
                      onChange={(e) =>
                        handleFilterChange("dateFrom", e.target.value)
                      }
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Date To
                    </label>
                    <input
                      type="date"
                      value={filters.dateTo}
                      onChange={(e) =>
                        handleFilterChange("dateTo", e.target.value)
                      }
                      className="input"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={applyFilters}
                    className="btn btn-primary"
                  >
                    Apply Filters
                  </button>
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="btn btn-secondary"
                  >
                    Clear Filters
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>
      </div>

      {/* Search Results */}
      {query && (
        <div className="space-y-4">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
              <p className="mt-2 text-gray-500">Searching...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-red-500">Error loading search results</p>
            </div>
          ) : searchResults?.results?.length > 0 ? (
            <>
              {/* Results Summary */}
              <div className="flex justify-between items-center">
                <p className="text-sm text-gray-500">
                  Found {searchResults.total} results in{" "}
                  {searchResults.searchTime}ms
                </p>
                <div className="flex gap-2">
                  <select className="input text-sm">
                    <option>Sort by Relevance</option>
                    <option>Sort by Date</option>
                    <option>Sort by Title</option>
                  </select>
                </div>
              </div>

              {/* Results List */}
              <div className="space-y-4">
                {searchResults.results.map((doc: any) => (
                  <SearchSnippetResult 
                    key={doc.id} 
                    result={doc} 
                    searchTerm={query}
                  />
                ))}
              </div>

              {/* Pagination */}
              {searchResults.pagination.pages > 1 && (
                <div className="flex justify-center">
                  <nav className="flex items-center gap-1">
                    <button
                      onClick={() =>
                        goToPage(searchResults.pagination.page - 1)
                      }
                      disabled={searchResults.pagination.page <= 1}
                      className="btn btn-secondary disabled:opacity-50"
                    >
                      Previous
                    </button>

                    {Array.from(
                      { length: Math.min(5, searchResults.pagination.pages) },
                      (_, i) => {
                        const page = i + 1;
                        return (
                          <button
                            key={page}
                            onClick={() => goToPage(page)}
                            className={`px-3 py-2 text-sm font-medium rounded-md ${
                              page === searchResults.pagination.page
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
                      onClick={() =>
                        goToPage(searchResults.pagination.page + 1)
                      }
                      disabled={
                        searchResults.pagination.page >=
                        searchResults.pagination.pages
                      }
                      className="btn btn-secondary disabled:opacity-50"
                    >
                      Next
                    </button>
                  </nav>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">No results found</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchPage;
