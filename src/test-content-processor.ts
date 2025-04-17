/**
 * Test script for the Content Processor
 */

import { ContentProcessor } from './processor/content-processor';
import { CrawlResult } from './types';
import axios from 'axios';

async function testContentProcessor() {
  console.log('Testing Content Processor...');

  // Create a content processor instance
  const processor = new ContentProcessor({
    withImages: true,
    withLinks: true,
    segmentContent: true,
    extractPdfMetadata: true,
    pdfTextLayout: true,
    pdfMaxPages: 10
  });

  // Test HTML processing
  console.log('\n--- Testing HTML Processing ---');
  const htmlResult: CrawlResult = {
    url: 'https://example.com',
    html: `
      <html>
        <head>
          <title>Example Domain</title>
          <meta name="description" content="This is an example website">
          <meta property="og:title" content="Example Domain">
        </head>
        <body>
          <h1>Example Domain</h1>
          <p>This domain is for use in illustrative examples in documents.</p>
          <p>You may use this domain in literature without prior coordination or asking for permission.</p>
          <a href="https://www.iana.org/domains/example">More information...</a>
        </body>
      </html>
    `,
    title: 'Example Domain',
    text: 'Example Domain This domain is for use in illustrative examples in documents. You may use this domain in literature without prior coordination or asking for permission. More information...',
    links: [['More information...', 'https://www.iana.org/domains/example']],
    status: 200,
    contentType: 'text/html'
  };

  try {
    console.log('Processing HTML content...');
    const processedHtml = await processor.process(htmlResult);

    console.log('HTML processing successful!');
    console.log(`Title: ${processedHtml.title}`);
    console.log(`Text length: ${processedHtml.text.length} characters`);
    console.log(`Markdown length: ${processedHtml.markdown.length} characters`);
    console.log(`Number of chunks: ${processedHtml.chunks.length}`);
    console.log('Metadata:');
    Object.entries(processedHtml.metadata).forEach(([key, value]) => {
      console.log(`  ${key}: ${value}`);
    });
  } catch (error) {
    console.error('Error processing HTML:', error);
  }

  // Test PDF processing
  console.log('\n--- Testing PDF Processing ---');

  try {
    // Create a PDF crawl result with pre-extracted text
    const pdfResult: CrawlResult = {
      url: 'https://example.com/sample.pdf',
      html: '<html><body><p>PDF content</p></body></html>',
      title: '2030 Blueprint for Developing Taiwan into a Bilingual Nation',
      text: '2030 Blueprint for Developing Taiwan into a Bilingual Nation by 2030\n\nNational Development Council\nDecember 2018\n\nExecutive Yuan, December 10, 2018\n\nTable of Contents\n\n1. Foreword\n2. Vision and Goals\n3. Strategy and Implementation\n4. Budget and Timeline\n5. Expected Outcomes\n\nThis document outlines Taiwan\'s strategy to become a bilingual nation by 2030, focusing on English and Mandarin proficiency across government, education, and business sectors.',
      links: [],
      status: 200,
      contentType: 'application/pdf',
      pdfs: ['https://example.com/sample.pdf']
    };

    console.log('Processing PDF content...');
    const processedPdf = await processor.process(pdfResult);

    console.log('PDF processing successful!');
    console.log(`Title: ${processedPdf.title}`);
    console.log(`Text length: ${processedPdf.text.length} characters`);
    console.log(`Number of chunks: ${processedPdf.chunks.length}`);
    console.log('First 200 characters:');
    console.log(processedPdf.text.substring(0, 200));

    if (processedPdf.isPdf && processedPdf.pdfInfo) {
      console.log('\nPDF Info:');
      console.log(`  File name: ${processedPdf.pdfInfo.fileName}`);
      console.log(`  Is PDF: ${processedPdf.pdfInfo.isPdf}`);
    }

    console.log('\nMetadata:');
    Object.entries(processedPdf.metadata).forEach(([key, value]) => {
      console.log(`  ${key}: ${value}`);
    });
  } catch (error) {
    console.error('Error processing PDF:', error);
  }

  console.log('\nContent Processor test completed!');
}

// Run the test
testContentProcessor().catch(console.error);
