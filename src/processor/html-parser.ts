/**
 * Enhanced HTML Parser
 *
 * This class provides enhanced HTML parsing capabilities to better preserve
 * document structure when processing HTML content.
 */

import * as cheerio from 'cheerio';
import { htmlToText } from 'html-to-text';
import sanitizeHtml from 'sanitize-html';

export interface HtmlParserOptions {
  /**
   * Whether to preserve headings in the output
   */
  preserveHeadings?: boolean;

  /**
   * Whether to preserve lists in the output
   */
  preserveLists?: boolean;

  /**
   * Whether to preserve tables in the output
   */
  preserveTables?: boolean;

  /**
   * Whether to preserve links in the output
   */
  preserveLinks?: boolean;

  /**
   * Whether to preserve images in the output (as alt text)
   */
  preserveImages?: boolean;

  /**
   * Whether to preserve emphasis (bold, italic) in the output
   */
  preserveEmphasis?: boolean;

  /**
   * Whether to preserve document structure (paragraphs, sections)
   */
  preserveStructure?: boolean;

  /**
   * Whether to preserve line breaks
   */
  preserveLineBreaks?: boolean;

  /**
   * Maximum line length for wrapped text
   */
  wordwrap?: number | false;

  /**
   * Whether to include hidden text
   */
  includeHiddenText?: boolean;

  /**
   * Whether to decode HTML entities
   */
  decodeEntities?: boolean;

  /**
   * Whether to remove empty lines
   */
  removeEmptyLines?: boolean;

  /**
   * Selectors for elements to remove
   */
  removeSelectors?: string[];
}

/**
 * Default options for HTML parsing
 */
const DEFAULT_OPTIONS: HtmlParserOptions = {
  preserveHeadings: true,
  preserveLists: true,
  preserveTables: true,
  preserveLinks: true,
  preserveImages: true,
  preserveEmphasis: true,
  preserveStructure: true,
  preserveLineBreaks: true,
  wordwrap: 80,
  includeHiddenText: false,
  decodeEntities: true,
  removeEmptyLines: true,
  removeSelectors: [
    'script',
    'style',
    'iframe',
    'noscript',
    'head',
    'footer',
    'nav',
    '.navigation',
    '.sidebar',
    '.menu',
    '.ad',
    '.advertisement',
    '.cookie-notice',
    '.popup',
    '.modal',
    '[role=banner]',
    '[role=navigation]',
    '[role=complementary]',
    '[role=contentinfo]'
  ]
};

export interface ParsedHtml {
  /**
   * Plain text extracted from HTML
   */
  text: string;

  /**
   * Structured text with formatting preserved
   */
  structuredText: string;

  /**
   * Document title
   */
  title: string;

  /**
   * Document metadata
   */
  metadata: Record<string, string>;

  /**
   * Document headings
   */
  headings: Array<{
    level: number;
    text: string;
    id?: string;
  }>;

  /**
   * Links found in the document
   */
  links: Array<{
    text: string;
    url: string;
    title?: string;
  }>;

  /**
   * Images found in the document
   */
  images: Array<{
    alt: string;
    url: string;
    title?: string;
  }>;

  /**
   * Tables found in the document
   */
  tables: Array<{
    caption?: string;
    headers: string[];
    rows: string[][];
  }>;

  /**
   * Lists found in the document
   */
  lists: Array<{
    type: 'ordered' | 'unordered';
    items: string[];
  }>;

  /**
   * Cleaned HTML with unwanted elements removed
   */
  cleanHtml: string;
}

export class HtmlParser {
  private options: HtmlParserOptions;

