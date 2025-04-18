/**
 * Simple Express server for the SBC Gina Search Engine
 */

const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');
const { promisify } = require('util');

// Load configuration
let config = {
  server: {
    port: process.env.PORT || 3000,
    host: 'localhost'
  },
  search: {
    defaultMaxResults: 10,
    defaultSearchDepth: 2,
    defaultRankingAlgorithm: 'bm25',
    enableQueryExpansion: true,
    enableSchemaDetection: true,
    enableEnhancedParsing: true
  },
  output: {
    outputDirectory: 'results',
    cleanupIntermediateFiles: true
  },
  logging: {
    level: 'info',
    saveToFile: true,
    logDirectory: 'logs'
  }
};

// Try to load config from file
try {
  if (fs.existsSync('config.json')) {
    const fileConfig = JSON.parse(fs.readFileSync('config.json', 'utf8'));
    config = { ...config, ...fileConfig };
    console.log('Configuration loaded from config.json');
  }
} catch (error) {
  console.error('Error loading configuration:', error.message);
  console.log('Using default configuration');
}

// Create necessary directories
if (!fs.existsSync(config.output.outputDirectory)) {
  fs.mkdirSync(config.output.outputDirectory, { recursive: true });
}

if (config.logging.saveToFile && !fs.existsSync(config.logging.logDirectory)) {
  fs.mkdirSync(config.logging.logDirectory, { recursive: true });
}

const app = express();
const PORT = config.server.port;

// Middleware
app.use(bodyParser.json());
app.use(express.static('public'));

// Sample data for testing
const sampleResults = [
  {
    title: 'AI Startup Funding Report 2025',
    url: 'https://example.com/ai-startup-funding-2025',
    snippet: 'Comprehensive analysis of AI startup funding trends in 2025. Healthcare AI startups received the highest funding with $15.3 billion invested across 423 deals.',
    documentType: 'html',
    schemaTypes: ['Article', 'Report'],
    metadata: {
      author: 'Jane Smith',
      publishedDate: '2025-01-15',
      category: 'Finance'
    }
  },
  {
    title: 'MediTech AI: Revolutionizing Healthcare Diagnostics',
    url: 'https://example.com/meditech-ai-healthcare',
    snippet: 'MediTech AI has developed a new diagnostic tool that uses machine learning to detect early signs of cancer with 95% accuracy, significantly higher than traditional methods.',
    documentType: 'pdf',
    schemaTypes: ['Product', 'Organization'],
    metadata: {
      founder: 'Dr. Michael Chen',
      fundingStage: 'Series B',
      fundingAmount: '$42M'
    }
  },
  {
    title: 'Healthcare AI Startups to Watch in 2025',
    url: 'https://example.com/healthcare-ai-startups-2025',
    snippet: 'Our annual list of the most promising healthcare AI startups. These companies are using artificial intelligence to solve critical problems in medical diagnosis, drug discovery, and patient care.',
    documentType: 'html',
    schemaTypes: ['Article', 'ItemList'],
    metadata: {
      author: 'Tech Insights Team',
      publishedDate: '2025-02-10',
      category: 'Technology'
    }
  },
  {
    title: 'NeuroCare AI Secures $30M in Series A Funding',
    url: 'https://example.com/neurocare-funding',
    snippet: 'NeuroCare AI, a startup developing AI-powered mental health monitoring tools, has secured $30 million in Series A funding led by Health Ventures Capital.',
    documentType: 'html',
    schemaTypes: ['NewsArticle'],
    metadata: {
      founder: 'Dr. Sarah Johnson',
      fundingStage: 'Series A',
      fundingAmount: '$30M',
      investors: 'Health Ventures Capital, AI Innovations Fund'
    }
  },
  {
    title: 'AI in Healthcare: Market Analysis and Forecast 2025-2030',
    url: 'https://example.com/ai-healthcare-market-analysis.pdf',
    snippet: 'This comprehensive report analyzes the current state and future prospects of AI applications in healthcare, with market size projections and growth forecasts for 2025-2030.',
    documentType: 'pdf',
    schemaTypes: ['Report'],
    metadata: {
      author: 'Global Market Insights',
      publishedDate: '2025-03-01',
      pages: '128'
    }
  }
];

