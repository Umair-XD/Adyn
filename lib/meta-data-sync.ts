import MetaAccountCache from '@/models/MetaAccountCache';
import HistoricalInsights from '@/models/HistoricalInsights';
import connectDB from './mongoose';
import { MetaAPIClient } from './meta-api';

/**
 * ENHANCED META DATA SYNC SERVICE
 * 
 * This service fetches comprehensive Meta account data including:
 * - All campaigns, ad sets, ads with complete details
 * - Historical insights with performance metrics
 * - Campaign success rates and patterns
 * - Audience performance data
 * - Creative performance analytics
 * - Placement and demographic breakdowns
 * - Winning campaign patterns
 * - ROI and conversion tracking
 */

export interface EnhancedMetaSyncOptions {
  userId: string;
  metaAccountId: string;
  businessId: string;
  accessToken: string;
  forceRefresh?: boolean;
  timePeriod?: 'last_30_days' | 'last_90_days' | 'last_6_months' | 'last_year' | 'last_2_years' | 'last_5_years' | 'all_time';
  includeHistoricalAnalysis?: boolean;
}

export interface CampaignSuccessMetrics {
  campaignId: string;
  campaignName: string;
  objective: string;
  totalSpend: number;
  totalRevenue: number;
  roas: number;
  conversions: number;
  conversionRate: number;
  ctr: number;
  cpc: number;
  cpm: number;
  reach: number;
  impressions: number;
  clicks: number;
  frequency: number;
  successScore: number; // 0-100 score based on multiple factors
  performanceRating: 'excellent' | 'good' | 'average' | 'poor';
  learningPhase: 'learning' | 'active' | 'mature';
  dateRange: {
    start: Date;
    end: Date;
  };
}

export interface WinningPattern {
  patternType: 'targeting' | 'creative' | 'placement' | 'timing' | 'budget';
  description: string;
  successRate: number;
  avgROAS: number;
  avgCTR: number;
  sampleSize: number;
  recommendations: string[];
}

export class EnhancedMetaDataSyncService {
  private accessToken: string;
  private metaClient: MetaAPIClient;
  private baseUrl = 'https://graph.facebook.com/v21.0';

  constructor(accessToken: string) {
    this.accessToken = accessToken;
    this.metaClient = new MetaAPIClient(accessToken);
  }

