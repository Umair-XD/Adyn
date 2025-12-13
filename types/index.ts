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
  brand_tone: string;
  audience_persona: string;
  category: string;
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
  headline: string;
  primary_text: string;
  cta: string;
  creative_description: string;
  hashtags: string[];
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
