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
  generationResult: AdynOutput;
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
          <button
            onClick={exportJSON}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 whitespace-nowrap"
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
          {['overview', 'ads', 'audience', 'strategy', 'stats'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
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
                  <p className="text-sm font-medium text-gray-700">Brand Tone</p>
                  <p className="text-gray-900 mt-1 capitalize">{result.product_summary.brand_tone}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Category</p>
                  <p className="text-gray-900 mt-1 capitalize">{result.product_summary.category}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Value Proposition</p>
                  <p className="text-gray-900 mt-1">{result.product_summary.value_proposition}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Target Persona</p>
                  <p className="text-gray-900 mt-1">{result.product_summary.audience_persona}</p>
                </div>
              </div>
            </div>

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
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'audience' && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Audience Targeting</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Age Range</p>
                <p className="text-gray-900">{result.audience_targeting.age_range}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Geographic Locations</p>
                <div className="space-y-1">
                  {result.audience_targeting.geos?.map((geo, idx) => (
                    <p key={idx} className="text-gray-900">{geo}</p>
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
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Action/Tool
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Input Tokens
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Output Tokens
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Total Tokens
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Calls
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Cost
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {stats.moduleBreakdown.map((module, idx) => (
                            <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {module.module}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {module.inputTokens.toLocaleString()}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {module.outputTokens.toLocaleString()}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                                {module.totalTokens.toLocaleString()}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {module.callCount}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
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
