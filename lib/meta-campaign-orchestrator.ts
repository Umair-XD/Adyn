import { mcpManager } from './mcp-client';
import MetaAPIClient from './meta-api';
import { calculateTokenUsage, aggregateTokenUsage, aggregateModuleUsage, calculateCost, TokenUsage } from './token-estimator';
import MetaAccountCache from '@/models/MetaAccountCache';
import connectDB from '@/lib/mongoose';

/**
 * MAIN PROJECT (THIN LAYER)
 * 
 * STRICT RULES:
 * - Handles Meta OAuth / access tokens ONLY
 * - Handles Ad Account connection ONLY  
 * - Handles Pixel + Conversions API wiring ONLY
 * - Executes API calls ONLY with payloads returned by MCP
 * - Stores raw insights + execution logs ONLY
 * - NEVER interprets Meta data
 * - ALL interpretation, reasoning, decision-making MUST live in MCP servers
 */

export interface CampaignRequest {
  // User inputs
  ad_account_id: string;
  business_goal: 'PURCHASE' | 'LEAD' | 'TRAFFIC' | 'AWARENESS' | 'ENGAGEMENT';
  campaign_name: string;
  budget_total?: number;
  budget_per_adset?: number;
  product_url?: string; // ESSENTIAL: URL of the product/catalog we're advertising
  creative_assets: Array<{
    type: 'image' | 'video' | 'carousel';
    asset_url: string;
    primary_texts: string[];
    headlines: string[];
    descriptions?: string[];
    cta: string;
    landing_page_url: string;
    creative_family?: string;
  }>;
  desired_geos?: string[];
  age_range?: { min: number; max: number };
  genders?: number[];
  constraints?: {
    max_cpa?: number;
    max_cpm?: number;
    prefer_reels_only?: boolean;
  };
  flags?: {
    force_broad?: boolean;
    test_mode?: boolean;
    max_adsets?: number;
  };
}

export interface CampaignExecutionResult {
  success: boolean;
  campaign_id?: string;
  adset_ids?: string[];
  creative_ids?: string[];
  ad_ids?: string[];
  execution_log: Array<{
    step: number;
    action: string;
    timestamp: string;
    success: boolean;
    response?: unknown;
    error?: string;
  }>;
  mcp_audit: unknown;
  mcp_strategy: unknown;
  api_payloads_used: unknown[];
  product_insights?: unknown; // ESSENTIAL: Product analysis results
  ai_usage_summary?: { // Track AI Gateway usage
    total_tokens: number;
    total_cost: number;
    by_tool: Array<{
      tool: string;
      tokens: number;
      cost: number;
    }>;
  };
  support_alerts?: Array<{
    type: string;
    message: string;
    severity: string;
  }>;
}

export class MetaCampaignOrchestrator {
  private metaClient: MetaAPIClient;
  private accessToken: string;

  constructor(accessToken: string) {
    this.accessToken = accessToken;
    this.metaClient = new MetaAPIClient(accessToken);
  }

