'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

interface Source {
  id: string;
  inputUrl?: string;
  type: string;
  status: string;
}

interface Campaign {
  id: string;
  name: string;
  platforms: string[];
}

interface Project {
  id: string;
  name: string;
  description: string;
  sources: Source[];
  campaigns: Campaign[];
}

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAnalyzeDialog, setShowAnalyzeDialog] = useState(false);
  const [url, setUrl] = useState('');
  const [objective, setObjective] = useState('Conversions');
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const response = await fetch(`/api/projects/${params.id}`);
        const data = await response.json();
        setProject(data.project);
      } catch (error) {
        console.error('Failed to fetch project:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProject();
  }, [params.id]);

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setAnalyzing(true);

    try {
      const response = await fetch('/api/adyn/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: params.id,
          url,
          objective
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Analysis failed');
      } else {
        setShowAnalyzeDialog(false);
        setUrl('');
        router.push(`/dashboard/campaigns/${data.campaignId}`);
      }
    } catch {
      setError('An error occurred. Please try again.');
    } finally {
      setAnalyzing(false);
    }
  };

  if (loading) {
    return <div className="text-center text-gray-600">Loading...</div>;
  }

  if (!project) {
    return <div className="text-center text-gray-600">Project not found</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <Link
            href="/dashboard/projects"
            className="text-blue-600 hover:text-blue-700 flex items-center space-x-2 mb-4"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span>Back to Projects</span>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">{project.name}</h1>
          <p className="text-gray-600 mt-2">{project.description || 'No description'}</p>
        </div>
        <button
          onClick={() => setShowAnalyzeDialog(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <span>Analyze URL</span>
        </button>
      </div>

      {/* Campaigns */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Campaigns</h2>
        {project.campaigns.length === 0 ? (
          <p className="text-gray-600">No campaigns yet. Analyze a URL to create your first campaign.</p>
        ) : (
          <div className="space-y-4">
            {project.campaigns.map((campaign) => (
              <Link
                key={campaign.id}
                href={`/dashboard/campaigns/${campaign.id}`}
                className="block p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-md transition-all"
              >
                <h3 className="font-medium text-gray-900">{campaign.name}</h3>
                <div className="flex space-x-2 mt-2">
                  {campaign.platforms.map((platform: string) => (
                    <span
                      key={platform}
                      className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded"
                    >
                      {platform}
                    </span>
                  ))}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Sources */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Sources</h2>
        {project.sources.length === 0 ? (
          <p className="text-gray-600">No sources yet.</p>
        ) : (
          <div className="space-y-2">
            {project.sources.map((source) => (
              <div key={source.id} className="flex justify-between items-center p-3 border border-gray-200 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-900">{source.inputUrl || 'Text input'}</p>
                  <p className="text-xs text-gray-500">{source.type}</p>
                </div>
                <span className={`px-2 py-1 text-xs rounded ${
                  source.status === 'completed' ? 'bg-green-100 text-green-700' :
                  source.status === 'processing' ? 'bg-yellow-100 text-yellow-700' :
                  source.status === 'failed' ? 'bg-red-100 text-red-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {source.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Analyze URL Dialog */}
      {showAnalyzeDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Analyze URL</h2>
            <form onSubmit={handleAnalyze} className="space-y-4">
              <div>
                <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-2">
                  Website URL *
                </label>
                <input
                  id="url"
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://example.com"
                />
              </div>

              <div>
                <label htmlFor="objective" className="block text-sm font-medium text-gray-700 mb-2">
                  Campaign Objective
                </label>
                <select
                  id="objective"
                  value={objective}
                  onChange={(e) => setObjective(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Conversions">Conversions</option>
                  <option value="Traffic">Traffic</option>
                  <option value="Awareness">Awareness</option>
                  <option value="Engagement">Engagement</option>
                </select>
              </div>

              {error && (
                <div className="text-red-600 text-sm">{error}</div>
              )}

              <div className="flex space-x-4">
                <button
                  type="submit"
                  disabled={analyzing}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
                >
                  {analyzing ? 'Analyzing...' : 'Analyze'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAnalyzeDialog(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
