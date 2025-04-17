/**
 * Test script for the Enhanced Crawler
 */

import { EnhancedCrawler } from './crawler/enhanced-crawler';

async function testEnhancedCrawler() {
  console.log('Testing Enhanced Crawler...');

  // Create crawler instance with advanced options
  const crawler = new EnhancedCrawler({
    maxDepth: 2,
    maxPages: 5,
    delayMs: 1000,
    timeout: 30000,
    userAgent: 'SBC-GINA-Test-Crawler/1.0',
    useSitemaps: true,
    adaptiveCrawling: true,
    extractPdf: true,
    maxLinksPerPage: 10,
    priorityKeywords: ['startup', 'funding', 'technology', 'innovation']
  });

  // Test URLs
  const testUrls = [
    'https://www.example.com',
    'https://www.wikipedia.org'
  ];

  // Test sitemap parsing
  console.log('\n--- Testing Sitemap Parsing ---');
  for (const url of testUrls) {
    try {
      console.log(`\nFetching sitemap for ${url}...`);
      // Access the private method using any type assertion
      const sitemapUrls = await (crawler as any).getSitemapUrls(url);
      console.log(`Found ${sitemapUrls.length} URLs in sitemap`);

      if (sitemapUrls.length > 0) {
        console.log('First 5 URLs from sitemap:');
        sitemapUrls.slice(0, 5).forEach((url: string) => console.log(`- ${url}`));
      }
    } catch (error) {
      console.error(`Error fetching sitemap for ${url}:`, error);
    }
  }

  // Test PDF extraction
  console.log('\n--- Testing PDF Extraction ---');
  const pdfUrl = 'https://ws.ndc.gov.tw/Download.ashx?u=LzAwMS9hZG1pbmlzdHJhdG9yLzEwL3JlbGZpbGUvMC8xMjE2Ny9hNGM4YWMwMS0zNDMyLTRhMDAtOGYwNy02NDExOWVjNWQ2ODgucGRm&n=MjAzMOmbmeiqnuWci%2BWutuaUv%2BetlueZvOWxleiXjeWcli5wZGY%3D&icon=..pdf';
  try {
    console.log(`\nExtracting content from ${pdfUrl}...`);
    const result = await (crawler as any).fetchPdf(pdfUrl);
    console.log('PDF extraction successful!');
    console.log(`Title: ${result.title}`);
    console.log(`Text length: ${result.text.length} characters`);
    console.log('First 200 characters:');
    console.log(result.text.substring(0, 200));
  } catch (error) {
    console.error(`Error extracting PDF:`, error);
  }

  // Test adaptive crawling
  console.log('\n--- Testing Adaptive Crawling ---');
  try {
    console.log('\nCrawling with adaptive crawling enabled...');
    const results = await crawler.crawl('https://www.example.com', 1);
    console.log(`Crawled ${results.length} pages`);

    // Display results
    results.forEach((result, i) => {
      console.log(`\nResult ${i + 1}:`);
      console.log(`URL: ${result.url}`);
      console.log(`Title: ${result.title}`);
      console.log(`Links: ${result.links.length}`);
      console.log(`Text length: ${result.text.length} characters`);
    });
  } catch (error) {
    console.error('Error during adaptive crawling:', error);
  }

  console.log('\nEnhanced Crawler test completed!');
}

// Run the test
testEnhancedCrawler().catch(console.error);
