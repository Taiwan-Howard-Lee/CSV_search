/**
 * Schema Detector
 *
 * This class detects and extracts structured data from HTML content
 * using schema.org markup (JSON-LD, Microdata, RDFa).
 */

import * as jsonld from 'jsonld';
import * as microdata from 'microdata-node';
import * as cheerio from 'cheerio';

export interface SchemaDetectorOptions {
  /**
   * Whether to extract JSON-LD data
   */
  extractJsonLd?: boolean;

  /**
   * Whether to extract Microdata
   */
  extractMicrodata?: boolean;

  /**
   * Whether to extract RDFa
   */
  extractRdfa?: boolean;

  /**
   * Whether to normalize extracted data
   */
  normalizeData?: boolean;

  /**
   * Maximum depth for nested objects
   */
  maxDepth?: number;

  /**
   * Schema types to extract (if empty, extract all)
   */
  schemaTypes?: string[];
}

export interface SchemaData {
  /**
   * Type of schema (e.g., Product, Person, Event)
   */
  type: string;

  /**
   * Source of the schema data (JSON-LD, Microdata, RDFa)
   */
  source: 'json-ld' | 'microdata' | 'rdfa';

  /**
   * Extracted properties
   */
  properties: Record<string, any>;

  /**
   * Raw schema data
   */
  raw: any;
}

/**
 * Default options for schema detection
 */
const DEFAULT_OPTIONS: SchemaDetectorOptions = {
  extractJsonLd: true,
  extractMicrodata: true,
  extractRdfa: true,
  normalizeData: true,
  maxDepth: 5,
  schemaTypes: []
};

export class SchemaDetector {
  private options: SchemaDetectorOptions;

