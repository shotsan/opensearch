# Document Indexing Variables and Content Extraction

## Indexing Variables

### Core Document Fields (from `index.js` lines 119-128)

```javascript
const document = {
  doc_id: docId,                    // UUID v4 generated for each document
  filename: file.originalname,      // Original uploaded filename
  title: file.originalname,         // Currently set to filename (no title extraction)
  content: content,                 // Extracted text content
  fileType: file.mimetype,          // MIME type (e.g., "application/pdf")
  fileSize: file.size,              // File size in bytes
  uploadDate: new Date().toISOString(), // ISO timestamp
  is_parent: true                   // Boolean flag (always true in current implementation)
};
```

### OpenSearch Index Mapping (from `index.js` lines 420-430)

```javascript
mappings: {
  properties: {
    doc_id: { type: 'keyword' },      // Exact match only
    filename: { type: 'keyword' },    // Exact match only  
    title: { type: 'text' },          // Full-text searchable
    content: { type: 'text' },        // Full-text searchable
    fileType: { type: 'keyword' },    // Exact match only
    fileSize: { type: 'long' },       // Numeric
    uploadDate: { type: 'date' },     // Date range queries
    is_parent: { type: 'boolean' }    // Boolean filter
  }
}
```

## Content Extraction Process

### File Type Support (from `index.js` lines 108-118)

1. **PDF Files** (`application/pdf`):
   - Uses `pdf-parse` library
   - Extracts raw text content
   - Falls back to empty string on parsing error

2. **Text Files** (`text/plain`, `text/html`):
   - Direct buffer to UTF-8 string conversion
   - No additional processing

3. **Other File Types**:
   - No content extraction implemented
   - Content field remains empty string

### Content Extraction Code

```javascript
// 2. Parse file content (best-effort, keep fast)
let content = '';
if (file.mimetype === 'application/pdf') {
  try {
    const pdfData = await pdfParse(file.buffer);
    content = pdfData.text || '';
  } catch (_) {
    content = '';
  }
} else if (file.mimetype === 'text/plain' || file.mimetype === 'text/html') {
  // For text files, use the buffer directly
  content = file.buffer.toString('utf8');
}
```

### Additional Parser Service (from `services/documentParser.js`)

**Supported File Types:**
- `.pdf` - PDF parsing via `pdf-parse`
- `.docx` - Word documents via `mammoth`
- `.txt` - Plain text files
- `.html/.htm` - HTML files with tag stripping

**HTML Content Processing:**
- Removes `<script>` and `<style>` tags
- Strips all HTML tags
- Replaces HTML entities (`&nbsp;`, `&amp;`, etc.)
- Normalizes whitespace

**Title Extraction:**
- Looks for first line 10-200 characters long
- Falls back to filename without extension

**Tag Extraction:**
- Counts word frequency (words > 3 characters)
- Returns top 10 most frequent words as tags

## Storage Configuration

### Local Development (from `index.js` lines 50-60)
- Files stored in `./uploads/` directory
- Filename format: `${docId}-${originalFilename}`
- Uses Node.js `fs` module

### Production (from `index.js` lines 45-49)
- Google Cloud Storage bucket
- Requires `GCS_BUCKET` environment variable
- Same filename format as local

## Indexing Process

1. **File Upload**: Multer stores file in memory buffer
2. **Content Extraction**: Based on MIME type
3. **Document Creation**: Builds document object with extracted content
4. **OpenSearch Indexing**: Single document indexed with UUID as ID
5. **Response**: Returns success/failure with document metadata

## Limitations

- No multi-page document support (all pages indexed as single document)
- No content validation or cleaning beyond basic extraction
- Title extraction not implemented (uses filename)
- No metadata extraction beyond basic file properties
- No content chunking or segmentation
