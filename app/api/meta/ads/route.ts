import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongoose';
import MetaAccount from '@/models/MetaAccount';
import MetaAPIClient from '@/lib/meta-api';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const accountId = searchParams.get('accountId');
    const adSetId = searchParams.get('adSetId');
    const includeInsights = searchParams.get('insights') === 'true';
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (!accountId) {
      return NextResponse.json({ error: 'Account ID required' }, { status: 400 });
    }

    await connectDB();

    // Get Meta account
    const metaAccount = await MetaAccount.findOne({ 
      userId: session.user.id, 
      accountId,
      isActive: true 
    });

    if (!metaAccount) {
      return NextResponse.json({ error: 'Meta account not found' }, { status: 404 });
    }

    const metaClient = new MetaAPIClient(metaAccount.accessToken);

    // Get all ads
    const ads = await metaClient.getAds(accountId, adSetId || undefined);
    
    if (includeInsights) {
      // Get insights for each ad
      const adsWithInsights = await Promise.all(
        ads.map(async (ad) => {
          try {
            const dateRange = startDate && endDate ? { since: startDate, until: endDate } : undefined;
            const insights = await metaClient.getAdInsights(ad.id, dateRange);
            return { ...ad, insights };
          } catch (error) {
            console.error(`Failed to get insights for ad ${ad.id}:`, error);
            return { ...ad, insights: null };
          }
        })
      );
      
      return NextResponse.json({ ads: adsWithInsights });
    }

    return NextResponse.json({ ads });

  } catch (error) {
    console.error('Meta ads error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch ad data' },
      { status: 500 }
    );
  }
}