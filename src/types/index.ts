/**
 * Core types for the Custom Gina Search Engine
 */

// Crawler types
export interface CrawlResult {
  url: string;
  html: string;
  title: string;
  text: string;
  links: Array<[string, string]>; // [title, url]
  status: number;
  contentType: string;
  isFromCache?: boolean;
  pdfs?: string[];
  docx?: string[];
  xlsx?: string[];
  pptx?: string[];
  csv?: string[];
  documentType?: 'html' | 'pdf' | 'docx' | 'xlsx' | 'pptx' | 'csv' | 'other';
}

export interface CrawlOptions {
  maxDepth?: number;
  maxPages?: number;
  delayMs?: number;
  timeout?: number;
  userAgent?: string;
  cacheValidMs?: number;
  respectRobotsTxt?: boolean;
  useSitemaps?: boolean;
  adaptiveCrawling?: boolean;
  extractPdf?: boolean;
  maxLinksPerPage?: number;
  priorityKeywords?: string[];
}

// Content processor types
export interface ProcessedContent {
  url: string;
  title: string;
  text: string;
  markdown: string;
  html: string;
  metadata: Record<string, string>;
  chunks: string[];
  chunk_positions: [number, number][];
  documentType: 'html' | 'pdf' | 'docx' | 'xlsx' | 'pptx' | 'csv' | 'other';
  isPdf?: boolean;
  pdfInfo?: {
    numPages?: number;
    author?: string;
    title?: string;
    subject?: string;
    keywords?: string[];
    creationDate?: string;
    modificationDate?: string;
    creator?: string;
    producer?: string;
    version?: string;
    pageSize?: {
      width: number;
      height: number;
      unit: string;
    };
    fileName?: string;
    fileSize?: number;
    isPdf?: boolean;
  };
  docxInfo?: {
    author?: string;
    title?: string;
    subject?: string;
    keywords?: string[];
    creationDate?: string;
    modificationDate?: string;
    fileName?: string;
    fileSize?: number;
    pageCount?: number;
    wordCount?: number;
    paragraphCount?: number;
  };
  xlsxInfo?: {
    author?: string;
    title?: string;
    subject?: string;
    keywords?: string[];
    creationDate?: string;
    modificationDate?: string;
    fileName?: string;
    fileSize?: number;
    sheetNames?: string[];
    sheetCount?: number;
    cellCount?: number;
  };
  pptxInfo?: {
    author?: string;
    title?: string;
    subject?: string;
    keywords?: string[];
    creationDate?: string;
    modificationDate?: string;
    fileName?: string;
    fileSize?: number;
    slideCount?: number;
  };
  csvInfo?: {
    fileName?: string;
    fileSize?: number;
    rowCount?: number;
    columnCount?: number;
    headers?: string[];
  };

  /**
   * Structured data extracted from schema.org markup
   */
  schemaData?: Array<{
    type: string;
    source: string;
    properties: Record<string, any>;
  }>;
}

export interface ProcessorOptions {
  withImages?: boolean;
  withLinks?: boolean;
  segmentContent?: boolean;
  mdLinkStyle?: 'inline' | 'reference' | 'discarded';
  extractPdfMetadata?: boolean;
  pdfTextLayout?: boolean;
  pdfMaxPages?: number;
  pdfVersion?: string;
  extractDocxMetadata?: boolean;
  extractXlsxMetadata?: boolean;
  extractPptxMetadata?: boolean;
  extractCsvMetadata?: boolean;
  maxSheets?: number;
  maxSlides?: number;
  maxRows?: number;
  preserveDocxFormatting?: boolean;
  preserveXlsxFormatting?: boolean;
  preservePptxFormatting?: boolean;
}

// Query processor types
export interface ProcessedQuery {
  original: string;
  synonyms: string[][];
  relatedConcepts: string[];
  alternativePhrases: string[];
  entities: string[];
  expandedQuery: string;
}

// Extraction types
export interface ExtractionField {
  name: string;
  description?: string;
  type?: 'string' | 'number' | 'date' | 'boolean' | 'array';
  required?: boolean;
  fallback?: string;
}

export interface ExtractedData {
  [key: string]: string;
  _source: string;
  _title: string;
}

export interface ExtractionOptions {
  confidenceThreshold?: number;
  includeSource?: boolean;
  includeConfidence?: boolean;
  maxResults?: number;
  fields?: ExtractionField[];
  query?: string;
}

// Search types
export interface SearchResult {
  url: string;
  title: string;
  snippet: string;
  score: number;
}

export interface SearchOptions {
  maxResults?: number;
  timeRange?: string;
  site?: string[];
  language?: string;
  region?: string;
}

export interface RankedSearchResult extends SearchResult {
  finalScore: number;
  freqBoost?: number;
  hostnameBoost?: number;
  pathBoost?: number;
  similarityScore?: number;
  merged?: string;
}



// CSV types
export interface CSVOptions {
  headers: string[];
  headerDescriptions?: Record<string, string>;
  maxResults?: number;
  includeSource?: boolean;
  searchDepth?: number;
}

export interface CSVResult {
  csv: string;
  rawData: Record<string, any>[];
  sources: string[];
}

// Token tracking
export interface TokenUsage {
  tool: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

// Combined search engine types
export interface CSVSearchEngineOptions {
  crawlerOptions?: CrawlOptions;
  processorOptions?: ProcessorOptions;
  searchOptions?: SearchOptions;
  extractionOptions?: ExtractionOptions;
  csvOptions?: CSVOptions;
}
