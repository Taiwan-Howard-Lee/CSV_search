/**
 * Test script for the Enhanced Crawler
 */

import { EnhancedCrawler } from './crawler/enhanced-crawler';

async function testCrawler() {
  console.log('Testing Enhanced Crawler...');
  
  // Create crawler instance
  const crawler = new EnhancedCrawler({
    maxDepth: 1,
    maxPages: 2,
    delayMs: 2000,
    respectRobotsTxt: true
  });
  
  try {
    // Test basic crawl
    console.log('\n--- Testing basic crawl ---');
    const results = await crawler.crawl('https://example.com', 1);
    console.log(`Crawled ${results.length} pages`);
    console.log(`First page title: ${results[0].title}`);
    console.log(`First page links: ${results[0].links.length}`);
    
    console.log('\nCrawler test completed successfully!');
  } catch (error) {
    console.error('Error testing crawler:', error);
  }
}

// Run the test
testCrawler().catch(console.error);
