'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Stats {
  totalCampaigns?: number;
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
  distribution: Array<{
    agent: string;
    tokens: number;
    cost: number;
    count: number;
  }>;
}

export default function StatsPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/stats');
        const data = await response.json();
        setStats(data);
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return <div className="text-center text-gray-600">Loading...</div>;
  }

  if (!stats) {
    return <div className="text-center text-gray-600">Failed to load stats</div>;
  }

  const formatNumber = (num: number) => num.toLocaleString();
  const formatCost = (cost: number) => `$${cost.toFixed(4)}`;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Usage Statistics</h1>
        <Link
          href="/dashboard/projects"
          className="text-blue-600 hover:text-blue-700"
        >
          Back to Projects
        </Link>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <p className="text-sm font-medium text-gray-600">Total Campaigns</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">
            {formatNumber(stats.totalCampaigns || 0)}
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <p className="text-sm font-medium text-gray-600">Total Generations</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">
            {formatNumber(stats.totalGenerations)}
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <p className="text-sm font-medium text-gray-600">Estimated Cost</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">
            {formatCost(stats.estimatedCost.total)}
          </p>
        </div>
      </div>

      {/* Token Usage */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Token Usage</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <p className="text-sm font-medium text-gray-600">Prompt Tokens</p>
            <p className="text-2xl font-bold text-blue-600 mt-1">
              {formatNumber(stats.tokenUsage.prompt)}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {formatCost(stats.estimatedCost.perMillionTokens.prompt)} per 1M
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">Completion Tokens</p>
            <p className="text-2xl font-bold text-green-600 mt-1">
              {formatNumber(stats.tokenUsage.completion)}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {formatCost(stats.estimatedCost.perMillionTokens.completion)} per 1M
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">Total Tokens</p>
            <p className="text-2xl font-bold text-purple-600 mt-1">
              {formatNumber(stats.tokenUsage.total)}
            </p>
          </div>
        </div>
      </div>

      {/* Pricing Info */}
      <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">OpenAI GPT-4o Pricing</h3>
        <div className="space-y-1 text-sm text-blue-800">
          <p>• Input tokens: ${stats.estimatedCost.perMillionTokens.prompt.toFixed(2)} per 1M tokens</p>
          <p>• Output tokens: ${stats.estimatedCost.perMillionTokens.completion.toFixed(2)} per 1M tokens</p>
          <p className="text-xs text-blue-600 mt-2">Costs are estimates based on OpenAI pricing via AI Gateway</p>
        </div>
      </div>

      {/* Distribution by Agent */}
      {stats.distribution.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Usage by Agent</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Agent
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Generations
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tokens Used
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estimated Cost
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {stats.distribution.map((item) => (
                  <tr key={item.agent}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {item.agent}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {formatNumber(item.count)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {formatNumber(item.tokens)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {formatCost(item.cost)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