  /**
   * MAIN ORCHESTRATION - Executes MCP-driven campaign creation
   * This is the ONLY public method - everything else is MCP-driven
   */
  async createCampaign(request: CampaignRequest): Promise<CampaignExecutionResult> {
    const executionLog: CampaignExecutionResult['execution_log'] = [];
    const aiUsageTracking: TokenUsage[] = []; // Track AI usage across all MCP calls

    try {
      // NEW APPROACH: Use intelligent campaign constructor for complete flow
      if (request.product_url) {
        // Fetch raw account data first
        const rawAccountData = await this.fetchRawAccountData(request.ad_account_id);
        this.logStep(executionLog, 1, 'Fetch raw account data', true, rawAccountData);

        // Map business goal to campaign purpose
        const campaignPurpose = this.mapBusinessGoalToPurpose(request.business_goal);

        // Use intelligent campaign constructor for complete flow
        const constructorResult = await mcpManager.callTool('adyn', 'enhanced_intelligent_campaign_constructor', {
          product_url: request.product_url,
          campaign_purpose: campaignPurpose,
          budget: request.budget_total || 1000,
          geo_targets: request.desired_geos || ['US'],
          raw_meta_account_data: rawAccountData,
          ad_account_id: request.ad_account_id
        }) as { content: unknown };

        const constructorContent = Array.isArray(constructorResult.content) ? constructorResult.content[0] : constructorResult.content;
        const campaignData = JSON.parse((constructorContent as { text?: string })?.text || '{}');

        // Track AI usage from intelligent constructor
        if (campaignData.usage) {
          const usage = calculateTokenUsage('intelligent_campaign_constructor', {
            product_url: request.product_url,
            campaign_purpose: campaignPurpose,
            budget: request.budget_total || 1000,
            geo_targets: request.desired_geos || ['US']
          }, campaignData);
          aiUsageTracking.push(usage);
        }

        this.logStep(executionLog, 2, 'Intelligent campaign construction', true, campaignData);

        // Execute the API sequence with the constructed payloads
        const executionResult = await this.executeIntelligentAPISequence(campaignData, request.ad_account_id, executionLog);

        // Calculate total AI usage and costs
        const totalAiUsage = aggregateTokenUsage(aiUsageTracking);
        const totalCost = calculateCost(totalAiUsage);
        const moduleBreakdown = aggregateModuleUsage(aiUsageTracking);

        return {
          success: executionResult.success,
          campaign_id: executionResult.campaign_id,
          adset_ids: executionResult.adset_ids,
          creative_ids: executionResult.creative_ids,
          ad_ids: executionResult.ad_ids,
          execution_log: executionLog,
          mcp_audit: { product_fingerprint: campaignData.product_fingerprint },
          mcp_strategy: { ai_reasoning: campaignData.ai_reasoning },
          api_payloads_used: campaignData,
          support_alerts: campaignData.risks?.map((risk: string) => ({
            type: 'RISK_WARNING',
            message: risk,
            severity: 'MEDIUM'
          })) || [],
          product_insights: {
            fingerprint: campaignData.product_fingerprint,
            assumptions: campaignData.assumptions
          },
          ai_usage_summary: {
            total_tokens: totalAiUsage.total,
            total_cost: totalCost,
            by_tool: moduleBreakdown.map(module => ({
              tool: module.module,
              tokens: module.totalTokens,
              cost: module.cost
            }))
          }
        };
      }

      // FALLBACK: Original flow if no product URL provided
      return await this.executeOriginalFlow(request, executionLog);

    } catch (error) {
      this.logStep(executionLog, -1, 'Campaign creation failed', false, null, error instanceof Error ? error.message : 'Unknown error');

      // Send error to Support MCP for analysis
      if (error instanceof Error) {
        try {
          const errorAnalysis = await mcpManager.callTool('support', 'error_decoder', {
            api_error: {
              code: 1,
              message: error.message,
              type: 'EXECUTION_ERROR'
            },
            context: {
              endpoint: 'campaign_creation',
              account_id: request.ad_account_id
            }
          }) as { content: unknown };

          const errorContent = Array.isArray(errorAnalysis.content) ? errorAnalysis.content[0] : errorAnalysis.content;
          const errorData = JSON.parse((errorContent as { text?: string })?.text || '{}');

          return {
            success: false,
            execution_log: executionLog,
            mcp_audit: null,
            mcp_strategy: null,
            api_payloads_used: [],
            support_alerts: [{
              type: 'ERROR_ANALYSIS',
              message: errorData.human_explanation,
              severity: errorData.severity
            }]
          };
        } catch {
          // Fallback if support MCP fails
          return {
            success: false,
            execution_log: executionLog,
            mcp_audit: null,
            mcp_strategy: null,
            api_payloads_used: [],
            support_alerts: [{
              type: 'CRITICAL_ERROR',
              message: error.message,
              severity: 'HIGH'
            }]
          };
        }
      }

      return {
        success: false,
        execution_log: executionLog,
        mcp_audit: null,
        mcp_strategy: null,
        api_payloads_used: []
      };
    }
  }

  /**
   * Executes a pre-generated intelligent campaign strategy directly
   * Used when strategy has already been generated via dashboard
   */
  async executeExistingStrategy(
    campaignData: unknown,
    accountId: string
  ): Promise<CampaignExecutionResult> {
    const executionLog: CampaignExecutionResult['execution_log'] = [];

    try {
      this.logStep(executionLog, 1, 'Starting execution of existing strategy', true, campaignData);

      // Execute the API sequence with the provided payloads
      const executionResult = await this.executeIntelligentAPISequence(campaignData, accountId, executionLog);

      return {
        success: executionResult.success,
        campaign_id: executionResult.campaign_id,
        adset_ids: executionResult.adset_ids,
        creative_ids: executionResult.creative_ids,
        ad_ids: executionResult.ad_ids,
        execution_log: executionLog,
        mcp_audit: {
          product_fingerprint: (campaignData as { product_fingerprint?: string }).product_fingerprint
        },
        mcp_strategy: {
          ai_reasoning: (campaignData as { ai_reasoning?: string }).ai_reasoning
        },
        api_payloads_used: [campaignData],
        support_alerts: (campaignData as { risks?: string[] }).risks?.map((risk: string) => ({
          type: 'RISK_WARNING',
          message: risk,
          severity: 'MEDIUM'
        })) || []
      };
    } catch (error) {
      this.logStep(executionLog, -1, 'Campaign execution failed', false, null, error instanceof Error ? error.message : 'Unknown error');

      return {
        success: false,
        execution_log: executionLog,
        mcp_audit: null,
        mcp_strategy: null,
        api_payloads_used: [],
        support_alerts: [{
          type: 'CRITICAL_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
          severity: 'HIGH'
        }]
      };
    }
  }

