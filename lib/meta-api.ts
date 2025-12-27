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
}

export interface MetaAdSet {
  id: string;
  name: string;
  campaign_id: string;
  status: string;
  targeting: Record<string, unknown>;
  daily_budget?: string;
  lifetime_budget?: string;
}

export interface MetaAd {
  id: string;
  name: string;
  adset_id: string;
  status: string;
  creative: Record<string, unknown>;
  created_time: string;
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

export class MetaAPIClient {
  private accessToken: string;
  private apiVersion: string = 'v21.0';
  private baseUrl: string = 'https://graph.facebook.com';

  constructor(accessToken: string) {
    this.accessToken = accessToken;
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

  // Campaign Management
  async getCampaigns(accountId: string): Promise<MetaCampaign[]> {
    const response = await this.makeRequest(`act_${accountId}/campaigns`, 'GET', {
      fields: 'id,name,status,objective,created_time,updated_time,daily_budget,lifetime_budget'
    });
    return response.data;
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

  // Ad Set Management
  async getAdSets(accountId: string, campaignId?: string): Promise<MetaAdSet[]> {
    const endpoint = campaignId ? `${campaignId}/adsets` : `act_${accountId}/adsets`;
    const response = await this.makeRequest(endpoint, 'GET', {
      fields: 'id,name,campaign_id,status,targeting,daily_budget,lifetime_budget'
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
  }): Promise<MetaAdSet> {
    const response = await this.makeRequest(`act_${accountId}/adsets`, 'POST', {
      name: adSetData.name,
      campaign_id: adSetData.campaign_id,
      targeting: adSetData.targeting,
      billing_event: adSetData.billing_event || 'IMPRESSIONS',
      optimization_goal: adSetData.optimization_goal || 'REACH',
      status: adSetData.status || 'PAUSED',
      ...(adSetData.daily_budget && { daily_budget: adSetData.daily_budget }),
      ...(adSetData.lifetime_budget && { lifetime_budget: adSetData.lifetime_budget })
    });
    return response;
  }

  // Ad Management
  async getAds(accountId: string, adSetId?: string): Promise<MetaAd[]> {
    const endpoint = adSetId ? `${adSetId}/ads` : `act_${accountId}/ads`;
    const response = await this.makeRequest(endpoint, 'GET', {
      fields: 'id,name,adset_id,status,creative,created_time'
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

  // Enhanced Historical Insights Methods
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

  async getAudienceInsights(accountId: string, options?: {
    dateRange?: { since: string; until: string };
    breakdowns?: ('age' | 'gender' | 'country' | 'region' | 'dma' | 'impression_device' | 'platform_position')[];
    limit?: number;
  }): Promise<unknown[]> {
    const params: Record<string, unknown> = {
      fields: 'impressions,clicks,spend,cpm,cpc,ctr,reach,frequency,actions,conversions',
      level: 'adset',
      limit: options?.limit || 100
    };
    
    if (options?.dateRange) {
      params.time_range = options.dateRange;
    }
    
    if (options?.breakdowns) {
      params.breakdowns = options.breakdowns.join(',');
    }
    
    const response = await this.makeRequest(`act_${accountId}/insights`, 'GET', params);
    return response.data || [];
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