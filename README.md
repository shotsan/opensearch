# OpenSearch Document Search Web Application

A modern web application for searching and indexing documents using OpenSearch. This application provides a beautiful, responsive interface for uploading, indexing, and searching through various document types.

## Features

- 📄 **Multi-format Document Support**: Upload and index PDF, DOCX, TXT, and other text-based documents
- 🔍 **Advanced Search**: Full-text search with highlighting and relevance scoring
- 📊 **Search Analytics**: View search statistics and popular queries
- 🎨 **Modern UI**: Beautiful, responsive interface built with React and Tailwind CSS
- ⚡ **Real-time Indexing**: Automatic document processing and indexing
- 🔐 **Secure**: Built-in security features and input validation

## Tech Stack

### Backend

- **Node.js** with Express.js
- **OpenSearch** for document indexing and search
- **Multer** for file uploads
- **PDF-parse, Mammoth** for document parsing

### Frontend

- **React** with TypeScript
- **Tailwind CSS** for styling
- **Axios** for API communication
- **React Query** for state management

## Prerequisites

- Node.js (v16 or higher)
- Java 11 or higher (required for OpenSearch)
- npm or yarn package manager

## Quick Start

### 1. Clone and Setup

```bash
git clone <repository-url>
cd opensearch-document-search
./setup.sh
```

The setup script will:

- Check Node.js and Java versions
- Install all dependencies
- Download and configure OpenSearch
- Create necessary directories and configuration files

### 2. Start OpenSearch

In a new terminal window:

```bash
./start-opensearch.sh
```

Wait for OpenSearch to fully start (you'll see "started" in the logs). This may take 1-2 minutes.

### 3. Start the Application

In another terminal window:

```bash
./start-app.sh
```

### 4. Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **OpenSearch**: http://localhost:9200

## API Endpoints

### Documents

- `POST /api/documents/upload` - Upload and index a document
- `GET /api/documents` - List all documents
- `GET /api/documents/:id` - Get document details
- `DELETE /api/documents/:id` - Delete a document

### Search

- `GET /api/search` - Search documents
- `GET /api/search/suggestions` - Get search suggestions
- `GET /api/search/analytics` - Get search analytics

## Project Structure

```
opensearch-document-search/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── pages/         # Page components
│   │   ├── hooks/         # Custom hooks
│   │   ├── services/      # API services
│   │   └── types/         # TypeScript types
├── server/                 # Node.js backend
│   ├── config/            # Configuration files
│   ├── controllers/       # Route controllers
│   ├── middleware/        # Express middleware
│   ├── services/          # Business logic
│   └── utils/             # Utility functions
├── uploads/               # Uploaded documents
├── opensearch-2.11.0/    # OpenSearch installation
├── start-opensearch.sh   # OpenSearch startup script
├── start-app.sh          # Application startup script
└── package.json
```

## Development

### Adding New Document Types

1. Add the parser in `server/services/documentParser.js`
2. Update the supported file types in the frontend
3. Test with sample documents

### Customizing Search

Modify the search query in `server/controllers/searchController.js` to add:

- Fuzzy matching
- Field-specific search
- Filtering by document type
- Date range filtering

## Troubleshooting

### OpenSearch Issues

- Make sure Java 11+ is installed
- Check that port 9200 is not in use
- Verify OpenSearch logs for errors

### Application Issues

- Ensure OpenSearch is running before starting the app
- Check that all dependencies are installed
- Verify the .env file is configured correctly

## License

MIT License - see LICENSE file for details
