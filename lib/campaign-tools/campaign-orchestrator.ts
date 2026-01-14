/**
 * STEP 7 — OUTPUT CONTRACT (STRICT)
 * 
 * Outputs final API-ready payloads in correct Meta hierarchy
 * Campaign → AdSets → Creatives → Ads
 */

export interface CampaignStructure {
  audit: any;
  strategy: any;
  audiences: any[];
  placements: any[];
  creatives: any[];
  budgets: any[];
}

export interface APIPayload {
  endpoint: string;
  method: 'POST' | 'GET' | 'PUT' | 'DELETE';
  payload: Record<string, any>;
  dependencies?: string[];
  validation_rules?: string[];
}

export interface CampaignOrchestrationResult {
  campaign_payload: APIPayload;
  adset_payloads: APIPayload[];
  creative_payloads: APIPayload[];
  ad_payloads: APIPayload[];
  api_execution_order: Array<{
    step: number;
    description: string;
    endpoint: string;
    success_criteria: string;
    error_handling: string;
  }>;
  validation_checklist: Array<{
    item: string;
    status: 'REQUIRED' | 'RECOMMENDED' | 'OPTIONAL';
    description: string;
  }>;
  risk_flags: Array<{
    severity: 'HIGH' | 'MEDIUM' | 'LOW';
    message: string;
    mitigation: string;
  }>;
  support_hooks: Array<{
    trigger: string;
    action: string;
    mcp_tool: string;
  }>;
  rollback_plan: Array<{
    step: string;
    action: string;
    conditions: string[];
  }>;
}

export async function campaignOrchestrator(input: {
  campaign_structure: CampaignStructure;
  account_id: string;
}): Promise<CampaignOrchestrationResult> {

  const { campaign_structure, account_id } = input;

  const result: CampaignOrchestrationResult = {
    campaign_payload: {} as APIPayload,
    adset_payloads: [],
    creative_payloads: [],
    ad_payloads: [],
    api_execution_order: [],
    validation_checklist: [],
    risk_flags: [],
    support_hooks: [],
    rollback_plan: []
  };

  // Generate campaign payload
  result.campaign_payload = generateCampaignPayload(campaign_structure, account_id);

  // Generate adset payloads
  result.adset_payloads = generateAdSetPayloads(campaign_structure, account_id);

  // Generate creative payloads
  result.creative_payloads = generateCreativePayloads(campaign_structure, account_id);

  // Generate ad payloads (linking adsets to creatives)
  result.ad_payloads = generateAdPayloads(campaign_structure, account_id);

  // Create execution order
  result.api_execution_order = createExecutionOrder();

  // Generate validation checklist
  result.validation_checklist = createValidationChecklist();

  // Identify risk flags
  result.risk_flags = identifyRiskFlags(campaign_structure);

  // Setup support hooks
  result.support_hooks = createSupportHooks();

  // Create rollback plan
  result.rollback_plan = createRollbackPlan();

  return result;
}

function generateCampaignPayload(structure: CampaignStructure, accountId: string): APIPayload {
  const strategy = structure.strategy;

  return {
    endpoint: `/act_${accountId}/campaigns`,
    method: 'POST',
    payload: {
      name: strategy.campaign_name || 'Adyn Generated Campaign',
      objective: strategy.campaign_objective || 'LINK_CLICKS',
      status: 'PAUSED', // Always start paused for review
      buying_type: 'AUCTION',
      special_ad_categories: [], // Add if needed for regulated industries
      spend_cap: structure.budgets?.[0]?.total_budget ? structure.budgets[0].total_budget * 100 : undefined // Convert to cents
    },
    dependencies: [],
    validation_rules: [
      'Campaign name must be unique',
      'Objective must match ad set optimization goals',
      'Account must have sufficient permissions'
    ]
  };
}

