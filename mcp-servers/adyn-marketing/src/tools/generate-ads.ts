export interface GenerateAdsInput {
  summary: string;
  brand_tone: string;
  persona: string;
  keywords: string[];
  platforms: string[];
}

export interface AdCreative {
  platform: string;
  headline: string;
  primary_text: string;
  cta: string;
  creative_description: string;
  hashtags: string[];
}

export interface GenerateAdsOutput {
  ads: AdCreative[];
}

export async function generateAds(input: GenerateAdsInput): Promise<GenerateAdsOutput> {
  const ads: AdCreative[] = [];
  const { summary, brand_tone, persona, keywords } = input;
  
  const topKeywords = keywords.slice(0, 5);
  const hashtags = topKeywords.map(k => `#${k.replace(/\s+/g, '')}`);
  
  for (const platform of input.platforms) {
    let ad: AdCreative;
    
    switch (platform.toLowerCase()) {
      case 'facebook':
        ad = {
          platform: 'Facebook',
          headline: `Discover ${topKeywords[0] || 'Amazing'} Solutions`,
          primary_text: `Looking for ${topKeywords[0]}? We've got exactly what ${persona} need. ${summary.substring(0, 150)}... Click to learn more!`,
          cta: 'Learn More',
          creative_description: `Eye-catching image featuring ${topKeywords[0]} with ${brand_tone} aesthetic. Include lifestyle imagery showing ${persona} using the product.`,
          hashtags: hashtags.slice(0, 3)
        };
        break;
        
      case 'instagram':
        ad = {
          platform: 'Instagram',
          headline: `✨ ${topKeywords[0]?.toUpperCase() || 'AMAZING'} ✨`,
          primary_text: `Transform your experience with our ${brand_tone} approach to ${topKeywords[0]}. Perfect for ${persona}! 💫`,
          cta: 'Shop Now',
          creative_description: `High-quality square image (1080x1080) with vibrant colors, featuring ${topKeywords[0]}. ${brand_tone} aesthetic with lifestyle elements.`,
          hashtags: hashtags.slice(0, 5)
        };
        break;
        
      case 'tiktok':
        ad = {
          platform: 'TikTok',
          headline: `You NEED This ${topKeywords[0] || 'Product'}!`,
          primary_text: `POV: You just discovered the best ${topKeywords[0]} for ${persona} 🔥 #fyp`,
          cta: 'Watch Now',
          creative_description: `Vertical video (9:16) showing quick transformation or before/after. Fast-paced editing with trending music. Hook in first 3 seconds featuring ${topKeywords[0]}.`,
          hashtags: [...hashtags.slice(0, 3), '#fyp', '#viral', '#trending']
        };
        break;
        
      case 'google':
        ad = {
          platform: 'Google Ads',
          headline: `Best ${topKeywords[0] || 'Solution'} for ${persona.split(' ')[0]}`,
          primary_text: `${brand_tone} ${topKeywords[0]} solutions. Trusted by thousands. Free shipping. Shop now and save!`,
          cta: 'Get Started',
          creative_description: `Clean product image on white background. Include trust badges and key benefits. Professional ${brand_tone} styling.`,
          hashtags: []
        };
        break;
        
      default:
        ad = {
          platform: platform,
          headline: `Discover ${topKeywords[0] || 'Our Solution'}`,
          primary_text: summary.substring(0, 200),
          cta: 'Learn More',
          creative_description: `Professional image featuring ${topKeywords[0]} with ${brand_tone} aesthetic`,
          hashtags: hashtags.slice(0, 3)
        };
    }
    
    ads.push(ad);
  }
  
  return { ads };
}
