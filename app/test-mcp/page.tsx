'use client';

import { useState } from 'react';

interface TestResult {
  success?: boolean;
  campaign_id?: string;
  adset_ids?: string[];
  creative_ids?: string[];
  ad_ids?: string[];
  ai_usage_summary?: {
    total_tokens: number;
    total_cost: number;
    by_tool: Array<{
      tool: string;
      tokens: number;
      cost: number;
    }>;
  };
  product_insights?: {
    fingerprint?: string;
    assumptions?: string[];
    category?: string;
    brand_tone?: string;
    audience_persona?: string;
    value_proposition?: string;
    keywords?: string[];
    target_segments?: Array<{
      segment: string;
    }>;
  };
  mcp_insights?: {
    data_quality?: string;
    strategy_approach?: string;
    recommended_adsets?: number;
  };
  mcp_audit?: {
    product_fingerprint?: string;
  };
  mcp_strategy?: {
    ai_reasoning?: string;
  };
  api_payloads_used?: {
    campaign_payload?: {
      name: string;
      objective: string;
      status: string;
      buying_type: string;
    };
    adset_payloads?: Array<{
      name: string;
      targeting: {
        geo_locations: { countries: string[] };
        age_min: number;
        age_max: number;
        interests?: Array<{ id: string; name: string }>;
      };
      optimization: {
        optimization_goal: string;
        billing_event: string;
        bid_strategy: string;
      };
      budget: {
        daily_budget: number;
        budget_type: string;
      };
    }>;
    creative_payloads?: Array<{
      adset_ref: string;
      creative: {
        name: string;
        object_story_spec: {
          link_data: {
            message: string;
            name: string;
            description: string;
            call_to_action: {
              type: string;
            };
          };
        };
      };
    }>;
    risks?: string[];
    assumptions?: string[];
    ai_reasoning?: string;
  };
  execution_summary?: {
    total_steps: number;
    successful_steps: number;
    failed_steps: number;
  };
  support_alerts?: Array<{
    type: string;
    message: string;
    severity?: string;
  }>;
  error?: string;
  message?: string;
}

