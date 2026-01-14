/**
 * STEP 6 — BUDGET, BIDDING & OPTIMIZATION (MCP)
 * 
 * Optimizes budget allocation, bidding strategy, and optimization events
 */

export interface BudgetConstraints {
  max_cpa?: number;
  max_cpm?: number;
  max_daily_budget?: number;
  min_daily_budget?: number;
  target_roas?: number;
  learning_phase_budget?: number;
}

export interface AdSetWithCreatives {
  adset_id: string;
  name: string;
  type: string;
  audience_size_estimate: { min: number; max: number };
  creative_count: number;
  expected_performance: {
    ctr_range: { min: number; max: number };
    cpm_range: { min: number; max: number };
  };
}

export interface BudgetOptimizationResult {
  adset_id: string;
  name: string;
  budget_strategy: {
    budget_type: 'DAILY' | 'LIFETIME';
    daily_budget?: number;
    lifetime_budget?: number;
    budget_rationale: string[];
  };
  bidding_strategy: {
    bid_strategy: string;
    optimization_goal: string;
    bid_amount?: number;
    target_cost?: number;
    rationale: string[];
  };
  pacing_strategy: {
    delivery_type: 'STANDARD' | 'ACCELERATED';
    schedule?: {
      start_time: string;
      end_time?: string;
    };
  };
  learning_phase: {
    expected_duration_days: number;
    events_needed: number;
    budget_protection: boolean;
  };
  scaling_triggers: Array<{
    metric: string;
    threshold: number;
    action: string;
    timeframe: string;
  }>;
  risk_factors: string[];
}

export async function budgetOptimizer(input: {
  strategy: { approach: string };
  adsets: AdSetWithCreatives[];
  total_budget: number;
  constraints?: BudgetConstraints;
}): Promise<{ budget_optimizations: BudgetOptimizationResult[] }> {

  const { strategy, adsets, total_budget, constraints } = input;
  const budgetOptimizations: BudgetOptimizationResult[] = [];

  // Calculate budget allocation weights
  const budgetWeights = calculateBudgetWeights(adsets, strategy.approach);

  for (let i = 0; i < adsets.length; i++) {
    const adset = adsets[i];
    const allocatedBudget = Math.floor(total_budget * budgetWeights[i]);

    const optimization = await optimizeBudgetForAdSet(
      adset,
      allocatedBudget,
      strategy.approach,
      constraints
    );

    budgetOptimizations.push(optimization);
  }

  // Validate total budget allocation
  validateBudgetAllocation(budgetOptimizations, total_budget);

  return { budget_optimizations: budgetOptimizations };
}

function calculateBudgetWeights(adsets: AdSetWithCreatives[], approach: string): number[] {
  const weights: number[] = [];

  if (approach === 'RICH_DATA') {
    // Prioritize retargeting and proven audiences
    for (const adset of adsets) {
      if (adset.type === 'retargeting') {
        weights.push(0.4);
      } else if (adset.type === 'lookalike') {
        weights.push(0.3);
      } else if (adset.type === 'interest') {
        weights.push(0.2);
      } else {
        weights.push(0.1);
      }
    }
  } else if (approach === 'HYBRID') {
    // Balanced allocation with slight preference for broader audiences
    for (const adset of adsets) {
      if (adset.type === 'broad') {
        weights.push(0.4);
      } else if (adset.type === 'interest') {
        weights.push(0.3);
      } else {
        weights.push(0.3);
      }
    }
  } else { // DISCOVERY_FIRST
    // Even split with slight preference for broad
    for (const adset of adsets) {
      if (adset.type === 'broad') {
        weights.push(0.6);
      } else {
        weights.push(0.4);
      }
    }
  }

  // Normalize weights to sum to 1
  const sum = weights.reduce((a, b) => a + b, 0);
  return weights.map(w => w / sum);
}

