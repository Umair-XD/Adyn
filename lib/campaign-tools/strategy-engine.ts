/**
 * STEP 2 — STRATEGY DECISION ENGINE (MCP-ONLY)
 * 
 * Makes strategic decisions based on audit results using AI Gateway
 * Determines approach, objectives, and Ad Set recommendations
 */

import { generateObject } from 'ai';
import { z } from 'zod';
import { openai } from '../ai-config';
import { AuditResult } from './account-audit';
import { mapToODAX } from './odax-objectives';

export interface CampaignInput {
  campaign_name: string;
  budget_total?: number;
  budget_per_adset?: number;
  creative_assets: Array<{
    type: 'image' | 'video' | 'carousel';
    asset_url: string;
    primary_texts: string[];
    headlines: string[];
    descriptions?: string[];
    cta: string;
    landing_page_url: string;
  }>;
  desired_geos?: string[];
  age_range?: { min: number; max: number };
  genders?: number[];
  constraints?: {
    max_cpa?: number;
    max_cpm?: number;
    prefer_reels_only?: boolean;
  };
  flags?: {
    force_broad?: boolean;
    test_mode?: boolean;
    max_adsets?: number;
  };
}

export interface AdSetStrategy {
  name: string;
  type: 'retargeting' | 'lookalike' | 'interest' | 'broad';
  rationale: string;
  audience_parameters: {
    type: string;
    days?: number;
    percentage?: number;
    interests?: string[];
    exclusions?: string[];
  };
  budget_weight: number;
  optimization_goal: string;
  bid_strategy: string;
  creative_count: number;
  expected_metrics: {
    ctr_range: { min: number; max: number };
    cpm_range: { min: number; max: number };
    learning_phase_days: number;
  };
}

