# SBC GINA Search Engine

<div align="center">
  <img src="public/sbc-gina-logo.svg" alt="SBC GINA Logo" width="150">
</div>

A powerful, self-contained search engine that crawls the web, extracts structured data, and returns results in CSV format based on user-specified headers - all without relying on external API keys.

**SBC GINA** (Structured Business Content Generator and Information Network Analyzer) is designed to help users find and structure business information from across the web.

## Project Overview

This project aims to create a custom implementation of the Gina search engine that:

1. Crawls websites efficiently and extracts content
2. Processes various content types (HTML, JavaScript-heavy sites, PDFs)
3. Searches for specific information based on user queries
4. Extracts structured data based on user-specified headers
5. Returns results in CSV format
6. Operates without relying on external API keys

## Architecture

The system consists of several key components:

### 1. Web Crawler

- **Enhanced Crawler**: Efficiently crawls websites, follows relevant links
- **Adaptive Crawler**: Intelligently determines which links to follow
- **Robots.txt Handler**: Respects website crawling policies
- **Sitemap Parser**: Uses sitemaps for efficient crawling
- **Caching System**: Avoids redundant requests

### 2. Content Processor

- **HTML Processor**: Extracts clean text from HTML
- **JavaScript Handler**: Processes JavaScript-heavy sites
- **PDF Extractor**: Extracts text and structure from PDFs
- **Snapshot Formatter**: Converts content to clean, formatted text
- **Segmentation Tool**: Breaks content into manageable chunks

### 3. Search Engine

- **Query Processor**: Parses and optimizes user queries
- **Query Rewriter**: Expands queries to improve results
- **Multiple Search Methods**: Implements various search algorithms
- **URL Ranking**: Ranks URLs by relevance
- **Similarity Scoring**: Uses cosine similarity for better matching

### 4. Structured Data Extractor

- **Pattern Matcher**: Identifies data patterns in text
- **Field Extractor**: Extracts specific fields based on headers
- **Schema Handler**: Manages data schemas
- **Validation System**: Ensures data quality
- **CSV Generator**: Formats extracted data as CSV

### 5. User Interface

- **Web Interface**: Provides a simple web UI
- **Query Input**: Allows users to specify search queries
- **Header Specification**: Lets users define CSV headers
- **Results Display**: Shows search progress and results
- **CSV Download**: Enables downloading results as CSV

## Implementation Roadmap

### Phase 1: Core Infrastructure

1. **Project Setup**
   - Directory structure
   - Dependency management
   - Configuration system

2. **Web Crawler Implementation**
   - Basic crawler functionality
   - URL normalization and deduplication
   - Robots.txt and sitemap handling
   - Caching system

3. **Content Processing**
   - HTML processing with Cheerio
   - PDF extraction with pdf.js
   - Content cleaning and formatting
   - Text segmentation

### Phase 2: Search Functionality

4. **Search Engine Implementation**
   - Query processing
   - Search algorithms
   - URL ranking
   - Result aggregation

5. **Query Enhancement**
   - Query rewriting
   - Query expansion
   - Cognitive perspectives
   - Time and region awareness

6. **Similarity and Ranking**
   - Vector-based similarity
   - TF-IDF implementation
   - Cosine similarity
   - BM25 ranking

### Phase 3: Data Extraction

7. **Structured Data Extraction**
   - Pattern matching
   - Field extraction
   - Schema handling
   - Data validation

8. **CSV Generation**
   - Data formatting
   - CSV structure
   - Header handling
   - File generation

### Phase 4: User Interface and Integration

9. **Web Interface**
   - Simple web server
   - Query input form
   - Header specification
   - Results display

10. **System Integration**
    - Component integration
    - Error handling
    - Performance optimization
    - Documentation

## Key Components from Original Gina

Based on our analysis of the original Gina codebase, we'll implement the following key components:

### From My-Gina

1. **Adaptive Crawler**
   - Intelligent crawling with relevance assessment
   - Sitemap utilization
   - Caching mechanism
   - Robots.txt compliance

2. **Snapshot Formatter**
   - HTML to markdown conversion
   - Image and link handling
   - Document structure preservation
   - Metadata extraction

3. **PDF Extractor**
   - Text and structure extraction
   - Formatting preservation
   - Metadata extraction
   - Caching for efficiency

### From My-Gina-deep-search

1. **Segmentation Tool**
   - Content chunking
   - Semantic preservation
   - Large document handling
   - Chunk position tracking

2. **URL Tools**
   - URL normalization
   - Relevance ranking
   - Hostname and path extraction
   - Filtering and deduplication

