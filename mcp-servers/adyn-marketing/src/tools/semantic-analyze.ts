import { generateObject } from 'ai';
import { z } from 'zod';
import { openai } from '../lib/ai-config.js';

export interface SemanticAnalyzeInput {
  text: string;
}

export interface SemanticAnalyzeOutput {
  summary: string;
  keywords: string[];
  value_proposition: string;
  unique_selling_point: string;
  brand_tone: string;
  audience_persona: string;
  category: string;
  use_cases: string[];
  target_segments: Array<{
    segment: string;
    description: string;
    pain_points: string[];
  }>;
  geographic_analysis: {
    origin_country: string;
    primary_markets: string[];
    cultural_context: string;
    local_preferences: string[];
    regional_competitors: string[];
  };
  competitor_analysis: {
    main_competitors: string[];
    competitive_advantages: string[];
    market_positioning: string;
    differentiation_strategy: string;
  };
  market_size_estimation: {
    total_addressable_market: string;
    serviceable_addressable_market: string;
    target_market_size: string;
    growth_potential: string;
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
  summary: z.string(),
  keywords: z.array(z.string()),
  value_proposition: z.string(),
  unique_selling_point: z.string(),
  brand_tone: z.string(),
  audience_persona: z.string(),
  category: z.string(),
  use_cases: z.array(z.string()),
  target_segments: z.array(z.object({
    segment: z.string(),
    description: z.string(),
    pain_points: z.array(z.string())
  })),
  geographic_analysis: z.object({
    origin_country: z.string(),
    primary_markets: z.array(z.string()),
    cultural_context: z.string(),
    local_preferences: z.array(z.string()),
    regional_competitors: z.array(z.string())
  }),
  competitor_analysis: z.object({
    main_competitors: z.array(z.string()),
    competitive_advantages: z.array(z.string()),
    market_positioning: z.string(),
    differentiation_strategy: z.string()
  }),
  market_size_estimation: z.object({
    total_addressable_market: z.string(),
    serviceable_addressable_market: z.string(),
    target_market_size: z.string(),
    growth_potential: z.string()
  })
});

export async function semanticAnalyze(input: SemanticAnalyzeInput): Promise<SemanticAnalyzeOutput> {
  try {
    const prompt = `Analyze this product/service content and provide essential marketing insights:

${input.text}

Provide a concise JSON response with key marketing data: summary, keywords (8-10), value_proposition, unique_selling_point, brand_tone, audience_persona, category, use_cases (3-4), target_segments (2-3 with segment, description, pain_points), geographic_analysis (origin_country, primary_markets, cultural_context, local_preferences, regional_competitors), competitor_analysis (main_competitors, competitive_advantages, market_positioning, differentiation_strategy), and market_size_estimation (total_addressable_market, serviceable_addressable_market, target_market_size, growth_potential).

Be specific but concise for fast processing.`;

    const { object, usage } = await generateObject({
      model: openai('gpt-4o'), // Use GPT-4o for faster response
      schema,
      prompt,
      system: 'You are a marketing analysis expert. Provide detailed, actionable insights.',
      temperature: 0.3 // Lower temperature for faster, more deterministic responses
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
    throw new Error(`AI semantic analysis failed: ${errorMessage}`);
  }
}