export default function TestMCPPage() {
  const [result, setResult] = useState<TestResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    access_token: '',
    ad_account_id: '',
    campaign_name: 'MCP Test Campaign',
    business_goal: 'TRAFFIC',
    budget_total: 1000,
    product_url: '', // ESSENTIAL: Product URL for intelligent analysis
    desired_geos: ['US'],
    flags: { test_mode: true }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/campaigns/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({
        error: 'Request failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">MCP-Driven Meta Campaign Creation</h1>
      
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
        <h2 className="text-lg font-semibold text-blue-800 mb-2">🚀 Intelligent Campaign Constructor</h2>
        <div className="text-sm text-blue-700 space-y-2">
          <p><strong>NEW FLOW:</strong> Single AI-powered tool analyzes product URL and creates complete campaign</p>
          <p><strong>Product Analysis:</strong> Fetch → Extract → AI Semantic Analysis → Strategy → API Payloads</p>
          <p><strong>AI Gateway:</strong> Uses GPT-4o for intelligent decision-making with full cost tracking</p>
          <p><strong>Meta API Compliant:</strong> All outputs are valid Meta Marketing API fields</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium mb-2">
              Meta Access Token *
            </label>
            <input
              type="password"
              value={formData.access_token}
              onChange={(e) => setFormData({...formData, access_token: e.target.value})}
              className="w-full p-3 border border-gray-300 rounded-lg"
              placeholder="Enter your Meta access token"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">
              Ad Account ID *
            </label>
            <input
              type="text"
              value={formData.ad_account_id}
              onChange={(e) => setFormData({...formData, ad_account_id: e.target.value})}
              className="w-full p-3 border border-gray-300 rounded-lg"
              placeholder="act_1234567890"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">
              Campaign Name
            </label>
            <input
              type="text"
              value={formData.campaign_name}
              onChange={(e) => setFormData({...formData, campaign_name: e.target.value})}
              className="w-full p-3 border border-gray-300 rounded-lg"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">
              Product URL (ESSENTIAL) 🔥
            </label>
            <input
              type="url"
              value={formData.product_url}
              onChange={(e) => setFormData({...formData, product_url: e.target.value})}
              className="w-full p-3 border border-orange-300 rounded-lg bg-orange-50"
              placeholder="https://yourwebsite.com/product-page"
            />
            <p className="text-xs text-orange-600 mt-1">
              🚀 MCP will analyze this URL to create intelligent campaigns, audiences, and creatives
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">
              Business Goal
            </label>
            <select
              value={formData.business_goal}
              onChange={(e) => setFormData({...formData, business_goal: e.target.value})}
              className="w-full p-3 border border-gray-300 rounded-lg"
            >
              <option value="TRAFFIC">Traffic</option>
              <option value="PURCHASE">Purchase</option>
              <option value="LEAD">Lead Generation</option>
              <option value="AWARENESS">Brand Awareness</option>
              <option value="ENGAGEMENT">Engagement</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">
              Total Budget ($)
            </label>
            <input
              type="number"
              value={formData.budget_total}
              onChange={(e) => setFormData({...formData, budget_total: parseInt(e.target.value)})}
              className="w-full p-3 border border-gray-300 rounded-lg"
              min="100"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Creating Intelligent Campaign via AI...' : '🚀 Create AI-Powered Campaign'}
        </button>
      </form>

      {result && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">
            {result.success ? '✅ Campaign Creation Result' : '❌ Campaign Creation Failed'}
          </h2>
          
          {/* Flow Type Indicator */}
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
            <p className="text-sm text-blue-700">
              <strong>Flow Used:</strong> {formData.product_url ? 
                '🚀 Intelligent Campaign Constructor (AI-Powered Single Step)' : 
                '🔧 Traditional Multi-Step MCP Flow'
              }
            </p>
          </div>
          
          {result.success && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded border">
                  <h3 className="font-medium text-gray-700">Campaign ID</h3>
                  <p className="text-sm text-gray-600 font-mono">{result.campaign_id || 'N/A'}</p>
                </div>
                <div className="bg-white p-4 rounded border">
                  <h3 className="font-medium text-gray-700">Ad Sets Created</h3>
                  <p className="text-sm text-gray-600">{result.adset_ids?.length || 0}</p>
                </div>
                <div className="bg-white p-4 rounded border">
                  <h3 className="font-medium text-gray-700">Creatives Created</h3>
                  <p className="text-sm text-gray-600">{result.creative_ids?.length || 0}</p>
                </div>
                <div className="bg-white p-4 rounded border">
                  <h3 className="font-medium text-gray-700">Ads Created</h3>
                  <p className="text-sm text-gray-600">{result.ad_ids?.length || 0}</p>
                </div>
              </div>

              {/* AI Strategy Reasoning */}
              {result.mcp_strategy?.ai_reasoning && (
                <div className="bg-white p-4 rounded border">
                  <h3 className="font-medium text-gray-700 mb-2">🧠 AI Strategy Reasoning</h3>
                  <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                    <p>{result.mcp_strategy.ai_reasoning}</p>
                  </div>
                </div>
              )}

              {/* Campaign Structure */}
              {result.api_payloads_used?.campaign_payload && (
                <div className="bg-white p-4 rounded border">
                  <h3 className="font-medium text-gray-700 mb-2">📋 Campaign Structure</h3>
                  <div className="text-sm text-gray-600 space-y-2">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p><strong>Name:</strong> {result.api_payloads_used.campaign_payload.name}</p>
                        <p><strong>Objective:</strong> {result.api_payloads_used.campaign_payload.objective}</p>
                      </div>
                      <div>
                        <p><strong>Status:</strong> {result.api_payloads_used.campaign_payload.status}</p>
                        <p><strong>Buying Type:</strong> {result.api_payloads_used.campaign_payload.buying_type}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Ad Sets Details */}
              {result.api_payloads_used?.adset_payloads && result.api_payloads_used.adset_payloads.length > 0 && (
                <div className="bg-white p-4 rounded border">
                  <h3 className="font-medium text-gray-700 mb-2">🎯 Ad Sets Strategy</h3>
                  <div className="space-y-3">
                    {result.api_payloads_used.adset_payloads.map((adset, index) => (
                      <div key={index} className="bg-gray-50 p-3 rounded">
                        <h4 className="font-medium text-sm text-gray-800 mb-2">{adset.name}</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs text-gray-600">
                          <div>
                            <p><strong>Targeting:</strong></p>
                            <p>Age: {adset.targeting.age_min}-{adset.targeting.age_max}</p>
                            <p>Geos: {adset.targeting.geo_locations.countries.join(', ')}</p>
                            {adset.targeting.interests && adset.targeting.interests.length > 0 && (
                              <p>Interests: {adset.targeting.interests.slice(0, 2).map(i => i.name).join(', ')}</p>
                            )}
                          </div>
                          <div>
                            <p><strong>Optimization:</strong></p>
                            <p>Goal: {adset.optimization.optimization_goal}</p>
                            <p>Billing: {adset.optimization.billing_event}</p>
                            <p>Bid: {adset.optimization.bid_strategy}</p>
                          </div>
                          <div>
                            <p><strong>Budget:</strong></p>
                            <p>Daily: ${adset.budget.daily_budget}</p>
                            <p>Type: {adset.budget.budget_type}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Creative Strategy */}
              {result.api_payloads_used?.creative_payloads && result.api_payloads_used.creative_payloads.length > 0 && (
                <div className="bg-white p-4 rounded border">
                  <h3 className="font-medium text-gray-700 mb-2">🎨 Creative Strategy</h3>
                  <div className="space-y-3">
                    {result.api_payloads_used.creative_payloads.map((creative, index) => (
                      <div key={index} className="bg-gray-50 p-3 rounded">
                        <h4 className="font-medium text-sm text-gray-800 mb-2">{creative.creative.name}</h4>
                        <div className="text-xs text-gray-600 space-y-1">
                          <p><strong>Ad Set:</strong> {creative.adset_ref}</p>
                          <p><strong>Message:</strong> {creative.creative.object_story_spec.link_data.message}</p>
                          <p><strong>Headline:</strong> {creative.creative.object_story_spec.link_data.name}</p>
                          <p><strong>Description:</strong> {creative.creative.object_story_spec.link_data.description}</p>
                          <p><strong>CTA:</strong> {creative.creative.object_story_spec.link_data.call_to_action.type}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Risks & Assumptions */}
              {(result.api_payloads_used?.risks || result.api_payloads_used?.assumptions) && (
                <div className="bg-white p-4 rounded border">
                  <h3 className="font-medium text-gray-700 mb-2">⚠️ Risks & Assumptions</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {result.api_payloads_used.risks && result.api_payloads_used.risks.length > 0 && (
                      <div>
                        <h4 className="font-medium text-sm text-red-700 mb-2">Risks:</h4>
                        <ul className="text-xs text-red-600 space-y-1">
                          {result.api_payloads_used.risks.map((risk, index) => (
                            <li key={index} className="flex items-start">
                              <span className="mr-2">•</span>
                              <span>{risk}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {result.api_payloads_used.assumptions && result.api_payloads_used.assumptions.length > 0 && (
                      <div>
                        <h4 className="font-medium text-sm text-blue-700 mb-2">Assumptions:</h4>
                        <ul className="text-xs text-blue-600 space-y-1">
                          {result.api_payloads_used.assumptions.map((assumption, index) => (
                            <li key={index} className="flex items-start">
                              <span className="mr-2">•</span>
                              <span>{assumption}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Product Fingerprint */}
              {(result.mcp_audit?.product_fingerprint || result.product_insights?.fingerprint) && (
                <div className="bg-white p-4 rounded border">
                  <h3 className="font-medium text-gray-700 mb-2">🔍 Product Fingerprint</h3>
                  <div className="text-sm text-gray-600">
                    <p className="font-mono bg-gray-100 p-2 rounded">
                      {result.mcp_audit?.product_fingerprint || result.product_insights?.fingerprint}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Used for deduplication - prevents creating duplicate campaigns for the same product
                    </p>
                  </div>
                </div>
              )}

              {result.ai_usage_summary && (
                <div className="bg-white p-4 rounded border">
                  <h3 className="font-medium text-gray-700 mb-2">💰 AI Usage & Costs</h3>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p><strong>Total Tokens:</strong> {result.ai_usage_summary.total_tokens.toLocaleString()}</p>
                    <p><strong>Total Cost:</strong> ${result.ai_usage_summary.total_cost.toFixed(4)}</p>
                    <div className="mt-2">
                      <p><strong>By Tool:</strong></p>
                      <div className="ml-4 space-y-1">
                        {result.ai_usage_summary.by_tool.map((tool, index: number) => (
                          <div key={index} className="text-xs">
                            <span className="font-medium">{tool.tool}:</span> {tool.tokens.toLocaleString()} tokens (${tool.cost.toFixed(4)})
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {result.product_insights && (
                <div className="bg-white p-4 rounded border">
                  <h3 className="font-medium text-gray-700 mb-2">🚀 AI Product Analysis</h3>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p><strong>Category:</strong> {result.product_insights.category}</p>
                    <p><strong>Brand Tone:</strong> {result.product_insights.brand_tone}</p>
                    <p><strong>Target Audience:</strong> {result.product_insights.audience_persona}</p>
                    <p><strong>Value Proposition:</strong> {result.product_insights.value_proposition}</p>
                    <p><strong>Keywords:</strong> {result.product_insights.keywords?.slice(0, 5).join(', ')}</p>
                    {result.product_insights.target_segments && (
                      <p><strong>Target Segments:</strong> {result.product_insights.target_segments.map((s) => s.segment).join(', ')}</p>
                    )}
                  </div>
                </div>
              )}

              {result.mcp_insights && (
                <div className="bg-white p-4 rounded border">
                  <h3 className="font-medium text-gray-700 mb-2">MCP Intelligence Insights</h3>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p><strong>Data Quality:</strong> {result.mcp_insights.data_quality}</p>
                    <p><strong>Strategy Approach:</strong> {result.mcp_insights.strategy_approach}</p>
                    <p><strong>Recommended Ad Sets:</strong> {result.mcp_insights.recommended_adsets}</p>
                  </div>
                </div>
              )}

              {result.execution_summary && (
                <div className="bg-white p-4 rounded border">
                  <h3 className="font-medium text-gray-700 mb-2">Execution Summary</h3>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p><strong>Total Steps:</strong> {result.execution_summary.total_steps}</p>
                    <p><strong>Successful:</strong> {result.execution_summary.successful_steps}</p>
                    <p><strong>Failed:</strong> {result.execution_summary.failed_steps}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {result.support_alerts && result.support_alerts.length > 0 && (
            <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded p-4">
              <h3 className="font-medium text-yellow-800 mb-2">🚨 Support Alerts</h3>
              <div className="space-y-2">
                {result.support_alerts.map((alert, index: number) => (
                  <div key={index} className={`text-sm p-2 rounded ${
                    alert.severity === 'HIGH' ? 'bg-red-100 text-red-700' :
                    alert.severity === 'MEDIUM' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-blue-100 text-blue-700'
                  }`}>
                    <div className="flex items-start">
                      <span className="font-medium mr-2">
                        {alert.severity === 'HIGH' ? '🔴' : 
                         alert.severity === 'MEDIUM' ? '🟡' : '🔵'}
                      </span>
                      <div>
                        <p className="font-medium">{alert.type}</p>
                        <p>{alert.message}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <details className="mt-4">
            <summary className="cursor-pointer font-medium text-gray-700">
              View Full Response
            </summary>
            <pre className="mt-2 text-xs bg-gray-100 p-4 rounded overflow-auto max-h-96">
              {JSON.stringify(result, null, 2)}
            </pre>
          </details>
        </div>
      )}
    </div>
  );
}