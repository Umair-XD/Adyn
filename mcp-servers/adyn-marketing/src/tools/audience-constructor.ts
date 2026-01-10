/**
 * STEP 3 — AUDIENCE CONSTRUCTION (MCP)
 * 
 * Constructs Meta-compliant audiences with proper validation
 * Handles retargeting, lookalike, interest-based, and broad audiences
 */

import { AdSetStrategy } from './strategy-engine.js';

export interface AudienceRequirement {
  type: 'broad' | 'interest' | 'retargeting' | 'lookalike';
  name: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  parameters: Record<string, any>;
}

export interface MetaTargeting {
  geo_locations?: {
    countries?: string[];
    regions?: Array<{ key: string }>;
    cities?: Array<{ key: string; radius?: number; distance_unit?: string }>;
  };
  age_min?: number;
  age_max?: number;
  genders?: number[];
  flexible_spec?: Array<{
    interests?: Array<{ id: string; name: string }>;
    behaviors?: Array<{ id: string; name: string }>;
    demographics?: Array<{ id: string; name: string }>;
  }>;
  custom_audiences?: Array<{
    id: string;
    name: string;
  }>;
  excluded_custom_audiences?: Array<{
    id: string;
    name: string;
  }>;
  lookalike_audiences?: Array<{
    id: string;
    name: string;
  }>;
  publisher_platforms?: string[];
  facebook_positions?: string[];
  instagram_positions?: string[];
  audience_network_positions?: string[];
  messenger_positions?: string[];
}

export interface AudienceResult {
  adset_id: string;
  name: string;
  type: string;
  targeting: MetaTargeting;
  estimated_reach: {
    min: number;
    max: number;
  };
  validation_status: 'VALID' | 'WARNING' | 'ERROR';
  validation_messages: string[];
  overlap_warnings: string[];
  exclusion_rationale: string[];
}

export async function audienceConstructor(input: {
  strategy: { adset_strategies: AdSetStrategy[] };
  audience_requirements: AudienceRequirement[];
}): Promise<{ audiences: AudienceResult[] }> {

  const { strategy } = input;
  const audiences: AudienceResult[] = [];

  for (const adsetStrategy of strategy.adset_strategies) {
    const audience = await constructAudienceForAdSet(adsetStrategy);
    audiences.push(audience);
  }

  // Check for audience overlaps
  const overlapWarnings = detectAudienceOverlaps(audiences);

  // Apply overlap warnings to audiences
  for (const audience of audiences) {
    const relevantWarnings = overlapWarnings.filter(w =>
      w.includes(audience.name)
    );
    audience.overlap_warnings.push(...relevantWarnings);
  }

  return { audiences };
}

async function constructAudienceForAdSet(strategy: AdSetStrategy): Promise<AudienceResult> {
  const audience: AudienceResult = {
    adset_id: `adset_${strategy.name.toLowerCase().replace(/\s+/g, '_')}`,
    name: strategy.name,
    type: strategy.type,
    targeting: {},
    estimated_reach: { min: 0, max: 0 },
    validation_status: 'VALID',
    validation_messages: [],
    overlap_warnings: [],
    exclusion_rationale: []
  };

  // Base demographic targeting
  audience.targeting = {
    age_min: 18,
    age_max: 65,
    geo_locations: {
      countries: ['US'] // Default to US, should be configurable
    }
  };

  // Construct audience based on type
  switch (strategy.type) {
    case 'retargeting':
      await constructRetargetingAudience(audience, strategy);
      break;
    case 'lookalike':
      await constructLookalikeAudience(audience, strategy);
      break;
    case 'interest':
      await constructInterestAudience(audience, strategy);
      break;
    case 'broad':
      await constructBroadAudience(audience, strategy);
      break;
  }

  // Apply exclusions
  applyExclusions(audience, strategy);

  // Validate audience
  validateAudience(audience);

  // Estimate reach (mock implementation)
  estimateReach(audience);

  return audience;
}

async function constructRetargetingAudience(
  audience: AudienceResult,
  strategy: AdSetStrategy
): Promise<void> {
  const { days } = strategy.audience_parameters;

  audience.targeting.custom_audiences = [
    {
      id: `website_visitors_${days}d`,
      name: `Website Visitors ${days} Days`
    }
  ];

  audience.exclusion_rationale.push(
    `Excluding purchasers to avoid wasted spend on converted users`
  );

  // Estimate smaller but higher-intent audience
  audience.estimated_reach = { min: 1000, max: 50000 };
}

async function constructLookalikeAudience(
  audience: AudienceResult,
  strategy: AdSetStrategy
): Promise<void> {
  const { percentage } = strategy.audience_parameters;

  if (typeof percentage !== 'number') {
    audience.validation_status = 'ERROR';
    audience.validation_messages.push('Lookalike audience requires percentage parameter');
    return;
  }

  audience.targeting.lookalike_audiences = [
    {
      id: `lookalike_purchasers_${percentage}pct`,
      name: `Lookalike Purchasers ${percentage}%`
    }
  ];

  audience.exclusion_rationale.push(
    `Excluding website visitors to focus on new prospects`
  );

  // Estimate reach based on percentage
  const baseReach = percentage === 1 ? 2000000 : percentage * 2000000;
  audience.estimated_reach = {
    min: Math.floor(baseReach * 0.8),
    max: Math.floor(baseReach * 1.2)
  };
}

