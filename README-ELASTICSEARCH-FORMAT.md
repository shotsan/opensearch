# OpenSearch/Elasticsearch JSON Format

## Document Indexing Format

### Index Name
- **Index**: `documents`
- **Document ID**: UUID v4 generated for each document

### Document JSON Structure (from `index.js` lines 119-128)

```json
{
  "doc_id": "e0de0e40-5d32-4810-a778-e90913b06982",
  "filename": "research-paper.pdf",
  "title": "research-paper.pdf",
  "content": "This is the extracted text content from the document...",
  "fileType": "application/pdf",
  "fileSize": 1016315,
  "uploadDate": "2025-08-19T05:13:52.325Z",
  "is_parent": true
}
```

### Field Descriptions

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `doc_id` | string | UUID v4 identifier | `"e0de0e40-5d32-4810-a778-e90913b06982"` |
| `filename` | string | Original uploaded filename | `"research-paper.pdf"` |
| `title` | string | Document title (currently filename) | `"research-paper.pdf"` |
| `content` | string | Extracted text content | `"This is the document content..."` |
| `fileType` | string | MIME type | `"application/pdf"` |
| `fileSize` | number | File size in bytes | `1016315` |
| `uploadDate` | string | ISO 8601 timestamp | `"2025-08-19T05:13:52.325Z"` |
| `is_parent` | boolean | Document type flag | `true` |

## Index Mapping (from `index.js` lines 420-430)

```json
{
  "mappings": {
    "properties": {
      "doc_id": {
        "type": "keyword"
      },
      "filename": {
        "type": "keyword"
      },
      "title": {
        "type": "text"
      },
      "content": {
        "type": "text"
      },
      "fileType": {
        "type": "keyword"
      },
      "fileSize": {
        "type": "long"
      },
      "uploadDate": {
        "type": "date"
      },
      "is_parent": {
        "type": "boolean"
      }
    }
  }
}
```

### Field Type Explanations

| Field | Type | Search Behavior | Filter Behavior |
|-------|------|----------------|-----------------|
| `doc_id` | keyword | Exact match only | Term queries |
| `filename` | keyword | Exact match only | Term queries |
| `title` | text | Full-text search | Match queries |
| `content` | text | Full-text search | Match queries |
| `fileType` | keyword | Exact match only | Term queries |
| `fileSize` | long | Range queries | Numeric filters |
| `uploadDate` | date | Date range queries | Date filters |
| `is_parent` | boolean | Boolean queries | Boolean filters |

## Indexing API Call (from `index.js` lines 130-137)

```javascript
await opensearchClient.index({
  index: 'documents',
  id: docId,
  body: document
});
```

## Search Response Format

### Search Query Response (from `index.js` lines 290-295)

```json
{
  "query": "JavaScript",
  "total": 1,
  "hits": [
    {
      "id": "e0de0e40-5d32-4810-a778-e90913b06982",
      "doc_id": "e0de0e40-5d32-4810-a778-e90913b06982",
      "filename": "research-paper.pdf",
      "title": "research-paper.pdf",
      "fileType": "application/pdf",
      "fileSize": 1016315,
      "uploadDate": "2025-08-19T05:13:52.325Z",
      "is_parent": true,
      "highlights": {
        "content": [
          "One tool that helped us greatly was Mozilla's <mark>JavaScript</mark> fuzz tester..."
        ]
      }
    }
  ]
}
```

### Search Suggestions Response (from `index.js` lines 370-375)

```json
{
  "query": "JavaScript",
  "suggestions": [
    "research-paper.pdf",
    "another-document.pdf"
  ]
}
```

## Search Query Structure

### Main Search Query (from `index.js` lines 240-250)

```json
{
  "from": 0,
  "size": 10,
  "query": {
    "bool": {
      "must": [
        {
          "multi_match": {
            "query": "search term",
            "fields": ["content^2", "title^3"],
            "type": "best_fields",
            "fuzziness": "AUTO"
          }
        }
      ]
    }
  },
  "highlight": {
    "fields": {
      "content": {
        "fragment_size": 200,
        "number_of_fragments": 3,
        "pre_tags": ["<mark>"],
        "post_tags": ["</mark>"]
      },
      "title": {
        "fragment_size": 100,
        "number_of_fragments": 1,
        "pre_tags": ["<mark>"],
        "post_tags": ["</mark>"]
      }
    }
  },
  "sort": [
    { "_score": { "order": "desc" } },
    { "uploadDate": { "order": "desc" } }
  ],
  "_source": ["doc_id", "filename", "title", "fileType", "fileSize", "uploadDate", "is_parent"]
}
```

### Suggestions Query (from `index.js` lines 320-330)

```json
{
  "size": 5,
  "query": {
    "multi_match": {
      "query": "search term",
      "fields": ["title^3", "content^1"],
      "type": "phrase_prefix",
      "slop": 2
    }
  },
  "_source": ["title", "filename"],
  "sort": [
    { "_score": { "order": "desc" } },
    { "uploadDate": { "order": "desc" } }
  ]
}
```

## Additional Service Format (from `services/opensearchService.js`)

### Enhanced Document Format (lines 95-105)

```json
{
  "title": "Document Title",
  "content": "Document content...",
  "filename": "document.pdf",
  "fileType": "application/pdf",
  "fileSize": 1016315,
  "uploadDate": "2025-08-19T05:13:52.325Z",
  "tags": ["tag1", "tag2"],
  "metadata": {
    "author": "John Doe",
    "pages": 10
  }
}
```

### Enhanced Search Response (lines 180-190)

```json
{
  "results": [
    {
      "id": "doc-id",
      "score": 1.5,
      "document": {
        "title": "Document Title",
        "filename": "document.pdf"
      },
      "snippets": ["Highlighted <mark>content</mark> snippet"],
      "titleHighlight": "Document <mark>Title</mark>",
      "totalSnippets": 1
    }
  ],
  "total": 1,
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "pages": 1
  }
}
```

## Index Creation API Call

```javascript
await opensearchClient.indices.create({
  index: 'documents',
  body: {
    mappings: {
      properties: {
        // field mappings as shown above
      }
    }
  }
});
```
