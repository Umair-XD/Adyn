import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongoose';
import Campaign from '@/models/Campaign';
import MetaAccount from '@/models/MetaAccount';
import { MetaCampaignOrchestrator } from '@/lib/meta-campaign-orchestrator';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { campaignId, metaAccountId } = await req.json();

    if (!campaignId || !metaAccountId) {
      return NextResponse.json({
        error: 'Missing required field: campaignId or metaAccountId'
      }, { status: 400 });
    }

    await connectDB();

    // Get the campaign with intelligent data
    const campaign = await Campaign.findById(campaignId);
    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    const intelligentData = campaign.generationResult?.intelligent_campaign_data;
    if (!intelligentData) {
      return NextResponse.json({
        error: 'Campaign does not have intelligent campaign data. Please create a new campaign with the AI flow.'
      }, { status: 400 });
    }

    // Resolve Meta account from connected integration
    const metaAccount = await MetaAccount.findOne({
      userId: session.user.id,
      accountId: metaAccountId
    });

    if (!metaAccount || !metaAccount.accessToken) {
      return NextResponse.json({
        error: 'Meta account not found or not connected. Please connect your Meta account first.'
      }, { status: 400 });
    }

    // Initialize Meta Campaign Orchestrator with real access token
    const orchestrator = new MetaCampaignOrchestrator(metaAccount.accessToken);

    // Execute campaign creation using the EXISTING intelligent strategy
    // This ensures what the user saw on the dashboard is EXACTLY what gets created
    // Bypasses the redundant MCP call since we already have the strategy
    const result = await orchestrator.executeExistingStrategy(intelligentData, metaAccountId);

    if (result.success) {
      // Update campaign with Meta IDs
      await Campaign.findByIdAndUpdate(campaignId, {
        $set: {
          'generationResult.meta_campaign_data': {
            campaign_id: result.campaign_id,
            adset_ids: result.adset_ids,
            creative_ids: result.creative_ids,
            ad_ids: result.ad_ids,
            created_at: new Date(),
            account_id: metaAccountId
          }
        }
      });

      return NextResponse.json({
        success: true,
        meta_campaign_id: result.campaign_id,
        adset_ids: result.adset_ids,
        creative_ids: result.creative_ids,
        ad_ids: result.ad_ids,
        execution_log: result.execution_log,
        ai_usage_summary: result.ai_usage_summary,
        support_alerts: result.support_alerts
      });
    } else {
      return NextResponse.json({
        success: false,
        error: 'Meta campaign creation failed',
        execution_log: result.execution_log,
        support_alerts: result.support_alerts
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Meta campaign creation error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to create Meta campaign',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

