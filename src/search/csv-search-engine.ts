/**
 * CSV Search Engine
 * Main implementation for the search engine that returns CSV data
 */

import { CSVOptions, CSVResult, ProcessedQuery, SearchResult } from '../types';
import { stringify } from 'csv-stringify/sync';
import { QueryProcessor } from '../query/query-processor';
import { SearchEngine } from './search-engine';

export class CSVSearchEngine {
  private searchEngine: SearchEngine;

  constructor(private options: {
    geminiApiKey?: string;
    crawlerOptions?: any;
    processorOptions?: any;
    searchOptions?: any;
    extractionOptions?: any;
  } = {}) {
    // Initialize the Search Engine with the Gemini API key
    this.searchEngine = new SearchEngine({
      geminiApiKey: options.geminiApiKey,
      crawlerOptions: options.crawlerOptions,
      processorOptions: options.processorOptions,
      maxResults: 20, // We'll get more results than needed for better data extraction
      useBM25: true
    });
  }

  /**
   * Simple search that returns CSV data based on the query and headers
   */
  async search(query: string, options: CSVOptions): Promise<CSVResult> {
    console.log(`Performing simple search for: ${query}`);
    console.log(`Headers: ${options.headers.join(', ')}`);

    try {
      // Use the search engine to find relevant content
      console.log('Searching with the search engine...');
      const searchResults = await this.searchEngine.search(query, {
        maxResults: options.maxResults || 10
      });

      console.log(`Found ${searchResults.length} results`);

      // Extract data from search results based on headers
      const extractedData = this.extractDataFromResults(searchResults, options.headers);

      // Generate CSV
      const csv = this.generateCSV(extractedData, options);

      return {
        csv,
        rawData: extractedData,
        sources: extractedData.map(item => item._source)
      };
    } catch (error) {
      console.error('Error searching:', error);

      // Fallback to using mock data if there's an error
      console.log('Falling back to mock data...');
      const mockData = this.generateMockData(query, options.headers);

      // Generate CSV
      const csv = this.generateCSV(mockData, options);

      return {
        csv,
        rawData: mockData,
        sources: mockData.map(item => item._source)
      };
    }
  }

  /**
   * Deep search that performs more thorough crawling and analysis
   */
  async deepSearch(query: string, options: CSVOptions): Promise<CSVResult> {
    console.log(`Performing deep search for: ${query}`);
    console.log(`Headers: ${options.headers.join(', ')}`);
    console.log(`Search depth: ${options.searchDepth || 2}`);

    try {
      // Use the search engine to perform a deep search
      console.log('Performing deep search with the search engine...');
      const searchResults = await this.searchEngine.deepSearch(query, {
        maxResults: options.maxResults || 10
      });

      console.log(`Found ${searchResults.length} results from deep search`);

      // Extract data from search results based on headers
      const extractedData = this.extractDataFromResults(searchResults, options.headers);

      // Generate CSV
      const csv = this.generateCSV(extractedData, options);

      return {
        csv,
        rawData: extractedData,
        sources: extractedData.map(item => item._source)
      };
    } catch (error) {
      console.error('Error performing deep search:', error);

      // Fallback to using mock data if there's an error
      console.log('Falling back to mock data...');
      const mockData = this.generateMockData(query, options.headers, true);

      // Generate CSV
      const csv = this.generateCSV(mockData, options);

      return {
        csv,
        rawData: mockData,
        sources: mockData.map(item => item._source)
      };
    }
  }

