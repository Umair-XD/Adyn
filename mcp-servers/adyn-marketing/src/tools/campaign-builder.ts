import { generateObject } from 'ai';
import { z } from 'zod';
import { openai } from '../lib/ai-config.js';
import { AdCreative } from './generate-ads.js';
import { AudienceBuilderOutput } from './audience-builder.js';

export interface CampaignBuilderInput {
  ads: AdCreative[];
  audience: AudienceBuilderOutput;
  objective: string;
}

export interface CampaignBuilderOutput {
  campaign_name: string;
  objective: string;
  budget_suggestion: string;
  duration_days: number;
  platform_mix: string[];
  formats: string[];
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    reasoningTokens: number;
    cachedInputTokens: number;
  };
}

const schema = z.object({
  campaign_name: z.string(),
  objective: z.string(),
  budget_suggestion: z.string(),
  duration_days: z.number(),
  platform_mix: z.array(z.string()),
  formats: z.array(z.string())
});

export async function campaignBuilder(input: CampaignBuilderInput): Promise<CampaignBuilderOutput> {
  try {
    const { ads, audience, objective } = input;
    
    // Extract platforms from ads
    const platforms = [...new Set(ads.map(ad => ad.platform))];
    
    const prompt = `Create a comprehensive campaign strategy based on these ad creatives and audience data.

Ad Creatives: ${JSON.stringify(ads.slice(0, 3))}
Audience: ${JSON.stringify(audience)}
Objective: ${objective}
Platforms: ${platforms.join(', ')}

Provide a JSON response with:
1. campaign_name: A catchy, professional campaign name (max 50 chars)
2. objective: The campaign objective (${objective})
3. budget_suggestion: Recommended daily/monthly budget as a string (e.g., "$75/day ($2,250/month)")
4. duration_days: Recommended campaign duration in days
5. platform_mix: Array of platforms to use
6. formats: Array of ad formats to use (e.g., "Single Image", "Video", "Carousel", "Search Ad")

Consider:
- Budget should scale with number of platforms and audience size
- Duration should be realistic (typically 14-60 days)
- Formats should match the platforms`;

    const { object, usage } = await generateObject({
      model: openai('gpt-4o'),
      schema,
      prompt,
      system: 'You are a campaign strategy expert. Provide actionable campaign recommendations.',
      temperature: 0.7
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
    throw new Error(`AI campaign building failed: ${errorMessage}`);
  }
}
