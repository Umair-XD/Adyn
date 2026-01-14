'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCampaignGeneration } from '@/lib/hooks/useCampaignGeneration';
import { CampaignGenerationProgress } from '@/components/campaign/CampaignGenerationProgress';

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
  const [budget, setBudget] = useState(1000);
  const [geoTargets, setGeoTargets] = useState(['US']);
  const [error, setError] = useState('');
  const [jobId, setJobId] = useState<string | null>(null);

  const { startGeneration, isGenerating } = useCampaignGeneration({
    onComplete: (result) => {
      console.log('Campaign completed:', result);
      // Auto-redirect to campaign details
      if (result?.campaignId) {
        setTimeout(() => {
          setShowAnalyzeDialog(false);
          setUrl('');
          setJobId(null);
          router.push(`/dashboard/campaigns/${result.campaignId}`);
        }, 2000);
      }
    },
    onError: (errorMsg) => {
      setError(errorMsg);
    }
  });

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

    try {
      const newJobId = await startGeneration({
        projectId: params.id as string,
        url,
        objective,
        budget,
        geoTargets
      });
      setJobId(newJobId);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'An error occurred. Please try again.';
      setError(errorMsg);
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
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <span>🚀 Create AI Campaign</span>
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

      {/* Create AI Campaign Dialog */}
      {showAnalyzeDialog && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
          <div className="glass p-8 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto border border-white/30 transition-all transform scale-100">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-3xl font-extrabold text-gradient">🚀 Quantum Campaign Constructor</h2>
              <button 
                onClick={() => setShowAnalyzeDialog(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                disabled={isGenerating}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Show Progress if job is running */}
            {jobId ? (
              <CampaignGenerationProgress jobId={jobId} />
            ) : (
              <>
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-700">
                    <strong>🚀 ENHANCED MODE:</strong> AI analyzes your product step-by-step with real-time progress updates. Watch as we build your expert-level campaign!
                  </p>
                </div>
                
                <form onSubmit={handleAnalyze} className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="url" className="block text-sm font-semibold text-gray-800 flex items-center gap-2">
                  <span className="text-blue-600">🌐</span> Product Intelligence URL
                </label>
                <div className="relative group">
                  <input
                    id="url"
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    required
                    className="w-full px-4 py-3 bg-white/50 border border-blue-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all placeholder:text-gray-400"
                    placeholder="https://yourproduct.com/feature-page"
                  />
                  <div className="absolute inset-0 rounded-xl bg-blue-500/5 border border-blue-500/20 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity" />
                </div>
                <p className="text-xs text-blue-600 font-medium flex items-center gap-1">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  Our AI will deep-scan this URL for unique selling points and target personas.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label htmlFor="objective" className="block text-sm font-semibold text-gray-800">
                    Campaign Purpose
                  </label>
                  <select
                    id="objective"
                    value={objective}
                    onChange={(e) => setObjective(e.target.value)}
                    className="w-full px-4 py-3 bg-white/50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 appearance-none cursor-pointer"
                  >
                    <option value="Conversions">High-Intent Conversions (Sales)</option>
                    <option value="Traffic">Volume Traffic (Clicks)</option>
                    <option value="Awareness">Brand Reach (Awareness)</option>
                    <option value="Engagement">Social Interaction (Engagement)</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label htmlFor="budget" className="block text-sm font-semibold text-gray-800">
                    Investment Budget ($)
                  </label>
                  <div className="flex items-center gap-4">
                    <input
                      id="budget-range"
                      type="range"
                      min="100"
                      max="5000"
                      step="100"
                      value={isNaN(budget) ? 100 : budget}
                      onChange={(e) => setBudget(parseInt(e.target.value) || 100)}
                      className="flex-1 h-2 bg-blue-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    />
                    <input
                      id="budget"
                      type="number"
                      value={isNaN(budget) ? '' : budget}
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        setBudget(val);
                      }}
                      min="100"
                      className="w-24 px-3 py-2 bg-white border border-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 font-bold text-blue-600"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="geoTargets" className="block text-sm font-semibold text-gray-800">
                  Strategic Geo Targeting
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {[
                    { val: 'US', label: 'United States' },
                    { val: 'CA', label: 'Canada' },
                    { val: 'GB', label: 'United Kingdom' },
                    { val: 'PK', label: 'Pakistan' },
                    { val: 'AE', label: 'UAE' },
                    { val: 'AU', label: 'Australia' },
                    { val: 'DE', label: 'Germany' },
                    { val: 'FR', label: 'France' }
                  ].map((geo) => (
                    <button
                      key={geo.val}
                      type="button"
                      onClick={() => setGeoTargets([geo.val])}
                      className={`px-3 py-2 text-xs rounded-lg border transition-all ${
                        geoTargets[0] === geo.val 
                          ? 'bg-blue-600 text-white border-blue-600 shadow-md transform scale-105' 
                          : 'bg-white/50 text-gray-600 border-gray-100 hover:border-blue-300'
                      }`}
                    >
                      {geo.label}
                    </button>
                  ))}
                </div>
              </div>

              {error && (
                <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">{error}</div>
              )}

              <div className="flex space-x-4 pt-6">
                <button
                  type="submit"
                  disabled={isGenerating}
                  className="flex-1 px-6 py-4 premium-gradient text-white rounded-xl hover:shadow-lg hover:shadow-blue-500/30 transition-all font-bold text-lg disabled:opacity-50 active:scale-95 flex items-center justify-center gap-2"
                >
                  {isGenerating ? (
                    <>
                      <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                      Starting Engine...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      Generate AI Campaign
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAnalyzeDialog(false);
                    setUrl('');
                    setError('');
                    setJobId(null);
                  }}
                  disabled={isGenerating}
                  className="px-6 py-4 bg-white/50 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-all font-semibold disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </form>
            </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
