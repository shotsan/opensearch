# Search Logic and Implementation

## Main Search Endpoint (`/api/search`)

### Query Parameters (from `index.js` line 235)

```javascript
const { q, fileType, dateFrom, dateTo, page = 1, limit = 10 } = req.query;
```

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `q` | string | required | Search query term |
| `fileType` | string | optional | Filter by MIME type |
| `dateFrom` | string | optional | Start date (ISO format) |
| `dateTo` | string | optional | End date (ISO format) |
| `page` | number | 1 | Page number for pagination |
| `limit` | number | 10 | Results per page |

### Search Query Construction (from `index.js` lines 240-270)

#### 1. Multi-Match Query
```javascript
{
  multi_match: {
    query: q,
    fields: ['content^2', 'title^3'],
    type: 'best_fields',
    fuzziness: 'AUTO'
  }
}
```

**Field Boosting:**
- `content^2` - Content field has weight 2
- `title^3` - Title field has weight 3 (higher priority)

**Query Type:** `best_fields` - Returns documents that match any field, but combines the scores from the best matching field

**Fuzziness:** `AUTO` - Allows for typo tolerance (0-2 character differences)

#### 2. Filter Conditions
```javascript
const mustConditions = [multiMatchQuery];

// File type filter
if (fileType) {
  mustConditions.push({
    term: { fileType: fileType }
  });
}

// Date range filter
if (dateFrom || dateTo) {
  const dateFilter = { range: { uploadDate: {} } };
  if (dateFrom) dateFilter.range.uploadDate.gte = dateFrom;
  if (dateTo) dateFilter.range.uploadDate.lte = dateTo;
  mustConditions.push(dateFilter);
}
```

#### 3. Boolean Query Structure
```javascript
{
  bool: {
    must: mustConditions  // All conditions must match
  }
}
```

### Highlighting Configuration (from `index.js` lines 275-290)

```javascript
highlight: {
  fields: {
    content: {
      fragment_size: 200,
      number_of_fragments: 3,
      pre_tags: ['<mark>'],
      post_tags: ['</mark>']
    },
    title: {
      fragment_size: 100,
      number_of_fragments: 1,
      pre_tags: ['<mark>'],
      post_tags: ['</mark>']
    }
  }
}
```

**Content Highlights:**
- Fragment size: 200 characters
- Number of fragments: 3
- Highlight tags: `<mark>` and `</mark>`

**Title Highlights:**
- Fragment size: 100 characters
- Number of fragments: 1
- Same highlight tags

### Sorting (from `index.js` lines 290-295)

```javascript
sort: [
  { _score: { order: 'desc' } },      // Primary: relevance score
  { uploadDate: { order: 'desc' } }   // Secondary: newest first
]
```

### Pagination (from `index.js` lines 295-300)

```javascript
from: (parseInt(page) - 1) * parseInt(limit),
size: parseInt(limit)
```

### Response Processing (from `index.js` lines 300-310)

```javascript
const hits = response.body.hits.hits.map(hit => ({
  id: hit._id,
  ...hit._source,
  highlights: hit.highlight || {}
}));
```

## Search Suggestions Endpoint (`/api/search/suggestions`)

### Query Parameters
```javascript
const rawQuery = req.query.q;
const query = typeof rawQuery === 'string' ? rawQuery.trim() : '';
```

### Suggestions Query (from `index.js` lines 320-330)

```javascript
{
  multi_match: {
    query,
    fields: ['title^3', 'content^1'],
    type: 'phrase_prefix',
    slop: 2
  }
}
```

**Query Type:** `phrase_prefix` - Matches phrases that start with the query
**Slop:** 2 - Allows up to 2 words between query terms
**Size:** 5 results maximum

### Suggestions Processing (from `index.js` lines 350-365)

```javascript
const suggestions = [];
const seen = new Set();
for (const hit of response.body.hits.hits) {
  const src = hit._source || {};
  const candidate = (src.title && String(src.title).trim()) || 
                   (src.filename && String(src.filename).trim());
  if (candidate && !seen.has(candidate)) {
    suggestions.push(candidate);
    seen.add(candidate);
  }
  if (suggestions.length >= 5) break;
}
```

**Deduplication:** Uses Set to avoid duplicate suggestions
**Fallback:** Uses filename if title is empty
**Limit:** Maximum 5 suggestions

## Enhanced Search Service (`services/opensearchService.js`)

### Search Documents Function (lines 100-180)

#### Query Construction
```javascript
let searchQuery = {
  multi_match: {
    query: query,
    fields: ['content^2', 'title^3', 'tags'],
    type: 'best_fields',
    fuzziness: 'AUTO'
  }
};
```

**Additional Field:** `tags` field included in search

#### Filter Building
```javascript
const filters = [];

if (fileType) {
  filters.push({ term: { fileType: fileType.toLowerCase() } });
}

if (dateFrom || dateTo) {
  const dateFilter = { range: { uploadDate: {} } };
  if (dateFrom) dateFilter.range.uploadDate.gte = dateFrom;
  if (dateTo) dateFilter.range.uploadDate.lte = dateTo;
  filters.push(dateFilter);
}
```

#### Query Combination
```javascript
const finalQuery = filters.length > 0 
  ? { bool: { must: [searchQuery], filter: filters } }
  : searchQuery;
```

**Filter vs Must:** Filters don't affect scoring, only filtering

### Enhanced Highlighting (lines 150-170)

```javascript
highlight: {
  fields: {
    content: {
      fragment_size: 200,
      number_of_fragments: 5,
      pre_tags: ['<mark>'],
      post_tags: ['</mark>'],
      type: 'unified'
    },
    title: {
      fragment_size: 100,
      number_of_fragments: 1,
      pre_tags: ['<mark>'],
      post_tags: ['</mark>']
    }
  }
}
```

**Unified Highlighter:** Uses `unified` type for better highlighting
**More Fragments:** 5 content fragments vs 3 in main implementation

### Enhanced Response Processing (lines 180-200)

```javascript
const processedResults = response.body.hits.hits.map(hit => ({
  id: hit._id,
  score: hit._score,
  document: hit._source,
  snippets: hit.highlight?.content || [],
  titleHighlight: hit.highlight?.title?.[0] || hit._source.title,
  totalSnippets: hit.highlight?.content?.length || 0
}));
```

**Score Inclusion:** Includes relevance score in response
**Snippet Count:** Provides total number of highlight fragments

## Search Flow Summary

1. **Query Validation:** Check for required `q` parameter
2. **Query Construction:** Build multi-match query with field boosting
3. **Filter Application:** Add file type and date range filters
4. **Boolean Combination:** Combine query and filters in bool query
5. **Highlighting:** Configure highlight fields and tags
6. **Sorting:** Apply relevance and date sorting
7. **Pagination:** Calculate from/size for pagination
8. **Execution:** Send query to OpenSearch
9. **Processing:** Map results and add highlights
10. **Response:** Return formatted results with metadata

## Search Capabilities

### Supported Query Types
- **Full-text search** on content and title
- **Fuzzy matching** with typo tolerance
- **Phrase prefix** for suggestions
- **Exact term** filtering
- **Date range** filtering
- **File type** filtering

### Scoring Factors
- **Field boosting:** Title (3x) > Content (2x)
- **Best fields:** Combines scores from best matching field
- **Fuzziness:** Allows for spelling variations
- **Relevance:** Primary sort by score
- **Recency:** Secondary sort by upload date

### Limitations
- No wildcard queries
- No regex search
- No semantic search
- No synonym expansion
- No stemming configuration
- No custom analyzers (except in service layer)
