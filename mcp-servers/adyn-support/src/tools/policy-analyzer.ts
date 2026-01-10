/**
 * POLICY ANALYZER - Analyzes Meta ad rejections and provides fixes
 */

export interface PolicyErrorData {
  error_code: string;
  error_message: string;
  ad_id?: string;
  creative_id?: string;
  rejection_reasons?: string[];
}

export interface PolicyAnalysisResult {
  violation_category: 'PROHIBITED_CONTENT' | 'MISLEADING_CLAIMS' | 'PERSONAL_ATTRIBUTES' | 'ADULT_CONTENT' | 'POLITICAL' | 'HEALTH_CLAIMS' | 'FINANCIAL' | 'TECHNICAL_QUALITY' | 'LANDING_PAGE' | 'UNKNOWN';
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  human_explanation: string;
  specific_violations: Array<{
    issue: string;
    location: 'HEADLINE' | 'PRIMARY_TEXT' | 'DESCRIPTION' | 'IMAGE' | 'VIDEO' | 'LANDING_PAGE' | 'CTA';
    explanation: string;
    fix_suggestion: string;
  }>;
  corrective_actions: Array<{
    priority: 'IMMEDIATE' | 'HIGH' | 'MEDIUM' | 'LOW';
    action: string;
    estimated_time: string;
  }>;
  policy_safe_alternatives: {
    headlines?: string[];
    primary_texts?: string[];
    descriptions?: string[];
    cta_suggestions?: string[];
    image_guidelines?: string[];
  };
  resubmission_strategy: {
    recommended_approach: string;
    timeline: string;
    success_probability: 'HIGH' | 'MEDIUM' | 'LOW';
    additional_precautions: string[];
  };
  prevention_checklist: string[];
}

export async function policyAnalyzer(input: {
  error_data: PolicyErrorData;
}): Promise<PolicyAnalysisResult> {
  
  const { error_data } = input;
  
  const result: PolicyAnalysisResult = {
    violation_category: 'UNKNOWN',
    severity: 'MEDIUM',
    human_explanation: 'Ad was rejected due to policy violations',
    specific_violations: [],
    corrective_actions: [],
    policy_safe_alternatives: {},
    resubmission_strategy: {
      recommended_approach: 'Fix violations and resubmit',
      timeline: '24-48 hours',
      success_probability: 'MEDIUM',
      additional_precautions: []
    },
    prevention_checklist: []
  };

  // Analyze rejection reasons
  if (error_data.rejection_reasons && error_data.rejection_reasons.length > 0) {
    analyzeRejectionReasons(result, error_data.rejection_reasons);
  } else {
    // Analyze based on error message
    analyzeErrorMessage(result, error_data.error_message);
  }

  // Generate policy-safe alternatives
  generateAlternatives(result);
  
  // Create prevention checklist
  createPreventionChecklist(result);

  return result;
}

