/**
 * Query Processor
 *
 * Uses Gemini Pro to expand search queries with synonyms and related terms.
 * This improves search results by capturing a wider range of relevant content.
 */

import axios from 'axios';
import { ProcessedQuery } from '../types';

/**
 * Options for the Query Processor
 */
export interface QueryProcessorOptions {
  /**
   * Gemini Pro API key (optional)
   * If not provided, will use local fallback methods
   */
  apiKey?: string;

  /**
   * Maximum number of synonyms to include per term
   */
  maxSynonymsPerTerm?: number;

  /**
   * Maximum number of related concepts to include
   */
  maxRelatedConcepts?: number;

  /**
   * Whether to include alternative phrasings of the query
   */
  includeAlternativePhrases?: boolean;

  /**
   * Temperature for Gemini Pro generation (0.0 to 1.0)
   * Lower values are more deterministic, higher values more creative
   */
  temperature?: number;
}

/**
 * Default options for the Query Processor
 */
const DEFAULT_OPTIONS: QueryProcessorOptions = {
  maxSynonymsPerTerm: 3,
  maxRelatedConcepts: 5,
  includeAlternativePhrases: true,
  temperature: 0.2
};

/**
 * Query Processor class
 * Uses Gemini Pro to expand search queries with synonyms and related terms
 */
export class QueryProcessor {
  private options: QueryProcessorOptions;

  /**
   * Constructor
   * @param options Options for the Query Processor
   */
  constructor(options: QueryProcessorOptions = {}) {
    this.options = {
      ...DEFAULT_OPTIONS,
      ...options
    };
  }

  /**
   * Process a query to expand it with synonyms and related terms
   * @param query The original search query
   * @returns Processed query with expansions
   */
  async processQuery(query: string): Promise<ProcessedQuery> {
    console.log(`Processing query: "${query}"`);

    try {
      // If we have an API key, use Gemini Pro
      if (this.options.apiKey) {
        return await this.expandQueryWithGemini(query);
      } else {
        // Otherwise, use local fallback
        console.log('No Gemini API key provided, using local fallback');
        return this.localQueryProcessing(query);
      }
    } catch (error) {
      console.error('Error processing query:', error);
      // If anything fails, return a basic processed query
      return this.createBasicProcessedQuery(query);
    }
  }

  /**
   * Expand a query using Gemini Pro
   * @param query The original search query
   * @returns Processed query with expansions from Gemini
   */
  private async expandQueryWithGemini(query: string): Promise<ProcessedQuery> {
    // Create the prompt for Gemini Pro
    const prompt = this.createGeminiPrompt(query);

    try {
      // Call Gemini Pro API
      const response = await this.callGeminiApi(prompt);

      // Parse the response
      return this.parseGeminiResponse(response, query);
    } catch (error) {
      console.error('Error calling Gemini API:', error);
      // Fall back to local processing
      return this.localQueryProcessing(query);
    }
  }

  /**
   * Create a prompt for Gemini
   * @param query The original search query
   * @returns Prompt for Gemini
   */
  private createGeminiPrompt(query: string): string {
    return `
      You are a query expansion expert for a search engine. Your task is to expand this search query with synonyms and related terms to improve search results.

      Query: "${query}"

      Please provide:
      1. A list of synonyms for key terms in the query (identify each important term and provide 3-5 synonyms for each)
      2. Related concepts that might be relevant to the query (5-8 concepts)
      3. Different ways to phrase the same query (3-4 alternative phrasings)
      4. Specific entities mentioned in the query and their alternatives

      Format the response ONLY as JSON with these sections:
      {
        "synonyms": {
          "term1": ["synonym1", "synonym2", "synonym3"],
          "term2": ["synonym1", "synonym2", "synonym3"]
        },
        "relatedConcepts": ["concept1", "concept2", "concept3", "concept4", "concept5"],
        "alternativePhrases": ["phrase1", "phrase2", "phrase3"],
        "entities": ["entity1", "entity2"]
      }

      Keep the response focused and relevant to the original query intent. Do not include any explanations or text outside the JSON structure.
    `;
  }

