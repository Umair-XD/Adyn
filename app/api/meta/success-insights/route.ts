import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import CampaignSuccessAnalyzer from '@/lib/campaign-success-analyzer';
import MetaAccount from '@/models/MetaAccount';
import connectDB from '@/lib/mongoose';

/**
 * GET /api/meta/success-insights
 * 
 * Get comprehensive success insights and recommendations
 * 
 * Query params:
 * - includeHistoricalTrends: boolean (optional)
 * - trendMonths: number (optional, default 6)
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

    const { searchParams } = new URL(req.url);
    const includeHistoricalTrends = searchParams.get('includeHistoricalTrends') === 'true';
    const trendMonths = parseInt(searchParams.get('trendMonths') || '6');

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

    // Get success insights
    const insights = await CampaignSuccessAnalyzer.getSuccessInsights(
      session.user.id,
      metaAccount.accountId
    );

    // Get historical trends if requested
    let historicalTrends = null;
    if (includeHistoricalTrends) {
      historicalTrends = await CampaignSuccessAnalyzer.getHistoricalTrends(
        session.user.id,
        metaAccount.accountId,
        trendMonths
      );
    }

    return NextResponse.json({
      success: true,
      insights,
      historicalTrends,
      accountId: metaAccount.accountId
    });

  } catch (error) {
    console.error('Get success insights error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to get success insights',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
