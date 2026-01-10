/**
 * LEARNING DIAGNOSTICS - Diagnoses learning limited issues
 */

export interface AdSetData {
  adset_id: string;
  delivery_info: {
    delivery_level?: string;
    status?: string;
    learning_stage?: string;
  };
  performance_metrics?: {
    spend?: number;
    conversions?: number;
    clicks?: number;
    impressions?: number;
    ctr?: number;
    cpm?: number;
    frequency?: number;
  };
  budget?: number;
  audience_size?: number;
}

export interface LearningDiagnosticsResult {
  learning_status: 'LEARNING' | 'LEARNING_LIMITED' | 'LEARNED' | 'UNKNOWN';
  root_causes: Array<{
    issue: string;
    severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
    explanation: string;
    impact: string;
  }>;
  optimization_recommendations: Array<{
    priority: 'IMMEDIATE' | 'HIGH' | 'MEDIUM' | 'LOW';
    action: string;
    expected_outcome: string;
    implementation_time: string;
    risk_level: 'LOW' | 'MEDIUM' | 'HIGH';
  }>;
  consolidation_opportunities: Array<{
    target_adsets: string[];
    rationale: string;
    expected_improvement: string;
    implementation_steps: string[];
  }>;
  budget_recommendations: {
    current_budget: number;
    recommended_budget: number;
    rationale: string;
    expected_events_per_week: number;
  };
  timeline_projection: {
    estimated_learning_completion: string;
    confidence_level: 'HIGH' | 'MEDIUM' | 'LOW';
    key_milestones: Array<{
      date: string;
      milestone: string;
      required_events: number;
    }>;
  };
}

export async function learningDiagnostics(input: {
  adset_data: AdSetData;
}): Promise<LearningDiagnosticsResult> {
  
  const { adset_data } = input;
  
  const result: LearningDiagnosticsResult = {
    learning_status: 'UNKNOWN',
    root_causes: [],
    optimization_recommendations: [],
    consolidation_opportunities: [],
    budget_recommendations: {
      current_budget: adset_data.budget || 0,
      recommended_budget: 0,
      rationale: '',
      expected_events_per_week: 0
    },
    timeline_projection: {
      estimated_learning_completion: 'Unknown',
      confidence_level: 'LOW',
      key_milestones: []
    }
  };

  // Determine learning status
  determineLearningStatus(result, adset_data);
  
  // Identify root causes
  identifyRootCauses(result, adset_data);
  
  // Generate recommendations
  generateOptimizationRecommendations(result, adset_data);
  
  // Analyze consolidation opportunities
  analyzeConsolidationOpportunities(result, adset_data);
  
  // Calculate budget recommendations
  calculateBudgetRecommendations(result, adset_data);
  
  // Project timeline
  projectLearningTimeline(result, adset_data);

  return result;
}

function determineLearningStatus(result: LearningDiagnosticsResult, data: AdSetData): void {
  const deliveryInfo = data.delivery_info;
  
  if (deliveryInfo.learning_stage) {
    switch (deliveryInfo.learning_stage.toLowerCase()) {
      case 'learning':
        result.learning_status = 'LEARNING';
        break;
      case 'learning_limited':
        result.learning_status = 'LEARNING_LIMITED';
        break;
      case 'learned':
        result.learning_status = 'LEARNED';
        break;
      default:
        result.learning_status = 'UNKNOWN';
    }
  } else {
    // Infer from performance data
    const metrics = data.performance_metrics;
    if (metrics) {
      const conversions = metrics.conversions || 0;
      const spend = metrics.spend || 0;
      
      if (conversions >= 50) {
        result.learning_status = 'LEARNED';
      } else if (spend > 100 && conversions < 10) {
        result.learning_status = 'LEARNING_LIMITED';
      } else {
        result.learning_status = 'LEARNING';
      }
    }
  }
}

