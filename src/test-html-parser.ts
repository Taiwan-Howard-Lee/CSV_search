/**
 * Test script for the Enhanced HTML Parser
 */

import { HtmlParser } from './processor/html-parser';
import * as fs from 'fs';

async function testHtmlParser() {
  console.log('Testing Enhanced HTML Parser...');
  
  // Create a parser instance
  const parser = new HtmlParser({
    preserveHeadings: true,
    preserveLists: true,
    preserveTables: true,
    preserveLinks: true,
    preserveImages: true,
    preserveEmphasis: true,
    preserveStructure: true,
    wordwrap: 100,
    removeEmptyLines: true
  });
  
  // Test HTML samples
  const samples = [
    {
      name: 'Simple HTML',
      html: `
        <html>
          <head>
            <title>Simple HTML Example</title>
            <meta name="description" content="A simple HTML example">
          </head>
          <body>
            <h1>Hello World</h1>
            <p>This is a <strong>simple</strong> HTML example with <em>formatting</em>.</p>
            <ul>
              <li>Item 1</li>
              <li>Item 2</li>
              <li>Item 3</li>
            </ul>
            <a href="https://example.com">Example Link</a>
          </body>
        </html>
      `
    },
    {
      name: 'Complex HTML',
      html: `
        <html>
          <head>
            <title>Complex HTML Example</title>
            <meta name="description" content="A complex HTML example">
            <meta property="og:title" content="Complex HTML Example">
            <meta property="og:description" content="A complex HTML example with structured content">
          </head>
          <body>
            <header>
              <nav>
                <ul>
                  <li><a href="/">Home</a></li>
                  <li><a href="/about">About</a></li>
                  <li><a href="/contact">Contact</a></li>
                </ul>
              </nav>
            </header>
            <main>
              <article>
                <h1>Complex HTML Example</h1>
                <p>This is a more complex HTML example with <strong>formatting</strong> and <em>structure</em>.</p>
                <h2>Section 1</h2>
                <p>This is the first section of the article.</p>
                <ul>
                  <li>Item 1</li>
                  <li>Item 2 with <a href="https://example.com">a link</a></li>
                  <li>Item 3</li>
                </ul>
                <h2>Section 2</h2>
                <p>This is the second section of the article.</p>
                <table>
                  <caption>Sample Table</caption>
                  <thead>
                    <tr>
                      <th>Header 1</th>
                      <th>Header 2</th>
                      <th>Header 3</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Row 1, Cell 1</td>
                      <td>Row 1, Cell 2</td>
                      <td>Row 1, Cell 3</td>
                    </tr>
                    <tr>
                      <td>Row 2, Cell 1</td>
                      <td>Row 2, Cell 2</td>
                      <td>Row 2, Cell 3</td>
                    </tr>
                  </tbody>
                </table>
                <figure>
                  <img src="https://example.com/image.jpg" alt="Example Image">
                  <figcaption>Example Image Caption</figcaption>
                </figure>
              </article>
            </main>
            <footer>
              <p>&copy; 2025 Example Company</p>
            </footer>
          </body>
        </html>
      `
    },
    {
      name: 'Google Docs HTML',
      html: `
        <html>
          <head>
            <title>Google Docs Example</title>
            <meta name="description" content="A Google Docs example">
          </head>
          <body>
            <h1 class="title">Google Docs Example</h1>
            <p class="subtitle">A document created in Google Docs</p>
            <p>This is a document that simulates the structure of a Google Docs export.</p>
            <h2>Section 1: Introduction</h2>
            <p>This is the introduction section of the document.</p>
            <p>It contains multiple paragraphs with <strong>bold text</strong> and <em>italic text</em>.</p>
            <h2>Section 2: Lists</h2>
            <p>Here are some lists:</p>
            <h3>Unordered List</h3>
            <ul>
              <li>Item 1</li>
              <li>Item 2 with <a href="https://example.com">a link</a></li>
              <li>Item 3 with <strong>bold text</strong></li>
            </ul>
            <h3>Ordered List</h3>
            <ol>
              <li>First item</li>
              <li>Second item</li>
              <li>Third item</li>
            </ol>
            <h2>Section 3: Table</h2>
            <p>Here is a table:</p>
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Age</th>
                  <th>Location</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>John Doe</td>
                  <td>30</td>
                  <td>New York</td>
                </tr>
                <tr>
                  <td>Jane Smith</td>
                  <td>25</td>
                  <td>San Francisco</td>
                </tr>
                <tr>
                  <td>Bob Johnson</td>
                  <td>40</td>
                  <td>Chicago</td>
                </tr>
              </tbody>
            </table>
            <h2>Section 4: Conclusion</h2>
            <p>This is the conclusion of the document.</p>
          </body>
        </html>
      `
    }
  ];
  
  // Process each sample
  for (const sample of samples) {
    console.log(`\n--- Testing ${sample.name} ---`);
    
    // Parse the HTML
    const parsedHtml = parser.parse(sample.html, 'https://example.com');
    
    // Display the results
    console.log(`Title: ${parsedHtml.title}`);
    console.log(`Metadata: ${Object.keys(parsedHtml.metadata).length} items`);
    console.log(`Headings: ${parsedHtml.headings.length} items`);
    console.log(`Links: ${parsedHtml.links.length} items`);
    console.log(`Images: ${parsedHtml.images.length} items`);
    console.log(`Tables: ${parsedHtml.tables.length} items`);
    console.log(`Lists: ${parsedHtml.lists.length} items`);
    
    // Display the plain text
    console.log('\nPlain Text (first 200 characters):');
    console.log(parsedHtml.text.substring(0, 200));
    
    // Display the structured text
    console.log('\nStructured Text (first 200 characters):');
    console.log(parsedHtml.structuredText.substring(0, 200));
    
    // Save the results to files
    const outputDir = 'html-parser-output';
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir);
    }
    
    const baseName = sample.name.toLowerCase().replace(/\s+/g, '-');
    
    fs.writeFileSync(`${outputDir}/${baseName}-plain.txt`, parsedHtml.text);
    fs.writeFileSync(`${outputDir}/${baseName}-structured.txt`, parsedHtml.structuredText);
    fs.writeFileSync(`${outputDir}/${baseName}-clean.html`, parsedHtml.cleanHtml);
    fs.writeFileSync(`${outputDir}/${baseName}-metadata.json`, JSON.stringify(parsedHtml.metadata, null, 2));
    fs.writeFileSync(`${outputDir}/${baseName}-headings.json`, JSON.stringify(parsedHtml.headings, null, 2));
    fs.writeFileSync(`${outputDir}/${baseName}-links.json`, JSON.stringify(parsedHtml.links, null, 2));
    fs.writeFileSync(`${outputDir}/${baseName}-tables.json`, JSON.stringify(parsedHtml.tables, null, 2));
    fs.writeFileSync(`${outputDir}/${baseName}-lists.json`, JSON.stringify(parsedHtml.lists, null, 2));
    
    console.log(`\nResults saved to ${outputDir}/${baseName}-*.txt/json`);
  }
  
  console.log('\nEnhanced HTML Parser test completed!');
}

// Run the test
testHtmlParser().catch(console.error);
