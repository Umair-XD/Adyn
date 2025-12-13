import axios from 'axios';

export interface MetaAccount {
  id: string;
  name: string;
  account_id: string;
  account_status: number;
  currency: string;
  timezone_name: string;
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
  user_data: Record<string, any>;
  custom_data: Record<string, any>;
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
  targeting: Record<string, any>;
  daily_budget?: string;
  lifetime_budget?: string;
}

export interface MetaAd {
  id: string;
  name: string;
  adset_id: string;
  status: string;
  creative: Record<string, any>;
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

  private async makeRequest(endpoint: string, method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET', data?: any) {
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
        (config as any).data = data;
      }

      const response = await axios(config);
      return response.data;
    } catch (error: any) {
      console.error('Meta API Error:', error.response?.data || error.message);
      throw new Error(`Meta API Error: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  // Account Management
  async getAdAccounts(): Promise<MetaAccount[]> {
    const response = await this.makeRequest('me/adaccounts', 'GET', {
      fields: 'id,name,account_id,account_status,currency,timezone_name'
    });
    return response.data;
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

  async getPixelEvents(pixelId: string, startDate?: string, endDate?: string): Promise<any> {
    const params: any = {
      fields: 'event_name,count,unique_count'
    };
    
    if (startDate) params.time_range = { since: startDate, until: endDate || new Date().toISOString().split('T')[0] };
    
    const response = await this.makeRequest(`${pixelId}/stats`, 'GET', params);
    return response.data;
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
    targeting: Record<string, any>;
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
    const params: any = {
      fields: 'impressions,clicks,spend,cpm,cpc,ctr,reach,frequency,actions'
    };
    
    if (dateRange) {
      params.time_range = dateRange;
    }
    
    const response = await this.makeRequest(`${campaignId}/insights`, 'GET', params);
    return response.data[0] || {};
  }

  async getAdSetInsights(adSetId: string, dateRange?: { since: string; until: string }): Promise<MetaInsights> {
    const params: any = {
      fields: 'impressions,clicks,spend,cpm,cpc,ctr,reach,frequency,actions'
    };
    
    if (dateRange) {
      params.time_range = dateRange;
    }
    
    const response = await this.makeRequest(`${adSetId}/insights`, 'GET', params);
    return response.data[0] || {};
  }

  // Rules and Automation
  async getRules(accountId: string): Promise<any[]> {
    const response = await this.makeRequest(`act_${accountId}/adrules`, 'GET', {
      fields: 'id,name,status,evaluation_spec,execution_spec,schedule_spec'
    });
    return response.data;
  }

  async createRule(accountId: string, ruleData: {
    name: string;
    evaluation_spec: Record<string, any>;
    execution_spec: Record<string, any>;
    schedule_spec?: Record<string, any>;
    status?: string;
  }): Promise<any> {
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
  async getCustomAudiences(accountId: string): Promise<any[]> {
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
  }): Promise<any> {
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