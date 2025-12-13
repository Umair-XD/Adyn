'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface MetaAccount {
  _id: string;
  accountId: string;
  accountName: string;
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

export default function MetaDashboard() {
  const [accounts, setAccounts] = useState<MetaAccount[]>([]);
  const [campaigns, setCampaigns] = useState<MetaCampaign[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchAccounts();
  }, []);

  useEffect(() => {
    if (selectedAccount) {
      fetchCampaigns(selectedAccount);
    }
  }, [selectedAccount]);

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
          {/* Account Selector */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Connected Accounts</h2>
            <div className="space-y-3">
              {accounts.map((account) => (
                <div
                  key={account._id}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedAccount === account.accountId
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedAccount(account.accountId)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium text-gray-900">{account.accountName}</h3>
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
            
            <button
              onClick={connectMetaAccount}
              disabled={connecting}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 text-sm"
            >
              Connect Another Account
            </button>
          </div>

          {selectedAccount && (
            <>
              {/* Tabs */}
              <div className="border-b border-gray-200">
                <nav className="flex space-x-8">
                  {['overview', 'campaigns', 'pixels', 'automation'].map((tab) => (
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

                {activeTab === 'pixels' && (
                  <div className="space-y-6">
                    <h2 className="text-xl font-semibold text-gray-900">Facebook Pixels</h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {accounts.find(a => a.accountId === selectedAccount)?.pixels.map((pixel) => (
                        <div key={pixel.id} className="border border-gray-200 rounded-lg p-6">
                          <h3 className="font-medium text-gray-900 mb-2">{pixel.name}</h3>
                          <p className="text-sm text-gray-600 mb-2">ID: {pixel.id}</p>
                          <p className="text-sm text-gray-600 mb-4">
                            Created: {new Date(pixel.creationTime).toLocaleDateString()}
                          </p>
                          <p className="text-sm text-gray-600 mb-4">
                            Last Fired: {pixel.lastFiredTime ? new Date(pixel.lastFiredTime).toLocaleDateString() : 'Never'}
                          </p>
                          <div className="bg-gray-50 p-3 rounded text-xs font-mono text-gray-700 overflow-x-auto">
                            {pixel.code.substring(0, 100)}...
                          </div>
                        </div>
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