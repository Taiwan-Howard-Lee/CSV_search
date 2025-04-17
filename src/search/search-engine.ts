/**
 * Search Engine
 * 
 * Core search engine component that implements ranking algorithms and search strategies.
 * Uses TF-IDF and BM25 for relevance scoring and supports different search strategies.
 */

import { EnhancedCrawler } from '../crawler/enhanced-crawler';
import { ContentProcessor } from '../processor/content-processor';
import { QueryProcessor } from '../query/query-processor';
import { 
  SearchOptions, 
  SearchResult, 
  RankedSearchResult, 
  ProcessedQuery,
  ProcessedContent,
  CrawlResult
} from '../types';

/**
 * Options for the Search Engine
 */
export interface SearchEngineOptions {
  /**
   * Gemini API key for query expansion
   */
  geminiApiKey?: string;
  
  /**
   * Options for the crawler
   */
  crawlerOptions?: any;
  
  /**
   * Options for the content processor
   */
  processorOptions?: any;
  
  /**
   * Maximum number of results to return
   */
  maxResults?: number;
  
  /**
   * Whether to use BM25 (true) or TF-IDF (false) for ranking
   */
  useBM25?: boolean;
  
  /**
   * BM25 parameters
   */
  bm25Params?: {
    k1?: number; // Term frequency saturation parameter
    b?: number;  // Document length normalization parameter
  };
}

/**
 * Default options for the Search Engine
 */
const DEFAULT_OPTIONS: SearchEngineOptions = {
  maxResults: 10,
  useBM25: true,
  bm25Params: {
    k1: 1.2,
    b: 0.75
  }
};

/**
 * Search Engine class
 * Implements ranking algorithms and search strategies
 */
export class SearchEngine {
  private options: SearchEngineOptions;
  private crawler: EnhancedCrawler;
  private processor: ContentProcessor;
  private queryProcessor: QueryProcessor;
  
  // Cache for document frequencies
  private documentFrequencies: Map<string, number> = new Map();
  private documentCount: number = 0;
  private averageDocumentLength: number = 0;
  
  /**
   * Constructor
   * @param options Options for the Search Engine
   */
  constructor(options: SearchEngineOptions = {}) {
    this.options = {
      ...DEFAULT_OPTIONS,
      ...options
    };
    
    // Initialize components
    this.crawler = new EnhancedCrawler(options.crawlerOptions);
    this.processor = new ContentProcessor(options.processorOptions);
    this.queryProcessor = new QueryProcessor({
      apiKey: options.geminiApiKey
    });
  }
  
  /**
   * Search for content based on a query
   * @param query Search query
   * @param options Search options
   * @returns Array of search results
   */
  async search(query: string, options: SearchOptions = {}): Promise<SearchResult[]> {
    console.log(`Searching for: ${query}`);
    
    try {
      // Process the query with Gemini to expand it with synonyms and related terms
      const processedQuery = await this.queryProcessor.processQuery(query);
      console.log(`Expanded query: ${processedQuery.expandedQuery}`);
      
      // Crawl the web for relevant content
      const crawlResults = await this.crawler.searchCrawl(
        processedQuery.expandedQuery,
        options.maxResults || this.options.maxResults
      );
      console.log(`Found ${crawlResults.length} results from crawler`);
      
      // Process the crawled content
      const processedContents: ProcessedContent[] = [];
      for (const result of crawlResults) {
        try {
          const processed = await this.processor.process(result);
          processedContents.push(processed);
        } catch (error) {
          console.error(`Error processing content from ${result.url}:`, error);
        }
      }
      console.log(`Processed ${processedContents.length} results`);
      
      // Update document statistics for ranking
      this.updateDocumentStatistics(processedContents);
      
      // Rank the results
      const rankedResults = this.rankResults(processedContents, processedQuery);
      console.log(`Ranked ${rankedResults.length} results`);
      
      // Return the top results
      return rankedResults.slice(0, options.maxResults || this.options.maxResults);
    } catch (error) {
      console.error('Error searching:', error);
      throw error;
    }
  }
  