3. **Similarity Implementation**
   - Cosine similarity
   - Jaccard similarity fallback
   - Vector-based scoring
   - Result reranking

4. **Query Rewriter**
   - Intelligent query expansion
   - Multiple cognitive perspectives
   - Time and region awareness
   - Query optimization

5. **Text Processing Tools**
   - Markdown formatting and repair
   - HTML table conversion
   - Code block handling
   - Footnote processing

## Technical Stack

- **Node.js**: Runtime environment
- **TypeScript**: Programming language
- **Express**: Web server framework
- **Cheerio**: HTML parsing
- **Puppeteer**: Headless browser for JavaScript-heavy sites
- **pdf.js**: PDF processing
- **TurndownJS**: HTML to Markdown conversion
- **csv-stringify**: CSV generation
- **natural**: NLP utilities
- **zod**: Schema validation

## Implementation Details

### Enhanced Crawler

The crawler will:
- Use both fetch and Puppeteer for different site types
- Implement a politeness delay between requests
- Cache responses to avoid redundant requests
- Follow robots.txt rules
- Use sitemaps when available
- Normalize and deduplicate URLs
- Handle various content types

### Content Processor

The processor will:
- Extract clean text from HTML
- Convert HTML to markdown
- Process JavaScript-heavy sites
- Extract text and structure from PDFs
- Segment content into manageable chunks
- Extract metadata like title, description, and publish date

### Search Engine

The search engine will:
- Parse and optimize user queries
- Implement multiple search algorithms
- Rank URLs by relevance
- Use similarity scoring for better matching
- Aggregate results from multiple sources
- Filter and deduplicate results

### Structured Data Extractor

The extractor will:
- Use pattern matching to identify data
- Extract specific fields based on headers
- Validate extracted data
- Format data according to schemas
- Handle various data types
- Generate clean CSV output

### User Interface

The interface will:
- Provide a simple web form for queries
- Allow users to specify CSV headers
- Show search progress
- Display and format results
- Enable downloading results as CSV
- Provide error handling and feedback

## Getting Started

1. Clone this repository
   ```bash
   git clone https://github.com/Taiwan-Howard-Lee/CSV_search.git
   cd CSV_search
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Build the project
   ```bash
   npm run build
   ```

4. Start the server
   ```bash
   ./start.sh
   ```
   Or use the frontend server for testing:
   ```bash
   ./start-frontend.sh
   ```

5. Access the web interface at `http://localhost:3000`

## Usage

### Basic Search

1. Enter a search query in the search box (e.g., "AI startups in healthcare")
2. Add CSV headers by clicking "Advanced Search Options"
   - Each header represents a column in the final CSV (e.g., "startup name", "founder", "funding")
   - Add descriptions to help the search engine understand what to extract
3. Set additional options:
   - Maximum Results: Limit the number of results
   - Search Depth: How deep to crawl (higher values take longer but find more)
   - File Type: Filter by document type (HTML, PDF, etc.)
   - Ranking Algorithm: Choose between BM25, TF-IDF, or combined
   - Schema Type: Filter by schema.org type (Product, Event, etc.)
4. Click "Simple Search" for basic results or "Deep Search" for more comprehensive results
5. Wait for the search to complete
6. Download the CSV file with the results

### Advanced Features

#### Schema.org Detection

The search engine can detect and extract structured data using schema.org markup:

1. Enable "Schema.org Detection" in the advanced options
2. Filter results by schema type (Product, Event, Person, etc.)
3. View schema data in the document viewer

#### Enhanced HTML Parsing

Improved HTML parsing preserves document structure:

1. Enable "Enhanced HTML Parsing" in the advanced options
2. Get better results from complex HTML documents
3. Preserve headings, lists, tables, and other structural elements

#### Document Viewer

View detailed information about search results:

1. Click on a search result title to open the document viewer
2. Switch between Content, Metadata, and Schema Data tabs
3. Explore the document's content and structure

#### Faceted Search

Filter search results by various criteria:

1. Perform a search
2. Use the checkboxes in the left sidebar to filter by document type or schema type
3. Refine your results without performing a new search

### Cleaning Up

To remove intermediate files and keep only final results:

1. Open Settings by clicking the "Settings" link in the top navigation
2. Click "Clean Output Files" at the bottom of the settings panel
3. Confirm the cleanup action

Alternatively, run the cleanup script from the command line:
```bash
./comprehensive-cleanup.sh
```

This will remove all intermediate files and preserve only the final CSV results and Google search logs in the "results" directory.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
