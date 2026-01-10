import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongoose';
import Project from '@/models/Project';
import Source from '@/models/Source';
import Campaign from '@/models/Campaign';
import GenerationLog from '@/models/GenerationLog';
import { mcpManager } from '@/lib/mcp-client';

// Configure API route for long-running operations
export const maxDuration = 300; // 5 minutes timeout
export const dynamic = 'force-dynamic';

/**
 * Prunes massive Meta account data to essentials for campaign audit
 * Strips line numbers, permissions, and other bloated metadata
 */
function pruneAccountMetaData(data: any) {
  if (!data) return {};

  const pruned: any = {};

  // 1. Keep essential account info
  if (data.accountData) {
    pruned.accountData = {
      accountId: data.accountData.accountId,
      name: data.accountData.name,
      currency: data.accountData.currency,
      timezone_name: data.accountData.timezone_name,
      amount_spent: data.accountData.amount_spent
    };
  }

  // 2. Keep essential insights (last 90 days)
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

  // 3. Keep essential pixels
  if (data.pixels) {
    pruned.pixels = Array.isArray(data.pixels)
      ? data.pixels.map((p: any) => ({
        id: p.id,
        name: p.name,
        events: p.events
      }))
      : [];
  }

  // 4. Keep audiences
  if (data.custom_audiences) pruned.custom_audiences = data.custom_audiences;
  if (data.lookalike_audiences) pruned.lookalike_audiences = data.lookalike_audiences;

  return pruned;
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { projectId, url, objective, budget, geoTargets } = await req.json();

    if (!projectId || !url) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    await connectDB();

    // Verify project ownership
    const project = await Project.findOne({
      _id: projectId,
      userId: session.user.id
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Create source record
    const source = await Source.create({
      projectId,
      type: 'url',
      inputUrl: url,
      status: 'processing'
    });

    try {
      console.log('🚀 Using Intelligent Campaign Constructor...');

      // Map objective to campaign purpose
      const campaignPurposeMap: Record<string, 'conversion' | 'engagement' | 'traffic' | 'awareness'> = {
        'Conversions': 'conversion',
        'Traffic': 'traffic',
        'Awareness': 'awareness',
        'Engagement': 'engagement'
      };

      const campaignPurpose = campaignPurposeMap[objective] || 'traffic';

      // Get cached Meta data for enhanced intelligence
      let cachedMetaData = {};
      let metaAccountId = 'NOT_CONNECTED';

      try {
        if (session?.user?.id) {
          // First, get user's connected Meta accounts
          const MetaAccount = (await import('@/models/MetaAccount')).default;
          const connectedAccount = await MetaAccount.findOne({
            userId: session.user.id,
            isActive: true
          }).select('accountId');

          if (connectedAccount) {
            metaAccountId = connectedAccount.accountId;
            console.log(`🔗 Found connected Meta account: ${metaAccountId}`);

            // Get cached data for this account
            const { getCachedMetaData } = await import('@/lib/meta-data-sync');
            const result = await getCachedMetaData(session.user.id, metaAccountId);

            const rawSize = JSON.stringify(result.data).length;
            cachedMetaData = pruneAccountMetaData(result.data);
            const prunedSize = JSON.stringify(cachedMetaData).length;

            console.log(`✅ Loaded cached Meta data. Pruned: ${rawSize} chars -> ${prunedSize} chars (${Math.round((1 - prunedSize / rawSize) * 100)}% reduction)`);
            console.log(`📊 Cached data essentials: ${Object.keys(cachedMetaData).join(', ')}`);
          } else {
            console.log('⚠️ No connected Meta accounts found');
          }
        }
      } catch (error) {
        console.log('⚠️ No cached Meta data available, proceeding without account intelligence:', error);
      }

      // Use the enhanced intelligent campaign constructor with cached data
      const constructorInput = {
        product_url: url,
        campaign_purpose: campaignPurpose,
        budget: budget || 1000,
        geo_targets: geoTargets || ['US'],
        raw_meta_account_data: cachedMetaData, // Pass cached data instead of empty object
        ad_account_id: metaAccountId // Use real account ID or 'NOT_CONNECTED'
      };

      console.log('⏳ Calling ENHANCED intelligent campaign constructor (ONLY) with cached Meta data...');
      console.log('🔧 API Route timeout: 5 minutes (300s)');
      console.log('🔧 MCP timeout: Unlimited');
      const startTime = Date.now();

      // Add progress tracking for the API call
      const progressInterval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        console.log(`⏳ API: Campaign generation in progress... ${Math.floor(elapsed / 1000)}s elapsed`);
      }, 30000); // Log every 30 seconds

      let constructorResult;
      let campaignData;
      let endTime = Date.now();

      try {
        // Call the new campaign_builder tool that returns progressive results
        constructorResult = await mcpManager.callTool('adyn', 'campaign_builder', constructorInput) as { content: unknown };

        clearInterval(progressInterval);
        endTime = Date.now();
        console.log(`✅ Campaign Builder completed in ${endTime - startTime}ms`);

        const constructorContent = Array.isArray(constructorResult.content) ? constructorResult.content[0] : constructorResult.content;
        campaignData = JSON.parse((constructorContent as { text?: string })?.text || '{}');
      } catch (error) {
        clearInterval(progressInterval);
        throw error;
      }

      // Extract the intelligent_campaign_data from progressive results
      const intelligentData = campaignData.intelligent_campaign_data || campaignData;

      // Extract campaign structure for dashboard display
      const adynOutput = {
        product_summary: {
          summary: campaignData.steps?.semantic_analysis?.summary || `AI-generated campaign for ${url}`,
          value_proposition: campaignData.steps?.semantic_analysis?.value_proposition || 'Intelligent campaign',
          brand_tone: campaignData.steps?.semantic_analysis?.brand_tone || 'professional',
          category: campaignData.steps?.semantic_analysis?.category || 'ai-generated',
          audience_persona: campaignData.steps?.semantic_analysis?.target_audience || 'Target audience',
          keywords: campaignData.steps?.semantic_analysis?.keywords || [],
          geographic_analysis: {
            origin_country: 'Global',
            primary_markets: geoTargets || ['US'],
            cultural_context: 'AI-optimized targeting',
            local_preferences: [],
            regional_competitors: []
          },
          competitor_analysis: {
            main_competitors: campaignData.steps?.semantic_analysis?.main_competitors || [],
            competitive_advantages: [],
            market_positioning: 'AI-optimized positioning',
            differentiation_strategy: 'Data-driven approach'
          },
          market_size_estimation: {
            total_addressable_market: 'AI-estimated market',
            serviceable_addressable_market: 'Targeted segments',
            target_market_size: 'Optimized reach',
            growth_potential: 'High potential'
          }
        },
        marketing_insights: {
          keywords: campaignData.steps?.semantic_analysis?.keywords || [],
          value_proposition: campaignData.steps?.semantic_analysis?.value_proposition || 'AI Campaign',
          brand_tone: campaignData.steps?.semantic_analysis?.brand_tone || 'professional',
          category: campaignData.steps?.semantic_analysis?.category || 'ai-generated'
        },
        ad_creatives: intelligentData.creative_payloads?.map((creative: { creative: { object_story_spec: { link_data: { name: string; message: string; call_to_action: { type: string }; description: string } } }; adset_ref: string }) => ({
          platform: 'Meta',
          headline: creative.creative.object_story_spec.link_data.name,
          primary_text: creative.creative.object_story_spec.link_data.message,
          cta: creative.creative.object_story_spec.link_data.call_to_action.type,
          creative_description: creative.creative.object_story_spec.link_data.description,
          hashtags: [],
          interest_targeting: {
            primary_interests: [],
            trending_interests: [],
            lookalike_audiences: [],
            demographic_insights: `Ad Set: ${creative.adset_ref}`
          }
        })) || [],
        audience_targeting: {
          age_range: '18-65',
          interest_groups: [],
          behaviors: [],
          detailed_interests: intelligentData.adset_payloads?.map((adset: { name: string; targeting: { interests?: Array<{ name: string }> } }) => ({
            category: adset.name,
            interests: adset.targeting.interests?.map((i: { name: string }) => i.name) || [],
            audience_size_estimate: 'AI-optimized'
          })) || []
        },
        campaign_strategy: {
          campaign_name: intelligentData.campaign_payload?.name || campaignData.summary?.campaign_name || 'AI Campaign',
          objective: intelligentData.campaign_payload?.objective || 'LINK_CLICKS',
          budget_suggestion: `$${budget || 1000} total budget`,
          duration_days: 30,
          platform_mix: ['Meta'],
          formats: ['Single Image', 'Carousel', 'Video']
        },
        // Store the intelligent constructor data PLUS progressive results
        intelligent_campaign_data: intelligentData
      };

      // Save campaign with intelligent constructor data
      const campaignName = intelligentData.campaign_payload?.name || campaignData.summary?.campaign_name || `AI Campaign - ${new Date().toISOString().split('T')[0]}`;
      const campaign = await Campaign.create({
        projectId,
        sourceId: source._id,
        name: campaignName,
        objective: intelligentData.campaign_payload?.objective || objective || 'LINK_CLICKS',
        platforms: ['Meta'],
        generationResult: adynOutput
      });

      // Update source status
      await Source.findByIdAndUpdate(source._id, { status: 'completed' });

      // Track AI usage from campaign builder
      const moduleUsages = [];
      if (campaignData.usage || intelligentData.usage) {
        const usage = campaignData.usage || intelligentData.usage;
        const cost = (usage.promptTokens / 1_000_000 * 2.50) + (usage.completionTokens / 1_000_000 * 10.00);
        moduleUsages.push({
          module: 'campaign_builder',
          inputTokens: usage.promptTokens,
          outputTokens: usage.completionTokens,
          totalTokens: usage.totalTokens,
          reasoningTokens: usage.reasoningTokens || 0,
          cachedInputTokens: usage.cachedInputTokens || 0,
          cost,
          callCount: 1
        });
      }

      const totalCost = moduleUsages.reduce((sum, m) => sum + m.cost, 0);
      const totalTokens = moduleUsages.reduce((sum, m) => sum + m.totalTokens, 0);

      // Create generation log
      await GenerationLog.create({
        userId: session.user.id,
        campaignId: campaign._id,
        agent: 'campaign_builder',
        requestPayload: constructorInput,
        responsePayload: campaignData,
        tokensUsed: {
          prompt: (campaignData.usage || intelligentData.usage)?.promptTokens || 0,
          completion: (campaignData.usage || intelligentData.usage)?.completionTokens || 0,
          total: totalTokens
        },
        moduleUsage: moduleUsages,
        estimatedCost: totalCost
      });

      return NextResponse.json({
        success: true,
        campaignId: campaign._id.toString(),
        data: adynOutput,
        generationResult: campaignData, // Return FULL progressive results
        intelligent_data: intelligentData,
        processing_time: endTime - startTime,
        enhanced_mode: true,
        note: 'Campaign built with step-by-step progressive results'
      });

    } catch (error) {
      console.error('❌ Enhanced campaign constructor failed:', error);

      // Update source status to failed
      await Source.findByIdAndUpdate(source._id, {
        status: 'failed',
        error: error instanceof Error ? error.message : 'Campaign generation failed'
      });

      throw error;
    }

  } catch (error) {
    console.error('Campaign generation error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Campaign generation failed';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
