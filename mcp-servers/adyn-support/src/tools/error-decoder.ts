/**
 * ERROR DECODER - Converts Meta API errors into human-readable fixes
 */

export interface APIError {
  code: number;
  message: string;
  type?: string;
  fbtrace_id?: string;
}

export interface ErrorContext {
  endpoint?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload?: Record<string, any>;
  account_id?: string;
}

export interface ErrorDecodeResult {
  error_category: 'PERMISSION' | 'POLICY' | 'BUDGET' | 'TARGETING' | 'CREATIVE' | 'RATE_LIMIT' | 'SYSTEM' | 'UNKNOWN';
  human_explanation: string;
  root_cause: string;
  immediate_actions: string[];
  prevention_tips: string[];
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  estimated_fix_time: string;
  requires_support: boolean;
  related_documentation: string[];
}

export async function errorDecoder(input: {
  api_error: APIError;
  context?: ErrorContext;
}): Promise<ErrorDecodeResult> {
  
  const { api_error, context } = input;
  
  // Initialize result with defaults
  const result: ErrorDecodeResult = {
    error_category: 'UNKNOWN',
    human_explanation: 'An unexpected error occurred',
    root_cause: 'Unknown error',
    immediate_actions: ['Contact Meta support'],
    prevention_tips: [],
    severity: 'MEDIUM',
    estimated_fix_time: 'Unknown',
    requires_support: true,
    related_documentation: []
  };

  // Decode based on error code
  const decodedError = decodeMetaError(api_error.code, api_error.message);
  
  // Merge decoded information
  Object.assign(result, decodedError);
  
  // Add context-specific guidance
  if (context) {
    enhanceWithContext(result, context);
  }

  return result;
}