  /**
   * Fetches full cached account data (Expert Intelligence)
   */
  private async fetchRawAccountData(accountId: string): Promise<unknown> {
    try {
      await connectDB();

      // Get data from local cache - FAST & DETAILED
      const cache = await MetaAccountCache.findOne({
        metaAccountId: accountId,
        isComplete: true
      }).lean();

      if (!cache) {
        console.warn(`⚠️ No cached data found for ${accountId}, falling back to empty context`);
        return {};
      }

      // Return the full cached object structure which matches what MCP expects
      // Plus the new Expert fields
      const cacheData = Array.isArray(cache) ? cache[0] : cache;
      if (!cacheData) {
        console.warn(`⚠️ Invalid cached data structure for ${accountId}, falling back to empty context`);
        return {};
      }
      
      return {
        insights: (cacheData as { insights?: unknown[] }).insights || [],
        pixels: (cacheData as { pixels?: unknown[] }).pixels || [],
        custom_audiences: (cacheData as { customAudiences?: unknown[] }).customAudiences || [],
        campaigns: (cacheData as { campaigns?: unknown[] }).campaigns || [],
        accountData: (cacheData as { accountData?: unknown }).accountData || {},
        // EXPERT DATA FIELDS
        placement_insights: (cacheData as { placementInsights?: unknown[] }).placementInsights || [],
        demographic_insights: (cacheData as { demographicInsights?: unknown[] }).demographicInsights || [],
        ads: (cacheData as { ads?: unknown[] }).ads || [] // Rich ads with creative data
      };

    } catch (error) {
      console.warn('Failed to fetch cached account data:', error);
      return {};
    }
  }

  /**
   * Executes API sequence with MCP-provided payloads - NO INTERPRETATION
   */
  private async executeAPISequence(
    mcpResult: unknown,
    accountId: string,
    executionLog: CampaignExecutionResult['execution_log']
  ): Promise<{
    success: boolean;
    campaign_id?: string;
    adset_ids?: string[];
    creative_ids?: string[];
    ad_ids?: string[];
  }> {

    const result = {
      success: false,
      campaign_id: undefined as string | undefined,
      adset_ids: [] as string[],
      creative_ids: [] as string[],
      ad_ids: [] as string[]
    };

    try {
      // Execute in MCP-defined order
      const mcpData = mcpResult as Record<string, unknown>;

      // Step 1: Create Campaign
      if (mcpData.campaign_payload) {
        const campaignPayload = mcpData.campaign_payload as { payload: Record<string, unknown> };
        const campaignResponse = await this.metaClient.createCampaign(accountId, campaignPayload.payload as Parameters<typeof this.metaClient.createCampaign>[1]) as { id: string };
        result.campaign_id = campaignResponse.id;
        this.logStep(executionLog, 9, 'Create campaign', true, { id: campaignResponse.id });

        // Replace campaign ID in subsequent payloads
        this.replacePlaceholders(mcpData, '{{CAMPAIGN_ID}}', campaignResponse.id);
      }

      // Step 2: Create AdSets
      if (mcpData.adset_payloads) {
        const adsetPayloads = mcpData.adset_payloads as Array<{ payload: Record<string, unknown> }>;
        for (let i = 0; i < adsetPayloads.length; i++) {
          const adsetPayload = adsetPayloads[i];
          const adsetResponse = await this.metaClient.createAdSet(accountId, adsetPayload.payload as Parameters<typeof this.metaClient.createAdSet>[1]) as { id: string };
          result.adset_ids.push(adsetResponse.id);
          this.logStep(executionLog, 10 + i, `Create adset ${i + 1}`, true, { id: adsetResponse.id });

          // Replace adset ID in subsequent payloads
          this.replacePlaceholders(mcpData, `{{ADSET_${i}_ID}}`, adsetResponse.id);
        }
      }

      // Step 3: Create Creatives
      if (mcpData.creative_payloads) {
        const creativePayloads = mcpData.creative_payloads as Array<{ payload: Record<string, unknown> }>;
        for (let i = 0; i < creativePayloads.length; i++) {
          const creativePayload = creativePayloads[i];
          const creativeResponse = await this.metaClient.createCreative(accountId, creativePayload.payload as Parameters<typeof this.metaClient.createCreative>[1]) as { id: string };
          result.creative_ids.push(creativeResponse.id);
          this.logStep(executionLog, 20 + i, `Create creative ${i + 1}`, true, { id: creativeResponse.id });

          // Replace creative ID in subsequent payloads
          this.replacePlaceholders(mcpData, `{{CREATIVE_${i}_ID}}`, creativeResponse.id);
        }
      }

      // Step 4: Create Ads
      if (mcpData.ad_payloads) {
        const adPayloads = mcpData.ad_payloads as Array<{ payload: Record<string, unknown> }>;
        for (let i = 0; i < adPayloads.length; i++) {
          const adPayload = adPayloads[i];
          const adResponse = await this.metaClient.createAd(accountId, adPayload.payload as Parameters<typeof this.metaClient.createAd>[1]) as { id: string };
          result.ad_ids.push(adResponse.id);
          this.logStep(executionLog, 30 + i, `Create ad ${i + 1}`, true, { id: adResponse.id });
        }
      }

      result.success = true;
      return result;

    } catch (error) {
      // Send error to Support MCP for analysis
      try {
        const errorAnalysis = await mcpManager.callTool('support', 'error_decoder', {
          api_error: {
            code: (error as { code?: number }).code || 1,
            message: error instanceof Error ? error.message : 'Unknown API error',
            type: 'API_EXECUTION_ERROR'
          },
          context: {
            endpoint: 'api_execution',
            account_id: accountId
          }
        }) as { content: unknown };

        const errorContent = Array.isArray(errorAnalysis.content) ? errorAnalysis.content[0] : errorAnalysis.content;
        const errorData = JSON.parse((errorContent as { text?: string })?.text || '{}');

        this.logStep(executionLog, -1, 'API execution failed', false, null,
          errorData.human_explanation);
      } catch {
        this.logStep(executionLog, -1, 'API execution failed', false, null,
          error instanceof Error ? error.message : 'Unknown error');
      }

      throw error;
    }
  }

