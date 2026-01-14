import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { syncEnhancedMetaData } from '@/lib/meta-data-sync';
import MetaAccount from '@/models/MetaAccount';
import connectDB from '@/lib/mongoose';

/**
 * POST /api/meta/sync-enhanced
 * 
 * Trigger enhanced Meta data sync with performance analytics
 * 
 * Body:
 * - timePeriod: 'last_30_days' | 'last_90_days' | 'last_6_months' | 'last_year' | 'last_2_years' | 'last_5_years' | 'all_time'
 * - forceRefresh: boolean (optional)
 * - includeHistoricalAnalysis: boolean (optional)
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const {
      timePeriod = 'last_90_days',
      forceRefresh = false,
      includeHistoricalAnalysis = true
    } = body;

    await connectDB();

    // Get user's active Meta account
    const metaAccount = await MetaAccount.findOne({
      userId: session.user.id,
      isActive: true
    });

    if (!metaAccount) {
      return NextResponse.json(
        { error: 'No active Meta account found' },
        { status: 404 }
      );
    }

    // Start enhanced sync
    console.log(`🚀 Starting enhanced sync for user ${session.user.id}`);

    await syncEnhancedMetaData({
      userId: session.user.id,
      metaAccountId: metaAccount.accountId,
      businessId: metaAccount.businessId || '',
      accessToken: metaAccount.accessToken,
      timePeriod,
      forceRefresh,
      includeHistoricalAnalysis
    });

    return NextResponse.json({
      success: true,
      message: 'Enhanced Meta data sync completed successfully',
      timePeriod,
      accountId: metaAccount.accountId
    });

  } catch (error) {
    console.error('Enhanced sync error:', error);
    return NextResponse.json(
      {
        error: 'Failed to sync enhanced Meta data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/meta/sync-enhanced
 * 
 * Get sync status and last sync time
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    const metaAccount = await MetaAccount.findOne({
      userId: session.user.id,
      isActive: true
    });

    if (!metaAccount) {
      return NextResponse.json(
        { error: 'No active Meta account found' },
        { status: 404 }
      );
    }

    // Get cache status
    const MetaAccountCache = (await import('@/models/MetaAccountCache')).default;
    const cache = await MetaAccountCache.findOne({
      userId: session.user.id,
      metaAccountId: metaAccount.accountId
    });

    if (!cache) {
      return NextResponse.json({
        synced: false,
        message: 'No sync data available'
      });
    }

    const hasEnhancedData = !!(cache as { campaignSuccessMetrics?: unknown }).campaignSuccessMetrics;
    const isStale = cache.lastUpdated < new Date(Date.now() - 12 * 60 * 60 * 1000);

    return NextResponse.json({
      synced: true,
      hasEnhancedData,
      isStale,
      lastUpdated: cache.lastUpdated,
      syncStatus: cache.syncStatus,
      timePeriod: cache.timePeriod,
      cacheVersion: cache.cacheVersion,
      stats: {
        campaigns: (cache.campaigns as unknown[])?.length || 0,
        adsets: (cache.adsets as unknown[])?.length || 0,
        ads: (cache.ads as unknown[])?.length || 0,
        insights: (cache.insights as unknown[])?.length || 0,
        successMetrics: ((cache as { campaignSuccessMetrics?: unknown[] }).campaignSuccessMetrics)?.length || 0,
        winningPatterns: ((cache as { winningPatterns?: unknown[] }).winningPatterns)?.length || 0
      }
    });

  } catch (error) {
    console.error('Get sync status error:', error);
    return NextResponse.json(
      {
        error: 'Failed to get sync status',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
