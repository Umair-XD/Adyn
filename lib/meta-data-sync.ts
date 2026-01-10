import MetaAccountCache from '@/models/MetaAccountCache';
import connectDB from './mongoose';

/**
 * COMPREHENSIVE META DATA SYNC SERVICE
 * 
 * This service fetches ALL Meta account data during integration
 * and stores it for lightning-fast campaign generation.
 * 
 * NO MORE RUNTIME API CALLS - Everything is pre-cached!
 */

export interface MetaSyncOptions {
  userId: string;
  metaAccountId: string;
  businessId: string;
  accessToken: string;
  forceRefresh?: boolean;
  timePeriod?: 'last_30_days' | 'last_90_days' | 'last_6_months' | 'last_year' | 'last_2_years' | 'last_5_years' | 'all_time';
}

export class MetaDataSyncService {
  private accessToken: string;
  private baseUrl = 'https://graph.facebook.com/v18.0';

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }

  /**
   * MAIN SYNC FUNCTION - Fetches ALL Meta data and caches it
   * Implements strict context separation: Ad Account vs Page vs Pixel
   */
  async syncCompleteAccountData(options: MetaSyncOptions): Promise<void> {
    console.log(`🔄 Starting COMPLETE Meta data sync for account ${options.metaAccountId}`);

    await connectDB();

    // Check if we need to sync
    if (!options.forceRefresh) {
      const existingCache = await MetaAccountCache.findOne({
        userId: options.userId,
        metaAccountId: options.metaAccountId
      });

      if (existingCache && existingCache.isComplete &&
        existingCache.lastUpdated > new Date(Date.now() - 24 * 60 * 60 * 1000)) {
        console.log('✅ Meta data cache is fresh, skipping sync');
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
      console.log('📊 Fetching complete account data...');
      console.log(`🔍 Account ID: ${options.metaAccountId}`);
      console.log(`🔑 Access token length: ${options.accessToken.length}`);
      console.log(`🏢 Business ID: ${options.businessId}`);

      // STRICT CONTEXT SEPARATION: Only fetch Ad Account data in Ad Account context

      // 1. AD ACCOUNT DATA (Core account info only)
      const accountData = await this.fetchAdAccountData(options.metaAccountId);
      console.log('✅ Ad Account data fetched');

      // 2. CAMPAIGNS DATA (Ad Account context only)
      const campaigns = await this.fetchAdAccountCampaigns(options.metaAccountId);
      console.log(`✅ ${campaigns.length} campaigns fetched`);

      // 3. AD SETS DATA (Ad Account context only)
      const adsets = await this.fetchAdAccountAdSets(options.metaAccountId);
      console.log(`✅ ${adsets.length} ad sets fetched`);

      // 4. ADS DATA (Ad Account context only)
      const ads = await this.fetchAdAccountAds(options.metaAccountId);
      console.log(`✅ ${ads.length} ads fetched`);

      // 5. INSIGHTS DATA (Ad Account context only)
      const insights = await this.fetchAdAccountInsights(options.metaAccountId, options.timePeriod || 'last_90_days');
      console.log(`✅ ${insights.length} insight records fetched for ${options.timePeriod || 'last_90_days'}`);

      // 6. CUSTOM AUDIENCES DATA (Ad Account context only)
      const customAudiences = await this.fetchAdAccountCustomAudiences(options.metaAccountId);
      console.log(`✅ ${customAudiences.length} custom audiences fetched`);

      // 7. PIXELS DATA (Ad Account context only)
      const pixels = await this.fetchAdAccountPixels(options.metaAccountId);
      console.log(`✅ ${pixels.length} pixels fetched`);

      // 8. PLACEMENT INSIGHTS (Expert Logic)
      const placementInsights = await this.fetchPlacementInsights(options.metaAccountId, options.timePeriod || 'last_90_days');
      console.log(`✅ ${placementInsights.length} placement breakdown records fetched`);

      // 9. DEMOGRAPHIC INSIGHTS (Expert Logic)
      const demographicInsights = await this.fetchDemographicInsights(options.metaAccountId, options.timePeriod || 'last_90_days');
      console.log(`✅ ${demographicInsights.length} demographic breakdown records fetched`);

      // Store everything in cache with time period info
      const endDate = new Date();
      let startDate: Date;

      switch (options.timePeriod || 'last_90_days') {
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
          customAudiences,
          pixels,
          // New Breakdown Data
          placementInsights,
          demographicInsights,

          lastUpdated: new Date(),
          timePeriod: options.timePeriod || 'last_90_days',
          insightsDateRange: {
            startDate,
            endDate
          },
          isComplete: true,
          syncStatus: 'completed',
          syncErrors: []
        },
        { upsert: true }
      );

      console.log('🎉 COMPLETE Meta data sync finished successfully!');

    } catch (error) {
      console.error('❌ Meta data sync failed:', error);

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
   * FAST CACHED DATA RETRIEVAL - No API calls!
   */
  async getCachedAccountData(userId: string, metaAccountId: string) {
    await connectDB();

    const cache = await MetaAccountCache.findOne({
      userId,
      metaAccountId,
      isComplete: true
    });

    if (!cache) {
      throw new Error('Meta account data not cached. Please sync first.');
    }

    // Check if cache is stale (older than 24 hours)
    const isStale = cache.lastUpdated < new Date(Date.now() - 24 * 60 * 60 * 1000);

    return {
      data: cache,
      isStale,
      lastUpdated: cache.lastUpdated
    };
  }

  // PRIVATE METHODS - AD ACCOUNT CONTEXT ONLY (Strict separation)

  /**
   * Fetch Ad Account data - ONLY Ad Account fields, NO Page fields
   */
  private async fetchAdAccountData(accountId: string) {
    const formattedAccountId = accountId.startsWith('act_') ? accountId : `act_${accountId}`;

    console.log(`🔍 Fetching AD ACCOUNT data for: ${formattedAccountId} (original: ${accountId})`);

    // STRICT AD ACCOUNT FIELDS ONLY - NO PAGE FIELDS
    const fields = [
      'account_id', 'name', 'account_status', 'currency', 'timezone_name',
      'created_time', 'amount_spent', 'balance', 'business_country_code',
      'timezone_offset_hours_utc', 'min_daily_budget', 'spend_cap',
      'is_personal', 'is_prepay_account', 'funding_source'
    ].join(',');

    return await this.makeAdAccountRequest(formattedAccountId, fields);
  }

  /**
   * Fetch campaigns - AD ACCOUNT CONTEXT ONLY
   */
  private async fetchAdAccountCampaigns(accountId: string) {
    const formattedAccountId = accountId.startsWith('act_') ? accountId : `act_${accountId}`;

    // AD ACCOUNT CAMPAIGN FIELDS ONLY
    const fields = [
      'id', 'name', 'status', 'objective', 'created_time', 'updated_time',
      'daily_budget', 'lifetime_budget', 'buying_type', 'bid_strategy',
      'configured_status', 'effective_status', 'budget_remaining',
      'start_time', 'stop_time', 'spend_cap'
    ].join(',');

    return await this.fetchAllPaginated(`${formattedAccountId}/campaigns`, fields);
  }

  /**
   * Fetch ad sets - AD ACCOUNT CONTEXT ONLY
   */
  private async fetchAdAccountAdSets(accountId: string) {
    const formattedAccountId = accountId.startsWith('act_') ? accountId : `act_${accountId}`;

    // AD ACCOUNT AD SET FIELDS ONLY
    const fields = [
      'id', 'name', 'status', 'configured_status', 'effective_status',
      'created_time', 'updated_time', 'campaign_id', 'daily_budget', 'lifetime_budget',
      'bid_amount', 'bid_strategy', 'billing_event', 'optimization_goal',
      'targeting', 'start_time', 'end_time', 'budget_remaining'
    ].join(',');

    return await this.fetchAllPaginated(`${formattedAccountId}/adsets`, fields);
  }

  /**
   * Fetch ads - AD ACCOUNT CONTEXT ONLY
   */
  private async fetchAdAccountAds(accountId: string) {
    const formattedAccountId = accountId.startsWith('act_') ? accountId : `act_${accountId}`;

    // AD ACCOUNT AD FIELDS WITH RICH CREATIVE DATA - Safer Set
    // Removed object_story_spec which can be huge and cause 500s
    const richFields = [
      'id', 'name', 'status', 'configured_status', 'effective_status',
      'created_time', 'updated_time', 'adset_id', 'campaign_id',
      'creative{id,name,title,body,image_url,thumbnail_url,call_to_action_type}',
      'bid_amount', 'bid_type'
    ].join(',');

    // Fallback fields if rich fetch fails
    const basicFields = [
      'id', 'name', 'status', 'configured_status', 'effective_status',
      'created_time', 'updated_time', 'adset_id', 'campaign_id',
      'creative', 'bid_amount', 'bid_type'
    ].join(',');

    try {
      console.log('Trying to fetch ads with RICH creative data...');
      return await this.fetchAllPaginated(`${formattedAccountId}/ads`, richFields);
    } catch (error) {
      console.warn('⚠️ Failed to fetch rich ad data (likely 500 error). Falling back to basic ad data.', error);
      return await this.fetchAllPaginated(`${formattedAccountId}/ads`, basicFields);
    }
  }

  /**
   * Fetch insights - AD ACCOUNT CONTEXT ONLY
   */
  private async fetchAdAccountInsights(accountId: string, timePeriod: 'last_30_days' | 'last_90_days' | 'last_6_months' | 'last_year' | 'last_2_years' | 'last_5_years' | 'all_time' = 'last_90_days') {
    const formattedAccountId = accountId.startsWith('act_') ? accountId : `act_${accountId}`;

    // AD ACCOUNT INSIGHTS FIELDS ONLY - NO PAGE METRICS
    const fields = [
      'date_start', 'date_stop', 'impressions', 'clicks', 'spend', 'reach',
      'frequency', 'cpm', 'cpc', 'ctr', 'conversions', 'conversion_values',
      'cost_per_conversion', 'campaign_id', 'campaign_name', 'adset_id', 'adset_name',
      'ad_id', 'ad_name', 'objective', 'actions', 'action_values'
    ].join(',');

    const endDate = new Date();
    let startDate: Date;

    // Calculate start date based on time period
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

    // Meta API has limits on date ranges (usually ~37 months max for ad-level insights)
    // To be safe and support "All Time" (10 years), we chunk requests by year.
    const allInsights: unknown[] = [];

    // Chunk size in milliseconds (1 year roughly)
    const CHUNK_SIZE = 365 * 24 * 60 * 60 * 1000;

    let currentEndDate = endDate;
    let currentStartDate = new Date(Math.max(startDate.getTime(), currentEndDate.getTime() - CHUNK_SIZE));

    while (currentEndDate > startDate) {
      console.log(`📊 Fetching AD ACCOUNT insights chunk: ${currentStartDate.toISOString().split('T')[0]} to ${currentEndDate.toISOString().split('T')[0]}`);

      const params = new URLSearchParams({
        fields,
        time_range: JSON.stringify({
          since: currentStartDate.toISOString().split('T')[0],
          until: currentEndDate.toISOString().split('T')[0]
        }),
        level: 'ad',
        limit: '1000'
      });

      try {
        const chunkData = await this.fetchAllPaginated(`${formattedAccountId}/insights`, fields, params);
        allInsights.push(...chunkData);
      } catch (error) {
        console.warn(`⚠️ Failed to fetch chunk ${currentStartDate.toISOString()} - ${currentEndDate.toISOString()}:`, error);
        // Continue to next chunk instead of failing entirely
      }

      // Move backward in time
      currentEndDate = new Date(currentStartDate.getTime() - 24 * 60 * 60 * 1000); // 1 day before start
      currentStartDate = new Date(Math.max(startDate.getTime(), currentEndDate.getTime() - CHUNK_SIZE));

      // Safety break
      if (currentEndDate < startDate) break;
    }

    return allInsights;
  }

  /**
   * Fetch custom audiences - AD ACCOUNT CONTEXT ONLY
   */
  private async fetchAdAccountCustomAudiences(accountId: string) {
    const formattedAccountId = accountId.startsWith('act_') ? accountId : `act_${accountId}`;

    // AD ACCOUNT CUSTOM AUDIENCE FIELDS ONLY
    const fields = [
      'id', 'name', 'description', 'approximate_count_lower_bound', 'approximate_count_upper_bound',
      'data_source', 'delivery_status', 'operation_status', 'subtype',
      'time_created', 'time_updated', 'retention_days'
    ].join(',');

    return await this.fetchAllPaginated(`${formattedAccountId}/customaudiences`, fields);
  }

  /**
   * Fetch pixels - AD ACCOUNT CONTEXT ONLY
   */
  private async fetchAdAccountPixels(accountId: string) {
    const formattedAccountId = accountId.startsWith('act_') ? accountId : `act_${accountId}`;

    // AD ACCOUNT PIXEL FIELDS ONLY
    const fields = [
      'id', 'name', 'code', 'creation_time', 'last_fired_time',
      'can_proxy', 'is_created_by_business', 'is_crm'
    ].join(',');

    return await this.fetchAllPaginated(`${formattedAccountId}/adspixels`, fields);
  }

  /**
   * Fetch Placement Insights (Platform, Position, Device)
   * Essential for "Expert Marketer" logic to know WHERE ads work best.
   */
  private async fetchPlacementInsights(accountId: string, timePeriod: 'last_30_days' | 'last_90_days' | 'last_6_months' | 'last_year' | 'last_2_years' | 'last_5_years' | 'all_time' = 'last_90_days') {
    const formattedAccountId = accountId.startsWith('act_') ? accountId : `act_${accountId}`;

    const fields = [
      'date_start', 'date_stop', 'impressions', 'spend', 'clicks',
      'ctr', 'cpc', 'cpm', 'actions', 'outbound_clicks', 'video_p50_watched_actions'
    ].join(',');

    const endDate = new Date();
    let startDate: Date;

    // Simple start date logic (same as main insights)
    switch (timePeriod) {
      case 'last_30_days': startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000); break;
      case 'last_90_days': startDate = new Date(endDate.getTime() - 90 * 24 * 60 * 60 * 1000); break;
      case 'last_6_months': startDate = new Date(endDate.getTime() - 180 * 24 * 60 * 60 * 1000); break;
      case 'last_year': startDate = new Date(endDate.getTime() - 365 * 24 * 60 * 60 * 1000); break;
      case 'last_2_years': startDate = new Date(endDate.getTime() - 2 * 365 * 24 * 60 * 60 * 1000); break;
      case 'last_5_years': startDate = new Date(endDate.getTime() - 5 * 365 * 24 * 60 * 60 * 1000); break;
      case 'all_time': startDate = new Date(endDate.getTime() - 10 * 365 * 24 * 60 * 60 * 1000); break;
      default: startDate = new Date(endDate.getTime() - 90 * 24 * 60 * 60 * 1000);
    }

    // Chunk logic for placement insights
    const allInsights: unknown[] = [];
    const CHUNK_SIZE = 365 * 24 * 60 * 60 * 1000;

    let currentEndDate = endDate;
    let currentStartDate = new Date(Math.max(startDate.getTime(), currentEndDate.getTime() - CHUNK_SIZE));

    while (currentEndDate > startDate) {
      console.log(`📊 Fetching PLACEMENT insights chunk: ${currentStartDate.toISOString().split('T')[0]} to ${currentEndDate.toISOString().split('T')[0]}`);

      const params = new URLSearchParams({
        fields,
        time_range: JSON.stringify({
          since: currentStartDate.toISOString().split('T')[0],
          until: currentEndDate.toISOString().split('T')[0]
        }),
        level: 'account',
        breakdowns: 'publisher_platform,platform_position,device_platform,impression_device',
        limit: '1000'
      });

      try {
        const chunkData = await this.fetchAllPaginated(`${formattedAccountId}/insights`, fields, params);
        if (chunkData.length > 0) {
          allInsights.push(...chunkData);
        }
      } catch (error) {
        console.warn(`⚠️ Failed to fetch placement chunk`, error);
      }

      // Move backward in time
      // Ensure we don't get stuck in an infinite loop due to floating point precision or dates not moving
      const prevEndDate = currentEndDate;
      currentEndDate = new Date(currentStartDate.getTime() - 24 * 60 * 60 * 1000);

      // Safety check to ensure progress
      if (currentEndDate >= prevEndDate) {
        currentEndDate = new Date(prevEndDate.getTime() - CHUNK_SIZE);
      }

      currentStartDate = new Date(Math.max(startDate.getTime(), currentEndDate.getTime() - CHUNK_SIZE));

      if (currentEndDate < startDate) break;
    }

    return allInsights;
  }

  /**
   * Fetch Demographic Insights (Age, Gender)
   * Essential for "Expert Marketer" logic to know WHO to target.
   */
  private async fetchDemographicInsights(accountId: string, timePeriod: 'last_30_days' | 'last_90_days' | 'last_6_months' | 'last_year' | 'last_2_years' | 'last_5_years' | 'all_time' = 'last_90_days') {
    const formattedAccountId = accountId.startsWith('act_') ? accountId : `act_${accountId}`;

    const fields = [
      'date_start', 'date_stop', 'impressions', 'spend', 'clicks',
      'ctr', 'cpc', 'cpm', 'actions', 'outbound_clicks', 'video_p50_watched_actions'
    ].join(',');

    const endDate = new Date();
    let startDate: Date;

    switch (timePeriod) {
      case 'last_30_days': startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000); break;
      case 'last_90_days': startDate = new Date(endDate.getTime() - 90 * 24 * 60 * 60 * 1000); break;
      case 'last_6_months': startDate = new Date(endDate.getTime() - 180 * 24 * 60 * 60 * 1000); break;
      case 'last_year': startDate = new Date(endDate.getTime() - 365 * 24 * 60 * 60 * 1000); break;
      case 'last_2_years': startDate = new Date(endDate.getTime() - 2 * 365 * 24 * 60 * 60 * 1000); break;
      case 'last_5_years': startDate = new Date(endDate.getTime() - 5 * 365 * 24 * 60 * 60 * 1000); break;
      case 'all_time': startDate = new Date(endDate.getTime() - 10 * 365 * 24 * 60 * 60 * 1000); break;
      default: startDate = new Date(endDate.getTime() - 90 * 24 * 60 * 60 * 1000);
    }

    // Chunk logic for demographics
    const allInsights: unknown[] = [];
    const CHUNK_SIZE = 365 * 24 * 60 * 60 * 1000;

    let currentEndDate = endDate;
    let currentStartDate = new Date(Math.max(startDate.getTime(), currentEndDate.getTime() - CHUNK_SIZE));

    while (currentEndDate > startDate) {
      console.log(`📊 Fetching DEMOGRAPHIC insights chunk: ${currentStartDate.toISOString().split('T')[0]} to ${currentEndDate.toISOString().split('T')[0]}`);

      const params = new URLSearchParams({
        fields,
        time_range: JSON.stringify({
          since: currentStartDate.toISOString().split('T')[0],
          until: currentEndDate.toISOString().split('T')[0]
        }),
        level: 'account',
        breakdowns: 'age,gender',
        limit: '1000'
      });

      try {
        const chunkData = await this.fetchAllPaginated(`${formattedAccountId}/insights`, fields, params);
        if (chunkData.length > 0) {
          allInsights.push(...chunkData);
        }
      } catch (error) {
        console.warn(`⚠️ Failed to fetch demographic chunk`, error);
      }

      // Move backward
      const prevEndDate = currentEndDate;
      currentEndDate = new Date(currentStartDate.getTime() - 24 * 60 * 60 * 1000);

      // Safety check
      if (currentEndDate >= prevEndDate) {
        currentEndDate = new Date(prevEndDate.getTime() - CHUNK_SIZE);
      }

      currentStartDate = new Date(Math.max(startDate.getTime(), currentEndDate.getTime() - CHUNK_SIZE));

      if (currentEndDate < startDate) break;
    }

    return allInsights;
  }

  /**
   * Make Ad Account request with error handling for Page-only fields
   */
  private async makeAdAccountRequest(accountId: string, fields: string) {
    const url = `${this.baseUrl}/${accountId}?fields=${fields}&access_token=${this.accessToken}`;
    console.log(`🌐 Making AD ACCOUNT request to: ${url.replace(this.accessToken, '[REDACTED]')}`);

    const response = await fetch(url);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Meta API Error (${response.status}):`, errorText);

      // Check for Page-only field errors and handle gracefully
      if (errorText.includes('parameter page_id is required') ||
        errorText.includes('show_checkout_experience')) {
        console.warn('⚠️ Page-only field detected in Ad Account request - this should not happen with current implementation');
        throw new Error('Page-only field in Ad Account context - implementation error');
      }

      throw new Error(`Failed to fetch account data: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    console.log(`✅ Ad Account data fetched successfully for ${accountId}`);
    return data;
  }

  private async fetchAllPaginated(endpoint: string, fields: string, extraParams?: URLSearchParams) {
    const allData: unknown[] = [];
    let nextUrl = `${this.baseUrl}/${endpoint}?fields=${fields}&limit=1000&access_token=${this.accessToken}`;

    if (extraParams) {
      nextUrl += `&${extraParams.toString()}`;
    }

    while (nextUrl) {
      const response = await fetch(nextUrl);

      if (!response.ok) {
        throw new Error(`Failed to fetch ${endpoint}: ${response.statusText}`);
      }

      const data = await response.json();
      allData.push(...(data.data || []));

      nextUrl = data.paging?.next || null;

      // Add small delay to avoid rate limits
      if (nextUrl) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    return allData;
  }
}

/**
 * HELPER FUNCTIONS FOR QUICK ACCESS
 */

export async function syncMetaAccountData(options: MetaSyncOptions) {
  const syncService = new MetaDataSyncService(options.accessToken);
  return await syncService.syncCompleteAccountData(options);
}

export async function getCachedMetaData(userId: string, metaAccountId: string) {
  const syncService = new MetaDataSyncService(''); // No token needed for cached data
  return await syncService.getCachedAccountData(userId, metaAccountId);
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