function generateAdSetPayloads(structure: CampaignStructure, accountId: string): APIPayload[] {
  const payloads: APIPayload[] = [];

  if (!structure.audiences || !structure.budgets) {
    return payloads;
  }

  for (let i = 0; i < structure.audiences.length; i++) {
    const audience = structure.audiences[i];
    const budget = structure.budgets[i];
    const placement = structure.placements?.[i];

    // Determine billing event based on optimization goal
    const billingEvent = determineBillingEvent(budget.bidding_strategy.optimization_goal);

    const adsetPayload: APIPayload = {
      endpoint: `/act_${accountId}/adsets`,
      method: 'POST',
      payload: {
        name: audience.name,
        campaign_id: '{{CAMPAIGN_ID}}',
        targeting: cleanTargetingPayload(audience.targeting),
        daily_budget: budget.budget_strategy.daily_budget * 100, // Convert to cents
        billing_event: billingEvent,
        optimization_goal: budget.bidding_strategy.optimization_goal,
        bid_strategy: budget.bidding_strategy.bid_strategy,
        status: 'PAUSED',
        start_time: new Date().toISOString(),
        destination_type: determineDestinationType(budget.bidding_strategy.optimization_goal),
        promoted_object: buildPromotedObject(budget.bidding_strategy.optimization_goal),
        // iOS 14+ Attribution
        attribution_spec: [
          {
            event_type: 'CLICK_THROUGH',
            window_days: 7
          },
          {
            event_type: 'VIEW_THROUGH',
            window_days: 1
          }
        ]
      },
      dependencies: ['CAMPAIGN_ID', 'PAGE_ID', 'PIXEL_ID'],
      validation_rules: [
        'Targeting must have valid audience size',
        'Budget must meet minimum requirements',
        'Optimization goal must be compatible with objective'
      ]
    };

    // Add bid amount if using bid cap
    if (budget.bidding_strategy.bid_amount) {
      adsetPayload.payload.bid_amount = budget.bidding_strategy.bid_amount * 100; // Convert to cents
    }

    // Add target cost if using target bidding
    if (budget.bidding_strategy.target_cost) {
      adsetPayload.payload.target_cost = budget.bidding_strategy.target_cost * 100; // Convert to cents
    }

    // Add placement restrictions if specified (CRITICAL FIX: placements are TOP-LEVEL, not in targeting)
    if (placement && placement.placements) {
      const publisherPlatforms = [];
      const facebookPositions = [];
      const instagramPositions = [];
      const audienceNetworkPositions = [];
      const messengerPositions = [];

      if (placement.placements.facebook_positions?.length > 0) {
        publisherPlatforms.push('facebook');
        facebookPositions.push(...placement.placements.facebook_positions);
      }

      if (placement.placements.instagram_positions?.length > 0) {
        publisherPlatforms.push('instagram');
        instagramPositions.push(...placement.placements.instagram_positions);
      }

      if (placement.placements.audience_network_positions?.length > 0) {
        publisherPlatforms.push('audience_network');
        audienceNetworkPositions.push(...placement.placements.audience_network_positions);
      }

      if (placement.placements.messenger_positions?.length > 0) {
        publisherPlatforms.push('messenger');
        messengerPositions.push(...placement.placements.messenger_positions);
      }

      // CORRECT: Placements are top-level adset parameters
      if (publisherPlatforms.length > 0) {
        adsetPayload.payload.publisher_platforms = publisherPlatforms;
        if (facebookPositions.length > 0) adsetPayload.payload.facebook_positions = facebookPositions;
        if (instagramPositions.length > 0) adsetPayload.payload.instagram_positions = instagramPositions;
        if (audienceNetworkPositions.length > 0) adsetPayload.payload.audience_network_positions = audienceNetworkPositions;
        if (messengerPositions.length > 0) adsetPayload.payload.messenger_positions = messengerPositions;
      }
    }

    payloads.push(adsetPayload);
  }

  return payloads;
}

