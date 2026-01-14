'use client';

import { useEffect, useState } from 'react';

interface MetaAccount {
  _id: string;
  accountId: string;
  accountName: string;
  businessName?: string;
  portfolioName?: string;
  currency: string;
  timezoneName: string;
  accountStatus: number;
  pixels: Array<{
    id: string;
    name: string;
  }>;
}

interface EnhancedSyncStatus {
  synced: boolean;
  hasEnhancedData: boolean;
  isStale: boolean;
  lastUpdated: string;
  syncStatus: string;
  timePeriod: string;
  stats: {
    campaigns: number;
    adsets: number;
    ads: number;
    insights: number;
    successMetrics: number;
    winningPatterns: number;
  };
}

interface SuccessInsights {
  overallPerformance: {
    avgROAS: number;
    avgCTR: number;
    avgConversionRate: number;
    totalSpend: number;
    totalRevenue: number;
    totalConversions: number;
    accountMaturity: string;
  };
  topPerformingCampaigns: Array<{
    campaignId: string;
    campaignName: string;
    successScore: number;
    roas: number;
    ctr: number;
    spend: number;
  }>;
  winningPatterns: Array<{
    pattern: string;
    impact: string;
    recommendation: string;
  }>;
  recommendations: Array<{
    type: string;
    priority: string;
    title: string;
    description: string;
    expectedImpact: string;
  }>;
}

