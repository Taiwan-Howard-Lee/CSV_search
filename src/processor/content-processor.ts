/**
 * Content Processor
 *
 * Processes content from various sources (HTML, PDF) and extracts clean, structured text.
 */

import * as cheerio from 'cheerio';
import TurndownService from 'turndown';
import { ProcessedContent, ProcessorOptions } from '../types';
import { CrawlResult } from '../types';

/**
 * Default processor options
 */
const DEFAULT_OPTIONS: ProcessorOptions = {
  withImages: true,
  withLinks: true,
  segmentContent: true,
  mdLinkStyle: 'inline'
};

/**
 * Content Processor class
 */
export class ContentProcessor {
  private options: ProcessorOptions;
  private turndownService: TurndownService;

  /**
   * Constructor
   * @param options Processor options
   */
  constructor(options: Partial<ProcessorOptions> = {}) {
    this.options = {
      ...DEFAULT_OPTIONS,
      ...options
    };

    // Initialize Turndown for HTML to Markdown conversion
    this.turndownService = new TurndownService({
      headingStyle: 'atx',
      codeBlockStyle: 'fenced',
      emDelimiter: '*'
    });

    // Configure Turndown based on options
    if (!this.options.withImages) {
      this.turndownService.remove('img');
    }

    if (!this.options.withLinks) {
      this.turndownService.remove('a');
    } else if (this.options.mdLinkStyle === 'reference') {
      this.turndownService.use(this.turndownReferenceLinks);
    } else if (this.options.mdLinkStyle === 'discarded') {
      this.turndownService.addRule('links', {
        filter: 'a',
        replacement: (content) => content
      });
    }
  }

  /**
   * Process a crawl result
   * @param result Crawl result to process
   * @returns Processed content
   */
  async process(result: CrawlResult): Promise<ProcessedContent> {
    const { url, html, title } = result;

    // Load HTML with Cheerio
    const $ = cheerio.load(html);

    // Remove unwanted elements
    this.cleanHtml($);

    // Extract clean text
    const text = this.extractText($);

    // Convert to markdown
    const markdown = this.htmlToMarkdown($.html());

    // Extract metadata
    const metadata = this.extractMetadata($, url, html);

    // Segment content if needed
    const segmentResult = this.options.segmentContent
      ? this.segmentContent(text)
      : { chunks: [text], chunk_positions: [[0, text.length] as [number, number]] };

    return {
      url,
      title: title || metadata.title || url,
      text,
      markdown,
      html: $.html(),
      metadata,
      chunks: segmentResult.chunks,
      chunk_positions: segmentResult.chunk_positions as [number, number][]
    };
  }

  /**
   * Clean HTML by removing unwanted elements
   * @param $ Cheerio instance
   */
  private cleanHtml($: any): void {
    // Remove scripts, styles, and other non-content elements
    $('script, style, iframe, noscript, svg, canvas, audio, video').remove();

    // Remove hidden elements
    $('[style*="display: none"], [style*="display:none"], [style*="visibility: hidden"], [style*="visibility:hidden"], [hidden]').remove();

    // Remove navigation, footer, and other common non-content areas
    $('nav, footer, header, aside, .sidebar, .footer, .header, .nav, .navigation, .ads, .advertisement').remove();

    // Remove comments
    $('*').contents().filter(function(this: any) {
      return this.type === 'comment';
    }).remove();
  }

  /**
   * Extract clean text from HTML
   * @param $ Cheerio instance
   * @returns Clean text
   */
  private extractText($: any): string {
    // Get body text
    let text = $('body').text();

    // Normalize whitespace
    text = text.replace(/\s+/g, ' ').trim();

    return text;
  }

  /**
   * Convert HTML to Markdown
   * @param html HTML content
   * @returns Markdown content
   */
  private htmlToMarkdown(html: string): string {
    return this.turndownService.turndown(html);
  }

