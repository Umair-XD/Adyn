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
    lookalike_audiences: string[];
    demographic_insights: string;
  };
}

export interface GenerateAdsOutput {
  ads: AdCreative[];
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    reasoningTokens: number;
    cachedInputTokens: number;
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
      trending_interests: z.array(z.string()),
      lookalike_audiences: z.array(z.string()),
      demographic_insights: z.string()
    })
  }))
});

export async function generateAds(input: GenerateAdsInput): Promise<GenerateAdsOutput> {
  try {
    const prompt = `You are a creative advertising expert with deep knowledge of viral content, current trends, and platform algorithms. Generate platform-specific ad creatives that are highly engaging and trend-aware.

Product Summary: ${input.summary}
Brand Tone: ${input.brand_tone}
Keywords: ${input.keywords.join(', ')}
Use Cases: ${input.use_cases?.join(', ') || 'N/A'}
Target Segments: ${JSON.stringify(input.target_segments || [])}
Platforms: ${input.platforms.join(', ')}

CRITICAL: Use your current knowledge of trends, seasonal context, viral content patterns, and cultural moments. Consider what's trending RIGHT NOW in social media, current events, seasonal psychology, and platform-specific content that's performing well.

For EACH combination of platform and target segment, create HIGHLY ENGAGING ad creatives that:
1. Hook viewers in the first 3 seconds with trending formats
2. Use current viral language patterns and phrases
3. Address specific pain points with urgency and relatability
4. Include platform-native elements (TikTok sounds, Instagram Reels trends, etc.)
5. Leverage seasonal psychology and current cultural moments
6. Use proven high-engagement formats (before/after, day-in-life, problem/solution)

Return a JSON object with an "ads" array. Each ad should have:
- platform: Platform name
- target_segment: Which audience segment this targets
- headline: VIRAL-STYLE headline that stops scrolling (use trending phrases, emojis, urgency)
- primary_text: Engaging copy using current slang/trends, storytelling hooks, social proof
- cta: Action-oriented CTA that creates FOMO
- creative_description: Detailed visual/video concept using trending formats
- hashtags: Mix of trending hashtags + niche hashtags (research current viral tags)
- targeting_notes: Specific targeting for maximum engagement
- interest_targeting: HYPER-SPECIFIC interest targeting:
  - primary_interests: Core product-related interests (8-12 very specific interests)
  - secondary_interests: Lifestyle/behavior interests that correlate (8-12 interests)
  - behavioral_interests: Purchase behaviors, app usage, engagement patterns (5-8 behaviors)
  - trending_interests: Current trending topics/viral content themes (5-8 current trends)
  - lookalike_audiences: Suggest competitor audiences or similar successful brands to target
  - demographic_insights: Age, gender, location, income insights for this creative

CREATIVE FORMATS TO USE:
- "POV: You're trying to..." format
- "Tell me you're X without telling me you're X"
- Before/after transformations
- "Day in my life using..." 
- Problem/solution storytelling
- User-generated content style
- Trending audio/music references

Generate 3-4 ads per platform, each with different viral angles and targeting strategies.`;

    const { object, usage } = await generateObject({
      model: openai('gpt-4o'),
      schema,
      prompt,
      system: 'You are an expert advertising creative director with deep knowledge of current social media trends, platform algorithms, and audience psychology.',
      temperature: 0.8
    });

    const usageData = usage as {
      inputTokens?: number;
      outputTokens?: number;
      totalTokens?: number;
      reasoningTokens?: number;
      cachedInputTokens?: number;
    };

    return {
      ...object,
      usage: usage ? {
        promptTokens: usageData.inputTokens || 0,
        completionTokens: usageData.outputTokens || 0,
        totalTokens: usageData.totalTokens || 0,
        reasoningTokens: usageData.reasoningTokens || 0,
        cachedInputTokens: usageData.cachedInputTokens || 0
      } : undefined
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`AI ad generation failed: ${errorMessage}`);
  }
}
