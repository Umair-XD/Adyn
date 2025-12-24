'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';

interface MetaAccount {
  _id: string;
  accountId: string;
  accountName: string;
  businessId?: string;
  businessName?: string;
  portfolioId?: string;
  portfolioName?: string;
  currency: string;
  timezoneName: string;
  accountStatus: number;
  pixels: Array<{
    id: string;
    name: string;
    code: string;
    creationTime: string;
    lastFiredTime?: string;
  }>;
  lastSyncAt?: string;
}

interface MetaCampaign {
  id: string;
  name: string;
  status: string;
  objective: string;
  created_time: string;
  daily_budget?: string;
  lifetime_budget?: string;
  insights?: {
    impressions: string;
    clicks: string;
    spend: string;
    cpm: string;
    cpc: string;
    ctr: string;
  };
}

interface MetaAd {
  id: string;
  name: string;
  adset_id: string;
  status: string;
  creative: Record<string, unknown>;
  created_time: string;
  insights?: {
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
    action_values?: Array<{
      action_type: string;
      value: string;
    }>;
    conversions?: Array<{
      action_type: string;
      value: string;
    }>;
    cost_per_action_type?: Array<{
      action_type: string;
      value: string;
    }>;
  };
}

interface PixelEvent {
  event_name: string;
  count: number;
  unique_count: number;
}

interface PixelCardProps {
  pixel: {
    id: string;
    name: string;
    code: string;
    creationTime: string;
    lastFiredTime?: string;
  };
  accountId: string;
}