export default function MetaPage() {
  const [accounts, setAccounts] = useState<MetaAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [syncing, setSyncing] = useState(false);
  
  // Tab state
  const [activeTab, setActiveTab] = useState<'overview' | 'campaigns' | 'insights' | 'recommendations'>('overview');
  
  // Account selection
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [selectedTimePeriod, setSelectedTimePeriod] = useState<string>('last_90_days');
  
  // Data state
  const [syncStatus, setSyncStatus] = useState<EnhancedSyncStatus | null>(null);
  const [insights, setInsights] = useState<SuccessInsights | null>(null);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<string | null>(null);
  const [adsets, setAdsets] = useState<any[]>([]);
  const [selectedAdset, setSelectedAdset] = useState<string | null>(null);
  const [ads, setAds] = useState<any[]>([]);

  const timePeriodOptions = [
    { value: 'last_30_days', label: 'Last 30 Days' },
    { value: 'last_90_days', label: 'Last 90 Days' },
    { value: 'last_6_months', label: 'Last 6 Months' },
    { value: 'last_year', label: 'Last Year' },
  ];

  useEffect(() => {
    loadAccounts();
  }, []);

  useEffect(() => {
    if (selectedAccountId) {
      loadEnhancedData();
    }
  }, [selectedAccountId]);

  const loadAccounts = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/meta/accounts');
      const data = await response.json();
      
      if (response.ok) {
        setAccounts(data.accounts || []);
        if (data.accounts?.length > 0 && !selectedAccountId) {
          setSelectedAccountId(data.accounts[0].accountId);
        }
      } else {
        setError(data.error || 'Failed to load accounts');
      }
    } catch (err) {
      console.error('Failed to load accounts:', err);
      setError('Failed to load Meta accounts');
    } finally {
      setLoading(false);
    }
  };

  const loadEnhancedData = async () => {
    try {
      // Load sync status
      const statusRes = await fetch('/api/meta/sync-enhanced');
      const statusData = await statusRes.json();
      setSyncStatus(statusData);

      if (statusData.hasEnhancedData) {
        // Load insights
        const insightsRes = await fetch('/api/meta/success-insights');
        const insightsData = await insightsRes.json();
        setInsights(insightsData.insights);

        // Load campaigns data from cache
        // TODO: Add API endpoint to get campaigns with drill-down
      }
    } catch (err) {
      console.error('Failed to load enhanced data:', err);
    }
  };

  const connectMeta = async () => {
    try {
      setConnecting(true);
      setError('');
      
      const response = await fetch('/api/meta/connect');
      const data = await response.json();
      
      if (response.ok) {
        window.location.href = data.authUrl;
      } else {
        setError(data.error || 'Failed to initiate Meta connection');
      }
    } catch (err) {
      console.error('Meta connection error:', err);
      setError('Failed to connect to Meta');
    } finally {
      setConnecting(false);
    }
  };

  const disconnectAccount = async (accountId: string) => {
    try {
      const response = await fetch(`/api/meta/accounts?accountId=${accountId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        setSuccess('Meta account disconnected successfully');
        await loadAccounts();
        if (selectedAccountId === accountId) {
          setSelectedAccountId('');
        }
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to disconnect account');
      }
    } catch (err) {
      console.error('Disconnect error:', err);
      setError('Failed to disconnect Meta account');
    }
  };

  const triggerEnhancedSync = async () => {
    try {
      setSyncing(true);
      setError('');
      setSuccess('');

      const response = await fetch('/api/meta/sync-enhanced', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          timePeriod: selectedTimePeriod,
          forceRefresh: true,
          includeHistoricalAnalysis: true
        })
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Enhanced sync completed! Reloading data...');
        setTimeout(() => loadEnhancedData(), 2000);
      } else {
        setError(data.error || 'Sync failed');
      }
    } catch (err) {
      console.error('Sync error:', err);
      setError('Failed to trigger sync');
    } finally {
      setSyncing(false);
    }
  };

  const formatCurrency = (value: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-US').format(value);
  };

  const getAccountStatusText = (status: number) => {
    switch (status) {
      case 1: return { text: 'Active', color: 'text-green-600' };
      case 2: return { text: 'Disabled', color: 'text-red-600' };
      default: return { text: 'Unknown', color: 'text-gray-600' };
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Meta accounts...</p>
        </div>
      </div>
    );
  }

  const activeAccount = accounts.find(a => a.accountId === selectedAccountId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">🚀 Meta Ads Manager</h1>
          <p className="text-gray-600 mt-2">
            Comprehensive campaign management, insights, and AI-powered recommendations
          </p>
        </div>
        <div className="flex items-center space-x-3">
          {syncStatus?.isStale && (
            <span className="text-sm text-yellow-600 bg-yellow-50 px-3 py-1 rounded-lg border border-yellow-200">
              Data is stale
            </span>
          )}
          {accounts.length > 0 && (
            <button
              onClick={triggerEnhancedSync}
              disabled={syncing}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm font-medium inline-flex items-center space-x-2"
            >
              {syncing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Syncing...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span>Sync Data</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg border border-red-200">
          {error}
        </div>
      )}
      {success && (
        <div className="text-green-600 text-sm bg-green-50 p-3 rounded-lg border border-green-200">
          {success}
        </div>
      )}

      {/* Account Selection */}
      {accounts.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">No Meta Accounts Connected</h2>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Connect your Meta ad accounts to unlock comprehensive campaign management, performance insights, and AI-powered recommendations.
          </p>
          <button
            onClick={connectMeta}
            disabled={connecting}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
          >
            {connecting ? 'Connecting...' : 'Connect Meta Account'}
          </button>
        </div>
      ) : (
        <>
          {/* Account Selector & Settings */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Connected Accounts</h2>
              <button
                onClick={connectMeta}
                disabled={connecting}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm font-medium"
              >
                + Add Account
              </button>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {accounts.map((account) => {
                const statusInfo = getAccountStatusText(account.accountStatus);
                const isSelected = selectedAccountId === account.accountId;
                
                return (
                  <div
                    key={account._id}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedAccountId(account.accountId)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="font-semibold text-gray-900">{account.accountName}</h3>
                          <span className={`text-xs font-medium ${statusInfo.color}`}>
                            {statusInfo.text}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">ID: {account.accountId}</p>
                        <p className="text-sm text-gray-600">{account.currency} • {account.timezoneName}</p>
                        {account.businessName && (
                          <p className="text-xs text-gray-500 mt-1">🏢 {account.businessName}</p>
                        )}
                      </div>
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
                );
              })}
            </div>

            {/* Time Period Selector */}
            {selectedAccountId && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Data Time Period
                </label>
                <select
                  value={selectedTimePeriod}
                  onChange={(e) => setSelectedTimePeriod(e.target.value)}
                  className="w-full md:w-64 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {timePeriodOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Tabs */}
          {selectedAccountId && syncStatus?.hasEnhancedData && (
            <>
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="border-b border-gray-200">
                  <nav className="flex space-x-8 px-6" aria-label="Tabs">
                    {[
                      { id: 'overview', label: 'Overview', icon: '📊' },
                      { id: 'campaigns', label: 'Campaigns', icon: '🎯' },
                      { id: 'insights', label: 'Performance Insights', icon: '📈' },
                      { id: 'recommendations', label: 'AI Recommendations', icon: '💡' },
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                          activeTab === tab.id
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        <span className="mr-2">{tab.icon}</span>
                        {tab.label}
                      </button>
                    ))}
                  </nav>
                </div>

                {/* Tab Content */}
                <div className="p-6">
                  {activeTab === 'overview' && (
                    <div className="space-y-6">
                      <h2 className="text-2xl font-bold text-gray-900">Account Overview</h2>
                      
                      {insights && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                          <div className="glass p-6 rounded-2xl border-blue-100/50 hover:shadow-blue-500/10 transition-all">
                            <p className="text-sm text-blue-600 font-bold mb-2 flex items-center gap-2">
                              <span className="text-lg">📈</span> Avg ROAS
                            </p>
                            <p className="text-4xl font-black text-gray-900">
                              {insights.overallPerformance.avgROAS.toFixed(2)}<span className="text-xl text-gray-400 ml-1">x</span>
                            </p>
                          </div>
                          <div className="glass p-6 rounded-2xl border-green-100/50 hover:shadow-green-500/10 transition-all">
                            <p className="text-sm text-green-600 font-bold mb-2 flex items-center gap-2">
                              <span className="text-lg">🖱️</span> Avg CTR
                            </p>
                            <p className="text-4xl font-black text-gray-900">
                              {insights.overallPerformance.avgCTR.toFixed(2)}<span className="text-xl text-gray-400 ml-1">%</span>
                            </p>
                          </div>
                          <div className="glass p-6 rounded-2xl border-purple-100/50 hover:shadow-purple-500/10 transition-all">
                            <p className="text-sm text-purple-600 font-bold mb-2 flex items-center gap-2">
                              <span className="text-lg">💰</span> Total Spend
                            </p>
                            <p className="text-3xl font-black text-gray-900">
                              {formatCurrency(insights.overallPerformance.totalSpend, activeAccount?.currency)}
                            </p>
                          </div>
                          <div className="glass p-6 rounded-2xl border-yellow-100/50 hover:shadow-yellow-500/10 transition-all">
                            <p className="text-sm text-yellow-600 font-bold mb-2 flex items-center gap-2">
                              <span className="text-lg">💎</span> Revenue
                            </p>
                            <p className="text-3xl font-black text-gray-900">
                              {formatCurrency(insights.overallPerformance.totalRevenue, activeAccount?.currency)}
                            </p>
                          </div>
                        </div>
                      )}

                      {syncStatus && (
                        <div className="bg-gray-50 rounded-lg p-4">
                          <h3 className="font-semibold text-gray-900 mb-3">Data Summary</h3>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                            <div>
                              <p className="text-gray-600">Campaigns</p>
                              <p className="text-lg font-bold text-gray-900">{syncStatus.stats.campaigns}</p>
                            </div>
                            <div>
                              <p className="text-gray-600">Ad Sets</p>
                              <p className="text-lg font-bold text-gray-900">{syncStatus.stats.adsets}</p>
                            </div>
                            <div>
                              <p className="text-gray-600">Ads</p>
                              <p className="text-lg font-bold text-gray-900">{syncStatus.stats.ads}</p>
                            </div>
                            <div>
                              <p className="text-gray-600">Insights Records</p>
                              <p className="text-lg font-bold text-gray-900">{formatNumber(syncStatus.stats.insights)}</p>
                            </div>
                            <div>
                              <p className="text-gray-600">Success Metrics</p>
                              <p className="text-lg font-bold text-gray-900">{syncStatus.stats.successMetrics}</p>
                            </div>
                            <div>
                              <p className="text-gray-600">Winning Patterns</p>
                              <p className="text-lg font-bold text-gray-900">{syncStatus.stats.winningPatterns}</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === 'campaigns' && (
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 mb-4">Campaign Management</h2>
                      <p className="text-gray-600">Campaign drill-down coming soon...</p>
                    </div>
                  )}

                  {activeTab === 'insights' && insights && (
                    <div className="space-y-6">
                      <h2 className="text-2xl font-bold text-gray-900">Performance Insights</h2>
                      
                      {/* Top Campaigns */}
                      {insights.topPerformingCampaigns.length > 0 && (
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-3">🏆 Top Performing Campaigns</h3>
                          <div className="space-y-3">
                            {insights.topPerformingCampaigns.map((campaign, idx) => (
                              <div key={campaign.campaignId} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                                <div className="flex items-center space-x-4">
                                  <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center text-white font-bold">
                                    #{idx + 1}
                                  </div>
                                  <div>
                                    <h4 className="font-medium text-gray-900">{campaign.campaignName}</h4>
                                    <div className="flex items-center space-x-4 mt-1 text-sm text-gray-600">
                                      <span>Score: <strong>{campaign.successScore.toFixed(1)}/100</strong></span>
                                      <span>ROAS: <strong>{campaign.roas.toFixed(2)}x</strong></span>
                                      <span>CTR: <strong>{campaign.ctr.toFixed(2)}%</strong></span>
                                    </div>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="text-sm text-gray-600">Spend</p>
                                  <p className="text-lg font-bold text-gray-900">{formatCurrency(campaign.spend, activeAccount?.currency)}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Winning Patterns */}
                      {insights.winningPatterns.length > 0 && (
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-3">🎯 Winning Patterns</h3>
                          <div className="grid md:grid-cols-2 gap-4">
                            {insights.winningPatterns.map((pattern, idx) => (
                              <div key={idx} className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border border-green-200">
                                <h4 className="font-medium text-gray-900 mb-2">{pattern.pattern}</h4>
                                <p className="text-sm text-gray-700 mb-2">{pattern.impact}</p>
                                <p className="text-sm text-green-700 font-medium">💡 {pattern.recommendation}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === 'recommendations' && insights && (
                    <div className="space-y-6">
                      <h2 className="text-2xl font-bold text-gray-900">AI Recommendations</h2>
                      
                      {insights.recommendations.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {insights.recommendations.map((rec, idx) => (
                            <div key={idx} className="relative overflow-hidden rounded-2xl border border-blue-100 bg-white p-6 shadow-sm hover:shadow-md transition-all">
                              <div className={`absolute top-0 left-0 w-2 h-full ${
                                rec.priority === 'high' ? 'bg-red-500' :
                                rec.priority === 'medium' ? 'bg-yellow-500' :
                                'bg-blue-500'
                              }`} />
                              <div className="flex items-start justify-between mb-4">
                                <div className="pl-2">
                                  <span className={`text-[10px] font-bold tracking-widest uppercase px-2 py-0.5 rounded ${
                                    rec.priority === 'high' ? 'bg-red-50 text-red-600' :
                                    rec.priority === 'medium' ? 'bg-yellow-50 text-yellow-600' :
                                    'bg-blue-50 text-blue-600'
                                  }`}>
                                    {rec.priority} Priority
                                  </span>
                                  <h3 className="font-bold text-lg text-gray-900 mt-2">{rec.title}</h3>
                                </div>
                              </div>
                              <p className="text-gray-600 text-sm mb-6 pl-2">{rec.description}</p>
                              <div className="flex items-center gap-2 text-sm font-semibold text-green-600 bg-green-50 w-fit px-3 py-1.5 rounded-lg ml-2">
                                <span className="text-lg">📈</span> {rec.expectedImpact}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-12 glass rounded-2xl">
                          <p className="text-gray-500">No AI recommendations available for the selected period.</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* No Data State */}
          {selectedAccountId && !syncStatus?.hasEnhancedData && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">No Data Available</h2>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                Run an enhanced sync to fetch comprehensive campaign data, performance insights, and AI-powered recommendations.
              </p>
              <button
                onClick={triggerEnhancedSync}
                disabled={syncing}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
              >
                {syncing ? 'Syncing...' : 'Run Enhanced Sync'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