function analyzeRejectionReasons(result: PolicyAnalysisResult, reasons: string[]): void {
  for (const reason of reasons) {
    const lowerReason = reason.toLowerCase();
    
    // Prohibited content
    if (lowerReason.includes('prohibited') || lowerReason.includes('restricted')) {
      result.violation_category = 'PROHIBITED_CONTENT';
      result.severity = 'CRITICAL';
      result.human_explanation = 'Your ad contains content that is prohibited by Meta\'s advertising policies';
      
      result.specific_violations.push({
        issue: 'Prohibited Content',
        location: 'PRIMARY_TEXT',
        explanation: 'Ad contains content that violates Meta\'s community standards or advertising policies',
        fix_suggestion: 'Remove or replace prohibited content with policy-compliant alternatives'
      });
      
      result.corrective_actions.push({
        priority: 'IMMEDIATE',
        action: 'Review and remove all prohibited content from ad creative',
        estimated_time: '30-60 minutes'
      });
    }
    
    // Misleading claims
    else if (lowerReason.includes('misleading') || lowerReason.includes('exaggerated') || lowerReason.includes('unsubstantiated')) {
      result.violation_category = 'MISLEADING_CLAIMS';
      result.severity = 'HIGH';
      result.human_explanation = 'Your ad makes claims that cannot be substantiated or are misleading';
      
      result.specific_violations.push({
        issue: 'Unsubstantiated Claims',
        location: 'HEADLINE',
        explanation: 'Ad makes claims about results, benefits, or outcomes without proper evidence',
        fix_suggestion: 'Add disclaimers, remove superlatives, or provide evidence for claims'
      });
      
      result.corrective_actions.push({
        priority: 'HIGH',
        action: 'Modify claims to be factual and add appropriate disclaimers',
        estimated_time: '45-90 minutes'
      });
    }
    
    // Personal attributes
    else if (lowerReason.includes('personal attributes') || lowerReason.includes('targeting')) {
      result.violation_category = 'PERSONAL_ATTRIBUTES';
      result.severity = 'HIGH';
      result.human_explanation = 'Your ad implies or asserts personal attributes about the viewer';
      
      result.specific_violations.push({
        issue: 'Personal Attributes Assertion',
        location: 'PRIMARY_TEXT',
        explanation: 'Ad directly addresses or implies personal characteristics of the viewer',
        fix_suggestion: 'Use general language instead of "you" statements about personal traits'
      });
      
      result.corrective_actions.push({
        priority: 'HIGH',
        action: 'Rewrite copy to avoid direct personal attribute assertions',
        estimated_time: '30-45 minutes'
      });
    }
    
    // Adult content
    else if (lowerReason.includes('adult') || lowerReason.includes('sexual') || lowerReason.includes('suggestive')) {
      result.violation_category = 'ADULT_CONTENT';
      result.severity = 'CRITICAL';
      result.human_explanation = 'Your ad contains adult or sexually suggestive content';
      
      result.specific_violations.push({
        issue: 'Adult Content',
        location: 'IMAGE',
        explanation: 'Ad creative contains sexually suggestive or adult-oriented content',
        fix_suggestion: 'Replace with family-friendly, non-suggestive imagery and copy'
      });
      
      result.corrective_actions.push({
        priority: 'IMMEDIATE',
        action: 'Replace all adult or suggestive content with appropriate alternatives',
        estimated_time: '60-120 minutes'
      });
    }
    
    // Health claims
    else if (lowerReason.includes('health') || lowerReason.includes('medical') || lowerReason.includes('weight loss')) {
      result.violation_category = 'HEALTH_CLAIMS';
      result.severity = 'HIGH';
      result.human_explanation = 'Your ad makes health or medical claims that require special compliance';
      
      result.specific_violations.push({
        issue: 'Health Claims',
        location: 'DESCRIPTION',
        explanation: 'Ad makes health, medical, or weight loss claims without proper disclaimers',
        fix_suggestion: 'Add required disclaimers or remove health-related claims'
      });
      
      result.corrective_actions.push({
        priority: 'HIGH',
        action: 'Add FDA disclaimers or remove health claims entirely',
        estimated_time: '45-90 minutes'
      });
    }
    
    // Landing page issues
    else if (lowerReason.includes('landing page') || lowerReason.includes('destination')) {
      result.violation_category = 'LANDING_PAGE';
      result.severity = 'HIGH';
      result.human_explanation = 'Your landing page doesn\'t comply with Meta\'s policies';
      
      result.specific_violations.push({
        issue: 'Landing Page Compliance',
        location: 'LANDING_PAGE',
        explanation: 'Landing page contains prohibited content or doesn\'t match ad claims',
        fix_suggestion: 'Ensure landing page complies with policies and matches ad content'
      });
      
      result.corrective_actions.push({
        priority: 'HIGH',
        action: 'Review and update landing page to ensure policy compliance',
        estimated_time: '2-4 hours'
      });
    }
    
    // Technical quality
    else if (lowerReason.includes('quality') || lowerReason.includes('technical') || lowerReason.includes('image')) {
      result.violation_category = 'TECHNICAL_QUALITY';
      result.severity = 'MEDIUM';
      result.human_explanation = 'Your ad doesn\'t meet technical quality standards';
      
      result.specific_violations.push({
        issue: 'Technical Quality',
        location: 'IMAGE',
        explanation: 'Ad creative doesn\'t meet minimum quality or technical requirements',
        fix_suggestion: 'Use higher quality images and ensure proper formatting'
      });
      
      result.corrective_actions.push({
        priority: 'MEDIUM',
        action: 'Replace with higher quality creative assets',
        estimated_time: '30-60 minutes'
      });
    }
  }
}

function analyzeErrorMessage(result: PolicyAnalysisResult, message: string): void {
  const lowerMessage = message.toLowerCase();
  
  // Generic policy violation
  if (lowerMessage.includes('policy') || lowerMessage.includes('violation')) {
    result.violation_category = 'UNKNOWN';
    result.severity = 'HIGH';
    result.human_explanation = 'Your ad violates one or more of Meta\'s advertising policies';
    
    result.corrective_actions.push({
      priority: 'HIGH',
      action: 'Review Meta\'s advertising policies and identify potential violations',
      estimated_time: '60-120 minutes'
    });
  }
  
  // Disapproved creative
  if (lowerMessage.includes('disapproved') || lowerMessage.includes('rejected')) {
    result.corrective_actions.push({
      priority: 'HIGH',
      action: 'Create new creative that complies with advertising policies',
      estimated_time: '90-180 minutes'
    });
  }
}

