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
    const prompt = `Analyze this product/service content and provide comprehensive marketing insights including competitive analysis and market sizing:

${input.text}

Provide a JSON response with:
1. summary: A concise 2-3 sentence summary of what this product/service is
2. keywords: Array of 10-15 relevant marketing keywords
3. value_proposition: The core value proposition in one sentence
4. unique_selling_point: What makes this product uniquely different from competitors (1-2 sentences)
5. brand_tone: The brand tone (professional, luxury, playful, innovative, eco-conscious, etc.)
6. audience_persona: Primary target audience description
7. category: Product category (fashion, technology, health & wellness, beauty, food & beverage, etc.)
8. use_cases: Array of 3-5 specific use cases or scenarios where this product solves problems
9. target_segments: Array of 3-5 specific audience segments with:
   - segment: Name of the segment (e.g., "Office Workers", "Software Engineers", "Gamers")
   - description: Who they are and why they need this
   - pain_points: Array of 2-3 specific pain points this product solves for them

10. geographic_analysis: Geographic and cultural analysis:
    - origin_country: Country/region where the product originates (e.g., "United States", "Germany", "Japan")
    - primary_markets: If origin_country is Pakistan, provide 3-5 major Pakistani cities (e.g., "Karachi", "Lahore", "Islamabad", "Faisalabad", "Rawalpindi"). If origin_country is not Pakistan, provide 3-5 primary target countries/regions for marketing
    - cultural_context: Cultural factors that influence product appeal
    - local_preferences: Array of region-specific preferences and behaviors
    - regional_competitors: Local competitors in the origin country/region (if Pakistan, focus on Pakistani competitors)

11. competitor_analysis: Comprehensive competitive landscape analysis:
    - main_competitors: Array of 5-8 direct and indirect competitors. If the product is from Pakistan (origin_country is Pakistan), prioritize Pakistani local competitors first, then regional competitors from similar markets (India, Bangladesh, etc.), then global competitors. If not from Pakistan, focus on competitors in the origin country and target markets.
    - competitive_advantages: Array of 3-5 key advantages over competitors
    - market_positioning: How this product should be positioned vs competitors (premium, budget, niche, etc.)
    - differentiation_strategy: Strategy to stand out from competitors

12. market_size_estimation: Market opportunity analysis:
    - total_addressable_market: Total market size estimate (e.g., "$2.5B globally", "15M potential users")
    - serviceable_addressable_market: Realistic addressable market (e.g., "$500M in target regions", "3M users")
    - target_market_size: Initial target market size (e.g., "$50M", "500K users in first year")
    - growth_potential: Market growth trends and potential (e.g., "Growing 15% annually", "Emerging market with high potential")

Be specific and research-backed. Use your knowledge of market data, competitor landscapes, and industry trends to provide realistic estimates and insights.

IMPORTANT: If the product appears to be from Pakistan (based on content analysis), ensure:
- origin_country is set to "Pakistan"
- primary_markets focuses on major Pakistani cities (Karachi, Lahore, Islamabad, Faisalabad, Rawalpindi, Peshawar, Quetta, Multan, etc.)
- regional_competitors includes Pakistani local competitors
- main_competitors prioritizes Pakistani brands and companies first, then regional (South Asian) competitors
- cultural_context reflects Pakistani cultural values and preferences
- local_preferences includes Pakistani consumer behaviors and preferences`;

    const { object, usage } = await generateObject({
      model: openai('gpt-4o'),
      schema,
      prompt,
      system: 'You are a marketing analysis expert. Provide detailed, actionable insights.',
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
    throw new Error(`AI semantic analysis failed: ${errorMessage}`);
  }
}
