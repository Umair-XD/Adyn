import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { syncMetaAccountData } from '@/lib/meta-data-sync';
import connectDB from '@/lib/mongoose';
import MetaAccount from '@/models/MetaAccount';

/**
 * COMPLETE META DATA SYNC ENDPOINT
 * 
 * This endpoint is called during Meta integration to fetch and cache
 * ALL Meta account data for lightning-fast campaign generation.
 */

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { metaAccountId, forceRefresh, timePeriod } = await req.json();

    if (!metaAccountId) {
      return NextResponse.json({
        error: 'Missing required field: metaAccountId'
      }, { status: 400 });
    }

    await connectDB();

    // Get the Meta account from database to get real access token and business info
    const metaAccount = await MetaAccount.findOne({
      userId: session.user.id,
      accountId: metaAccountId,
      isActive: true
    });

    if (!metaAccount) {
      return NextResponse.json({
        error: 'Meta account not found or not connected',
        suggestion: 'Please connect your Meta account first'
      }, { status: 404 });
    }

    // Check if access token is expired
    if (metaAccount.expiresAt && new Date() > metaAccount.expiresAt) {
      return NextResponse.json({
        error: 'Meta access token has expired',
        suggestion: 'Please reconnect your Meta account'
      }, { status: 401 });
    }

    // Validate time period
    const validTimePeriods = ['last_30_days', 'last_90_days', 'last_6_months', 'last_year', 'last_2_years', 'last_5_years', 'all_time'];
    const selectedTimePeriod = timePeriod && validTimePeriods.includes(timePeriod) ? timePeriod : 'last_90_days';

    console.log(`🔄 Starting COMPLETE Meta data sync for user ${session.user.id}, account ${metaAccountId}, time period: ${selectedTimePeriod}`);

    // Start the comprehensive sync with real account data
    await syncMetaAccountData({
      userId: session.user.id,
      metaAccountId,
      businessId: metaAccount.businessId || 'no_business_id',
      accessToken: metaAccount.accessToken,
      forceRefresh: forceRefresh || false,
      timePeriod: selectedTimePeriod
    });

    console.log('🎉 Complete Meta data sync finished successfully!');

    return NextResponse.json({
      success: true,
      message: 'Complete Meta account data synced successfully',
      metaAccountId,
      timePeriod: selectedTimePeriod,
      syncedAt: new Date().toISOString(),
      note: `All Meta data cached for ${selectedTimePeriod} - lightning-fast campaign generation enabled`
    });

  } catch (error) {
    console.error('Meta data sync error:', error);

    return NextResponse.json({
      success: false,
      error: 'Failed to sync Meta account data',
      message: error instanceof Error ? error.message : 'Unknown sync error',
      suggestion: 'Please check your Meta access token and account permissions'
    }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const metaAccountId = searchParams.get('metaAccountId');
    const details = searchParams.get('details') === 'true';

    if (!metaAccountId) {
      return NextResponse.json({
        error: 'Missing metaAccountId parameter'
      }, { status: 400 });
    }

    // Check sync status
    const { getCachedMetaData } = await import('@/lib/meta-data-sync');

    try {
      const { data, isStale, lastUpdated } = await getCachedMetaData(session.user.id, metaAccountId);

      const responseData: {
        success: boolean;
        isCached: boolean;
        isStale: boolean;
        lastUpdated: string;
        syncStatus: string;
        timePeriod: string;
        insightsDateRange: unknown;
        dataStats: {
          campaigns: number;
          adsets: number;
          ads: number;
          insights: number;
          customAudiences: number;
          pixels: number;
        };
        detailedStats?: unknown;
        collections?: unknown;
      } = {
        success: true,
        isCached: true,
        isStale,
        lastUpdated,
        syncStatus: data.syncStatus,
        timePeriod: data.timePeriod,
        insightsDateRange: data.insightsDateRange,
        dataStats: {
          campaigns: (data.campaigns as unknown[])?.length || 0,
          adsets: (data.adsets as unknown[])?.length || 0,
          ads: (data.ads as unknown[])?.length || 0,
          insights: (data.insights as unknown[])?.length || 0,
          customAudiences: (data.customAudiences as unknown[])?.length || 0,
          pixels: (data.pixels as unknown[])?.length || 0
        }
      };

      if (details) {
        // Return summary metrics from insights
        const insights = (data.insights as unknown[]) || [];
        const totalSpend = insights.reduce((sum: number, item: unknown) => {
          const spend = (item as { spend?: string })?.spend;
          return sum + (parseFloat(spend || '0') || 0);
        }, 0);
        const totalImpressions = insights.reduce((sum: number, item: unknown) => {
          const impressions = (item as { impressions?: string })?.impressions;
          return sum + (parseInt(impressions || '0') || 0);
        }, 0);
        const totalClicks = insights.reduce((sum: number, item: unknown) => {
          const clicks = (item as { clicks?: string })?.clicks;
          return sum + (parseInt(clicks || '0') || 0);
        }, 0);

        responseData.detailedStats = {
          totalSpend,
          totalImpressions,
          totalClicks,
          ctr: totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0,
          cpc: totalClicks > 0 ? totalSpend / totalClicks : 0,
          cpm: totalImpressions > 0 ? (totalSpend / totalImpressions) * 1000 : 0
        };

        responseData.collections = {
          // Top 5 active campaigns by spend
          topCampaigns: ((data.campaigns as unknown[]) || [])
            .filter((c: unknown) => {
              const campaign = c as { status?: string };
              return campaign.status === 'ACTIVE' || campaign.status === 'PAUSED';
            })
            .map((c: unknown) => {
              const campaign = c as { id?: string; name?: string; status?: string; objective?: string };
              // Find matching insight for this campaign if available
              const campaignInsight = insights.find((i: unknown) => {
                const insight = i as { campaign_id?: string; spend?: string };
                return insight.campaign_id === campaign.id;
              });
              const insightSpend = campaignInsight ? parseFloat((campaignInsight as { spend?: string }).spend || '0') : 0;
              return {
                id: campaign.id,
                name: campaign.name,
                status: campaign.status,
                spend: insightSpend,
                objective: campaign.objective
              };
            })
            .sort((a: { spend: number }, b: { spend: number }) => b.spend - a.spend)
            .slice(0, 5),

          // Custom Audiences
          customAudiences: ((data.customAudiences as unknown[]) || [])
            .map((a: unknown) => {
              const audience = a as { 
                id?: string; 
                name?: string; 
                subtype?: string; 
                approximate_count_lower_bound?: number 
              };
              return {
                id: audience.id,
                name: audience.name,
                subtype: audience.subtype,
                size: audience.approximate_count_lower_bound || 0
              };
            })
            .slice(0, 10), // Limit to 10 for UI

          // Expert Logic Data
          placementInsights: ((data as { placementInsights?: unknown[] }).placementInsights || []).slice(0, 100),
          demographicInsights: ((data as { demographicInsights?: unknown[] }).demographicInsights || [])
            .sort((a: unknown, b: unknown) => {
              const spendA = parseFloat((a as { spend?: string }).spend || '0');
              const spendB = parseFloat((b as { spend?: string }).spend || '0');
              return spendB - spendA;
            })
        };
      }

      return NextResponse.json(responseData);

    } catch {
      return NextResponse.json({
        success: true,
        isCached: false,
        message: 'Meta account data not cached yet',
        suggestion: 'Run POST /api/meta/sync-complete to cache data'
      });
    }

  } catch (error) {
    console.error('Meta sync status check error:', error);

    return NextResponse.json({
      success: false,
      error: 'Failed to check Meta sync status',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}