  /**
   * MAIN ENHANCED SYNC FUNCTION
   * Fetches ALL Meta data + performance analytics
   */
  async syncEnhancedAccountData(options: EnhancedMetaSyncOptions): Promise<void> {
    console.log(`🚀 Starting ENHANCED Meta data sync for account ${options.metaAccountId}`);

    await connectDB();

    // Check if we need to sync
    if (!options.forceRefresh) {
      const existingCache = await MetaAccountCache.findOne({
        userId: options.userId,
        metaAccountId: options.metaAccountId
      });

      if (existingCache && existingCache.isComplete &&
        existingCache.lastUpdated > new Date(Date.now() - 12 * 60 * 60 * 1000)) { // 12 hours
        console.log('✅ Enhanced Meta data cache is fresh, skipping sync');
        return;
      }
    }

    // Update sync status
    await MetaAccountCache.findOneAndUpdate(
      { userId: options.userId, metaAccountId: options.metaAccountId },
      {
        syncStatus: 'syncing',
        syncErrors: [],
        lastUpdated: new Date()
      },
      { upsert: true }
    );

    try {
      const formattedAccountId = options.metaAccountId.startsWith('act_') 
        ? options.metaAccountId 
        : `act_${options.metaAccountId}`;

      console.log('📊 Phase 1: Fetching core account data...');
      
      // 1. CORE ACCOUNT DATA
      const accountData = await this.fetchAccountData(formattedAccountId);
      console.log('✅ Account data fetched');

      // 2. ALL CAMPAIGNS WITH COMPLETE DATA
      console.log('📊 Phase 2: Fetching complete campaign structures...');
      const completeCampaigns = await this.metaClient.getAllCampaignsComplete(
        options.metaAccountId,
        true // Include insights
      );
      console.log(`✅ ${completeCampaigns.length} complete campaigns fetched`);

      // Extract structured data
      const campaigns = completeCampaigns.map(c => c.campaign);
      const adsets = completeCampaigns.flatMap(c => c.campaign.adsets?.map(a => a.adset) || []);
      const ads = completeCampaigns.flatMap(c => 
        c.campaign.adsets?.flatMap(a => a.adset.ads?.map(ad => ad.ad) || []) || []
      );

      // 3. HISTORICAL INSIGHTS (Extended period)
      console.log('📊 Phase 3: Fetching historical insights...');
      const insights = await this.fetchHistoricalInsights(
        formattedAccountId,
        options.timePeriod || 'last_90_days'
      );
      console.log(`✅ ${insights.length} insight records fetched`);

      // 4. PLACEMENT PERFORMANCE DATA
      console.log('📊 Phase 4: Fetching placement performance...');
      const placementInsights = await this.fetchPlacementPerformance(
        formattedAccountId,
        options.timePeriod || 'last_90_days'
      );
      console.log(`✅ ${placementInsights.length} placement records fetched`);

      // 5. DEMOGRAPHIC PERFORMANCE DATA
      console.log('📊 Phase 5: Fetching demographic performance...');
      const demographicInsights = await this.fetchDemographicPerformance(
        formattedAccountId,
        options.timePeriod || 'last_90_days'
      );
      console.log(`✅ ${demographicInsights.length} demographic records fetched`);

      // 6. CUSTOM AUDIENCES
      console.log('📊 Phase 6: Fetching custom audiences...');
      const customAudiences = await this.metaClient.getCustomAudiences(options.metaAccountId);
      console.log(`✅ ${customAudiences.length} custom audiences fetched`);

      // 7. PIXELS
      console.log('📊 Phase 7: Fetching pixels...');
      const pixels = await this.metaClient.getPixels(options.metaAccountId);
      console.log(`✅ ${pixels.length} pixels fetched`);

      // 8. CAMPAIGN SUCCESS METRICS
      console.log('📊 Phase 8: Calculating campaign success metrics...');
      const successMetrics = await this.calculateCampaignSuccessMetrics(
        completeCampaigns,
        insights
      );
      console.log(`✅ Success metrics calculated for ${successMetrics.length} campaigns`);

      // 9. WINNING PATTERNS ANALYSIS
      console.log('📊 Phase 9: Analyzing winning patterns...');
      const winningPatterns = await this.analyzeWinningPatterns(
        completeCampaigns,
        insights,
        placementInsights,
        demographicInsights
      );
      console.log(`✅ ${winningPatterns.length} winning patterns identified`);

      // 10. TOP PERFORMING CREATIVES
      console.log('📊 Phase 10: Analyzing creative performance...');
      const topCreatives = await this.metaClient.getCreativePerformanceAnalysis(
        options.metaAccountId,
        {
          dateRange: this.getDateRange(options.timePeriod || 'last_90_days'),
          minSpend: 50,
          limit: 50
        }
      );
      console.log(`✅ ${topCreatives.length} top creatives analyzed`);

      // Calculate date range
      const dateRange = this.getDateRangeObject(options.timePeriod || 'last_90_days');

      // Store everything in cache
      await MetaAccountCache.findOneAndUpdate(
        { userId: options.userId, metaAccountId: options.metaAccountId },
        {
          userId: options.userId,
          metaAccountId: options.metaAccountId,
          businessId: options.businessId,
          accountData,
          campaigns,
          adsets,
          ads,
          insights,
          placementInsights,
          demographicInsights,
          customAudiences,
          pixels,
          
          // Enhanced analytics data
          campaignSuccessMetrics: successMetrics,
          winningPatterns,
          topPerformingCreatives: topCreatives,
          
          lastUpdated: new Date(),
          timePeriod: options.timePeriod || 'last_90_days',
          insightsDateRange: dateRange,
          isComplete: true,
          syncStatus: 'completed',
          syncErrors: []
        },
        { upsert: true }
      );

      // Store historical insights separately for long-term analysis
      if (options.includeHistoricalAnalysis) {
        await this.storeHistoricalInsights(
          options.userId,
          options.metaAccountId,
          successMetrics,
          winningPatterns
        );
      }

      console.log('🎉 ENHANCED Meta data sync completed successfully!');
      console.log(`📈 Summary:`);
      console.log(`   - Campaigns: ${campaigns.length}`);
      console.log(`   - Ad Sets: ${adsets.length}`);
      console.log(`   - Ads: ${ads.length}`);
      console.log(`   - Insights: ${insights.length}`);
      console.log(`   - Success Metrics: ${successMetrics.length}`);
      console.log(`   - Winning Patterns: ${winningPatterns.length}`);
      console.log(`   - Top Creatives: ${topCreatives.length}`);

    } catch (error) {
      console.error('❌ Enhanced Meta data sync failed:', error);

      await MetaAccountCache.findOneAndUpdate(
        { userId: options.userId, metaAccountId: options.metaAccountId },
        {
          syncStatus: 'failed',
          syncErrors: [error instanceof Error ? error.message : 'Unknown sync error'],
          lastUpdated: new Date()
        }
      );

      throw error;
    }
  }

