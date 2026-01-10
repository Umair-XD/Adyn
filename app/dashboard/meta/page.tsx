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
    code: string;
    creationTime: string;
    lastFiredTime?: string;
  }>;
  lastSyncAt?: string;
  createdAt: string;
}

interface MetaCacheStatus {
  success: boolean;
  isCached: boolean;
  isStale?: boolean;
  lastUpdated?: string;
  syncStatus?: string;
  timePeriod?: string;
  insightsDateRange?: {
    startDate: string;
    endDate: string;
  };
  dataStats?: {
    campaigns: number;
    adsets: number;
    ads: number;
    insights: number;
    customAudiences: number;
    pixels: number;
  };
  detailedStats?: {
    totalSpend: number;
    totalImpressions: number;
    totalClicks: number;
    ctr: number;
    cpc: number;
    cpm: number;
  };
  collections?: {
    topCampaigns: Array<{
      id: string;
      name: string;
      status: string;
      spend: number;
      objective: string;
    }>;
    customAudiences: Array<{
      id: string;
      name: string;
      subtype: string;
      size: number;
    }>;
  };
}

export default function MetaPage() {
  const [accounts, setAccounts] = useState<MetaAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Cache management state
  const [cacheStatus, setCacheStatus] = useState<MetaCacheStatus | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [selectedTimePeriod, setSelectedTimePeriod] = useState<string>('last_90_days');
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');

  const timePeriodOptions = [
    { value: 'last_30_days', label: 'Last 30 Days', description: 'Recent performance data' },
    { value: 'last_90_days', label: 'Last 90 Days', description: 'Recommended for most accounts' },
    { value: 'last_6_months', label: 'Last 6 Months', description: 'Seasonal patterns included' },
    { value: 'last_year', label: 'Last Year', description: 'Full yearly cycles' },
    { value: 'last_2_years', label: 'Last 2 Years', description: 'Long-term trends' },
    { value: 'last_5_years', label: 'Last 5 Years', description: 'Maximum historical data' },
    { value: 'all_time', label: 'All Time', description: 'Complete account history (up to 10 years)' }
  ];

  useEffect(() => {
    loadAccounts();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    // Check for success/error messages from OAuth callback
    const urlParams = new URLSearchParams(window.location.search);
    const successParam = urlParams.get('success');
    const errorParam = urlParams.get('error');
    
    if (successParam === 'meta_connected') {
      setSuccess('Meta account connected successfully!');
      // Clear URL params
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (errorParam) {
      const reason = urlParams.get('reason');
      setError(`Failed to connect Meta account: ${reason || 'Unknown error'}`);
      // Clear URL params
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const loadAccounts = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/meta/accounts');
      const data = await response.json();
      
      if (response.ok) {
        setAccounts(data.accounts || []);
        // Set first account as selected for caching
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

  const connectMeta = async () => {
    try {
      setConnecting(true);
      setError('');
      
      const response = await fetch('/api/meta/connect');
      const data = await response.json();
      
      if (response.ok) {
        // Redirect to Meta OAuth
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
        // Clear selected account if it was disconnected
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

  const checkCacheStatus = async () => {
    if (!selectedAccountId) return;
    
    try {
      // Add details=true to get full stats
      const response = await fetch(`/api/meta/sync-complete?metaAccountId=${selectedAccountId}&details=true`);
      const data = await response.json();
      setCacheStatus(data);
    } catch (err) {
      console.error('Failed to check cache status:', err);
      setCacheStatus({ success: false, isCached: false });
    }
  };

  const syncMetaData = async (forceRefresh = false) => {
    if (!selectedAccountId) {
      setError('Please select a Meta account first');
      return;
    }

    const selectedAccount = accounts.find(acc => acc.accountId === selectedAccountId);
    if (!selectedAccount) {
      setError('Selected account not found');
      return;
    }

    try {
      setSyncing(true);
      setError('');
      setSuccess('');

      const response = await fetch('/api/meta/sync-complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          metaAccountId: selectedAccountId,
          forceRefresh,
          timePeriod: selectedTimePeriod
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Sync failed');
      } else {
        setSuccess(`Meta data synced successfully for ${data.timePeriod}!`);
        await checkCacheStatus();
      }
    } catch {
      setError('An error occurred during sync. Please try again.');
    } finally {
      setSyncing(false);
    }
  };

  // Load cache status when account is selected
  useEffect(() => {
    if (selectedAccountId) {
      checkCacheStatus();
    }
  }, [selectedAccountId]); // eslint-disable-line react-hooks/exhaustive-deps

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getAccountStatusText = (status: number) => {
    switch (status) {
      case 1: return { text: 'Active', color: 'text-green-600' };
      case 2: return { text: 'Disabled', color: 'text-red-600' };
      case 3: return { text: 'Unsettled', color: 'text-yellow-600' };
      case 7: return { text: 'Pending Review', color: 'text-blue-600' };
      case 9: return { text: 'In Grace Period', color: 'text-orange-600' };
      case 100: return { text: 'Pending Closure', color: 'text-red-600' };
      case 101: return { text: 'Closed', color: 'text-gray-600' };
      default: return { text: 'Unknown', color: 'text-gray-600' };
    }
  };

  const formatCurrency = (value: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-US', { notation: "compact", compactDisplay: "short" }).format(value);
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
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">🚀 Meta Ads Integration</h1>
        <p className="text-gray-600 mb-6">
          Connect your Meta ad accounts to enable intelligent campaign generation with real account data, audience targeting, and lightning-fast performance.
        </p>

        {/* Success/Error Messages */}
        {error && (
          <div className="mb-6 text-red-600 text-sm bg-red-50 p-3 rounded-lg border border-red-200">{error}</div>
        )}
        {success && (
          <div className="mb-6 text-green-600 text-sm bg-green-50 p-3 rounded-lg border border-green-200">{success}</div>
        )}

        {/* Connected Accounts List */}
        <div className="bg-gray-50 rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">📊 Connected Meta Accounts</h2>
            <button
              onClick={connectMeta}
              disabled={connecting}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium flex items-center space-x-2"
            >
              {connecting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Connecting...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <span>Connect Meta Account</span>
                </>
              )}
            </button>
          </div>

          {accounts.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Meta Accounts Connected</h3>
              <p className="text-gray-600 mb-4">Connect your Meta ad accounts to start creating intelligent campaigns.</p>
              <button
                onClick={connectMeta}
                disabled={connecting}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
              >
                {connecting ? 'Connecting...' : 'Connect Your First Meta Account'}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {accounts.map((account) => {
                const statusInfo = getAccountStatusText(account.accountStatus);
                return (
                  <div key={account._id} className="bg-white rounded-lg border border-gray-200 p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">{account.accountName}</h3>
                          <span className={`text-sm font-medium ${statusInfo.color}`}>
                            {statusInfo.text}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                          <div>
                            <span className="font-medium">Account ID:</span>
                            <p className="font-mono">{account.accountId}</p>
                          </div>
                          <div>
                            <span className="font-medium">Currency:</span>
                            <p>{account.currency}</p>
                          </div>
                          <div>
                            <span className="font-medium">Timezone:</span>
                            <p>{account.timezoneName}</p>
                          </div>
                          <div>
                            <span className="font-medium">Pixels:</span>
                            <p>{account.pixels?.length || 0} connected</p>
                          </div>
                        </div>

                        {(account.businessName || account.portfolioName) && (
                          <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                            {account.businessName && (
                              <span>🏢 {account.businessName}</span>
                            )}
                            {account.portfolioName && (
                              <span>📁 {account.portfolioName}</span>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setSelectedAccountId(account.accountId)}
                          className={`px-3 py-1 text-sm rounded-lg font-medium ${
                            selectedAccountId === account.accountId
                              ? 'bg-blue-100 text-blue-700 border border-blue-300'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {selectedAccountId === account.accountId ? 'Selected' : 'Select'}
                        </button>
                        <button
                          onClick={() => disconnectAccount(account.accountId)}
                          className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 font-medium"
                        >
                          Disconnect
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Data Caching & Insights Section */}
        {accounts.length > 0 && selectedAccountId && (
          <div className="space-y-8">
            {/* Cache Control & Status */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">🔄 Data Cache & Sync</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Last updated: {cacheStatus?.lastUpdated ? formatDate(cacheStatus.lastUpdated) : 'Never'}
                  </p>
                </div>
                <div className="flex gap-2">
                   <select
                      value={selectedTimePeriod}
                      onChange={(e) => setSelectedTimePeriod(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={syncing}
                    >
                      {timePeriodOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() => syncMetaData(true)}
                      disabled={syncing}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm font-medium flex items-center space-x-2"
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
                          <span>{cacheStatus?.isCached ? 'Force Refresh' : 'Sync Now'}</span>
                        </>
                      )}
                    </button>
                </div>
              </div>

               {cacheStatus?.isCached ? (
                 <>
                  {/* Status Indicator */}
                  <div className="flex items-center gap-2 mb-6">
                     <span className={`inline-block w-2.5 h-2.5 rounded-full ${cacheStatus.isStale ? 'bg-yellow-400' : 'bg-green-500'}`}></span>
                     <span className="text-sm font-medium text-gray-700">
                        {cacheStatus.isStale ? 'Cache Stale (Recommended Refresh)' : 'Cache Active & Fresh'}
                     </span>
                  </div>

                  {/* High Level Metrics Cards */}
                  {cacheStatus.detailedStats && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                       <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                          <p className="text-sm text-blue-600 font-medium mb-1">Total Spend</p>
                          <p className="text-2xl font-bold text-gray-900">
                            {formatCurrency(cacheStatus.detailedStats.totalSpend, activeAccount?.currency)}
                          </p>
                       </div>
                       <div className="bg-purple-50 p-4 rounded-xl border border-purple-100">
                          <p className="text-sm text-purple-600 font-medium mb-1">Impressions</p>
                          <p className="text-2xl font-bold text-gray-900">
                            {formatNumber(cacheStatus.detailedStats.totalImpressions)}
                          </p>
                       </div>
                       <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                           <p className="text-sm text-indigo-600 font-medium mb-1">Link Clicks</p>
                           <p className="text-2xl font-bold text-gray-900">
                              {formatNumber(cacheStatus.detailedStats.totalClicks)}
                           </p>
                       </div>
                       <div className="bg-green-50 p-4 rounded-xl border border-green-100">
                           <p className="text-sm text-green-600 font-medium mb-1">Click-Through Rate</p>
                           <p className="text-2xl font-bold text-gray-900">
                              {cacheStatus.detailedStats.ctr.toFixed(2)}%
                           </p>
                       </div>
                    </div>
                  )}

                  <div className="grid md:grid-cols-2 gap-8">
                    {/* Top Campaigns Table */}
                    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                       <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                          <h3 className="font-semibold text-gray-900">Top Active Campaigns</h3>
                          <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded border">By Spend</span>
                       </div>
                       <div className="overflow-x-auto">
                          <table className="w-full text-sm text-left">
                             <thead className="bg-gray-50 text-gray-500 font-medium">
                                <tr>
                                   <th className="px-6 py-3">Campaign Name</th>
                                   <th className="px-6 py-3">Status</th>
                                   <th className="px-6 py-3 text-right">Spend</th>
                                </tr>
                             </thead>
                             <tbody className="divide-y divide-gray-100">
                                {cacheStatus.collections?.topCampaigns?.length === 0 ? (
                                   <tr>
                                      <td colSpan={3} className="px-6 py-8 text-center text-gray-500">
                                         No active campaigns found in this period.
                                      </td>
                                   </tr>
                                ) : (
                                   cacheStatus.collections?.topCampaigns?.map(campaign => (
                                     <tr key={campaign.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-3 font-medium text-gray-900">{campaign.name}</td>
                                        <td className="px-6 py-3">
                                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                            campaign.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                          }`}>
                                            {campaign.status}
                                          </span>
                                        </td>
                                        <td className="px-6 py-3 text-right text-gray-900">
                                           {formatCurrency(campaign.spend, activeAccount?.currency)}
                                        </td>
                                     </tr>
                                   ))
                                )}
                             </tbody>
                          </table>
                       </div>
                    </div>

                    {/* Custom Audiences Table */}
                     <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                       <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                          <h3 className="font-semibold text-gray-900">Available Custom Audiences</h3>
                          <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded border">For AI Targeting</span>
                       </div>
                       <div className="overflow-x-auto">
                          <table className="w-full text-sm text-left">
                             <thead className="bg-gray-50 text-gray-500 font-medium">
                                <tr>
                                   <th className="px-6 py-3">Audience Name</th>
                                   <th className="px-6 py-3">Source</th>
                                   <th className="px-6 py-3 text-right">Size</th>
                                </tr>
                             </thead>
                             <tbody className="divide-y divide-gray-100">
                                {cacheStatus.collections?.customAudiences?.length === 0 ? (
                                   <tr>
                                      <td colSpan={3} className="px-6 py-8 text-center text-gray-500">
                                         No custom audiences found.
                                      </td>
                                   </tr>
                                ) : (
                                   cacheStatus.collections?.customAudiences?.map(audience => (
                                     <tr key={audience.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-3 font-medium text-gray-900">{audience.name}</td>
                                        <td className="px-6 py-3 text-gray-500 capitalize">{audience.subtype.replace(/_/g, ' ').toLowerCase()}</td>
                                        <td className="px-6 py-3 text-right text-gray-900">
                                           {formatNumber(audience.size)}
                                        </td>
                                     </tr>
                                   ))
                                )}
                             </tbody>
                          </table>
                       </div>
                    </div>
                  </div>
                 </>
               ) : (
                  <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                    <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                       <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                       </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900">Data Not Cached</h3>
                    <p className="text-gray-500 max-w-sm mx-auto mt-2 mb-6">
                       Sync your account data to unlock insights, enable intelligent optimization, and speed up campaign creation.
                    </p>
                    <button
                      onClick={() => syncMetaData(false)}
                      className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                    >
                       Start Initial Sync
                    </button>
                  </div>
               )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}