  /**
   * Perform a deep search with more thorough crawling
   * @param query Search query
   * @param options Search options
   * @returns Array of search results
   */
  async deepSearch(query: string, options: SearchOptions = {}): Promise<SearchResult[]> {
    console.log(`Performing deep search for: ${query}`);
    
    try {
      // Process the query with Gemini to expand it with synonyms and related terms
      const processedQuery = await this.queryProcessor.processQuery(query);
      console.log(`Expanded query: ${processedQuery.expandedQuery}`);
      
      // For deep search, we'll crawl starting from search results
      const searchResults = await this.crawler.searchCrawl(
        processedQuery.expandedQuery,
        5 // Limit initial search results
      );
      
      // Extract URLs from search results
      const startUrls = searchResults.map(result => result.url);
      console.log(`Starting deep crawl from ${startUrls.length} URLs`);
      
      // Perform deep crawling from each URL
      const allCrawlResults: CrawlResult[] = [...searchResults];
      for (const url of startUrls) {
        try {
          const deepResults = await this.crawler.crawl(url, 2); // Crawl to depth 2
          allCrawlResults.push(...deepResults);
        } catch (error) {
          console.error(`Error deep crawling ${url}:`, error);
        }
      }
      
      // Deduplicate results by URL
      const uniqueUrls = new Set<string>();
      const uniqueResults: CrawlResult[] = [];
      for (const result of allCrawlResults) {
        if (!uniqueUrls.has(result.url)) {
          uniqueUrls.add(result.url);
          uniqueResults.push(result);
        }
      }
      console.log(`Found ${uniqueResults.length} unique results from deep crawl`);
      
      // Process the crawled content
      const processedContents: ProcessedContent[] = [];
      for (const result of uniqueResults) {
        try {
          const processed = await this.processor.process(result);
          processedContents.push(processed);
        } catch (error) {
          console.error(`Error processing content from ${result.url}:`, error);
        }
      }
      console.log(`Processed ${processedContents.length} results`);
      
      // Update document statistics for ranking
      this.updateDocumentStatistics(processedContents);
      
      // Rank the results
      const rankedResults = this.rankResults(processedContents, processedQuery);
      console.log(`Ranked ${rankedResults.length} results`);
      
      // Return the top results
      return rankedResults.slice(0, options.maxResults || this.options.maxResults);
    } catch (error) {
      console.error('Error performing deep search:', error);
      throw error;
    }
  }
  
  /**
   * Update document statistics for ranking
   * @param documents Processed documents
   */
  private updateDocumentStatistics(documents: ProcessedContent[]): void {
    // Update document count
    this.documentCount = documents.length;
    
    // Calculate average document length
    let totalLength = 0;
    for (const doc of documents) {
      totalLength += this.tokenize(doc.text).length;
    }
    this.averageDocumentLength = totalLength / Math.max(1, this.documentCount);
    
    // Update document frequencies
    this.documentFrequencies.clear();
    for (const doc of documents) {
      const terms = new Set(this.tokenize(doc.text));
      for (const term of terms) {
        this.documentFrequencies.set(
          term,
          (this.documentFrequencies.get(term) || 0) + 1
        );
      }
    }
  }
  
  /**
   * Rank search results by relevance
   * @param documents Processed documents
   * @param query Processed query
   * @returns Ranked search results
   */
  private rankResults(documents: ProcessedContent[], query: ProcessedQuery): RankedSearchResult[] {
    // Choose ranking algorithm based on options
    const rankingFunction = this.options.useBM25
      ? this.calculateBM25Score.bind(this)
      : this.calculateTFIDFScore.bind(this);
    
    // Calculate scores for each document
    const results: RankedSearchResult[] = documents.map(doc => {
      // Calculate relevance score
      const score = rankingFunction(doc, query);
      
      // Calculate URL-based boosts
      const urlBoosts = this.calculateURLBoosts(doc.url, query);
      
      // Calculate final score with boosts
      const finalScore = score * (1 + urlBoosts.hostnameBoost + urlBoosts.pathBoost);
      
      // Create snippet
      const snippet = this.createSnippet(doc, query);
      
      return {
        url: doc.url,
        title: doc.title,
        snippet,
        score,
        finalScore,
        ...urlBoosts
      };
    });
    
    // Sort by final score (descending)
    return results.sort((a, b) => b.finalScore - a.finalScore);
  }
  
  /**
   * Calculate TF-IDF score for a document
   * @param document Processed document
   * @param query Processed query
   * @returns TF-IDF score
   */
  private calculateTFIDFScore(document: ProcessedContent, query: ProcessedQuery): number {
    const docText = document.text;
    const docTerms = this.tokenize(docText);
    const docLength = docTerms.length;
    
    // Get all query terms (original and synonyms)
    const queryTerms = this.getAllQueryTerms(query);
    
    let score = 0;
    
    // Calculate TF-IDF for each query term
    for (const term of queryTerms) {
      // Term frequency in document
      const tf = this.calculateTermFrequency(term, docTerms);
      
      // Inverse document frequency
      const idf = this.calculateInverseDocumentFrequency(term);
      
      // Add to score
      score += tf * idf;
    }
    
    // Normalize by document length
    return score / Math.sqrt(docLength);
  }
  
