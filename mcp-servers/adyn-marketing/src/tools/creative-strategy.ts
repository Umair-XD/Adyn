/**
 * STEP 5 — CREATIVE STRATEGY (MCP)
 * 
 * Creates 3-6 creative variants per Ad Set with different angles using AI Gateway
 * Pain-focused, Benefit-focused, Social proof, Offer-driven
 */

import { generateObject } from 'ai';
import { z } from 'zod';
import { openai } from '../lib/ai-config.js';

export interface AdSetWithPlacements {
  adset_id: string;
  name: string;
  type: string;
  placements: {
    facebook_positions: string[];
    instagram_positions: string[];
    audience_network_positions: string[];
    messenger_positions: string[];
  };
}

export interface BaseCreativeAsset {
  type: 'image' | 'video' | 'carousel';
  asset_url: string;
  primary_texts: string[];
  headlines: string[];
  descriptions?: string[];
  cta: string;
  landing_page_url: string;
  creative_family?: string;
}

export interface BrandGuidelines {
  tone: 'professional' | 'casual' | 'urgent' | 'friendly' | 'authoritative';
  voice: string;
  key_messages: string[];
  avoid_words?: string[];
  hashtags?: string[];
  brand_colors?: string[];
  logo_usage?: string;
}

export interface CreativeVariant {
  adset_id: string;
  creative_id: string;
  name: string;
  creative_family: string;
  hypothesis: string;
  angle: 'pain' | 'benefit' | 'social_proof' | 'offer' | 'urgency' | 'curiosity';
  expected_metric: 'CTR' | 'CVR' | 'ENGAGEMENT';
  payload: {
    name: string;
    object_story_spec: {
      page_id: string;
      link_data: {
        link: string;
        message: string;
        name: string;
        description?: string;
        call_to_action: {
          type: string;
          value?: {
            link?: string;
            link_caption?: string;
          };
        };
        picture?: string;
        video_id?: string;
        child_attachments?: Array<{
          link: string;
          name: string;
          description?: string;
          picture?: string;
        }>;
      };
    };
    instagram_actor_id?: string;
  };
  tracking_parameters: {
    utm_source: string;
    utm_medium: string;
    utm_campaign: string;
    utm_content: string;
  };
  platform_specific: {
    instagram_hashtags?: string[];
    facebook_mentions?: string[];
  };
}

