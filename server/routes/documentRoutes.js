const express = require("express");
const router = express.Router();
const {
  upload,
  uploadDocument,
  getDocuments,
  getDocument,
  getDocumentPages,
  servePDF,
  serveHTML,
  removeDocument,
  getSupportedTypes,
} = require("../controllers/documentController");

// Upload document
router.post("/upload", upload.single("document"), uploadDocument);

// Get all documents
router.get("/", getDocuments);

// Get document by ID
router.get("/:id", getDocument);

// Get document pages
router.get("/:id/pages", getDocumentPages);

// Serve PDF file
router.get("/:id/pdf", servePDF);

// Serve HTML file
router.get("/:id/html", serveHTML);

// Delete document
router.delete("/:id", removeDocument);

// Get supported file types
router.get("/types/supported", getSupportedTypes);

module.exports = router;