// API endpoint for search
app.post('/api/search', (req, res) => {
  console.log('Search request received:', req.body);

  const { query, headers, maxResults } = req.body;

  // Simulate search processing time
  setTimeout(() => {
    // Generate CSV data
    let csvContent = headers.join(',') + '\\n';

    // Add sample data rows
    for (let i = 0; i < Math.min(maxResults, 10); i++) {
      const row = headers.map(header => {
        const lowerHeader = header.toLowerCase();
        if (lowerHeader.includes('name') || lowerHeader.includes('company')) {
          return `AI Health Startup ${i+1}`;
        } else if (lowerHeader.includes('founder')) {
          return `Founder ${i+1}`;
        } else if (lowerHeader.includes('funding')) {
          return `$${(Math.random() * 50 + 1).toFixed(1)}M`;
        } else if (lowerHeader.includes('stage')) {
          const stages = ['Seed', 'Series A', 'Series B', 'Series C', 'IPO'];
          return stages[Math.floor(Math.random() * stages.length)];
        } else if (lowerHeader.includes('location')) {
          const locations = ['San Francisco', 'New York', 'Boston', 'London', 'Berlin', 'Tel Aviv'];
          return locations[Math.floor(Math.random() * locations.length)];
        } else if (lowerHeader.includes('description')) {
          return `AI-powered healthcare solution for ${['diagnostics', 'drug discovery', 'patient monitoring', 'medical imaging', 'mental health'][Math.floor(Math.random() * 5)]}`;
        } else if (lowerHeader.includes('url') || lowerHeader.includes('website')) {
          return `https://example.com/startup${i+1}`;
        } else {
          return `Data for ${header} ${i+1}`;
        }
      }).join(',');

      csvContent += row + '\\n';
    }

    // Send CSV response
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=search-results.csv');
    res.send(csvContent);
  }, 2000); // 2 second delay to simulate processing
});

// API endpoint for deep search
app.post('/api/deep-search', (req, res) => {
  console.log('Deep search request received:', req.body);

  const { query, headers, maxResults, searchDepth } = req.body;

  // Simulate longer processing time for deep search
  setTimeout(() => {
    // Generate CSV data
    let csvContent = headers.join(',') + '\\n';

    // Add sample data rows
    for (let i = 0; i < Math.min(maxResults, 10); i++) {
      const row = headers.map(header => {
        const lowerHeader = header.toLowerCase();
        if (lowerHeader.includes('name') || lowerHeader.includes('company')) {
          return `AI Health Startup ${i+1} (Deep Search)`;
        } else if (lowerHeader.includes('founder')) {
          return `Founder ${i+1}`;
        } else if (lowerHeader.includes('funding')) {
          return `$${(Math.random() * 50 + 1).toFixed(1)}M`;
        } else if (lowerHeader.includes('stage')) {
          const stages = ['Seed', 'Series A', 'Series B', 'Series C', 'IPO'];
          return stages[Math.floor(Math.random() * stages.length)];
        } else if (lowerHeader.includes('location')) {
          const locations = ['San Francisco', 'New York', 'Boston', 'London', 'Berlin', 'Tel Aviv'];
          return locations[Math.floor(Math.random() * locations.length)];
        } else if (lowerHeader.includes('description')) {
          return `AI-powered healthcare solution for ${['diagnostics', 'drug discovery', 'patient monitoring', 'medical imaging', 'mental health'][Math.floor(Math.random() * 5)]}`;
        } else if (lowerHeader.includes('url') || lowerHeader.includes('website')) {
          return `https://example.com/startup${i+1}`;
        } else {
          return `Deep Data for ${header} ${i+1}`;
        }
      }).join(',');

      csvContent += row + '\\n';
    }

    // Send CSV response
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=deep-search-results.csv');
    res.send(csvContent);
  }, 4000); // 4 second delay to simulate longer processing
});

// API endpoint for search results (JSON format)
app.post('/api/search-results', (req, res) => {
  console.log('Search results request received:', req.body);

  const { query, fileType, schemaType, rankingAlgorithm } = req.body;

  // Filter results based on request parameters
  let results = [...sampleResults];

  if (fileType && fileType !== 'all') {
    results = results.filter(result => result.documentType === fileType);
  }

  if (schemaType && schemaType !== 'all') {
    results = results.filter(result => result.schemaTypes.includes(schemaType));
  }

  // Add facet information
  const facets = {
    documentTypes: [
      { name: 'HTML', count: results.filter(r => r.documentType === 'html').length },
      { name: 'PDF', count: results.filter(r => r.documentType === 'pdf').length },
      { name: 'DOCX', count: results.filter(r => r.documentType === 'docx').length }
    ],
    schemaTypes: [
      { name: 'Article', count: results.filter(r => r.schemaTypes.includes('Article')).length },
      { name: 'Product', count: results.filter(r => r.schemaTypes.includes('Product')).length },
      { name: 'Organization', count: results.filter(r => r.schemaTypes.includes('Organization')).length },
      { name: 'Report', count: results.filter(r => r.schemaTypes.includes('Report')).length },
      { name: 'NewsArticle', count: results.filter(r => r.schemaTypes.includes('NewsArticle')).length }
    ]
  };

  // Simulate search processing time
  setTimeout(() => {
    res.json({
      query,
      totalResults: results.length,
      results,
      facets
    });
  }, 1000); // 1 second delay
});

