/**
 * Data Extractor
 * 
 * Extracts structured data from search results based on user-specified headers.
 * Uses advanced pattern matching and NLP techniques to extract specific data types.
 */

import { SearchResult, ExtractionField, ExtractedData, ExtractionOptions } from '../types';

/**
 * Options for the Data Extractor
 */
export interface DataExtractorOptions {
  /**
   * Whether to use fuzzy matching for extraction
   */
  useFuzzyMatching?: boolean;
  
  /**
   * Confidence threshold for extraction (0.0 to 1.0)
   */
  confidenceThreshold?: number;
  
  /**
   * Whether to include source information in extracted data
   */
  includeSource?: boolean;
  
  /**
   * Whether to include confidence scores in extracted data
   */
  includeConfidence?: boolean;
}

/**
 * Default options for the Data Extractor
 */
const DEFAULT_OPTIONS: DataExtractorOptions = {
  useFuzzyMatching: true,
  confidenceThreshold: 0.6,
  includeSource: true,
  includeConfidence: false
};

/**
 * Data Extractor class
 * Extracts structured data from search results based on user-specified headers
 */
export class DataExtractor {
  private options: DataExtractorOptions;
  
  /**
   * Constructor
   * @param options Options for the Data Extractor
   */
  constructor(options: DataExtractorOptions = {}) {
    this.options = {
      ...DEFAULT_OPTIONS,
      ...options
    };
  }
  
  /**
   * Extract data from search results based on fields
   * @param results Search results to extract data from
   * @param fields Fields to extract
   * @param query Original search query (for context)
   * @returns Array of extracted data
   */
  async extractData(
    results: SearchResult[],
    fields: ExtractionField[],
    query: string
  ): Promise<ExtractedData[]> {
    console.log(`Extracting data for ${fields.length} fields from ${results.length} results`);
    
    // Extract data from each result
    const extractedData: ExtractedData[] = [];
    
    for (const result of results) {
      try {
        // Extract data for this result
        const data = await this.extractDataFromResult(result, fields, query);
        
        // Add to extracted data
        if (data) {
          extractedData.push(data);
        }
      } catch (error) {
        console.error(`Error extracting data from ${result.url}:`, error);
      }
    }
    
    console.log(`Extracted data for ${extractedData.length} results`);
    return extractedData;
  }
  
  /**
   * Extract data from a single search result
   * @param result Search result to extract data from
   * @param fields Fields to extract
   * @param query Original search query (for context)
   * @returns Extracted data or null if extraction failed
   */
  private async extractDataFromResult(
    result: SearchResult,
    fields: ExtractionField[],
    query: string
  ): Promise<ExtractedData | null> {
    // Create data object with source information
    const data: ExtractedData = {
      _source: result.url,
      _title: result.title
    };
    
    // Get text content to extract from
    const content = this.getContentFromResult(result);
    
    // Extract data for each field
    for (const field of fields) {
      try {
        // Extract data for this field
        const { value, confidence } = await this.extractField(field, content, query, result);
        
        // Check confidence threshold
        if (confidence >= (this.options.confidenceThreshold || 0.6)) {
          // Add value to data
          data[field.name] = value;
          
          // Add confidence score if requested
          if (this.options.includeConfidence) {
            data[`${field.name}_confidence`] = confidence.toString();
          }
        } else {
          // Add placeholder for low confidence
          data[field.name] = '';
        }
      } catch (error) {
        console.error(`Error extracting field ${field.name}:`, error);
        data[field.name] = '';
      }
    }
    
    return data;
  }
  
  /**
   * Get content from a search result
   * @param result Search result
   * @returns Content to extract from
   */
  private getContentFromResult(result: SearchResult): string {
    // Combine title and snippet
    return `${result.title}\n${result.snippet}`;
  }
  
