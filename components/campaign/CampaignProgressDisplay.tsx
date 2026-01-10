'use client';

interface ProgressiveStep {
  status: 'completed' | 'in_progress' | 'pending' | 'error';
  [key: string]: any;
}

interface ProgressiveResultsProps {
  status: string;
  current_step: string;
  steps: {
    content_extraction?: ProgressiveStep;
    semantic_analysis?: ProgressiveStep;
    account_audit?: ProgressiveStep;
    strategy?: ProgressiveStep;
    audiences?: ProgressiveStep;
    placements?: ProgressiveStep;
    creatives?: ProgressiveStep;
    budget?: ProgressiveStep;
    assembly?: ProgressiveStep;
  };
  summary?: any;
  warnings?: string[];
  errors?: string[];
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

export default function CampaignProgressDisplay({ status, current_step, steps, summary, warnings, errors }: ProgressiveResultsProps) {
  const getStepStatus = (stepKey: string) => {
    if (!steps) return 'pending';
    if (steps[stepKey as keyof typeof steps]?.status === 'completed') return 'completed';
    if (current_step === stepKey) return 'in_progress';
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
              {status === 'completed' ? '✅ All steps completed!' :
               status === 'failed' ? '❌ Generation failed' :
               '⏳ Creating your expert-level campaign...'}
            </p>
          </div>
          {status === 'in_progress' && (
            <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
          )}
        </div>
      </div>

      {/* Progressive Steps */}
      <div className="space-y-4">
        {Object.entries(stepInfo).map(([key, info]) => {
          const stepStatus = getStepStatus(key);
          const stepData = steps ? (steps as any)[key] : undefined;

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
                  {stepData && (
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
                            <p><strong>Keywords:</strong> {stepData.keywords.join(', ')}</p>
                          )}
                        </div>
                      )}

                      {/* Strategy */}
                      {key === 'strategy' && stepData.approach && (
                        <div className="text-sm text-gray-700 space-y-1">
                          <p><strong>Approach:</strong> {stepData.approach}</p>
                          <p><strong>Ad Sets Planned:</strong> {stepData.adsets_planned}</p>
                          <p><strong>Types:</strong> {stepData.adset_types?.join(', ')}</p>
                        </div>
                      )}

                      {/* Audiences */}
                      {key === 'audiences' && stepData.audiences_created && (
                        <div className="text-sm text-gray-700 space-y-2">
                          <p><strong>Audiences Created:</strong> {stepData.audiences_created}</p>
                          {stepData.audience_details?.map((aud: any, i: number) => (
                            <div key={i} className="pl-4 border-l-2 border-gray-300">
                              <p className="font-medium">{aud.name}</p>
                              <p className="text-xs text-gray-600">
                                Reach: {aud.estimated_reach?.min?.toLocaleString()} - {aud.estimated_reach?.max?.toLocaleString()}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Creatives */}
                      {key === 'creatives' && stepData.total_creatives && (
                        <div className="text-sm text-gray-700 space-y-1">
                          <p><strong>Total Creatives:</strong> {stepData.total_creatives}</p>
                          {stepData.creative_breakdown?.[0] && (
                            <div className="pl-4 border-l-2 border-gray-300 mt-2">
                              <p className="font-medium">Sample Headline:</p>
                              <p className="text-gray-600">{stepData.creative_breakdown[0].sample_headline}</p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Budget */}
                      {key === 'budget' && stepData.total_budget && (
                        <div className="text-sm text-gray-700 space-y-1">
                          <p><strong>Total Budget:</strong> ${stepData.total_budget}</p>
                          {stepData.budget_allocations?.map((alloc: any, i: number) => (
                            <p key={i} className="text-xs text-gray-600">
                              {alloc.adset}: ${alloc.daily_budget}/day
                            </p>
                          ))}
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

      {/* Warnings */}
      {warnings && warnings.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
          <h4 className="font-semibold text-yellow-800 mb-2">⚠️ Warnings</h4>
          <ul className="text-sm text-yellow-700 space-y-1">
            {warnings.map((warning, i) => (
              <li key={i}>• {warning}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Errors */}
      {errors && errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
          <h4 className="font-semibold text-red-800 mb-2">❌ Errors</h4>
          <ul className="text-sm text-red-700 space-y-1">
            {errors.map((error, i) => (
              <li key={i}>• {error}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Summary */}
      {summary && status === 'completed' && (
        <div className="bg-green-50 border border-green-200 p-6 rounded-lg">
          <h3 className="text-lg font-bold text-green-900 mb-3">🎉 Campaign Ready!</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-green-700 font-semibold">Ad Sets</p>
              <p className="text-2xl font-bold text-green-900">{summary.adsets_created}</p>
            </div>
            <div>
              <p className="text-green-700 font-semibold">Creatives</p>
              <p className="text-2xl font-bold text-green-900">{summary.creatives_generated}</p>
            </div>
            <div>
              <p className="text-green-700 font-semibold">Total Ads</p>
              <p className="text-2xl font-bold text-green-900">{summary.total_ads}</p>
            </div>
            <div>
              <p className="text-green-700 font-semibold">Budget</p>
              <p className="text-2xl font-bold text-green-900">${summary.total_budget}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
