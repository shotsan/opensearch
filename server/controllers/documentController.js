const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { v4: uuidv4 } = require("uuid");
const {
  indexDocument,
  getDocumentById,
  deleteDocument,
  getAllDocuments,
  getAllDocumentPages,
} = require("../services/opensearchService");
const documentParser = require("../services/documentParser");
const { ingestPDF } = require("../services/pdfIngestService");
const { ingestHTML } = require("../services/htmlIngestService");

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, "../../uploads");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}-${file.originalname}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024, // 10MB default
  },
  fileFilter: (req, file, cb) => {
    const supportedTypes = documentParser.getSupportedTypes();
    const fileExtension = path
      .extname(file.originalname)
      .toLowerCase()
      .substring(1);

    if (supportedTypes.includes(fileExtension)) {
      cb(null, true);
    } else {
      cb(
        new Error(
          `Unsupported file type. Supported types: ${supportedTypes.join(", ")}`,
        ),
      );
    }
  },
});

// Upload and index document
const uploadDocument = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const filePath = req.file.path;
    const originalName = req.file.originalname;
    const fileSize = req.file.size;
    const fileType = path.extname(originalName).substring(1).toLowerCase();
    const uploadedBy = req.body.uploadedBy || "anonymous";

    const buffer = fs.readFileSync(filePath);
    let doc_id;

    // Handle different file types
    if (fileType === "pdf") {
      doc_id = await ingestPDF(
        buffer,
        originalName,
        fileType,
        fileSize,
        uploadedBy,
      );
    } else if (fileType === "html" || fileType === "htm") {
      doc_id = await ingestHTML(
        buffer,
        originalName,
        fileType,
        fileSize,
        uploadedBy,
      );
    } else {
      return res
        .status(400)
        .json({ error: "Only PDF and HTML files are supported for processing." });
    }

    res.status(201).json({
      message: `${fileType.toUpperCase()} uploaded, processed, tagged, and indexed successfully`,
      doc_id,
      filename: originalName,
      fileType,
      fileSize,
    });
  } catch (error) {
    console.error("Error uploading document:", error);
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({
      error: "Failed to upload document",
      message: error.message,
    });
  }
};

// Get all documents
const getDocuments = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      sortBy = "uploadDate",
      sortOrder = "desc",
    } = req.query;
    const from = (parseInt(page) - 1) * parseInt(limit);
    const size = parseInt(limit);

    const result = await getAllDocuments({
      from,
      size,
      sortBy,
      sortOrder,
    });

    res.json({
      documents: result.hits,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: result.total,
        pages: Math.ceil(result.total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("Error getting documents:", error);
    res.status(500).json({
      error: "Failed to retrieve documents",
      message: error.message,
    });
  }
};

// Get document by ID
const getDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const document = await getDocumentById(id);

    if (!document) {
      return res.status(404).json({ error: "Document not found" });
    }

    res.json({ document });
  } catch (error) {
    console.error("Error getting document:", error);
    res.status(500).json({
      error: "Failed to retrieve document",
      message: error.message,
    });
  }
};

// Get all pages of a document
const getDocumentPages = async (req, res) => {
  try {
    const { id } = req.params;
    const { page } = req.query;
    
    // Get the parent document first
    const parentDocument = await getDocumentById(id);
    if (!parentDocument) {
      return res.status(404).json({ error: "Document not found" });
    }

    // Get all pages for this document
    const pages = await getAllDocumentPages(id);
    
    // If specific page requested, return only that page
    if (page) {
      const pageNumber = parseInt(page);
      const requestedPage = pages.find(p => p.page_number === pageNumber);
      if (!requestedPage) {
        return res.status(404).json({ error: "Page not found" });
      }
      return res.json({ 
        document: parentDocument,
        page: requestedPage,
        totalPages: pages.length
      });
    }

    res.json({ 
      document: parentDocument,
      pages,
      totalPages: pages.length
    });
  } catch (error) {
    console.error("Error getting document pages:", error);
    res.status(500).json({
      error: "Failed to retrieve document pages",
      message: error.message,
    });
  }
};

// Delete document
const removeDocument = async (req, res) => {
  try {
    const { id } = req.params;
    console.log("Delete request received for document ID:", id);

    // Get document details first
    const document = await getDocumentById(id);
    if (!document) {
      console.log("Document not found for ID:", id);
      return res.status(404).json({ error: "Document not found" });
    }
    console.log("Document found:", document.filename);

    // Delete from OpenSearch
    console.log("Deleting from OpenSearch...");
    await deleteDocument(id);
    console.log("Successfully deleted from OpenSearch");

    // Delete file from filesystem if it exists
    const uploadDir = path.join(__dirname, "../../uploads");
    const files = fs.readdirSync(uploadDir);
    const fileToDelete = files.find((file) => file.includes(document.filename));

    if (fileToDelete) {
      console.log("Deleting file from filesystem:", fileToDelete);
      fs.unlinkSync(path.join(uploadDir, fileToDelete));
      console.log("Successfully deleted file from filesystem");
    } else {
      console.log("No file found in filesystem to delete");
    }

    console.log("Document deletion completed successfully");
    res.json({
      message: "Document deleted successfully",
      deletedDocument: {
        id,
        filename: document.filename,
      },
    });
  } catch (error) {
    console.error("Error deleting document:", error);
    res.status(500).json({
      error: "Failed to delete document",
      message: error.message,
    });
  }
};

// Get supported file types
const getSupportedTypes = async (req, res) => {
  try {
    const supportedTypes = documentParser.getSupportedTypes();
    res.json({ supportedTypes });
  } catch (error) {
    console.error("Error getting supported types:", error);
    res.status(500).json({
      error: "Failed to get supported file types",
      message: error.message,
    });
  }
};

// Serve PDF file
const servePDF = async (req, res) => {
  try {
    const { id } = req.params;
    const document = await getDocumentById(id);

    if (!document) {
      return res.status(404).json({ error: "Document not found" });
    }

    const filePath = path.join(__dirname, "../../uploads", document.filename);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "File not found" });
    }

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="${document.filename}"`);
    res.sendFile(filePath);
  } catch (error) {
    console.error("Error serving PDF:", error);
    res.status(500).json({ error: "Failed to serve PDF" });
  }
};

// Serve HTML file
const serveHTML = async (req, res) => {
  try {
    const { id } = req.params;
    const document = await getDocumentById(id);

    if (!document) {
      return res.status(404).json({ error: "Document not found" });
    }

    // Find the actual file in uploads directory
    const uploadDir = path.join(__dirname, "../../uploads");
    const files = fs.readdirSync(uploadDir);
    const fileToServe = files.find((file) => file.includes(document.filename));

    if (!fileToServe) {
      return res.status(404).json({ error: "HTML file not found" });
    }

    const filePath = path.join(uploadDir, fileToServe);
    
    // Set appropriate headers for HTML
    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Content-Disposition', `inline; filename="${document.filename}"`);
    
    // Stream the file
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  } catch (error) {
    console.error("Error serving HTML:", error);
    res.status(500).json({
      error: "Failed to serve HTML file",
      message: error.message,
    });
  }
};

module.exports = {
  upload,
  uploadDocument,
  getDocuments,
  getDocument,
  getDocumentPages,
  removeDocument,
  getSupportedTypes,
  servePDF,
  serveHTML,
};
