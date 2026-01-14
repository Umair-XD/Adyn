import { useState, useEffect, useCallback } from 'react';

interface CampaignJobStatus {
  jobId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  currentStep: string;
  result?: any;
  error?: string;
  campaignId?: string;
  createdAt: string;
  completedAt?: string;
}

interface UseCampaignGenerationOptions {
  onComplete?: (result: any) => void;
  onError?: (error: string) => void;
  pollInterval?: number; // milliseconds
}

export function useCampaignGeneration(options: UseCampaignGenerationOptions = {}) {
  const { onComplete, onError, pollInterval = 3000 } = options;
  
  const [jobStatus, setJobStatus] = useState<CampaignJobStatus | null>(null);
  const [isPolling, setIsPolling] = useState(false);

  const checkStatus = useCallback(async (jobId: string) => {
    try {
      const response = await fetch(`/api/adyn/generate/status?jobId=${jobId}`);
      
      if (!response.ok) {
        throw new Error('Failed to check job status');
      }

      const data: CampaignJobStatus = await response.json();
      setJobStatus(data);

      // Handle completion
      if (data.status === 'completed') {
        setIsPolling(false);
        onComplete?.(data.result);
      }

      // Handle failure
      if (data.status === 'failed') {
        setIsPolling(false);
        onError?.(data.error || 'Campaign generation failed');
      }

      return data;
    } catch (error) {
      console.error('Status check error:', error);
      setIsPolling(false);
      onError?.(error instanceof Error ? error.message : 'Failed to check status');
      return null;
    }
  }, [onComplete, onError]);

  const startGeneration = useCallback(async (params: {
    projectId: string;
    url: string;
    objective: string;
    budget?: number;
    geoTargets?: string[];
  }) => {
    try {
      const response = await fetch('/api/adyn/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to start campaign generation');
      }

      const data = await response.json();
      
      if (data.success && data.jobId) {
        setJobStatus({
          jobId: data.jobId,
          status: 'pending',
          progress: 0,
          currentStep: 'Starting...',
          createdAt: new Date().toISOString()
        });
        setIsPolling(true);
        return data.jobId;
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      console.error('Generation start error:', error);
      onError?.(error instanceof Error ? error.message : 'Failed to start generation');
      throw error;
    }
  }, [onError]);

  // Polling effect
  useEffect(() => {
    if (!isPolling || !jobStatus?.jobId) return;

    const interval = setInterval(() => {
      checkStatus(jobStatus.jobId);
    }, pollInterval);

    return () => clearInterval(interval);
  }, [isPolling, jobStatus?.jobId, pollInterval, checkStatus]);

  const cancelPolling = useCallback(() => {
    setIsPolling(false);
  }, []);

  return {
    startGeneration,
    checkStatus,
    cancelPolling,
    jobStatus,
    isPolling,
    isGenerating: jobStatus?.status === 'pending' || jobStatus?.status === 'processing',
    isCompleted: jobStatus?.status === 'completed',
    isFailed: jobStatus?.status === 'failed'
  };
}
