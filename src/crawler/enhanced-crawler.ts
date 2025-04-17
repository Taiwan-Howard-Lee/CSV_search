/**
 * Enhanced Crawler
 *
 * A powerful web crawler that supports both HTTP and Puppeteer-based crawling,
 * with features like caching, robots.txt compliance, and adaptive crawling.
 */

import axios from 'axios';
import puppeteer from 'puppeteer';
import robotsParser from 'robots-parser';
import { CrawlOptions, CrawlResult } from '../types';
import { URL } from 'url';

/**
 * Enhanced Crawler class that provides advanced web crawling capabilities
 */
export class EnhancedCrawler {
  /**
   * Default crawling options
   */
  private static readonly DEFAULT_OPTIONS: CrawlOptions = {
    maxDepth: 2,
    maxPages: 10,
    delayMs: 1000,
    timeout: 30000,
    userAgent: 'SBC-GINA-Crawler/1.0',
    cacheValidMs: 24 * 60 * 60 * 1000, // 24 hours
    respectRobotsTxt: true
  };

  /**
   * Crawler options
   */
  private options: CrawlOptions;

  /**
   * Cache for storing fetched pages
   */
  private cache: Map<string, {
    result: CrawlResult;
    timestamp: number;
  }> = new Map();

  /**
   * Set of visited URLs to avoid duplicates
   */
  private visitedUrls: Set<string> = new Set();

  /**
   * Cache for robots.txt files
   */
  private robotsCache: Map<string, {
    parser: any;
    timestamp: number;
  }> = new Map();

  /**
   * Puppeteer browser instance
   */
  private browser: any = null;

  /**
   * Constructor
   * @param options Crawler options
   */
  constructor(options: Partial<CrawlOptions> = {}) {
    this.options = {
      ...EnhancedCrawler.DEFAULT_OPTIONS,
      ...options
    };
  }

  /**
   * Crawl a website starting from a URL
   * @param startUrl The URL to start crawling from
   * @param depth Maximum crawl depth
   * @returns Array of crawl results
   */
  async crawl(startUrl: string, depth: number = this.options.maxDepth || 2): Promise<CrawlResult[]> {
    console.log(`Starting crawl from ${startUrl} with max depth ${depth}`);

    try {
      // Initialize browser if needed
      await this.initialize();

      // Reset visited URLs
      this.visitedUrls.clear();

      // Start crawling
      const results: CrawlResult[] = [];
      await this.crawlRecursive(startUrl, 0, depth, results);

      return results;
    } finally {
      // Close browser
      await this.close();
    }
  }

  /**
   * Perform a search-specific crawl
   * @param query Search query
   * @param maxResults Maximum number of results
   * @returns Array of crawl results
   */
  async searchCrawl(query: string, maxResults: number = 10): Promise<CrawlResult[]> {
    console.log(`Starting search crawl for query: ${query}`);

    try {
      // Initialize browser if needed
      await this.initialize();

      // Reset visited URLs
      this.visitedUrls.clear();

      // Generate search URLs
      const searchUrls = this.generateSearchUrls(query);

      // Crawl each search URL
      const results: CrawlResult[] = [];

      for (const url of searchUrls) {
        if (results.length >= maxResults) {
          break;
        }

        try {
          const result = await this.fetchUrl(url);
          results.push(result);

          // Extract links from the search results and crawl them
          for (const [_, link] of result.links) {
            if (results.length >= maxResults) {
              break;
            }

            if (!this.visitedUrls.has(link)) {
              try {
                // Add delay between requests
                await new Promise(resolve => setTimeout(resolve, this.options.delayMs || 1000));

                const pageResult = await this.fetchUrl(link);
                results.push(pageResult);
              } catch (error) {
                console.error(`Error fetching link ${link}:`, error);
              }
            }
          }
        } catch (error) {
          console.error(`Error fetching search URL ${url}:`, error);
        }
      }

      return results;
    } finally {
      // Close browser
      await this.close();
    }
  }

  /**
   * Generate search URLs for a query
   * @param query Search query
   * @returns Array of search URLs
   */
  private generateSearchUrls(query: string): string[] {
    // Encode the query for URL
    const encodedQuery = encodeURIComponent(query);

    // Generate URLs for different search engines
    return [
      `https://www.google.com/search?q=${encodedQuery}`,
      `https://www.bing.com/search?q=${encodedQuery}`,
      `https://search.yahoo.com/search?p=${encodedQuery}`,
      `https://duckduckgo.com/?q=${encodedQuery}`
    ];
  }