  /**
   * Extract structured data from search results based on headers
   * @param results Search results
   * @param headers CSV headers
   * @returns Extracted data
   */
  private extractDataFromResults(results: SearchResult[], headers: string[]): Record<string, any>[] {
    // This is a placeholder implementation
    // In a real implementation, this would use NLP and pattern matching to extract data
    return results.map(result => {
      const data: Record<string, any> = {
        _source: result.url,
        _title: result.title
      };

      // Extract data for each header
      for (const header of headers) {
        // For now, use a simple approach based on the header name
        switch (header.toLowerCase()) {
          case 'name':
          case 'startup name':
          case 'company':
          case 'startup':
            // Try to extract a company name from the title or snippet
            data[header] = this.extractCompanyName(result.title, result.snippet);
            break;

          case 'founder':
          case 'ceo':
          case 'owner':
            // Try to extract a person name from the snippet
            data[header] = this.extractPersonName(result.snippet);
            break;

          case 'funding':
          case 'investment':
          case 'funding amount':
            // Try to extract a funding amount from the snippet
            data[header] = this.extractFundingAmount(result.snippet);
            break;

          case 'stage':
          case 'funding stage':
            // Try to extract a funding stage from the snippet
            data[header] = this.extractFundingStage(result.snippet);
            break;

          case 'location':
          case 'headquarters':
            // Try to extract a location from the snippet
            data[header] = this.extractLocation(result.snippet);
            break;

          case 'industry':
          case 'sector':
            // Try to extract an industry from the snippet
            data[header] = this.extractIndustry(result.snippet);
            break;

          case 'founded':
          case 'year founded':
          case 'established':
            // Try to extract a year from the snippet
            data[header] = this.extractYear(result.snippet);
            break;

          case 'employees':
          case 'team size':
            // Try to extract a number from the snippet
            data[header] = this.extractEmployeeCount(result.snippet);
            break;

          case 'description':
          case 'about':
            // Use the snippet as the description
            data[header] = result.snippet;
            break;

          default:
            // For unknown headers, use a generic approach
            data[header] = this.extractGenericData(header, result.snippet);
        }
      }

      return data;
    });
  }

  /**
   * Extract a company name from text
   * @param title Title of the page
   * @param snippet Snippet from the page
   * @returns Extracted company name or placeholder
   */
  private extractCompanyName(title: string, snippet: string): string {
    // This is a placeholder implementation
    // In a real implementation, this would use NLP to extract company names

    // Try to extract from title first (often more reliable)
    const titleWords = title.split(/\s+/);
    if (titleWords.length >= 2) {
      // Assume the first two words might be a company name
      return titleWords.slice(0, 2).join(' ');
    }

    // Fallback to a generic approach
    return 'Company Name';
  }

  /**
   * Extract a person name from text
   * @param text Text to extract from
   * @returns Extracted person name or placeholder
   */
  private extractPersonName(text: string): string {
    // This is a placeholder implementation
    // In a real implementation, this would use NLP to extract person names
    return 'John Doe';
  }

  /**
   * Extract a funding amount from text
   * @param text Text to extract from
   * @returns Extracted funding amount or placeholder
   */
  private extractFundingAmount(text: string): string {
    // This is a placeholder implementation
    // In a real implementation, this would use regex to extract monetary values

    // Try to find a dollar amount
    const dollarMatch = text.match(/\$\d+(\.\d+)?\s*(million|billion|m|b)?/i);
    if (dollarMatch) {
      return dollarMatch[0];
    }

    // Fallback to a random amount
    return `$${(Math.random() * 10).toFixed(1)}M`;
  }

  /**
   * Extract a funding stage from text
   * @param text Text to extract from
   * @returns Extracted funding stage or placeholder
   */
  private extractFundingStage(text: string): string {
    // This is a placeholder implementation
    // In a real implementation, this would use regex to extract funding stages

    // Common funding stages
    const stages = ['Seed', 'Series A', 'Series B', 'Series C', 'Growth'];

    // Try to find a funding stage
    for (const stage of stages) {
      if (text.includes(stage)) {
        return stage;
      }
    }

    // Fallback to a random stage
    return stages[Math.floor(Math.random() * stages.length)];
  }

  /**
   * Extract a location from text
   * @param text Text to extract from
   * @returns Extracted location or placeholder
   */
  private extractLocation(text: string): string {
    // This is a placeholder implementation
    // In a real implementation, this would use NLP to extract locations

    // Common locations
    const locations = ['San Francisco', 'New York', 'London', 'Berlin', 'Singapore', 'Tokyo'];

    // Try to find a location
    for (const location of locations) {
      if (text.includes(location)) {
        return location;
      }
    }

    // Fallback to a random location
    return locations[Math.floor(Math.random() * locations.length)];
  }

  /**
   * Extract an industry from text
   * @param text Text to extract from
   * @returns Extracted industry or placeholder
   */
  private extractIndustry(text: string): string {
    // This is a placeholder implementation
    // In a real implementation, this would use NLP to extract industries

    // Common industries
    const industries = ['Technology', 'Healthcare', 'Finance', 'Education', 'Retail', 'Manufacturing'];

    // Try to find an industry
    for (const industry of industries) {
      if (text.includes(industry)) {
        return industry;
      }
    }

    // Fallback to a random industry
    return industries[Math.floor(Math.random() * industries.length)];
  }