async function optimizeBudgetForAdSet(
  adset: AdSetWithCreatives,
  allocatedBudget: number,
  approach: string,
  constraints?: BudgetConstraints
): Promise<BudgetOptimizationResult> {

  const result: BudgetOptimizationResult = {
    adset_id: adset.adset_id,
    name: adset.name,
    budget_strategy: {
      budget_type: 'DAILY',
      budget_rationale: []
    },
    bidding_strategy: {
      bid_strategy: 'LOWEST_COST_WITHOUT_CAP',
      optimization_goal: 'LINK_CLICKS',
      rationale: []
    },
    pacing_strategy: {
      delivery_type: 'STANDARD'
    },
    learning_phase: {
      expected_duration_days: 7,
      events_needed: 50,
      budget_protection: true
    },
    scaling_triggers: [],
    risk_factors: []
  };

  // Determine budget type and amount
  const dailyBudget = Math.max(allocatedBudget / 7, 10); // Minimum $10/day

  if (constraints?.min_daily_budget && dailyBudget < constraints.min_daily_budget) {
    result.budget_strategy.daily_budget = constraints.min_daily_budget;
    result.budget_strategy.budget_rationale.push(
      `Increased to minimum daily budget of $${constraints.min_daily_budget}`
    );
  } else if (constraints?.max_daily_budget && dailyBudget > constraints.max_daily_budget) {
    result.budget_strategy.daily_budget = constraints.max_daily_budget;
    result.budget_strategy.budget_rationale.push(
      `Capped at maximum daily budget of $${constraints.max_daily_budget}`
    );
  } else {
    result.budget_strategy.daily_budget = Math.round(dailyBudget);
  }

  // Budget rationale based on audience size
  if (adset.audience_size_estimate.max < 100000) {
    result.budget_strategy.budget_rationale.push(
      'Conservative budget for small audience to prevent quick saturation'
    );
    result.budget_strategy.daily_budget = Math.min(result.budget_strategy.daily_budget, 50);
  } else if (adset.audience_size_estimate.min > 10000000) {
    result.budget_strategy.budget_rationale.push(
      'Higher budget allocation for large audience with scaling potential'
    );
  }

  // Determine bidding strategy
  result.bidding_strategy = determineBiddingStrategy(adset, approach, constraints);

  // Set optimization goal
  result.bidding_strategy.optimization_goal = determineOptimizationGoal(adset.type, approach);

  // Configure pacing
  result.pacing_strategy = configurePacing(adset);

  // Calculate learning phase requirements
  result.learning_phase = calculateLearningPhase(adset, result.bidding_strategy.optimization_goal);

  // Set scaling triggers
  result.scaling_triggers = defineScalingTriggers(adset, approach, constraints);

  // Identify risk factors
  result.risk_factors = identifyRiskFactors(adset, result, constraints);

  return result;
}

function determineBiddingStrategy(
  adset: AdSetWithCreatives,
  approach: string,
  constraints?: BudgetConstraints
): BudgetOptimizationResult['bidding_strategy'] {

  const strategy: BudgetOptimizationResult['bidding_strategy'] = {
    bid_strategy: 'LOWEST_COST_WITHOUT_CAP',
    optimization_goal: 'LINK_CLICKS',
    rationale: []
  };

  if (approach === 'RICH_DATA') {
    if (adset.type === 'retargeting') {
      if (constraints?.target_roas && constraints.target_roas > 2) {
        strategy.bid_strategy = 'TARGET_ROAS';
        strategy.target_cost = constraints.target_roas;
        strategy.rationale.push('Using ROAS bidding for high-intent retargeting audience');
      } else if (constraints?.max_cpa) {
        strategy.bid_strategy = 'TARGET_COST';
        strategy.target_cost = constraints.max_cpa;
        strategy.rationale.push('Using CPA bidding to control acquisition costs');
      }
    } else {
      strategy.bid_strategy = 'LOWEST_COST_WITHOUT_CAP';
      strategy.rationale.push('Using lowest cost for prospecting with rich data');
    }
  } else if (approach === 'HYBRID') {
    if (constraints?.max_cpa && adset.type !== 'broad') {
      strategy.bid_strategy = 'LOWEST_COST_WITH_BID_CAP';
      strategy.bid_amount = constraints.max_cpa * 0.8; // 20% buffer
      strategy.rationale.push('Using bid cap to control costs during testing phase');
    } else {
      strategy.bid_strategy = 'LOWEST_COST_WITHOUT_CAP';
      strategy.rationale.push('Using lowest cost for data collection');
    }
  } else { // DISCOVERY_FIRST
    strategy.bid_strategy = 'LOWEST_COST_WITHOUT_CAP';
    strategy.rationale.push('Using lowest cost to maximize data collection');
  }

  return strategy;
}

function determineOptimizationGoal(adsetType: string, approach: string): string {
  if (approach === 'RICH_DATA') {
    return adsetType === 'retargeting' ? 'OFFSITE_CONVERSIONS' : 'OFFSITE_CONVERSIONS';
  } else if (approach === 'HYBRID') {
    return 'LINK_CLICKS'; // Start with clicks, optimize to conversions later
  } else {
    return 'LINK_CLICKS'; // Discovery phase focuses on traffic
  }
}