function generateCreativePayloads(structure: CampaignStructure, accountId: string): APIPayload[] {
  const payloads: APIPayload[] = [];

  if (!structure.creatives) {
    return payloads;
  }

  for (const creativeStrategy of structure.creatives) {
    for (const variant of creativeStrategy.creative_variants) {
      const creativePayload: APIPayload = {
        endpoint: `/act_${accountId}/adcreatives`,
        method: 'POST',
        payload: {
          name: variant.name,
          object_story_spec: {
            page_id: '{{PAGE_ID}}',
            link_data: {
              ...variant.payload.object_story_spec.link_data,
              // Ensure tracking parameters are included
              link: addTrackingToURL(
                variant.payload.object_story_spec.link_data.link,
                variant.tracking_parameters
              )
            }
          },
          degrees_of_freedom_spec: {
            creative_features_spec: {
              standard_enhancements: {
                enroll_status: 'OPT_IN' // Enable automatic enhancements
              }
            }
          }
        },
        dependencies: ['PAGE_ID'],
        validation_rules: [
          'Creative must comply with Meta policies',
          'Media assets must be uploaded and approved',
          'Landing page must be accessible'
        ]
      };

      // Add Instagram actor ID if needed
      if (variant.payload.instagram_actor_id) {
        creativePayload.payload.instagram_actor_id = '{{INSTAGRAM_ACTOR_ID}}';
        creativePayload.dependencies?.push('INSTAGRAM_ACTOR_ID');
      }

      payloads.push(creativePayload);
    }
  }

  return payloads;
}

function generateAdPayloads(structure: CampaignStructure, accountId: string): APIPayload[] {
  const payloads: APIPayload[] = [];

  if (!structure.creatives || !structure.audiences) {
    return payloads;
  }

  let adIndex = 0;

  for (let adsetIndex = 0; adsetIndex < structure.audiences.length; adsetIndex++) {
    const creativeStrategy = structure.creatives[adsetIndex];

    if (creativeStrategy && creativeStrategy.creative_variants) {
      for (let creativeIndex = 0; creativeIndex < creativeStrategy.creative_variants.length; creativeIndex++) {
        const adPayload: APIPayload = {
          endpoint: `/act_${accountId}/ads`,
          method: 'POST',
          payload: {
            name: `Ad ${adIndex + 1} - ${creativeStrategy.creative_variants[creativeIndex].name}`,
            adset_id: `{{ADSET_${adsetIndex}_ID}}`,
            creative: {
              creative_id: `{{CREATIVE_${adIndex}_ID}}`
            },
            status: 'PAUSED', // Start paused
            tracking_specs: [
              {
                action_type: ['offsite_conversion'],
                fb_pixel: ['{{PIXEL_ID}}']
              }
            ]
          },
          dependencies: [`ADSET_${adsetIndex}_ID`, `CREATIVE_${adIndex}_ID`, 'PIXEL_ID'],
          validation_rules: [
            'AdSet must be created successfully',
            'Creative must be approved',
            'Pixel must be installed on landing page'
          ]
        };

        payloads.push(adPayload);
        adIndex++;
      }
    }
  }

  return payloads;
}

function createExecutionOrder(): Array<{
  step: number;
  description: string;
  endpoint: string;
  success_criteria: string;
  error_handling: string;
}> {

  return [
    {
      step: 1,
      description: 'Create Campaign',
      endpoint: 'POST /campaigns',
      success_criteria: 'Campaign ID returned, status = PAUSED',
      error_handling: 'Check account permissions and campaign name uniqueness'
    },
    {
      step: 2,
      description: 'Create Ad Sets',
      endpoint: 'POST /adsets',
      success_criteria: 'All AdSet IDs returned, targeting validated',
      error_handling: 'Validate audience sizes and budget minimums via Support MCP'
    },
    {
      step: 3,
      description: 'Create Ad Creatives',
      endpoint: 'POST /adcreatives',
      success_criteria: 'All Creative IDs returned, no policy violations',
      error_handling: 'Send policy violations to Support MCP for resolution'
    },
    {
      step: 4,
      description: 'Create Ads (Link AdSets to Creatives)',
      endpoint: 'POST /ads',
      success_criteria: 'All Ad IDs returned, status = PAUSED',
      error_handling: 'Verify AdSet and Creative IDs exist'
    },
    {
      step: 5,
      description: 'Validate Campaign Structure',
      endpoint: 'GET /campaigns/{id}',
      success_criteria: 'Complete hierarchy visible, no errors',
      error_handling: 'Use Support MCP to diagnose structural issues'
    },
    {
      step: 6,
      description: 'Enable Campaign (Manual Step)',
      endpoint: 'POST /campaigns/{id}',
      success_criteria: 'Campaign status = ACTIVE, learning phase begins',
      error_handling: 'Monitor via Support MCP for learning limited issues'
    }
  ];
}