export interface StrategyResult {
  approach: 'DISCOVERY_FIRST' | 'HYBRID' | 'PERFORMANCE_SCALING';
  campaign_objective: string;
  timeline: {
    phase_1_days?: number;
    phase_2_start?: string;
    scaling_triggers?: string[];
  };
  adset_strategies: AdSetStrategy[];
  budget_allocation: Record<string, number>;
  optimization_sequence: Array<{
    day: number;
    action: string;
    trigger: string;
  }>;
  success_metrics: {
    primary: string;
    secondary: string[];
    thresholds: Record<string, number>;
  };
  risk_mitigation: string[];
  ai_reasoning: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

const strategySchema = z.object({
  approach: z.enum(['DISCOVERY_FIRST', 'HYBRID', 'PERFORMANCE_SCALING']),
  campaign_objective: z.string(),
  timeline: z.object({
    phase_1_days: z.number().optional(),
    phase_2_start: z.string().optional(),
    scaling_triggers: z.array(z.string()).optional()
  }),
  adset_strategies: z.array(z.object({
    name: z.string(),
    type: z.enum(['retargeting', 'lookalike', 'interest', 'broad']),
    rationale: z.string(),
    audience_parameters: z.object({
      type: z.string(),
      days: z.number().optional(),
      percentage: z.number().optional(),
      interests: z.array(z.string()).optional(),
      exclusions: z.array(z.string()).optional()
    }),
    budget_weight: z.number(),
    optimization_goal: z.string(),
    bid_strategy: z.string(),
    creative_count: z.number(),
    expected_metrics: z.object({
      ctr_range: z.object({ min: z.number(), max: z.number() }),
      cpm_range: z.object({ min: z.number(), max: z.number() }),
      learning_phase_days: z.number()
    })
  })),
  budget_allocation: z.record(z.string(), z.any()),
  optimization_sequence: z.array(z.object({
    day: z.number(),
    action: z.string(),
    trigger: z.string()
  })),
  success_metrics: z.object({
    primary: z.string(),
    secondary: z.array(z.string()),
    thresholds: z.record(z.string(), z.any())
  }),
  risk_mitigation: z.array(z.string()),
  ai_reasoning: z.string()
});

export async function strategyEngine(input: {
  audit_result: AuditResult;
  business_goal: 'PURCHASE' | 'LEAD' | 'TRAFFIC' | 'AWARENESS' | 'ENGAGEMENT';
  campaign_input: CampaignInput;
}): Promise<StrategyResult> {

  const { audit_result, business_goal, campaign_input } = input;

  const prompt = `You are a Meta Ads strategy expert. Based on the account audit, create an optimal campaign strategy.

ACCOUNT AUDIT ANALYSIS:
- Data Level: ${audit_result.data_level}
- Total Spend (90d): $${audit_result.account_summary.last_90_days.total_spend}
- Total Conversions: ${audit_result.account_summary.last_90_days.total_conversions}
- Average CPA: $${audit_result.account_summary.last_90_days.avg_cpa}
- Average ROAS: ${audit_result.account_summary.last_90_days.avg_roas}
- Pixel Health: ${audit_result.pixel_health}
- Custom Audiences: ${audit_result.account_summary.audience_sizes.custom}
- Risks: ${audit_result.risks.join(', ')}

CAMPAIGN REQUIREMENTS:
- Business Goal: ${business_goal}
- Campaign Name: ${campaign_input.campaign_name}
- Total Budget: $${campaign_input.budget_total || 1000}
- Max AdSets: ${campaign_input.flags?.max_adsets || 4}
- Creative Assets: ${campaign_input.creative_assets.length} assets
- Geos: ${campaign_input.desired_geos?.join(', ') || 'Global'}
- Constraints: ${JSON.stringify(campaign_input.constraints || {})}

VALID ODAX OBJECTIVES:
- OUTCOME_SALES
- OUTCOME_LEADS
- OUTCOME_TRAFFIC
- OUTCOME_AWARENESS
- OUTCOME_ENGAGEMENT
- OUTCOME_APP_PROMOTION

STRATEGY RULES:
1. ZERO_DATA/LOW_DATA → Discovery/Hybrid approach with traffic/engagement focus
2. RICH_DATA → Performance scaling with conversion focus
3. Each AdSet must have exactly ONE audience type
4. Budget allocation must ensure 50+ optimization events per week per AdSet
5. TOTAL CREATIVE LIMIT: You MUST NOT exceed 5 total creative variants across the entire campaign. Allocate variants strategically (e.g., 2 for top ad sets, 1 for others) to stay within the 5-variant limit.
6. REGIONAL FOCUS: Prioritize trends, competitors, and cultural context of the provided Geos: ${campaign_input.desired_geos?.join(', ') || 'Global'}. Focus on origin-specific data rather than global generalizations.
7. ODAX COMPLIANCE: The 'campaign_objective' field MUST be one of the VALID ODAX OBJECTIVES listed above. Do NOT include descriptions or notes in this field.

Create a comprehensive strategy that:
- Determines the optimal approach based on data quality
- Designs 2-4 AdSets with distinct audiences focused on the target region
- Allocates budget for learning phase success
- Sets realistic performance expectations
- Provides clear optimization triggers and timeline
- Includes risk mitigation strategies (regional specific)

Return detailed strategy with clear AI reasoning for all decisions.`;

  try {
    const { object, usage } = await generateObject({
      model: openai('gpt-4o'),
      schema: strategySchema,
      prompt,
      system: `You are an elite Meta Ads Strategist specializing in ${campaign_input.desired_geos?.join(', ') || 'Global'} growth marketing. 
      Your task is to create a hyper-local strategy for a D2C brand. 
      Analyze regional trends, local competitors, and cultural nuances specific to ${campaign_input.desired_geos?.join(', ') || 'the target region'}.
      Use only valid ODAX objectives. Enforce a strict limit of 5 creative variants across the entire campaign.`,
      temperature: 0.2
    });

    const result: StrategyResult = {
      ...object,
      usage: usage ? {
        promptTokens: usage.inputTokens || 0,
        completionTokens: usage.outputTokens || 0,
        totalTokens: usage.totalTokens || 0
      } : undefined
    };

    return result;

  } catch (error) {
    // Fallback to rule-based strategy if AI fails
    console.error('AI strategy generation failed, using fallback:', error);
    return createFallbackStrategy(audit_result, business_goal, campaign_input);
  }
}

function createFallbackStrategy(
  audit_result: AuditResult,
  business_goal: string,
  campaign_input: CampaignInput
): StrategyResult {
  let approach: 'DISCOVERY_FIRST' | 'HYBRID' | 'PERFORMANCE_SCALING' = 'DISCOVERY_FIRST';

  if (audit_result.data_level === 'RICH_DATA') {
    approach = 'PERFORMANCE_SCALING';
  } else if (audit_result.data_level === 'LOW_DATA') {
    approach = 'HYBRID';
  }

  const strategies: AdSetStrategy[] = [];

  if (approach === 'PERFORMANCE_SCALING') {
    strategies.push(
      {
        name: `${campaign_input.campaign_name} - Retargeting 30D`,
        type: 'retargeting',
        rationale: 'High-intent audience with proven conversion data',
        audience_parameters: { type: 'website_visitors', days: 30, exclusions: ['purchasers_30d'] },
        budget_weight: 0.4,
        optimization_goal: 'OFFSITE_CONVERSIONS',
        bid_strategy: 'LOWEST_COST_WITHOUT_CAP',
        creative_count: 3,
        expected_metrics: { ctr_range: { min: 2.0, max: 4.0 }, cpm_range: { min: 15, max: 30 }, learning_phase_days: 3 }
      },
      {
        name: `${campaign_input.campaign_name} - Lookalike 1%`,
        type: 'lookalike',
        rationale: 'Precise lookalike based on conversion data',
        audience_parameters: { type: 'lookalike', percentage: 1, exclusions: ['website_visitors_180d'] },
        budget_weight: 0.3,
        optimization_goal: 'OFFSITE_CONVERSIONS',
        bid_strategy: 'LOWEST_COST_WITHOUT_CAP',
        creative_count: 4,
        expected_metrics: { ctr_range: { min: 1.5, max: 3.0 }, cpm_range: { min: 20, max: 40 }, learning_phase_days: 5 }
      }
    );
  } else {
    strategies.push(
      {
        name: `${campaign_input.campaign_name} - Broad Discovery`,
        type: 'broad',
        rationale: 'Build pixel data and find new audiences',
        audience_parameters: { type: 'broad_discovery' },
        budget_weight: 0.6,
        optimization_goal: 'LINK_CLICKS',
        bid_strategy: 'LOWEST_COST_WITHOUT_CAP',
        creative_count: 5,
        expected_metrics: { ctr_range: { min: 0.8, max: 1.5 }, cpm_range: { min: 25, max: 45 }, learning_phase_days: 7 }
      }
    );
  }

  return {
    approach,
    campaign_objective: mapBusinessGoalToObjective(business_goal),
    timeline: {
      phase_1_days: approach === 'DISCOVERY_FIRST' ? 14 : 7,
      scaling_triggers: ['CTR > 1.5%', 'CPA < target']
    },
    adset_strategies: strategies,
    budget_allocation: strategies.reduce((acc, strategy) => {
      acc[strategy.name] = strategy.budget_weight;
      return acc;
    }, {} as Record<string, number>),
    optimization_sequence: [
      { day: 1, action: 'Launch at 70% budget', trigger: 'Campaign start' },
      { day: 3, action: 'Analyze performance', trigger: 'Learning phase check' },
      { day: 7, action: 'Scale winners', trigger: 'Performance threshold met' }
    ],
    success_metrics: {
      primary: getSuccessMetric(business_goal),
      secondary: ['CTR', 'Frequency', 'Relevance Score'],
      thresholds: { min_ctr: 1.0, max_cpm: 50, max_frequency: 3.0 }
    },
    risk_mitigation: audit_result.risks,
    ai_reasoning: 'Fallback rule-based strategy due to AI generation failure'
  };
}

function mapBusinessGoalToObjective(goal: string): string {
  const mapping: Record<string, string> = {
    'PURCHASE': 'OUTCOME_SALES',
    'LEAD': 'OUTCOME_LEADS',
    'TRAFFIC': 'OUTCOME_TRAFFIC',
    'AWARENESS': 'OUTCOME_AWARENESS',
    'ENGAGEMENT': 'OUTCOME_ENGAGEMENT'
  };
  return mapping[goal] || 'OUTCOME_TRAFFIC';
}

function getSuccessMetric(goal: string): string {
  const mapping: Record<string, string> = {
    'PURCHASE': 'ROAS',
    'LEAD': 'Cost per Lead',
    'TRAFFIC': 'Cost per Click',
    'AWARENESS': 'CPM',
    'ENGAGEMENT': 'Cost per Engagement'
  };
  return mapping[goal] || 'CTR';
}