function WinningAdsAnalysis({ ads }: { ads: MetaAd[] }) {
  // Analyze ads to find winners
  const analyzeAds = () => {
    const adsWithMetrics = ads.filter(ad => ad.insights && parseFloat(ad.insights.spend || '0') > 10);
    
    if (adsWithMetrics.length === 0) return null;

    // Sort by different metrics
    const topCTR = [...adsWithMetrics].sort((a, b) => parseFloat(b.insights?.ctr || '0') - parseFloat(a.insights?.ctr || '0')).slice(0, 3);
    const topConversions = [...adsWithMetrics].sort((a, b) => {
      const aConv = a.insights?.conversions?.reduce((sum, conv) => sum + parseFloat(conv.value), 0) || 0;
      const bConv = b.insights?.conversions?.reduce((sum, conv) => sum + parseFloat(conv.value), 0) || 0;
      return bConv - aConv;
    }).slice(0, 3);
    const lowestCPC = [...adsWithMetrics].sort((a, b) => parseFloat(a.insights?.cpc || '999') - parseFloat(b.insights?.cpc || '999')).slice(0, 3);

    return { topCTR, topConversions, lowestCPC };
  };

  const analysis = analyzeAds();

  if (!analysis) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-yellow-800 mb-2">🔍 Winning Ads Analysis</h3>
        <p className="text-yellow-700">Not enough ad data to analyze winning patterns.</p>
        <p className="text-sm text-yellow-600 mt-1">Need ads with at least $10 spend to generate insights.</p>
      </div>
    );
  }

  const extractWinningElements = (ad: MetaAd) => {
    const ctr = parseFloat(ad.insights?.ctr || '0');
    const cpc = parseFloat(ad.insights?.cpc || '0');
    const conversions = ad.insights?.conversions?.reduce((sum, conv) => sum + parseFloat(conv.value), 0) || 0;
    
    return {
      name: ad.name,
      ctr: ctr.toFixed(2),
      cpc: cpc.toFixed(2),
      conversions: conversions.toFixed(0),
      spend: parseFloat(ad.insights?.spend || '0').toFixed(2),
      creative: ad.creative
    };
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-green-800 mb-4">🏆 Winning Ads Analysis</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Top CTR Ads */}
          <div className="bg-white rounded-lg p-4 border border-green-200">
            <h4 className="font-semibold text-green-700 mb-3">🎯 Highest CTR</h4>
            <div className="space-y-3">
              {analysis.topCTR.map((ad) => {
                const data = extractWinningElements(ad);
                return (
                  <div key={ad.id} className="border-l-4 border-green-400 pl-3">
                    <p className="text-sm font-medium text-gray-900">{data.name}</p>
                    <p className="text-xs text-green-600">CTR: {data.ctr}% | Spend: ${data.spend}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Top Conversions */}
          <div className="bg-white rounded-lg p-4 border border-blue-200">
            <h4 className="font-semibold text-blue-700 mb-3">💰 Most Conversions</h4>
            <div className="space-y-3">
              {analysis.topConversions.map((ad) => {
                const data = extractWinningElements(ad);
                return (
                  <div key={ad.id} className="border-l-4 border-blue-400 pl-3">
                    <p className="text-sm font-medium text-gray-900">{data.name}</p>
                    <p className="text-xs text-blue-600">Conversions: {data.conversions} | Spend: ${data.spend}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Lowest CPC */}
          <div className="bg-white rounded-lg p-4 border border-purple-200">
            <h4 className="font-semibold text-purple-700 mb-3">💎 Lowest CPC</h4>
            <div className="space-y-3">
              {analysis.lowestCPC.map((ad) => {
                const data = extractWinningElements(ad);
                return (
                  <div key={ad.id} className="border-l-4 border-purple-400 pl-3">
                    <p className="text-sm font-medium text-gray-900">{data.name}</p>
                    <p className="text-xs text-purple-600">CPC: ${data.cpc} | CTR: {data.ctr}%</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Actionable Insights */}
        <div className="mt-6 bg-white rounded-lg p-4 border border-gray-200">
          <h4 className="font-semibold text-gray-800 mb-3">📊 Winning Patterns for New Ads</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h5 className="text-sm font-medium text-gray-700 mb-2">🎯 Best Performing Metrics:</h5>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Average winning CTR: {(analysis.topCTR.reduce((sum, ad) => sum + parseFloat(ad.insights?.ctr || '0'), 0) / analysis.topCTR.length).toFixed(2)}%</li>
                <li>• Average winning CPC: ${(analysis.lowestCPC.reduce((sum, ad) => sum + parseFloat(ad.insights?.cpc || '0'), 0) / analysis.lowestCPC.length).toFixed(2)}</li>
                <li>• Top conversion rate: {analysis.topConversions[0] ? (parseFloat(analysis.topConversions[0].insights?.conversions?.[0]?.value || '0') / parseFloat(analysis.topConversions[0].insights?.clicks || '1') * 100).toFixed(2) : '0'}%</li>
              </ul>
            </div>
            <div>
              <h5 className="text-sm font-medium text-gray-700 mb-2">🚀 Recommendations for New Ads:</h5>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Target CTR above {(analysis.topCTR.reduce((sum, ad) => sum + parseFloat(ad.insights?.ctr || '0'), 0) / analysis.topCTR.length * 0.8).toFixed(1)}%</li>
                <li>• Keep CPC below ${(analysis.lowestCPC.reduce((sum, ad) => sum + parseFloat(ad.insights?.cpc || '0'), 0) / analysis.lowestCPC.length * 1.2).toFixed(2)}</li>
                <li>• Scale winning ad formats and copy styles</li>
                <li>• Test similar audiences to top performers</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PixelCard({ pixel, accountId }: PixelCardProps) {
  const [pixelEvents, setPixelEvents] = useState<PixelEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [showCode, setShowCode] = useState(false);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days ago
    endDate: new Date().toISOString().split('T')[0] // today
  });

  const fetchPixelEvents = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(
        `/api/meta/pixels?accountId=${accountId}&pixelId=${pixel.id}&startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`
      );
      const data = await response.json();
      
      if (data.error) {
        setError(data.error);
        setPixelEvents([]);
      } else {
        setPixelEvents(data.events || []);
      }
    } catch (error) {
      console.error('Failed to fetch pixel events:', error);
      setError('Failed to fetch pixel data. Please try again.');
      setPixelEvents([]);
    } finally {
      setLoading(false);
    }
  }, [accountId, pixel.id, dateRange.startDate, dateRange.endDate]);

  useEffect(() => {
    fetchPixelEvents();
  }, [fetchPixelEvents]);

  const totalEvents = pixelEvents.reduce((sum, event) => sum + event.count, 0);
  const totalUniqueEvents = pixelEvents.reduce((sum, event) => sum + event.unique_count, 0);

  return (
    <div className="border border-gray-200 rounded-lg p-6 space-y-4">
      {/* Pixel Header */}
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{pixel.name}</h3>
          <p className="text-sm text-gray-600">ID: {pixel.id}</p>
          <div className="flex items-center gap-4 mt-2">
            <p className="text-sm text-gray-600">
              Created: {new Date(pixel.creationTime).toLocaleDateString()}
            </p>
            <p className="text-sm text-gray-600">
              Last Fired: {pixel.lastFiredTime ? new Date(pixel.lastFiredTime).toLocaleDateString() : 'Never'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-2 py-1 rounded text-xs font-medium ${
            pixel.lastFiredTime ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}>
            {pixel.lastFiredTime ? 'Active' : 'Inactive'}
          </span>
        </div>
      </div>

      {/* Date Range Selector */}
      <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
        <label className="text-sm font-medium text-gray-700">Date Range:</label>
        <input
          type="date"
          value={dateRange.startDate}
          onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
          className="text-sm border border-gray-300 rounded px-2 py-1"
        />
        <span className="text-gray-500">to</span>
        <input
          type="date"
          value={dateRange.endDate}
          onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
          className="text-sm border border-gray-300 rounded px-2 py-1"
        />
        <button
          onClick={fetchPixelEvents}
          disabled={loading}
          className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:bg-blue-400"
        >
          {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {/* Pixel Analytics */}
      {loading ? (
        <div className="text-center py-8">
          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm text-gray-600 mt-2">Loading pixel events...</p>
        </div>
      ) : (
        <>
          {/* Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-xs font-medium text-blue-700">Total Events</p>
              <p className="text-xl font-bold text-blue-900">{totalEvents.toLocaleString()}</p>
            </div>
            <div className="bg-green-50 p-3 rounded-lg">
              <p className="text-xs font-medium text-green-700">Unique Events</p>
              <p className="text-xl font-bold text-green-900">{totalUniqueEvents.toLocaleString()}</p>
            </div>
            <div className="bg-purple-50 p-3 rounded-lg">
              <p className="text-xs font-medium text-purple-700">Event Types</p>
              <p className="text-xl font-bold text-purple-900">{pixelEvents.length}</p>
            </div>
            <div className="bg-orange-50 p-3 rounded-lg">
              <p className="text-xs font-medium text-orange-700">Avg/Day</p>
              <p className="text-xl font-bold text-orange-900">
                {Math.round(totalEvents / Math.max(1, Math.ceil((new Date(dateRange.endDate).getTime() - new Date(dateRange.startDate).getTime()) / (1000 * 60 * 60 * 24)))).toLocaleString()}
              </p>
            </div>
          </div>

          {/* Event Breakdown */}
          {error ? (
            <div className="text-center py-6">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center justify-center mb-2">
                  <svg className="w-6 h-6 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <p className="text-yellow-800 font-medium">Unable to fetch pixel data</p>
                <p className="text-yellow-700 text-sm mt-1">{error}</p>
                <div className="mt-3 text-xs text-yellow-600">
                  <p><strong>Possible reasons:</strong></p>
                  <ul className="list-disc list-inside mt-1 space-y-1">
                    <li>Pixel has no recent activity</li>
                    <li>Insufficient permissions for pixel insights</li>
                    <li>Pixel is not properly installed on website</li>
                    <li>Date range has no recorded events</li>
                  </ul>
                </div>
              </div>
            </div>
          ) : pixelEvents.length > 0 ? (
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Event Breakdown</h4>
              <div className="space-y-2">
                {pixelEvents.map((event, idx) => (
                  <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{event.event_name}</p>
                      <p className="text-sm text-gray-600">
                        {event.count.toLocaleString()} total • {event.unique_count.toLocaleString()} unique
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">
                        {totalEvents > 0 ? ((event.count / totalEvents) * 100).toFixed(1) : '0'}%
                      </p>
                      <div className="w-20 bg-gray-200 rounded-full h-2 mt-1">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${totalEvents > 0 ? (event.count / totalEvents) * 100 : 0}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-6 text-gray-500">
              <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <p className="font-medium">No pixel events found</p>
              <p className="text-sm">No events recorded for the selected date range.</p>
              <div className="mt-4 text-xs text-gray-400">
                <p><strong>To see pixel data:</strong></p>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li>Install the pixel code on your website</li>
                  <li>Ensure events are being fired (PageView, Purchase, etc.)</li>
                  <li>Wait for data to populate (can take 24-48 hours)</li>
                  <li>Check if the pixel is active and firing</li>
                </ul>
              </div>
            </div>
          )}
        </>
      )}

      {/* Pixel Code */}
      <div>
        <button
          onClick={() => setShowCode(!showCode)}
          className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900"
        >
          <svg className={`w-4 h-4 transition-transform ${showCode ? 'rotate-90' : ''}`} fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
          </svg>
          {showCode ? 'Hide' : 'Show'} Pixel Code
        </button>
        {showCode && (
          <div className="mt-2 bg-gray-900 p-4 rounded-lg overflow-x-auto">
            <pre className="text-xs text-gray-300 whitespace-pre-wrap">{pixel.code}</pre>
          </div>
        )}
      </div>
    </div>
  );
}

export default function MetaDashboard() {
  const [accounts, setAccounts] = useState<MetaAccount[]>([]);
  const [campaigns, setCampaigns] = useState<MetaCampaign[]>([]);
  const [ads, setAds] = useState<MetaAd[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [adsLoading, setAdsLoading] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  const fetchAds = useCallback(async (accountId: string) => {
    setAdsLoading(true);
    try {
      const response = await fetch(`/api/meta/ads?accountId=${accountId}&insights=true&startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`);
      const data = await response.json();
      setAds(data.ads || []);
    } catch (error) {
      console.error('Failed to fetch ads:', error);
      setAds([]);
    } finally {
      setAdsLoading(false);
    }
  }, [dateRange.startDate, dateRange.endDate]);

  useEffect(() => {
    fetchAccounts();
  }, []);

  useEffect(() => {
    if (selectedAccount) {
      fetchCampaigns(selectedAccount);
      if (activeTab === 'ads') {
        fetchAds(selectedAccount);
      }
    }
  }, [selectedAccount, activeTab, dateRange, fetchAds]);

  const fetchAccounts = async () => {
    try {
      const response = await fetch('/api/meta/accounts');
      const data = await response.json();
      setAccounts(data.accounts || []);
      if (data.accounts?.length > 0) {
        setSelectedAccount(data.accounts[0].accountId);
      }
    } catch (error) {
      console.error('Failed to fetch Meta accounts:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCampaigns = async (accountId: string) => {
    try {
      const response = await fetch(`/api/meta/campaigns?accountId=${accountId}&insights=true`);
      const data = await response.json();
      setCampaigns(data.campaigns || []);
    } catch (error) {
      console.error('Failed to fetch campaigns:', error);
    }
  };

  const connectMetaAccount = async () => {
    setConnecting(true);
    try {
      const response = await fetch('/api/meta/connect');
      const data = await response.json();
      if (data.authUrl) {
        window.location.href = data.authUrl;
      }
    } catch (error) {
      console.error('Failed to connect Meta account:', error);
      setConnecting(false);
    }
  };

  const disconnectAccount = async (accountId: string) => {
    if (!confirm('Are you sure you want to disconnect this Meta account?')) return;
    
    try {
      await fetch(`/api/meta/accounts?accountId=${accountId}`, { method: 'DELETE' });
      fetchAccounts();
    } catch (error) {
      console.error('Failed to disconnect account:', error);
    }
  };

  if (loading) {
    return <div className="text-center text-gray-600 py-8">Loading Meta integration...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Meta Integration</h1>
          <p className="text-gray-600 mt-2">Connect and manage your Facebook/Instagram ad accounts</p>
        </div>
        {accounts.length === 0 && (
          <button
            onClick={connectMetaAccount}
            disabled={connecting}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 flex items-center gap-2"
          >
            {connecting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Connecting...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                Connect Meta Account
              </>
            )}
          </button>
        )}
      </div>

      {accounts.length > 0 ? (
        <>
          {/* Account Selector with Business/Portfolio Structure */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Connected Business Accounts</h2>
            
            {/* Group accounts by business and portfolio */}
            {(() => {
              const groupedAccounts = accounts.reduce((groups, account) => {
                const businessKey = account.businessId || 'personal';
                const portfolioKey = account.portfolioId || 'direct';
                
                if (!groups[businessKey]) {
                  groups[businessKey] = {
                    businessName: account.businessName || 'Personal Accounts',
                    portfolios: {}
                  };
                }
                
                if (!groups[businessKey].portfolios[portfolioKey]) {
                  groups[businessKey].portfolios[portfolioKey] = {
                    portfolioName: account.portfolioName || 'Direct Ad Accounts',
                    accounts: []
                  };
                }
                
                groups[businessKey].portfolios[portfolioKey].accounts.push(account);
                return groups;
              }, {} as Record<string, {
                businessName: string;
                portfolios: Record<string, {
                  portfolioName: string;
                  accounts: typeof accounts;
                }>;
              }>);

              return Object.entries(groupedAccounts).map(([businessKey, businessData]) => (
                <div key={businessKey} className="mb-6">
                  {/* Business Header */}
                  <div className="flex items-center gap-2 mb-3">
                    <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm2 6a2 2 0 114 0 2 2 0 01-4 0zm8-1a1 1 0 100 2h2a1 1 0 100-2h-2z" clipRule="evenodd" />
                    </svg>
                    <h3 className="text-lg font-semibold text-blue-900">{businessData.businessName}</h3>
                  </div>

                  {/* Portfolios */}
                  {Object.entries(businessData.portfolios).map(([portfolioKey, portfolioData]: [string, { portfolioName: string; accounts: MetaAccount[] }]) => (
                    <div key={portfolioKey} className="ml-4 mb-4">
                      {/* Portfolio Header */}
                      <div className="flex items-center gap-2 mb-2">
                        <svg className="w-4 h-4 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
                        </svg>
                        <h4 className="font-medium text-purple-800">{portfolioData.portfolioName}</h4>
                        <span className="text-xs text-gray-500">({portfolioData.accounts.length} accounts)</span>
                      </div>

                      {/* Ad Accounts */}
                      <div className="ml-6 space-y-2">
                        {portfolioData.accounts.map((account: MetaAccount) => (
                          <div
                            key={account._id}
                            className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                              selectedAccount === account.accountId
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                            onClick={() => setSelectedAccount(account.accountId)}
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <h5 className="font-medium text-gray-900">{account.accountName}</h5>
                                <p className="text-sm text-gray-600">ID: {account.accountId}</p>
                                <p className="text-sm text-gray-600">
                                  {account.currency} • {account.timezoneName}
                                </p>
                                <p className="text-sm text-gray-600">
                                  {account.pixels.length} pixel(s) • Last sync: {account.lastSyncAt ? new Date(account.lastSyncAt).toLocaleDateString() : 'Never'}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className={`px-2 py-1 rounded text-xs font-medium ${
                                  account.accountStatus === 1 
                                    ? 'bg-green-100 text-green-700' 
                                    : 'bg-red-100 text-red-700'
                                }`}>
                                  {account.accountStatus === 1 ? 'Active' : 'Inactive'}
                                </span>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    disconnectAccount(account.accountId);
                                  }}
                                  className="text-red-600 hover:text-red-700 text-sm"
                                >
                                  Disconnect
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ));
            })()}
            
            <button
              onClick={connectMetaAccount}
              disabled={connecting}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 text-sm"
            >
              Connect Another Business Account
            </button>
          </div>

          {selectedAccount && (
            <>
              {/* Tabs */}
              <div className="border-b border-gray-200">
                <nav className="flex space-x-8">
                  {['overview', 'campaigns', 'ads', 'pixels', 'automation'].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`py-4 px-1 border-b-2 font-medium text-sm capitalize ${
                        activeTab === tab
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </nav>
              </div>

              {/* Tab Content */}
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                {activeTab === 'overview' && (
                  <div className="space-y-6">
                    <h2 className="text-xl font-semibold text-gray-900">Account Overview</h2>
                    
                    {/* Quick Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <p className="text-sm font-medium text-blue-700">Total Campaigns</p>
                        <p className="text-2xl font-bold text-blue-900">{campaigns.length}</p>
                      </div>
                      <div className="bg-green-50 p-4 rounded-lg">
                        <p className="text-sm font-medium text-green-700">Active Campaigns</p>
                        <p className="text-2xl font-bold text-green-900">
                          {campaigns.filter(c => c.status === 'ACTIVE').length}
                        </p>
                      </div>
                      <div className="bg-purple-50 p-4 rounded-lg">
                        <p className="text-sm font-medium text-purple-700">Total Pixels</p>
                        <p className="text-2xl font-bold text-purple-900">
                          {accounts.find(a => a.accountId === selectedAccount)?.pixels.length || 0}
                        </p>
                      </div>
                      <div className="bg-orange-50 p-4 rounded-lg">
                        <p className="text-sm font-medium text-orange-700">Total Spend</p>
                        <p className="text-2xl font-bold text-orange-900">
                          ${campaigns.reduce((sum, c) => sum + parseFloat(c.insights?.spend || '0'), 0).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'campaigns' && (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <h2 className="text-xl font-semibold text-gray-900">Campaigns</h2>
                      <Link
                        href="/dashboard/campaigns/new"
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        Create Campaign
                      </Link>
                    </div>
                    
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Objective</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Spend</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Impressions</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Clicks</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">CTR</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {campaigns.map((campaign) => (
                            <tr key={campaign.id}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {campaign.name}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                  campaign.status === 'ACTIVE' 
                                    ? 'bg-green-100 text-green-800'
                                    : campaign.status === 'PAUSED'
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : 'bg-gray-100 text-gray-800'
                                }`}>
                                  {campaign.status}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {campaign.objective}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                ${parseFloat(campaign.insights?.spend || '0').toFixed(2)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {parseInt(campaign.insights?.impressions || '0').toLocaleString()}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {parseInt(campaign.insights?.clicks || '0').toLocaleString()}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {parseFloat(campaign.insights?.ctr || '0').toFixed(2)}%
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {activeTab === 'ads' && (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <h2 className="text-xl font-semibold text-gray-900">Ad Performance Analytics</h2>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <label className="text-sm font-medium text-gray-700">Date Range:</label>
                          <input
                            type="date"
                            value={dateRange.startDate}
                            onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                            className="text-sm border border-gray-300 rounded px-2 py-1"
                          />
                          <span className="text-gray-500">to</span>
                          <input
                            type="date"
                            value={dateRange.endDate}
                            onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                            className="text-sm border border-gray-300 rounded px-2 py-1"
                          />
                        </div>
                        <button
                          onClick={() => fetchAds(selectedAccount)}
                          disabled={adsLoading}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400"
                        >
                          {adsLoading ? 'Loading...' : 'Refresh Ads'}
                        </button>
                      </div>
                    </div>

                    {adsLoading ? (
                      <div className="text-center py-12">
                        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-gray-600">Loading ad performance data...</p>
                      </div>
                    ) : (
                      <>
                        {/* Winning Ads Section */}
                        <WinningAdsAnalysis ads={ads} />
                        
                        {/* All Ads Performance Table */}
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-4">All Ads Performance</h3>
                          <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                              <thead className="bg-gray-50">
                                <tr>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ad Name</th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Spend</th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Impressions</th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Clicks</th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">CTR</th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">CPC</th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">CPM</th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Conversions</th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-200">
                                {ads.map((ad) => {
                                  const conversions = ad.insights?.conversions?.reduce((sum, conv) => sum + parseFloat(conv.value), 0) || 0;
                                  const ctr = parseFloat(ad.insights?.ctr || '0');
                                  const cpc = parseFloat(ad.insights?.cpc || '0');
                                  
                                  return (
                                    <tr key={ad.id} className={`${ctr > 2 ? 'bg-green-50' : ctr > 1 ? 'bg-yellow-50' : ''}`}>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        <div>
                                          <p>{ad.name}</p>
                                          <p className="text-xs text-gray-500">ID: {ad.id}</p>
                                        </div>
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                          ad.status === 'ACTIVE' 
                                            ? 'bg-green-100 text-green-800'
                                            : ad.status === 'PAUSED'
                                            ? 'bg-yellow-100 text-yellow-800'
                                            : 'bg-gray-100 text-gray-800'
                                        }`}>
                                          {ad.status}
                                        </span>
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        ${parseFloat(ad.insights?.spend || '0').toFixed(2)}
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {parseInt(ad.insights?.impressions || '0').toLocaleString()}
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {parseInt(ad.insights?.clicks || '0').toLocaleString()}
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        <span className={`${ctr > 2 ? 'text-green-600 font-semibold' : ctr > 1 ? 'text-yellow-600 font-medium' : ''}`}>
                                          {ctr.toFixed(2)}%
                                        </span>
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        ${cpc.toFixed(2)}
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        ${parseFloat(ad.insights?.cpm || '0').toFixed(2)}
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        <span className={`${conversions > 0 ? 'text-green-600 font-semibold' : ''}`}>
                                          {conversions.toFixed(0)}
                                        </span>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                          
                          {ads.length === 0 && (
                            <div className="text-center py-8 text-gray-500">
                              <p>No ads found for the selected account and date range.</p>
                              <p className="text-sm">Try adjusting the date range or check if you have active campaigns.</p>
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                )}

                {activeTab === 'pixels' && (
                  <div className="space-y-6">
                    <h2 className="text-xl font-semibold text-gray-900">Facebook Pixels</h2>
                    
                    <div className="space-y-6">
                      {accounts.find(a => a.accountId === selectedAccount)?.pixels.map((pixel) => (
                        <PixelCard key={pixel.id} pixel={pixel} accountId={selectedAccount} />
                      ))}
                    </div>
                  </div>
                )}

                {activeTab === 'automation' && (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <h2 className="text-xl font-semibold text-gray-900">Automation Rules</h2>
                      <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                        Create Rule
                      </button>
                    </div>
                    
                    <div className="text-center py-8 text-gray-500">
                      <p>Automation rules will be displayed here.</p>
                      <p className="text-sm">Create rules to automatically optimize your campaigns based on performance metrics.</p>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </>
      ) : (
        <div className="text-center py-12">
          <div className="mx-auto w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <svg className="w-12 h-12 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Connect Your Meta Account</h2>
          <p className="text-gray-600 mb-6">
            Connect your Facebook/Instagram ad account to automate campaign creation, 
            fetch pixel data, and manage your advertising from one place.
          </p>
          <button
            onClick={connectMetaAccount}
            disabled={connecting}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400"
          >
            {connecting ? 'Connecting...' : 'Connect Meta Account'}
          </button>
        </div>
      )}
    </div>
  );
}