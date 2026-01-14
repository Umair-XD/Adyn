import * as cheerio from 'cheerio';

export interface ExtractContentInput {
  html: string;
}

export interface ExtractContentOutput {
  title: string;
  text_blocks: string[];
  images: string[];
  metadata: Record<string, unknown>;
  structured_content: {
    headings: string[];
    paragraphs: string[];
    lists: string[];
    links: Array<{ text: string; url: string }>;
    product_info: {
      price?: string;
      features: string[];
      benefits: string[];
      testimonials: string[];
    };
  };
}

export async function extractContent(input: ExtractContentInput): Promise<ExtractContentOutput> {
  try {
    const $ = cheerio.load(input.html);
    
    // Remove script and style elements
    $('script, style, nav, footer, header, .cookie, .popup, .modal').remove();
    
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
    
    // Extract images with better filtering
    const images: string[] = [];
    $('img').each((_, elem) => {
      const src = $(elem).attr('src') || $(elem).attr('data-src');
      const alt = $(elem).attr('alt') || '';
      if (src && !src.includes('icon') && !src.includes('logo') && alt.length > 0) {
        images.push(src);
      }
    });
    
    // Extract structured content
    const headings: string[] = [];
    $('h1, h2, h3, h4, h5, h6').each((_, elem) => {
      const text = $(elem).text().trim();
      if (text) headings.push(text);
    });
    
    const paragraphs: string[] = [];
    $('p').each((_, elem) => {
      const text = $(elem).text().trim();
      if (text && text.length > 30) paragraphs.push(text);
    });
    
    const lists: string[] = [];
    $('ul li, ol li').each((_, elem) => {
      const text = $(elem).text().trim();
      if (text && text.length > 10) lists.push(text);
    });
    
    const links: Array<{ text: string; url: string }> = [];
    $('a[href]').each((_, elem) => {
      const text = $(elem).text().trim();
      const url = $(elem).attr('href');
      if (text && url && text.length > 5 && text.length < 100) {
        links.push({ text, url });
      }
    });
    
    // Extract product information
    const features: string[] = [];
    const benefits: string[] = [];
    const testimonials: string[] = [];
    
    // Look for features (common patterns)
    $('.feature, .features, [class*="feature"]').each((_, elem) => {
      const text = $(elem).text().trim();
      if (text && text.length > 10) features.push(text);
    });
    
    // Look for benefits (common patterns)
    $('.benefit, .benefits, [class*="benefit"]').each((_, elem) => {
      const text = $(elem).text().trim();
      if (text && text.length > 10) benefits.push(text);
    });
    
    // Look for testimonials/reviews
    $('.testimonial, .review, .quote, [class*="testimonial"], [class*="review"]').each((_, elem) => {
      const text = $(elem).text().trim();
      if (text && text.length > 20) testimonials.push(text);
    });
    
    // Look for price
    const price = $('.price, [class*="price"], [data-price]').first().text().trim() || 
                  $('[class*="cost"]').first().text().trim() || '';
    
    // Extract metadata
    const metadata: Record<string, unknown> = {
      description: $('meta[name="description"]').attr('content') || '',
      keywords: $('meta[name="keywords"]').attr('content') || '',
      og_title: $('meta[property="og:title"]').attr('content') || '',
      og_description: $('meta[property="og:description"]').attr('content') || '',
      og_image: $('meta[property="og:image"]').attr('content') || '',
      twitter_title: $('meta[name="twitter:title"]').attr('content') || '',
      twitter_description: $('meta[name="twitter:description"]').attr('content') || '',
      canonical: $('link[rel="canonical"]').attr('href') || '',
      author: $('meta[name="author"]').attr('content') || '',
      published_time: $('meta[property="article:published_time"]').attr('content') || ''
    };
    
    return {
      title,
      text_blocks: text_blocks.slice(0, 50),
      images: images.slice(0, 20),
      metadata,
      structured_content: {
        headings: headings.slice(0, 20),
        paragraphs: paragraphs.slice(0, 30),
        lists: lists.slice(0, 50),
        links: links.slice(0, 30),
        product_info: {
          price: price || undefined,
          features: features.slice(0, 20),
          benefits: benefits.slice(0, 20),
          testimonials: testimonials.slice(0, 10)
        }
      }
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to extract content: ${errorMessage}`);
  }
}
