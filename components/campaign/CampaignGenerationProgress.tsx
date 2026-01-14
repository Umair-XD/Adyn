'use client';

import { useCampaignGeneration } from '@/lib/hooks/useCampaignGeneration';
import { useEffect } from 'react';

interface CampaignGenerationProgressProps {
  jobId?: string;
  onComplete?: (result: any) => void;
  onError?: (error: string) => void;
}

interface ProgressiveStep {
  status: 'completed' | 'in_progress' | 'pending' | 'error';
  [key: string]: any;
}

const stepInfo = {
  content_extraction: { icon: '🌐', label: 'Content Extraction', color: 'blue' },
  semantic_analysis: { icon: '🧠', label: 'AI Analysis', color: 'purple' },
  account_audit: { icon: '📊', label: 'Account Intelligence', color: 'green' },
  strategy: { icon: '🎯', label: 'Strategy Generation', color: 'orange' },
  audiences: { icon: '👥', label: 'Audience Building', color: 'pink' },
  placements: { icon: '📱', label: 'Placement Optimization', color: 'cyan' },
  creatives: { icon: '✨', label: 'Creative Generation', color: 'indigo' },
  budget: { icon: '💰', label: 'Budget Allocation', color: 'emerald' },
  assembly: { icon: '🏗️', label: 'Campaign Assembly', color: 'violet' }
};

