# OpenSearch Document Search Application

A modern, full-stack document search application built with React, Node.js, and OpenSearch. This application provides powerful document indexing, search capabilities with highlighted snippets, and a beautiful user interface.

## 🚀 Features

### Core Functionality
- **Document Upload & Indexing**: Support for PDF and HTML documents
- **Advanced Search**: Fuzzy matching, highlighting, and context snippets
- **Document Viewer**: Embedded PDF and HTML viewers with professional styling
- **Analytics Dashboard**: Search performance metrics and insights
- **Document Management**: Upload, view, download, and delete documents

### Search Features
- **Highlighted Snippets**: Search results show relevant text snippets with highlighted search terms
- **Multiple Snippets**: Each result displays multiple context snippets for better understanding
- **Fuzzy Matching**: Handles typos and partial matches intelligently
- **Field-Specific Search**: Searches across content, title, and tags with different weights
- **Filtering**: Filter by file type, date range, and other criteria

### User Interface
- **Modern Design**: Clean, responsive interface built with Tailwind CSS
- **Professional HTML Viewer**: Sandboxed iframe rendering with default styling
- **PDF Viewer**: Embedded PDF viewing with zoom and navigation controls
- **Search Suggestions**: Real-time search suggestions as you type
- **Responsive Layout**: Works seamlessly on desktop and mobile devices

## 🛠️ Technology Stack

### Frontend
- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **React Query** for data fetching and caching
- **React Router** for navigation
- **Lucide React** for icons

### Backend
- **Node.js** with Express
- **OpenSearch** for document indexing and search
- **Multer** for file uploads
- **PDF.js** for PDF parsing
- **RAKE** for keyword extraction

### Search Engine
- **OpenSearch 8.11.0** (Elasticsearch-compatible)
- **Highlighting** with custom markup
- **Fuzzy search** with automatic typo correction
- **Multi-field search** with boosting

## 📋 Prerequisites

- Node.js 18+ 
- npm or yarn
- Java 17+ (for OpenSearch)

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone https://github.com/shotsan/opensearch.git
cd opensearch
```

### 2. Install Dependencies
```bash
# Install backend dependencies
npm install

# Install frontend dependencies
cd client
npm install
cd ..
```

### 3. Setup OpenSearch
```bash
# Download and setup OpenSearch (first time only)
./setup.sh
```

### 4. Start the Application

#### Option A: Quick Start (Recommended)
```bash
# Start OpenSearch first (in one terminal)
cd elasticsearch-8.11.0
./bin/elasticsearch

# Start everything else (in another terminal)
./start-local.sh

# Start frontend (in a third terminal)
cd client
npm start
```

#### Option B: Manual Start
```bash
# Start OpenSearch
cd elasticsearch-8.11.0
./bin/elasticsearch

# In a new terminal, start the backend
npm start

# In another terminal, start the frontend
cd client
npm start
```

The application will be available at:
- Frontend: http://localhost:4000
- Backend API: http://localhost:4001
- OpenSearch: http://localhost:9200

## 📁 Project Structure

```
opensearch/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── pages/         # Page components
│   │   ├── services/      # API services
│   │   └── index.css      # Global styles
│   └── package.json
├── server/                 # Node.js backend
│   ├── controllers/       # Route controllers
│   ├── routes/           # API routes
│   ├── services/         # Business logic
│   └── index.js          # Server entry point
├── uploads/               # Document storage
├── setup.sh              # Initial setup script
├── start-opensearch.sh   # OpenSearch startup script
└── package.json
```

## 🔧 Configuration

### Environment Variables
Create a `.env` file in the root directory:

```env
# Server Configuration
PORT=4001
NODE_ENV=development

# OpenSearch Configuration
OPENSEARCH_URL=http://localhost:9200
OPENSEARCH_USERNAME=admin
OPENSEARCH_PASSWORD=admin

# File Upload Configuration
MAX_FILE_SIZE=10485760  # 10MB
UPLOAD_PATH=./uploads
```

### OpenSearch Configuration
The application uses OpenSearch with the following default settings:
- **Port**: 9200
- **Username**: admin
- **Password**: admin
- **Security**: Basic authentication enabled

## 📖 Usage

### Uploading Documents
1. Navigate to the Upload page
2. Drag and drop or select PDF/HTML files
3. Documents are automatically parsed and indexed
4. Tags are extracted using RAKE algorithm

### Searching Documents
1. Use the search bar on the main page
2. View highlighted snippets in search results
3. Click "View in Document" to see the full document
4. Use filters to narrow down results

### Viewing Documents
- **PDF Documents**: Embedded viewer with zoom and navigation
- **HTML Documents**: Professional iframe rendering with styling
- **Search Context**: When viewing from search results, relevant sections are highlighted

## 🔍 Search Features

### Highlighted Snippets
Search results display multiple relevant snippets with highlighted search terms:
- **Content snippets**: Show context around matched terms
- **Title highlighting**: Highlighted document titles
- **Multiple snippets**: Up to 5 snippets per result for better context

### Advanced Search Options
- **Fuzzy matching**: Handles typos and variations
- **Field boosting**: Title matches weighted higher than content
- **Tag search**: Search through extracted keywords
- **Date filtering**: Filter by upload date range
- **File type filtering**: Filter by PDF or HTML

## 📊 Analytics

The analytics dashboard provides:
- **Search Performance**: Average search times
- **Popular Searches**: Most common search terms
- **Document Statistics**: Upload counts and file types
- **System Health**: OpenSearch cluster status

## 🚀 Deployment

### Google Cloud App Engine
The application is configured for deployment on Google Cloud App Engine:

1. **Backend Deployment**:
   ```bash
   gcloud app deploy server/app.yaml
   ```

2. **Frontend Deployment**:
   ```bash
   cd client
   npm run build
   gcloud app deploy app.yaml
   ```

### Environment Setup
For production deployment:
1. Set up OpenSearch on a managed service (AWS OpenSearch, Elastic Cloud)
2. Configure environment variables
3. Set up proper authentication and security
4. Configure CORS settings

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License.

## 🆘 Support

For issues and questions:
1. Check the existing issues
2. Create a new issue with detailed information
3. Include error logs and steps to reproduce

## 🔄 Recent Updates

### Enhanced Search Functionality
- ✅ Implemented highlighted search snippets
- ✅ Added fuzzy matching for better search results
- ✅ Enhanced HTML viewer with professional styling
- ✅ Improved PDF viewer with better navigation
- ✅ Added comprehensive analytics dashboard
- ✅ Fixed delete functionality with proper error handling

### Performance Improvements
- ✅ Optimized search queries with proper field boosting
- ✅ Implemented efficient document parsing
- ✅ Added proper error handling and user feedback
- ✅ Enhanced UI responsiveness and loading states

---

**Built with ❤️ using React, Node.js, and OpenSearch**
