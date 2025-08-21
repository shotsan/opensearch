import React, { useState, useCallback } from "react";
import { useMutation, useQueryClient, useQuery } from "react-query";
import { useDropzone } from "react-dropzone";
import {
  Upload,
  FileText,
  X,
  CheckCircle,
  AlertCircle,
  File,
  Clock,
  User,
} from "lucide-react";
import { uploadDocument, getSupportedFileTypes } from "../services/api";

const UploadPage: React.FC = () => {
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);
  const [uploadProgress, setUploadProgress] = useState<{
    [key: string]: number;
  }>({});
  const [uploadErrors, setUploadErrors] = useState<{
    [key: string]: string;
  }>({});
  const [uploadDetails, setUploadDetails] = useState<{
    [key: string]: any;
  }>({});
  const queryClient = useQueryClient();

  const { data: supportedTypes }: { data: any } = useQuery(
    "supportedTypes",
    getSupportedFileTypes,
  );

  const uploadMutation = useMutation(uploadDocument, {
    onSuccess: (data, variables) => {
      console.log("🎉 Upload mutation success:", { data, fileName: variables.name });
      
      // Transform the response to match expected structure
      const uploadedFile = {
        documentId: data.document?.id || data.doc_id,
        document: {
          title: data.document?.title || data.filename,
          filename: data.document?.originalName || data.filename,
          fileType: data.document?.fileType || data.fileType,
          fileSize: data.document?.fileSize || data.fileSize,
          uploadDate: data.document?.uploadDate || new Date().toISOString(),
        },
        file: variables,
      };
      
      setUploadedFiles((prev) => [...prev, uploadedFile]);
      setUploadProgress((prev) => ({ ...prev, [variables.name]: 100 }));
      setUploadErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[variables.name];
        return newErrors;
      });
      setUploadDetails((prev) => ({
        ...prev,
        [variables.name]: {
          status: 'success',
          response: data,
          completedAt: new Date().toISOString()
        }
      }));
      
      queryClient.invalidateQueries("documents");
    },
    onError: (error: any, variables) => {
      console.error("💥 Upload mutation error:", { error, fileName: variables.name });
      
      setUploadProgress((prev) => ({ ...prev, [variables.name]: -1 }));
      setUploadErrors((prev) => ({
        ...prev,
        [variables.name]: error.response?.data?.error || error.message || 'Upload failed'
      }));
      setUploadDetails((prev) => ({
        ...prev,
        [variables.name]: {
          status: 'error',
          error: error.response?.data || error.message,
          failedAt: new Date().toISOString()
        }
      }));
    },
  });

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      console.log("📁 Files dropped:", acceptedFiles.map(f => ({ name: f.name, size: f.size, type: f.type })));
      
      acceptedFiles.forEach((file) => {
        console.log(`🚀 Starting upload for: ${file.name} (${file.size} bytes)`);
        
        setUploadProgress((prev) => ({ ...prev, [file.name]: 0 }));
        setUploadErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[file.name];
          return newErrors;
        });
        setUploadDetails((prev) => ({
          ...prev,
          [file.name]: {
            status: 'uploading',
            startedAt: new Date().toISOString(),
            fileSize: file.size,
            fileType: file.type
          }
        }));

        // Simulate upload progress (will be overridden by real progress)
        const interval = setInterval(() => {
          setUploadProgress((prev) => {
            const current = prev[file.name] || 0;
            if (current < 90) {
              return { ...prev, [file.name]: current + 10 };
            }
            clearInterval(interval);
            return prev;
          });
        }, 200);

        uploadMutation.mutate(file);
      });
    },
    [uploadMutation],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        [".docx"],
      "application/msword": [".doc"],
      "text/plain": [".txt"],
      "text/html": [".html", ".htm"],
      "application/rtf": [".rtf"],
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    onDropRejected: (rejectedFiles) => {
      console.error("❌ Files rejected:", rejectedFiles);
      rejectedFiles.forEach(({ file, errors }) => {
        console.error(`File ${file.name} rejected:`, errors);
        setUploadErrors((prev) => ({
          ...prev,
          [file.name]: errors.map(e => e.message).join(', ')
        }));
      });
    }
  });

  const removeFile = (fileName: string) => {
    console.log(`🗑️ Removing file from UI: ${fileName}`);
    setUploadedFiles((prev) =>
      prev.filter((file) => file.filename !== fileName),
    );
    setUploadProgress((prev) => {
      const newProgress = { ...prev };
      delete newProgress[fileName];
      return newProgress;
    });
    setUploadErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[fileName];
      return newErrors;
    });
    setUploadDetails((prev) => {
      const newDetails = { ...prev };
      delete newDetails[fileName];
      return newDetails;
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
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
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Upload Documents</h1>
        <p className="mt-1 text-sm text-gray-500">
          Upload and index documents for search
        </p>
      </div>

      {/* Upload Area */}
      <div className="card">
        <div className="card-body">
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragActive
                ? "border-primary-400 bg-primary-50"
                : "border-gray-300 hover:border-primary-400"
            }`}
          >
            <input {...getInputProps()} />
            <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-lg font-medium text-gray-900 mb-2">
              {isDragActive ? "Drop files here" : "Drag & drop files here"}
            </p>
            <p className="text-sm text-gray-500 mb-4">
              or click to select files
            </p>
            <p className="text-xs text-gray-400">
              Supported formats: PDF, DOCX, DOC, TXT, HTML, RTF (Max 10MB each)
            </p>
          </div>
        </div>
      </div>

      {/* Upload Progress */}
      {Object.keys(uploadProgress).length > 0 && (
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium text-gray-900">
              Upload Progress
            </h3>
          </div>
          <div className="card-body">
            <div className="space-y-4">
              {Object.entries(uploadProgress).map(([fileName, progress]) => {
                const error = uploadErrors[fileName];
                const details = uploadDetails[fileName];
                
                return (
                  <div
                    key={fileName}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <File className="h-5 w-5 text-gray-400" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          {fileName}
                        </p>
                        <p className="text-xs text-gray-500">
                          {details?.fileSize && formatFileSize(details.fileSize)}
                        </p>
                        {error && (
                          <p className="text-xs text-red-600 mt-1">
                            Error: {error}
                          </p>
                        )}
                        {details?.status === 'uploading' && (
                          <p className="text-xs text-blue-600 mt-1">
                            Started: {new Date(details.startedAt).toLocaleTimeString()}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {progress === 100 && (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      )}
                      {progress === -1 && (
                        <AlertCircle className="h-5 w-5 text-red-500" />
                      )}
                      {progress >= 0 && progress < 100 && (
                        <div className="w-4 h-4 border-2 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
                      )}
                      <button
                        onClick={() => removeFile(fileName)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Recently Uploaded */}
      {uploadedFiles.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium text-gray-900">
              Recently Uploaded
            </h3>
          </div>
          <div className="card-body">
            <div className="space-y-4">
              {uploadedFiles.map((file) => {
                // Add null checks for file.document
                if (!file || !file.document) {
                  return (
                    <div
                      key={file?.documentId || Math.random()}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="text-2xl">📄</div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            File uploaded successfully
                          </p>
                          <p className="text-xs text-gray-500">
                            Processing document...
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 border-2 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-sm text-gray-600">Processing</span>
                      </div>
                    </div>
                  );
                }

                return (
                  <div
                    key={file.documentId}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="text-2xl">
                        {getFileIcon(file.document.fileType)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {file.document.title || file.document.filename}
                        </p>
                        <p className="text-xs text-gray-500">
                          {file.document.filename} •{" "}
                          {formatFileSize(file.document.fileSize)}
                        </p>
                        <div className="flex items-center space-x-4 mt-1">
                          <span className="flex items-center text-xs text-gray-500">
                            <Clock className="h-3 w-3 mr-1" />
                            {new Date(
                              file.document.uploadDate,
                            ).toLocaleDateString()}
                          </span>
                          <span className="badge badge-success">
                            {file.document.fileType.toUpperCase()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <span className="text-sm text-green-600">Indexed</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Upload Tips */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-medium text-gray-900">Upload Tips</h3>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">
                Supported Formats
              </h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• PDF documents (.pdf)</li>
                <li>• Word documents (.docx, .doc)</li>
                <li>• Text files (.txt)</li>
                <li>• HTML files (.html, .htm)</li>
                <li>• Rich text files (.rtf)</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Best Practices</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Keep files under 10MB for faster processing</li>
                <li>• Use descriptive filenames for better search results</li>
                <li>• Ensure documents have readable text content</li>
                <li>• Avoid password-protected files</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UploadPage;