function identifyRootCauses(result: LearningDiagnosticsResult, data: AdSetData): void {
  const metrics = data.performance_metrics;
  const budget = data.budget || 0;
  const audienceSize = data.audience_size || 0;
  
  // Insufficient budget
  if (budget < 20) {
    result.root_causes.push({
      issue: 'Budget Too Low',
      severity: 'CRITICAL',
      explanation: 'Daily budget below $20 makes it difficult to generate enough events for learning',
      impact: 'Prevents ad set from exiting learning phase and achieving optimal performance'
    });
  }
  
  // Small audience size
  if (audienceSize > 0 && audienceSize < 100000) {
    result.root_causes.push({
      issue: 'Audience Too Small',
      severity: 'HIGH',
      explanation: 'Audience size below 100,000 limits delivery potential and event generation',
      impact: 'Restricts reach and makes it harder to generate sufficient optimization events'
    });
  }
  
  // Low conversion rate
  if (metrics) {
    const conversions = metrics.conversions || 0;
    const clicks = metrics.clicks || 0;
    const cvr = clicks > 0 ? (conversions / clicks) * 100 : 0;
    
    if (cvr < 1 && clicks > 100) {
      result.root_causes.push({
        issue: 'Low Conversion Rate',
        severity: 'HIGH',
        explanation: `Conversion rate of ${cvr.toFixed(2)}% is below optimal threshold`,
        impact: 'Insufficient conversions prevent learning phase completion'
      });
    }
    
    // High frequency
    const frequency = metrics.frequency || 0;
    if (frequency > 3) {
      result.root_causes.push({
        issue: 'High Frequency',
        severity: 'MEDIUM',
        explanation: `Frequency of ${frequency.toFixed(2)} indicates audience saturation`,
        impact: 'Reduced performance and wasted spend on oversaturated audience'
      });
    }
    
    // Poor CTR
    const ctr = metrics.ctr || 0;
    if (ctr < 1) {
      result.root_causes.push({
        issue: 'Low Click-Through Rate',
        severity: 'MEDIUM',
        explanation: `CTR of ${ctr.toFixed(2)}% suggests poor creative performance`,
        impact: 'Fewer clicks result in fewer conversion opportunities'
      });
    }
  }
  
  // Multiple ad sets competing
  // This would require additional data about other ad sets in the account
  result.root_causes.push({
    issue: 'Potential Audience Overlap',
    severity: 'MEDIUM',
    explanation: 'Multiple ad sets may be competing for the same audience',
    impact: 'Increased competition drives up costs and reduces individual ad set performance'
  });
}

function generateOptimizationRecommendations(result: LearningDiagnosticsResult, data: AdSetData): void {
  const causes = result.root_causes;
  
  for (const cause of causes) {
    switch (cause.issue) {
      case 'Budget Too Low':
        result.optimization_recommendations.push({
          priority: 'IMMEDIATE',
          action: `Increase daily budget to at least $50 (currently $${data.budget})`,
          expected_outcome: 'More events per day, faster learning phase completion',
          implementation_time: '5 minutes',
          risk_level: 'LOW'
        });
        break;
        
      case 'Audience Too Small':
        result.optimization_recommendations.push({
          priority: 'HIGH',
          action: 'Broaden targeting criteria or switch to lookalike/broad audiences',
          expected_outcome: 'Larger audience pool, increased delivery potential',
          implementation_time: '30-60 minutes',
          risk_level: 'MEDIUM'
        });
        break;
        
      case 'Low Conversion Rate':
        result.optimization_recommendations.push({
          priority: 'HIGH',
          action: 'Optimize landing page and consider changing optimization event',
          expected_outcome: 'Higher conversion rate, more optimization events',
          implementation_time: '2-4 hours',
          risk_level: 'MEDIUM'
        });
        break;
        
      case 'High Frequency':
        result.optimization_recommendations.push({
          priority: 'MEDIUM',
          action: 'Expand audience or refresh creative assets',
          expected_outcome: 'Reduced frequency, improved performance',
          implementation_time: '1-2 hours',
          risk_level: 'LOW'
        });
        break;
        
      case 'Low Click-Through Rate':
        result.optimization_recommendations.push({
          priority: 'MEDIUM',
          action: 'Test new creative angles and formats',
          expected_outcome: 'Improved CTR, more traffic to landing page',
          implementation_time: '2-3 hours',
          risk_level: 'LOW'
        });
        break;
        
      case 'Potential Audience Overlap':
        result.optimization_recommendations.push({
          priority: 'HIGH',
          action: 'Consolidate similar ad sets or implement exclusion audiences',
          expected_outcome: 'Reduced competition, improved individual ad set performance',
          implementation_time: '45-90 minutes',
          risk_level: 'MEDIUM'
        });
        break;
    }
  }
  
  // Always recommend monitoring
  result.optimization_recommendations.push({
    priority: 'LOW',
    action: 'Monitor performance daily and adjust based on learning phase progress',
    expected_outcome: 'Proactive optimization, faster problem identification',
    implementation_time: '15 minutes daily',
    risk_level: 'LOW'
  });
}