function configurePacing(adset: AdSetWithCreatives): BudgetOptimizationResult['pacing_strategy'] {
  const pacing: BudgetOptimizationResult['pacing_strategy'] = {
    delivery_type: 'STANDARD'
  };

  // Use accelerated delivery for retargeting with small audiences
  if (adset.type === 'retargeting' && adset.audience_size_estimate.max < 50000) {
    pacing.delivery_type = 'ACCELERATED';
  }

  // Set schedule for business hours if B2B
  // This would be configurable based on business type
  pacing.schedule = {
    start_time: new Date().toISOString()
  };

  return pacing;
}

function calculateLearningPhase(adset: AdSetWithCreatives, optimizationGoal: string): BudgetOptimizationResult['learning_phase'] {
  const eventsNeeded: Record<string, number> = {
    'LINK_CLICKS': 100,
    'OFFSITE_CONVERSIONS': 50,
    'LEAD_GENERATION': 50,
    'POST_ENGAGEMENT': 200
  };

  const events = eventsNeeded[optimizationGoal] || 50;

  // Estimate duration based on expected performance
  const expectedCTR = (adset.expected_performance.ctr_range.min + adset.expected_performance.ctr_range.max) / 2;

  // Rough calculation: events needed / (daily impressions * CTR)
  const estimatedDays = Math.ceil(events / (1000 * (expectedCTR / 100))); // Assuming 1000 daily impressions

  return {
    expected_duration_days: Math.min(Math.max(estimatedDays, 3), 14), // Between 3-14 days
    events_needed: events,
    budget_protection: true
  };
}

function defineScalingTriggers(
  adset: AdSetWithCreatives,
  approach: string,
  constraints?: BudgetConstraints
): Array<{ metric: string; threshold: number; action: string; timeframe: string }> {

  const triggers = [];

  if (approach === 'RICH_DATA') {
    triggers.push({
      metric: 'CPA',
      threshold: constraints?.max_cpa || 50,
      action: 'Scale budget by 20%',
      timeframe: '3 consecutive days below threshold'
    });

    triggers.push({
      metric: 'ROAS',
      threshold: constraints?.target_roas || 2.0,
      action: 'Scale budget by 30%',
      timeframe: '2 consecutive days above threshold'
    });
  } else {
    triggers.push({
      metric: 'CTR',
      threshold: 1.5,
      action: 'Scale budget by 15%',
      timeframe: '5 days above threshold'
    });

    triggers.push({
      metric: 'CPM',
      threshold: constraints?.max_cpm || 40,
      action: 'Pause if exceeded for 3 days',
      timeframe: '3 consecutive days above threshold'
    });
  }

  return triggers;
}

function identifyRiskFactors(
  adset: AdSetWithCreatives,
  result: BudgetOptimizationResult,
  constraints?: BudgetConstraints
): string[] {

  const risks = [];

  // Budget too low for learning phase
  if (result.budget_strategy.daily_budget && result.budget_strategy.daily_budget < 20) {
    risks.push('Daily budget may be too low for effective learning phase');
  }

  // Audience too small
  if (adset.audience_size_estimate.max < 10000) {
    risks.push('Very small audience - high risk of quick saturation');
  }

  // Audience too large for budget
  if (adset.audience_size_estimate.min > 50000000 &&
    result.budget_strategy.daily_budget && result.budget_strategy.daily_budget < 100) {
    risks.push('Large audience with small budget - may struggle to exit learning phase');
  }

  // High CPM expectations
  if (adset.expected_performance.cpm_range.min > 40) {
    risks.push('High expected CPM - monitor cost efficiency closely');
  }

  // Bidding strategy risks
  if (result.bidding_strategy.bid_strategy === 'TARGET_COST' && !constraints?.max_cpa) {
    risks.push('Target cost bidding without historical CPA data - high risk');
  }

  return risks;
}

function validateBudgetAllocation(
  optimizations: BudgetOptimizationResult[],
  totalBudget: number
): void {

  const allocatedDaily = optimizations.reduce((sum, opt) =>
    sum + (opt.budget_strategy.daily_budget || 0), 0
  );

  const weeklyTotal = allocatedDaily * 7;

  if (weeklyTotal > totalBudget * 1.1) {
    // Adjust budgets proportionally if over-allocated
    const scaleFactor = totalBudget / weeklyTotal;

    for (const opt of optimizations) {
      if (opt.budget_strategy.daily_budget) {
        opt.budget_strategy.daily_budget = Math.round(
          opt.budget_strategy.daily_budget * scaleFactor
        );
        opt.budget_strategy.budget_rationale.push(
          'Budget adjusted to fit total allocation constraint'
        );
      }
    }
  }
}
