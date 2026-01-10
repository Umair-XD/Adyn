import axios from 'axios';

export interface MetaBusinessAccount {
  id: string;
  name: string;
  primary_page: {
    id: string;
    name: string;
  };
  created_time: string;
  updated_time: string;
  verification_status: string;
}

export interface MetaPortfolio {
  id: string;
  name: string;
  business_id: string;
  created_time: string;
  updated_time: string;
}

export interface MetaAccount {
  id: string;
  name: string;
  account_id: string;
  account_status: number;
  currency: string;
  timezone_name: string;
  business?: {
    id: string;
    name: string;
  };
  portfolio?: {
    id: string;
    name: string;
  };
}

export interface MetaPixel {
  id: string;
  name: string;
  creation_time: string;
  last_fired_time: string;
  code: string;
}

export interface MetaPixelEvent {
  event_name: string;
  event_time: number;
  user_data: Record<string, unknown>;
  custom_data: Record<string, unknown>;
  event_source_url: string;
}

export interface MetaCampaign {
  id: string;
  name: string;
  status: string;
  objective: string;
  created_time: string;
  updated_time: string;
  daily_budget?: string;
  lifetime_budget?: string;
  // Enhanced fields
  buying_type?: string;
  bid_strategy?: string;
  budget_optimization?: boolean;
  special_ad_categories?: string[];
  promoted_object?: Record<string, unknown>;
  source_campaign_id?: string;
  spend_cap?: string;
  account_id?: string;
}

export interface MetaAdSet {
  id: string;
  name: string;
  campaign_id: string;
  status: string;
  targeting: Record<string, unknown>;
  daily_budget?: string;
  lifetime_budget?: string;
  // Enhanced fields
  billing_event?: string;
  optimization_goal?: string;
  bid_amount?: number;
  bid_strategy?: string;
  attribution_spec?: Array<Record<string, unknown>>;
  destination_type?: string;
  promoted_object?: Record<string, unknown>;
  start_time?: string;
  end_time?: string;
  frequency_control_specs?: Array<Record<string, unknown>>;
  rf_prediction_id?: string;
  learning_stage_info?: Record<string, unknown>;
  pacing_type?: string[];
  budget_remaining?: string;
  created_time?: string;
  updated_time?: string;
}

export interface MetaAd {
  id: string;
  name: string;
  adset_id: string;
  status: string;
  creative: Record<string, unknown>;
  created_time: string;
  // Enhanced fields
  account_id?: string;
  campaign_id?: string;
  bid_amount?: number;
  bid_type?: string;
  configured_status?: string;
  effective_status?: string;
  last_updated_by_app_id?: string;
  recommendations?: Array<Record<string, unknown>>;
  source_ad_id?: string;
  tracking_specs?: Array<Record<string, unknown>>;
  conversion_specs?: Array<Record<string, unknown>>;
  updated_time?: string;
}

export interface MetaInsights {
  impressions: string;
  clicks: string;
  spend: string;
  cpm: string;
  cpc: string;
  ctr: string;
  reach: string;
  frequency: string;
  actions?: Array<{
    action_type: string;
    value: string;
  }>;
}

export interface MetaCreative {
  id: string;
  name: string;
  object_story_spec?: Record<string, unknown>;
  image_hash?: string;
  image_url?: string;
  thumbnail_url?: string;
  video_id?: string;
  body?: string;
  title?: string;
  call_to_action?: Record<string, unknown>;
  link_url?: string;
  object_type?: string;
  status?: string;
  created_time?: string;
  updated_time?: string;
}

export interface MetaTargeting {
  age_min?: number;
  age_max?: number;
  genders?: number[];
  geo_locations?: {
    countries?: string[];
    regions?: Array<{ key: string; name: string }>;
    cities?: Array<{ key: string; name: string; radius?: number; distance_unit?: string }>;
    location_types?: string[];
    custom_locations?: Array<Record<string, unknown>>;
  };
  interests?: Array<{ id: string; name: string }>;
  behaviors?: Array<{ id: string; name: string }>;
  demographics?: Array<{ id: string; name: string }>;
  connections?: Array<{ id: string; name: string }>;
  excluded_connections?: Array<{ id: string; name: string }>;
  custom_audiences?: Array<{ id: string; name: string }>;
  excluded_custom_audiences?: Array<{ id: string; name: string }>;
  lookalike_audiences?: Array<{ id: string; name: string }>;
  device_platforms?: string[];
  publisher_platforms?: string[];
  facebook_positions?: string[];
  instagram_positions?: string[];
  audience_network_positions?: string[];
  messenger_positions?: string[];
  locales?: string[];
  languages?: Array<{ id: string; name: string }>;
  relationship_statuses?: number[];
  education_statuses?: number[];
  college_years?: number[];
  education_schools?: Array<{ id: string; name: string }>;
  work_employers?: Array<{ id: string; name: string }>;
  work_positions?: Array<{ id: string; name: string }>;
  life_events?: Array<{ id: string; name: string }>;
  politics?: Array<{ id: string; name: string }>;
  income?: Array<{ id: string; name: string }>;
  net_worth?: Array<{ id: string; name: string }>;
  home_ownership?: Array<{ id: string; name: string }>;
  home_type?: Array<{ id: string; name: string }>;
  home_value?: Array<{ id: string; name: string }>;
  ethnic_affinity?: Array<{ id: string; name: string }>;
  generation?: Array<{ id: string; name: string }>;
  household_composition?: Array<{ id: string; name: string }>;
  moms?: Array<{ id: string; name: string }>;
  office_type?: Array<{ id: string; name: string }>;
  targeting_optimization?: string;
  flexible_spec?: Array<Record<string, unknown>>;
}

export interface CompleteCampaignData {
  campaign: MetaCampaign & {
    adsets?: CompleteAdSetData[];
    insights?: MetaInsights;
  };
}

