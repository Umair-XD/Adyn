// MCP Tool Schemas
export interface FetchUrlInput {
  url: string;
}

export interface FetchUrlOutput {
  html: string;
}

export interface ExtractContentInput {
  html: string;
}

export interface ExtractContentOutput {
  title: string;
  text_blocks: string[];
  images: string[];
  metadata: Record<string, unknown>;
}

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
}

export interface GenerateAdsInput {
  summary: string;
  brand_tone: string;
  persona: string;
  keywords: string[];
  platforms: string[];
}

export interface AdCreative {
  platform: string;
  target_segment: string;
  headline: string;
  primary_text: string;
  cta: string;
  creative_description: string;
  hashtags: string[];
  targeting_notes: string;
  interest_targeting: {
    primary_interests: string[];
    secondary_interests: string[];
    behavioral_interests: string[];
    trending_interests: string[];
    lookalike_audiences: string[];
    demographic_insights: string;
  };
}

export interface GenerateAdsOutput {
  ads: AdCreative[];
}

export interface AudienceBuilderInput {
  persona: string;
  keywords: string[];
  category: string;
}

export interface AudienceBuilderOutput {
  age_range: string;
  interest_groups: string[];
  geos: string[];
  behaviors: string[];
  segment_targeting: Array<{
    segment_name: string;
    age_range: string;
    gender: string;
    interests: string[];
    behaviors: string[];
    job_titles: string[];
    platforms_active_on: string[];
    best_times_to_reach: string[];
  }>;
  broad_audiences: Array<{
    name: string;
    description: string;
    age_range: string;
    interests: string[];
    trending_topics: string[];
    platforms: string[];
    size_estimate: string;
    why_trending: string;
  }>;
  detailed_interests: Array<{
    category: string;
    interests: string[];
    audience_size_estimate: string;
  }>;
}

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
}

// Unified Adyn Output
export interface AdynOutput {
  product_summary: SemanticAnalyzeOutput;
  marketing_insights: {
    keywords: string[];
    value_proposition: string;
    brand_tone: string;
    category: string;
  };
  ad_creatives: AdCreative[];
  audience_targeting: AudienceBuilderOutput;
  campaign_strategy: CampaignBuilderOutput;
}
