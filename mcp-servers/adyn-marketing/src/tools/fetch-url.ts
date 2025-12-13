import axios from 'axios';

export interface FetchUrlInput {
  url: string;
}

export interface FetchUrlOutput {
  html: string;
}

export async function fetchUrl(input: FetchUrlInput): Promise<FetchUrlOutput> {
  try {
    // Validate URL
    const url = new URL(input.url);
    if (!['http:', 'https:'].includes(url.protocol)) {
      throw new Error('Invalid URL protocol. Only HTTP and HTTPS are supported.');
    }
    
    const response = await axios.get(input.url, {
      timeout: 15000,
      maxRedirects: 5,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Cache-Control': 'max-age=0'
      },
      validateStatus: (status) => status < 400, // Accept redirects
    });
    
    // Check if response is HTML
    const contentType = response.headers['content-type'] || '';
    if (!contentType.includes('text/html')) {
      throw new Error(`Expected HTML content, got: ${contentType}`);
    }
    
    return { html: response.data };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.code === 'ECONNABORTED') {
        throw new Error('Request timeout - the website took too long to respond');
      }
      if (error.response?.status === 403) {
        throw new Error('Access forbidden - the website blocked our request');
      }
      if (error.response?.status === 404) {
        throw new Error('Page not found - the URL does not exist');
      }
      if (error.response && error.response.status >= 500) {
        throw new Error('Server error - the website is experiencing issues');
      }
    }
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to fetch URL: ${errorMessage}`);
  }
}
