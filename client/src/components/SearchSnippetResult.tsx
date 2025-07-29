import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, Download, Calendar, FileText } from 'lucide-react';

interface SearchResult {
  id: string;
  title: string;
  titleHighlight: string;
  filename: string;
  fileType: string;
  fileSize: number;
  uploadDate: string;
  tags: string[];
  score: number;
  snippets: string[];
  totalSnippets: number;
}

interface SearchSnippetResultProps {
  result: SearchResult;
  searchTerm?: string;
}

const SearchSnippetResult: React.FC<SearchSnippetResultProps> = ({ 
  result, 
  searchTerm 
}) => {
  const navigate = useNavigate();

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
    switch (fileType?.toLowerCase()) {
      case "pdf":
        return "📄";
      case "html":
      case "htm":
        return "🌐";
      default:
        return "📄";
    }
  };

  const handleViewDocument = () => {
    // Navigate to document view with search context
    const params = new URLSearchParams();
    if (searchTerm) {
      params.set('search', searchTerm);
    }
    navigate(`/documents/${result.id}?${params.toString()}`);
  };

  const handleDownload = () => {
    // Implement download functionality
    console.log('Downloading document:', result.id);
    alert('Download functionality not yet implemented.');
  };

  return (
    <div className="search-result border border-gray-200 rounded-lg p-4 mb-4 bg-white hover:shadow-md transition-shadow">
      {/* Result Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className="text-2xl">
            {getFileIcon(result.fileType)}
          </div>
          <div className="flex-1">
            <h3 
              className="text-lg font-semibold text-gray-900 mb-1"
              dangerouslySetInnerHTML={{ __html: result.titleHighlight }}
            />
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <span className="flex items-center">
                <FileText className="h-3 w-3 mr-1" />
                {result.filename}
              </span>
              <span>{result.fileType?.toUpperCase()}</span>
              <span className="flex items-center">
                <Calendar className="h-3 w-3 mr-1" />
                {formatDate(result.uploadDate)}
              </span>
              <span>{formatFileSize(result.fileSize || 0)}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded">
            Score: {result.score.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Search Snippets */}
      {result.snippets && result.snippets.length > 0 && (
        <div className="mb-4">
          <div className="text-sm font-medium text-gray-700 mb-2">
            Found {result.totalSnippets} matching snippet{result.totalSnippets !== 1 ? 's' : ''}:
          </div>
          {result.snippets.map((snippet, index) => (
            <div 
              key={index}
              className="bg-gray-50 border-l-4 border-blue-500 pl-3 py-2 mb-2 rounded-r text-sm leading-relaxed"
              dangerouslySetInnerHTML={{ __html: snippet }}
            />
          ))}
        </div>
      )}

      {/* Tags */}
      {result.tags && result.tags.length > 0 && (
        <div className="mb-4">
          <div className="flex flex-wrap gap-1">
            {result.tags.slice(0, 5).map((tag, index) => (
              <span 
                key={index}
                className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded"
              >
                {tag}
              </span>
            ))}
            {result.tags.length > 5 && (
              <span className="text-xs text-gray-500">
                +{result.tags.length - 5} more
              </span>
            )}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center space-x-2">
        <button
          onClick={handleViewDocument}
          className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors flex items-center"
        >
          <Eye className="h-4 w-4 mr-2" />
          View in Document
        </button>
        <button 
          onClick={handleDownload}
          className="bg-gray-100 text-gray-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-200 transition-colors flex items-center"
        >
          <Download className="h-4 w-4 mr-2" />
          Download
        </button>
      </div>
    </div>
  );
};

export default SearchSnippetResult; 