function generateAlternatives(result: PolicyAnalysisResult): void {
  switch (result.violation_category) {
    case 'MISLEADING_CLAIMS':
      result.policy_safe_alternatives = {
        headlines: [
          'Discover Our Solution',
          'Learn More About Our Service',
          'See What We Offer',
          'Explore Your Options'
        ],
        primary_texts: [
          'Many customers have found success with our approach...',
          'Our service is designed to help you achieve your goals...',
          'Join thousands who have chosen our solution...',
          'See how our product can work for you...'
        ],
        descriptions: [
          'Results may vary. Individual experiences differ.',
          'Typical results are not guaranteed.',
          'Success depends on individual effort and circumstances.'
        ]
      };
      break;
      
    case 'PERSONAL_ATTRIBUTES':
      result.policy_safe_alternatives = {
        primary_texts: [
          'People looking for solutions often find...',
          'Many individuals discover that...',
          'Those interested in this topic may benefit from...',
          'Customers typically experience...'
        ],
        headlines: [
          'Solutions for Everyone',
          'Designed for Success',
          'Built for Results',
          'Made for You'
        ]
      };
      break;
      
    case 'HEALTH_CLAIMS':
      result.policy_safe_alternatives = {
        primary_texts: [
          'Support your wellness journey with...',
          'Designed to complement a healthy lifestyle...',
          'Part of a balanced approach to wellness...',
          'Intended for general wellness support...'
        ],
        descriptions: [
          '*This statement has not been evaluated by the FDA.',
          'Results may vary. Consult your healthcare provider.',
          'Individual results may differ.',
          'Not intended to diagnose, treat, cure, or prevent any disease.'
        ]
      };
      break;
      
    case 'TECHNICAL_QUALITY':
      result.policy_safe_alternatives = {
        image_guidelines: [
          'Use high-resolution images (at least 1080x1080)',
          'Ensure text is clearly readable',
          'Avoid blurry or pixelated images',
          'Use proper aspect ratios for each placement',
          'Ensure images are relevant to your product/service'
        ]
      };
      break;
  }
  
  // Universal CTA suggestions
  result.policy_safe_alternatives.cta_suggestions = [
    'Learn More',
    'Shop Now',
    'Get Quote',
    'Contact Us',
    'Sign Up',
    'Download',
    'Apply Now'
  ];
}

function createPreventionChecklist(result: PolicyAnalysisResult): void {
  result.prevention_checklist = [
    'Review Meta\'s advertising policies before creating ads',
    'Avoid making unsubstantiated claims or guarantees',
    'Use inclusive language that doesn\'t target personal attributes',
    'Ensure landing pages match ad content and comply with policies',
    'Use high-quality, relevant images and videos',
    'Add appropriate disclaimers for regulated industries',
    'Test ads with small budgets before scaling',
    'Keep up to date with policy changes and updates'
  ];
  
  // Add category-specific prevention tips
  switch (result.violation_category) {
    case 'HEALTH_CLAIMS':
      result.prevention_checklist.push(
        'Include FDA disclaimers for health-related products',
        'Avoid before/after images without proper disclaimers',
        'Don\'t make specific health outcome promises'
      );
      break;
      
    case 'FINANCIAL':
      result.prevention_checklist.push(
        'Include risk disclaimers for financial products',
        'Avoid guaranteeing specific returns or outcomes',
        'Comply with financial advertising regulations'
      );
      break;
      
    case 'PERSONAL_ATTRIBUTES':
      result.prevention_checklist.push(
        'Use general language instead of "you" statements',
        'Avoid assumptions about viewer characteristics',
        'Focus on product benefits rather than personal traits'
      );
      break;
  }
  
  // Set resubmission strategy based on violation severity
  if (result.severity === 'CRITICAL') {
    result.resubmission_strategy = {
      recommended_approach: 'Complete creative overhaul required',
      timeline: '3-7 days',
      success_probability: 'MEDIUM',
      additional_precautions: [
        'Have multiple creative variations ready',
        'Test with very small budget initially',
        'Consider using different ad account if repeatedly rejected'
      ]
    };
  } else if (result.severity === 'HIGH') {
    result.resubmission_strategy = {
      recommended_approach: 'Significant modifications needed',
      timeline: '1-3 days',
      success_probability: 'HIGH',
      additional_precautions: [
        'Make conservative changes to ensure compliance',
        'Have backup creative ready',
        'Monitor closely after approval'
      ]
    };
  } else {
    result.resubmission_strategy = {
      recommended_approach: 'Minor adjustments should resolve issues',
      timeline: '24-48 hours',
      success_probability: 'HIGH',
      additional_precautions: [
        'Double-check all modifications',
        'Ensure quality standards are met'
      ]
    };
  }
}