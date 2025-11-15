import axios from 'axios';

export interface FetchUrlInput {
  url: string;
}

export interface FetchUrlOutput {
  html: string;
}

export async function fetchUrl(input: FetchUrlInput): Promise<FetchUrlOutput> {
  try {
    const response = await axios.get(input.url, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    return { html: response.data };
  } catch (error: any) {
    throw new Error(`Failed to fetch URL: ${error.message}`);
  }
}
