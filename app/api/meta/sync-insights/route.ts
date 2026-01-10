import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongoose';
import MetaAccount from '@/models/MetaAccount';
import HistoricalInsights from '@/models/HistoricalInsights';
import MetaAPIClient from '@/lib/meta-api';

interface SyncInsightsRequest {
  accountId: string;
  dateRange?: {
    since: string;
    until: string;
  };
  syncLevel?: 'campaign' | 'adset' | 'ad' | 'all';
  forceResync?: boolean;
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { 
      accountId, 
      dateRange,
      syncLevel = 'all',
      forceResync = false 
    }: SyncInsightsRequest = await req.json();

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

    // Set default date range (last 90 days)
    const defaultDateRange = {
      since: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      until: new Date().toISOString().split('T')[0]
    };

    const effectiveDateRange = dateRange || defaultDateRange;

    const syncResults = {
      campaigns_synced: 0,
      adsets_synced: 0,
      ads_synced: 0,
      insights_created: 0,
      insights_updated: 0,
      errors: [] as string[]
    };

    try {
      // Get historical insights with enhanced data
      const historicalData = await metaClient.getHistoricalCampaignInsights(accountId, {
        dateRange: effectiveDateRange,
        level: syncLevel === 'all' ? 'ad' : syncLevel,
        breakdowns: ['age', 'gender', 'country', 'region', 'impression_device', 'platform_position'],
        actionBreakdowns: ['action_type'],
        limit: 1000
      });

      console.log(`Retrieved ${historicalData.length} insights records`);

      // Process each insight record
      for (const insight of historicalData) {
        try {
          const insightData = insight as Record<string, unknown>;
          
          // Determine the level and IDs
          const level = insightData.ad_id ? 'ad' : 
                      insightData.adset_id ? 'adset' : 'campaign';
          
          const campaignId = insightData.campaign_id as string;
          const adsetId = (insightData.adset_id as string) || undefined;
          const adId = (insightData.ad_id as string) || undefined;

          // Get detailed campaign/adset/ad information for targeting and creative data
          let targetingData = null;
          let creativeData = null;

          if (level === 'ad' && adId) {
            try {
              // Get ad details including creative and targeting
              const adDetails = await metaClient.getAdDetails(adId);

              // Get adset targeting
              if ((adDetails as { adset_id?: string }).adset_id) {
                const adsetDetails = await metaClient.getAdSetDetails((adDetails as { adset_id: string }).adset_id);
                targetingData = (adsetDetails as { targeting?: unknown }).targeting;
              }

              // Get creative details
              if ((adDetails as { creative?: { id?: string } }).creative?.id) {
                const creativeDetails = await metaClient.getCreativeDetails((adDetails as { creative: { id: string } }).creative.id);
                creativeData = {
                  title: (creativeDetails as { title?: string }).title,
                  body: (creativeDetails as { body?: string }).body,
                  call_to_action_type: (creativeDetails as { call_to_action_type?: string }).call_to_action_type,
                  image_hash: (creativeDetails as { image_hash?: string }).image_hash,
                  video_id: (creativeDetails as { video_id?: string }).video_id,
                  thumbnail_url: (creativeDetails as { thumbnail_url?: string; image_url?: string }).thumbnail_url || (creativeDetails as { image_url?: string }).image_url
                };
              }
            } catch (error) {
              console.log(`Failed to get detailed data for ad ${adId}:`, error);
            }
          } else if (level === 'adset' && adsetId) {
            try {
              const adsetDetails = await metaClient.getAdSetDetails(adsetId);
              targetingData = (adsetDetails as { targeting?: unknown }).targeting;
            } catch (error) {
              console.log(`Failed to get targeting for adset ${adsetId}:`, error);
            }
          }

          // Calculate performance score (0-100)
          const ctr = parseFloat((insightData.ctr as string) || '0');
          const cpc = parseFloat((insightData.cpc as string) || '0');
          const conversions = parseInt((insightData.conversions as string) || '0');
          const spend = parseFloat((insightData.spend as string) || '0');
          
          // Simple performance scoring algorithm
          let performanceScore = 50; // Base score
          
          // CTR scoring (0-2% = 0-25 points, 2-5% = 25-50 points, 5%+ = 50+ points)
          if (ctr > 0) {
            performanceScore += Math.min(25, ctr * 5);
          }
          
          // CPC scoring (lower is better)
          if (cpc > 0 && cpc < 2) {
            performanceScore += 15;
          } else if (cpc >= 2 && cpc < 5) {
            performanceScore += 10;
          }
          
          // Conversion scoring
          if (conversions > 0 && spend > 0) {
            const conversionRate = conversions / (parseInt((insightData.clicks as string) || '1'));
            performanceScore += Math.min(25, conversionRate * 1000); // Boost for conversions
          }
          
          performanceScore = Math.min(100, Math.max(0, performanceScore));

          // Extract product category from campaign name
          const campaignName = (insightData.campaign_name as string) || '';
          const productCategory = extractProductCategory(campaignName);

          // Create or update historical insight
          const insightQuery = {
            userId: session.user.id,
            accountId,
            campaignId,
            ...(adsetId && { adsetId }),
            ...(adId && { adId }),
            level,
            dateStart: new Date(effectiveDateRange.since),
            dateEnd: new Date(effectiveDateRange.until)
          };

          const existingInsight = await HistoricalInsights.findOne(insightQuery);

          const insightDocument = {
            ...insightQuery,
            
            // Performance Metrics
            impressions: parseInt((insightData.impressions as string) || '0'),
            clicks: parseInt((insightData.clicks as string) || '0'),
            spend: parseFloat((insightData.spend as string) || '0'),
            cpm: parseFloat((insightData.cpm as string) || '0'),
            cpc: parseFloat((insightData.cpc as string) || '0'),
            ctr: parseFloat((insightData.ctr as string) || '0'),
            reach: parseInt((insightData.reach as string) || '0'),
            frequency: parseFloat((insightData.frequency as string) || '0'),
            
            // Conversion Metrics
            actions: (insightData.actions as unknown[]) || [],
            conversions: conversions,
            conversionValues: parseFloat((insightData.conversion_values as string) || '0'),
            costPerActionType: (insightData.cost_per_action_type as Record<string, unknown>) || {},
            
            // Campaign Details
            objective: insightData.objective as string,
            optimizationGoal: insightData.optimization_goal as string,
            campaignName: insightData.campaign_name as string,
            adsetName: insightData.adset_name as string,
            adName: insightData.ad_name as string,
            
            // Targeting Information
            targeting: targetingData,
            
            // Creative Information
            creative: creativeData,
            
            // Analysis
            productCategory,
            productKeywords: extractKeywords((insightData.campaign_name as string) || ''),
            performanceScore,
            
            // Metadata
            lastUpdated: new Date()
          };

          if (existingInsight && !forceResync) {
            await HistoricalInsights.findByIdAndUpdate(existingInsight._id, insightDocument);
            syncResults.insights_updated++;
          } else {
            if (existingInsight && forceResync) {
              await HistoricalInsights.findByIdAndUpdate(existingInsight._id, insightDocument);
              syncResults.insights_updated++;
            } else {
              await HistoricalInsights.create(insightDocument);
              syncResults.insights_created++;
            }
          }

          // Update counters
          if (level === 'campaign') syncResults.campaigns_synced++;
          else if (level === 'adset') syncResults.adsets_synced++;
          else if (level === 'ad') syncResults.ads_synced++;

        } catch (error) {
          const errorMsg = `Failed to process insight: ${error instanceof Error ? error.message : 'Unknown error'}`;
          console.error(errorMsg);
          syncResults.errors.push(errorMsg);
        }
      }

      // Update Meta account sync timestamp
      await MetaAccount.findByIdAndUpdate(metaAccount._id, {
        lastSyncAt: new Date()
      });

      return NextResponse.json({
        success: true,
        sync_results: syncResults,
        date_range: effectiveDateRange,
        total_processed: historicalData.length
      });

    } catch (error) {
      console.error('Meta API error:', error);
      return NextResponse.json({ 
        error: 'Failed to sync insights from Meta',
        details: error instanceof Error ? error.message : 'Unknown error',
        partial_results: syncResults
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Sync insights error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// GET endpoint to check sync status
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const accountId = searchParams.get('accountId');

    if (!accountId) {
      return NextResponse.json({ error: 'Account ID required' }, { status: 400 });
    }

    await connectDB();

    // Get Meta account sync status
    const metaAccount = await MetaAccount.findOne({ 
      userId: session.user.id, 
      accountId,
      isActive: true 
    });

    if (!metaAccount) {
      return NextResponse.json({ error: 'Meta account not found' }, { status: 404 });
    }

    // Get insights statistics
    const insightsStats = await HistoricalInsights.aggregate([
      { $match: { userId: session.user.id, accountId } },
      {
        $group: {
          _id: '$level',
          count: { $sum: 1 },
          avgPerformanceScore: { $avg: '$performanceScore' },
          totalSpend: { $sum: '$spend' },
          totalConversions: { $sum: '$conversions' },
          lastUpdated: { $max: '$lastUpdated' }
        }
      }
    ]);

    // Get top performing campaigns
    const topCampaigns = await HistoricalInsights.find({
      userId: session.user.id,
      accountId,
      level: 'campaign',
      performanceScore: { $gte: 70 }
    })
    .sort({ performanceScore: -1 })
    .limit(5)
    .select('campaignName performanceScore ctr cpc conversions spend');

    return NextResponse.json({
      account: {
        accountId: metaAccount.accountId,
        accountName: metaAccount.accountName,
        lastSyncAt: metaAccount.lastSyncAt,
        currency: metaAccount.currency
      },
      insights_stats: insightsStats,
      top_campaigns: topCampaigns,
      sync_recommendations: generateSyncRecommendations(metaAccount.lastSyncAt)
    });

  } catch (error) {
    console.error('Get sync status error:', error);
    return NextResponse.json({ 
      error: 'Failed to get sync status',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Helper functions
function extractProductCategory(campaignName: string): string {
  const name = campaignName.toLowerCase();
  
  // Simple category detection based on keywords
  if (name.includes('ecommerce') || name.includes('shop') || name.includes('store')) return 'ecommerce';
  if (name.includes('saas') || name.includes('software') || name.includes('app')) return 'saas';
  if (name.includes('service') || name.includes('consulting')) return 'services';
  if (name.includes('education') || name.includes('course') || name.includes('learning')) return 'education';
  if (name.includes('health') || name.includes('fitness') || name.includes('wellness')) return 'health';
  if (name.includes('finance') || name.includes('crypto') || name.includes('investment')) return 'finance';
  if (name.includes('real estate') || name.includes('property')) return 'real_estate';
  if (name.includes('travel') || name.includes('hotel') || name.includes('booking')) return 'travel';
  
  return 'general';
}

function extractKeywords(campaignName: string): string[] {
  // Extract meaningful keywords from campaign name
  const words = campaignName.toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2 && !['the', 'and', 'for', 'with', 'campaign', 'ads', 'meta', 'facebook', 'instagram'].includes(word));
  
  return [...new Set(words)].slice(0, 10); // Unique keywords, max 10
}

function generateSyncRecommendations(lastSyncAt?: Date): string[] {
  const recommendations: string[] = [];
  
  if (!lastSyncAt) {
    recommendations.push('First time sync - recommend syncing last 90 days of data');
  } else {
    const daysSinceSync = Math.floor((Date.now() - lastSyncAt.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysSinceSync > 7) {
      recommendations.push('Data is over a week old - recommend full resync');
    } else if (daysSinceSync > 3) {
      recommendations.push('Consider syncing recent data for up-to-date insights');
    } else {
      recommendations.push('Data is recent - sync only if needed');
    }
  }
  
  recommendations.push('Sync at campaign level for faster processing');
  recommendations.push('Use date ranges to avoid API rate limits');
  
  return recommendations;
}