import { NextRequest, NextResponse } from 'next/server';
import { MetaCampaignOrchestrator, CampaignRequest } from '@/lib/meta-campaign-orchestrator';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.access_token || !body.ad_account_id || !body.campaign_name) {
      return NextResponse.json(
        { error: 'Missing required fields: access_token, ad_account_id, campaign_name' },
        { status: 400 }
      );
    }

    // Create orchestrator instance
    const orchestrator = new MetaCampaignOrchestrator(body.access_token);
    
    // Prepare campaign request
    const campaignRequest: CampaignRequest = {
      ad_account_id: body.ad_account_id,
      business_goal: body.business_goal || 'TRAFFIC',
      campaign_name: body.campaign_name,
      budget_total: body.budget_total,
      budget_per_adset: body.budget_per_adset,
      product_url: body.product_url, // ESSENTIAL: Product URL for intelligent analysis
      creative_assets: body.creative_assets || [
        {
          type: 'image',
          asset_url: 'https://example.com/image.jpg',
          primary_texts: ['Discover amazing products'],
          headlines: ['Shop Now'],
          descriptions: ['Limited time offer'],
          cta: 'Learn More',
          landing_page_url: body.product_url || 'https://example.com',
          creative_family: 'primary'
        }
      ],
      desired_geos: body.desired_geos || ['US'],
      age_range: body.age_range || { min: 18, max: 65 },
      genders: body.genders,
      constraints: body.constraints,
      flags: body.flags || { test_mode: true }
    };

    // Execute MCP-driven campaign creation
    const result = await orchestrator.createCampaign(campaignRequest);

    return NextResponse.json({
      success: result.success,
      campaign_id: result.campaign_id,
      adset_ids: result.adset_ids,
      creative_ids: result.creative_ids,
      ad_ids: result.ad_ids,
      execution_summary: {
        total_steps: result.execution_log.length,
        successful_steps: result.execution_log.filter(step => step.success).length,
        failed_steps: result.execution_log.filter(step => !step.success).length
      },
      mcp_insights: {
        data_quality: (result.mcp_audit as { data_level?: string })?.data_level,
        strategy_approach: (result.mcp_strategy as { approach?: string })?.approach,
        recommended_adsets: (result.mcp_strategy as { adset_strategies?: unknown[] })?.adset_strategies?.length || 0
      },
      mcp_audit: result.mcp_audit, // Include full audit data
      mcp_strategy: result.mcp_strategy, // Include full strategy data
      api_payloads_used: result.api_payloads_used, // NEW: Include structured campaign data
      product_insights: result.product_insights, // ESSENTIAL: Product analysis results
      ai_usage_summary: result.ai_usage_summary, // NEW: AI usage and costs
      support_alerts: result.support_alerts,
      execution_log: result.execution_log
    });

  } catch (error) {
    console.error('Campaign creation error:', error);
    
    return NextResponse.json(
      { 
        error: 'Campaign creation failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        success: false
      },
      { status: 500 }
    );
  }
}