export function CampaignGenerationProgress({
  jobId,
  onComplete,
  onError
}: CampaignGenerationProgressProps) {
  const { jobStatus, checkStatus, isGenerating, isCompleted, isFailed } = useCampaignGeneration({
    onComplete,
    onError,
    pollInterval: 3000 // Poll every 3 seconds
  });

  useEffect(() => {
    if (jobId) {
      checkStatus(jobId);
    }
  }, [jobId, checkStatus]);

  if (!jobStatus) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Extract progressive steps from result if available
  const progressiveSteps = jobStatus.result?.generationResult?.steps || {};
  const hasDetailedSteps = Object.keys(progressiveSteps).length > 0;

  const getStepStatus = (stepKey: string) => {
    if (!hasDetailedSteps) return 'pending';
    if (progressiveSteps[stepKey]?.status === 'completed') return 'completed';
    if (jobStatus.currentStep?.toLowerCase().includes(stepKey.replace('_', ' '))) return 'in_progress';
    return 'pending';
  };

  return (
    <div className="space-y-6">
      {/* Header Status */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Campaign Generation</h2>
            <p className="text-gray-600 mt-1">
              {isCompleted ? '✅ All steps completed!' :
               isFailed ? '❌ Generation failed' :
               '⏳ Creating your expert-level campaign...'}
            </p>
          </div>
          <div className="text-right">
            {isGenerating && (
              <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full ml-auto mb-2"></div>
            )}
            <span className="text-2xl font-bold text-blue-600">
              {jobStatus.progress}%
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden mt-4">
          <div
            className={`h-full transition-all duration-500 ease-out ${
              isCompleted ? 'bg-green-600' :
              isFailed ? 'bg-red-600' :
              'bg-blue-600 animate-pulse'
            }`}
            style={{ width: `${jobStatus.progress}%` }}
          />
        </div>

        {/* Current Step */}
        <div className="text-sm text-gray-600 mt-3">
          <p className="font-medium">Current Step:</p>
          <p className="mt-1">{jobStatus.currentStep}</p>
        </div>
      </div>

      {/* Detailed Progressive Steps (if available) */}
      {hasDetailedSteps && (
        <div className="space-y-4">
          {Object.entries(stepInfo).map(([key, info]) => {
            const stepStatus = getStepStatus(key);
            const stepData = progressiveSteps[key];

            return (
              <div
                key={key}
                className={`bg-white p-5 rounded-lg border-2 transition-all ${
                  stepStatus === 'completed' ? 'border-green-500 shadow-sm' :
                  stepStatus === 'in_progress' ? 'border-blue-500 shadow-md animate-pulse' :
                  'border-gray-200 opacity-60'
                }`}
              >
                <div className="flex items-start space-x-4">
                  <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-xl ${
                    stepStatus === 'completed' ? 'bg-green-100' :
                    stepStatus === 'in_progress' ? 'bg-blue-100' :
                    'bg-gray-100'
                  }`}>
                    {stepStatus === 'completed' ? '✅' : info.icon}
                  </div>

                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 flex items-center space-x-2">
                      <span>{info.label}</span>
                      {stepStatus === 'in_progress' && (
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">Processing...</span>
                      )}
                    </h3>

                    {/* Step Details */}
                    {stepData && stepStatus === 'completed' && (
                      <div className="mt-3 space-y-2">
                        {/* Content Extraction */}
                        {key === 'content_extraction' && stepData.title && (
                          <div className="text-sm text-gray-700 space-y-1">
                            <p><strong>Title:</strong> {stepData.title}</p>
                            <p><strong>Images:</strong> {stepData.images_found} found</p>
                            <p><strong>Features:</strong> {stepData.features_found} identified</p>
                            {stepData.price && <p><strong>Price:</strong> {stepData.price}</p>}
                          </div>
                        )}

                        {/* Semantic Analysis */}
                        {key === 'semantic_analysis' && stepData.category && (
                          <div className="text-sm text-gray-700 space-y-1">
                            <p><strong>Category:</strong> {stepData.category}</p>
                            <p><strong>Target Audience:</strong> {stepData.target_audience}</p>
                            <p><strong>Brand Tone:</strong> {stepData.brand_tone}</p>
                            {stepData.keywords && (
                              <p><strong>Keywords:</strong> {stepData.keywords.slice(0, 5).join(', ')}</p>
                            )}
                          </div>
                        )}

                        {/* Strategy */}
                        {key === 'strategy' && stepData.approach && (
                          <div className="text-sm text-gray-700 space-y-1">
                            <p><strong>Approach:</strong> {stepData.approach}</p>
                            <p><strong>Ad Sets Planned:</strong> {stepData.adsets_planned}</p>
                          </div>
                        )}

                        {/* Audiences */}
                        {key === 'audiences' && stepData.audiences_created && (
                          <div className="text-sm text-gray-700">
                            <p><strong>Audiences Created:</strong> {stepData.audiences_created}</p>
                          </div>
                        )}

                        {/* Creatives */}
                        {key === 'creatives' && stepData.total_creatives && (
                          <div className="text-sm text-gray-700">
                            <p><strong>Total Creatives:</strong> {stepData.total_creatives}</p>
                          </div>
                        )}

                        {/* Budget */}
                        {key === 'budget' && stepData.total_budget && (
                          <div className="text-sm text-gray-700">
                            <p><strong>Total Budget:</strong> ${stepData.total_budget}</p>
                          </div>
                        )}

                        {/* Assembly */}
                        {key === 'assembly' && stepData.campaign_name && (
                          <div className="text-sm text-gray-700 space-y-1">
                            <p><strong>Campaign:</strong> {stepData.campaign_name}</p>
                            <p><strong>Objective:</strong> {stepData.objective}</p>
                            <p><strong>Ad Sets:</strong> {stepData.ad_sets}</p>
                            <p><strong>Creatives:</strong> {stepData.creatives}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Error Message */}
      {isFailed && jobStatus.error && (
        <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
          <h4 className="font-semibold text-red-800 mb-2">❌ Error</h4>
          <p className="text-sm text-red-700">{jobStatus.error}</p>
        </div>
      )}

      {/* Completion Message */}
      {isCompleted && (
        <div className="bg-green-50 border border-green-200 p-6 rounded-lg">
          <h3 className="text-lg font-bold text-green-900 mb-3">🎉 Campaign Ready!</h3>
          <p className="text-sm text-green-800 mb-2">
            Campaign generated successfully! Redirecting to campaign details...
          </p>
          {jobStatus.campaignId && (
            <p className="text-xs text-green-700">Campaign ID: {jobStatus.campaignId}</p>
          )}
        </div>
      )}

      {/* Time Info */}
      <div className="text-xs text-gray-500 pt-2 border-t">
        <p>Started: {new Date(jobStatus.createdAt).toLocaleString()}</p>
        {jobStatus.completedAt && (
          <p>Completed: {new Date(jobStatus.completedAt).toLocaleString()}</p>
        )}
      </div>
    </div>
  );
}
