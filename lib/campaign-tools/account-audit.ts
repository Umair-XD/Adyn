/**
 * STEP 1 — ACCOUNT AUDIT (via MCP)
 * 
 * Classifies account data quality and returns structured audit
 * NEVER interprets Meta data - only processes raw data from main project
 */

export interface AccountData {
  insights: Array<{
    spend?: string;
    purchases?: string;
    leads?: string;
    clicks?: string;
    impressions?: string;
    ctr?: string;
    cpm?: string;
    cpa?: string;
    roas?: string;
    date_start?: string;
    date_stop?: string;
  }>;
  pixels?: Array<{
    id: string;
    name: string;
    events?: Array<{
      event: string;
      count: number;
      last_fired: string;
    }>;
  }>;
  custom_audiences?: Array<{
    id: string;
    name: string;
    approximate_count: number;
    subtype: string;
  }>;
  lookalike_audiences?: Array<{
    id: string;
    name: string;
    approximate_count: number;
    source_audience_id: string;
  }>;
  campaigns?: Array<{
    id: string;
    name: string;
    status: string;
    objective: string;
  }>;
}

export interface AuditResult {
  data_level: 'ZERO_DATA' | 'LOW_DATA' | 'RICH_DATA';
  usable_events: number;
  pixel_health: 'NONE' | 'BASIC' | 'RICH';
  winning_creatives: string[];
  winning_audiences: string[];
  risks: string[];
  account_summary: {
    last_90_days: {
      total_spend: number;
      total_conversions: number;
      avg_cpa: number;
      avg_roas: number;
      total_clicks: number;
      avg_ctr: number;
      campaigns_count: number;
    };
    pixel_events: {
      [event: string]: number;
    };
    audience_sizes: {
      custom: number;
      lookalike: number;
    };
  };
  recommendations: {
    strategy_approach: 'DISCOVERY_FIRST' | 'HYBRID' | 'PERFORMANCE_SCALING';
    primary_objective: string;
    budget_allocation: Record<string, number>;
  };
}

export async function accountAudit(input: { account_data: AccountData }): Promise<AuditResult> {
  const { account_data } = input;
  
  // Initialize audit result
  const audit: AuditResult = {
    data_level: 'ZERO_DATA',
    usable_events: 0,
    pixel_health: 'NONE',
    winning_creatives: [],
    winning_audiences: [],
    risks: [],
    account_summary: {
      last_90_days: {
        total_spend: 0,
        total_conversions: 0,
        avg_cpa: 0,
        avg_roas: 0,
        total_clicks: 0,
        avg_ctr: 0,
        campaigns_count: 0
      },
      pixel_events: {},
      audience_sizes: {
        custom: 0,
        lookalike: 0
      }
    },
    recommendations: {
      strategy_approach: 'DISCOVERY_FIRST',
      primary_objective: 'LINK_CLICKS',
      budget_allocation: {}
    }
  };

  // Process insights data
  if (account_data.insights && account_data.insights.length > 0) {
    let totalSpend = 0;
    let totalConversions = 0;
    let totalClicks = 0;
    let totalImpressions = 0;
    let campaignCount = 0;

    for (const insight of account_data.insights) {
      totalSpend += parseFloat(insight.spend || '0');
      totalConversions += parseFloat(insight.purchases || '0') + parseFloat(insight.leads || '0');
      totalClicks += parseInt(insight.clicks || '0');
      totalImpressions += parseInt(insight.impressions || '0');
      campaignCount++;
    }

    audit.account_summary.last_90_days = {
      total_spend: totalSpend,
      total_conversions: totalConversions,
      avg_cpa: totalConversions > 0 ? totalSpend / totalConversions : 0,
      avg_roas: totalSpend > 0 ? (totalConversions * 50) / totalSpend : 0, // Assuming $50 AOV
      total_clicks: totalClicks,
      avg_ctr: totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0,
      campaigns_count: campaignCount
    };
  }

  // Process pixel data
  if (account_data.pixels && account_data.pixels.length > 0) {
    let totalEvents = 0;
    
    for (const pixel of account_data.pixels) {
      if (pixel.events) {
        for (const event of pixel.events) {
          audit.account_summary.pixel_events[event.event] = event.count;
          totalEvents += event.count;
        }
      }
    }

    audit.usable_events = totalEvents;
    
    if (totalEvents > 1000) {
      audit.pixel_health = 'RICH';
    } else if (totalEvents > 100) {
      audit.pixel_health = 'BASIC';
    } else {
      audit.pixel_health = 'NONE';
    }
  }

  // Process audience data
  if (account_data.custom_audiences) {
    audit.account_summary.audience_sizes.custom = account_data.custom_audiences.length;
    
    // Identify winning audiences (those with >1000 people)
    audit.winning_audiences = account_data.custom_audiences
      .filter(aud => aud.approximate_count > 1000)
      .map(aud => aud.name);
  }

  if (account_data.lookalike_audiences) {
    audit.account_summary.audience_sizes.lookalike = account_data.lookalike_audiences.length;
  }

  // Determine data level classification
  const { total_conversions, total_spend, avg_roas } = audit.account_summary.last_90_days;
  
  if (total_conversions >= 50 && avg_roas > 1.5) {
    audit.data_level = 'RICH_DATA';
    audit.recommendations.strategy_approach = 'PERFORMANCE_SCALING';
    audit.recommendations.primary_objective = 'CONVERSIONS';
    audit.recommendations.budget_allocation = {
      'retargeting': 0.4,
      'lookalike_1%': 0.3,
      'lookalike_3%': 0.2,
      'broad': 0.1
    };
  } else if (total_conversions >= 10 || (total_spend > 1000 && audit.usable_events > 500)) {
    audit.data_level = 'LOW_DATA';
    audit.recommendations.strategy_approach = 'HYBRID';
    audit.recommendations.primary_objective = 'CONVERSIONS';
    audit.recommendations.budget_allocation = {
      'interest_1': 0.3,
      'interest_2': 0.3,
      'broad': 0.4
    };
  } else {
    audit.data_level = 'ZERO_DATA';
    audit.recommendations.strategy_approach = 'DISCOVERY_FIRST';
    audit.recommendations.primary_objective = 'LINK_CLICKS';
    audit.recommendations.budget_allocation = {
      'broad_discovery': 0.6,
      'interest_discovery': 0.4
    };
  }

  // Identify risks
  if (audit.pixel_health === 'NONE') {
    audit.risks.push('No pixel data - install Meta Pixel immediately');
  }
  
  if (audit.account_summary.audience_sizes.custom === 0) {
    audit.risks.push('No custom audiences - limited retargeting options');
  }
  
  if (audit.account_summary.last_90_days.avg_ctr < 1.0) {
    audit.risks.push('Low CTR indicates creative fatigue or poor targeting');
  }
  
  if (audit.account_summary.last_90_days.avg_cpa > 100) {
    audit.risks.push('High CPA - optimize targeting and creatives');
  }

  return audit;
}
