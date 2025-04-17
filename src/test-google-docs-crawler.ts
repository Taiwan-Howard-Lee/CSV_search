/**
 * Test script for crawling Google Docs documents
 */

import { EnhancedCrawler } from './crawler/enhanced-crawler';
import { ContentProcessor } from './processor/content-processor';
import { CrawlResult } from './types';
import { HtmlParser } from './processor/html-parser';
import axios from 'axios';
import * as fs from 'fs';

/**
 * Convert Google Docs URL to export URL
 * @param url Google Docs URL
 * @param format Export format (pdf, txt, html, docx, etc.)
 * @returns Export URL for the document
 */
function getGoogleDocsExportUrl(url: string, format: string = 'pdf'): string {
  // Extract the document ID from the URL
  const match = url.match(/\/document\/d\/([a-zA-Z0-9_-]+)/);
  if (!match) {
    throw new Error(`Invalid Google Docs URL: ${url}`);
  }

  const docId = match[1];

  // Create export URL with the specified format
  return `https://docs.google.com/document/d/${docId}/export?format=${format}`;
}

/**
 * Crawl a Google Docs document
 * @param url Google Docs URL
 */
async function crawlGoogleDoc(url: string): Promise<void> {
  console.log(`Crawling Google Docs document: ${url}`);

  try {
    // Try different export formats
    const formats = ['html', 'txt', 'pdf'];
    let documentContent = '';
    let documentTitle = '';
    let documentType = 'text';
    let exportFormat = '';

    // Try each format until we get content
    for (const format of formats) {
      try {
        // Convert to export URL with the current format
        const exportUrl = getGoogleDocsExportUrl(url, format);
        console.log(`Trying export URL: ${exportUrl}`);

        // Fetch the document content
        console.log(`Fetching document as ${format.toUpperCase()}...`);
        const response = await axios.get(exportUrl, {
          responseType: format === 'pdf' ? 'arraybuffer' : 'text',
          headers: {
            'User-Agent': 'SBC-GINA-GoogleDocsCrawler/1.0'
          },
          timeout: 10000
        });

        // Process based on format
        if (format === 'txt') {
          // Plain text format
          documentContent = response.data;
          documentTitle = 'Google Docs Document';
          documentType = 'text';
          exportFormat = 'txt';
          console.log(`Successfully fetched document as TXT (${documentContent.length} characters)`);
          break;
        } else if (format === 'html') {
          // HTML format
          documentContent = response.data;

          // Try to extract title
          const titleMatch = documentContent.match(/<title>([^<]+)<\/title>/);
          documentTitle = titleMatch ? titleMatch[1] : 'Google Docs Document';

          // Use the enhanced HTML parser to extract structured content
          const htmlParser = new HtmlParser({
            preserveHeadings: true,
            preserveLists: true,
            preserveTables: true,
            preserveLinks: true,
            preserveImages: true,
            preserveEmphasis: true,
            preserveStructure: true
          });

          // Parse the HTML
          const parsedHtml = htmlParser.parse(documentContent, exportUrl);

          // Use the structured text
          documentContent = parsedHtml.structuredText;

          // Save the parsed HTML data
          const outputDir = 'google-docs-output';
          if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir);
          }

          fs.writeFileSync(`${outputDir}/parsed-html.json`, JSON.stringify({
            title: parsedHtml.title,
            headings: parsedHtml.headings,
            links: parsedHtml.links,
            tables: parsedHtml.tables,
            lists: parsedHtml.lists,
            metadata: parsedHtml.metadata
          }, null, 2));

          fs.writeFileSync(`${outputDir}/structured-text.txt`, parsedHtml.structuredText);
          fs.writeFileSync(`${outputDir}/plain-text.txt`, parsedHtml.text);
          fs.writeFileSync(`${outputDir}/clean-html.html`, parsedHtml.cleanHtml);

          documentType = 'html';
          exportFormat = 'html';
          console.log(`Successfully fetched document as HTML (${documentContent.length} characters)`);
          break;
        } else if (format === 'pdf' && response.headers['content-type'] === 'application/pdf') {
          // PDF format - use the crawler to extract text
          console.log('Successfully fetched PDF document');
          console.log(`Content length: ${response.data.length} bytes`);

          // Create a crawler instance
          const crawler = new EnhancedCrawler({
            maxDepth: 1,
            extractPdf: true
          });

          // Create a crawl result with the PDF content
          const result = await crawler.fetchPdf(exportUrl);
          documentContent = result.text;
          documentTitle = result.title || 'Google Docs Document';
          documentType = 'pdf';
          exportFormat = 'pdf';
          console.log(`Extracted ${documentContent.length} characters of text from the PDF`);
          break;
        }
      } catch (formatError: any) {
        console.error(`Error fetching document as ${format}:`, formatError.message || formatError);
      }
    }

    if (!documentContent) {
      throw new Error('Failed to fetch document content in any format');
    }

    // Create a processor instance
    const processor = new ContentProcessor({
      segmentContent: true
    });

    // Create a crawl result
    const result: CrawlResult = {
      url,
      html: `<html><body><pre>${documentContent}</pre></body></html>`,
      title: documentTitle,
      text: documentContent,
      links: [],
      status: 200,
      contentType: exportFormat === 'pdf' ? 'application/pdf' :
                  exportFormat === 'html' ? 'text/html' : 'text/plain',
      documentType: exportFormat === 'pdf' ? 'pdf' :
                   exportFormat === 'html' ? 'html' : 'other'
    };

    // Process the content
    const processed = await processor.process(result);

    // Display the results
    console.log('\n--- Document Content ---');
    console.log(`Title: ${processed.title}`);
    console.log(`Document Type: ${processed.documentType}`);
    console.log(`Text length: ${processed.text.length} characters`);
    console.log(`Number of chunks: ${processed.chunks.length}`);
    console.log('\nFirst 500 characters:');
    console.log(processed.text.substring(0, 500));

    // Save the content to a file
    console.log('\nSaving content to google-doc-content.txt');
    fs.writeFileSync('google-doc-content.txt', processed.text);
    console.log('Content saved successfully');
  } catch (error) {
    console.error('Error crawling Google Docs document:', error);
  }
}

// Run the test
const googleDocsUrl = 'https://docs.google.com/document/d/1Rw_b7p9RUa2vqo9FIvpUeYHO0XfMx98PDbo3r7RF0ew/edit?usp=sharing';
crawlGoogleDoc(googleDocsUrl).catch(console.error);