export interface CreativeStrategyResult {
  adset_id: string;
  creative_variants: CreativeVariant[];
  testing_framework: {
    primary_test: string;
    variables: string[];
    success_criteria: string;
    duration_days: number;
  };
  performance_predictions: {
    [creative_id: string]: {
      expected_ctr: number;
      expected_cvr: number;
      confidence_level: 'HIGH' | 'MEDIUM' | 'LOW';
    };
  };
  ai_insights: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

const creativeSchema = z.object({
  creative_variants: z.array(z.object({
    name: z.string(),
    angle: z.enum(['pain', 'benefit', 'social_proof', 'offer', 'urgency', 'curiosity']),
    hypothesis: z.string(),
    primary_text: z.string(),
    headline: z.string(),
    description: z.string().optional(),
    cta_type: z.string(),
    expected_metric: z.enum(['CTR', 'CVR', 'ENGAGEMENT']),
    instagram_hashtags: z.array(z.string()).optional(),
    performance_prediction: z.object({
      expected_ctr: z.number(),
      expected_cvr: z.number(),
      confidence_level: z.enum(['HIGH', 'MEDIUM', 'LOW'])
    })
  })),
  testing_framework: z.object({
    primary_test: z.string(),
    variables: z.array(z.string()),
    success_criteria: z.string(),
    duration_days: z.number()
  }),
  ai_insights: z.string()
});

export async function creativeStrategy(input: {
  adsets: AdSetWithPlacements[];
  creative_assets: BaseCreativeAsset[];
  brand_guidelines?: BrandGuidelines;
}): Promise<{ creative_strategies: CreativeStrategyResult[] }> {
  
  const { adsets, creative_assets, brand_guidelines } = input;
  const creativeStrategies: CreativeStrategyResult[] = [];

  for (const adset of adsets) {
    const strategy = await createCreativeStrategyForAdSet(adset, creative_assets, brand_guidelines);
    creativeStrategies.push(strategy);
  }

  return { creative_strategies: creativeStrategies };
}

async function createCreativeStrategyForAdSet(
  adset: AdSetWithPlacements,
  assets: BaseCreativeAsset[],
  brandGuidelines?: BrandGuidelines
): Promise<CreativeStrategyResult> {
  
  const targetCreativeCount = getTargetCreativeCount(adset.type);
  
  const prompt = `You are a Meta Ads creative strategist. Create ${targetCreativeCount} high-performing creative variants for this ad set.

ADSET CONTEXT:
- Name: ${adset.name}
- Type: ${adset.type}
- Placements: ${JSON.stringify(adset.placements)}

CREATIVE ASSETS AVAILABLE:
${assets.map((asset, i) => `
Asset ${i + 1}:
- Type: ${asset.type}
- Current Headlines: ${asset.headlines.join(', ')}
- Current Primary Texts: ${asset.primary_texts.join(', ')}
- CTA: ${asset.cta}
- Landing Page: ${asset.landing_page_url}
`).join('')}

BRAND GUIDELINES:
- Tone: ${brandGuidelines?.tone || 'professional'}
- Voice: ${brandGuidelines?.voice || 'friendly and approachable'}
- Key Messages: ${brandGuidelines?.key_messages?.join(', ') || 'N/A'}
- Avoid Words: ${brandGuidelines?.avoid_words?.join(', ') || 'N/A'}

CREATIVE STRATEGY REQUIREMENTS:
1. Create ${targetCreativeCount} distinct creative variants with different angles:
   - ${adset.type === 'retargeting' ? 'Focus on offer, urgency, social_proof' : 'Mix pain, benefit, curiosity, social_proof'}
2. Each creative must have a clear hypothesis for why it will work
3. Optimize copy for the specific audience type (${adset.type})
4. Consider placement requirements (vertical for Stories/Reels, square for Feed)
5. Include relevant hashtags for Instagram placements
6. Predict performance metrics based on angle and audience type

AUDIENCE-SPECIFIC GUIDELINES:
${getAudienceSpecificGuidelines(adset.type)}

Create compelling, scroll-stopping creatives that match the audience intent and placement requirements.`;

  try {
    const { object, usage } = await generateObject({
      model: openai('gpt-5'),
      schema: creativeSchema,
      prompt,
      system: 'You are an expert Meta Ads creative strategist with deep knowledge of audience psychology, platform best practices, and performance optimization. Create data-driven creative strategies.',
      temperature: 0.7
    });

    // Convert AI output to our format
    const creativeVariants: CreativeVariant[] = object.creative_variants.map((variant, index) => ({
      adset_id: adset.adset_id,
      creative_id: `${adset.adset_id}_creative_${index + 1}`,
      name: variant.name,
      creative_family: assets[0]?.creative_family || 'primary',
      hypothesis: variant.hypothesis,
      angle: variant.angle,
      expected_metric: variant.expected_metric,
      payload: {
        name: variant.name,
        object_story_spec: {
          page_id: '{{PAGE_ID}}',
          link_data: {
            link: addTrackingParameters(assets[0]?.landing_page_url || '', adset.adset_id, `creative_${index + 1}`),
            message: variant.primary_text,
            name: variant.headline,
            description: variant.description,
            call_to_action: {
              type: mapCTAType(variant.cta_type),
              value: {
                link: addTrackingParameters(assets[0]?.landing_page_url || '', adset.adset_id, `creative_${index + 1}`),
                link_caption: variant.cta_type
              }
            }
          }
        }
      },
      tracking_parameters: {
        utm_source: 'facebook',
        utm_medium: 'social',
        utm_campaign: adset.name.toLowerCase().replace(/\s+/g, '_'),
        utm_content: `${variant.angle}_${index + 1}`
      },
      platform_specific: {
        instagram_hashtags: variant.instagram_hashtags || []
      }
    }));

    // Add media based on asset type
    creativeVariants.forEach((variant, index) => {
      const asset = assets[index % assets.length];
      if (asset.type === 'image') {
        variant.payload.object_story_spec.link_data.picture = asset.asset_url;
      } else if (asset.type === 'video') {
        variant.payload.object_story_spec.link_data.video_id = asset.asset_url;
      }
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const performancePredictions: { [creative_id: string]: any } = {};
    object.creative_variants.forEach((variant, index) => {
      performancePredictions[`${adset.adset_id}_creative_${index + 1}`] = variant.performance_prediction;
    });

    return {
      adset_id: adset.adset_id,
      creative_variants: creativeVariants,
      testing_framework: object.testing_framework,
      performance_predictions: performancePredictions,
      ai_insights: object.ai_insights,
      usage: usage ? {
        promptTokens: usage.inputTokens || 0,
        completionTokens: usage.outputTokens || 0,
        totalTokens: usage.totalTokens || 0
      } : undefined
    };

  } catch (error) {
    console.error('AI creative generation failed, using fallback:', error);
    return createFallbackCreativeStrategy(adset, assets);
  }
}

function getTargetCreativeCount(adsetType: string): number {
  const counts: Record<string, number> = {
    'retargeting': 3, // Fewer creatives, higher intent
    'lookalike': 4,   // Balanced testing
    'interest': 4,    // Test different angles
    'broad': 5        // More variety for algorithm
  };
  
  return counts[adsetType] || 4;
}

function getAudienceSpecificGuidelines(adsetType: string): string {
  const guidelines: Record<string, string> = {
    'retargeting': 'High-intent audience that knows your brand. Focus on offers, urgency, and social proof. Use direct language and clear value propositions.',
    'lookalike': 'Similar to your customers but may not know your brand. Lead with benefits and social proof. Build trust and credibility.',
    'interest': 'Targeted by interests but cold audience. Hook with pain points or curiosity. Educate about your solution.',
    'broad': 'Cold, diverse audience. Use broad appeal, strong hooks, and clear value propositions. Test multiple angles.'
  };
  
  return guidelines[adsetType] || 'General audience guidelines apply.';
}

function createFallbackCreativeStrategy(
  adset: AdSetWithPlacements,
  assets: BaseCreativeAsset[]
): CreativeStrategyResult {
  const targetCount = getTargetCreativeCount(adset.type);
  const angles = selectCreativeAngles(adset.type, targetCount);
  
  const creativeVariants: CreativeVariant[] = [];
  
  for (let i = 0; i < targetCount && i < assets.length; i++) {
    const asset = assets[i];
    const angle = angles[i % angles.length];
    
    creativeVariants.push({
      adset_id: adset.adset_id,
      creative_id: `${adset.adset_id}_creative_${i + 1}`,
      name: `${adset.name} - ${angle.charAt(0).toUpperCase() + angle.slice(1)} ${i + 1}`,
      creative_family: asset.creative_family || 'primary',
      hypothesis: `${angle} angle will resonate with ${adset.type} audience`,
      angle: angle as CreativeVariant['angle'],
      expected_metric: getExpectedMetric(angle),
      payload: {
        name: `${adset.name} - Creative ${i + 1}`,
        object_story_spec: {
          page_id: '{{PAGE_ID}}',
          link_data: {
            link: addTrackingParameters(asset.landing_page_url, adset.adset_id, `creative_${i + 1}`),
            message: asset.primary_texts[0] || 'Discover our solution',
            name: asset.headlines[0] || 'Learn More',
            description: asset.descriptions?.[0],
            call_to_action: {
              type: mapCTAType(asset.cta),
              value: {
                link: addTrackingParameters(asset.landing_page_url, adset.adset_id, `creative_${i + 1}`),
                link_caption: asset.cta
              }
            }
          }
        }
      },
      tracking_parameters: {
        utm_source: 'facebook',
        utm_medium: 'social',
        utm_campaign: adset.name.toLowerCase().replace(/\s+/g, '_'),
        utm_content: `${angle}_${i + 1}`
      },
      platform_specific: {}
    });
  }

  return {
    adset_id: adset.adset_id,
    creative_variants: creativeVariants,
    testing_framework: {
      primary_test: 'Creative Angle Testing',
      variables: ['message_angle', 'visual_style', 'cta_type'],
      success_criteria: 'CTR > 1.5% AND CVR > 2%',
      duration_days: 7
    },
    performance_predictions: {},
    ai_insights: 'Fallback strategy due to AI generation failure'
  };
}

function selectCreativeAngles(adsetType: string, count: number): string[] {
  // Prioritize angles based on audience type
  if (adsetType === 'retargeting') {
    return ['offer', 'urgency', 'social_proof'].slice(0, count);
  } else if (adsetType === 'lookalike') {
    return ['benefit', 'social_proof', 'pain', 'offer'].slice(0, count);
  } else if (adsetType === 'interest') {
    return ['pain', 'benefit', 'curiosity', 'social_proof'].slice(0, count);
  } else { // broad
    return ['benefit', 'pain', 'social_proof', 'curiosity', 'offer'].slice(0, count);
  }
}

function getExpectedMetric(angle: string): 'CTR' | 'CVR' | 'ENGAGEMENT' {
  const metrics: Record<string, 'CTR' | 'CVR' | 'ENGAGEMENT'> = {
    'pain': 'CTR',
    'benefit': 'CVR',
    'social_proof': 'CVR',
    'offer': 'CVR',
    'urgency': 'CTR',
    'curiosity': 'ENGAGEMENT'
  };
  
  return metrics[angle] || 'CTR';
}

function mapCTAType(cta: string): string {
  const ctaMapping: Record<string, string> = {
    'Learn More': 'LEARN_MORE',
    'Shop Now': 'SHOP_NOW',
    'Sign Up': 'SIGN_UP',
    'Download': 'DOWNLOAD',
    'Get Quote': 'GET_QUOTE',
    'Contact Us': 'CONTACT_US',
    'Book Now': 'BOOK_TRAVEL',
    'Apply Now': 'APPLY_NOW'
  };
  
  return ctaMapping[cta] || 'LEARN_MORE';
}

function addTrackingParameters(url: string, adsetId: string, creativeId: string): string {
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}utm_source=facebook&utm_medium=social&utm_campaign=${adsetId}&utm_content=${creativeId}`;
}