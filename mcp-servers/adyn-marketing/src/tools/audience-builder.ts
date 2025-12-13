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

export interface AudienceBuilderOutput {
  age_range: string;
  interest_groups: string[];
  geos: string[];
  behaviors: string[];
  segment_targeting: SegmentTargeting[];
  broad_audiences: BroadAudience[];
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
  }))
});

export async function audienceBuilder(input: AudienceBuilderInput): Promise<AudienceBuilderOutput> {
  try {
    const prompt = `You are an audience targeting expert with deep knowledge of current trends and viral content. Create detailed audience targeting parameters.

Product Category: ${input.category}
Primary Persona: ${input.persona}
Keywords: ${input.keywords.join(', ')}
Target Segments: ${JSON.stringify(input.target_segments || [])}

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

Use your current knowledge to identify trending audiences like:
- AI/Tech enthusiasts and early adopters
- Remote work and productivity optimizers
- Wellness and mental health focused communities
- Sustainable living advocates
- Creator economy participants

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