  /**
   * Create a new SchemaDetector instance
   * @param options Schema detector options
   */
  constructor(options: SchemaDetectorOptions = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  /**
   * Detect and extract schema.org data from HTML
   * @param html HTML content
   * @param url URL of the page (for resolving relative URLs)
   * @returns Array of extracted schema data
   */
  async detect(html: string, url?: string): Promise<SchemaData[]> {
    const results: SchemaData[] = [];

    // Load HTML with Cheerio
    const $ = cheerio.load(html);

    // Extract JSON-LD data
    if (this.options.extractJsonLd) {
      const jsonLdData = await this.extractJsonLdData($, url);
      results.push(...jsonLdData);
    }

    // Extract Microdata
    if (this.options.extractMicrodata) {
      const microdataResults = await this.extractMicrodataData(html, url);
      results.push(...microdataResults);
    }

    // Extract RDFa data
    if (this.options.extractRdfa) {
      const rdfaData = await this.extractRdfaData($, url);
      results.push(...rdfaData);
    }

    // Filter by schema types if specified
    if (this.options.schemaTypes && this.options.schemaTypes.length > 0) {
      return results.filter(result => {
        // Check if the type matches any of the specified types
        return this.options.schemaTypes!.some(schemaType => {
          // Handle both full URLs and short names
          const resultType = result.type.toLowerCase();
          const targetType = schemaType.toLowerCase();

          return resultType === targetType ||
                 resultType === `http://schema.org/${targetType}` ||
                 resultType === `https://schema.org/${targetType}`;
        });
      });
    }

    return results;
  }

  /**
   * Extract JSON-LD data from HTML
   * @param $ Cheerio instance
   * @param url URL of the page
   * @returns Array of schema data from JSON-LD
   */
  private async extractJsonLdData($: any, url?: string): Promise<SchemaData[]> {
    const results: SchemaData[] = [];

    // Find all script tags with type="application/ld+json"
    $('script[type="application/ld+json"]').each((_: any, element: any) => {
      try {
        // Parse JSON-LD content
        const jsonLdText = $(element).html();
        if (!jsonLdText) return;

        const jsonLdData = JSON.parse(jsonLdText);

        // Handle both single objects and arrays
        const items = Array.isArray(jsonLdData) ? jsonLdData : [jsonLdData];

        for (const item of items) {
          // Extract type
          let type = item['@type'] || 'Unknown';

          // Handle array of types
          if (Array.isArray(type)) {
            type = type[0] || 'Unknown';
          }

          // Create schema data object
          const schemaData: SchemaData = {
            type,
            source: 'json-ld',
            properties: this.extractProperties(item),
            raw: item
          };

          results.push(schemaData);
        }
      } catch (error) {
        console.error('Error parsing JSON-LD:', error);
      }
    });

    return results;
  }

  /**
   * Extract Microdata from HTML
   * @param html HTML content
   * @param url URL of the page
   * @returns Array of schema data from Microdata
   */
  private async extractMicrodataData(html: string, url?: string): Promise<SchemaData[]> {
    const results: SchemaData[] = [];

    try {
      // Parse microdata
      const microdataResult = microdata.toJson(html, { base: url });

      if (microdataResult && microdataResult.items) {
        for (const item of microdataResult.items) {
          // Extract type
          let type = item.type || 'Unknown';

          // Handle array of types
          if (Array.isArray(type) && type.length > 0) {
            type = type[0];
          }

          // Create schema data object
          const schemaData: SchemaData = {
            type: this.getTypeFromUrl(type),
            source: 'microdata',
            properties: this.extractProperties(item.properties || {}),
            raw: item
          };

          results.push(schemaData);
        }
      }
    } catch (error) {
      console.error('Error parsing Microdata:', error);
    }

    return results;
  }

  /**
   * Extract RDFa data from HTML
   * @param $ Cheerio instance
   * @param url URL of the page
   * @returns Array of schema data from RDFa
   */
  private async extractRdfaData($: any, url?: string): Promise<SchemaData[]> {
    const results: SchemaData[] = [];

    // Find elements with RDFa attributes
    $('[typeof],[property]').each((_: any, element: any) => {
      try {
        const $element = $(element);

        // Get type
        const typeAttr = $element.attr('typeof');
        if (!typeAttr) return;

        // Create schema data object
        const schemaData: SchemaData = {
          type: this.getTypeFromUrl(typeAttr),
          source: 'rdfa',
          properties: this.extractRdfaProperties($, $element),
          raw: { typeof: typeAttr }
        };

        results.push(schemaData);
      } catch (error) {
        console.error('Error parsing RDFa:', error);
      }
    });

    return results;
  }

  /**
   * Extract RDFa properties from an element
   * @param $ Cheerio instance
   * @param $element Element with RDFa attributes
   * @returns Extracted properties
   */
  private extractRdfaProperties($: any, $element: any): Record<string, any> {
    const properties: Record<string, any> = {};

    // Process current element properties
    const propertyAttr = $element.attr('property');
    if (propertyAttr) {
      const value = $element.attr('content') || $element.text().trim();
      properties[propertyAttr] = value;
    }

    // Process child elements with property attributes
    $element.find('[property]').each((_: any, child: any) => {
      const $child = $(child);
      const childProperty = $child.attr('property');

      if (childProperty) {
        const value = $child.attr('content') || $child.text().trim();
        properties[childProperty] = value;
      }
    });

    return properties;
  }

  /**
   * Extract properties from a schema object
   * @param obj Schema object
   * @param depth Current depth (for limiting recursion)
   * @returns Extracted properties
   */
  private extractProperties(obj: any, depth: number = 0): Record<string, any> {
    if (!obj || typeof obj !== 'object' || depth > (this.options.maxDepth || 5)) {
      return {};
    }

    const properties: Record<string, any> = {};

    for (const [key, value] of Object.entries(obj)) {
      // Skip context and type properties
      if (key === '@context' || key === '@type') {
        continue;
      }

      // Handle nested objects
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        if (value && typeof value === 'object' && '@value' in value) {
          // Handle JSON-LD value objects
          properties[key] = value['@value'] as any;
        } else if (Object.keys(value).length > 0) {
          // Recursively extract properties from nested objects
          properties[key] = this.extractProperties(value, depth + 1);
        }
      } else if (Array.isArray(value)) {
        // Handle arrays
        properties[key] = value.map(item => {
          if (item && typeof item === 'object') {
            return this.extractProperties(item, depth + 1);
          }
          return item;
        });
      } else {
        // Handle primitive values
        properties[key] = value;
      }
    }

    return properties;
  }

  /**
   * Extract type name from a URL
   * @param typeUrl Type URL or name
   * @returns Type name
   */
  private getTypeFromUrl(typeUrl: string): string {
    if (!typeUrl) return 'Unknown';

    // Handle schema.org URLs
    if (typeUrl.includes('schema.org/')) {
      const parts = typeUrl.split('schema.org/');
      return parts[1] || typeUrl;
    }

    // Handle other URLs
    if (typeUrl.includes('/') || typeUrl.includes('#')) {
      const parts = typeUrl.split(/[/#]/);
      return parts[parts.length - 1] || typeUrl;
    }

    return typeUrl;
  }
}
