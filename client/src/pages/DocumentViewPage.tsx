import React, { useState, useEffect, useRef } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
import { useQuery } from "react-query";
import { ArrowLeft, FileText, Calendar, Download, Tag, ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from "lucide-react";
import { getDocument, getDocumentPages, getPDFUrl } from "../services/api";
import * as pdfjsLib from 'pdfjs-dist';

const DocumentViewPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const [currentPage, setCurrentPage] = useState(1);
  const [numPages, setNumPages] = useState(0);
  const [scale, setScale] = useState(1.5);

  const [pdfDocument, setPdfDocument] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const { data: documentData, isLoading: documentLoading } = useQuery(
    ["document", id],
    () => getDocument(id!),
    {
      enabled: !!id,
    }
  );

  const { data: pagesData, isLoading: pagesLoading } = useQuery(
    ["document-pages", id],
    () => getDocumentPages(id!),
    {
      enabled: !!id,
    }
  );

  // Get the file type from document data
  const fileType = documentData?.document?.fileType?.toLowerCase();
  
  // Debug logging
  console.log('Document data:', documentData);
  console.log('File type detected:', fileType);
  console.log('Is HTML?', fileType === 'html' || fileType === 'htm');

  // HTML Viewer Component
  const HTMLViewer = () => {
    const [htmlContent, setHtmlContent] = useState<string>("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string>("");

    // Preprocess HTML content for better rendering
    const preprocessHTML = (content: string): string => {
      // Ensure proper HTML structure
      if (!content.includes('<html')) {
        content = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>HTML Document</title>
    <style>
        body { 
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 20px;
            background: #fff;
        }
        h1, h2, h3, h4, h5, h6 { color: #2d3748; }
        a { color: #3182ce; text-decoration: none; }
        a:hover { text-decoration: underline; }
        code { background: #f7fafc; padding: 2px 4px; border-radius: 3px; }
        pre { background: #f7fafc; padding: 15px; border-radius: 5px; overflow-x: auto; }
        blockquote { border-left: 4px solid #e2e8f0; padding-left: 15px; margin: 15px 0; }
        table { border-collapse: collapse; width: 100%; }
        th, td { border: 1px solid #e2e8f0; padding: 8px; text-align: left; }
        th { background: #f7fafc; }
    </style>
</head>
<body>
${content}
</body>
</html>`;
      }
      return content;
    };

    useEffect(() => {
      if (id) {
        fetch(`/api/documents/${id}/html`)
          .then(response => {
            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.text();
          })
          .then(content => {
            const processedContent = preprocessHTML(content);
            setHtmlContent(processedContent);
            setLoading(false);
          })
          .catch(error => {
            console.error("Error loading HTML:", error);
            setError("Failed to load HTML content");
            setLoading(false);
          });
      }
    }, [id]);

    if (loading) {
      return (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Loading HTML Document...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-center py-12">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="text-red-600 text-lg font-medium mb-2">Error Loading Document</div>
            <p className="text-red-500">{error}</p>
          </div>
        </div>
      );
    }

    return (
      <div className="html-viewer-container">
        {/* HTML Preview Frame */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
          {/* Header with document info */}
          <div className="bg-gray-50 border-b border-gray-200 px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              </div>
              <div className="text-sm text-gray-500 font-mono">
                HTML Document Viewer
              </div>
            </div>
          </div>
          
          {/* HTML Content Frame */}
          <div 
            className="html-content-frame p-6"
            style={{ 
              minHeight: '600px', 
              maxHeight: '800px', 
              overflow: 'auto',
              backgroundColor: '#ffffff',
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
            }}
          >
            {/* Create a sandboxed iframe for better HTML rendering */}
            <iframe
              srcDoc={htmlContent}
              className="w-full h-full border-0"
              style={{ 
                minHeight: '500px',
                backgroundColor: '#ffffff'
              }}
              title="HTML Document Viewer"
              sandbox="allow-same-origin allow-scripts"
            />
          </div>
        </div>
        
        {/* Fallback for iframe issues */}
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <details className="text-sm">
            <summary className="cursor-pointer text-gray-600 hover:text-gray-800 font-medium">
              View Raw HTML Content
            </summary>
            <div className="mt-2">
              <pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto text-xs">
                <code>{htmlContent}</code>
              </pre>
            </div>
          </details>
        </div>
      </div>
    );
  };

  // Check if this is a single document (not split into pages)
  const isSingleDocument = !pagesData?.pages || pagesData.pages.length === 0;
  const currentPageData = isSingleDocument ? documentData?.document : pagesData?.page;

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

  // Set up PDF.js worker
  useEffect(() => {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
  }, []);

  const loadPDF = async () => {
    if (!id) return;
    
    setLoading(true);
    try {
      const loadingTask = pdfjsLib.getDocument(getPDFUrl(id));
      const pdf = await loadingTask.promise;
      setPdfDocument(pdf);
      setNumPages(pdf.numPages);
      setCurrentPage(1);
      renderPage(pdf, 1);
    } catch (error) {
      console.error('Error loading PDF:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderPage = async (pdf: any, pageNum: number) => {
    if (!canvasRef.current) return;
    
    try {
      const page = await pdf.getPage(pageNum);
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      
      const viewport = page.getViewport({ scale });
      canvas.height = viewport.height;
      canvas.width = viewport.width;
      
      const renderContext = {
        canvasContext: context,
        viewport: viewport
      };
      
      await page.render(renderContext).promise;
      
    } catch (error) {
      console.error('Error rendering page:', error);
    }
  };

  const goToPage = (pageNum: number) => {
    if (pageNum >= 1 && pageNum <= numPages && pdfDocument) {
      setCurrentPage(pageNum);
      renderPage(pdfDocument, pageNum);
    }
  };

  const changeScale = (newScale: number) => {
    const clampedScale = Math.max(0.8, Math.min(3.0, newScale));
    setScale(clampedScale);
    if (pdfDocument) {
      renderPage(pdfDocument, currentPage);
    }
  };

  // Load PDF when component mounts
  useEffect(() => {
    if (id) {
      loadPDF();
    }
  }, [id]);

  // Re-render page when search term changes
  useEffect(() => {
    if (pdfDocument && currentPage) {
      renderPage(pdfDocument, currentPage);
    }
  }, [pdfDocument, currentPage]);





  if (documentLoading || pagesLoading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-2 text-gray-500">Loading document...</p>
        </div>
      </div>
    );
  }

  if (!documentData?.document) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <p className="text-red-500">Document not found or error loading document</p>
          <Link to="/search" className="btn btn-primary mt-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Search
          </Link>
        </div>
      </div>
    );
  }

  const document = documentData.document;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link to="/search" className="btn btn-secondary mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Search
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">
            {document.title || document.filename}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Document Viewer
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <a 
            href={getPDFUrl(id!)}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-secondary"
          >
            <Download className="h-4 w-4 mr-2" />
            Download PDF
          </a>
        </div>
      </div>

      {/* Document Info */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-medium text-gray-900">Document Information</h3>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center space-x-3">
              <FileText className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-900">Filename</p>
                <p className="text-sm text-gray-500">{document.filename}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Calendar className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-900">Upload Date</p>
                <p className="text-sm text-gray-500">{formatDate(document.uploadDate)}</p>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">File Type</p>
              <p className="text-sm text-gray-500">{document.fileType?.toUpperCase()}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">File Size</p>
              <p className="text-sm text-gray-500">{formatFileSize(document.fileSize)}</p>
            </div>
          </div>

          {/* Tags */}
          {document.tags && document.tags.length > 0 && (
            <div className="mt-4">
              <p className="text-sm font-medium text-gray-900 mb-2">Tags</p>
              <div className="flex flex-wrap gap-2">
                {document.tags.map((tag: string, idx: number) => (
                  <span key={idx} className="badge badge-primary">
                    <Tag className="h-3 w-3 mr-1" />
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Document Viewer */}
      <div className="card">
        <div className="card-header">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">
              {fileType === 'html' || fileType === 'htm' ? 'HTML Viewer' : 'PDF Viewer'}
            </h3>
          </div>
        </div>
        <div className="card-body">
          {fileType === 'html' || fileType === 'htm' ? (
            <HTMLViewer />
          ) : (
            <>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => changeScale(scale - 0.2)}
                    disabled={scale <= 0.8}
                    className="btn btn-sm btn-secondary disabled:opacity-50"
                  >
                    <ZoomOut className="h-4 w-4" />
                  </button>
                  <span className="text-sm text-gray-600 min-w-[60px] text-center">
                    {Math.round(scale * 100)}%
                  </span>
                  <button
                    onClick={() => changeScale(scale + 0.2)}
                    disabled={scale >= 3.0}
                    className="btn btn-sm btn-secondary disabled:opacity-50"
                  >
                    <ZoomIn className="h-4 w-4" />
                  </button>
                </div>
                
                {numPages > 0 && (
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => goToPage(currentPage - 1)}
                      disabled={currentPage <= 1}
                      className="btn btn-sm btn-secondary disabled:opacity-50"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <span className="text-sm text-gray-600 min-w-[80px] text-center">
                      {currentPage} of {numPages}
                    </span>
                    <button
                      onClick={() => goToPage(currentPage + 1)}
                      disabled={currentPage >= numPages}
                      className="btn btn-sm btn-secondary disabled:opacity-50"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
              
              <div id="pdf-container" className="flex justify-center">
                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                    <p className="mt-2 text-gray-500">Loading PDF...</p>
                  </div>
                ) : (
                  <canvas
                    ref={canvasRef}
                    className="border border-gray-300 rounded-lg shadow-lg"
                    style={{ maxWidth: '100%', height: 'auto' }}
                  />
                )}
              </div>
            </>
          )}
        </div>
      </div>


    </div>
  );
};

export default DocumentViewPage; 