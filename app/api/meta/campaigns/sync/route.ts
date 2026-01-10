import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongoose';
import MetaAccount from '@/models/MetaAccount';
import MetaAPIClient from '@/lib/meta-api';

// Model for storing complete campaign data
import mongoose, { Schema, Document } from 'mongoose';

interface IMetaCampaignData extends Document {
  userId: mongoose.Types.ObjectId;
  accountId: string;
  campaignId: string;
  campaignData: Record<string, unknown>;
  lastSyncAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const MetaCampaignDataSchema = new Schema<IMetaCampaignData>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  accountId: { type: String, required: true, index: true },
  campaignId: { type: String, required: true, index: true },
  campaignData: { type: Schema.Types.Mixed, required: true },
  lastSyncAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

// Compound index for efficient queries
MetaCampaignDataSchema.index({ userId: 1, accountId: 1, campaignId: 1 }, { unique: true });

const MetaCampaignData = mongoose.models.MetaCampaignData || 
  mongoose.model<IMetaCampaignData>('MetaCampaignData', MetaCampaignDataSchema);

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { accountId, campaignIds, syncAll = false } = await req.json();

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

    let campaignsToSync: string[] = [];

    if (syncAll) {
      // Get all campaign IDs from Meta
      const campaigns = await metaClient.getCampaigns(accountId);
      campaignsToSync = campaigns.map(c => c.id);
    } else if (campaignIds && Array.isArray(campaignIds)) {
      campaignsToSync = campaignIds;
    } else {
      return NextResponse.json({ 
        error: 'Either campaignIds array or syncAll=true is required' 
      }, { status: 400 });
    }

    const syncResults = [];
    const errors = [];

    // Sync each campaign
    for (const campaignId of campaignsToSync) {
      try {
        console.log(`Syncing campaign ${campaignId}...`);
        
        // Get complete campaign data from Meta
        const completeCampaignData = await metaClient.getCampaignComplete(campaignId, true);

        // Store or update in our database
        await MetaCampaignData.findOneAndUpdate(
          {
            userId: session.user.id,
            accountId,
            campaignId
          },
          {
            campaignData: completeCampaignData,
            lastSyncAt: new Date()
          },
          {
            upsert: true,
            new: true
          }
        );

        syncResults.push({
          campaignId,
          status: 'success',
          adSetsCount: completeCampaignData.campaign.adsets?.length || 0,
          adsCount: completeCampaignData.campaign.adsets?.reduce(
            (total, adset) => total + (adset.adset.ads?.length || 0), 0
          ) || 0
        });

      } catch (error) {
        console.error(`Failed to sync campaign ${campaignId}:`, error);
        errors.push({
          campaignId,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return NextResponse.json({
      success: true,
      synced: syncResults.length,
      errors: errors.length,
      results: syncResults,
      errorDetails: errors
    });

  } catch (error) {
    console.error('Campaign sync error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to sync campaigns',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Get synced campaign data
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const accountId = searchParams.get('accountId');
    const campaignId = searchParams.get('campaignId');

    if (!accountId) {
      return NextResponse.json({ error: 'Account ID required' }, { status: 400 });
    }

    await connectDB();

    if (campaignId) {
      // Get specific campaign data
      const campaignData = await MetaCampaignData.findOne({
        userId: session.user.id,
        accountId,
        campaignId
      });

      if (!campaignData) {
        return NextResponse.json({ error: 'Campaign data not found' }, { status: 404 });
      }

      return NextResponse.json({
        campaign: campaignData.campaignData,
        lastSyncAt: campaignData.lastSyncAt
      });
    } else {
      // Get all synced campaigns for account
      const campaigns = await MetaCampaignData.find({
        userId: session.user.id,
        accountId
      }).sort({ lastSyncAt: -1 });

      return NextResponse.json({
        campaigns: campaigns.map(c => ({
          campaignId: c.campaignId,
          campaignData: c.campaignData,
          lastSyncAt: c.lastSyncAt
        }))
      });
    }

  } catch (error) {
    console.error('Get synced campaigns error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to get synced campaign data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}