import { generateObject } from 'ai';
import { z } from 'zod';
import { openai } from '../lib/ai-config.js';

export interface GenerateAdsInput {
  summary: string;
  brand_tone: string;
  persona: string;
  keywords: string[];
  platforms: string[];
  target_segments?: Array<{
    segment: string;
    description: string;
    pain_points: string[];
  }>;
  use_cases?: string[];
}

export interface AdCreative {
  platform: string;
  target_segment: string;
  headline: string;
  primary_text: string;
  cta: string;
  creative_description: string;
  hashtags: string[];
  targeting_notes: string;
  interest_targeting: {
    primary_interests: string[];
    secondary_interests: string[];
    behavioral_interests: string[];
    trending_interests: string[];
  };
}

export interface GenerateAdsOutput {
  ads: AdCreative[];
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

const schema = z.object({
  ads: z.array(z.object({
    platform: z.string(),
    target_segment: z.string(),
    headline: z.string(),
    primary_text: z.string(),
    cta: z.string(),
    creative_description: z.string(),
    hashtags: z.array(z.string()),
    targeting_notes: z.string(),
    interest_targeting: z.object({
      primary_interests: z.array(z.string()),
      secondary_interests: z.array(z.string()),
      behavioral_interests: z.array(z.string()),
      trending_interests: z.array(z.string())
    })
  }))
});

export async function generateAds(input: GenerateAdsInput): Promise<GenerateAdsOutput> {
  try {
    const currentDate = new Date().toISOString().split('T')[0];
    
    const prompt = `You are a creative advertising expert. Generate platform-specific ad creatives for each target segment.

Product Summary: ${input.summary}
Brand Tone: ${input.brand_tone}
Keywords: ${input.keywords.join(', ')}
Use Cases: ${input.use_cases?.join(', ') || 'N/A'}
Target Segments: ${JSON.stringify(input.target_segments || [])}
Platforms: ${input.platforms.join(', ')}

Current Date: ${currentDate} - Consider current trends and seasonal relevance.

For EACH combination of platform and target segment, create a unique ad creative that:
1. Speaks directly to that segment's pain points
2. Uses platform-specific best practices and current trends
3. Includes relevant hashtags (especially trending ones for TikTok/Instagram)
4. Has a compelling hook that addresses the specific use case
5. Includes targeting notes for ad platform setup

Return a JSON object with an "ads" array. Each ad should have:
- platform: Platform name
- target_segment: Which audience segment this targets
- headline: Attention-grabbing headline (max 40 chars for Google, 125 for Facebook)
- primary_text: Main ad copy (engaging and specific to the segment)
- cta: Call to action button text
- creative_description: Detailed description of the visual/video creative
- hashtags: Array of relevant hashtags (include trending ones)
- targeting_notes: Specific targeting recommendations for this segment
- interest_targeting: Detailed interest-based targeting with:
  - primary_interests: Core interests directly related to the product (5-8 interests)
  - secondary_interests: Related interests that expand reach (5-8 interests)
  - behavioral_interests: Behavioral patterns and purchase behaviors (3-5 behaviors)
  - trending_interests: Current trending topics/interests relevant to this segment (3-5 trends)

For interest targeting, be VERY specific. Instead of "Technology", use "Artificial Intelligence", "Machine Learning", "Software Development", "Tech Startups", etc.

Generate at least 2-3 ads per platform, each targeting a different segment.`;

    const { object, usage } = await generateObject({
      model: openai('gpt-4o'),
      schema,
      prompt,
      system: 'You are an expert advertising creative director with deep knowledge of current social media trends, platform algorithms, and audience psychology.',
      temperature: 0.8
    });

    return {
      ...object,
      usage: usage ? {
        promptTokens: (usage as any).inputTokens || 0,
        completionTokens: (usage as any).outputTokens || 0,
        totalTokens: (usage as any).totalTokens || 0
      } : undefined
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`AI ad generation failed: ${errorMessage}`);
  }
}
