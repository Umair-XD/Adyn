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
    const campaignId = searchParams.get('campaignId');
    const includeInsights = searchParams.get('insights') === 'true';
    const includeComplete = searchParams.get('complete') === 'true';
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

    if (campaignId) {
      if (includeComplete) {
        // Get complete campaign data with all adsets, ads, and creatives
        const completeCampaign = await metaClient.getCampaignComplete(campaignId, includeInsights);
        return NextResponse.json({ campaign: completeCampaign });
      } else {
        // Get specific campaign insights only
        const dateRange = startDate && endDate ? { since: startDate, until: endDate } : undefined;
        const insights = await metaClient.getCampaignInsights(campaignId, dateRange);
        
        return NextResponse.json({ 
          campaignId,
          insights,
          dateRange 
        });
      }
    } else {
      if (includeComplete) {
        // Get all campaigns with complete data
        const completeCampaigns = await metaClient.getAllCampaignsComplete(accountId, includeInsights);
        return NextResponse.json({ campaigns: completeCampaigns });
      } else {
        // Get all campaigns (basic data)
        const campaigns = await metaClient.getCampaigns(accountId);
        
        if (includeInsights) {
          // Get insights for each campaign
          const campaignsWithInsights = await Promise.all(
            campaigns.map(async (campaign) => {
              try {
                const dateRange = startDate && endDate ? { since: startDate, until: endDate } : undefined;
                const insights = await metaClient.getCampaignInsights(campaign.id, dateRange);
                return { ...campaign, insights };
              } catch (error) {
                console.error(`Failed to get insights for campaign ${campaign.id}:`, error);
                return { ...campaign, insights: null };
              }
            })
          );
          
          return NextResponse.json({ campaigns: campaignsWithInsights });
        }

        return NextResponse.json({ campaigns });
      }
    }

  } catch (error) {
    console.error('Meta campaigns error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch campaign data' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { accountId, campaignData } = await req.json();

    if (!accountId || !campaignData) {
      return NextResponse.json({ error: 'Account ID and campaign data required' }, { status: 400 });
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

    // Create campaign
    const campaign = await metaClient.createCampaign(accountId, campaignData);

    return NextResponse.json({ campaign });

  } catch (error) {
    console.error('Meta campaign creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create campaign' },
      { status: 500 }
    );
  }
}