  /**
   * Extract a field from content
   * @param field Field to extract
   * @param content Content to extract from
   * @param query Original search query (for context)
   * @param result Full search result (for additional context)
   * @returns Extracted value and confidence
   */
  private async extractField(
    field: ExtractionField,
    content: string,
    query: string,
    result: SearchResult
  ): Promise<{ value: string; confidence: number }> {
    // Normalize field name for matching
    const fieldName = field.name.toLowerCase();
    
    // Try different extraction strategies based on field name
    
    // Company/Organization names
    if (this.isCompanyField(fieldName)) {
      return this.extractCompany(content, field, result);
    }
    
    // Person names
    if (this.isPersonField(fieldName)) {
      return this.extractPerson(content, field);
    }
    
    // Monetary values
    if (this.isMonetaryField(fieldName)) {
      return this.extractMonetary(content, field);
    }
    
    // Dates and years
    if (this.isDateField(fieldName)) {
      return this.extractDate(content, field);
    }
    
    // Locations
    if (this.isLocationField(fieldName)) {
      return this.extractLocation(content, field);
    }
    
    // Industries/Sectors
    if (this.isIndustryField(fieldName)) {
      return this.extractIndustry(content, field, query);
    }
    
    // Numbers and counts
    if (this.isNumberField(fieldName)) {
      return this.extractNumber(content, field);
    }
    
    // Descriptions
    if (this.isDescriptionField(fieldName)) {
      return this.extractDescription(content, field, result);
    }
    
    // For unknown fields, use a generic approach
    return this.extractGeneric(content, field);
  }
  
  /**
   * Check if a field is a company/organization field
   * @param fieldName Field name
   * @returns True if it's a company field
   */
  private isCompanyField(fieldName: string): boolean {
    const companyFields = [
      'company', 'organization', 'business', 'startup', 'enterprise',
      'firm', 'corporation', 'brand', 'name'
    ];
    
    return companyFields.some(field => fieldName.includes(field));
  }
  
  /**
   * Extract a company/organization name
   * @param content Content to extract from
   * @param field Field to extract
   * @param result Full search result
   * @returns Extracted value and confidence
   */
  private extractCompany(
    content: string,
    field: ExtractionField,
    result: SearchResult
  ): { value: string; confidence: number } {
    // Try to extract from title first (often more reliable)
    const title = result.title;
    
    // Company names are often at the beginning of titles
    // or followed by specific keywords like "Inc", "LLC", etc.
    
    // Check for company indicators in title
    const companyIndicators = [
      'Inc', 'LLC', 'Ltd', 'Corporation', 'Corp', 'Company', 'Co',
      'GmbH', 'AG', 'SA', 'SRL', 'Pty', 'Limited'
    ];
    
    // Try to find a company name with indicator
    for (const indicator of companyIndicators) {
      const regex = new RegExp(`([\\w\\s&'-]+)\\s+${indicator}[\\s,.]`, 'i');
      const match = title.match(regex);
      if (match && match[1]) {
        return {
          value: match[1].trim(),
          confidence: 0.9
        };
      }
    }
    
    // If no match with indicators, try to extract from beginning of title
    // Assume first 2-3 words might be a company name
    const titleWords = title.split(/\\s+/);
    if (titleWords.length >= 2) {
      const companyName = titleWords.slice(0, Math.min(3, titleWords.length)).join(' ');
      return {
        value: companyName,
        confidence: 0.7
      };
    }
    
    // If all else fails, look for capitalized phrases in content
    const capitalizedPhraseRegex = /([A-Z][a-z]+(?:\\s+[A-Z][a-z]+)+)/g;
    const capitalizedMatches = [...content.matchAll(capitalizedPhraseRegex)];
    
    if (capitalizedMatches.length > 0) {
      // Take the first capitalized phrase
      return {
        value: capitalizedMatches[0][1],
        confidence: 0.6
      };
    }
    
    // Fallback
    return {
      value: 'Unknown Company',
      confidence: 0.3
    };
  }
  
  /**
   * Check if a field is a person field
   * @param fieldName Field name
   * @returns True if it's a person field
   */
  private isPersonField(fieldName: string): boolean {
    const personFields = [
      'person', 'founder', 'ceo', 'executive', 'director',
      'owner', 'president', 'manager', 'lead', 'head'
    ];
    
    return personFields.some(field => fieldName.includes(field));
  }
  