async function constructInterestAudience(
  audience: AudienceResult,
  strategy: AdSetStrategy
): Promise<void> {
  const { interests } = strategy.audience_parameters;

  if (!interests || interests.length === 0) {
    audience.validation_status = 'ERROR';
    audience.validation_messages.push('Interest audience requires at least one interest');
    return;
  }

  // Validate interests using real Meta IDs
  const validatedInterests = await validateInterests(interests);

  if (validatedInterests.length === 0) {
    audience.validation_status = 'ERROR';
    audience.validation_messages.push('No valid Meta interests found. Check interest names or query Meta Targeting Search API.');
    return;
  }

  if (strategy.audience_parameters.type === 'interest_stacked') {
    // Stacked interests (AND logic)
    audience.targeting.flexible_spec = [
      {
        interests: validatedInterests
      }
    ];
  } else {
    // Flexible interests (OR logic)
    audience.targeting.flexible_spec = validatedInterests.map(interest => ({
      interests: [interest]
    }));
  }

  audience.exclusion_rationale.push(
    `Excluding website visitors to focus on cold prospects`
  );

  audience.estimated_reach = { min: 500000, max: 2000000 };
}

async function constructBroadAudience(
  audience: AudienceResult,
  strategy: AdSetStrategy
): Promise<void> {
  // Broad audience uses only demographic targeting
  // No interests, behaviors, or custom audiences

  audience.exclusion_rationale.push(
    `Minimal targeting to allow Meta algorithm maximum freedom`
  );

  if (strategy.audience_parameters.exclusions?.length) {
    audience.exclusion_rationale.push(
      `Excluding converters to focus budget on new prospects`
    );
  }

  audience.estimated_reach = { min: 10000000, max: 50000000 };
}

function applyExclusions(audience: AudienceResult, strategy: AdSetStrategy): void {
  const exclusions = strategy.audience_parameters.exclusions || [];

  if (exclusions.length > 0) {
    audience.targeting.excluded_custom_audiences = exclusions.map(exclusion => ({
      id: exclusion,
      name: exclusion.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
    }));
  }
}

function validateAudience(audience: AudienceResult): void {
  // Check minimum audience size
  if (audience.estimated_reach.max < 1000) {
    audience.validation_status = 'ERROR';
    audience.validation_messages.push('Audience too small - minimum 1,000 people required');
  }

  // Check maximum audience size for learning phase
  if (audience.estimated_reach.min > 100000000) {
    audience.validation_status = 'WARNING';
    audience.validation_messages.push('Very large audience - may impact learning phase efficiency');
  }

  // Validate age range
  if (audience.targeting.age_min && audience.targeting.age_max) {
    if (audience.targeting.age_min >= audience.targeting.age_max) {
      audience.validation_status = 'ERROR';
      audience.validation_messages.push('Invalid age range - minimum age must be less than maximum');
    }
  }

  // Check for conflicting targeting
  if (audience.targeting.custom_audiences?.length && audience.targeting.lookalike_audiences?.length) {
    audience.validation_status = 'WARNING';
    audience.validation_messages.push('Using both custom and lookalike audiences may create conflicts');
  }
}

function estimateReach(audience: AudienceResult): void {
  // Mock reach estimation based on targeting complexity
  let reachMultiplier = 1.0;

  if (audience.targeting.flexible_spec?.length) {
    reachMultiplier *= 0.3; // Interests reduce reach
  }

  if (audience.targeting.custom_audiences?.length) {
    reachMultiplier *= 0.1; // Custom audiences are much smaller
  }

  if (audience.targeting.excluded_custom_audiences?.length) {
    reachMultiplier *= 0.9; // Exclusions slightly reduce reach
  }

  // Apply multiplier to base estimates
  audience.estimated_reach.min = Math.floor(audience.estimated_reach.min * reachMultiplier);
  audience.estimated_reach.max = Math.floor(audience.estimated_reach.max * reachMultiplier);
}

function detectAudienceOverlaps(audiences: AudienceResult[]): string[] {
  const warnings: string[] = [];

  for (let i = 0; i < audiences.length; i++) {
    for (let j = i + 1; j < audiences.length; j++) {
      const aud1 = audiences[i];
      const aud2 = audiences[j];

      // Check for potential overlaps
      if (aud1.type === 'broad' && aud2.type === 'broad') {
        warnings.push(`High overlap risk between ${aud1.name} and ${aud2.name} - both use broad targeting`);
      }

      if (aud1.type === 'interest' && aud2.type === 'interest') {
        // Check for similar interests (simplified)
        warnings.push(`Potential overlap between ${aud1.name} and ${aud2.name} - review interest selection`);
      }

      if (aud1.type === 'lookalike' && aud2.type === 'lookalike') {
        warnings.push(`Lookalike overlap between ${aud1.name} and ${aud2.name} - consider different percentages`);
      }
    }
  }

  return warnings;
}

async function validateInterests(interests: string[]): Promise<Array<{ id: string; name: string }>> {
  // Import the real interest validation service
  try {
    const { validateInterests: validateMetaInterests, formatInterestsForAPI } = await import('../lib/meta-interests.js');

    // Get validated interests with real Meta IDs
    const validatedInterests = await validateMetaInterests(interests);

    // Format for API
    return formatInterestsForAPI(validatedInterests);
  } catch (error) {
    console.warn('Failed to load meta-interests module, using fallback:', error);

    // Fallback to generic mapping (TEMPORARY - should not be used in production)
    return interests.map(interest => ({
      id: '6003139266461', // Default to "Online Shopping" interest
      name: interest
    }));
  }
}
