import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongoose';
import CampaignJob from '@/models/CampaignJob';
import Source from '@/models/Source';
import Campaign from '@/models/Campaign';
import GenerationLog from '@/models/GenerationLog';
import { campaignBuilder } from '@/lib/campaign-tools/campaign-builder';

// Allow longer execution for background worker
export const maxDuration = 300; // 5 minutes
export const dynamic = 'force-dynamic';

/**
 * Prunes massive Meta account data to essentials for campaign audit
 */
function pruneAccountMetaData(data: any) {
  if (!data) return {};

  const pruned: any = {};

  if (data.accountData) {
    pruned.accountData = {
      accountId: data.accountData.accountId,
      name: data.accountData.name,
      currency: data.accountData.currency,
      timezone_name: data.accountData.timezone_name,
      amount_spent: data.accountData.amount_spent
    };
  }

  if (data.insights) {
    pruned.insights = Array.isArray(data.insights)
      ? data.insights.map((i: any) => ({
        spend: i.spend,
        purchases: i.purchases,
        leads: i.leads,
        clicks: i.clicks,
        impressions: i.impressions,
        ctr: i.ctr,
        cpm: i.cpm,
        date_start: i.date_start,
        date_stop: i.date_stop
      }))
      : [];
  }

  if (data.pixels) {
    pruned.pixels = Array.isArray(data.pixels)
      ? data.pixels.map((p: any) => ({
        id: p.id,
        name: p.name,
        events: p.events
      }))
      : [];
  }

  if (data.custom_audiences) pruned.custom_audiences = data.custom_audiences;
  if (data.lookalike_audiences) pruned.lookalike_audiences = data.lookalike_audiences;

  return pruned;
}