  /**
   * Extract a person name
   * @param content Content to extract from
   * @param field Field to extract
   * @returns Extracted value and confidence
   */
  private extractPerson(
    content: string,
    field: ExtractionField
  ): { value: string; confidence: number } {
    // Look for common name patterns
    // 1. First Last
    // 2. First Middle Last
    // 3. Dr./Mr./Ms. First Last
    
    // Pattern for titles followed by names
    const titledNameRegex = /(Dr\\.|Mr\\.|Ms\\.|Mrs\\.|Prof\\.)\\s+([A-Z][a-z]+(?:\\s+[A-Z][a-z]+){1,2})/g;
    const titledMatches = [...content.matchAll(titledNameRegex)];
    
    if (titledMatches.length > 0) {
      return {
        value: titledMatches[0][0],
        confidence: 0.9
      };
    }
    
    // Pattern for "by First Last" (common in articles)
    const bylineRegex = /by\\s+([A-Z][a-z]+(?:\\s+[A-Z][a-z]+){1,2})/i;
    const bylineMatch = content.match(bylineRegex);
    
    if (bylineMatch && bylineMatch[1]) {
      return {
        value: bylineMatch[1],
        confidence: 0.8
      };
    }
    
    // Pattern for role followed by name
    // e.g., "CEO John Smith" or "founder Jane Doe"
    const roleNameRegex = /(CEO|founder|president|director|chairman)\\s+([A-Z][a-z]+(?:\\s+[A-Z][a-z]+){1,2})/i;
    const roleMatch = content.match(roleNameRegex);
    
    if (roleMatch && roleMatch[2]) {
      return {
        value: roleMatch[2],
        confidence: 0.85
      };
    }
    
    // General pattern for names (capitalized words)
    const nameRegex = /([A-Z][a-z]+(?:\\s+[A-Z][a-z]+){1,2})/g;
    const nameMatches = [...content.matchAll(nameRegex)];
    
    if (nameMatches.length > 0) {
      // Take the first name-like pattern
      return {
        value: nameMatches[0][1],
        confidence: 0.6
      };
    }
    
    // Fallback
    return {
      value: 'Unknown Person',
      confidence: 0.3
    };
  }
  
  /**
   * Check if a field is a monetary field
   * @param fieldName Field name
   * @returns True if it's a monetary field
   */
  private isMonetaryField(fieldName: string): boolean {
    const monetaryFields = [
      'funding', 'investment', 'capital', 'money', 'revenue',
      'income', 'sales', 'price', 'cost', 'budget', 'valuation'
    ];
    
    return monetaryFields.some(field => fieldName.includes(field));
  }
  
  /**
   * Extract a monetary value
   * @param content Content to extract from
   * @param field Field to extract
   * @returns Extracted value and confidence
   */
  private extractMonetary(
    content: string,
    field: ExtractionField
  ): { value: string; confidence: number } {
    // Look for currency symbols followed by numbers
    // $X, $X million, $X billion, X dollars, etc.
    
    // Pattern for dollar amounts
    const dollarRegex = /\\$\\s*([0-9]+(?:\\.[0-9]+)?(?:\\s*(?:million|billion|trillion|m|b|t))?)/gi;
    const dollarMatches = [...content.matchAll(dollarRegex)];
    
    if (dollarMatches.length > 0) {
      return {
        value: dollarMatches[0][0],
        confidence: 0.9
      };
    }
    
    // Pattern for "X dollars/pounds/euros"
    const currencyWordRegex = /([0-9]+(?:\\.[0-9]+)?(?:\\s*(?:million|billion|trillion|m|b|t))?)\\s*(?:dollars|pounds|euros)/gi;
    const currencyWordMatches = [...content.matchAll(currencyWordRegex)];
    
    if (currencyWordMatches.length > 0) {
      return {
        value: currencyWordMatches[0][0],
        confidence: 0.85
      };
    }
    
    // Pattern for other currency symbols
    const otherCurrencyRegex = /([€£¥]\\s*[0-9]+(?:\\.[0-9]+)?(?:\\s*(?:million|billion|trillion|m|b|t))?)/gi;
    const otherCurrencyMatches = [...content.matchAll(otherCurrencyRegex)];
    
    if (otherCurrencyMatches.length > 0) {
      return {
        value: otherCurrencyMatches[0][0],
        confidence: 0.85
      };
    }
    
    // Fallback: Look for numbers followed by million/billion
    const amountRegex = /([0-9]+(?:\\.[0-9]+)?\\s*(?:million|billion|trillion|m|b|t))/gi;
    const amountMatches = [...content.matchAll(amountRegex)];
    
    if (amountMatches.length > 0) {
      return {
        value: `$${amountMatches[0][0]}`,
        confidence: 0.7
      };
    }
    
    // Fallback
    return {
      value: 'Unknown Amount',
      confidence: 0.3
    };
  }
  