  /**
   * Calculate BM25 score for a document
   * @param document Processed document
   * @param query Processed query
   * @returns BM25 score
   */
  private calculateBM25Score(document: ProcessedContent, query: ProcessedQuery): number {
    const docText = document.text;
    const docTerms = this.tokenize(docText);
    const docLength = docTerms.length;
    
    // Get BM25 parameters
    const k1 = this.options.bm25Params?.k1 || 1.2;
    const b = this.options.bm25Params?.b || 0.75;
    
    // Get all query terms (original and synonyms)
    const queryTerms = this.getAllQueryTerms(query);
    
    let score = 0;
    
    // Calculate BM25 for each query term
    for (const term of queryTerms) {
      // Term frequency in document
      const tf = this.calculateTermFrequency(term, docTerms);
      
      // Inverse document frequency
      const idf = this.calculateInverseDocumentFrequency(term);
      
      // Document length normalization
      const normalization = 1 - b + b * (docLength / this.averageDocumentLength);
      
      // BM25 formula
      const termScore = idf * ((tf * (k1 + 1)) / (tf + k1 * normalization));
      
      // Add to score
      score += termScore;
    }
    
    return score;
  }
  
  /**
   * Calculate term frequency in a document
   * @param term Term to calculate frequency for
   * @param docTerms Tokenized document terms
   * @returns Term frequency
   */
  private calculateTermFrequency(term: string, docTerms: string[]): number {
    let count = 0;
    for (const docTerm of docTerms) {
      if (docTerm.toLowerCase() === term.toLowerCase()) {
        count++;
      }
    }
    return count;
  }
  
  /**
   * Calculate inverse document frequency for a term
   * @param term Term to calculate IDF for
   * @returns Inverse document frequency
   */
  private calculateInverseDocumentFrequency(term: string): number {
    const docFreq = this.documentFrequencies.get(term.toLowerCase()) || 0;
    return Math.log(1 + (this.documentCount / (docFreq + 1)));
  }
  
  /**
   * Calculate URL-based boosts
   * @param url URL to calculate boosts for
   * @param query Processed query
   * @returns URL boosts
   */
  private calculateURLBoosts(url: string, query: ProcessedQuery): {
    hostnameBoost: number;
    pathBoost: number;
  } {
    try {
      const urlObj = new URL(url);
      const hostname = urlObj.hostname.toLowerCase();
      const path = urlObj.pathname.toLowerCase();
      
      // Get all query terms (original and synonyms)
      const queryTerms = this.getAllQueryTerms(query);
      
      // Calculate hostname boost
      let hostnameBoost = 0;
      for (const term of queryTerms) {
        if (hostname.includes(term.toLowerCase())) {
          hostnameBoost += 0.2; // Boost if hostname contains query term
        }
      }
      
      // Calculate path boost
      let pathBoost = 0;
      for (const term of queryTerms) {
        if (path.includes(term.toLowerCase())) {
          pathBoost += 0.1; // Boost if path contains query term
        }
      }
      
      return { hostnameBoost, pathBoost };
    } catch (error) {
      return { hostnameBoost: 0, pathBoost: 0 };
    }
  }
  
  /**
   * Create a snippet from a document
   * @param document Processed document
   * @param query Processed query
   * @returns Snippet
   */
  private createSnippet(document: ProcessedContent, query: ProcessedQuery): string {
    const text = document.text;
    
    // Get all query terms (original and synonyms)
    const queryTerms = this.getAllQueryTerms(query);
    
    // Split text into sentences
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    // Score each sentence based on query terms
    const scoredSentences = sentences.map(sentence => {
      let score = 0;
      for (const term of queryTerms) {
        if (sentence.toLowerCase().includes(term.toLowerCase())) {
          score += 1;
        }
      }
      return { sentence, score };
    });
    
    // Sort sentences by score
    scoredSentences.sort((a, b) => b.score - a.score);
    
    // Take the top sentence as the snippet
    if (scoredSentences.length > 0 && scoredSentences[0].score > 0) {
      let snippet = scoredSentences[0].sentence.trim();
      
      // Truncate if too long
      if (snippet.length > 200) {
        snippet = snippet.substring(0, 197) + '...';
      }
      
      return snippet;
    }
    
    // If no good sentence found, use the beginning of the text
    return text.substring(0, 200) + (text.length > 200 ? '...' : '');
  }
  
  /**
   * Get all terms from a query (original and synonyms)
   * @param query Processed query
   * @returns Array of query terms
   */
  private getAllQueryTerms(query: ProcessedQuery): string[] {
    // Start with original query terms
    const terms = this.tokenize(query.original);
    
    // Add synonyms
    for (const synonymGroup of query.synonyms) {
      terms.push(...synonymGroup);
    }
    
    // Add entities
    terms.push(...query.entities);
    
    // Remove duplicates and filter out short terms
    return [...new Set(terms)]
      .filter(term => term.length > 2)
      .map(term => term.toLowerCase());
  }
  
  /**
   * Tokenize text into terms
   * @param text Text to tokenize
   * @returns Array of terms
   */
  private tokenize(text: string): string[] {
    // Convert to lowercase
    const lowerText = text.toLowerCase();
    
    // Split by non-alphanumeric characters
    const terms = lowerText.split(/[^a-z0-9]+/);
    
    // Filter out empty strings and short terms
    return terms.filter(term => term.length > 2);
  }
}
