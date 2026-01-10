'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { AdynOutput } from '@/types';

interface Campaign {
  id: string;
  name: string;
  objective: string;
  platforms: string[];
  generationResult: AdynOutput & {
    intelligent_campaign_data?: {
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
      product_fingerprint?: string;
    };
  };
  project: {
    id: string;
    name: string;
  };
  source: {
    inputUrl: string;
  };
}

interface CampaignStats {
  campaign: {
    id: string;
    name: string;
  };
  totalGenerations: number;
  tokenUsage: {
    prompt: number;
    completion: number;
    total: number;
  };
  estimatedCost: {
    total: number;
    perMillionTokens: {
      prompt: number;
      completion: number;
    };
  };
  moduleBreakdown?: Array<{
    module: string;
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
    reasoningTokens: number;
    cachedInputTokens: number;
    cost: number;
    callCount: number;
  }>;
}

export default function CampaignDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [stats, setStats] = useState<CampaignStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
// ... existing state
  const [metaAccounts, setMetaAccounts] = useState<Array<{ accountId: string; accountName: string }>>([]);
  const [showAccountSelector, setShowAccountSelector] = useState(false);
  const [selectedMetaAccountId, setSelectedMetaAccountId] = useState('');
  const [metaActionLoading, setMetaActionLoading] = useState(false);

  // ... existing useEffect


  useEffect(() => {
    const fetchData = async () => {
      try {
        const [campaignRes, statsRes] = await Promise.all([
          fetch(`/api/campaigns/${params.id}`),
          fetch(`/api/stats?campaignId=${params.id}`)
        ]);
        
        const campaignData = await campaignRes.json();
        const statsData = await statsRes.json();
        
        setCampaign(campaignData.campaign);
        setStats(statsData);
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [params.id]);

  const loadMetaAccounts = async () => {
    try {
      const response = await fetch('/api/meta/accounts');
      const data = await response.json();
      if (response.ok) {
        setMetaAccounts(data.accounts || []);
      }
    } catch (error) {
      console.error('Failed to load meta accounts:', error);
    }
  };

  const createMetaCampaign = async () => {
    if (!selectedMetaAccountId || !campaign) return;
    
    setMetaActionLoading(true);
    try {
      const response = await fetch('/api/campaigns/create-meta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaignId: campaign.id,
          metaAccountId: selectedMetaAccountId
        })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        alert('Meta campaign created successfully!');
        setShowAccountSelector(false);
        // Refresh campaign data to show new meta info
        const campaignRes = await fetch(`/api/campaigns/${params.id}`);
        const campaignData = await campaignRes.json();
        setCampaign(campaignData.campaign);
      } else {
        alert(`Failed to create Meta campaign: ${data.error}`);
      }
    } catch (error) {
      console.error('Meta campaign creation error:', error);
      alert('Failed to create Meta campaign details');
    } finally {
      setMetaActionLoading(false);
    }
  };

  const exportJSON = () => {
    if (!campaign) return;
    
    const dataStr = JSON.stringify(campaign.generationResult, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${campaign.name.replace(/\s+/g, '-')}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleDelete = async () => {
    if (!campaign) return;
    
    if (!confirm(`Are you sure you want to delete "${campaign.name}"? This will also delete the related source and generation logs.`)) {
      return;
    }

    setDeleting(true);
    try {
      const response = await fetch(`/api/campaigns/${campaign.id}/delete`, {
        method: 'DELETE',
      });

      if (response.ok) {
        router.push(`/dashboard/projects/${campaign.project.id}`);
      } else {
        const data = await response.json();
        alert(`Failed to delete campaign: ${data.error}`);
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('Failed to delete campaign');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return <div className="text-center text-gray-600">Loading...</div>;
  }

  if (!campaign) {
    return <div className="text-center text-gray-600">Campaign not found</div>;
  }

  const result = campaign.generationResult;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <Link
            href={`/dashboard/projects/${campaign.project.id}`}
            className="text-blue-600 hover:text-blue-700 flex items-center space-x-2 mb-4"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span>Back to {campaign.project.name}</span>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">{campaign.name}</h1>
          <p className="text-gray-600 mt-2">Source: {campaign.source.inputUrl}</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Create Meta Campaign Section */}
          {result.intelligent_campaign_data && (
            <div className="flex items-center gap-3">
              {/* Account Selector Dialog/Dropdown */}
              {showAccountSelector ? (
                <div className="relative">
                  <select
                    value={selectedMetaAccountId}
                    onChange={(e) => setSelectedMetaAccountId(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 mr-2 min-w-[200px]"
                    disabled={metaActionLoading}
                  >
                    <option value="">Select Meta Account</option>
                    {metaAccounts.map((account) => (
                      <option key={account.accountId} value={account.accountId}>
                        {account.accountName} ({account.accountId})
                      </option>
                    ))}
                  </select>
                  
                  <div className="flex items-center gap-2 mt-2 absolute right-0 top-full bg-white p-2 shadow-lg rounded-lg border border-gray-200 z-10 w-[300px]">
                    <button
                      onClick={() => setShowAccountSelector(false)}
                      className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
                      disabled={metaActionLoading}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={createMetaCampaign}
                      disabled={!selectedMetaAccountId || metaActionLoading}
                      className="flex-1 px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 disabled:opacity-50"
                    >
                      {metaActionLoading ? 'Creating...' : 'Confirm & Create'}
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => {
                    // Load accounts if not loaded
                    if (metaAccounts.length === 0) loadMetaAccounts();
                    setShowAccountSelector(true);
                  }}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 whitespace-nowrap"
                >
                  <svg className="w-5 h-5 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                  <span>Create Meta Campaign</span>
                </button>
              )}
            </div>
          )}
          
          <button
            onClick={exportJSON}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 whitespace-nowrap"
          >
            <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            <span>Export JSON</span>
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-red-400 flex items-center gap-2 whitespace-nowrap"
          >
            <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            <span>{deleting ? 'Deleting...' : 'Delete'}</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {['overview', 'ads', 'audience', 'strategy', 'intelligent', 'stats'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab === 'intelligent' ? '🚀 AI Campaign' : tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Product Summary</h2>
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-gray-700">Summary</p>
                  <p className="text-gray-900 mt-1">{result.product_summary.summary}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Value Proposition</p>
                  <p className="text-gray-900 mt-1">{result.product_summary.value_proposition}</p>
                </div>
                {result.product_summary.unique_selling_point && (
                  <div>
                    <p className="text-sm font-medium text-gray-700">Unique Selling Point</p>
                    <p className="text-gray-900 mt-1 font-medium">{result.product_summary.unique_selling_point}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium text-gray-700">Brand Tone</p>
                  <p className="text-gray-900 mt-1 capitalize">{result.product_summary.brand_tone}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Category</p>
                  <p className="text-gray-900 mt-1 capitalize">{result.product_summary.category}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Target Persona</p>
                  <p className="text-gray-900 mt-1">{result.product_summary.audience_persona}</p>
                </div>
              </div>
            </div>

            {/* Geographic Analysis */}
            {result.product_summary.geographic_analysis && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Geographic Analysis</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Origin Country</p>
                    <p className="text-lg font-semibold text-gray-900 mt-1">{result.product_summary.geographic_analysis.origin_country}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Primary Market Primary City Targeting</p>
                    <div className="flex flex-wrap gap-2">
                      {result.product_summary.geographic_analysis.primary_markets?.map((market, idx) => (
                        <span key={idx} className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                          {market}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Cultural Context</p>
                    <p className="text-gray-900 mt-1">{result.product_summary.geographic_analysis.cultural_context}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Local Preferences</p>
                    <ul className="list-disc list-inside space-y-1">
                      {result.product_summary.geographic_analysis.local_preferences?.map((pref, idx) => (
                        <li key={idx} className="text-sm text-gray-900">{pref}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Regional Competitors</p>
                    <div className="flex flex-wrap gap-2">
                      {result.product_summary.geographic_analysis.regional_competitors?.map((competitor, idx) => (
                        <span key={idx} className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm">
                          {competitor}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Competitor Analysis */}
            {result.product_summary.competitor_analysis && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Competitor Analysis</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Main Competitors</p>
                    <div className="flex flex-wrap gap-2">
                      {result.product_summary.competitor_analysis.main_competitors?.map((competitor, idx) => (
                        <span key={idx} className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm">
                          {competitor}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Competitive Advantages</p>
                    <ul className="list-disc list-inside space-y-1">
                      {result.product_summary.competitor_analysis.competitive_advantages?.map((advantage, idx) => (
                        <li key={idx} className="text-sm text-gray-900">{advantage}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Market Positioning</p>
                    <p className="text-gray-900 mt-1">{result.product_summary.competitor_analysis.market_positioning}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Differentiation Strategy</p>
                    <p className="text-gray-900 mt-1">{result.product_summary.competitor_analysis.differentiation_strategy}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Market Size Estimation */}
            {result.product_summary.market_size_estimation && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Market Size Estimation</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-sm font-medium text-blue-700">Total Addressable Market</p>
                    <p className="text-xl font-bold text-blue-900 mt-1">{result.product_summary.market_size_estimation.total_addressable_market}</p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <p className="text-sm font-medium text-green-700">Serviceable Addressable Market</p>
                    <p className="text-xl font-bold text-green-900 mt-1">{result.product_summary.market_size_estimation.serviceable_addressable_market}</p>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <p className="text-sm font-medium text-purple-700">Target Market Size</p>
                    <p className="text-xl font-bold text-purple-900 mt-1">{result.product_summary.market_size_estimation.target_market_size}</p>
                  </div>
                  <div className="bg-orange-50 p-4 rounded-lg">
                    <p className="text-sm font-medium text-orange-700">Growth Potential</p>
                    <p className="text-lg font-semibold text-orange-900 mt-1">{result.product_summary.market_size_estimation.growth_potential}</p>
                  </div>
                </div>
              </div>
            )}

            {result.product_summary.keywords && result.product_summary.keywords.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Keywords</h2>
                <div className="flex flex-wrap gap-2">
                  {result.product_summary.keywords.map((keyword, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                    >
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'ads' && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">Ad Creatives</h2>
            {result.ad_creatives.map((ad, idx) => (
              <div key={idx} className="border border-gray-200 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">{ad.platform}</h3>
                  <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">
                    {ad.platform}
                  </span>
                </div>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Headline</p>
                    <p className="text-gray-900 mt-1 font-medium">{ad.headline}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Primary Text</p>
                    <p className="text-gray-900 mt-1">{ad.primary_text}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Call to Action</p>
                    <p className="text-gray-900 mt-1">{ad.cta}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Creative Description</p>
                    <p className="text-gray-900 mt-1">{ad.creative_description}</p>
                  </div>
                  {ad.hashtags && ad.hashtags.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-gray-700">Hashtags</p>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {ad.hashtags.map((tag, i) => (
                          <span key={i} className="text-blue-600">{tag}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {ad.interest_targeting && (
                    <div>
                      <p className="text-sm font-medium text-gray-700">Interest Targeting</p>
                      <div className="mt-2 space-y-2">
                        <div>
                          <p className="text-xs font-medium text-purple-700">Primary Interests</p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {ad.interest_targeting.primary_interests?.map((interest, i) => (
                              <span key={i} className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs">{interest}</span>
                            ))}
                          </div>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-green-700">Trending Interests</p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {ad.interest_targeting.trending_interests?.map((interest, i) => (
                              <span key={i} className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">{interest}</span>
                            ))}
                          </div>
                        </div>
                        {ad.interest_targeting.lookalike_audiences && ad.interest_targeting.lookalike_audiences.length > 0 && (
                          <div>
                            <p className="text-xs font-medium text-orange-700">Lookalike Audiences</p>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {ad.interest_targeting.lookalike_audiences.map((audience, i) => (
                                <span key={i} className="px-2 py-1 bg-orange-100 text-orange-700 rounded text-xs">{audience}</span>
                              ))}
                            </div>
                          </div>
                        )}
                        {ad.interest_targeting.demographic_insights && (
                          <div>
                            <p className="text-xs font-medium text-gray-700">Demographics</p>
                            <p className="text-xs text-gray-600 mt-1">{ad.interest_targeting.demographic_insights}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'audience' && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Audience Targeting</h2>
            
            {/* Basic Targeting */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Age Range</p>
                <p className="text-gray-900">{result.audience_targeting.age_range}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Primary Market Primary City Targeting</p>
                <div className="space-y-1">
                  {result.product_summary.geographic_analysis.primary_markets?.map((market, idx) => (
                    <span key={idx} className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm mr-2 mb-2 inline-block">
                      {market}
                    </span>
                  )) || <p className="text-gray-500">No locations specified</p>}
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Interest Groups</p>
                <div className="flex flex-wrap gap-2">
                  {result.audience_targeting.interest_groups?.map((interest, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm"
                    >
                      {interest}
                    </span>
                  )) || <span className="text-gray-500">No interests specified</span>}
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Behaviors</p>
                <div className="flex flex-wrap gap-2">
                  {result.audience_targeting.behaviors?.map((behavior, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm"
                    >
                      {behavior}
                    </span>
                  )) || <span className="text-gray-500">No behaviors specified</span>}
                </div>
              </div>
            </div>

            {/* Detailed Interests by Category */}
            {result.audience_targeting.detailed_interests && result.audience_targeting.detailed_interests.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Detailed Interest Targeting</h3>
                <div className="space-y-4">
                  {result.audience_targeting.detailed_interests.map((category, idx) => (
                    <div key={idx} className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex justify-between items-center mb-3">
                        <h4 className="font-medium text-gray-900">{category.category}</h4>
                        <span className="text-sm text-gray-600">{category.audience_size_estimate}</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {category.interests.map((interest, i) => (
                          <span key={i} className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-sm">
                            {interest}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'strategy' && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Campaign Strategy</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm font-medium text-gray-700">Campaign Name</p>
                <p className="text-gray-900 mt-1">{result.campaign_strategy.campaign_name}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Objective</p>
                <p className="text-gray-900 mt-1">{result.campaign_strategy.objective}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Budget Suggestion</p>
                <p className="text-gray-900 mt-1">{result.campaign_strategy.budget_suggestion}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Duration</p>
                <p className="text-gray-900 mt-1">{result.campaign_strategy.duration_days} days</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Platform Mix</p>
                <div className="flex flex-wrap gap-2">
                  {result.campaign_strategy.platform_mix?.map((platform, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                    >
                      {platform}
                    </span>
                  )) || <span className="text-gray-500">No platforms specified</span>}
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Ad Formats</p>
                <div className="flex flex-wrap gap-2">
                  {result.campaign_strategy.formats?.map((format, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm"
                    >
                      {format}
                    </span>
                  )) || <span className="text-gray-500">No formats specified</span>}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'intelligent' && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">🚀 AI-Generated Campaign Structure</h2>
            
            {result.intelligent_campaign_data ? (
              <div className="space-y-6">
                {/* AI Reasoning */}
                {result.intelligent_campaign_data.ai_reasoning && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-blue-800 mb-3">🧠 AI Strategy Reasoning</h3>
                    <p className="text-blue-700">{result.intelligent_campaign_data.ai_reasoning}</p>
                  </div>
                )}

                {/* Campaign Structure */}
                {result.intelligent_campaign_data.campaign_payload && (
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">📋 Campaign Configuration</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-gray-700">Campaign Name</p>
                        <p className="text-gray-900 mt-1">{result.intelligent_campaign_data.campaign_payload.name}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700">Objective</p>
                        <p className="text-gray-900 mt-1">{result.intelligent_campaign_data.campaign_payload.objective}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700">Status</p>
                        <p className="text-gray-900 mt-1">{result.intelligent_campaign_data.campaign_payload.status}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700">Buying Type</p>
                        <p className="text-gray-900 mt-1">{result.intelligent_campaign_data.campaign_payload.buying_type}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Ad Sets */}
                {result.intelligent_campaign_data.adset_payloads && result.intelligent_campaign_data.adset_payloads.length > 0 && (
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">🎯 Ad Sets Configuration</h3>
                    <div className="space-y-4">
                      {result.intelligent_campaign_data.adset_payloads.map((adset, index) => (
                        <div key={index} className="border border-gray-200 rounded-lg p-4">
                          <h4 className="font-semibold text-gray-800 mb-3">{adset.name}</h4>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <p className="text-sm font-medium text-gray-700 mb-2">Targeting</p>
                              <div className="text-sm text-gray-600 space-y-1">
                                <p>Age: {adset.targeting.age_min}-{adset.targeting.age_max}</p>
                                <p>Countries: {adset.targeting.geo_locations.countries.join(', ')}</p>
                                {adset.targeting.interests && adset.targeting.interests.length > 0 && (
                                  <p>Interests: {adset.targeting.interests.slice(0, 3).map(i => i.name).join(', ')}</p>
                                )}
                              </div>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-700 mb-2">Optimization</p>
                              <div className="text-sm text-gray-600 space-y-1">
                                <p>Goal: {adset.optimization.optimization_goal}</p>
                                <p>Billing: {adset.optimization.billing_event}</p>
                                <p>Bid Strategy: {adset.optimization.bid_strategy}</p>
                              </div>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-700 mb-2">Budget</p>
                              <div className="text-sm text-gray-600 space-y-1">
                                <p>Daily: ${adset.budget.daily_budget}</p>
                                <p>Type: {adset.budget.budget_type}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Creatives */}
                {result.intelligent_campaign_data.creative_payloads && result.intelligent_campaign_data.creative_payloads.length > 0 && (
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">🎨 Creative Configuration</h3>
                    <div className="space-y-4">
                      {result.intelligent_campaign_data.creative_payloads.map((creative, index) => (
                        <div key={index} className="border border-gray-200 rounded-lg p-4">
                          <h4 className="font-semibold text-gray-800 mb-3">{creative.creative.name}</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm font-medium text-gray-700">Ad Set Reference</p>
                              <p className="text-sm text-gray-600 mt-1">{creative.adset_ref}</p>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-700">Call to Action</p>
                              <p className="text-sm text-gray-600 mt-1">{creative.creative.object_story_spec.link_data.call_to_action.type}</p>
                            </div>
                            <div className="md:col-span-2">
                              <p className="text-sm font-medium text-gray-700">Headline</p>
                              <p className="text-sm text-gray-600 mt-1">{creative.creative.object_story_spec.link_data.name}</p>
                            </div>
                            <div className="md:col-span-2">
                              <p className="text-sm font-medium text-gray-700">Primary Text</p>
                              <p className="text-sm text-gray-600 mt-1">{creative.creative.object_story_spec.link_data.message}</p>
                            </div>
                            <div className="md:col-span-2">
                              <p className="text-sm font-medium text-gray-700">Description</p>
                              <p className="text-sm text-gray-600 mt-1">{creative.creative.object_story_spec.link_data.description}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Risks and Assumptions */}
                {(result.intelligent_campaign_data.risks || result.intelligent_campaign_data.assumptions) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {result.intelligent_campaign_data.risks && result.intelligent_campaign_data.risks.length > 0 && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                        <h3 className="text-lg font-semibold text-red-800 mb-3">⚠️ Identified Risks</h3>
                        <ul className="space-y-2">
                          {result.intelligent_campaign_data.risks.map((risk, index) => (
                            <li key={index} className="text-sm text-red-700 flex items-start">
                              <span className="mr-2 mt-1">•</span>
                              <span>{risk}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {result.intelligent_campaign_data.assumptions && result.intelligent_campaign_data.assumptions.length > 0 && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                        <h3 className="text-lg font-semibold text-blue-800 mb-3">💡 AI Assumptions</h3>
                        <ul className="space-y-2">
                          {result.intelligent_campaign_data.assumptions.map((assumption, index) => (
                            <li key={index} className="text-sm text-blue-700 flex items-start">
                              <span className="mr-2 mt-1">•</span>
                              <span>{assumption}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {/* Product Fingerprint */}
                {result.intelligent_campaign_data.product_fingerprint && (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-3">🔍 Product Fingerprint</h3>
                    <p className="text-sm text-gray-600 mb-2">Used for deduplication and campaign optimization:</p>
                    <code className="bg-gray-100 px-3 py-2 rounded text-sm font-mono text-gray-800">
                      {result.intelligent_campaign_data.product_fingerprint}
                    </code>
                  </div>
                )}

                {/* Meta Campaign Creation */}
                <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-green-800 mb-3">🚀 Ready for Meta Campaign Creation</h3>
                  <p className="text-green-700 mb-4">
                    This AI-generated campaign structure is ready to be deployed to Meta. Connect your Meta ad account to create live campaigns, ad sets, and creatives.
                  </p>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={async () => {
                        try {
                          const response = await fetch('/api/campaigns/create-meta', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              campaignId: campaign.id,
                              metaAccountId: 'act_placeholder' // TODO: Get from user's connected Meta account
                            })
                          });
                          
                          const data = await response.json();
                          
                          if (response.ok) {
                            alert('Meta campaign created successfully!');
                          } else {
                            alert(`Failed to create Meta campaign: ${data.error}`);
                          }
                        } catch (error) {
                          console.error('Meta campaign creation error:', error);
                          alert('Failed to create Meta campaign');
                        }
                      }}
                      className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
                    >
                      Create Live Meta Campaign
                    </button>
                    <a
                      href="/dashboard/meta"
                      className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                    >
                      Connect Meta Account
                    </a>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-yellow-800 mb-2">⚠️ Legacy Campaign</h3>
                <p className="text-yellow-700">
                  This campaign was created with the old system. Create a new campaign to use the intelligent AI-powered flow with Meta-ready configurations.
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'stats' && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Campaign Statistics</h2>
            
            {stats ? (
              <>
                {/* Token Usage Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
                    <p className="text-sm font-medium text-blue-700">Prompt Tokens</p>
                    <p className="text-3xl font-bold text-blue-900 mt-2">
                      {stats.tokenUsage.prompt.toLocaleString()}
                    </p>
                    <p className="text-xs text-blue-600 mt-1">
                      ${stats.estimatedCost.perMillionTokens.prompt.toFixed(2)} per 1M
                    </p>
                  </div>

                  <div className="bg-green-50 p-6 rounded-lg border border-green-200">
                    <p className="text-sm font-medium text-green-700">Completion Tokens</p>
                    <p className="text-3xl font-bold text-green-900 mt-2">
                      {stats.tokenUsage.completion.toLocaleString()}
                    </p>
                    <p className="text-xs text-green-600 mt-1">
                      ${stats.estimatedCost.perMillionTokens.completion.toFixed(2)} per 1M
                    </p>
                  </div>

                  <div className="bg-purple-50 p-6 rounded-lg border border-purple-200">
                    <p className="text-sm font-medium text-purple-700">Total Tokens</p>
                    <p className="text-3xl font-bold text-purple-900 mt-2">
                      {stats.tokenUsage.total.toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Cost Breakdown */}
                <div className="bg-white p-6 rounded-lg border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Cost Breakdown</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700">Prompt Cost</span>
                      <span className="font-semibold text-gray-900">
                        ${((stats.tokenUsage.prompt / 1_000_000) * stats.estimatedCost.perMillionTokens.prompt).toFixed(4)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700">Completion Cost</span>
                      <span className="font-semibold text-gray-900">
                        ${((stats.tokenUsage.completion / 1_000_000) * stats.estimatedCost.perMillionTokens.completion).toFixed(4)}
                      </span>
                    </div>
                    <div className="border-t border-gray-200 pt-3 flex justify-between items-center">
                      <span className="text-lg font-semibold text-gray-900">Total Estimated Cost</span>
                      <span className="text-2xl font-bold text-blue-600">
                        ${stats.estimatedCost.total.toFixed(4)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Per-Action Breakdown */}
                {stats.moduleBreakdown && stats.moduleBreakdown.length > 0 && (
                  <div className="bg-white p-6 rounded-lg border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Token Usage by Action</h3>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Action/Tool
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Input Tokens
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Output Tokens
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Reasoning Tokens
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Cached Tokens
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Total Tokens
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Calls
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Cost
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {stats.moduleBreakdown.map((module, idx) => (
                            <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                              <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {module.module}
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                                {module.inputTokens.toLocaleString()}
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                                {module.outputTokens.toLocaleString()}
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap text-sm text-blue-600">
                                {module.reasoningTokens?.toLocaleString() || '0'}
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap text-sm text-green-600">
                                {module.cachedInputTokens?.toLocaleString() || '0'}
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                                {module.totalTokens.toLocaleString()}
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                                {module.callCount}
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                                ${module.cost.toFixed(4)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Pricing Info */}
                <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">OpenAI GPT-4o Pricing</h3>
                  <div className="space-y-1 text-sm text-gray-700">
                    <p>• Input: ${stats.estimatedCost.perMillionTokens.prompt.toFixed(2)} per 1M tokens</p>
                    <p>• Output: ${stats.estimatedCost.perMillionTokens.completion.toFixed(2)} per 1M tokens</p>
                    <p className="text-xs text-gray-500 mt-2">Costs are estimates based on OpenAI pricing via AI Gateway</p>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center text-gray-600 py-8">
                <p>No statistics available for this campaign</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