  /**
   * Check if a field is a date field
   * @param fieldName Field name
   * @returns True if it's a date field
   */
  private isDateField(fieldName: string): boolean {
    const dateFields = [
      'date', 'year', 'founded', 'established', 'launched',
      'started', 'created', 'inception', 'beginning', 'birthday'
    ];
    
    return dateFields.some(field => fieldName.includes(field));
  }
  
  /**
   * Extract a date or year
   * @param content Content to extract from
   * @param field Field to extract
   * @returns Extracted value and confidence
   */
  private extractDate(
    content: string,
    field: ExtractionField
  ): { value: string; confidence: number } {
    // Look for different date formats
    
    // Full date format (MM/DD/YYYY or DD/MM/YYYY)
    const fullDateRegex = /(0?[1-9]|1[0-2])[\\/-](0?[1-9]|[12][0-9]|3[01])[\\/-](19|20)\\d{2}/g;
    const fullDateMatches = [...content.matchAll(fullDateRegex)];
    
    if (fullDateMatches.length > 0) {
      return {
        value: fullDateMatches[0][0],
        confidence: 0.9
      };
    }
    
    // ISO date format (YYYY-MM-DD)
    const isoDateRegex = /(19|20)\\d{2}-(0?[1-9]|1[0-2])-(0?[1-9]|[12][0-9]|3[01])/g;
    const isoDateMatches = [...content.matchAll(isoDateRegex)];
    
    if (isoDateMatches.length > 0) {
      return {
        value: isoDateMatches[0][0],
        confidence: 0.9
      };
    }
    
    // Month Year format (January 2020)
    const monthYearRegex = /(January|February|March|April|May|June|July|August|September|October|November|December)\\s+(19|20)\\d{2}/gi;
    const monthYearMatches = [...content.matchAll(monthYearRegex)];
    
    if (monthYearMatches.length > 0) {
      return {
        value: monthYearMatches[0][0],
        confidence: 0.85
      };
    }
    
    // Year only (2020)
    const yearRegex = /\\b(19|20)\\d{2}\\b/g;
    const yearMatches = [...content.matchAll(yearRegex)];
    
    if (yearMatches.length > 0) {
      return {
        value: yearMatches[0][0],
        confidence: 0.8
      };
    }
    
    // Fallback
    return {
      value: 'Unknown Date',
      confidence: 0.3
    };
  }
  
  /**
   * Check if a field is a location field
   * @param fieldName Field name
   * @returns True if it's a location field
   */
  private isLocationField(fieldName: string): boolean {
    const locationFields = [
      'location', 'address', 'headquarters', 'hq', 'office',
      'city', 'state', 'country', 'region', 'place'
    ];
    
    return locationFields.some(field => fieldName.includes(field));
  }
  