  /**
   * Fetch account data
   */
  private async fetchAccountData(accountId: string) {
    const fields = [
      'account_id', 'name', 'account_status', 'currency', 'timezone_name',
      'created_time', 'amount_spent', 'balance', 'business_country_code',
      'timezone_offset_hours_utc', 'min_daily_budget', 'spend_cap',
      'is_personal', 'is_prepay_account', 'funding_source', 'age'
    ].join(',');

    const url = `${this.baseUrl}/${accountId}?fields=${fields}&access_token=${this.accessToken}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to fetch account data: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Fetch historical insights with chunking for large date ranges
   * Now fetches COMPREHENSIVE fields from Meta API
   */
  private async fetchHistoricalInsights(accountId: string, timePeriod: string) {
    const allInsights: unknown[] = [];
    const dateRange = this.getDateRange(timePeriod);
    
    // Comprehensive fields list based on Meta API documentation
    const comprehensiveFields = [
      // Core identification
      'account_id', 'account_name', 'account_currency',
      'campaign_id', 'campaign_name', 'adset_id', 'adset_name', 'ad_id', 'ad_name',
      
      // Date fields
      'date_start', 'date_stop',
      
      // Core performance metrics
      'impressions', 'clicks', 'spend', 'reach', 'frequency',
      
      // Cost metrics
      'cpc', 'cpm', 'cpp', 'ctr',
      'cost_per_inline_link_click', 'cost_per_inline_post_engagement',
      'cost_per_unique_click', 'cost_per_unique_inline_link_click',
      
      // Engagement metrics
      'inline_link_clicks', 'inline_link_click_ctr', 'inline_post_engagement',
      'outbound_clicks', 'outbound_clicks_ctr',
      
      // Conversion metrics
      'actions', 'action_values', 'conversions', 'conversion_values',
      'cost_per_action_type', 'cost_per_conversion',
      'cost_per_unique_action_type', 'cost_per_unique_conversion',
      
      // ROAS metrics
      'purchase_roas', 'website_purchase_roas', 'mobile_app_purchase_roas',
      
      // Video metrics
      'video_30_sec_watched_actions', 'video_p25_watched_actions',
      'video_p50_watched_actions', 'video_p75_watched_actions', 'video_p100_watched_actions',
      'video_avg_time_watched_actions', 'video_play_actions',
      
      // Objective & results
      'objective', 'optimization_goal', 'results', 'cost_per_result',
      
      // Attribution
      'attribution_setting', 'buying_type',
      
      // Canvas/Instant Experience
      'canvas_avg_view_percent', 'canvas_avg_view_time',
      
      // Full view metrics
      'full_view_impressions', 'full_view_reach',
      
      // Social metrics
      'social_spend'
    ].join(',');
    
    // Chunk by 90 days to avoid API limits
    const chunks = this.createDateChunks(
      new Date(dateRange.since),
      new Date(dateRange.until),
      90
    );

    for (const chunk of chunks) {
      try {
        // Fetch with comprehensive fields
        const params = new URLSearchParams({
          fields: comprehensiveFields,
          time_range: JSON.stringify({
            since: chunk.since.toISOString().split('T')[0],
            until: chunk.until.toISOString().split('T')[0]
          }),
          level: 'ad',
          limit: '1000'
        });

        const url = `${this.baseUrl}/${accountId}/insights?${params.toString()}&access_token=${this.accessToken}`;
        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error(`API error: ${response.statusText}`);
        }
        
        const data = await response.json();
        allInsights.push(...(data.data || []));
        
        // Handle pagination
        let nextUrl = data.paging?.next;
        while (nextUrl) {
          const nextResponse = await fetch(nextUrl);
          const nextData = await nextResponse.json();
          allInsights.push(...(nextData.data || []));
          nextUrl = nextData.paging?.next;
          
          // Small delay to avoid rate limits
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        
      } catch (error) {
        console.warn(`Failed to fetch insights chunk:`, error);
      }
    }

    return allInsights;
  }

  /**
   * Fetch placement performance data with comprehensive fields
   */
  private async fetchPlacementPerformance(accountId: string, timePeriod: string) {
    const dateRange = this.getDateRange(timePeriod);
    
    const fields = [
      'date_start', 'date_stop',
      'publisher_platform', 'platform_position', 'device_platform', 'impression_device',
      'impressions', 'clicks', 'spend', 'reach', 'frequency',
      'ctr', 'cpc', 'cpm', 'cpp',
      'actions', 'action_values', 'conversions', 'conversion_values',
      'outbound_clicks', 'inline_link_clicks',
      'video_p50_watched_actions', 'video_p100_watched_actions'
    ].join(',');
    
    try {
      const params = new URLSearchParams({
        fields,
        time_range: JSON.stringify({
          since: dateRange.since,
          until: dateRange.until
        }),
        level: 'account',
        breakdowns: 'publisher_platform,platform_position,device_platform,impression_device',
        limit: '1000'
      });

      const url = `${this.baseUrl}/${accountId}/insights?${params.toString()}&access_token=${this.accessToken}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.warn('Failed to fetch placement performance:', error);
      return [];
    }
  }

  /**
   * Fetch demographic performance data with comprehensive fields
   */
  private async fetchDemographicPerformance(accountId: string, timePeriod: string) {
    const dateRange = this.getDateRange(timePeriod);
    
    const fields = [
      'date_start', 'date_stop',
      'age', 'gender',
      'impressions', 'clicks', 'spend', 'reach', 'frequency',
      'ctr', 'cpc', 'cpm', 'cpp',
      'actions', 'action_values', 'conversions', 'conversion_values',
      'outbound_clicks', 'inline_link_clicks',
      'video_p50_watched_actions'
    ].join(',');
    
    try {
      const params = new URLSearchParams({
        fields,
        time_range: JSON.stringify({
          since: dateRange.since,
          until: dateRange.until
        }),
        level: 'account',
        breakdowns: 'age,gender',
        limit: '1000'
      });

      const url = `${this.baseUrl}/${accountId}/insights?${params.toString()}&access_token=${this.accessToken}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.warn('Failed to fetch demographic performance:', error);
      return [];
    }
  }

  /**
   * Calculate campaign success metrics
   */
  private async calculateCampaignSuccessMetrics(
    campaigns: unknown[],
    insights: unknown[]
  ): Promise<CampaignSuccessMetrics[]> {
    const metrics: CampaignSuccessMetrics[] = [];

    for (const campaignData of campaigns) {
      const campaign = (campaignData as { campaign: { id: string; name: string; objective: string; insights?: unknown } }).campaign;
      
      // Get all insights for this campaign
      const campaignInsights = insights.filter((i: unknown) => 
        (i as { campaign_id: string }).campaign_id === campaign.id
      );

      if (campaignInsights.length === 0) continue;

      // Aggregate metrics
      const totals = campaignInsights.reduce((acc: {
        spend: number;
        revenue: number;
        conversions: number;
        clicks: number;
        impressions: number;
        reach: number;
      }, insight: unknown) => {
        const i = insight as {
          spend?: string;
          conversion_values?: string;
          conversions?: string;
          clicks?: string;
          impressions?: string;
          reach?: string;
        };
        return {
          spend: acc.spend + parseFloat(i.spend || '0'),
          revenue: acc.revenue + parseFloat(i.conversion_values || '0'),
          conversions: acc.conversions + parseFloat(i.conversions || '0'),
          clicks: acc.clicks + parseFloat(i.clicks || '0'),
          impressions: acc.impressions + parseFloat(i.impressions || '0'),
          reach: acc.reach + parseFloat(i.reach || '0')
        };
      }, { spend: 0, revenue: 0, conversions: 0, clicks: 0, impressions: 0, reach: 0 });

      const roas = totals.spend > 0 ? totals.revenue / totals.spend : 0;
      const conversionRate = totals.clicks > 0 ? (totals.conversions / totals.clicks) * 100 : 0;
      const ctr = totals.impressions > 0 ? (totals.clicks / totals.impressions) * 100 : 0;
      const cpc = totals.clicks > 0 ? totals.spend / totals.clicks : 0;
      const cpm = totals.impressions > 0 ? (totals.spend / totals.impressions) * 1000 : 0;
      const frequency = totals.reach > 0 ? totals.impressions / totals.reach : 0;

      // Calculate success score (0-100)
      const roasScore = Math.min(roas * 10, 40); // Max 40 points
      const ctrScore = Math.min(ctr * 10, 30); // Max 30 points
      const conversionScore = Math.min(conversionRate * 3, 30); // Max 30 points
      const successScore = roasScore + ctrScore + conversionScore;

      // Determine performance rating
      let performanceRating: 'excellent' | 'good' | 'average' | 'poor';
      if (successScore >= 75) performanceRating = 'excellent';
      else if (successScore >= 50) performanceRating = 'good';
      else if (successScore >= 25) performanceRating = 'average';
      else performanceRating = 'poor';

      // Determine learning phase
      let learningPhase: 'learning' | 'active' | 'mature';
      if (totals.conversions < 50) learningPhase = 'learning';
      else if (totals.conversions < 500) learningPhase = 'active';
      else learningPhase = 'mature';

      metrics.push({
        campaignId: campaign.id,
        campaignName: campaign.name,
        objective: campaign.objective,
        totalSpend: totals.spend,
        totalRevenue: totals.revenue,
        roas,
        conversions: totals.conversions,
        conversionRate,
        ctr,
        cpc,
        cpm,
        reach: totals.reach,
        impressions: totals.impressions,
        clicks: totals.clicks,
        frequency,
        successScore,
        performanceRating,
        learningPhase,
        dateRange: {
          start: new Date(Math.min(...campaignInsights.map((i: unknown) => 
            new Date((i as { date_start: string }).date_start).getTime()
          ))),
          end: new Date(Math.max(...campaignInsights.map((i: unknown) => 
            new Date((i as { date_stop: string }).date_stop).getTime()
          )))
        }
      });
    }

    return metrics.sort((a, b) => b.successScore - a.successScore);
  }

  /**
   * Analyze winning patterns from historical data
   */
  private async analyzeWinningPatterns(
    campaigns: unknown[],
    insights: unknown[],
    placementInsights: unknown[],
    demographicInsights: unknown[]
  ): Promise<WinningPattern[]> {
    const patterns: WinningPattern[] = [];

    // Analyze placement patterns
    const placementPattern = this.analyzePlacementPatterns(placementInsights);
    if (placementPattern) patterns.push(placementPattern);

    // Analyze demographic patterns
    const demographicPattern = this.analyzeDemographicPatterns(demographicInsights);
    if (demographicPattern) patterns.push(demographicPattern);

    // Analyze budget patterns
    const budgetPattern = this.analyzeBudgetPatterns(campaigns, insights);
    if (budgetPattern) patterns.push(budgetPattern);

    // Analyze timing patterns
    const timingPattern = this.analyzeTimingPatterns(insights);
    if (timingPattern) patterns.push(timingPattern);

    return patterns;
  }

  private analyzePlacementPatterns(insights: unknown[]): WinningPattern | null {
    if (insights.length === 0) return null;

    // Group by placement and calculate performance
    const placementPerf = insights.reduce((acc: Record<string, {
      spend: number;
      revenue: number;
      clicks: number;
      impressions: number;
      count: number;
    }>, insight: unknown) => {
      const i = insight as {
        publisher_platform?: string;
        platform_position?: string;
        spend?: string;
        conversion_values?: string;
        clicks?: string;
        impressions?: string;
      };
      const key = `${i.publisher_platform || 'unknown'}_${i.platform_position || 'unknown'}`;
      if (!acc[key]) acc[key] = { spend: 0, revenue: 0, clicks: 0, impressions: 0, count: 0 };
      acc[key].spend += parseFloat(i.spend || '0');
      acc[key].revenue += parseFloat(i.conversion_values || '0');
      acc[key].clicks += parseFloat(i.clicks || '0');
      acc[key].impressions += parseFloat(i.impressions || '0');
      acc[key].count++;
      return acc;
    }, {});

    // Find best performing placement
    let bestPlacement = '';
    let bestROAS = 0;
    let bestCTR = 0;

    for (const [placement, perf] of Object.entries(placementPerf)) {
      const roas = perf.spend > 0 ? perf.revenue / perf.spend : 0;
      const ctr = perf.impressions > 0 ? (perf.clicks / perf.impressions) * 100 : 0;
      
      if (roas > bestROAS) {
        bestROAS = roas;
        bestCTR = ctr;
        bestPlacement = placement;
      }
    }

    if (!bestPlacement) return null;

    return {
      patternType: 'placement',
      description: `Best performing placement: ${bestPlacement}`,
      successRate: 0,
      avgROAS: bestROAS,
      avgCTR: bestCTR,
      sampleSize: placementPerf[bestPlacement].count,
      recommendations: [
        `Focus budget on ${bestPlacement} placement`,
        `ROAS: ${bestROAS.toFixed(2)}x`,
        `CTR: ${bestCTR.toFixed(2)}%`
      ]
    };
  }

  private analyzeDemographicPatterns(insights: unknown[]): WinningPattern | null {
    if (insights.length === 0) return null;

    // Similar analysis for demographics
    const demoPerf = insights.reduce((acc: Record<string, {
      spend: number;
      revenue: number;
      clicks: number;
      impressions: number;
      count: number;
    }>, insight: unknown) => {
      const i = insight as {
        age?: string;
        gender?: string;
        spend?: string;
        conversion_values?: string;
        clicks?: string;
        impressions?: string;
      };
      const key = `${i.age || 'unknown'}_${i.gender || 'unknown'}`;
      if (!acc[key]) acc[key] = { spend: 0, revenue: 0, clicks: 0, impressions: 0, count: 0 };
      acc[key].spend += parseFloat(i.spend || '0');
      acc[key].revenue += parseFloat(i.conversion_values || '0');
      acc[key].clicks += parseFloat(i.clicks || '0');
      acc[key].impressions += parseFloat(i.impressions || '0');
      acc[key].count++;
      return acc;
    }, {});

    let bestDemo = '';
    let bestROAS = 0;
    let bestCTR = 0;

    for (const [demo, perf] of Object.entries(demoPerf)) {
      const roas = perf.spend > 0 ? perf.revenue / perf.spend : 0;
      const ctr = perf.impressions > 0 ? (perf.clicks / perf.impressions) * 100 : 0;
      
      if (roas > bestROAS) {
        bestROAS = roas;
        bestCTR = ctr;
        bestDemo = demo;
      }
    }

    if (!bestDemo) return null;

    return {
      patternType: 'targeting',
      description: `Best performing demographic: ${bestDemo}`,
      successRate: 0,
      avgROAS: bestROAS,
      avgCTR: bestCTR,
      sampleSize: demoPerf[bestDemo].count,
      recommendations: [
        `Target ${bestDemo} demographic`,
        `ROAS: ${bestROAS.toFixed(2)}x`,
        `CTR: ${bestCTR.toFixed(2)}%`
      ]
    };
  }

  private analyzeBudgetPatterns(campaigns: unknown[], insights: unknown[]): WinningPattern | null {
    // Analyze budget allocation patterns
    return null; // Implement based on specific needs
  }

  private analyzeTimingPatterns(insights: unknown[]): WinningPattern | null {
    // Analyze timing patterns (day of week, time of day)
    return null; // Implement based on specific needs
  }

  /**
   * Store historical insights for long-term trend analysis
   */
  private async storeHistoricalInsights(
    userId: string,
    metaAccountId: string,
    successMetrics: CampaignSuccessMetrics[],
    winningPatterns: WinningPattern[]
  ) {
    try {
      await HistoricalInsights.create({
        userId,
        metaAccountId,
        dateStart: new Date(Math.min(...successMetrics.map(m => m.dateRange.start.getTime()))),
        dateEnd: new Date(Math.max(...successMetrics.map(m => m.dateRange.end.getTime()))),
        campaignMetrics: successMetrics,
        winningPatterns,
        aggregatedMetrics: {
          totalSpend: successMetrics.reduce((sum, m) => sum + m.totalSpend, 0),
          totalRevenue: successMetrics.reduce((sum, m) => sum + m.totalRevenue, 0),
          avgROAS: successMetrics.reduce((sum, m) => sum + m.roas, 0) / successMetrics.length,
          avgCTR: successMetrics.reduce((sum, m) => sum + m.ctr, 0) / successMetrics.length,
          totalConversions: successMetrics.reduce((sum, m) => sum + m.conversions, 0)
        }
      });
      console.log('✅ Historical insights stored');
    } catch (error) {
      console.warn('Failed to store historical insights:', error);
    }
  }

  /**
   * Helper: Get date range for time period
   */
  private getDateRange(timePeriod: string): { since: string; until: string } {
    const endDate = new Date();
    let startDate: Date;

    switch (timePeriod) {
      case 'last_30_days':
        startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'last_90_days':
        startDate = new Date(endDate.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case 'last_6_months':
        startDate = new Date(endDate.getTime() - 180 * 24 * 60 * 60 * 1000);
        break;
      case 'last_year':
        startDate = new Date(endDate.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      case 'last_2_years':
        startDate = new Date(endDate.getTime() - 2 * 365 * 24 * 60 * 60 * 1000);
        break;
      case 'last_5_years':
        startDate = new Date(endDate.getTime() - 5 * 365 * 24 * 60 * 60 * 1000);
        break;
      case 'all_time':
        startDate = new Date(endDate.getTime() - 10 * 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(endDate.getTime() - 90 * 24 * 60 * 60 * 1000);
    }

    return {
      since: startDate.toISOString().split('T')[0],
      until: endDate.toISOString().split('T')[0]
    };
  }

  private getDateRangeObject(timePeriod: string): { startDate: Date; endDate: Date } {
    const range = this.getDateRange(timePeriod);
    return {
      startDate: new Date(range.since),
      endDate: new Date(range.until)
    };
  }

  /**
   * Helper: Create date chunks for large date ranges
   */
  private createDateChunks(
    startDate: Date,
    endDate: Date,
    chunkDays: number
  ): Array<{ since: Date; until: Date }> {
    const chunks: Array<{ since: Date; until: Date }> = [];
    let currentStart = new Date(startDate);

    while (currentStart < endDate) {
      const currentEnd = new Date(
        Math.min(
          currentStart.getTime() + chunkDays * 24 * 60 * 60 * 1000,
          endDate.getTime()
        )
      );

      chunks.push({
        since: new Date(currentStart),
        until: new Date(currentEnd)
      });

      currentStart = new Date(currentEnd.getTime() + 24 * 60 * 60 * 1000);
    }

    return chunks;
  }
}

/**
 * HELPER FUNCTIONS
 */

export async function syncEnhancedMetaData(options: EnhancedMetaSyncOptions) {
  const syncService = new EnhancedMetaDataSyncService(options.accessToken);
  return await syncService.syncEnhancedAccountData(options);
}

export async function getCachedEnhancedData(userId: string, metaAccountId: string) {
  await connectDB();

  const cache = await MetaAccountCache.findOne({
    userId,
    metaAccountId,
    isComplete: true
  });

  if (!cache) {
    throw new Error('Enhanced Meta account data not cached. Please sync first.');
  }

  const isStale = cache.lastUpdated < new Date(Date.now() - 12 * 60 * 60 * 1000); // 12 hours

  return {
    data: cache,
    isStale,
    lastUpdated: cache.lastUpdated,
    hasEnhancedData: !!(cache as { campaignSuccessMetrics?: unknown }).campaignSuccessMetrics
  };
}

// Legacy function names for backward compatibility
export async function syncMetaAccountData(options: EnhancedMetaSyncOptions) {
  return await syncEnhancedMetaData(options);
}

export async function getCachedMetaData(userId: string, metaAccountId: string) {
  await connectDB();

  const cache = await MetaAccountCache.findOne({
    userId,
    metaAccountId,
    isComplete: true
  });

  if (!cache) {
    throw new Error('Meta account data not cached. Please sync first.');
  }

  const isStale = cache.lastUpdated < new Date(Date.now() - 12 * 60 * 60 * 1000);

  return {
    data: cache,
    isStale,
    lastUpdated: cache.lastUpdated
  };
}

export async function getAccountMaturity(userId: string, metaAccountId: string): Promise<'not_connected' | 'early_stage' | 'partially_trained' | 'mature'> {
  try {
    const { data } = await getCachedMetaData(userId, metaAccountId);

    const campaignCount = (data.campaigns as unknown[])?.length || 0;
    const totalSpend = parseFloat((data.accountData as { amount_spent?: string })?.amount_spent || '0');
    const totalConversions = (data.insights as unknown[])?.reduce((sum: number, insight: unknown) => {
      const insightData = insight as { actions?: Array<{ action_type?: string; value?: string }> };
      const conversions = insightData.actions?.find((action) => action.action_type === 'offsite_conversion')?.value || '0';
      return sum + parseFloat(conversions);
    }, 0) || 0;

    if (campaignCount === 0 && totalSpend < 100) {
      return 'early_stage';
    } else if (campaignCount < 10 && totalConversions < 100) {
      return 'partially_trained';
    } else {
      return 'mature';
    }
  } catch (error) {
    console.error('Failed to determine account maturity:', error);
    return 'not_connected';
  }
}

export default EnhancedMetaDataSyncService;