export interface CompleteAdSetData {
  adset: MetaAdSet & {
    targeting_details?: MetaTargeting;
    ads?: CompleteAdData[];
    insights?: MetaInsights;
  };
}

export interface CompleteAdData {
  ad: MetaAd & {
    creative_details?: MetaCreative;
    insights?: MetaInsights;
  };
}

export class MetaAPIClient {
  private accessToken: string;
  private apiVersion: string = 'v21.0';
  private baseUrl: string = 'https://graph.facebook.com';

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }

  /**
   * Search for targeting options
   */
  async searchTargeting(query: string, type: string, limit: number = 25): Promise<unknown> {
    const response = await this.makeRequest('search', 'GET', {
      type: 'adTargetingCategory',
      class: type,
      q: query,
      limit
    });
    return response;
  }

  /**
   * Get reach estimate for targeting
   */
  async getReachEstimate(accountId: string, targeting: Record<string, unknown>): Promise<unknown> {
    const response = await this.makeRequest(
      `act_${accountId}/reachestimate`,
      'GET',
      {
        targeting_spec: JSON.stringify(targeting),
        optimize_for: 'NONE'
      }
    );
    return response;
  }

  /**
   * Create custom audience
   */
  async createCustomAudience(accountId: string, payload: Record<string, unknown>): Promise<unknown> {
    const response = await this.makeRequest(
      `act_${accountId}/customaudiences`,
      'POST',
      payload
    );
    return response;
  }

  /**
   * Upload users to custom audience
   */
  async uploadAudienceUsers(audienceId: string, payload: Record<string, unknown>): Promise<unknown> {
    const response = await this.makeRequest(
      `${audienceId}/users`,
      'POST',
      payload
    );
    return response;
  }

  private async makeRequest(endpoint: string, method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET', data?: Record<string, unknown>) {
    try {
      const url = `${this.baseUrl}/${this.apiVersion}/${endpoint}`;
      const config = {
        method,
        url,
        params: {
          access_token: this.accessToken,
          ...data
        },
        headers: {
          'Content-Type': 'application/json'
        }
      };

      if (method !== 'GET' && data) {
        config.params = { access_token: this.accessToken };
        (config as { data?: Record<string, unknown> }).data = data;
      }

      const response = await axios(config);
      return response.data;
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { error?: { message?: string } } }; message?: string };
      console.error('Meta API Error:', axiosError.response?.data || axiosError.message);
      throw new Error(`Meta API Error: ${axiosError.response?.data?.error?.message || axiosError.message}`);
    }
  }

  // Business Account Management
  async getBusinessAccounts(): Promise<MetaBusinessAccount[]> {
    const response = await this.makeRequest('me/businesses', 'GET', {
      fields: 'id,name,primary_page,created_time,updated_time,verification_status'
    });
    return response.data;
  }

  async getBusinessAccount(businessId: string): Promise<MetaBusinessAccount> {
    const response = await this.makeRequest(businessId, 'GET', {
      fields: 'id,name,primary_page,created_time,updated_time,verification_status'
    });
    return response;
  }

  // Portfolio Management
  async getPortfolios(businessId: string): Promise<MetaPortfolio[]> {
    // Note: Portfolio endpoint may not be available for all business accounts
    // This is a newer feature that might not be accessible to all apps
    try {
      const response = await this.makeRequest(`${businessId}/adaccountportfolios`, 'GET', {
        fields: 'id,name,business_id,created_time,updated_time'
      });
      return response.data;
    } catch {
      console.log('Portfolio endpoint not available, returning empty array');
      return [];
    }
  }

  async getPortfolioAdAccounts(portfolioId: string): Promise<MetaAccount[]> {
    const response = await this.makeRequest(`${portfolioId}/adaccounts`, 'GET', {
      fields: 'id,name,account_id,account_status,currency,timezone_name,business'
    });
    return response.data;
  }

  // Account Management (Updated)
  async getAdAccounts(businessId?: string): Promise<MetaAccount[]> {
    let endpoint = 'me/adaccounts';
    if (businessId) {
      // For business accounts, we need to use the owned_ad_accounts edge
      endpoint = `${businessId}/owned_ad_accounts`;
    }
    
    const response = await this.makeRequest(endpoint, 'GET', {
      fields: 'id,name,account_id,account_status,currency,timezone_name,business'
    });
    return response.data;
  }

  async getBusinessStructure(businessId: string): Promise<{
    business: MetaBusinessAccount;
    portfolios: Array<{
      portfolio: MetaPortfolio;
      adAccounts: MetaAccount[];
    }>;
    directAdAccounts: MetaAccount[];
  }> {
    // Get business info
    const business = await this.getBusinessAccount(businessId);
    
    // Try to get portfolios, but handle gracefully if not available
    let portfolios: MetaPortfolio[] = [];
    try {
      portfolios = await this.getPortfolios(businessId);
    } catch {
      console.log('Portfolios not available for this business account');
    }
    
    // Get ad accounts for each portfolio (if any)
    const portfoliosWithAccounts = await Promise.all(
      portfolios.map(async (portfolio) => {
        try {
          const adAccounts = await this.getPortfolioAdAccounts(portfolio.id);
          return { portfolio, adAccounts };
        } catch {
          console.log(`Failed to get ad accounts for portfolio ${portfolio.id}`);
          return { portfolio, adAccounts: [] };
        }
      })
    );
    
    // Get all business ad accounts
    const allBusinessAccounts = await this.getAdAccounts(businessId);
    
    // Find direct ad accounts (not in any portfolio)
    const portfolioAccountIds = portfoliosWithAccounts
      .flatMap(p => p.adAccounts)
      .map(acc => acc.account_id);
    
    const directAdAccounts = allBusinessAccounts.filter(
      acc => !portfolioAccountIds.includes(acc.account_id)
    );
    
    return {
      business,
      portfolios: portfoliosWithAccounts,
      directAdAccounts
    };
  }
  async getAdAccount(accountId: string): Promise<MetaAccount> {
    const response = await this.makeRequest(`act_${accountId}`, 'GET', {
      fields: 'id,name,account_id,account_status,currency,timezone_name'
    });
    return response;
  }

  // Pixel Management
  async getPixels(accountId: string): Promise<MetaPixel[]> {
    const response = await this.makeRequest(`act_${accountId}/adspixels`, 'GET', {
      fields: 'id,name,creation_time,last_fired_time,code'
    });
    return response.data;
  }

  async getPixelEvents(pixelId: string, startDate?: string, endDate?: string): Promise<unknown> {
    const params: Record<string, unknown> = {
      fields: 'event_name,count,unique_count'
    };
    
    if (startDate) {
      params.time_range = JSON.stringify({ 
        since: startDate, 
        until: endDate || new Date().toISOString().split('T')[0] 
      });
    }
    
    // Use the correct endpoint for pixel events
    const response = await this.makeRequest(`${pixelId}/events`, 'GET', params);
    return response.data;
  }

  // Alternative method to get pixel insights
  async getPixelInsights(pixelId: string, startDate?: string, endDate?: string): Promise<unknown> {
    const params: Record<string, unknown> = {
      fields: 'event_name,count,unique_count,cost_per_action_type'
    };
    
    if (startDate) {
      params.time_range = JSON.stringify({ 
        since: startDate, 
        until: endDate || new Date().toISOString().split('T')[0] 
      });
    }
    
    try {
      // Try the insights endpoint first
      const response = await this.makeRequest(`${pixelId}/insights`, 'GET', params);
      return response.data;
    } catch (error) {
      // Fallback to stats endpoint
      try {
        const response = await this.makeRequest(`${pixelId}/stats`, 'GET', params);
        return response.data;
      } catch (fallbackError) {
        console.error('Both pixel endpoints failed:', error, fallbackError);
        return [];
      }
    }
  }

  // Campaign Management - Enhanced
  async getCampaigns(accountId: string): Promise<MetaCampaign[]> {
    const response = await this.makeRequest(`act_${accountId}/campaigns`, 'GET', {
      fields: 'id,name,status,objective,created_time,updated_time,daily_budget,lifetime_budget,buying_type,bid_strategy,budget_optimization,special_ad_categories,promoted_object,source_campaign_id,spend_cap,account_id'
    });
    return response.data;
  }

  async getCampaignComplete(campaignId: string, includeInsights: boolean = true): Promise<CompleteCampaignData> {
    // Get campaign details
    const campaign = await this.makeRequest(campaignId, 'GET', {
      fields: 'id,name,status,objective,created_time,updated_time,daily_budget,lifetime_budget,buying_type,bid_strategy,budget_optimization,special_ad_categories,promoted_object,source_campaign_id,spend_cap,account_id'
    });

    // Get campaign insights if requested
    let campaignInsights = null;
    if (includeInsights) {
      try {
        const insightsResponse = await this.makeRequest(`${campaignId}/insights`, 'GET', {
          fields: 'impressions,clicks,spend,cpm,cpc,ctr,reach,frequency,actions,action_values,conversions,conversion_values,cost_per_action_type'
        });
        campaignInsights = insightsResponse.data[0] || null;
      } catch (error) {
        console.warn(`Failed to get insights for campaign ${campaignId}:`, error);
      }
    }

    // Get all adsets for this campaign
    const adsets = await this.getAdSetsComplete(campaignId, includeInsights);

    return {
      campaign: {
        ...campaign,
        adsets,
        insights: campaignInsights
      }
    };
  }

  async getAdSetsComplete(campaignId: string, includeInsights: boolean = true): Promise<CompleteAdSetData[]> {
    // Get adsets with enhanced fields
    const adsetsResponse = await this.makeRequest(`${campaignId}/adsets`, 'GET', {
      fields: 'id,name,campaign_id,status,targeting,daily_budget,lifetime_budget,billing_event,optimization_goal,bid_amount,bid_strategy,attribution_spec,destination_type,promoted_object,start_time,end_time,frequency_control_specs,rf_prediction_id,learning_stage_info,pacing_type,budget_remaining,created_time,updated_time'
    });

    const adsets = adsetsResponse.data;

    // Get complete data for each adset
    const completeAdSets = await Promise.all(
      adsets.map(async (adset: MetaAdSet) => {
        // Get adset insights if requested
        let adsetInsights = null;
        if (includeInsights) {
          try {
            const insightsResponse = await this.makeRequest(`${adset.id}/insights`, 'GET', {
              fields: 'impressions,clicks,spend,cpm,cpc,ctr,reach,frequency,actions,action_values,conversions,conversion_values,cost_per_action_type'
            });
            adsetInsights = insightsResponse.data[0] || null;
          } catch (error) {
            console.warn(`Failed to get insights for adset ${adset.id}:`, error);
          }
        }

        // Get all ads for this adset
        const ads = await this.getAdsComplete(adset.id, includeInsights);

        return {
          adset: {
            ...adset,
            targeting_details: adset.targeting as MetaTargeting,
            ads,
            insights: adsetInsights
          }
        };
      })
    );

    return completeAdSets;
  }

  async getAdsComplete(adsetId: string, includeInsights: boolean = true): Promise<CompleteAdData[]> {
    // Get ads with enhanced fields
    const adsResponse = await this.makeRequest(`${adsetId}/ads`, 'GET', {
      fields: 'id,name,adset_id,status,creative,created_time,account_id,campaign_id,bid_amount,bid_type,configured_status,effective_status,last_updated_by_app_id,recommendations,source_ad_id,tracking_specs,conversion_specs,updated_time'
    });

    const ads = adsResponse.data;

    // Get complete data for each ad
    const completeAds = await Promise.all(
      ads.map(async (ad: MetaAd) => {
        // Get creative details
        let creativeDetails = null;
        if (ad.creative && (ad.creative as { id?: string }).id) {
          try {
            creativeDetails = await this.makeRequest((ad.creative as { id: string }).id, 'GET', {
              fields: 'id,name,object_story_spec,image_hash,image_url,thumbnail_url,video_id,body,title,call_to_action,link_url,object_type,status,created_time,updated_time'
            });
          } catch (error) {
            console.warn(`Failed to get creative details for ad ${ad.id}:`, error);
          }
        }

        // Get ad insights if requested
        let adInsights = null;
        if (includeInsights) {
          try {
            const insightsResponse = await this.makeRequest(`${ad.id}/insights`, 'GET', {
              fields: 'impressions,clicks,spend,cpm,cpc,ctr,reach,frequency,actions,action_values,conversions,conversion_values,cost_per_action_type'
            });
            adInsights = insightsResponse.data[0] || null;
          } catch (error) {
            console.warn(`Failed to get insights for ad ${ad.id}:`, error);
          }
        }

        return {
          ad: {
            ...ad,
            creative_details: creativeDetails,
            insights: adInsights
          }
        };
      })
    );

    return completeAds;
  }

  // Get all campaigns with complete data for an account
  async getAllCampaignsComplete(accountId: string, includeInsights: boolean = true): Promise<CompleteCampaignData[]> {
    const campaigns = await this.getCampaigns(accountId);
    
    const completeCampaigns = await Promise.all(
      campaigns.map(async (campaign) => {
        try {
          return await this.getCampaignComplete(campaign.id, includeInsights);
        } catch (error) {
          console.error(`Failed to get complete data for campaign ${campaign.id}:`, error);
          return {
            campaign: {
              ...campaign,
              adsets: [],
              insights: undefined
            }
          };
        }
      })
    );

    return completeCampaigns;
  }

  async createCampaign(accountId: string, campaignData: {
    name: string;
    objective: string;
    status?: string;
    daily_budget?: number;
    lifetime_budget?: number;
  }): Promise<MetaCampaign> {
    const response = await this.makeRequest(`act_${accountId}/campaigns`, 'POST', {
      name: campaignData.name,
      objective: campaignData.objective,
      status: campaignData.status || 'PAUSED',
      ...(campaignData.daily_budget && { daily_budget: campaignData.daily_budget }),
      ...(campaignData.lifetime_budget && { lifetime_budget: campaignData.lifetime_budget })
    });
    return response;
  }

  // Ad Set Management - Enhanced
  async getAdSets(accountId: string, campaignId?: string): Promise<MetaAdSet[]> {
    const endpoint = campaignId ? `${campaignId}/adsets` : `act_${accountId}/adsets`;
    const response = await this.makeRequest(endpoint, 'GET', {
      fields: 'id,name,campaign_id,status,targeting,daily_budget,lifetime_budget,billing_event,optimization_goal,bid_amount,bid_strategy,attribution_spec,destination_type,promoted_object,start_time,end_time,frequency_control_specs,rf_prediction_id,learning_stage_info,pacing_type,budget_remaining,created_time,updated_time'
    });
    return response.data;
  }

  async createAdSet(accountId: string, adSetData: {
    name: string;
    campaign_id: string;
    targeting: Record<string, unknown>;
    daily_budget?: number;
    lifetime_budget?: number;
    billing_event?: string;
    optimization_goal?: string;
    status?: string;
    // Enhanced fields
    bid_amount?: number;
    bid_strategy?: string;
    attribution_spec?: Array<Record<string, unknown>>;
    destination_type?: string;
    promoted_object?: Record<string, unknown>;
    start_time?: string;
    end_time?: string;
    frequency_control_specs?: Array<Record<string, unknown>>;
    pacing_type?: string[];
  }): Promise<MetaAdSet> {
    const response = await this.makeRequest(`act_${accountId}/adsets`, 'POST', {
      name: adSetData.name,
      campaign_id: adSetData.campaign_id,
      targeting: adSetData.targeting,
      billing_event: adSetData.billing_event || 'IMPRESSIONS',
      optimization_goal: adSetData.optimization_goal || 'REACH',
      status: adSetData.status || 'PAUSED',
      ...(adSetData.daily_budget && { daily_budget: adSetData.daily_budget }),
      ...(adSetData.lifetime_budget && { lifetime_budget: adSetData.lifetime_budget }),
      ...(adSetData.bid_amount && { bid_amount: adSetData.bid_amount }),
      ...(adSetData.bid_strategy && { bid_strategy: adSetData.bid_strategy }),
      ...(adSetData.attribution_spec && { attribution_spec: adSetData.attribution_spec }),
      ...(adSetData.destination_type && { destination_type: adSetData.destination_type }),
      ...(adSetData.promoted_object && { promoted_object: adSetData.promoted_object }),
      ...(adSetData.start_time && { start_time: adSetData.start_time }),
      ...(adSetData.end_time && { end_time: adSetData.end_time }),
      ...(adSetData.frequency_control_specs && { frequency_control_specs: adSetData.frequency_control_specs }),
      ...(adSetData.pacing_type && { pacing_type: adSetData.pacing_type })
    });
    return response;
  }

  // Creative Management
  async createCreative(accountId: string, creativeData: {
    name: string;
    object_story_spec?: Record<string, unknown>;
    image_hash?: string;
    video_id?: string;
    body?: string;
    title?: string;
    call_to_action?: Record<string, unknown>;
    link_url?: string;
  }): Promise<unknown> {
    const response = await this.makeRequest(`act_${accountId}/adcreatives`, 'POST', creativeData);
    return response;
  }

  // Ad Management - Enhanced
  async createAd(accountId: string, adData: {
    name: string;
    adset_id: string;
    creative: { creative_id: string };
    status?: string;
  }): Promise<unknown> {
    const response = await this.makeRequest(`act_${accountId}/ads`, 'POST', adData);
    return response;
  }

  // Campaign Management - Enhanced
  async deleteCampaign(campaignId: string): Promise<unknown> {
    const response = await this.makeRequest(campaignId, 'POST', { status: 'DELETED' });
    return response;
  }

  async getCampaignStatus(campaignId: string): Promise<unknown> {
    const response = await this.makeRequest(campaignId, 'GET', {
      fields: 'id,name,status,effective_status,delivery_info,issues_info'
    });
    return response;
  }

  async getAdDetails(adId: string): Promise<unknown> {
    const response = await this.makeRequest(adId, 'GET', {
      fields: 'id,name,adset_id,creative,tracking_specs,conversion_specs'
    });
    return response;
  }

  async getAdSetDetails(adsetId: string): Promise<unknown> {
    const response = await this.makeRequest(adsetId, 'GET', {
      fields: 'targeting'
    });
    return response;
  }

  async getCreativeDetails(creativeId: string): Promise<unknown> {
    const response = await this.makeRequest(creativeId, 'GET', {
      fields: 'body,title,call_to_action_type,image_hash,image_url,video_id,thumbnail_url,link_url'
    });
    return response;
  }

  // Create Ad Creative
  async createAdCreative(accountId: string, creativeData: {
    name: string;
    object_story_spec?: Record<string, unknown>;
    image_hash?: string;
    video_id?: string;
    body?: string;
    title?: string;
    call_to_action?: Record<string, unknown>;
    link_url?: string;
    object_type?: string;
  }): Promise<MetaCreative> {
    const response = await this.makeRequest(`act_${accountId}/adcreatives`, 'POST', creativeData);
    return response;
  }

  // Create Complete Campaign with AdSets and Ads
  async createCompleteCampaign(accountId: string, campaignStructure: {
    campaign: {
      name: string;
      objective: string;
      status?: string;
      daily_budget?: number;
      lifetime_budget?: number;
      buying_type?: string;
      bid_strategy?: string;
      special_ad_categories?: string[];
    };
    adsets: Array<{
      name: string;
      targeting: Record<string, unknown>;
      daily_budget?: number;
      lifetime_budget?: number;
      billing_event?: string;
      optimization_goal?: string;
      bid_amount?: number;
      ads: Array<{
        name: string;
        creative: {
          name: string;
          object_story_spec?: Record<string, unknown>;
          image_hash?: string;
          video_id?: string;
          body?: string;
          title?: string;
          call_to_action?: Record<string, unknown>;
          link_url?: string;
        };
      }>;
    }>;
  }): Promise<{
    campaign: MetaCampaign;
    adsets: Array<{
      adset: MetaAdSet;
      ads: Array<{
        ad: MetaAd;
        creative: MetaCreative;
      }>;
    }>;
  }> {
    // Create campaign
    const campaign = await this.createCampaign(accountId, campaignStructure.campaign);

    // Create adsets and ads
    const createdAdSets = await Promise.all(
      campaignStructure.adsets.map(async (adsetData) => {
        // Create adset
        const adset = await this.createAdSet(accountId, {
          ...adsetData,
          campaign_id: campaign.id
        });

        // Create ads for this adset
        const createdAds = await Promise.all(
          adsetData.ads.map(async (adData) => {
            // Create creative first
            const creative = await this.createAdCreative(accountId, adData.creative);

            // Create ad with creative
            const ad = await this.createAd(accountId, {
              name: adData.name,
              adset_id: adset.id,
              creative: { creative_id: creative.id }
            });

            return { ad: ad as MetaAd, creative };
          })
        );

        return { adset, ads: createdAds };
      })
    );

    return {
      campaign,
      adsets: createdAdSets
    };
  }

  // Ad Management - Enhanced
  async getAds(accountId: string, adSetId?: string): Promise<MetaAd[]> {
    const endpoint = adSetId ? `${adSetId}/ads` : `act_${accountId}/ads`;
    const response = await this.makeRequest(endpoint, 'GET', {
      fields: 'id,name,adset_id,status,creative,created_time,account_id,campaign_id,bid_amount,bid_type,configured_status,effective_status,last_updated_by_app_id,recommendations,source_ad_id,tracking_specs,conversion_specs,updated_time'
    });
    return response.data;
  }

  // Insights and Analytics
  async getCampaignInsights(campaignId: string, dateRange?: { since: string; until: string }): Promise<MetaInsights> {
    const params: Record<string, unknown> = {
      fields: 'impressions,clicks,spend,cpm,cpc,ctr,reach,frequency,actions'
    };
    
    if (dateRange) {
      params.time_range = dateRange;
    }
    
    const response = await this.makeRequest(`${campaignId}/insights`, 'GET', params);
    return response.data[0] || {};
  }

  async getAdSetInsights(adSetId: string, dateRange?: { since: string; until: string }): Promise<MetaInsights> {
    const params: Record<string, unknown> = {
      fields: 'impressions,clicks,spend,cpm,cpc,ctr,reach,frequency,actions'
    };
    
    if (dateRange) {
      params.time_range = dateRange;
    }
    
    const response = await this.makeRequest(`${adSetId}/insights`, 'GET', params);
    return response.data[0] || {};
  }

  // Get detailed audience information for custom audiences
  async getCustomAudienceDetails(audienceId: string): Promise<{
    audience: unknown;
    size: number;
    overlap_analysis?: unknown;
    demographics?: unknown;
  }> {
    const audience = await this.makeRequest(audienceId, 'GET', {
      fields: 'id,name,description,approximate_count,data_source,delivery_status,operation_status,opt_out_link,permission_for_actions,pixel_id,retention_days,rule,rule_aggregation,subtype,lookalike_spec,origin_audience_id,lookalike_audience_ids,seed_audience,exclusions,inclusions,customer_file_source,is_household,is_value_based,is_snapshot'
    });

    // Get audience size
    let size = 0;
    try {
      const sizeResponse = await this.makeRequest(`${audienceId}/`, 'GET', {
        fields: 'approximate_count_lower_bound,approximate_count_upper_bound'
      });
      size = sizeResponse.approximate_count_upper_bound || 0;
    } catch {
      size = audience.approximate_count || 0;
    }

    // Get overlap analysis with other audiences (if available)
    let overlap_analysis = null;
    try {
      overlap_analysis = await this.makeRequest(`${audienceId}/audienceinsights`, 'GET', {
        fields: 'audience_size,audience_size_lower_bound,audience_size_upper_bound'
      });
    } catch {
      // Overlap analysis might not be available
    }

    return {
      audience,
      size,
      overlap_analysis
    };
  }

  // Get lookalike audience source information
  async getLookalikeAudienceSource(audienceId: string): Promise<{
    source_audience: unknown;
    ratio: number;
    target_countries: string[];
    quality_score?: number;
  }> {
    const audience = await this.makeRequest(audienceId, 'GET', {
      fields: 'lookalike_spec,origin_audience_id,target_countries,ratio'
    });

    let source_audience = null;
    if (audience.origin_audience_id) {
      try {
        source_audience = await this.makeRequest(audience.origin_audience_id, 'GET', {
          fields: 'id,name,approximate_count,data_source'
        });
      } catch {
        // Source audience might not be accessible
      }
    }

    return {
      source_audience,
      ratio: audience.ratio || 0.01,
      target_countries: audience.target_countries || [],
      quality_score: audience.lookalike_spec?.quality_score
    };
  }
  async getHistoricalCampaignInsights(accountId: string, options?: {
    dateRange?: { since: string; until: string };
    limit?: number;
    level?: 'campaign' | 'adset' | 'ad';
    breakdowns?: string[];
    actionBreakdowns?: string[];
  }): Promise<unknown[]> {
    const params: Record<string, unknown> = {
      fields: 'campaign_id,campaign_name,adset_id,adset_name,ad_id,ad_name,impressions,clicks,spend,cpm,cpc,ctr,reach,frequency,actions,action_values,conversions,conversion_values,cost_per_action_type,cost_per_conversion,objective,optimization_goal,targeting',
      level: options?.level || 'campaign',
      limit: options?.limit || 100
    };
    
    if (options?.dateRange) {
      params.time_range = options.dateRange;
    }
    
    if (options?.breakdowns) {
      params.breakdowns = options.breakdowns.join(',');
    }
    
    if (options?.actionBreakdowns) {
      params.action_breakdowns = options.actionBreakdowns.join(',');
    }
    
    const response = await this.makeRequest(`act_${accountId}/insights`, 'GET', params);
    return response.data || [];
  }

  async getAdInsights(adId: string, dateRange?: { since: string; until: string }): Promise<MetaInsights> {
    const params: Record<string, unknown> = {
      fields: 'impressions,clicks,spend,cpm,cpc,ctr,reach,frequency,actions,action_values,conversions,conversion_values,cost_per_action_type'
    };
    
    if (dateRange) {
      params.time_range = dateRange;
    }
    
    const response = await this.makeRequest(`${adId}/insights`, 'GET', params);
    return response.data[0] || {};
  }

  async getTopPerformingAds(accountId: string, options?: {
    dateRange?: { since: string; until: string };
    metric?: 'ctr' | 'cpc' | 'cpm' | 'roas' | 'conversions';
    limit?: number;
    objective?: string;
  }): Promise<unknown[]> {
    const params: Record<string, unknown> = {
      fields: 'ad_id,ad_name,adset_id,adset_name,campaign_id,campaign_name,impressions,clicks,spend,cpm,cpc,ctr,reach,frequency,actions,action_values,conversions,conversion_values,cost_per_action_type,creative,targeting',
      level: 'ad',
      limit: options?.limit || 50,
      sort: [`${options?.metric || 'ctr'}:descending`]
    };
    
    if (options?.dateRange) {
      params.time_range = options.dateRange;
    }
    
    if (options?.objective) {
      params.filtering = JSON.stringify([{
        field: 'objective',
        operator: 'EQUAL',
        value: options.objective
      }]);
    }
    
    const response = await this.makeRequest(`act_${accountId}/insights`, 'GET', params);
    return response.data || [];
  }

  // Enhanced method to get winning campaigns with complete data
  async getWinningCampaigns(accountId: string, options?: {
    dateRange?: { since: string; until: string };
    minSpend?: number;
    minROAS?: number;
    limit?: number;
    sortBy?: 'roas' | 'ctr' | 'conversions' | 'spend';
  }): Promise<Array<CompleteCampaignData & { performance_score: number }>> {
    const { 
      dateRange = { 
        since: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], 
        until: new Date().toISOString().split('T')[0] 
      },
      minSpend = 100,
      minROAS = 2.0,
      limit = 20,
      sortBy = 'roas'
    } = options || {};

    // Get high-performing campaigns based on insights
    const insights = await this.getHistoricalCampaignInsights(accountId, {
      dateRange,
      level: 'campaign',
      limit: 100
    });

    // Filter and score campaigns
    const scoredCampaigns = (insights as unknown[])
      .filter((insight: unknown) => {
        const insightData = insight as Record<string, unknown>;
        const spend = parseFloat((insightData.spend as string) || '0');
        const conversions = parseFloat((insightData.conversions as string) || '0');
        const conversionValue = parseFloat((insightData.conversion_values as string) || '0');
        const roas = spend > 0 ? conversionValue / spend : 0;
        
        return spend >= minSpend && roas >= minROAS && conversions > 0;
      })
      .map((insight: unknown) => {
        const insightData = insight as Record<string, unknown>;
        const spend = parseFloat((insightData.spend as string) || '0');
        const clicks = parseFloat((insightData.clicks as string) || '0');
        const impressions = parseFloat((insightData.impressions as string) || '0');
        const conversions = parseFloat((insightData.conversions as string) || '0');
        const conversionValue = parseFloat((insightData.conversion_values as string) || '0');
        
        const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;
        const roas = spend > 0 ? conversionValue / spend : 0;
        const cpc = clicks > 0 ? spend / clicks : 0;
        const conversionRate = clicks > 0 ? (conversions / clicks) * 100 : 0;
        
        // Calculate performance score (0-100)
        const roasScore = Math.min(roas * 10, 50); // Max 50 points for ROAS
        const ctrScore = Math.min(ctr * 5, 25); // Max 25 points for CTR
        const conversionScore = Math.min(conversionRate * 2.5, 25); // Max 25 points for conversion rate
        
        const performance_score = roasScore + ctrScore + conversionScore;
        
        return {
          ...insightData,
          performance_metrics: {
            roas,
            ctr,
            cpc,
            conversionRate,
            spend,
            conversions,
            conversionValue
          },
          performance_score
        };
      })
      .sort((a: unknown, b: unknown) => {
        const aData = a as { performance_metrics: { roas: number; ctr: number; conversions: number; spend: number }; performance_score: number };
        const bData = b as { performance_metrics: { roas: number; ctr: number; conversions: number; spend: number }; performance_score: number };
        switch (sortBy) {
          case 'roas':
            return bData.performance_metrics.roas - aData.performance_metrics.roas;
          case 'ctr':
            return bData.performance_metrics.ctr - aData.performance_metrics.ctr;
          case 'conversions':
            return bData.performance_metrics.conversions - aData.performance_metrics.conversions;
          case 'spend':
            return bData.performance_metrics.spend - aData.performance_metrics.spend;
          default:
            return bData.performance_score - aData.performance_score;
        }
      })
      .slice(0, limit);

    // Get complete campaign data for top performers
    const completeCampaigns = await Promise.all(
      scoredCampaigns.map(async (campaignInsight: unknown) => {
        const insightData = campaignInsight as Record<string, unknown>;
        try {
          const completeData = await this.getCampaignComplete(insightData.campaign_id as string, false);
          return {
            ...completeData,
            performance_score: insightData.performance_score,
            performance_metrics: insightData.performance_metrics,
            insights: campaignInsight
          };
        } catch (error) {
          console.warn(`Failed to get complete data for campaign ${(campaignInsight as { campaign_id: string }).campaign_id}:`, error);
          return null;
        }
      })
    );

    return completeCampaigns.filter(Boolean) as Array<CompleteCampaignData & { performance_score: number }>;
  }

  // Get detailed targeting breakdown for analysis
  async getTargetingBreakdown(accountId: string, options?: {
    dateRange?: { since: string; until: string };
    level?: 'campaign' | 'adset' | 'ad';
    breakdowns?: string[];
  }): Promise<unknown[]> {
    const { 
      dateRange = { 
        since: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], 
        until: new Date().toISOString().split('T')[0] 
      },
      level = 'adset',
      breakdowns = ['age', 'gender', 'country', 'region', 'impression_device', 'platform_position']
    } = options || {};

    const results = [];

    // Get insights for each breakdown separately (Meta API limitation)
    for (const breakdown of breakdowns) {
      try {
        const insights = await this.getHistoricalCampaignInsights(accountId, {
          dateRange,
          level,
          breakdowns: [breakdown],
          limit: 1000
        });

        results.push({
          breakdown,
          data: insights
        });
      } catch (error) {
        console.warn(`Failed to get breakdown for ${breakdown}:`, error);
      }
    }

    return results;
  }

  // Get creative performance analysis
  async getCreativePerformanceAnalysis(accountId: string, options?: {
    dateRange?: { since: string; until: string };
    minSpend?: number;
    limit?: number;
  }): Promise<Array<{
    ad: MetaAd;
    creative: MetaCreative;
    insights: MetaInsights;
    performance_score: number;
  }>> {
    const { 
      dateRange = { 
        since: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], 
        until: new Date().toISOString().split('T')[0] 
      },
      minSpend = 50,
      limit = 50
    } = options || {};

    // Get ad-level insights
    const adInsights = await this.getHistoricalCampaignInsights(accountId, {
      dateRange,
      level: 'ad',
      limit: 500
    });

    // Filter and score ads
    const scoredAds = (adInsights as unknown[])
      .filter((insight: unknown) => {
        const insightData = insight as Record<string, unknown>;
        return parseFloat((insightData.spend as string) || '0') >= minSpend;
      })
      .map((insight: unknown) => {
        const insightData = insight as Record<string, unknown>;
        const spend = parseFloat((insightData.spend as string) || '0');
        const clicks = parseFloat((insightData.clicks as string) || '0');
        const impressions = parseFloat((insightData.impressions as string) || '0');
        const conversions = parseFloat((insightData.conversions as string) || '0');
        const conversionValue = parseFloat((insightData.conversion_values as string) || '0');
        
        const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;
        const roas = spend > 0 ? conversionValue / spend : 0;
        const conversionRate = clicks > 0 ? (conversions / clicks) * 100 : 0;
        
        // Performance score for creatives
        const performance_score = (ctr * 0.4) + (roas * 10 * 0.4) + (conversionRate * 0.2);
        
        return {
          ...insightData,
          performance_score
        };
      })
      .sort((a: unknown, b: unknown) => {
        const aData = a as { performance_score: number };
        const bData = b as { performance_score: number };
        return bData.performance_score - aData.performance_score;
      })
      .slice(0, limit);

    // Get complete ad and creative data
    const completeAds = await Promise.all(
      scoredAds.map(async (adInsight: unknown) => {
        try {
          // Get ad details
          const ad = await this.makeRequest((adInsight as { ad_id: string }).ad_id, 'GET', {
            fields: 'id,name,adset_id,status,creative,created_time,account_id,campaign_id'
          });

          // Get creative details
          let creative = null;
          if (ad.creative && ad.creative.id) {
            try {
              creative = await this.makeRequest(ad.creative.id, 'GET', {
                fields: 'id,name,object_story_spec,image_hash,image_url,thumbnail_url,video_id,body,title,call_to_action,link_url,object_type,status'
              });
            } catch (error) {
              console.warn(`Failed to get creative for ad ${ad.id}:`, error);
            }
          }

          return {
            ad,
            creative,
            insights: adInsight,
            performance_score: (adInsight as { performance_score: number }).performance_score
          };
        } catch (error) {
          console.warn(`Failed to get ad data for ${(adInsight as { ad_id: string }).ad_id}:`, error);
          return null;
        }
      })
    );

    return completeAds.filter(Boolean) as Array<{
      ad: MetaAd;
      creative: MetaCreative;
      insights: MetaInsights;
      performance_score: number;
    }>;
  }

  // Get audience insights with detailed demographics
  async getDetailedAudienceInsights(accountId: string, options?: {
    dateRange?: { since: string; until: string };
    campaignIds?: string[];
    adsetIds?: string[];
  }): Promise<{
    demographics: unknown[];
    interests: unknown[];
    behaviors: unknown[];
    geographic: unknown[];
    devices: unknown[];
    placements: unknown[];
  }> {
    const { 
      dateRange = { 
        since: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], 
        until: new Date().toISOString().split('T')[0] 
      },
      campaignIds,
      adsetIds
    } = options || {};

    const results = {
      demographics: [] as unknown[],
      interests: [] as unknown[],
      behaviors: [] as unknown[],
      geographic: [] as unknown[],
      devices: [] as unknown[],
      placements: [] as unknown[]
    };

    // Define breakdown categories
    const breakdownCategories = [
      { key: 'demographics', breakdowns: ['age', 'gender'] },
      { key: 'geographic', breakdowns: ['country', 'region', 'dma'] },
      { key: 'devices', breakdowns: ['impression_device', 'device_platform'] },
      { key: 'placements', breakdowns: ['platform_position', 'publisher_platform'] }
    ];

    // Get insights for each category
    for (const category of breakdownCategories) {
      for (const breakdown of category.breakdowns) {
        try {
          let insights;
          
          if (campaignIds && campaignIds.length > 0) {
            // Get insights for specific campaigns
            insights = await Promise.all(
              campaignIds.map(campaignId => 
                this.makeRequest(`${campaignId}/insights`, 'GET', {
                  fields: 'impressions,clicks,spend,cpm,cpc,ctr,reach,frequency,conversions,conversion_values',
                  breakdowns: [breakdown],
                  time_range: dateRange,
                  limit: 1000
                })
              )
            );
            insights = insights.flatMap(result => result.data || []);
          } else if (adsetIds && adsetIds.length > 0) {
            // Get insights for specific adsets
            insights = await Promise.all(
              adsetIds.map(adsetId => 
                this.makeRequest(`${adsetId}/insights`, 'GET', {
                  fields: 'impressions,clicks,spend,cpm,cpc,ctr,reach,frequency,conversions,conversion_values',
                  breakdowns: [breakdown],
                  time_range: dateRange,
                  limit: 1000
                })
              )
            );
            insights = insights.flatMap(result => result.data || []);
          } else {
            // Get account-level insights
            const response = await this.makeRequest(`act_${accountId}/insights`, 'GET', {
              fields: 'impressions,clicks,spend,cpm,cpc,ctr,reach,frequency,conversions,conversion_values',
              breakdowns: [breakdown],
              time_range: dateRange,
              limit: 1000
            });
            insights = response.data || [];
          }

          (results as Record<string, unknown[]>)[category.key].push({
            breakdown,
            data: insights
          });
        } catch (error) {
          console.warn(`Failed to get ${breakdown} breakdown:`, error);
        }
      }
    }

    return results;
  }

  // Rules and Automation
  async getRules(accountId: string): Promise<unknown[]> {
    const response = await this.makeRequest(`act_${accountId}/adrules`, 'GET', {
      fields: 'id,name,status,evaluation_spec,execution_spec,schedule_spec'
    });
    return response.data;
  }

  async createRule(accountId: string, ruleData: {
    name: string;
    evaluation_spec: Record<string, unknown>;
    execution_spec: Record<string, unknown>;
    schedule_spec?: Record<string, unknown>;
    status?: string;
  }): Promise<unknown> {
    const response = await this.makeRequest(`act_${accountId}/adrules`, 'POST', {
      name: ruleData.name,
      evaluation_spec: ruleData.evaluation_spec,
      execution_spec: ruleData.execution_spec,
      schedule_spec: ruleData.schedule_spec || { schedule_type: 'DAILY' },
      status: ruleData.status || 'PAUSED'
    });
    return response;
  }

  // Audience Management
  async getCustomAudiences(accountId: string): Promise<unknown[]> {
    const response = await this.makeRequest(`act_${accountId}/customaudiences`, 'GET', {
      fields: 'id,name,description,approximate_count,data_source,delivery_status'
    });
    return response.data;
  }

  async createLookalikeAudience(accountId: string, audienceData: {
    name: string;
    origin_audience_id: string;
    target_countries: string[];
    ratio: number;
  }): Promise<unknown> {
    const response = await this.makeRequest(`act_${accountId}/customaudiences`, 'POST', {
      name: audienceData.name,
      subtype: 'LOOKALIKE',
      lookalike_spec: {
        origin: {
          id: audienceData.origin_audience_id,
          type: 'custom_audience'
        },
        target_countries: audienceData.target_countries,
        ratio: audienceData.ratio
      }
    });
    return response;
  }
}

export default MetaAPIClient;