  /**
   * Extract a location
   * @param content Content to extract from
   * @param field Field to extract
   * @returns Extracted value and confidence
   */
  private extractLocation(
    content: string,
    field: ExtractionField
  ): { value: string; confidence: number } {
    // Common locations (cities, countries)
    const commonLocations = [
      // Major cities
      'New York', 'San Francisco', 'London', 'Tokyo', 'Berlin', 'Paris',
      'Beijing', 'Shanghai', 'Singapore', 'Hong Kong', 'Sydney', 'Toronto',
      'Chicago', 'Los Angeles', 'Seattle', 'Boston', 'Austin', 'Miami',
      
      // Countries
      'United States', 'USA', 'UK', 'China', 'Japan', 'Germany',
      'France', 'Canada', 'Australia', 'India', 'Brazil', 'Russia',
      'Italy', 'Spain', 'Mexico', 'South Korea', 'Indonesia', 'Netherlands',
      'Switzerland', 'Sweden', 'Israel', 'Singapore'
    ];
    
    // Check for common locations in content
    for (const location of commonLocations) {
      if (content.includes(location)) {
        return {
          value: location,
          confidence: 0.85
        };
      }
    }
    
    // Pattern for "based in X" or "headquartered in X"
    const basedInRegex = /(?:based|headquartered|located)\\s+in\\s+([A-Z][a-zA-Z\\s]+?)(?:[,.]|\\s+(?:and|with|since))/i;
    const basedInMatch = content.match(basedInRegex);
    
    if (basedInMatch && basedInMatch[1]) {
      return {
        value: basedInMatch[1].trim(),
        confidence: 0.9
      };
    }
    
    // Pattern for "X-based" (e.g., "San Francisco-based")
    const basedRegex = /([A-Z][a-zA-Z\\s]+?)-based/i;
    const basedMatch = content.match(basedRegex);
    
    if (basedMatch && basedMatch[1]) {
      return {
        value: basedMatch[1].trim(),
        confidence: 0.85
      };
    }
    
    // Fallback: Look for capitalized words that might be locations
    const capitalizedRegex = /\\b([A-Z][a-zA-Z]+)\\b/g;
    const capitalizedMatches = [...content.matchAll(capitalizedRegex)];
    
    if (capitalizedMatches.length > 0) {
      // Take the first capitalized word
      return {
        value: capitalizedMatches[0][1],
        confidence: 0.5
      };
    }
    
    // Fallback
    return {
      value: 'Unknown Location',
      confidence: 0.3
    };
  }
  
  /**
   * Check if a field is an industry field
   * @param fieldName Field name
   * @returns True if it's an industry field
   */
  private isIndustryField(fieldName: string): boolean {
    const industryFields = [
      'industry', 'sector', 'field', 'domain', 'market',
      'category', 'vertical', 'niche', 'area'
    ];
    
    return industryFields.some(field => fieldName.includes(field));
  }
  
  /**
   * Extract an industry or sector
   * @param content Content to extract from
   * @param field Field to extract
   * @param query Original search query (for context)
   * @returns Extracted value and confidence
   */
  private extractIndustry(
    content: string,
    field: ExtractionField,
    query: string
  ): { value: string; confidence: number } {
    // Common industries
    const commonIndustries = [
      'Technology', 'Healthcare', 'Finance', 'Education', 'Retail',
      'Manufacturing', 'Transportation', 'Energy', 'Media', 'Entertainment',
      'Telecommunications', 'Real Estate', 'Agriculture', 'Construction',
      'Hospitality', 'Automotive', 'Aerospace', 'Pharmaceuticals',
      'Biotechnology', 'Insurance', 'Banking', 'E-commerce', 'Software',
      'Hardware', 'AI', 'Artificial Intelligence', 'Machine Learning',
      'Blockchain', 'Cryptocurrency', 'IoT', 'Internet of Things',
      'Cloud Computing', 'Cybersecurity', 'Data Analytics', 'Big Data',
      'Robotics', 'Automation', 'Clean Energy', 'Renewable Energy',
      'Solar Energy', 'Wind Energy', 'Electric Vehicles', 'Gaming',
      'Social Media', 'Digital Marketing', 'Advertising', 'Consulting',
      'Legal Services', 'Food and Beverage', 'Fashion', 'Cosmetics',
      'Fitness', 'Sports', 'Travel', 'Tourism', 'Logistics', 'Supply Chain'
    ];
    
    // Check for common industries in content
    for (const industry of commonIndustries) {
      if (content.includes(industry)) {
        return {
          value: industry,
          confidence: 0.85
        };
      }
    }
    
    // Pattern for "in the X industry" or "in the X sector"
    const industryRegex = /in\\s+the\\s+([a-zA-Z\\s]+?)\\s+(?:industry|sector|market|field)/i;
    const industryMatch = content.match(industryRegex);
    
    if (industryMatch && industryMatch[1]) {
      return {
        value: industryMatch[1].trim(),
        confidence: 0.9
      };
    }
    
    // Use the query as a hint for the industry
    // If the query contains industry-related terms, use them
    for (const industry of commonIndustries) {
      if (query.includes(industry.toLowerCase())) {
        return {
          value: industry,
          confidence: 0.7
        };
      }
    }
    
    // Fallback
    return {
      value: 'Technology',
      confidence: 0.4
    };
  }
  
