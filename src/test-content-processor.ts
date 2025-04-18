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
    console.log(`Document Type: ${processedPdf.documentType}`);
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

  // Test DOCX processing
  console.log('\n--- Testing DOCX Processing ---');

  try {
    // Create a DOCX crawl result with pre-extracted text
    const docxResult: CrawlResult = {
      url: 'https://example.com/sample.docx',
      html: '<html><body><p>DOCX content</p></body></html>',
      title: 'Sample Word Document',
      text: 'Sample Word Document\n\nThis is a sample Word document for testing the Content Processor.\n\nIt contains multiple paragraphs and some formatting.\n\nHeading 1\n\nThis is content under heading 1.\n\nHeading 2\n\nThis is content under heading 2.\n\nBullet points:\n• Point 1\n• Point 2\n• Point 3\n\nNumbered list:\n1. First item\n2. Second item\n3. Third item',
      links: [],
      status: 200,
      contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      docx: ['https://example.com/sample.docx']
    };

    console.log('Processing DOCX content...');
    const processedDocx = await processor.process(docxResult);

    console.log('DOCX processing successful!');
    console.log(`Title: ${processedDocx.title}`);
    console.log(`Document Type: ${processedDocx.documentType}`);
    console.log(`Text length: ${processedDocx.text.length} characters`);
    console.log(`Number of chunks: ${processedDocx.chunks.length}`);
    console.log('First 200 characters:');
    console.log(processedDocx.text.substring(0, 200));

    if (processedDocx.docxInfo) {
      console.log('\nDOCX Info:');
      console.log(`  File name: ${processedDocx.docxInfo.fileName}`);
      console.log(`  Word count: ${processedDocx.docxInfo.wordCount}`);
      console.log(`  Paragraph count: ${processedDocx.docxInfo.paragraphCount}`);
    }

    console.log('\nMetadata:');
    Object.entries(processedDocx.metadata).forEach(([key, value]) => {
      console.log(`  ${key}: ${value}`);
    });
  } catch (error) {
    console.error('Error processing DOCX:', error);
  }

  // Test XLSX processing
  console.log('\n--- Testing XLSX Processing ---');

  try {
    // Create an XLSX crawl result with pre-extracted text
    const xlsxResult: CrawlResult = {
      url: 'https://example.com/sample.xlsx',
      html: '<html><body><p>XLSX content</p></body></html>',
      title: 'Sample Excel Spreadsheet',
      text: 'Sheet: Sheet1\nHeader 1\tHeader 2\tHeader 3\nA1\tB1\tC1\nA2\tB2\tC2\nA3\tB3\tC3\n\nSheet: Sheet2\nName\tAge\tCity\nJohn\t30\tNew York\nJane\t25\tLos Angeles\nBob\t40\tChicago',
      links: [],
      status: 200,
      contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      xlsx: ['https://example.com/sample.xlsx']
    };

    console.log('Processing XLSX content...');
    const processedXlsx = await processor.process(xlsxResult);

    console.log('XLSX processing successful!');
    console.log(`Title: ${processedXlsx.title}`);
    console.log(`Document Type: ${processedXlsx.documentType}`);
    console.log(`Text length: ${processedXlsx.text.length} characters`);
    console.log(`Number of chunks: ${processedXlsx.chunks.length}`);
    console.log('First 200 characters:');
    console.log(processedXlsx.text.substring(0, 200));

    if (processedXlsx.xlsxInfo) {
      console.log('\nXLSX Info:');
      console.log(`  File name: ${processedXlsx.xlsxInfo.fileName}`);
      console.log(`  Sheet count: ${processedXlsx.xlsxInfo.sheetCount}`);
      console.log(`  Cell count: ${processedXlsx.xlsxInfo.cellCount}`);
    }

    console.log('\nMetadata:');
    Object.entries(processedXlsx.metadata).forEach(([key, value]) => {
      console.log(`  ${key}: ${value}`);
    });
  } catch (error) {
    console.error('Error processing XLSX:', error);
  }

  // Test CSV processing
  console.log('\n--- Testing CSV Processing ---');

  try {
    // Create a CSV crawl result with pre-extracted text
    const csvResult: CrawlResult = {
      url: 'https://example.com/sample.csv',
      html: '<html><body><p>CSV content</p></body></html>',
      title: 'Sample CSV File',
      text: 'Name,Age,City\nJohn,30,"New York"\nJane,25,"Los Angeles"\nBob,40,Chicago',
      links: [],
      status: 200,
      contentType: 'text/csv',
      csv: ['https://example.com/sample.csv']
    };

    console.log('Processing CSV content...');
    const processedCsv = await processor.process(csvResult);

    console.log('CSV processing successful!');
    console.log(`Title: ${processedCsv.title}`);
    console.log(`Document Type: ${processedCsv.documentType}`);
    console.log(`Text length: ${processedCsv.text.length} characters`);
    console.log(`Number of chunks: ${processedCsv.chunks.length}`);
    console.log('First 200 characters:');
    console.log(processedCsv.text.substring(0, 200));

    if (processedCsv.csvInfo) {
      console.log('\nCSV Info:');
      console.log(`  File name: ${processedCsv.csvInfo.fileName}`);
      console.log(`  Row count: ${processedCsv.csvInfo.rowCount}`);
      console.log(`  Column count: ${processedCsv.csvInfo.columnCount}`);
      console.log(`  Headers: ${processedCsv.csvInfo.headers?.join(', ') || 'None'}`);
    }

    console.log('\nMetadata:');
    Object.entries(processedCsv.metadata).forEach(([key, value]) => {
      console.log(`  ${key}: ${value}`);
    });
  } catch (error) {
    console.error('Error processing CSV:', error);
  }

  console.log('\nContent Processor test completed!');
}

// Run the test
testContentProcessor().catch(console.error);