  /**
   * Maps business goal to campaign purpose for intelligent constructor
   */
  private mapBusinessGoalToPurpose(businessGoal: string): 'conversion' | 'engagement' | 'traffic' | 'awareness' {
    const mapping: Record<string, 'conversion' | 'engagement' | 'traffic' | 'awareness'> = {
      'PURCHASE': 'conversion',
      'LEAD': 'conversion',
      'TRAFFIC': 'traffic',
      'AWARENESS': 'awareness',
      'ENGAGEMENT': 'engagement'
    };
    return mapping[businessGoal] || 'traffic';
  }

  /**
   * Executes API sequence with intelligent campaign constructor payloads
   */
  private async executeIntelligentAPISequence(
    campaignData: unknown,
    accountId: string,
    executionLog: CampaignExecutionResult['execution_log']
  ): Promise<{
    success: boolean;
    campaign_id?: string;
    adset_ids?: string[];
    creative_ids?: string[];
    ad_ids?: string[];
  }> {

    const result = {
      success: false,
      campaign_id: undefined as string | undefined,
      adset_ids: [] as string[],
      creative_ids: [] as string[],
      ad_ids: [] as string[]
    };

    try {
      const data = campaignData as {
        campaign_payload: { name: string; objective: string; status: string; buying_type: string };
        adset_payloads: Array<{
          name: string;
          targeting: unknown;
          optimization: { optimization_goal: string; billing_event: string; bid_strategy: string };
          budget: { daily_budget: number };
        }>;
        creative_payloads: Array<{
          adset_ref: string;
          creative: { name: string; object_story_spec: unknown };
        }>;
      };

      // Step 1: Create Campaign
      const campaignResponse = await this.metaClient.createCampaign(accountId, {
        name: data.campaign_payload.name,
        objective: data.campaign_payload.objective,
        status: 'PAUSED' // Always start paused
      }) as { id: string };

      result.campaign_id = campaignResponse.id;
      this.logStep(executionLog, 9, 'Create campaign', true, { id: campaignResponse.id });

      // Step 2: Create AdSets
      for (let i = 0; i < data.adset_payloads.length; i++) {
        const adsetPayload = data.adset_payloads[i];
        const adsetResponse = await this.metaClient.createAdSet(accountId, {
          name: adsetPayload.name,
          campaign_id: campaignResponse.id,
          targeting: adsetPayload.targeting as Record<string, unknown>,
          daily_budget: adsetPayload.budget.daily_budget * 100, // Convert to cents
          billing_event: adsetPayload.optimization.billing_event,
          optimization_goal: adsetPayload.optimization.optimization_goal,
          bid_strategy: adsetPayload.optimization.bid_strategy,
          status: 'PAUSED'
        }) as { id: string };

        result.adset_ids.push(adsetResponse.id);
        this.logStep(executionLog, 10 + i, `Create adset ${i + 1}`, true, { id: adsetResponse.id });
      }

      // Step 3: Create Creatives
      for (let i = 0; i < data.creative_payloads.length; i++) {
        const creativePayload = data.creative_payloads[i];
        const creativeResponse = await this.metaClient.createCreative(accountId, {
          name: creativePayload.creative.name,
          object_story_spec: creativePayload.creative.object_story_spec as Record<string, unknown>
        }) as { id: string };

        result.creative_ids.push(creativeResponse.id);
        this.logStep(executionLog, 20 + i, `Create creative ${i + 1}`, true, { id: creativeResponse.id });
      }

      // Step 4: Create Ads (link adsets to creatives)
      let adIndex = 0;
      for (let adsetIndex = 0; adsetIndex < result.adset_ids.length; adsetIndex++) {
        const adsetCreatives = data.creative_payloads.filter(c => c.adset_ref === `adset_${adsetIndex}`);

        for (const creative of adsetCreatives) {
          const creativeIndex = data.creative_payloads.indexOf(creative);
          const adResponse = await this.metaClient.createAd(accountId, {
            name: `Ad ${adIndex + 1} - ${creative.creative.name}`,
            adset_id: result.adset_ids[adsetIndex],
            creative: { creative_id: result.creative_ids[creativeIndex] },
            status: 'PAUSED'
          }) as { id: string };

          result.ad_ids.push(adResponse.id);
          this.logStep(executionLog, 30 + adIndex, `Create ad ${adIndex + 1}`, true, { id: adResponse.id });
          adIndex++;
        }
      }

      result.success = true;
      return result;

    } catch (error) {
      // Send error to Support MCP for analysis
      try {
        const errorAnalysis = await mcpManager.callTool('support', 'error_decoder', {
          api_error: {
            code: (error as { code?: number }).code || 1,
            message: error instanceof Error ? error.message : 'Unknown API error',
            type: 'API_EXECUTION_ERROR'
          },
          context: {
            endpoint: 'intelligent_api_execution',
            account_id: accountId
          }
        }) as { content: unknown };

        const errorContent = Array.isArray(errorAnalysis.content) ? errorAnalysis.content[0] : errorAnalysis.content;
        const errorData = JSON.parse((errorContent as { text?: string })?.text || '{}');

        this.logStep(executionLog, -1, 'API execution failed', false, null,
          errorData.human_explanation);
      } catch {
        this.logStep(executionLog, -1, 'API execution failed', false, null,
          error instanceof Error ? error.message : 'Unknown error');
      }

      throw error;
    }
  }