  /**
   * Check if a field is a number field
   * @param fieldName Field name
   * @returns True if it's a number field
   */
  private isNumberField(fieldName: string): boolean {
    const numberFields = [
      'number', 'count', 'amount', 'quantity', 'total',
      'employees', 'staff', 'team', 'size', 'users', 'customers'
    ];
    
    return numberFields.some(field => fieldName.includes(field));
  }
  
  /**
   * Extract a number or count
   * @param content Content to extract from
   * @param field Field to extract
   * @returns Extracted value and confidence
   */
  private extractNumber(
    content: string,
    field: ExtractionField
  ): { value: string; confidence: number } {
    // Pattern for numbers
    const numberRegex = /\\b([0-9,]+)\\b/g;
    const numberMatches = [...content.matchAll(numberRegex)];
    
    if (numberMatches.length > 0) {
      return {
        value: numberMatches[0][1],
        confidence: 0.7
      };
    }
    
    // Pattern for "X employees" or "team of X"
    const employeeRegex = /(\\d+)\\s+(?:employees|staff|team members|people)/i;
    const employeeMatch = content.match(employeeRegex);
    
    if (employeeMatch && employeeMatch[1]) {
      return {
        value: employeeMatch[1],
        confidence: 0.9
      };
    }
    
    // Pattern for "team of X" or "staff of X"
    const teamRegex = /(?:team|staff)\\s+of\\s+(\\d+)/i;
    const teamMatch = content.match(teamRegex);
    
    if (teamMatch && teamMatch[1]) {
      return {
        value: teamMatch[1],
        confidence: 0.85
      };
    }
    
    // Fallback
    return {
      value: '0',
      confidence: 0.3
    };
  }
  
  /**
   * Check if a field is a description field
   * @param fieldName Field name
   * @returns True if it's a description field
   */
  private isDescriptionField(fieldName: string): boolean {
    const descriptionFields = [
      'description', 'about', 'summary', 'overview', 'profile',
      'bio', 'information', 'details', 'background', 'intro'
    ];
    
    return descriptionFields.some(field => fieldName.includes(field));
  }
  
  /**
   * Extract a description
   * @param content Content to extract from
   * @param field Field to extract
   * @param result Full search result
   * @returns Extracted value and confidence
   */
  private extractDescription(
    content: string,
    field: ExtractionField,
    result: SearchResult
  ): { value: string; confidence: number } {
    // For descriptions, use the snippet directly
    return {
      value: result.snippet,
      confidence: 0.9
    };
  }
  
  /**
   * Extract generic data based on field name
   * @param content Content to extract from
   * @param field Field to extract
   * @returns Extracted value and confidence
   */
  private extractGeneric(
    content: string,
    field: ExtractionField
  ): { value: string; confidence: number } {
    // For generic fields, look for patterns like "field: value" or "field is value"
    const fieldName = field.name.toLowerCase();
    
    // Pattern for "field: value"
    const colonRegex = new RegExp(`${fieldName}:\\s*([^\\n.]+)`, 'i');
    const colonMatch = content.match(colonRegex);
    
    if (colonMatch && colonMatch[1]) {
      return {
        value: colonMatch[1].trim(),
        confidence: 0.8
      };
    }
    
    // Pattern for "field is value" or "field are value"
    const isRegex = new RegExp(`${fieldName}\\s+(?:is|are)\\s+([^\\n.]+)`, 'i');
    const isMatch = content.match(isRegex);
    
    if (isMatch && isMatch[1]) {
      return {
        value: isMatch[1].trim(),
        confidence: 0.75
      };
    }
    
    // Fallback: Look for the field name in context
    const contextRegex = new RegExp(`\\b${fieldName}\\b[^\\n.]*?\\b([a-zA-Z0-9]+)\\b`, 'i');
    const contextMatch = content.match(contextRegex);
    
    if (contextMatch && contextMatch[1]) {
      return {
        value: contextMatch[1].trim(),
        confidence: 0.5
      };
    }
    
    // Fallback
    return {
      value: `Unknown ${field.name}`,
      confidence: 0.3
    };
  }
}
