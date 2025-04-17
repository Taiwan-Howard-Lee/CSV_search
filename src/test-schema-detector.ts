/**
 * Test script for the Schema Detector
 */

import { SchemaDetector } from './processor/schema-detector';
import * as fs from 'fs';
import axios from 'axios';

async function testSchemaDetector() {
  console.log('Testing Schema Detector...');

  // Create a schema detector instance
  const detector = new SchemaDetector({
    extractJsonLd: true,
    extractMicrodata: true,
    extractRdfa: true,
    normalizeData: true
  });

  // Test HTML samples with schema.org markup
  const samples = [
    {
      name: 'JSON-LD Product',
      html: `
        <html>
          <head>
            <title>Product Example</title>
            <script type="application/ld+json">
            {
              "@context": "https://schema.org/",
              "@type": "Product",
              "name": "Executive Anvil",
              "image": "https://example.com/photos/1x1/photo.jpg",
              "description": "Sleeker than ACME's Classic Anvil, the Executive Anvil is perfect for the business traveler looking for something to drop from a height.",
              "sku": "0446310786",
              "mpn": "925872",
              "brand": {
                "@type": "Brand",
                "name": "ACME"
              },
              "review": {
                "@type": "Review",
                "reviewRating": {
                  "@type": "Rating",
                  "ratingValue": "4",
                  "bestRating": "5"
                },
                "author": {
                  "@type": "Person",
                  "name": "Fred Benson"
                }
              },
              "aggregateRating": {
                "@type": "AggregateRating",
                "ratingValue": "4.4",
                "reviewCount": "89"
              },
              "offers": {
                "@type": "Offer",
                "url": "https://example.com/anvil",
                "priceCurrency": "USD",
                "price": "119.99",
                "priceValidUntil": "2025-12-05",
                "itemCondition": "https://schema.org/UsedCondition",
                "availability": "https://schema.org/InStock"
              }
            }
            </script>
          </head>
          <body>
            <h1>Executive Anvil</h1>
            <p>Sleeker than ACME's Classic Anvil, the Executive Anvil is perfect for the business traveler looking for something to drop from a height.</p>
            <p>Price: $119.99</p>
          </body>
        </html>
      `
    },
    {
      name: 'Microdata Event',
      html: `
        <html>
          <head>
            <title>Event Example</title>
          </head>
          <body>
            <div itemscope itemtype="http://schema.org/Event">
              <h1 itemprop="name">Startup Conference 2025</h1>
              <p>
                <meta itemprop="startDate" content="2025-01-15T09:00">
                January 15, 2025 at 9:00AM
              </p>
              <p itemprop="location" itemscope itemtype="http://schema.org/Place">
                <span itemprop="name">San Francisco Convention Center</span>
                <span itemprop="address" itemscope itemtype="http://schema.org/PostalAddress">
                  <span itemprop="streetAddress">123 Main St</span>,
                  <span itemprop="addressLocality">San Francisco</span>,
                  <span itemprop="addressRegion">CA</span>
                </span>
              </p>
              <p itemprop="description">Join us for the annual startup conference featuring keynote speakers, workshops, and networking opportunities.</p>
              <p>
                Tickets:
                <span itemprop="offers" itemscope itemtype="http://schema.org/Offer">
                  <span itemprop="price">$299</span>
                  <meta itemprop="priceCurrency" content="USD">
                  <link itemprop="availability" href="http://schema.org/InStock">Available
                </span>
              </p>
              <p>
                Organized by:
                <span itemprop="organizer" itemscope itemtype="http://schema.org/Organization">
                  <span itemprop="name">Startup Association</span>
                </span>
              </p>
            </div>
          </body>
        </html>
      `
    },
    {
      name: 'RDFa Person',
      html: `
        <html>
          <head>
            <title>Person Example</title>
          </head>
          <body>
            <div vocab="https://schema.org/" typeof="Person">
              <h1 property="name">John Doe</h1>
              <p>Email: <a property="email" href="mailto:john@example.com">john@example.com</a></p>
              <p property="jobTitle">Software Engineer</p>
              <p>Works for: <span property="worksFor" typeof="Organization">
                <span property="name">Example Corp</span>
                <span property="url" content="https://example.com"></span>
              </span></p>
              <p>Address: <span property="address" typeof="PostalAddress">
                <span property="streetAddress">123 Main St</span>,
                <span property="addressLocality">San Francisco</span>,
                <span property="addressRegion">CA</span>,
                <span property="postalCode">94103</span>,
                <span property="addressCountry">USA</span>
              </span></p>
            </div>
          </body>
        </html>
      `
    }
  ];

  // Process each sample
  for (const sample of samples) {
    console.log(`\n--- Testing ${sample.name} ---`);

    // Detect schema.org data
    const schemaData = await detector.detect(sample.html, 'https://example.com');

    // Display the results
    console.log(`Detected ${schemaData.length} schema.org items`);

    for (const schema of schemaData) {
      console.log(`\nType: ${schema.type}`);
      console.log(`Source: ${schema.source}`);
      console.log('Properties:');

      // Display top-level properties
      for (const [key, value] of Object.entries(schema.properties)) {
        if (typeof value === 'object' && value !== null) {
          console.log(`  ${key}: [Object]`);
        } else {
          console.log(`  ${key}: ${value}`);
        }
      }
    }

    // Save the results to files
    const outputDir = 'schema-detector-output';
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir);
    }

    const baseName = sample.name.toLowerCase().replace(/\s+/g, '-');
    fs.writeFileSync(`${outputDir}/${baseName}.json`, JSON.stringify(schemaData, null, 2));

    console.log(`\nResults saved to ${outputDir}/${baseName}.json`);
  }

  // Test with a real website
  console.log('\n--- Testing Real Website ---');

  try {
    // Fetch a real website with schema.org markup
    const url = 'https://www.imdb.com/title/tt0111161/'; // The Shawshank Redemption on IMDb
    console.log(`Fetching ${url}...`);

    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    console.log('Detecting schema.org data...');
    const schemaData = await detector.detect(response.data, url);

    console.log(`Detected ${schemaData.length} schema.org items`);

    // Display schema types
    const types = schemaData.map(schema => schema.type);
    console.log('Schema types:', types.join(', '));

    // Save the results
    const imdbOutputDir = 'schema-detector-output';
    if (!fs.existsSync(imdbOutputDir)) {
      fs.mkdirSync(imdbOutputDir);
    }
    fs.writeFileSync(`${imdbOutputDir}/imdb-movie.json`, JSON.stringify(schemaData, null, 2));
    console.log(`\nResults saved to ${imdbOutputDir}/imdb-movie.json`);
  } catch (error) {
    console.error('Error fetching real website:', error);
  }

  console.log('\nSchema Detector test completed!');
}

// Run the test
testSchemaDetector().catch(console.error);