function decodeMetaError(code: number, message: string): Partial<ErrorDecodeResult> {
  // Common Meta API error codes and their meanings
  const errorMappings: Record<number, Partial<ErrorDecodeResult>> = {
    // Permission Errors
    10: {
      error_category: 'PERMISSION',
      human_explanation: 'Your app or user does not have permission to perform this action',
      root_cause: 'Missing required permissions or access token expired',
      immediate_actions: [
        'Check if access token is valid and not expired',
        'Verify app has required permissions (ads_management, ads_read)',
        'Ensure user has admin/advertiser role on the ad account'
      ],
      prevention_tips: [
        'Implement token refresh logic',
        'Request appropriate permissions during app setup',
        'Monitor token expiration dates'
      ],
      severity: 'HIGH',
      estimated_fix_time: '5-15 minutes',
      requires_support: false,
      related_documentation: [
        'https://developers.facebook.com/docs/marketing-api/access',
        'https://developers.facebook.com/docs/permissions/reference'
      ]
    },

    // Rate Limiting
    17: {
      error_category: 'RATE_LIMIT',
      human_explanation: 'You have exceeded the API rate limit',
      root_cause: 'Too many API calls in a short time period',
      immediate_actions: [
        'Wait before making more API calls',
        'Implement exponential backoff retry logic',
        'Reduce API call frequency'
      ],
      prevention_tips: [
        'Implement proper rate limiting in your application',
        'Use batch requests where possible',
        'Monitor API usage patterns'
      ],
      severity: 'MEDIUM',
      estimated_fix_time: '1-60 minutes',
      requires_support: false,
      related_documentation: [
        'https://developers.facebook.com/docs/marketing-api/api-rate-limiting'
      ]
    },

    // Budget/Billing Errors
    2635: {
      error_category: 'BUDGET',
      human_explanation: 'Ad account has insufficient funds or payment method issues',
      root_cause: 'Payment method declined or account spending limit reached',
      immediate_actions: [
        'Check payment method validity',
        'Add funds to ad account',
        'Verify billing information is current',
        'Check account spending limits'
      ],
      prevention_tips: [
        'Set up automatic payments',
        'Monitor account balance regularly',
        'Keep payment methods up to date'
      ],
      severity: 'CRITICAL',
      estimated_fix_time: '15-60 minutes',
      requires_support: false,
      related_documentation: [
        'https://www.facebook.com/business/help/billing'
      ]
    },

    // Targeting Errors
    1487: {
      error_category: 'TARGETING',
      human_explanation: 'Audience size is too small or targeting parameters are invalid',
      root_cause: 'Targeting criteria results in audience smaller than minimum threshold',
      immediate_actions: [
        'Broaden targeting criteria (age range, interests, locations)',
        'Remove overly restrictive targeting',
        'Use broader geographic targeting',
        'Reduce interest stacking'
      ],
      prevention_tips: [
        'Always check estimated audience size before creating ad sets',
        'Use audience insights to validate targeting',
        'Test broader audiences first, then narrow down'
      ],
      severity: 'HIGH',
      estimated_fix_time: '10-30 minutes',
      requires_support: false,
      related_documentation: [
        'https://www.facebook.com/business/help/182371508761821'
      ]
    },

    // Creative/Policy Errors
    1885: {
      error_category: 'CREATIVE',
      human_explanation: 'Creative content violates Meta advertising policies',
      root_cause: 'Ad creative contains prohibited content or doesn\'t meet policy requirements',
      immediate_actions: [
        'Review Meta advertising policies',
        'Modify creative content to comply with policies',
        'Remove prohibited text, images, or claims',
        'Submit for re-review if needed'
      ],
      prevention_tips: [
        'Review advertising policies before creating ads',
        'Use Meta\'s creative best practices',
        'Avoid making exaggerated claims',
        'Test creatives with small budgets first'
      ],
      severity: 'HIGH',
      estimated_fix_time: '30-120 minutes',
      requires_support: false,
      related_documentation: [
        'https://www.facebook.com/policies/ads/',
        'https://www.facebook.com/business/help/2115102531872467'
      ]
    },

    // System Errors
    1: {
      error_category: 'SYSTEM',
      human_explanation: 'Temporary system error on Meta\'s side',
      root_cause: 'Internal server error or temporary service disruption',
      immediate_actions: [
        'Wait a few minutes and retry the request',
        'Check Meta\'s developer status page',
        'Implement retry logic with exponential backoff'
      ],
      prevention_tips: [
        'Always implement proper error handling',
        'Use retry mechanisms for transient errors',
        'Monitor Meta\'s status page for outages'
      ],
      severity: 'MEDIUM',
      estimated_fix_time: '5-30 minutes',
      requires_support: false,
      related_documentation: [
        'https://developers.facebook.com/status/'
      ]
    },

    // Invalid Parameter
    100: {
      error_category: 'TARGETING',
      human_explanation: 'One or more parameters in your request are invalid',
      root_cause: 'Request contains invalid field values or missing required parameters',
      immediate_actions: [
        'Check all required fields are included',
        'Validate parameter formats and values',
        'Review API documentation for correct parameter structure',
        'Check for typos in field names'
      ],
      prevention_tips: [
        'Use API documentation to validate request structure',
        'Implement request validation before sending',
        'Test with minimal valid requests first'
      ],
      severity: 'HIGH',
      estimated_fix_time: '15-45 minutes',
      requires_support: false,
      related_documentation: [
        'https://developers.facebook.com/docs/marketing-api/reference/'
      ]
    }
  };

  // Check for specific error code
  if (errorMappings[code]) {
    return errorMappings[code];
  }

  // Check message patterns for additional context
  const messagePatterns = analyzeErrorMessage(message);
  if (messagePatterns) {
    return messagePatterns;
  }

  // Default unknown error
  return {
    error_category: 'UNKNOWN',
    human_explanation: `Unknown error (Code: ${code}): ${message}`,
    root_cause: 'Unrecognized error code or message pattern',
    immediate_actions: [
      'Check Meta\'s developer documentation for this error code',
      'Contact Meta developer support',
      'Search Meta\'s developer community for similar issues'
    ],
    prevention_tips: [
      'Keep up to date with Meta API changes',
      'Implement comprehensive error logging'
    ],
    severity: 'MEDIUM',
    estimated_fix_time: 'Unknown',
    requires_support: true,
    related_documentation: [
      'https://developers.facebook.com/docs/marketing-api/error-reference/',
      'https://developers.facebook.com/support/'
    ]
  };
}

