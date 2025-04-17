/**
 * Custom Gina Search Engine
 * Main entry point
 */

import express from 'express';
import cors from 'cors';
import path from 'path';
import { createCSVSearchEngine } from './search/csv-search-engine';
import { CSVOptions } from './types';

// Create Express app
const app = express();
app.use(express.json());
app.use(cors());
app.use(express.static(path.join(__dirname, '../public')));

// Get Gemini API key from environment variable
const geminiApiKey = process.env.GEMINI_API_KEY;

// Create search engine instance with Gemini API key
const searchEngine = createCSVSearchEngine({
  geminiApiKey: geminiApiKey
});

// Log whether Gemini API is available
if (geminiApiKey) {
  console.log('Gemini API key found. Query expansion with Gemini will be used.');
} else {
  console.log('No Gemini API key found. Local fallback for query expansion will be used.');
  console.log('To use Gemini, set the GEMINI_API_KEY environment variable.');
}

// Simple search endpoint
app.post('/api/search', async (req, res) => {
  try {
    const { query, headers, headerDescriptions, maxResults, includeSource } = req.body;

    if (!query || !headers || !Array.isArray(headers)) {
      return res.status(400).json({ error: 'Invalid request. Query and headers array are required.' });
    }

    const options: CSVOptions = {
      headers,
      headerDescriptions,
      maxResults: maxResults || 10,
      includeSource: includeSource !== false
    };

    console.log(`Processing search request: "${query}" with headers: ${headers.join(', ')}`);

    const result = await searchEngine.search(query, options);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="search-results.csv"`);
    res.send(result.csv);
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Search failed' });
  }
});

// Deep search endpoint
app.post('/api/deep-search', async (req, res) => {
  try {
    const {
      query,
      headers,
      headerDescriptions,
      includeSource,
      searchDepth
    } = req.body;

    if (!query || !headers || !Array.isArray(headers)) {
      return res.status(400).json({ error: 'Invalid request. Query and headers array are required.' });
    }

    const options: CSVOptions = {
      headers,
      headerDescriptions,
      includeSource: includeSource !== false,
      searchDepth: searchDepth || 2
    };

    console.log(`Processing deep search request: "${query}" with headers: ${headers.join(', ')}`);

    const result = await searchEngine.deepSearch(query, options);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="deep-search-results.csv"`);
    res.send(result.csv);
  } catch (error) {
    console.error('Deep search error:', error);
    res.status(500).json({ error: 'Deep search failed' });
  }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Access the web interface at http://localhost:${PORT}`);
});