function createValidationChecklist(): Array<{
  item: string;
  status: 'REQUIRED' | 'RECOMMENDED' | 'OPTIONAL';
  description: string;
}> {

  return [
    {
      item: 'Meta Pixel Installed',
      status: 'REQUIRED',
      description: 'Pixel must be firing on landing page for conversion tracking'
    },
    {
      item: 'Conversions API Setup',
      status: 'RECOMMENDED',
      description: 'Server-side tracking for iOS14+ attribution'
    },
    {
      item: 'Page Connected',
      status: 'REQUIRED',
      description: 'Facebook/Instagram page must be connected to ad account'
    },
    {
      item: 'Payment Method Valid',
      status: 'REQUIRED',
      description: 'Active payment method with sufficient credit limit'
    },
    {
      item: 'Domain Verification',
      status: 'RECOMMENDED',
      description: 'Verify domain ownership for better delivery'
    },
    {
      item: 'Creative Assets Approved',
      status: 'REQUIRED',
      description: 'All images/videos must pass Meta policy review'
    },
    {
      item: 'Landing Page Compliant',
      status: 'REQUIRED',
      description: 'Landing page must comply with Meta advertising policies'
    },
    {
      item: 'Audience Overlap Check',
      status: 'RECOMMENDED',
      description: 'Minimize audience overlap between ad sets'
    }
  ];
}

function identifyRiskFlags(structure: CampaignStructure): Array<{
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  message: string;
  mitigation: string;
}> {

  const risks = [];

  // Check for high-risk configurations
  if (structure.budgets?.some(b => b.budget_strategy.daily_budget < 20)) {
    risks.push({
      severity: 'HIGH' as const,
      message: 'Daily budget below $20 may prevent learning phase completion',
      mitigation: 'Increase budget or consolidate ad sets'
    });
  }

  if (structure.audiences?.some(a => a.estimated_reach.max < 1000)) {
    risks.push({
      severity: 'HIGH' as const,
      message: 'Audience size too small for effective delivery',
      mitigation: 'Broaden targeting or use lookalike audiences'
    });
  }

  if (!structure.audit?.pixel_health || structure.audit.pixel_health === 'NONE') {
    risks.push({
      severity: 'MEDIUM' as const,
      message: 'No pixel data available for optimization',
      mitigation: 'Install pixel and run traffic campaigns first'
    });
  }

  if (structure.creatives?.some(c => c.creative_variants.length < 3)) {
    risks.push({
      severity: 'LOW' as const,
      message: 'Limited creative variety may impact performance',
      mitigation: 'Add more creative variants for better testing'
    });
  }

  return risks;
}

function createSupportHooks(): Array<{
  trigger: string;
  action: string;
  mcp_tool: string;
}> {

  return [
    {
      trigger: 'Ad Rejected',
      action: 'Analyze rejection reason and suggest fixes',
      mcp_tool: 'adyn-support/policy_analyzer'
    },
    {
      trigger: 'Learning Limited',
      action: 'Diagnose learning phase issues',
      mcp_tool: 'adyn-support/learning_diagnostics'
    },
    {
      trigger: 'High CPM',
      action: 'Analyze delivery issues and suggest optimizations',
      mcp_tool: 'adyn-support/delivery_optimizer'
    },
    {
      trigger: 'Low CTR',
      action: 'Suggest creative and targeting improvements',
      mcp_tool: 'adyn-support/performance_analyzer'
    },
    {
      trigger: 'Audience Overlap Warning',
      action: 'Provide audience consolidation recommendations',
      mcp_tool: 'adyn-support/audience_optimizer'
    }
  ];
}

