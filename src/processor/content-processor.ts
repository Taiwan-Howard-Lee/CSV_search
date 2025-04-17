/**
 * Content Processor
 *
 * Processes content from various sources (HTML, PDF) and extracts clean, structured text.
 */

// HTML processing libraries
import TurndownService from 'turndown';
import { ProcessedContent, ProcessorOptions } from '../types';
import { CrawlResult } from '../types';
// Document processing libraries
import axios from 'axios';
// Import the new HTML Parser
import { HtmlParser, ParsedHtml } from './html-parser';
// Import the Schema Detector
import { SchemaData } from './schema-detector';
import * as mammoth from 'mammoth';
import * as XLSX from 'xlsx';
import { Document } from 'docx';

/**
 * Default processor options
 */
const DEFAULT_OPTIONS: ProcessorOptions = {
  withImages: true,
  withLinks: true,
  segmentContent: true,
  mdLinkStyle: 'inline',
  extractPdfMetadata: true,
  pdfTextLayout: false,
  pdfMaxPages: 50,
  pdfVersion: '1.10.100',
  extractDocxMetadata: true,
  extractXlsxMetadata: true,
  extractPptxMetadata: true,
  extractCsvMetadata: true,
  maxSheets: 20,
  maxSlides: 50,
  maxRows: 1000,
  preserveDocxFormatting: true,
  preserveXlsxFormatting: false,
  preservePptxFormatting: false
};

/**
 * Content Processor class
 */
export class ContentProcessor {
  private options: ProcessorOptions;
  private turndownService: TurndownService;
  private htmlParser: HtmlParser;

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