  /**
   * Extract metadata from HTML
   * @param $ Cheerio instance
   * @param url URL of the page
   * @param html Raw HTML content
   * @returns Metadata object
   */
  private extractMetadata($: any, url: string, html: string): Record<string, string> {
    const metadata: Record<string, string> = {
      url
    };

    // Extract title
    const title = $('title').text().trim();
    if (title) {
      metadata.title = title;
    }

    // Extract meta tags
    $('meta').each(((_: any, element: any) => {
      const name = $(element).attr('name') || $(element).attr('property');
      const content = $(element).attr('content');

      if (name && content) {
        metadata[name] = content;
      }
    }));

    // Extract Open Graph metadata
    $('meta[property^="og:"]').each(((_: any, element: any) => {
      const property = $(element).attr('property');
      const content = $(element).attr('content');

      if (property && content) {
        metadata[property] = content;
      }
    }));

    // Extract publication date
    const publishedTime = metadata['article:published_time'] || metadata['og:published_time'];
    if (publishedTime) {
      metadata.publishedDate = publishedTime;
    } else {
      // Try to find date in other common formats
      const dateMatch = html.match(/datetime="([^"]+)"|pubdate="([^"]+)"|"datePublished":\s*"([^"]+)"/);
      if (dateMatch) {
        metadata.publishedDate = dateMatch[1] || dateMatch[2] || dateMatch[3];
      }
    }

    return metadata;
  }

  /**
   * Segment content into chunks
   * @param text Text to segment
   * @param maxChunkLength Maximum chunk length (default: 1000)
   * @returns Object with chunks and their positions
   */
  private segmentContent(text: string, maxChunkLength: number = 1000): { chunks: string[], chunk_positions: [number, number][] } {
    const chunks: string[] = [];
    const chunk_positions: [number, number][] = [];

    // Split by paragraphs first
    const paragraphs = text.split(/\n\s*\n/);

    let currentChunk = '';
    let startPos = 0;

    for (const paragraph of paragraphs) {
      // If adding this paragraph would exceed the max length, start a new chunk
      if (currentChunk.length + paragraph.length > maxChunkLength && currentChunk.length > 0) {
        chunks.push(currentChunk);
        chunk_positions.push([startPos, startPos + currentChunk.length]);
        currentChunk = '';
        startPos = startPos + currentChunk.length;
      }

      // If the paragraph itself is longer than max length, split it
      if (paragraph.length > maxChunkLength) {
        // If we have a current chunk, add it first
        if (currentChunk.length > 0) {
          chunks.push(currentChunk);
          chunk_positions.push([startPos, startPos + currentChunk.length]);
          currentChunk = '';
          startPos = startPos + currentChunk.length;
        }

        // Split the long paragraph into sentences
        const sentences = paragraph.match(/[^.!?]+[.!?]+/g) || [paragraph];

        let sentenceChunk = '';
        for (const sentence of sentences) {
          if (sentenceChunk.length + sentence.length > maxChunkLength && sentenceChunk.length > 0) {
            chunks.push(sentenceChunk);
            chunk_positions.push([startPos, startPos + sentenceChunk.length]);
            startPos = startPos + sentenceChunk.length;
            sentenceChunk = '';
          }

          sentenceChunk += sentence;
        }

        if (sentenceChunk.length > 0) {
          currentChunk = sentenceChunk;
        }
      } else {
        // Add the paragraph to the current chunk
        currentChunk += (currentChunk.length > 0 ? '\n\n' : '') + paragraph;
      }
    }

    // Add the last chunk if it's not empty
    if (currentChunk.length > 0) {
      chunks.push(currentChunk);
      chunk_positions.push([startPos, startPos + currentChunk.length]);
    }

    return { chunks, chunk_positions };
  }

  /**
   * Turndown plugin for reference-style links
   */
  private turndownReferenceLinks(turndownService: TurndownService) {
    const references: { [key: string]: { href: string; title: string | null } } = {};
    let referenceCount = 0;

    turndownService.addRule('referenceLinks', {
      filter: 'a',
      replacement: function(content, node: any) {
        const href = node.getAttribute ? node.getAttribute('href') : null;
        const title = node.getAttribute ? node.getAttribute('title') : null;

        if (!href) {
          return content;
        }

        const reference = ++referenceCount;
        references[reference] = { href, title };

        return '[' + content + '][' + reference + ']';
      }
    });

    turndownService.addRule('referenceDefinitions', {
      filter: function() {
        return Object.keys(references).length > 0;
      },
      replacement: function() {
        let definitions = '\n\n';

        for (const key in references) {
          const ref = references[key];
          definitions += '[' + key + ']: ' + ref.href;
          if (ref.title) {
            definitions += ' "' + ref.title + '"';
          }
          definitions += '\n';
        }

        // Reset references for next conversion
        referenceCount = 0;
        for (const key in references) {
          delete references[key];
        }

        return definitions;
      }
    });
  }
}