function analyzeErrorMessage(message: string): Partial<ErrorDecodeResult> | null {
  const lowerMessage = message.toLowerCase();

  // Learning phase related errors
  if (lowerMessage.includes('learning limited') || lowerMessage.includes('learning phase')) {
    return {
      error_category: 'TARGETING',
      human_explanation: 'Ad set is stuck in learning phase due to insufficient optimization events',
      root_cause: 'Not enough conversions or optimization events to complete learning',
      immediate_actions: [
        'Increase budget to get more events per week',
        'Consolidate similar ad sets',
        'Broaden targeting to increase audience size',
        'Change optimization event to something more frequent'
      ],
      prevention_tips: [
        'Ensure 50+ optimization events per week',
        'Start with broader targeting',
        'Use appropriate optimization events for your funnel'
      ],
      severity: 'HIGH',
      estimated_fix_time: '1-7 days',
      requires_support: false
    };
  }

  // Audience overlap
  if (lowerMessage.includes('overlap') || lowerMessage.includes('competing')) {
    return {
      error_category: 'TARGETING',
      human_explanation: 'Your ad sets are competing for the same audience',
      root_cause: 'Multiple ad sets targeting overlapping audiences',
      immediate_actions: [
        'Consolidate overlapping ad sets',
        'Use different targeting for each ad set',
        'Implement audience exclusions',
        'Use campaign budget optimization'
      ],
      prevention_tips: [
        'Check audience overlap before launching',
        'Use Meta\'s audience overlap tool',
        'Create distinct audience segments'
      ],
      severity: 'MEDIUM',
      estimated_fix_time: '30-60 minutes',
      requires_support: false
    };
  }

  // Budget too low
  if (lowerMessage.includes('budget') && (lowerMessage.includes('low') || lowerMessage.includes('minimum'))) {
    return {
      error_category: 'BUDGET',
      human_explanation: 'Budget is below minimum requirements for effective delivery',
      root_cause: 'Daily or lifetime budget set too low for audience size or optimization goal',
      immediate_actions: [
        'Increase daily budget to at least $20',
        'Use lifetime budget for longer campaigns',
        'Consolidate ad sets to pool budget',
        'Reduce number of ad sets'
      ],
      prevention_tips: [
        'Calculate minimum budget based on CPA goals',
        'Consider audience size when setting budgets',
        'Start with higher budgets and scale down if needed'
      ],
      severity: 'HIGH',
      estimated_fix_time: '5-15 minutes',
      requires_support: false
    };
  }

  return null;
}

function enhanceWithContext(result: ErrorDecodeResult, context: ErrorContext): void {
  // Add context-specific guidance based on endpoint
  if (context.endpoint) {
    if (context.endpoint.includes('/campaigns')) {
      result.immediate_actions.unshift('Verify campaign objective and settings');
    } else if (context.endpoint.includes('/adsets')) {
      result.immediate_actions.unshift('Check ad set targeting and budget configuration');
    } else if (context.endpoint.includes('/adcreatives')) {
      result.immediate_actions.unshift('Review creative content and format requirements');
    } else if (context.endpoint.includes('/ads')) {
      result.immediate_actions.unshift('Ensure ad set and creative IDs are valid');
    }
  }

  // Add account-specific context
  if (context.account_id) {
    result.immediate_actions.push(`Check account ${context.account_id} permissions and status`);
  }

  // Add payload-specific guidance
  if (context.payload) {
    if (context.payload.targeting) {
      result.immediate_actions.push('Validate targeting parameters and audience size');
    }
    if (context.payload.budget || context.payload.daily_budget) {
      result.immediate_actions.push('Verify budget meets minimum requirements');
    }
  }
}