    // Initialize HTML Parser
    this.htmlParser = new HtmlParser({
      preserveHeadings: true,
      preserveLists: true,
      preserveTables: true,
      preserveLinks: this.options.withLinks,
      preserveImages: this.options.withImages,
      preserveEmphasis: true,
      preserveStructure: true,
      wordwrap: 100,
      removeEmptyLines: true
    });
  }

  /**
   * Process a crawl result
   * @param result Crawl result to process
   * @returns Processed content
   */
  async process(result: CrawlResult): Promise<ProcessedContent> {
    const { url, contentType, pdfs, docx, xlsx, pptx, csv, documentType } = result;

    // Determine document type
    let detectedDocType: 'html' | 'pdf' | 'docx' | 'xlsx' | 'pptx' | 'csv' | 'other' = 'html';

    if (documentType) {
      detectedDocType = documentType;
    } else if (contentType) {
      if (contentType.includes('application/pdf') || (pdfs !== undefined && pdfs.length > 0)) {
        detectedDocType = 'pdf';
      } else if (contentType.includes('application/vnd.openxmlformats-officedocument.wordprocessingml.document') ||
                 (docx !== undefined && docx.length > 0)) {
        detectedDocType = 'docx';
      } else if (contentType.includes('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') ||
                 (xlsx !== undefined && xlsx.length > 0)) {
        detectedDocType = 'xlsx';
      } else if (contentType.includes('application/vnd.openxmlformats-officedocument.presentationml.presentation') ||
                 (pptx !== undefined && pptx.length > 0)) {
        detectedDocType = 'pptx';
      } else if (contentType.includes('text/csv') ||
                 (csv !== undefined && csv.length > 0)) {
        detectedDocType = 'csv';
      } else if (contentType.includes('text/html') || contentType.includes('application/xhtml+xml')) {
        detectedDocType = 'html';
      } else {
        detectedDocType = 'other';
      }
    } else {
      // Try to determine from URL
      const lowerUrl = url.toLowerCase();
      if (lowerUrl.endsWith('.pdf')) {
        detectedDocType = 'pdf';
      } else if (lowerUrl.endsWith('.docx')) {
        detectedDocType = 'docx';
      } else if (lowerUrl.endsWith('.xlsx')) {
        detectedDocType = 'xlsx';
      } else if (lowerUrl.endsWith('.pptx')) {
        detectedDocType = 'pptx';
      } else if (lowerUrl.endsWith('.csv')) {
        detectedDocType = 'csv';
      } else {
        detectedDocType = 'html';
      }
    }

    // Process based on document type
    switch (detectedDocType) {
      case 'pdf':
        return this.processPdf(result);
      case 'docx':
        return this.processDocx(result);
      case 'xlsx':
        return this.processXlsx(result);
      case 'pptx':
        return this.processPptx(result);
      case 'csv':
        return this.processCsv(result);
      case 'html':
      default:
        return this.processHtml(result);
    }
  }

  /**
   * Process an HTML crawl result
   * @param result Crawl result to process
   * @returns Processed content
   */
  private async processHtml(result: CrawlResult): Promise<ProcessedContent> {
    const { url, html, title } = result;

    // Parse HTML using the enhanced HTML Parser
    const parsedHtml = await this.htmlParser.parse(html, url);

    // We have both plain text and structured text available
    // structuredText = parsedHtml.structuredText;

    // Use the plain text for search indexing
    const text = parsedHtml.text;

    // Convert to markdown using the structured text
    const markdown = this.htmlToMarkdown(parsedHtml.cleanHtml);

    // Combine metadata from HTML Parser with any additional metadata
    const metadata: Record<string, string> = {
      ...parsedHtml.metadata,
      url
    };

    // Add headings to metadata for better search context
    if (parsedHtml.headings.length > 0) {
      metadata['headings'] = parsedHtml.headings.map((h: any) => `${h.level}:${h.text}`).join('|');
    }

    // Add table information to metadata
    if (parsedHtml.tables.length > 0) {
      metadata['tables'] = String(parsedHtml.tables.length);
    }

    // Add list information to metadata
    if (parsedHtml.lists.length > 0) {
      metadata['lists'] = String(parsedHtml.lists.length);
    }

    // Add schema.org data to metadata
    if (parsedHtml.schemaData && parsedHtml.schemaData.length > 0) {
      metadata['schema_types'] = parsedHtml.schemaData.map(s => s.type).join(',');

      // Add count of each schema type
      const typeCounts: Record<string, number> = {};
      for (const schema of parsedHtml.schemaData) {
        typeCounts[schema.type] = (typeCounts[schema.type] || 0) + 1;
      }

      for (const [type, count] of Object.entries(typeCounts)) {
        metadata[`schema_${type.toLowerCase()}_count`] = String(count);
      }
    }

    // Segment content if needed
    const segmentResult = this.options.segmentContent
      ? this.segmentContent(text)
      : { chunks: [text], chunk_positions: [[0, text.length] as [number, number]] };

    // Create a more structured HTML representation
    const enhancedHtml = parsedHtml.cleanHtml;

    return {
      url,
      title: title || parsedHtml.title || metadata['title'] || url,
      text,
      markdown,
      html: enhancedHtml,
      metadata,
      chunks: segmentResult.chunks,
      chunk_positions: segmentResult.chunk_positions as [number, number][],
      documentType: 'html',
      schemaData: parsedHtml.schemaData
    };
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
   * Process a PDF crawl result
   * @param result Crawl result to process
   * @returns Processed content
   */
  private async processPdf(result: CrawlResult): Promise<ProcessedContent> {
    const { url, text, title } = result;

    try {
      // Use the text that was already extracted by the crawler
      // This is more reliable than trying to parse the PDF ourselves
      const pdfText = text || '';

      // Create HTML representation
      const pdfHtml = `<html><body><pre>${pdfText}</pre></body></html>`;

      // Convert to markdown (for PDFs, plain text is fine)
      const markdown = pdfText;

      // Extract basic metadata
      const metadata: Record<string, string> = {
        contentType: 'application/pdf',
        source: url
      };

      // Try to extract filename from URL
      const urlParts = url.split('/');
      const fileName = urlParts[urlParts.length - 1].split('?')[0];
      if (fileName.toLowerCase().endsWith('.pdf')) {
        metadata.fileName = fileName;
      }

      // Segment content if needed
      const segmentResult = this.options.segmentContent
        ? this.segmentContent(pdfText)
        : { chunks: [pdfText], chunk_positions: [[0, pdfText.length] as [number, number]] };

      // Create basic PDF info
      const pdfInfo = {
        numPages: 0, // We don't know without parsing
        fileName: fileName || 'document.pdf',
        fileSize: 0, // We don't know without fetching
        isPdf: true
      };

      return {
        url,
        title: title || fileName || 'PDF Document',
        text: pdfText,
        markdown,
        html: pdfHtml,
        metadata,
        chunks: segmentResult.chunks,
        chunk_positions: segmentResult.chunk_positions as [number, number][],
        documentType: 'pdf',
        isPdf: true,
        pdfInfo
      };
    } catch (error) {
      console.error(`Error processing PDF ${url}:`, error);

      // Fallback to empty content
      const fallbackText = '';

      return {
        url,
        title: title || url,
        text: fallbackText,
        markdown: fallbackText,
        html: `<html><body><pre>${fallbackText}</pre></body></html>`,
        metadata: {},
        chunks: [fallbackText],
        chunk_positions: [[0, 0] as [number, number]],
        documentType: 'pdf',
        isPdf: true,
        pdfInfo: {
          numPages: 0,
          fileName: 'unknown.pdf',
          fileSize: 0,
          isPdf: true
        }
      };
    }
  }



  /**
   * Process a DOCX crawl result
   * @param result Crawl result to process
   * @returns Processed content
   */
  private async processDocx(result: CrawlResult): Promise<ProcessedContent> {
    const { url, text, title, docx } = result;

    try {
      // Use the text that was already extracted by the crawler if available
      let docxText = text || '';
      let docxHtml = '';

      // If we have a DOCX URL, try to fetch and process it
      if (docx && docx.length > 0) {
        try {
          // Fetch the DOCX file
          const response = await axios.get(docx[0], {
            responseType: 'arraybuffer',
            headers: {
              'User-Agent': 'SBC-GINA-ContentProcessor/1.0'
            },
            timeout: 30000
          });

          // Convert to Buffer
          const buffer = Buffer.from(response.data);

          // Extract text and HTML using mammoth
          const result = await mammoth.extractRawText({ buffer });
          docxText = result.value;

          // Extract HTML if we want to preserve formatting
          if (this.options.preserveDocxFormatting) {
            const htmlResult = await mammoth.convertToHtml({ buffer });
            docxHtml = htmlResult.value;
          }
        } catch (error) {
          console.error(`Error processing DOCX file ${docx[0]}:`, error);
          // Continue with the text we already have
        }
      }

      // Create HTML representation if we don't have one yet
      if (!docxHtml) {
        docxHtml = `<html><body><pre>${docxText}</pre></body></html>`;
      }

      // Convert to markdown
      const markdown = this.htmlToMarkdown(docxHtml);

      // Extract basic metadata
      const metadata: Record<string, string> = {
        contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        source: url
      };

      // Try to extract filename from URL
      const urlParts = url.split('/');
      const fileName = urlParts[urlParts.length - 1].split('?')[0];
      if (fileName.toLowerCase().endsWith('.docx')) {
        metadata.fileName = fileName;
      }

      // Segment content if needed
      const segmentResult = this.options.segmentContent
        ? this.segmentContent(docxText)
        : { chunks: [docxText], chunk_positions: [[0, docxText.length] as [number, number]] };

      // Create basic DOCX info
      const docxInfo = {
        fileName: fileName || 'document.docx',
        fileSize: 0, // We don't know without fetching
        wordCount: docxText.split(/\s+/).length,
        paragraphCount: docxText.split(/\n\s*\n/).length
      };

      return {
        url,
        title: title || fileName || 'Word Document',
        text: docxText,
        markdown,
        html: docxHtml,
        metadata,
        chunks: segmentResult.chunks,
        chunk_positions: segmentResult.chunk_positions as [number, number][],
        documentType: 'docx',
        docxInfo
      };
    } catch (error) {
      console.error(`Error processing DOCX ${url}:`, error);

      // Fallback to empty content
      const fallbackText = '';

      return {
        url,
        title: title || url,
        text: fallbackText,
        markdown: fallbackText,
        html: `<html><body><pre>${fallbackText}</pre></body></html>`,
        metadata: {},
        chunks: [fallbackText],
        chunk_positions: [[0, 0] as [number, number]],
        documentType: 'docx',
        docxInfo: {
          fileName: 'unknown.docx',
          fileSize: 0,
          wordCount: 0,
          paragraphCount: 0
        }
      };
    }
  }

  /**
   * Process an XLSX crawl result
   * @param result Crawl result to process
   * @returns Processed content
   */
  private async processXlsx(result: CrawlResult): Promise<ProcessedContent> {
    const { url, text, title, xlsx } = result;

    try {
      // Use the text that was already extracted by the crawler if available
      let xlsxText = text || '';
      let xlsxHtml = '';
      let sheetNames: string[] = [];
      let sheetCount = 0;
      let cellCount = 0;

      // If we have an XLSX URL, try to fetch and process it
      if (xlsx && xlsx.length > 0) {
        try {
          // Fetch the XLSX file
          const response = await axios.get(xlsx[0], {
            responseType: 'arraybuffer',
            headers: {
              'User-Agent': 'SBC-GINA-ContentProcessor/1.0'
            },
            timeout: 30000
          });

          // Convert to Buffer
          const buffer = Buffer.from(response.data);

          // Parse the workbook
          const workbook = XLSX.read(buffer, { type: 'buffer' });

          // Get sheet names
          sheetNames = workbook.SheetNames;
          sheetCount = sheetNames.length;

          // Limit the number of sheets to process
          const sheetsToProcess = sheetNames.slice(0, this.options.maxSheets || 20);

          // Process each sheet
          let allText = '';
          let allHtml = '<html><body>';

          for (const sheetName of sheetsToProcess) {
            const sheet = workbook.Sheets[sheetName];

            // Convert to JSON
            const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });

            // Count cells
            cellCount += Object.keys(sheet).filter(key => key[0] !== '!').length;

            // Convert to text
            const sheetText = jsonData.map((row: any) => row.join('\t')).join('\n');
            allText += `Sheet: ${sheetName}\n${sheetText}\n\n`;

            // Convert to HTML
            if (this.options.preserveXlsxFormatting) {
              const sheetHtml = XLSX.utils.sheet_to_html(sheet);
              allHtml += `<h2>Sheet: ${sheetName}</h2>${sheetHtml}`;
            }
          }

          if (this.options.preserveXlsxFormatting) {
            allHtml += '</body></html>';
            xlsxHtml = allHtml;
          }

          xlsxText = allText;
        } catch (error) {
          console.error(`Error processing XLSX file ${xlsx[0]}:`, error);
          // Continue with the text we already have
        }
      }

      // Create HTML representation if we don't have one yet
      if (!xlsxHtml) {
        xlsxHtml = `<html><body><pre>${xlsxText}</pre></body></html>`;
      }

      // Convert to markdown
      const markdown = this.htmlToMarkdown(xlsxHtml);

      // Extract basic metadata
      const metadata: Record<string, string> = {
        contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        source: url,
        sheetCount: sheetCount.toString(),
        cellCount: cellCount.toString()
      };

      // Try to extract filename from URL
      const urlParts = url.split('/');
      const fileName = urlParts[urlParts.length - 1].split('?')[0];
      if (fileName.toLowerCase().endsWith('.xlsx')) {
        metadata.fileName = fileName;
      }

      // Segment content if needed
      const segmentResult = this.options.segmentContent
        ? this.segmentContent(xlsxText)
        : { chunks: [xlsxText], chunk_positions: [[0, xlsxText.length] as [number, number]] };

      // Create basic XLSX info
      const xlsxInfo = {
        fileName: fileName || 'spreadsheet.xlsx',
        fileSize: 0, // We don't know without fetching
        sheetNames,
        sheetCount,
        cellCount
      };

      return {
        url,
        title: title || fileName || 'Excel Spreadsheet',
        text: xlsxText,
        markdown,
        html: xlsxHtml,
        metadata,
        chunks: segmentResult.chunks,
        chunk_positions: segmentResult.chunk_positions as [number, number][],
        documentType: 'xlsx',
        xlsxInfo
      };
    } catch (error) {
      console.error(`Error processing XLSX ${url}:`, error);

      // Fallback to empty content
      const fallbackText = '';

      return {
        url,
        title: title || url,
        text: fallbackText,
        markdown: fallbackText,
        html: `<html><body><pre>${fallbackText}</pre></body></html>`,
        metadata: {},
        chunks: [fallbackText],
        chunk_positions: [[0, 0] as [number, number]],
        documentType: 'xlsx',
        xlsxInfo: {
          fileName: 'unknown.xlsx',
          fileSize: 0,
          sheetNames: [],
          sheetCount: 0,
          cellCount: 0
        }
      };
    }
  }

  /**
   * Process a PPTX crawl result
   * @param result Crawl result to process
   * @returns Processed content
   */
  private async processPptx(result: CrawlResult): Promise<ProcessedContent> {
    const { url, text, title } = result;

    try {
      // Use the text that was already extracted by the crawler
      const pptxText = text || '';

      // Create HTML representation
      const pptxHtml = `<html><body><pre>${pptxText}</pre></body></html>`;

      // Convert to markdown
      const markdown = pptxText;

      // Extract basic metadata
      const metadata: Record<string, string> = {
        contentType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        source: url
      };

      // Try to extract filename from URL
      const urlParts = url.split('/');
      const fileName = urlParts[urlParts.length - 1].split('?')[0];
      if (fileName.toLowerCase().endsWith('.pptx')) {
        metadata.fileName = fileName;
      }

      // Segment content if needed
      const segmentResult = this.options.segmentContent
        ? this.segmentContent(pptxText)
        : { chunks: [pptxText], chunk_positions: [[0, pptxText.length] as [number, number]] };

      // Create basic PPTX info
      const pptxInfo = {
        fileName: fileName || 'presentation.pptx',
        fileSize: 0, // We don't know without fetching
        slideCount: 0 // We don't know without parsing
      };

      return {
        url,
        title: title || fileName || 'PowerPoint Presentation',
        text: pptxText,
        markdown,
        html: pptxHtml,
        metadata,
        chunks: segmentResult.chunks,
        chunk_positions: segmentResult.chunk_positions as [number, number][],
        documentType: 'pptx',
        pptxInfo
      };
    } catch (error) {
      console.error(`Error processing PPTX ${url}:`, error);

      // Fallback to empty content
      const fallbackText = '';

      return {
        url,
        title: title || url,
        text: fallbackText,
        markdown: fallbackText,
        html: `<html><body><pre>${fallbackText}</pre></body></html>`,
        metadata: {},
        chunks: [fallbackText],
        chunk_positions: [[0, 0] as [number, number]],
        documentType: 'pptx',
        pptxInfo: {
          fileName: 'unknown.pptx',
          fileSize: 0,
          slideCount: 0
        }
      };
    }
  }

  /**
   * Process a CSV crawl result
   * @param result Crawl result to process
   * @returns Processed content
   */
  private async processCsv(result: CrawlResult): Promise<ProcessedContent> {
    const { url, text, title, csv } = result;

    try {
      // Use the text that was already extracted by the crawler
      let csvText = text || '';
      let csvHtml = '';
      let headers: string[] = [];
      let rowCount = 0;
      let columnCount = 0;

      // If we have a CSV URL and no text, try to fetch and process it
      if (csv && csv.length > 0 && !csvText) {
        try {
          // Fetch the CSV file
          const response = await axios.get(csv[0], {
            responseType: 'text',
            headers: {
              'User-Agent': 'SBC-GINA-ContentProcessor/1.0'
            },
            timeout: 30000
          });

          csvText = response.data;
        } catch (error) {
          console.error(`Error fetching CSV file ${csv[0]}:`, error);
          // Continue with the text we already have
        }
      }

      // Process the CSV text
      if (csvText) {
        // Split into rows
        const rows = csvText.split('\n').map(row => row.trim()).filter(row => row.length > 0);
        rowCount = rows.length;

        // Extract headers from first row
        if (rows.length > 0) {
          headers = rows[0].split(',').map(header => header.trim().replace(/^"(.*)"$/, '$1'));
          columnCount = headers.length;
        }

        // Create HTML table
        if (this.options.preserveXlsxFormatting) { // Reuse XLSX formatting option
          let tableHtml = '<table border="1">';

          // Add header row
          if (headers.length > 0) {
            tableHtml += '<thead><tr>';
            for (const header of headers) {
              tableHtml += `<th>${header}</th>`;
            }
            tableHtml += '</tr></thead>';
          }

          // Add data rows
          tableHtml += '<tbody>';
          const dataRows = rows.slice(1, Math.min(rows.length, this.options.maxRows || 1000));
          for (const row of dataRows) {
            tableHtml += '<tr>';
            const cells = row.split(',').map(cell => cell.trim().replace(/^"(.*)"$/, '$1'));
            for (const cell of cells) {
              tableHtml += `<td>${cell}</td>`;
            }
            tableHtml += '</tr>';
          }
          tableHtml += '</tbody></table>';

          csvHtml = `<html><body>${tableHtml}</body></html>`;
        }
      }

      // Create HTML representation if we don't have one yet
      if (!csvHtml) {
        csvHtml = `<html><body><pre>${csvText}</pre></body></html>`;
      }

      // Convert to markdown
      const markdown = this.htmlToMarkdown(csvHtml);

      // Extract basic metadata
      const metadata: Record<string, string> = {
        contentType: 'text/csv',
        source: url,
        rowCount: rowCount.toString(),
        columnCount: columnCount.toString()
      };

      // Try to extract filename from URL
      const urlParts = url.split('/');
      const fileName = urlParts[urlParts.length - 1].split('?')[0];
      if (fileName.toLowerCase().endsWith('.csv')) {
        metadata.fileName = fileName;
      }

      // Segment content if needed
      const segmentResult = this.options.segmentContent
        ? this.segmentContent(csvText)
        : { chunks: [csvText], chunk_positions: [[0, csvText.length] as [number, number]] };

      // Create basic CSV info
      const csvInfo = {
        fileName: fileName || 'data.csv',
        fileSize: csvText.length,
        rowCount,
        columnCount,
        headers
      };

      return {
        url,
        title: title || fileName || 'CSV Data',
        text: csvText,
        markdown,
        html: csvHtml,
        metadata,
        chunks: segmentResult.chunks,
        chunk_positions: segmentResult.chunk_positions as [number, number][],
        documentType: 'csv',
        csvInfo
      };
    } catch (error) {
      console.error(`Error processing CSV ${url}:`, error);

      // Fallback to empty content
      const fallbackText = '';

      return {
        url,
        title: title || url,
        text: fallbackText,
        markdown: fallbackText,
        html: `<html><body><pre>${fallbackText}</pre></body></html>`,
        metadata: {},
        chunks: [fallbackText],
        chunk_positions: [[0, 0] as [number, number]],
        documentType: 'csv',
        csvInfo: {
          fileName: 'unknown.csv',
          fileSize: 0,
          rowCount: 0,
          columnCount: 0,
          headers: []
        }
      };
    }
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