function analyzeConsolidationOpportunities(result: LearningDiagnosticsResult, data: AdSetData): void {
  // This would typically analyze multiple ad sets, but we can provide general guidance
  result.consolidation_opportunities.push({
    target_adsets: [data.adset_id],
    rationale: 'Consider consolidating with other learning-limited ad sets targeting similar audiences',
    expected_improvement: 'Combined budget and audience for faster learning phase completion',
    implementation_steps: [
      'Identify ad sets with similar targeting and objectives',
      'Pause underperforming ad sets',
      'Increase budget on best-performing consolidated ad set',
      'Monitor performance for 3-5 days'
    ]
  });
}

function calculateBudgetRecommendations(result: LearningDiagnosticsResult, data: AdSetData): void {
  const currentBudget = data.budget || 0;
  const metrics = data.performance_metrics;
  
  // Calculate recommended budget based on CPA and target events
  let recommendedBudget = Math.max(currentBudget * 1.5, 50);
  
  if (metrics) {
    const conversions = metrics.conversions || 0;
    const spend = metrics.spend || 0;
    
    if (spend > 0 && conversions > 0) {
      const currentCPA = spend / conversions;
      // Target 50 conversions per week (7-10 per day)
      const targetDailyConversions = 8;
      recommendedBudget = Math.max(currentCPA * targetDailyConversions, 50);
    }
  }
  
  // Cap at reasonable maximum
  recommendedBudget = Math.min(recommendedBudget, 500);
  
  result.budget_recommendations = {
    current_budget: currentBudget,
    recommended_budget: Math.round(recommendedBudget),
    rationale: `Increase budget to generate approximately 50+ optimization events per week for learning phase completion`,
    expected_events_per_week: Math.round((recommendedBudget / (metrics?.spend || 50)) * (metrics?.conversions || 1) * 7)
  };
}

function projectLearningTimeline(result: LearningDiagnosticsResult, data: AdSetData): void {
  const metrics = data.performance_metrics;
  const recommendedBudget = result.budget_recommendations.recommended_budget;
  
  let estimatedDays = 14; // Default estimate
  let confidence: 'HIGH' | 'MEDIUM' | 'LOW' = 'LOW';
  
  if (metrics && metrics.conversions && metrics.spend) {
    const currentCPA = metrics.spend / metrics.conversions;
    const dailyConversions = recommendedBudget / currentCPA;
    
    // Need 50 events for learning phase
    const eventsNeeded = Math.max(50 - (metrics.conversions || 0), 0);
    estimatedDays = Math.ceil(eventsNeeded / dailyConversions);
    
    if (dailyConversions >= 7) {
      confidence = 'HIGH';
    } else if (dailyConversions >= 3) {
      confidence = 'MEDIUM';
    }
  }
  
  const completionDate = new Date();
  completionDate.setDate(completionDate.getDate() + estimatedDays);
  
  result.timeline_projection = {
    estimated_learning_completion: completionDate.toISOString().split('T')[0],
    confidence_level: confidence,
    key_milestones: [
      {
        date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        milestone: 'Initial optimization adjustments',
        required_events: 15
      },
      {
        date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        milestone: 'Mid-learning phase checkpoint',
        required_events: 30
      },
      {
        date: completionDate.toISOString().split('T')[0],
        milestone: 'Learning phase completion',
        required_events: 50
      }
    ]
  };
}