// API endpoint for document content
app.get('/api/document', (req, res) => {
  const { url } = req.query;

  // Find the document in our sample data
  const document = sampleResults.find(doc => doc.url === url);

  if (!document) {
    return res.status(404).json({ error: 'Document not found' });
  }

  // Add more detailed content
  const documentContent = {
    ...document,
    content: `<h1>${document.title}</h1>
              <p>${document.snippet}</p>
              <p>This is a detailed content of the document that would be extracted from the actual web page or file. It contains all the information that would be useful for the user.</p>
              <p>In a real implementation, this would be the full text content extracted from the document, with proper formatting preserved.</p>`,
    metadata: {
      ...document.metadata,
      wordCount: Math.floor(Math.random() * 1000) + 500,
      language: 'English',
      lastUpdated: '2025-03-15'
    },
    schemaData: document.schemaTypes.map(type => ({
      type,
      source: 'json-ld',
      properties: {
        name: document.title,
        description: document.snippet,
        datePublished: document.metadata.publishedDate || '2025-01-01',
        author: document.metadata.author || 'Unknown'
      }
    }))
  };

  setTimeout(() => {
    res.json(documentContent);
  }, 500);
});

// API endpoint for cleanup
app.post('/api/cleanup', (req, res) => {
  console.log('Cleanup request received');

  // Define directories to clean
  const directories = [
    'html-parser-output',
    'schema-detector-output',
    'google-docs-output',
    'temp'
  ];

  // Define patterns to preserve
  const preservePatterns = [
    '.csv',
    'google-search',
    'search-results'
  ];

  // Create results directory if it doesn't exist
  const resultsDir = path.join(__dirname, 'results');
  if (!fs.existsSync(resultsDir)) {
    fs.mkdirSync(resultsDir, { recursive: true });
  }

  // Process each directory
  let cleanedFiles = 0;
  let preservedFiles = 0;

  directories.forEach(dir => {
    const dirPath = path.join(__dirname, dir);

    if (fs.existsSync(dirPath)) {
      // Read all files in the directory
      const files = fs.readdirSync(dirPath);

      files.forEach(file => {
        const filePath = path.join(dirPath, file);

        // Check if file is a directory
        if (fs.statSync(filePath).isDirectory()) {
          return; // Skip directories
        }

        // Check if file should be preserved
        const shouldPreserve = preservePatterns.some(pattern => file.includes(pattern));

        if (shouldPreserve) {
          // Copy file to results directory
          fs.copyFileSync(filePath, path.join(resultsDir, file));
          preservedFiles++;
        }

        // Delete the file
        fs.unlinkSync(filePath);
        cleanedFiles++;
      });
    }
  });

  res.json({
    success: true,
    message: `Cleanup completed. Cleaned ${cleanedFiles} files, preserved ${preservedFiles} files.`,
    cleanedFiles,
    preservedFiles
  });
});

// Start the server
app.listen(PORT, config.server.host, () => {
  const serverUrl = `http://${config.server.host === '0.0.0.0' ? 'localhost' : config.server.host}:${PORT}`;
  console.log(`Server running on ${serverUrl}`);
  console.log(`Open your browser to ${serverUrl} to use the SBC Gina Search Engine`);
  console.log(`API documentation available at ${serverUrl}/API.md`);
});

// Helper function to install dependencies if needed
function checkAndInstallDependencies() {
  try {
    require.resolve('express');
    console.log('Dependencies already installed.');
  } catch (e) {
    console.log('Installing dependencies...');
    exec('npm install express body-parser', (error, stdout, stderr) => {
      if (error) {
        console.error(`Error installing dependencies: ${error}`);
        return;
      }
      console.log(`Dependencies installed successfully.`);
      console.log(`Please restart the server with: node server.js`);
      process.exit(0);
    });
  }
}

// Check dependencies on startup
checkAndInstallDependencies();
