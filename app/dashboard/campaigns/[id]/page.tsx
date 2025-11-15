'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
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

export default function CampaignDetailPage() {
  const params = useParams();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchCampaign();
  }, [params.id]);

  const fetchCampaign = async () => {
    try {
      const response = await fetch(`/api/campaigns/${params.id}`);
      const data = await response.json();
      setCampaign(data.campaign);
    } catch (error) {
      console.error('Failed to fetch campaign:', error);
    } finally {
      setLoading(false);
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
        <button
          onClick={exportJSON}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center space-x-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          <span>Export JSON</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {['overview', 'ads', 'audience', 'strategy'].map((tab) => (
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
                  {ad.hashtags.length > 0 && (
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
                  {result.audience_targeting.geos.map((geo, idx) => (
                    <p key={idx} className="text-gray-900">{geo}</p>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Interest Groups</p>
                <div className="flex flex-wrap gap-2">
                  {result.audience_targeting.interest_groups.map((interest, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm"
                    >
                      {interest}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Behaviors</p>
                <div className="flex flex-wrap gap-2">
                  {result.audience_targeting.behaviors.map((behavior, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm"
                    >
                      {behavior}
                    </span>
                  ))}
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
                  {result.campaign_strategy.platform_mix.map((platform, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                    >
                      {platform}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Ad Formats</p>
                <div className="flex flex-wrap gap-2">
                  {result.campaign_strategy.formats.map((format, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm"
                    >
                      {format}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