  /**
   * Recursive crawling function
   * @param url URL to crawl
   * @param currentDepth Current depth
   * @param maxDepth Maximum depth
   * @param results Array to store results
   */
  private async crawlRecursive(
    url: string,
    currentDepth: number,
    maxDepth: number,
    results: CrawlResult[]
  ): Promise<void> {
    // Check if we've reached the maximum depth
    if (currentDepth > maxDepth) {
      return;
    }

    // Check if we've reached the maximum number of pages
    if (results.length >= (this.options.maxPages || 10)) {
      return;
    }

    // Check if we've already visited this URL
    if (this.visitedUrls.has(url)) {
      return;
    }

    // Mark URL as visited
    this.visitedUrls.add(url);

    try {
      // Fetch the page
      const result = await this.fetchUrl(url);

      // Add to results
      results.push(result);

      // Extract links and crawl them
      if (currentDepth < maxDepth) {
        for (const [_title, link] of result.links) {
          // Add delay between requests
          await new Promise(resolve => setTimeout(resolve, this.options.delayMs || 1000));

          // Crawl the link
          await this.crawlRecursive(link, currentDepth + 1, maxDepth, results);
        }
      }
    } catch (error) {
      console.error(`Error crawling ${url}:`, error);
    }
  }

  /**
   * Initialize the crawler
   */
  async initialize(): Promise<void> {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
    }
  }

  /**
   * Close the crawler and free resources
   */
  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  /**
   * Check if a URL is allowed by robots.txt
   * @param url URL to check
   * @returns True if allowed, false otherwise
   */
  private async isAllowedByRobots(url: string): Promise<boolean> {
    if (!this.options.respectRobotsTxt) {
      return true;
    }

    try {
      const parsedUrl = new URL(url);
      const robotsUrl = `${parsedUrl.protocol}//${parsedUrl.hostname}/robots.txt`;

      // Check cache first
      const cached = this.robotsCache.get(robotsUrl);
      if (cached && Date.now() - cached.timestamp < 24 * 60 * 60 * 1000) { // 24 hours
        return cached.parser.isAllowed(url, this.options.userAgent || 'SBC-GINA-Crawler/1.0');
      }

      // Fetch robots.txt
      const response = await axios.get(robotsUrl, {
        timeout: 5000,
        validateStatus: (status: number) => status < 400 || status === 404 // Accept 404 as empty robots.txt
      }).catch(() => ({ data: '', status: 404 }));

      // Parse robots.txt
      const parser = robotsParser(robotsUrl, response.data);

      // Cache the parser
      this.robotsCache.set(robotsUrl, {
        parser,
        timestamp: Date.now()
      });

      return parser.isAllowed(url, this.options.userAgent || 'SBC-GINA-Crawler/1.0') || true;
    } catch (error) {
      console.error(`Error checking robots.txt for ${url}:`, error);
      return true; // Allow by default in case of error
    }
  }

  /**
   * Fetch a URL and return the result
   * @param url URL to fetch
   * @returns Crawl result
   */
  private async fetchUrl(url: string): Promise<CrawlResult> {
    // Check if URL is allowed by robots.txt
    const isAllowed = await this.isAllowedByRobots(url);
    if (!isAllowed) {
      console.log(`URL ${url} is disallowed by robots.txt`);
      throw new Error(`URL ${url} is disallowed by robots.txt`);
    }

    // Check cache first
    const cached = this.cache.get(url);
    if (cached && Date.now() - cached.timestamp < (this.options.cacheValidMs || 24 * 60 * 60 * 1000)) {
      console.log(`Using cached version of ${url}`);
      return {
        ...cached.result,
        isFromCache: true
      };
    }

    console.log(`Fetching ${url}`);

    // Determine if we should use Puppeteer based on URL or content type
    const shouldUsePuppeteer = this.shouldUsePuppeteer(url);

    try {
      let result: CrawlResult;

      if (shouldUsePuppeteer) {
        result = await this.fetchWithPuppeteer(url);
      } else {
        result = await this.fetchWithHttp(url);
      }

      // Cache the result
      this.cache.set(url, {
        result,
        timestamp: Date.now()
      });

      return result;
    } catch (error) {
      console.error(`Error fetching ${url}:`, error);
      throw error;
    }
  }

  /**
   * Fetch a URL using HTTP
   * @param url URL to fetch
   * @returns Crawl result
   */
  private async fetchWithHttp(url: string): Promise<CrawlResult> {
    try {
      // Fetch the page
      const response = await axios.get(url, {
        headers: {
          'User-Agent': this.options.userAgent || 'SBC-GINA-Crawler/1.0'
        },
        timeout: this.options.timeout || 30000
      });

      // Extract basic information
      const html = response.data;
      const title = this.extractTitle(html);
      const text = this.extractText(html);
      const links = this.extractLinks(html, url);

      // Check for PDF content
      const contentType = response.headers['content-type'] || 'text/html';
      const isPdf = contentType.includes('application/pdf');

      // Create result
      const result: CrawlResult = {
        url,
        html,
        title,
        text,
        links,
        status: response.status,
        contentType
      };

      // Add PDF URL if content is PDF
      if (isPdf) {
        result.pdfs = [url];
      }

      return result;
    } catch (error) {
      console.error(`Error fetching ${url} with HTTP:`, error);
      throw error;
    }
  }

  /**
   * Fetch a URL using Puppeteer
   * @param url URL to fetch
   * @returns Crawl result
   */
  private async fetchWithPuppeteer(url: string): Promise<CrawlResult> {
    // Initialize browser if needed
    await this.initialize();

    try {
      // Create a new page
      const page = await this.browser.newPage();

      // Set user agent
      await page.setUserAgent(this.options.userAgent || 'SBC-GINA-Crawler/1.0');

      // Set timeout
      await page.setDefaultNavigationTimeout(this.options.timeout || 30000);

      // Navigate to URL
      const response = await page.goto(url, {
        waitUntil: 'networkidle2'
      });

      // Get content
      const html = await page.content();
      const title = await page.title();
      const text = await page.evaluate(() => document.body.innerText);

      // Extract links
      const links = await page.evaluate((baseUrl: string) => {
        const linkElements = document.querySelectorAll('a');
        const extractedLinks: Array<[string, string]> = [];

        for (let i = 0; i < linkElements.length; i++) {
          const link = linkElements[i];
          const href = link.getAttribute('href');
          const title = link.innerText.trim();

          if (href && !href.startsWith('#') && !href.startsWith('javascript:')) {
            try {
              const absoluteUrl = new URL(href, baseUrl).href;
              if (absoluteUrl.startsWith('http')) {
                extractedLinks.push([title || absoluteUrl, absoluteUrl]);
              }
            } catch (e) {
              // Skip invalid URLs
            }
          }
        }

        return extractedLinks;
      }, url);

      // Check for PDFs
      const pdfs = await page.evaluate(() => {
        const linkElements = document.querySelectorAll('a[href$=".pdf"]');
        const pdfLinks: string[] = [];

        for (let i = 0; i < linkElements.length; i++) {
          const link = linkElements[i];
          const href = link.getAttribute('href');
          if (href) {
            try {
              const absoluteUrl = new URL(href, window.location.href).href;
              pdfLinks.push(absoluteUrl);
            } catch (e) {
              // Skip invalid URLs
            }
          }
        }

        return pdfLinks;
      });

      // Close the page
      await page.close();

      // Create result
      const result: CrawlResult = {
        url,
        html,
        title,
        text,
        links,
        status: response.status(),
        contentType: response.headers()['content-type'] || 'text/html'
      };

      // Add PDFs if found
      if (pdfs.length > 0) {
        result.pdfs = pdfs;
      }

      return result;
    } catch (error) {
      console.error(`Error fetching ${url} with Puppeteer:`, error);
      throw error;
    }
  }

  /**
   * Determine if we should use Puppeteer for a URL
   * @param url URL to check
   * @returns True if Puppeteer should be used
   */
  private shouldUsePuppeteer(url: string): boolean {
    // List of domains that are known to be JavaScript-heavy
    const jsHeavyDomains = [
      'twitter.com',
      'facebook.com',
      'instagram.com',
      'linkedin.com',
      'youtube.com',
      'reddit.com',
      'medium.com',
      'github.com',
      'stackoverflow.com',
      'quora.com'
    ];

    try {
      const hostname = new URL(url).hostname;

      // Check if the domain is in the list
      for (const domain of jsHeavyDomains) {
        if (hostname.includes(domain)) {
          return true;
        }
      }

      // Check file extension
      if (url.endsWith('.js') || url.endsWith('.jsx') || url.endsWith('.ts') || url.endsWith('.tsx')) {
        return true;
      }

      return false;
    } catch (error) {
      return false;
    }
  }

  /**
   * Extract title from HTML
   * @param html HTML content
   * @returns Title
   */
  private extractTitle(html: string): string {
    const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/i);
    return titleMatch ? titleMatch[1].trim() : '';
  }

  /**
   * Extract text from HTML
   * @param html HTML content
   * @returns Text
   */
  private extractText(html: string): string {
    // Remove scripts and styles
    let text = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');

    // Replace HTML tags with spaces
    text = text.replace(/<[^>]*>/g, ' ');

    // Decode HTML entities
    text = text.replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'");

    // Normalize whitespace
    text = text.replace(/\s+/g, ' ').trim();

    return text;
  }

  /**
   * Extract links from HTML
   * @param html HTML content
   * @param baseUrl Base URL for resolving relative links
   * @returns Array of [title, url] tuples
   */
  private extractLinks(html: string, baseUrl: string): Array<[string, string]> {
    const links: Array<[string, string]> = [];

    // Extract links
    const linkRegex = /<a[^>]*href=["']([^"']+)["'][^>]*>(.*?)<\/a>/gi;
    let match;

    while ((match = linkRegex.exec(html)) !== null) {
      const href = match[1];
      const title = match[2].replace(/<[^>]*>/g, '').trim();

      // Skip empty links, anchors, and javascript links
      if (!href || href.startsWith('#') || href.startsWith('javascript:')) {
        continue;
      }

      // Resolve relative URLs
      const absoluteUrl = this.resolveUrl(href, baseUrl);

      // Skip non-HTTP URLs
      if (!absoluteUrl.startsWith('http')) {
        continue;
      }

      links.push([title || absoluteUrl, absoluteUrl]);
    }

    return links;
  }

  /**
   * Resolve a relative URL against a base URL
   * @param url Relative or absolute URL
   * @param baseUrl Base URL
   * @returns Absolute URL
   */
  private resolveUrl(url: string, baseUrl: string): string {
    try {
      return new URL(url, baseUrl).href;
    } catch (error) {
      return '';
    }
  }
}
