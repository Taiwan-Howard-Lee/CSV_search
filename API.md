# SBC Gina Search Engine API Documentation

This document describes the API endpoints available in the SBC Gina Search Engine.

## Base URL

All API endpoints are relative to the base URL:

```
http://localhost:3000/api
```

The port may vary based on your configuration in `config.json`.

## Authentication

Currently, the API does not require authentication. This may change in future versions.

## Endpoints

### Search

Performs a search and returns results in CSV format.

**Endpoint:** `/search`

**Method:** POST

**Request Body:**

```json
{
  "query": "AI startups in healthcare",
  "headers": ["name", "founder", "funding"],
  "headerDescriptions": {
    "name": "Name of the company",
    "founder": "Founder of the company",
    "funding": "Amount of funding received"
  },
  "maxResults": 10,
  "searchDepth": 2,
  "includeSource": true,
  "schemaDetection": true,
  "enhancedParsing": true
}
```

**Parameters:**

- `query` (string, required): The search query
- `headers` (array of strings, required): The headers for the CSV output
- `headerDescriptions` (object, optional): Descriptions for each header to help the search engine understand what to extract
- `maxResults` (number, optional): Maximum number of results to return (default: 10)
- `searchDepth` (number, optional): How deep to crawl (default: 2)
- `includeSource` (boolean, optional): Whether to include source URLs in the CSV (default: true)
- `schemaDetection` (boolean, optional): Whether to enable schema.org detection (default: true)
- `enhancedParsing` (boolean, optional): Whether to enable enhanced HTML parsing (default: true)

**Response:**

CSV file with the requested headers and data.

**Example:**

```
name,founder,funding
AI Health Startup 1,Founder 1,$12.5M
AI Health Startup 2,Founder 2,$8.3M
...
```

### Deep Search

Performs a more comprehensive search with deeper crawling and returns results in CSV format.

**Endpoint:** `/deep-search`

**Method:** POST

**Request Body:** Same as `/search`

**Response:** CSV file with the requested headers and data.

### Search Results (JSON)

Performs a search and returns results in JSON format with faceted search capabilities.

**Endpoint:** `/search-results`

**Method:** POST

**Request Body:**

```json
{
  "query": "AI startups in healthcare",
  "fileType": "all",
  "schemaType": "all",
  "rankingAlgorithm": "bm25",
  "schemaDetection": true,
  "enhancedParsing": true
}
```

**Parameters:**

- `query` (string, required): The search query
- `fileType` (string, optional): Filter by file type (all, html, pdf, docx, xlsx, pptx, csv)
- `schemaType` (string, optional): Filter by schema.org type (all, Product, Event, Person, etc.)
- `rankingAlgorithm` (string, optional): Ranking algorithm to use (bm25, tfidf, combined)
- `schemaDetection` (boolean, optional): Whether to enable schema.org detection
- `enhancedParsing` (boolean, optional): Whether to enable enhanced HTML parsing

**Response:**

```json
{
  "query": "AI startups in healthcare",
  "totalResults": 5,
  "results": [
    {
      "title": "AI Startup Funding Report 2025",
      "url": "https://example.com/ai-startup-funding-2025",
      "snippet": "Comprehensive analysis of AI startup funding trends in 2025...",
      "documentType": "html",
      "schemaTypes": ["Article", "Report"],
      "metadata": {
        "author": "Jane Smith",
        "publishedDate": "2025-01-15",
        "category": "Finance"
      }
    },
    ...
  ],
  "facets": {
    "documentTypes": [
      { "name": "HTML", "count": 3 },
      { "name": "PDF", "count": 2 }
    ],
    "schemaTypes": [
      { "name": "Article", "count": 2 },
      { "name": "Report", "count": 1 },
      { "name": "Product", "count": 1 },
      { "name": "Organization", "count": 1 }
    ]
  }
}
```

### Document

Retrieves detailed information about a specific document.

**Endpoint:** `/document`

**Method:** GET

**Query Parameters:**

- `url` (string, required): The URL of the document to retrieve

**Response:**

```json
{
  "title": "AI Startup Funding Report 2025",
  "url": "https://example.com/ai-startup-funding-2025",
  "snippet": "Comprehensive analysis of AI startup funding trends in 2025...",
  "content": "<h1>AI Startup Funding Report 2025</h1><p>Comprehensive analysis...</p>...",
  "documentType": "html",
  "schemaTypes": ["Article", "Report"],
  "metadata": {
    "author": "Jane Smith",
    "publishedDate": "2025-01-15",
    "category": "Finance",
    "wordCount": 1250,
    "language": "English",
    "lastUpdated": "2025-03-15"
  },
  "schemaData": [
    {
      "type": "Article",
      "source": "json-ld",
      "properties": {
        "name": "AI Startup Funding Report 2025",
        "description": "Comprehensive analysis of AI startup funding trends in 2025...",
        "datePublished": "2025-01-15",
        "author": "Jane Smith"
      }
    },
    ...
  ]
}
```

### Cleanup

Cleans up intermediate files and preserves only final results.

**Endpoint:** `/cleanup`

**Method:** POST

**Request Body:** Empty object `{}`

**Response:**

```json
{
  "success": true,
  "message": "Cleanup completed. Cleaned 25 files, preserved 3 files.",
  "cleanedFiles": 25,
  "preservedFiles": 3
}
```

## Error Handling

All API endpoints return appropriate HTTP status codes:

- 200: Success
- 400: Bad Request (invalid parameters)
- 404: Not Found
- 500: Internal Server Error

Error responses include a JSON object with an `error` field containing a description of the error.

Example:

```json
{
  "error": "Invalid search query"
}
```

## Rate Limiting

Currently, there are no rate limits on the API. This may change in future versions.

## Examples

### Example: Performing a Search

```javascript
fetch('http://localhost:3000/api/search', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    query: 'AI startups in healthcare',
    headers: ['name', 'founder', 'funding'],
    maxResults: 10
  })
})
.then(response => response.blob())
.then(blob => {
  // Create a download link for the CSV
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'search-results.csv';
  a.click();
});
```

### Example: Getting JSON Results

```javascript
fetch('http://localhost:3000/api/search-results', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    query: 'AI startups in healthcare',
    fileType: 'all',
    schemaType: 'all',
    rankingAlgorithm: 'bm25'
  })
})
.then(response => response.json())
.then(data => {
  console.log(`Found ${data.totalResults} results`);
  data.results.forEach(result => {
    console.log(`- ${result.title}: ${result.snippet}`);
  });
});
```