export async function POST(req: NextRequest) {
  try {
    const { jobId, userId } = await req.json();

    if (!jobId || !userId) {
      return NextResponse.json({ error: 'Missing jobId or userId' }, { status: 400 });
    }

    await connectDB();

    const job = await CampaignJob.findOne({ _id: jobId, userId });

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    job.status = 'processing';
    job.progress = 10;
    job.currentStep = 'Initializing campaign generation';
    await job.save();

    try {
      console.log(`🚀 Worker processing job: ${jobId}`);

      const { url, objective, budget, geoTargets } = job.input;

      const campaignPurposeMap: Record<string, 'conversion' | 'engagement' | 'traffic' | 'awareness'> = {
        'Conversions': 'conversion',
        'Traffic': 'traffic',
        'Awareness': 'awareness',
        'Engagement': 'engagement'
      };

      const campaignPurpose = campaignPurposeMap[objective] || 'traffic';

      job.progress = 20;
      job.currentStep = 'Preparing campaign parameters';
      await job.save();

      /*
      // Fetch the actual Meta access token for the user
      const MetaAccount = (await import('@/models/MetaAccount')).default;
      const metaAccount = await MetaAccount.findOne({ userId, isActive: true });

      const metaAccessToken = metaAccount?.accessToken;
      const metaAccountId = metaAccount?.accountId || 'act_PLACEHOLDER';

      if (!metaAccessToken) {
        console.warn(`⚠️ No active Meta access token found for user ${userId}. Falling back to limited/mock targeting.`);
      }
      */
      const metaAccessToken = undefined;
      const metaAccountId = 'act_PLACEHOLDER';

      job.progress = 30;
      job.currentStep = 'Analyzing product and generating campaign strategy';
      await job.save();

      const constructorInput = {
        product_url: url,
        campaign_purpose: campaignPurpose,
        budget: budget || 1000,
        geo_targets: geoTargets || ['US'],
        ad_account_id: metaAccountId,
        meta_access_token: metaAccessToken
      };

      console.log('⏳ Calling campaign builder (DIRECT - NO MCP)...');
      const startTime = Date.now();

      const progressInterval = setInterval(async () => {
        const elapsed = Date.now() - startTime;
        const progressPercent = Math.min(30 + Math.floor(elapsed / 2000), 85);

        try {
          await CampaignJob.findByIdAndUpdate(jobId, {
            progress: progressPercent,
            currentStep: `AI processing... ${Math.floor(elapsed / 1000)}s elapsed`
          });
        } catch (err) {
          console.error('Failed to update progress:', err);
        }
      }, 5000);

      let campaignData;

      try {
        campaignData = await campaignBuilder(constructorInput);

        clearInterval(progressInterval);
        const endTime = Date.now();
        console.log(`✅ Campaign Builder completed in ${endTime - startTime}ms`);
      } catch (error) {
        clearInterval(progressInterval);
        throw error;
      }

      job.progress = 90;
      job.currentStep = 'Saving campaign data';
      await job.save();

      // Check if generation failed
      if ((campaignData as any).status === 'failed') {
        throw new Error((campaignData as any).error || 'Campaign generation failed');
      }

      const intelligentData = (campaignData as any).intelligent_campaign_data || (campaignData as any).final_payload || campaignData;
      const semanticData = campaignData.steps?.semantic_analysis || {};
      const strategyData = campaignData.steps?.strategy || {};

      const adynOutput = {
        product_summary: {
          summary: semanticData.summary || `AI-generated campaign for ${url}`,
          value_proposition: semanticData.value_proposition || 'Intelligent campaign',
          unique_selling_point: semanticData.unique_selling_point || '',
          brand_tone: semanticData.brand_tone || 'professional',
          category: semanticData.category || 'ai-generated',
          audience_persona: semanticData.audience_persona || 'Target audience',
          keywords: semanticData.keywords || [],
          geographic_analysis: semanticData.geographic_analysis || {
            origin_country: 'Global',
            primary_markets: geoTargets || ['US'],
            cultural_context: 'AI-optimized targeting',
            local_preferences: [],
            regional_competitors: []
          },
          competitor_analysis: semanticData.competitor_analysis || {
            main_competitors: [],
            competitive_advantages: [],
            market_positioning: 'AI-optimized positioning',
            differentiation_strategy: semanticData.competitor_analysis?.differentiation_strategy || 'Data-driven approach',
            gap_analysis: semanticData.competitor_analysis?.gap_analysis,
            win_strategy: semanticData.competitor_analysis?.win_strategy
          },
          market_size_estimation: semanticData.market_size_estimation || {
            total_addressable_market: 'AI-estimated market',
            serviceable_addressable_market: 'Targeted segments',
            target_market_size: 'Optimized reach',
            growth_potential: 'High potential'
          }
        },
        marketing_insights: {
          keywords: semanticData.keywords || [],
          value_proposition: semanticData.value_proposition || 'AI Campaign',
          brand_tone: semanticData.brand_tone || 'professional',
          category: semanticData.category || 'ai-generated'
        },
        ad_creatives: intelligentData.creative_payloads?.map((creative: any) => ({
          platform: 'Meta',
          headline: creative.creative?.object_story_spec?.link_data?.name || creative.payload?.object_story_spec?.link_data?.name || 'Headline',
          primary_text: creative.creative?.object_story_spec?.link_data?.message || creative.payload?.object_story_spec?.link_data?.message || 'Primary text',
          cta: creative.creative?.object_story_spec?.link_data?.call_to_action?.type || creative.payload?.object_story_spec?.link_data?.call_to_action?.type || 'LEARN_MORE',
          creative_description: creative.creative?.object_story_spec?.link_data?.description || creative.payload?.object_story_spec?.link_data?.description || 'Description',
          hashtags: [],
          interest_targeting: {
            primary_interests: [],
            trending_interests: [],
            lookalike_audiences: [],
            demographic_insights: `Ad Set: ${creative.adset_ref || 'N/A'}`
          }
        })) || [],
        audience_targeting: {
          age_range: intelligentData.adset_payloads?.[0]?.targeting?.age_min && intelligentData.adset_payloads?.[0]?.targeting?.age_max
            ? `${intelligentData.adset_payloads[0].targeting.age_min}-${intelligentData.adset_payloads[0].targeting.age_max}`
            : '18-65',
          interest_groups: [],
          behaviors: [],
          detailed_interests: intelligentData.adset_payloads?.map((adset: any) => ({
            category: adset.name || adset.payload?.name || 'Ad Set',
            interests: adset.targeting?.interests?.map((i: any) => i.name) || adset.payload?.targeting?.interests?.map((i: any) => i.name) || [],
            audience_size_estimate: 'AI-optimized'
          })) || []
        },
        campaign_strategy: {
          campaign_name: intelligentData.campaign_payload?.payload?.name || intelligentData.campaign_payload?.name || campaignData.summary?.campaign_name || 'AI Campaign',
          objective: intelligentData.campaign_payload?.payload?.objective || intelligentData.campaign_payload?.objective || 'LINK_CLICKS',
          budget_suggestion: `${budget || 1000} total budget`,
          duration_days: 30,
          platform_mix: ['Meta'],
          formats: ['Single Image', 'Carousel', 'Video']
        },
        intelligent_campaign_data: {
          ...intelligentData,
          ai_reasoning: strategyData.reasoning || `Multi-step AI campaign generation using ${campaignData.steps ? Object.keys(campaignData.steps).length : 0} analysis modules`,
          assumptions: intelligentData.assumptions || campaignData.warnings || [],
          risks: intelligentData.risk_flags?.map((r: any) => r.message) || campaignData.errors || [],
          product_fingerprint: `${url.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}`
        }
      };

      const campaignName = intelligentData.campaign_payload?.payload?.name || intelligentData.campaign_payload?.name || campaignData.summary?.campaign_name || `AI Campaign - ${new Date().toISOString().split('T')[0]}`;
      const campaign = await Campaign.create({
        projectId: job.projectId,
        sourceId: job.sourceId,
        name: campaignName,
        objective: intelligentData.campaign_payload?.payload?.objective || intelligentData.campaign_payload?.objective || objective || 'LINK_CLICKS',
        platforms: ['Meta'],
        generationResult: adynOutput
      });

      await Source.findByIdAndUpdate(job.sourceId, { status: 'completed' });

      const moduleUsages = [];

      // Extract usage from steps (semantic_analysis and creatives have usage info)
      let totalPromptTokens = 0;
      let totalCompletionTokens = 0;
      let totalTokensSum = 0;

      if (campaignData.steps?.semantic_analysis?.usage_tokens) {
        const usage = campaignData.steps.semantic_analysis.usage_tokens;
        totalPromptTokens += usage.promptTokens || 0;
        totalCompletionTokens += usage.completionTokens || 0;
        totalTokensSum += usage.totalTokens || 0;
      }

      if (campaignData.steps?.creatives?.usage_summary) {
        campaignData.steps.creatives.usage_summary.forEach((usage: any) => {
          if (usage) {
            totalPromptTokens += usage.promptTokens || 0;
            totalCompletionTokens += usage.completionTokens || 0;
            totalTokensSum += usage.totalTokens || 0;
          }
        });
      }

      if (totalTokensSum > 0) {
        const cost = (totalPromptTokens / 1_000_000 * 2.50) + (totalCompletionTokens / 1_000_000 * 10.00);
        moduleUsages.push({
          module: 'campaign_builder',
          inputTokens: totalPromptTokens,
          outputTokens: totalCompletionTokens,
          totalTokens: totalTokensSum,
          reasoningTokens: 0,
          cachedInputTokens: 0,
          cost,
          callCount: 1
        });
      }

      const totalCost = moduleUsages.reduce((sum, m) => sum + m.cost, 0);
      const totalTokens = moduleUsages.reduce((sum, m) => sum + m.totalTokens, 0);

      await GenerationLog.create({
        userId,
        campaignId: campaign._id,
        agent: 'campaign_builder',
        requestPayload: constructorInput,
        responsePayload: campaignData,
        tokensUsed: {
          prompt: totalPromptTokens,
          completion: totalCompletionTokens,
          total: totalTokens
        },
        moduleUsage: moduleUsages,
        estimatedCost: totalCost
      });

      job.status = 'completed';
      job.progress = 100;
      job.currentStep = 'Campaign generation completed';
      job.campaignId = campaign._id.toString();
      job.result = {
        campaignId: campaign._id.toString(),
        data: adynOutput,
        generationResult: campaignData,
        intelligent_data: intelligentData
      };
      job.completedAt = new Date();
      await job.save();

      console.log(`✅ Job ${jobId} completed successfully`);

      return NextResponse.json({ success: true, jobId });

    } catch (error) {
      console.error(`❌ Job ${jobId} failed:`, error);

      job.status = 'failed';
      job.error = error instanceof Error ? error.message : 'Campaign generation failed';
      await job.save();

      await Source.findByIdAndUpdate(job.sourceId, {
        status: 'failed',
        error: job.error
      });

      return NextResponse.json({ success: false, error: job.error }, { status: 500 });
    }

  } catch (error) {
    console.error('Worker error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Worker failed' },
      { status: 500 }
    );
  }
}
