/**
 * Test script for the Search Engine
 */

import { SearchEngine } from './search/search-engine';

async function testSearchEngine() {
  console.log('Testing Search Engine...');

  // Get Gemini API key from command line arguments
  const args = process.argv.slice(2);
  const apiKeyArg = args.find(arg => arg.startsWith('--api-key='));
  const apiKey = apiKeyArg ? apiKeyArg.split('=')[1] : undefined;

  if (apiKey) {
    console.log('Using provided Gemini API key');
  } else {
    console.log('No Gemini API key provided, using local fallback for query expansion');
  }

  // Create search engine instance
  const searchEngine = new SearchEngine({
    geminiApiKey: apiKey,
    maxResults: 5,
    useBM25: true
  });

  // Test queries
  const queries = [
    'startup funding options',
    'best AI tools for small business'
  ];

  // Test each query
  for (const query of queries) {
    console.log(`\n--- Searching for: "${query}" ---`);

    try {
      // Perform search
      const results = await searchEngine.search(query);

      // Display results
      console.log(`Found ${results.length} results:`);
      for (const result of results) {
        console.log(`\nTitle: ${result.title}`);
        console.log(`URL: ${result.url}`);
        console.log(`Score: ${result.score.toFixed(4)}`);
        console.log(`Snippet: ${result.snippet}`);
      }
    } catch (error) {
      console.error(`Error searching for "${query}":`, error);
    }
  }

  // Test deep search
  const deepQuery = 'sustainable energy companies';
  console.log(`\n--- Performing deep search for: "${deepQuery}" ---`);

  try {
    // Perform deep search
    const results = await searchEngine.deepSearch(deepQuery);

    // Display results
    console.log(`Found ${results.length} results:`);
    for (const result of results) {
      console.log(`\nTitle: ${result.title}`);
      console.log(`URL: ${result.url}`);
      console.log(`Score: ${result.score.toFixed(4)}`);
      console.log(`Snippet: ${result.snippet}`);
    }
  } catch (error) {
    console.error(`Error performing deep search for "${deepQuery}":`, error);
  }

  console.log('\nSearch Engine test completed!');
}

// Run the test
testSearchEngine().catch(console.error);