function createRollbackPlan(): Array<{
  step: string;
  action: string;
  conditions: string[];
}> {

  return [
    {
      step: 'Pause Campaign',
      action: 'Set campaign status to PAUSED',
      conditions: ['High spend with no conversions', 'Policy violations detected']
    },
    {
      step: 'Pause Underperforming AdSets',
      action: 'Pause ad sets with CPA > 3x target',
      conditions: ['CPA exceeds threshold for 24 hours', 'Zero conversions after $100 spend']
    },
    {
      step: 'Archive Failed Creatives',
      action: 'Archive creatives with CTR < 0.5%',
      conditions: ['CTR below threshold for 48 hours', 'Creative rejected multiple times']
    },
    {
      step: 'Revert Budget Changes',
      action: 'Reset budgets to original allocation',
      conditions: ['Performance degradation after scaling', 'Learning phase reset']
    }
  ];
}

function cleanTargetingPayload(targeting: any): any {
  // Remove any invalid or empty targeting parameters
  const cleaned = { ...targeting };

  // Remove empty arrays
  Object.keys(cleaned).forEach(key => {
    if (Array.isArray(cleaned[key]) && cleaned[key].length === 0) {
      delete cleaned[key];
    }
  });

  // Ensure required fields
  // Ensure geo_locations structure exists if not deleted above
  if (!cleaned.geo_locations && targeting.geo_locations) {
    cleaned.geo_locations = targeting.geo_locations;
  }

  if (!cleaned.age_min) cleaned.age_min = 18;
  if (!cleaned.age_max) cleaned.age_max = 65;

  return cleaned;
}

function addTrackingToURL(url: string, trackingParams: any): string {
  const separator = url.includes('?') ? '&' : '?';
  const params = new URLSearchParams(trackingParams).toString();
  return `${url}${separator}${params}`;
}

/**
 * Determines the correct billing_event based on optimization goal
 * CRITICAL: billing_event must match optimization goal for delivery
 */
function determineBillingEvent(optimizationGoal: string): string {
  const billingEventMap: Record<string, string> = {
    'LINK_CLICKS': 'LINK_CLICKS',
    'LANDING_PAGE_VIEWS': 'IMPRESSIONS',
    'OFFSITE_CONVERSIONS': 'IMPRESSIONS',
    'CONVERSIONS': 'IMPRESSIONS',
    'LEAD_GENERATION': 'IMPRESSIONS',
    'APP_INSTALLS': 'IMPRESSIONS',
    'POST_ENGAGEMENT': 'IMPRESSIONS',
    'PAGE_LIKES': 'IMPRESSIONS',
    'EVENT_RESPONSES': 'IMPRESSIONS',
    'REACH': 'IMPRESSIONS',
    'IMPRESSIONS': 'IMPRESSIONS',
    'THRUPLAY': 'IMPRESSIONS',
    'VIDEO_VIEWS': 'IMPRESSIONS',
    // ODAX objectives
    'OUTCOME_TRAFFIC': 'IMPRESSIONS',
    'OUTCOME_SALES': 'IMPRESSIONS',
    'OUTCOME_LEADS': 'IMPRESSIONS',
    'OUTCOME_ENGAGEMENT': 'IMPRESSIONS',
    'OUTCOME_APP_PROMOTION': 'IMPRESSIONS',
    'OUTCOME_AWARENESS': 'IMPRESSIONS'
  };

  return billingEventMap[optimizationGoal] || 'IMPRESSIONS';
}

/**
 * Determines destination_type based on optimization goal
 * Required for proper pixel tracking and conversion attribution
 */
function determineDestinationType(optimizationGoal: string): string {
  const destinationMap: Record<string, string> = {
    'LINK_CLICKS': 'WEBSITE',
    'LANDING_PAGE_VIEWS': 'WEBSITE',
    'OFFSITE_CONVERSIONS': 'WEBSITE',
    'CONVERSIONS': 'WEBSITE',
    'APP_INSTALLS': 'APP',
    'APP_ENGAGEMENT': 'APP',
    'LEAD_GENERATION': 'ON_AD',
    'MESSAGES': 'MESSENGER',
    'POST_ENGAGEMENT': 'FACEBOOK',
    'PAGE_LIKES': 'FACEBOOK',
    // ODAX
    'OUTCOME_TRAFFIC': 'WEBSITE',
    'OUTCOME_SALES': 'WEBSITE',
    'OUTCOME_LEADS': 'WEBSITE',
    'OUTCOME_APP_PROMOTION': 'APP'
  };

  return destinationMap[optimizationGoal] || 'WEBSITE';
}