  /**
   * Create a new HtmlParser instance
   * @param options Parser options
   */
  constructor(options: HtmlParserOptions = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  /**
   * Parse HTML content
   * @param html HTML content to parse
   * @param baseUrl Base URL for resolving relative links
   * @returns Parsed HTML
   */
  parse(html: string, baseUrl?: string): ParsedHtml {
    // Load HTML with Cheerio
    const $ = cheerio.load(html, {
      decodeEntities: this.options.decodeEntities
    });

    // Remove unwanted elements
    this.removeUnwantedElements($);

    // Extract metadata
    const metadata = this.extractMetadata($);

    // Extract title
    const title = $('title').text().trim() || metadata.title || '';

    // Extract headings
    const headings = this.extractHeadings($);

    // Extract links
    const links = this.extractLinks($, baseUrl);

    // Extract images
    const images = this.extractImages($, baseUrl);

    // Extract tables
    const tables = this.extractTables($);

    // Extract lists
    const lists = this.extractLists($);

    // Clean HTML
    const cleanHtml = this.cleanHtml($);

    // Convert to plain text
    const text = this.htmlToPlainText(cleanHtml);

    // Convert to structured text
    const structuredText = this.htmlToStructuredText(cleanHtml);

    return {
      text,
      structuredText,
      title,
      metadata,
      headings,
      links,
      images,
      tables,
      lists,
      cleanHtml
    };
  }

  /**
   * Remove unwanted elements from HTML
   * @param $ Cheerio instance
   */
  private removeUnwantedElements($: any): void {
    // Remove elements by selector
    if (this.options.removeSelectors) {
      $(this.options.removeSelectors.join(',')).remove();
    }

    // Remove hidden elements
    if (!this.options.includeHiddenText) {
      $('[style*="display: none"], [style*="display:none"], [style*="visibility: hidden"], [style*="visibility:hidden"], [hidden]').remove();
    }

    // Remove empty paragraphs
    $('p:empty').remove();

    // Remove comments
    $('*').contents().filter(function(this: any) {
      return this.type === 'comment';
    }).remove();
  }

  /**
   * Extract metadata from HTML
   * @param $ Cheerio instance
   * @returns Metadata object
   */
  private extractMetadata($: any): Record<string, string> {
    const metadata: Record<string, string> = {};

    // Extract meta tags
    $('meta').each((_: any, element: any) => {
      const name = $(element).attr('name') || $(element).attr('property');
      const content = $(element).attr('content');

      if (name && content) {
        metadata[name] = content;
      }
    });

    // Extract Open Graph metadata
    $('meta[property^="og:"]').each((_: any, element: any) => {
      const property = $(element).attr('property');
      const content = $(element).attr('content');

      if (property && content) {
        metadata[property] = content;
      }
    });

    // Extract Twitter Card metadata
    $('meta[name^="twitter:"]').each((_: any, element: any) => {
      const name = $(element).attr('name');
      const content = $(element).attr('content');

      if (name && content) {
        metadata[name] = content;
      }
    });

    // Extract canonical URL
    const canonical = $('link[rel="canonical"]').attr('href');
    if (canonical) {
      metadata.canonical = canonical;
    }

    return metadata;
  }

  /**
   * Extract headings from HTML
   * @param $ Cheerio instance
   * @returns Array of headings
   */
  private extractHeadings($: any): Array<{ level: number; text: string; id?: string }> {
    const headings: Array<{ level: number; text: string; id?: string }> = [];

    $('h1, h2, h3, h4, h5, h6').each((_: any, element: any) => {
      const level = parseInt((element as any).tagName.substring(1), 10);
      const text = $(element).text().trim();
      const id = $(element).attr('id');

      if (text) {
        headings.push({ level, text, id });
      }
    });

    return headings;
  }

  /**
   * Extract links from HTML
   * @param $ Cheerio instance
   * @param baseUrl Base URL for resolving relative links
   * @returns Array of links
   */
  private extractLinks($: any, baseUrl?: string): Array<{ text: string; url: string; title?: string }> {
    const links: Array<{ text: string; url: string; title?: string }> = [];

    $('a[href]').each((_: any, element: any) => {
      const text = $(element).text().trim();
      let url = $(element).attr('href') || '';
      const title = $(element).attr('title');

      // Skip empty links, anchors, and javascript links
      if (!url || url.startsWith('#') || url.startsWith('javascript:')) {
        return;
      }

      // Resolve relative URLs
      if (baseUrl && !url.match(/^(https?:)?\/\//)) {
        try {
          url = new URL(url, baseUrl).href;
        } catch (error) {
          // If URL resolution fails, use the original URL
        }
      }

      links.push({ text, url, title });
    });

    return links;
  }

  /**
   * Extract images from HTML
   * @param $ Cheerio instance
   * @param baseUrl Base URL for resolving relative links
   * @returns Array of images
   */
  private extractImages($: any, baseUrl?: string): Array<{ alt: string; url: string; title?: string }> {
    const images: Array<{ alt: string; url: string; title?: string }> = [];

    $('img[src]').each((_: any, element: any) => {
      const alt = $(element).attr('alt') || '';
      let url = $(element).attr('src') || '';
      const title = $(element).attr('title');

      // Skip data URLs and empty sources
      if (!url || url.startsWith('data:')) {
        return;
      }

      // Resolve relative URLs
      if (baseUrl && !url.match(/^(https?:)?\/\//)) {
        try {
          url = new URL(url, baseUrl).href;
        } catch (error) {
          // If URL resolution fails, use the original URL
        }
      }

      images.push({ alt, url, title });
    });

    return images;
  }

  /**
   * Extract tables from HTML
   * @param $ Cheerio instance
   * @returns Array of tables
   */
  private extractTables($: any): Array<{ caption?: string; headers: string[]; rows: string[][] }> {
    const tables: Array<{ caption?: string; headers: string[]; rows: string[][] }> = [];

    $('table').each((_: any, table: any) => {
      const caption = $(table).find('caption').text().trim();
      const headers: string[] = [];
      const rows: string[][] = [];

      // Extract headers
      $(table).find('thead th, thead td, tbody tr:first-child th').each((_: any, header: any) => {
        headers.push($(header).text().trim());
      });

      // If no headers were found in thead, try the first row
      if (headers.length === 0) {
        $(table).find('tr:first-child th, tr:first-child td').each((_: any, header: any) => {
          headers.push($(header).text().trim());
        });
      }

      // Extract rows
      $(table).find('tbody tr, tr').each((rowIndex: any, row: any) => {
        // Skip the first row if it was used for headers
        if (rowIndex === 0 && headers.length > 0 && $(table).find('thead').length === 0) {
          return;
        }

        const rowData: string[] = [];

        $(row).find('td, th').each((_: any, cell: any) => {
          rowData.push($(cell).text().trim());
        });

        if (rowData.length > 0) {
          rows.push(rowData);
        }
      });

      if (rows.length > 0) {
        tables.push({ caption, headers, rows });
      }
    });

    return tables;
  }

  /**
   * Extract lists from HTML
   * @param $ Cheerio instance
   * @returns Array of lists
   */
  private extractLists($: any): Array<{ type: 'ordered' | 'unordered'; items: string[] }> {
    const lists: Array<{ type: 'ordered' | 'unordered'; items: string[] }> = [];

    $('ul, ol').each((_: any, list: any) => {
      const type = (list as any).tagName.toLowerCase() === 'ol' ? 'ordered' : 'unordered';
      const items: string[] = [];

      $(list).find('> li').each((_: any, item: any) => {
        items.push($(item).text().trim());
      });

      if (items.length > 0) {
        lists.push({ type, items });
      }
    });

    return lists;
  }

  /**
   * Clean HTML by removing unwanted elements and attributes
   * @param $ Cheerio instance
   * @returns Cleaned HTML
   */
  private cleanHtml($: any): string {
    // Clone the document to avoid modifying the original
    const $clone = cheerio.load($.html());

    // Remove unwanted attributes
    $clone('*').each((_: any, element: any) => {
      // Keep only essential attributes
      const allowedAttributes = ['href', 'src', 'alt', 'title', 'id', 'class'];
      const attributes = (element as any).attribs;

      for (const attr in attributes) {
        if (!allowedAttributes.includes(attr)) {
          $clone(element).removeAttr(attr);
        }
      }
    });

    // Sanitize HTML to remove potentially dangerous content
    return sanitizeHtml($clone.html() || '', {
      allowedTags: sanitizeHtml.defaults.allowedTags.concat([
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'img', 'caption', 'figure', 'figcaption',
        'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td',
        'section', 'article', 'header', 'footer', 'aside', 'nav',
        'details', 'summary', 'mark', 'time', 'data'
      ]),
      allowedAttributes: {
        ...sanitizeHtml.defaults.allowedAttributes,
        '*': ['id', 'class'],
        'img': ['src', 'alt', 'title', 'width', 'height'],
        'a': ['href', 'title', 'target', 'rel']
      }
    });
  }

  /**
   * Convert HTML to plain text
   * @param html HTML content
   * @returns Plain text
   */
  private htmlToPlainText(html: string): string {
    let text = htmlToText(html, {
      wordwrap: this.options.wordwrap || false,
      selectors: [
        { selector: 'a', options: { ignoreHref: !this.options.preserveLinks } },
        { selector: 'img', format: 'skip' },
        { selector: 'table', format: this.options.preserveTables ? 'dataTable' : 'block' }
      ],
      formatters: {
        // Custom formatters can be added here
      }
    });

    // Remove excessive whitespace
    text = text.replace(/\n{3,}/g, '\n\n');

    // Remove empty lines if configured
    if (this.options.removeEmptyLines) {
      text = text.replace(/^\s*[\r\n]/gm, '');
    }

    return text;
  }

  /**
   * Convert HTML to structured text with formatting preserved
   * @param html HTML content
   * @returns Structured text
   */
  private htmlToStructuredText(html: string): string {
    // Load HTML with Cheerio
    const $ = cheerio.load(html);

    // Process headings
    if (this.options.preserveHeadings) {
      $('h1, h2, h3, h4, h5, h6').each((_: any, element: any) => {
        const level = parseInt((element as any).tagName.substring(1), 10);
        const prefix = '#'.repeat(level) + ' ';
        $(element).prepend(prefix);
        $(element).append('\n\n');
      });
    }

    // Process lists
    if (this.options.preserveLists) {
      $('ul > li').each((i: any, element: any) => {
        $(element).prepend('• ');
        if (i > 0) $(element).before('\n');
      });

      $('ol > li').each((i: any, element: any) => {
        $(element).prepend(`${i + 1}. `);
        if (i > 0) $(element).before('\n');
      });

      $('ul, ol').each((_: any, element: any) => {
        $(element).append('\n\n');
      });
    }

    // Process paragraphs
    if (this.options.preserveStructure) {
      $('p').each((_: any, element: any) => {
        $(element).append('\n\n');
      });

      $('br').each((_: any, element: any) => {
        $(element).replaceWith('\n');
      });

      $('div').each((_: any, element: any) => {
        $(element).append('\n');
      });
    }

    // Process emphasis
    if (this.options.preserveEmphasis) {
      $('strong, b').each((_: any, element: any) => {
        $(element).prepend('**');
        $(element).append('**');
      });

      $('em, i').each((_: any, element: any) => {
        $(element).prepend('*');
        $(element).append('*');
      });
    }

    // Process links
    if (this.options.preserveLinks) {
      $('a').each((_: any, element: any) => {
        const text = $(element).text();
        const href = $(element).attr('href');

        if (href && !href.startsWith('#') && !href.startsWith('javascript:')) {
          $(element).replaceWith(`[${text}](${href})`);
        }
      });
    }

    // Process images
    if (this.options.preserveImages) {
      $('img').each((_: any, element: any) => {
        const alt = $(element).attr('alt') || '';
        const src = $(element).attr('src');

        if (src && !src.startsWith('data:')) {
          $(element).replaceWith(`![${alt}](${src})`);
        }
      });
    }

    // Get the text content
    let text = $('body').text();

    // Remove excessive whitespace
    text = text.replace(/\n{3,}/g, '\n\n');

    // Remove empty lines if configured
    if (this.options.removeEmptyLines) {
      text = text.replace(/^\s*[\r\n]/gm, '');
    }

    return text;
  }
}
