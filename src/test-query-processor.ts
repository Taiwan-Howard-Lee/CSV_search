/**
 * Test script for the Query Processor
 */

import { QueryProcessor } from './query/query-processor';

async function testQueryProcessor() {
  console.log('Testing Query Processor...');

  // Get Gemini API key from command line arguments
  const args = process.argv.slice(2);
  const apiKeyArg = args.find(arg => arg.startsWith('--api-key='));
  const apiKey = apiKeyArg ? apiKeyArg.split('=')[1] : undefined;

  if (apiKey) {
    console.log('Using provided Gemini API key');
  } else {
    console.log('No Gemini API key provided, using local fallback');
  }

  // Create a query processor instance
  const queryProcessor = new QueryProcessor({
    apiKey,
    maxSynonymsPerTerm: 3,
    maxRelatedConcepts: 5,
    includeAlternativePhrases: true,
    temperature: 0.2
  });

  // Test queries
  const queries = [
    'startup funding options',
    'best AI tools for small business',
    'how to create a marketing plan',
    'sustainable energy companies'
  ];

  // Process each query
  for (const query of queries) {
    console.log(`\n--- Processing query: "${query}" ---`);

    try {
      // Process the query
      const processed = await queryProcessor.processQuery(query);

      // Display the results
      console.log('Original query:', processed.original);

      console.log('\nSynonyms:');
      processed.synonyms.forEach((synonymGroup, i) => {
        console.log(`  Group ${i + 1}: ${synonymGroup.join(', ')}`);
      });

      console.log('\nRelated concepts:');
      processed.relatedConcepts.forEach(concept => {
        console.log(`  - ${concept}`);
      });

      console.log('\nAlternative phrases:');
      processed.alternativePhrases.forEach(phrase => {
        console.log(`  - ${phrase}`);
      });

      console.log('\nEntities:');
      processed.entities.forEach(entity => {
        console.log(`  - ${entity}`);
      });

      console.log('\nExpanded query:');
      console.log(processed.expandedQuery);
    } catch (error) {
      console.error(`Error processing query "${query}":`, error);
    }
  }


  console.log('\nQuery Processor test completed!');
}

// Run the test
testQueryProcessor().catch(console.error);