  /**
   * Call the Gemini API
   * @param prompt The prompt to send to Gemini
   * @returns Raw response from Gemini
   */
  private async callGeminiApi(prompt: string): Promise<string> {
    const apiKey = this.options.apiKey;
    if (!apiKey) {
      throw new Error('Gemini API key is required');
    }

    // Use the Gemini 2.5 Pro Preview model
    const model = 'gemini-2.5-pro-preview-03-25';
    console.log(`Calling Gemini API with model: ${model}...`);
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    try {
      const response = await axios.post(url, {
        contents: [
          {
            parts: [
              {
                text: prompt
              }
            ]
          }
        ],
        generationConfig: {
          temperature: this.options.temperature,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024
        }
      });

      // Extract the text from the response
      const responseText = response.data.candidates[0].content.parts[0].text;
      console.log('Gemini API response received');
      return responseText;
    } catch (error: any) {
      // Log detailed error information
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error('Gemini API error response:', {
          status: error.response.status,
          data: error.response.data
        });
      } else if (error.request) {
        // The request was made but no response was received
        console.error('Gemini API no response:', error.request);
      } else {
        // Something happened in setting up the request that triggered an Error
        console.error('Gemini API error:', error.message);
      }

      throw new Error(`Failed to call Gemini API: ${error.message}`);
    }
  }

  /**
   * Parse the response from Gemini Pro
   * @param response Raw response from Gemini
   * @param originalQuery The original search query
   * @returns Processed query with expansions
   */
  private parseGeminiResponse(response: string, originalQuery: string): ProcessedQuery {
    try {
      console.log('Parsing Gemini response...');

      // Extract JSON from the response (in case there's text before or after)
      const jsonRegex = /```(?:json)?([\s\S]*?)```|\{[\s\S]*\}/;
      const jsonMatch = response.match(jsonRegex);

      if (!jsonMatch) {
        console.error('No JSON found in Gemini response');
        console.log('Raw response:', response);
        throw new Error('No JSON found in Gemini response');
      }

      // If the match is in a code block, use the content of the code block
      // Otherwise, use the entire match
      let jsonStr = jsonMatch[1] ? jsonMatch[1].trim() : jsonMatch[0];

      // Make sure the string starts with { and ends with }
      if (!jsonStr.startsWith('{')) {
        jsonStr = '{' + jsonStr;
      }
      if (!jsonStr.endsWith('}')) {
        jsonStr = jsonStr + '}';
      }

      console.log('Extracted JSON:', jsonStr);

      // Parse the JSON
      const parsed = JSON.parse(jsonStr);

      // Extract synonyms as a flat array
      const synonymsMap = parsed.synonyms || {};
      const synonyms: string[][] = Object.values(synonymsMap);

      // Limit the number of related concepts
      const relatedConcepts = (parsed.relatedConcepts || [])
        .slice(0, this.options.maxRelatedConcepts);

      // Limit the number of alternative phrases
      const alternativePhrases = (parsed.alternativePhrases || [])
        .slice(0, 3);

      // Extract entities
      const entities = parsed.entities || [];

      // Build the expanded query
      const expandedQuery = this.buildExpandedQuery(
        originalQuery,
        synonyms,
        relatedConcepts
      );

      return {
        original: originalQuery,
        synonyms,
        relatedConcepts,
        alternativePhrases,
        entities,
        expandedQuery
      };
    } catch (error) {
      console.error('Error parsing Gemini response:', error);
      console.log('Raw response:', response);
      return this.createBasicProcessedQuery(originalQuery);
    }
  }

  /**
   * Build an expanded query string from the processed components
   * @param original Original query
   * @param synonyms Synonyms for terms in the query
   * @param relatedConcepts Related concepts
   * @returns Expanded query string
   */
  private buildExpandedQuery(
    original: string,
    synonyms: string[][],
    relatedConcepts: string[]
  ): string {
    // Start with the original query
    const queryParts = [original];

    // Add synonyms (flattened)
    const flatSynonyms = synonyms.flat().filter(s => s.trim() !== '');
    if (flatSynonyms.length > 0) {
      queryParts.push(...flatSynonyms);
    }

    // Add a few related concepts
    const topRelatedConcepts = relatedConcepts
      .slice(0, 3)
      .filter(c => c.trim() !== '');
    if (topRelatedConcepts.length > 0) {
      queryParts.push(...topRelatedConcepts);
    }

    // Join with OR for search engines
    return queryParts.join(' OR ');
  }

  /**
   * Local fallback for query processing when Gemini is unavailable
   * @param query The original search query
   * @returns Processed query with basic expansions
   */
  private localQueryProcessing(query: string): ProcessedQuery {
    // Split the query into terms
    const terms = query.split(/\s+/).filter(term => term.length > 2);

    // Create basic synonyms for each term
    const synonyms: string[][] = terms.map(term => {
      return this.getBasicSynonyms(term);
    });

    // Generate some related concepts
    const relatedConcepts = this.generateBasicRelatedConcepts(query, terms);

    // Build the expanded query
    const expandedQuery = this.buildExpandedQuery(
      query,
      synonyms,
      relatedConcepts
    );

    return {
      original: query,
      synonyms,
      relatedConcepts,
      alternativePhrases: [query],
      entities: terms,
      expandedQuery
    };
  }

  /**
   * Get basic synonyms for a term using simple rules
   * @param term The term to find synonyms for
   * @returns Array of synonyms
   */
  private getBasicSynonyms(term: string): string[] {
    const synonyms: string[] = [];
    const lowerTerm = term.toLowerCase();

    // Add plural/singular forms
    if (lowerTerm.endsWith('s')) {
      synonyms.push(lowerTerm.slice(0, -1));
    } else {
      synonyms.push(lowerTerm + 's');
    }

    // Add common prefixes/suffixes
    if (!lowerTerm.startsWith('un')) {
      synonyms.push('un' + lowerTerm);
    }

    if (!lowerTerm.endsWith('ing') && !lowerTerm.endsWith('ed')) {
      if (lowerTerm.endsWith('e')) {
        synonyms.push(lowerTerm + 'd');
        synonyms.push(lowerTerm.slice(0, -1) + 'ing');
      } else {
        synonyms.push(lowerTerm + 'ed');
        synonyms.push(lowerTerm + 'ing');
      }
    }

    // Some common word pairs (very basic)
    const commonPairs: Record<string, string[]> = {
      'good': ['great', 'excellent', 'best'],
      'bad': ['poor', 'terrible', 'worst'],
      'big': ['large', 'huge', 'enormous'],
      'small': ['tiny', 'little', 'compact'],
      'fast': ['quick', 'rapid', 'swift'],
      'slow': ['sluggish', 'gradual', 'leisurely'],
      'buy': ['purchase', 'acquire', 'get'],
      'sell': ['offer', 'trade', 'market'],
      'car': ['vehicle', 'automobile', 'truck'],
      'house': ['home', 'residence', 'building'],
      'job': ['work', 'career', 'position'],
      'money': ['cash', 'funds', 'currency'],
      'business': ['company', 'firm', 'enterprise'],
      'person': ['individual', 'people', 'user']
    };

    // Add common synonyms if we have them
    if (lowerTerm in commonPairs) {
      synonyms.push(...commonPairs[lowerTerm]);
    }

    // Remove duplicates and the original term
    return [...new Set(synonyms)]
      .filter(s => s.toLowerCase() !== lowerTerm)
      .slice(0, this.options.maxSynonymsPerTerm);
  }

  /**
   * Generate basic related concepts for a query
   * @param query The original query
   * @param terms Terms in the query
   * @returns Array of related concepts
   */
  private generateBasicRelatedConcepts(query: string, terms: string[]): string[] {
    const concepts: string[] = [];
    const lowerQuery = query.toLowerCase();

    // Domain-specific related concepts
    const domainConcepts: Record<string, string[]> = {
      'business': ['company', 'startup', 'entrepreneur', 'market', 'industry'],
      'technology': ['software', 'hardware', 'digital', 'innovation', 'tech'],
      'finance': ['money', 'investment', 'banking', 'capital', 'funding'],
      'health': ['medical', 'wellness', 'healthcare', 'fitness', 'treatment'],
      'education': ['learning', 'school', 'teaching', 'academic', 'training'],
      'marketing': ['advertising', 'promotion', 'branding', 'sales', 'market'],
      'science': ['research', 'discovery', 'laboratory', 'experiment', 'study'],
      'art': ['design', 'creative', 'artistic', 'visual', 'aesthetic']
    };

    // Check if query contains any domain keywords
    for (const [domain, relatedTerms] of Object.entries(domainConcepts)) {
      if (lowerQuery.includes(domain)) {
        concepts.push(...relatedTerms);
        break;
      }
    }

    // Add some generic related concepts based on query structure
    if (lowerQuery.includes('how to')) {
      concepts.push('guide', 'tutorial', 'instructions', 'steps');
    } else if (lowerQuery.includes('what is')) {
      concepts.push('definition', 'explanation', 'meaning', 'description');
    } else if (lowerQuery.includes('best')) {
      concepts.push('top', 'recommended', 'highest rated', 'premium');
    }

    // If we have multiple terms, create combinations
    if (terms.length >= 2) {
      for (let i = 0; i < terms.length - 1; i++) {
        concepts.push(`${terms[i]} and ${terms[i + 1]}`);
      }
    }

    // Remove duplicates and limit
    return [...new Set(concepts)]
      .slice(0, this.options.maxRelatedConcepts);
  }

  /**
   * Create a basic processed query with minimal processing
   * @param query The original query
   * @returns Basic processed query
   */
  private createBasicProcessedQuery(query: string): ProcessedQuery {
    return {
      original: query,
      synonyms: [],
      relatedConcepts: [],
      alternativePhrases: [query],
      entities: query.split(/\s+/).filter(term => term.length > 2),
      expandedQuery: query
    };
  }
}
