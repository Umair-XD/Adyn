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
    main_competitors: Array<{
      name: string;
      region: string;
      estimated_price_range: string;
      core_strategy: string; // e.g., "Heavy influencer discounting", "Focus on durability/quality"
    }>;
    competitive_advantages: string[];
    market_positioning: string;
    gap_analysis: string; // What are they MISSING that we can fulfill?
    win_strategy: string; // Specific tactic to beat these local competitors
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
    main_competitors: z.array(z.object({
      name: z.string(),
      region: z.string(),
      estimated_price_range: z.string(),
      core_strategy: z.string()
    })),
    competitive_advantages: z.array(z.string()),
    market_positioning: z.string(),
    gap_analysis: z.string(),
    win_strategy: z.string()
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
    const prompt = `You are an elite Growth Marketing Auditor and Competitive Intelligence Analyst. Analyze the following product/service content for high-ROAS Meta campaigns.

    PRODUCT CONTENT:
    ${input.text}

    EXPERT ANALYSIS REQUIREMENTS:
    1. CORE HOOK: Identify the scroll-stopping hook (visual + headline hook).
    2. LOCAL COMPETITIVE AUDIT: 
       - Identify 3-5 REAL competitors in the target region (e.g., if Pakistan, focus on brands like 'Negative Studios', 'Outfitters', 'Khaadi' if relevant, or niche D2C like 'ELO').
       - CRITICAL: DO NOT suggest Indian brands for Pakistan (this is a common error). Verify the brand is ACTIVE in ${input.text.includes('Pakistan') || input.text.includes('.pk') ? 'Pakistan' : 'the target region'}.
       - Analyze their "Core Strategy": Do they compete on price, quality, speed, or lifestyle?
    3. GAP ANALYSIS: What is the market missing? Is it faster delivery? Better sizing? More vibrant colors? Define how Adyn's client wins.
    4. INTEREST EXPANSION: Provide 15-20 specific Meta-style interests. Do not just say "Fashion". Say "Streetwear", "Sneakerhead culture", "Hypebeast", "Cargo pants enthusiasts", "Online shopping (fashion)", etc.
    5. CULTURAL NUANCE: For Pakistan, mention specifics like 'Cash on Delivery usage', 'Weekend shopping habits', or 'Local influencers/vibe'.

    Return a comprehensive JSON response. Avoid generic "high-quality" filler. Give RAW, AGGRESSIVE marketing reconnaissance.`;

    const { object, usage } = await generateObject({
      model: openai('gpt-4o'),
      schema,
      prompt,
      system: 'You are an elite Growth Auditor. You specialize in hyper-local competitive intelligence for Pakistan, UAE, GCC, and Western markets. You never confuse neighboring regional brands.',
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
