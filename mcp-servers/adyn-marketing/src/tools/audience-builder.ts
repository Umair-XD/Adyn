import { generateObject } from 'ai';
import { z } from 'zod';
import { openai } from '../lib/ai-config.js';

export interface AudienceBuilderInput {
  persona: string;
  keywords: string[];
  category: string;
  target_segments?: Array<{
    segment: string;
    description: string;
    pain_points: string[];
  }>;
  geographic_analysis?: {
    origin_country: string;
    primary_markets: string[];
    cultural_context: string;
    local_preferences: string[];
    regional_competitors: string[];
  };
}

export interface SegmentTargeting {
  segment_name: string;
  age_range: string;
  gender: string;
  interests: string[];
  behaviors: string[];
  job_titles: string[];
  platforms_active_on: string[];
  best_times_to_reach: string[];
}

export interface BroadAudience {
  name: string;
  description: string;
  age_range: string;
  interests: string[];
  trending_topics: string[];
  platforms: string[];
  size_estimate: string;
  why_trending: string;
}

export interface MetaLookalikeAudience {
  source_audience: string;
  similarity_percentage: string;
  audience_size: string;
  description: string;
  targeting_strategy: string;
}

export interface DetailedInterests {
  category: string;
  interests: string[];
  audience_size_estimate: string;
}

export interface AudienceBuilderOutput {
  age_range: string;
  interest_groups: string[];
  geos: string[];
  behaviors: string[];
  segment_targeting: SegmentTargeting[];
  broad_audiences: BroadAudience[];
  meta_lookalike_audiences: MetaLookalikeAudience[];
  detailed_interests: DetailedInterests[];
  geographic_targeting: {
    primary_countries: string[];
    excluded_regions: string[];
    language_targeting: string[];
    timezone_considerations: string[];
  };
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    reasoningTokens: number;
    cachedInputTokens: number;
  };
}

const schema = z.object({
  age_range: z.string(),
  interest_groups: z.array(z.string()),
  geos: z.array(z.string()),
  behaviors: z.array(z.string()),
  segment_targeting: z.array(z.object({
    segment_name: z.string(),
    age_range: z.string(),
    gender: z.string(),
    interests: z.array(z.string()),
    behaviors: z.array(z.string()),
    job_titles: z.array(z.string()),
    platforms_active_on: z.array(z.string()),
    best_times_to_reach: z.array(z.string())
  })),
  broad_audiences: z.array(z.object({
    name: z.string(),
    description: z.string(),
    age_range: z.string(),
    interests: z.array(z.string()),
    trending_topics: z.array(z.string()),
    platforms: z.array(z.string()),
    size_estimate: z.string(),
    why_trending: z.string()
  })),
  meta_lookalike_audiences: z.array(z.object({
    source_audience: z.string(),
    similarity_percentage: z.string(),
    audience_size: z.string(),
    description: z.string(),
    targeting_strategy: z.string()
  })),
  detailed_interests: z.array(z.object({
    category: z.string(),
    interests: z.array(z.string()),
    audience_size_estimate: z.string()
  })),
  geographic_targeting: z.object({
    primary_countries: z.array(z.string()),
    excluded_regions: z.array(z.string()),
    language_targeting: z.array(z.string()),
    timezone_considerations: z.array(z.string())
  })
});

export async function audienceBuilder(input: AudienceBuilderInput): Promise<AudienceBuilderOutput> {
  try {
    const prompt = `You are an audience targeting expert with deep knowledge of Meta's audience library, Facebook/Instagram targeting options, and international market segmentation. Create highly precise audience targeting parameters.

Product Category: ${input.category}
Primary Persona: ${input.persona}
Keywords: ${input.keywords.join(', ')}
Target Segments: ${JSON.stringify(input.target_segments || [])}
Geographic Context: ${JSON.stringify(input.geographic_analysis || {})}

Create comprehensive audience targeting that includes:

1. OVERALL BROAD TARGETING (age_range, interest_groups, geos, behaviors)

2. SEGMENT-SPECIFIC TARGETING for each target segment with:
   - Specific age ranges for that segment
   - Gender targeting if relevant
   - Detailed interests (be very specific, e.g., "React.js" not just "Programming")
   - Behavioral targeting (job-related behaviors, purchase behaviors, etc.)
   - Specific job titles if applicable (e.g., "Software Engineer", "Product Manager")
   - Which platforms they're most active on
   - Best times/days to reach them

3. BROAD AUDIENCES BASED ON CURRENT TRENDS (3-5 trending audiences):
   - Identify trending audiences that would be interested in this product
   - Consider viral topics, seasonal trends, cultural moments, social movements
   - Include emerging demographics and interest groups
   - Focus on audiences that are actively engaging with related content NOW
   - Consider TikTok trends, Instagram reels trends, Twitter/X conversations
   - Include size estimates (e.g., "2-5 million", "500K-1M", "10M+")

For each broad audience, explain:
- Why they're trending right now
- What trending topics/hashtags they're engaging with
- Which platforms they're most active on
- How this product fits their current interests

4. META LOOKALIKE AUDIENCES (5-7 precise lookalike audiences):
   Use Meta's audience library knowledge to create highly specific lookalike audiences:
   - source_audience: The source audience for lookalike (e.g., "Website visitors who purchased", "Email subscribers", "App users")
   - similarity_percentage: Lookalike percentage (1%, 2%, 5%, 10%)
   - audience_size: Estimated audience size in target country
   - description: What makes this lookalike audience valuable
   - targeting_strategy: How to use this audience effectively

5. DETAILED INTERESTS (by category):
   Organize interests by Meta's interest categories with precise targeting:
   - category: Meta interest category (e.g., "Business and Industry", "Technology", "Shopping and Fashion")
   - interests: Array of specific interests from Meta's library (be very precise)
   - audience_size_estimate: Estimated reach for this interest group

6. GEOGRAPHIC TARGETING:
   - primary_countries: Main countries to target (prioritize origin country and similar markets)
   - excluded_regions: Regions to exclude (if any)
   - language_targeting: Languages to target
   - timezone_considerations: Best times to reach audience in each region

CRITICAL: Use Meta's actual interest categories and targeting options. Be extremely specific with interest names as they appear in Facebook Ads Manager. Consider cultural nuances and local market preferences.

Examples of precise Meta interests:
- Instead of "Technology": "Artificial intelligence", "Software engineering", "Cloud computing"
- Instead of "Fashion": "Luxury goods", "Online shopping", "Fashion design"
- Instead of "Business": "Small business", "Entrepreneurship", "Digital marketing"

Return valid JSON with all fields filled.`;

    const { object, usage } = await generateObject({
      model: openai('gpt-4o'),
      schema,
      prompt,
      system: 'You are an expert in digital advertising audience targeting with deep knowledge of platform-specific targeting options.',
      temperature: 0.7
    });

    return {
      ...object,
      usage: usage ? {
        promptTokens: (usage as any).inputTokens || 0,
        completionTokens: (usage as any).outputTokens || 0,
        totalTokens: (usage as any).totalTokens || 0,
        reasoningTokens: (usage as any).reasoningTokens || 0,
        cachedInputTokens: (usage as any).cachedInputTokens || 0
      } : undefined
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`AI audience building failed: ${errorMessage}`);
  }
}