/**
 * Builds the complete promoted_object based on optimization goal
 * Includes pixel_id, custom_event_type, and other required conversion tracking params
 */
function buildPromotedObject(optimizationGoal: string): any {
  const baseObject: any = {
    page_id: '{{PAGE_ID}}'
  };

  // Add pixel tracking for conversion-based objectives
  const conversionObjectives = [
    'OFFSITE_CONVERSIONS', 'CONVERSIONS', 'LINK_CLICKS', 'LANDING_PAGE_VIEWS',
    'OUTCOME_TRAFFIC', 'OUTCOME_SALES', 'OUTCOME_LEADS'
  ];

  if (conversionObjectives.includes(optimizationGoal)) {
    baseObject.pixel_id = '{{PIXEL_ID}}';
    baseObject.custom_event_type = determineCustomEventType(optimizationGoal);
  }

  // Add application_id for app campaigns
  if (optimizationGoal === 'APP_INSTALLS' || optimizationGoal === 'OUTCOME_APP_PROMOTION') {
    baseObject.application_id = '{{APPLICATION_ID}}';
    baseObject.object_store_url = '{{APP_STORE_URL}}';
  }

  return baseObject;
}

/**
 * Determines the custom_event_type for Meta Pixel tracking
 */
function determineCustomEventType(optimizationGoal: string): string {
  const eventTypeMap: Record<string, string> = {
    'OFFSITE_CONVERSIONS': 'PURCHASE',
    'CONVERSIONS': 'PURCHASE',
    'OUTCOME_SALES': 'PURCHASE',
    'OUTCOME_LEADS': 'LEAD',
    'LEAD_GENERATION': 'COMPLETE_REGISTRATION',
    'LANDING_PAGE_VIEWS': 'PAGE_VIEW',
    'LINK_CLICKS': 'PAGE_VIEW',
    'OUTCOME_TRAFFIC': 'PAGE_VIEW'
  };

  return eventTypeMap[optimizationGoal] || 'OTHER';
}

/**
 * Detects if campaign should be marked as special ad category
 * Categories: HOUSING, EMPLOYMENT, CREDIT, ISSUES_ELECTIONS_POLITICS
 */
function detectSpecialAdCategories(structure: CampaignStructure): string[] {
  const categories: string[] = [];

  // Keywords that indicate special categories
  const housingKeywords = ['house', 'housing', 'apartment', 'rent', 'real estate', 'property'];
  const employmentKeywords = ['job', 'hiring', 'employment', 'career', 'recruit'];
  const creditKeywords = ['loan', 'credit', 'mortgage', 'financing', 'lending'];
  const politicalKeywords = ['vote', 'election', 'political', 'candidate', 'ballot'];

  // Check campaign name and creatives for keywords
  const textToCheck = [
    structure.strategy?.campaign_name || '',
    ...(structure.creatives || []).flatMap((c: any) =>
      c.creative_variants.map((v: any) => v.payload.object_story_spec.link_data.message)
    )
  ].join(' ').toLowerCase();

  if (housingKeywords.some(kw => textToCheck.includes(kw))) {
    categories.push('HOUSING');
  }

  if (employmentKeywords.some(kw => textToCheck.includes(kw))) {
    categories.push('EMPLOYMENT');
  }

  if (creditKeywords.some(kw => textToCheck.includes(kw))) {
    categories.push('CREDIT');
  }

  if (politicalKeywords.some(kw => textToCheck.includes(kw))) {
    categories.push('ISSUES_ELECTIONS_POLITICS');
  }

  // Return 'NONE' if no special categories detected
  return categories.length > 0 ? categories : [];
}

