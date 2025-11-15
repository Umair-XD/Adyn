import { AdCreative } from './generate-ads.js';
import { AudienceBuilderOutput } from './audience-builder.js';

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

export async function campaignBuilder(input: CampaignBuilderInput): Promise<CampaignBuilderOutput> {
  const { ads, audience, objective } = input;
  
  // Extract platforms from ads
  const platform_mix = ads.map(ad => ad.platform);
  
  // Determine campaign name
  const firstKeyword = ads[0]?.headline.split(' ')[1] || 'Marketing';
  const campaign_name = `${firstKeyword} Campaign - ${new Date().toISOString().split('T')[0]}`;
  
  // Set objective
  const finalObjective = objective || 'Conversions';
  
  // Calculate budget suggestion based on platforms
  let dailyBudget = 50;
  if (platform_mix.includes('Google Ads')) dailyBudget += 30;
  if (platform_mix.includes('Facebook')) dailyBudget += 20;
  if (platform_mix.includes('Instagram')) dailyBudget += 20;
  if (platform_mix.includes('TikTok')) dailyBudget += 25;
  
  const budget_suggestion = `$${dailyBudget}/day (Total: $${dailyBudget * 30}/month)`;
  
  // Determine duration
  const duration_days = 30;
  
  // Determine formats based on platforms
  const formats: string[] = [];
  if (platform_mix.includes('Facebook') || platform_mix.includes('Instagram')) {
    formats.push('Single Image', 'Carousel', 'Video');
  }
  if (platform_mix.includes('TikTok')) {
    formats.push('Vertical Video', 'In-Feed Ad');
  }
  if (platform_mix.includes('Google Ads')) {
    formats.push('Search Ad', 'Display Ad', 'Shopping Ad');
  }
  
  return {
    campaign_name,
    objective: finalObjective,
    budget_suggestion,
    duration_days,
    platform_mix,
    formats: [...new Set(formats)]
  };
}
