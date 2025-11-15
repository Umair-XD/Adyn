import * as cheerio from 'cheerio';

export interface ExtractContentInput {
  html: string;
}

export interface ExtractContentOutput {
  title: string;
  text_blocks: string[];
  images: string[];
  metadata: Record<string, any>;
}

export async function extractContent(input: ExtractContentInput): Promise<ExtractContentOutput> {
  try {
    const $ = cheerio.load(input.html);
    
    // Extract title
    const title = $('title').text() || $('h1').first().text() || 'Untitled';
    
    // Extract text blocks from paragraphs and headings
    const text_blocks: string[] = [];
    $('p, h1, h2, h3, h4, h5, h6').each((_, elem) => {
      const text = $(elem).text().trim();
      if (text && text.length > 20) {
        text_blocks.push(text);
      }
    });
    
    // Extract images
    const images: string[] = [];
    $('img').each((_, elem) => {
      const src = $(elem).attr('src');
      if (src) images.push(src);
    });
    
    // Extract metadata
    const metadata: Record<string, any> = {
      description: $('meta[name="description"]').attr('content') || '',
      keywords: $('meta[name="keywords"]').attr('content') || '',
      og_title: $('meta[property="og:title"]').attr('content') || '',
      og_description: $('meta[property="og:description"]').attr('content') || '',
      og_image: $('meta[property="og:image"]').attr('content') || ''
    };
    
    return {
      title,
      text_blocks: text_blocks.slice(0, 50), // Limit to 50 blocks
      images: images.slice(0, 20), // Limit to 20 images
      metadata
    };
  } catch (error: any) {
    throw new Error(`Failed to extract content: ${error.message}`);
  }
}