  /**
   * Fallback to original flow if needed
   */
  private async executeOriginalFlow(
    request: CampaignRequest,
    executionLog: CampaignExecutionResult['execution_log']
  ): Promise<CampaignExecutionResult> {
    // This would contain the original flow logic as fallback
    // For now, return a simple response
    this.logStep(executionLog, -1, 'Fallback to original flow not implemented', false);

    return {
      success: false,
      execution_log: executionLog,
      mcp_audit: null,
      mcp_strategy: null,
      api_payloads_used: [],
      support_alerts: [{
        type: 'FALLBACK_ERROR',
        message: 'Original flow fallback not implemented',
        severity: 'HIGH'
      }]
    };
  }
  private logStep(
    log: CampaignExecutionResult['execution_log'],
    step: number,
    action: string,
    success: boolean,
    response?: unknown,
    error?: string
  ): void {
    log.push({
      step,
      action,
      timestamp: new Date().toISOString(),
      success,
      response,
      error
    });
  }

  private replacePlaceholders(obj: unknown, placeholder: string, value: string): unknown {
    if (typeof obj === 'string') {
      return obj.replace(new RegExp(placeholder, 'g'), value);
    } else if (Array.isArray(obj)) {
      obj.forEach(item => this.replacePlaceholders(item, placeholder, value));
    } else if (typeof obj === 'object' && obj !== null) {
      const objRecord = obj as Record<string, unknown>;
      Object.keys(objRecord).forEach(key => {
        if (typeof objRecord[key] === 'string') {
          objRecord[key] = (objRecord[key] as string).replace(new RegExp(placeholder, 'g'), value);
        } else {
          this.replacePlaceholders(objRecord[key], placeholder, value);
        }
      });
    }
    return obj;
  }
}