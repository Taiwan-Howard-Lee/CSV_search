/**
 * Test script for the Content Processor
 */

import { EnhancedCrawler } from './crawler/enhanced-crawler';
import { ContentProcessor } from './processor/content-processor';

async function testProcessor() {
  console.log('Testing Content Processor...');
  
  // Create crawler instance
  const crawler = new EnhancedCrawler({
    maxDepth: 1,
    maxPages: 1
  });
  
  // Create processor instance
  const processor = new ContentProcessor({
    withImages: true,
    withLinks: true,
    segmentContent: true
  });
  
  try {
    // Crawl a page
    console.log('\n--- Crawling a page ---');
    const results = await crawler.crawl('https://example.com', 1);
    console.log(`Crawled ${results.length} pages`);
    
    // Process the page
    console.log('\n--- Processing the page ---');
    const processed = await processor.process(results[0]);
    
    // Display results
    console.log(`Title: ${processed.title}`);
    console.log(`URL: ${processed.url}`);
    console.log(`Text length: ${processed.text.length} characters`);
    console.log(`Markdown length: ${processed.markdown.length} characters`);
    console.log(`Number of chunks: ${processed.chunks.length}`);
    
    // Display metadata
    console.log('\n--- Metadata ---');
    for (const [key, value] of Object.entries(processed.metadata)) {
      console.log(`${key}: ${value}`);
    }
    
    // Display first chunk
    console.log('\n--- First chunk ---');
    console.log(processed.chunks[0]);
    
    console.log('\nProcessor test completed successfully!');
  } catch (error) {
    console.error('Error testing processor:', error);
  }
}

// Run the test
testProcessor().catch(console.error);
