'use client';

import { useState } from 'react';
import { useCampaignGeneration } from '@/lib/hooks/useCampaignGeneration';
import { CampaignGenerationProgress } from './CampaignGenerationProgress';
import { useRouter } from 'next/navigation';

interface CampaignGenerationExampleProps {
  projectId: string;
}

export function CampaignGenerationExample({ projectId }: CampaignGenerationExampleProps) {
  const router = useRouter();
  const [jobId, setJobId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    url: '',
    objective: 'Traffic',
    budget: 1000,
    geoTargets: ['US']
  });

  const { startGeneration, isGenerating } = useCampaignGeneration({
    onComplete: (result) => {
      console.log('Campaign completed:', result);
      // Redirect to campaign details page
      if (result?.campaignId) {
        router.push(`/dashboard/campaigns/${result.campaignId}`);
      }
    },
    onError: (error) => {
      console.error('Campaign generation failed:', error);
      alert(`Error: ${error}`);
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const newJobId = await startGeneration({
        projectId,
        ...formData
      });
      setJobId(newJobId);
    } catch (error) {
      console.error('Failed to start generation:', error);
    }
  };

  if (jobId) {
    return <CampaignGenerationProgress jobId={jobId} />;
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">Generate Campaign</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Product URL</label>
          <input
            type="url"
            value={formData.url}
            onChange={(e) => setFormData({ ...formData, url: e.target.value })}
            className="w-full px-4 py-2 border rounded-lg"
            placeholder="https://example.com/product"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Objective</label>
          <select
            value={formData.objective}
            onChange={(e) => setFormData({ ...formData, objective: e.target.value })}
            className="w-full px-4 py-2 border rounded-lg"
          >
            <option value="Traffic">Traffic</option>
            <option value="Conversions">Conversions</option>
            <option value="Awareness">Awareness</option>
            <option value="Engagement">Engagement</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Budget ($)</label>
          <input
            type="number"
            value={formData.budget}
            onChange={(e) => setFormData({ ...formData, budget: parseInt(e.target.value) })}
            className="w-full px-4 py-2 border rounded-lg"
            min="100"
            required
          />
        </div>

        <button
          type="submit"
          disabled={isGenerating}
          className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isGenerating ? 'Generating...' : 'Generate Campaign'}
        </button>
      </form>
    </div>
  );
}
