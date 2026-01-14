import { generateObject } from 'ai';
import { z } from 'zod';
import { openai } from '../ai-config';

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
    const prompt = `You are an elite Growth Marketing Auditor. Analyze the following product/service content and provide deep, actionable marketing insights to drive high-ROAS Meta campaigns.

    PRODUCT CONTENT:
    ${input.text}

    Your analysis must be sophisticated and expert-level.
    1. Identify the "core hook" that will stop the scroll.
    2. Define a value proposition that directly addresses the deepest pain point found in the content.
    3. For geographic analysis, research and provide REAL cultural nuances and specific preferences for the target market.
    4. HYPER-LOCAL COMPETITION: For the target market (e.g., Pakistan), identify ACTUAL local competitors found in that specific region. DO NOT hallucinate competitors from neighboring countries (e.g., do not suggest Indian brands for a Pakistani store unless they have a major footprint there).
    5. Provide specific target segments with nuanced behaviors and pain points.

    Return a comprehensive JSON response. Be as specific as possible. Avoid generic filler words like "AI-optimized" or "High-potential". Give REAL marketing labels.`;

    const { object, usage } = await generateObject({
      model: openai('gpt-4o'),
      schema,
      prompt,
      system: 'You are an elite D2C growth marketing expert. You have deep knowledge of specific regional markets including Pakistan, UAE, US, and UK. You provide hyper-accurate, non-hallucinated competitor and cultural data.',
      temperature: 0.2
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
