/**
 * Test script for the Data Extractor
 */

import { DataExtractor } from './extractor/data-extractor';
import { ExtractionField, SearchResult } from './types';

async function testDataExtractor() {
  console.log('Testing Data Extractor...');
  
  // Create a data extractor instance
  const extractor = new DataExtractor({
    useFuzzyMatching: true,
    confidenceThreshold: 0.5,
    includeSource: true,
    includeConfidence: true
  });
  
  // Define test fields
  const fields: ExtractionField[] = [
    { name: 'company', description: 'Company or startup name' },
    { name: 'founder', description: 'Founder or CEO name' },
    { name: 'funding', description: 'Funding amount' },
    { name: 'stage', description: 'Funding stage' },
    { name: 'location', description: 'Company headquarters' },
    { name: 'industry', description: 'Industry or sector' },
    { name: 'founded', description: 'Year founded' },
    { name: 'employees', description: 'Number of employees' },
    { name: 'description', description: 'Company description' }
  ];
  
  // Create test search results
  const searchResults: SearchResult[] = [
    {
      url: 'https://example.com/company1',
      title: 'TechCorp Inc. - Leading AI Solutions Provider',
      snippet: 'TechCorp Inc. was founded in 2015 by John Smith. The company has raised $25 million in Series B funding and is headquartered in San Francisco. With a team of 120 employees, TechCorp is revolutionizing the AI industry.',
      score: 0.95
    },
    {
      url: 'https://example.com/company2',
      title: 'HealthTech Solutions - Healthcare Technology',
      snippet: 'Based in Boston, HealthTech Solutions is a healthcare technology company established in 2018. The startup recently secured $10M in seed funding led by Acme Ventures. CEO Jane Doe previously worked at major hospitals.',
      score: 0.85
    },
    {
      url: 'https://example.com/company3',
      title: 'GreenEnergy - Sustainable Energy Solutions',
      snippet: 'GreenEnergy is a clean energy company founded in 2019. The London-based startup focuses on renewable energy solutions and has a team of 45 people. They received £5 million in funding at a pre-seed stage.',
      score: 0.75
    }
  ];
  
  // Test queries
  const queries = [
    'ai technology startups',
    'healthcare technology companies',
    'renewable energy startups'
  ];
  
  // Extract data for each query
  for (let i = 0; i < queries.length; i++) {
    const query = queries[i];
    const result = searchResults[i];
    
    console.log(`\n--- Extracting data for query: "${query}" ---`);
    console.log(`From result: ${result.title}`);
    
    try {
      // Extract data from a single result
      const extractedData = await extractor.extractData([result], fields, query);
      
      // Display the extracted data
      console.log('\nExtracted Data:');
      for (const data of extractedData) {
        console.log('\n-----------------------------------');
        for (const [key, value] of Object.entries(data)) {
          if (!key.includes('_confidence') && key !== '_source' && key !== '_title') {
            const confidence = data[`${key}_confidence`] || 'N/A';
            console.log(`${key}: ${value} (confidence: ${confidence})`);
          }
        }
        console.log(`Source: ${data._source}`);
        console.log('-----------------------------------');
      }
    } catch (error) {
      console.error(`Error extracting data for query "${query}":`, error);
    }
  }
  
  // Test batch extraction
  console.log('\n--- Testing batch extraction ---');
  try {
    const extractedData = await extractor.extractData(searchResults, fields, 'technology startups');
    
    console.log(`\nExtracted ${extractedData.length} results`);
    console.log('First result:');
    
    if (extractedData.length > 0) {
      const firstData = extractedData[0];
      for (const [key, value] of Object.entries(firstData)) {
        if (!key.includes('_confidence') && key !== '_source' && key !== '_title') {
          const confidence = firstData[`${key}_confidence`] || 'N/A';
          console.log(`${key}: ${value} (confidence: ${confidence})`);
        }
      }
    }
  } catch (error) {
    console.error('Error testing batch extraction:', error);
  }
  
  console.log('\nData Extractor test completed!');
}

// Run the test
testDataExtractor().catch(console.error);