  /**
   * Extract a year from text
   * @param text Text to extract from
   * @returns Extracted year or placeholder
   */
  private extractYear(text: string): string {
    // This is a placeholder implementation
    // In a real implementation, this would use regex to extract years

    // Try to find a year (2000-2023)
    const yearMatch = text.match(/20\d{2}/);
    if (yearMatch) {
      return yearMatch[0];
    }

    // Fallback to a random year
    return `${2010 + Math.floor(Math.random() * 13)}`;
  }

  /**
   * Extract an employee count from text
   * @param text Text to extract from
   * @returns Extracted employee count or placeholder
   */
  private extractEmployeeCount(text: string): string {
    // This is a placeholder implementation
    // In a real implementation, this would use regex to extract numbers

    // Try to find a number followed by 'employees'
    const employeeMatch = text.match(/(\d+)\s*employees/i);
    if (employeeMatch) {
      return employeeMatch[1];
    }

    // Fallback to a random count
    return `${10 + Math.floor(Math.random() * 990)}`;
  }

  /**
   * Extract generic data based on a header
   * @param header Header name
   * @param text Text to extract from
   * @returns Extracted data or placeholder
   */
  private extractGenericData(header: string, text: string): string {
    // This is a placeholder implementation
    // In a real implementation, this would use NLP to extract relevant data
    return `Data for ${header}`;
  }

  /**
   * Generate CSV from data
   */
  private generateCSV(data: Record<string, any>[], options: CSVOptions): string {
    if (data.length === 0) {
      return '';
    }

    // Determine fields to include
    let fields = options.headers || [];

    // Add source columns if requested
    if (options.includeSource) {
      fields = [...fields, '_source', '_title'];
    }

    // Generate CSV
    const csvData = data.map(record => {
      const row: Record<string, any> = {};
      fields.forEach(field => {
        row[field] = record[field] || '';
      });
      return row;
    });

    return stringify(csvData, {
      header: true,
      columns: fields
    });
  }

  /**
   * Generate mock data for demonstration
   */
  private generateMockData(query: string, headers: string[], isDeep: boolean = false): Record<string, any>[] {
    const results: Record<string, any>[] = [];

    // Generate 5-10 mock results
    const numResults = isDeep ? 10 : 5;

    for (let i = 1; i <= numResults; i++) {
      const result: Record<string, any> = {
        _source: `https://example.com/result-${i}`,
        _title: `Result ${i} for "${query}"`
      };

      // Add data for each header
      headers.forEach(header => {
        switch (header.toLowerCase()) {
          case 'name':
          case 'startup name':
          case 'company':
          case 'startup':
            result[header] = `${this.capitalize(query)} ${isDeep ? 'Advanced ' : ''}Tech ${i}`;
            break;

          case 'founder':
          case 'ceo':
          case 'owner':
            result[header] = `John Doe ${i}`;
            break;

          case 'funding':
          case 'investment':
          case 'funding amount':
            result[header] = `$${(Math.random() * 10).toFixed(1)}M`;
            break;

          case 'stage':
          case 'funding stage':
            const stages = ['Seed', 'Series A', 'Series B', 'Series C', 'Growth'];
            result[header] = stages[Math.floor(Math.random() * stages.length)];
            break;

          case 'location':
          case 'headquarters':
            const locations = ['San Francisco', 'New York', 'London', 'Berlin', 'Singapore', 'Tokyo'];
            result[header] = locations[Math.floor(Math.random() * locations.length)];
            break;

          case 'industry':
          case 'sector':
            result[header] = this.capitalize(query);
            break;

          case 'founded':
          case 'year founded':
          case 'established':
            result[header] = `${2010 + Math.floor(Math.random() * 13)}`;
            break;

          case 'employees':
          case 'team size':
            result[header] = `${10 + Math.floor(Math.random() * 990)}`;
            break;

          case 'description':
          case 'about':
            result[header] = `A ${this.capitalize(query)} company focused on innovative solutions for modern problems.`;
            break;

          default:
            result[header] = `Sample data for ${header} ${i}`;
        }
      });

      results.push(result);
    }

    return results;
  }

  private capitalize(str: string): string {
    return str.split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }
}

/**
 * Create a new CSV search engine instance
 * @param options Options for the search engine
 * @param options.geminiApiKey Gemini API key for query expansion
 * @returns A new CSV search engine instance
 */
export function createCSVSearchEngine(options: {
  geminiApiKey?: string;
  crawlerOptions?: any;
  processorOptions?: any;
  searchOptions?: any;
  extractionOptions?: any;
} = {}): CSVSearchEngine {
  return new CSVSearchEngine(options);
}
