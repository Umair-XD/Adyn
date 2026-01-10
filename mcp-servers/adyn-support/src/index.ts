#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';

import { policyAnalyzer } from './tools/policy-analyzer.js';
import { learningDiagnostics } from './tools/learning-diagnostics.js';
import { deliveryOptimizer } from './tools/delivery-optimizer.js';
import { performanceAnalyzer } from './tools/performance-analyzer.js';
import { audienceOptimizer } from './tools/audience-optimizer.js';
import { errorDecoder } from './tools/error-decoder.js';

const server = new Server(
  {
    name: 'adyn-support-agent',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'policy_analyzer',
        description: 'Analyzes Meta ad rejections and policy violations, provides human-readable explanations and actionable fixes',
        inputSchema: {
          type: 'object',
          properties: {
            error_data: {
              type: 'object',
              properties: {
                error_code: { type: 'string' },
                error_message: { type: 'string' },
                ad_id: { type: 'string' },
                creative_id: { type: 'string' },
                rejection_reasons: { type: 'array', items: { type: 'string' } }
              },
              required: ['error_code', 'error_message']
            }
          },
          required: ['error_data']
        }
      },
      {
        name: 'learning_diagnostics',
        description: 'Diagnoses learning limited issues and provides consolidation/optimization recommendations',
        inputSchema: {
          type: 'object',
          properties: {
            adset_data: {
              type: 'object',
              properties: {
                adset_id: { type: 'string' },
                delivery_info: { type: 'object' },
                performance_metrics: { type: 'object' },
                budget: { type: 'number' },
                audience_size: { type: 'number' }
              },
              required: ['adset_id', 'delivery_info']
            }
          },
          required: ['adset_data']
        }
      },
      {
        name: 'delivery_optimizer',
        description: 'Analyzes high CPM and low delivery issues, suggests targeting and budget optimizations',
        inputSchema: {
          type: 'object',
          properties: {
            performance_data: {
              type: 'object',
              properties: {
                cpm: { type: 'number' },
                ctr: { type: 'number' },
                frequency: { type: 'number' },
                reach: { type: 'number' },
                audience_saturation: { type: 'number' }
              },
              required: ['cpm']
            },
            targeting_data: { type: 'object' }
          },
          required: ['performance_data']
        }
      },
      {
        name: 'performance_analyzer',
        description: 'Analyzes low CTR and poor performance, suggests creative and targeting improvements',
        inputSchema: {
          type: 'object',
          properties: {
            campaign_performance: {
              type: 'object',
              properties: {
                ctr: { type: 'number' },
                cvr: { type: 'number' },
                cpa: { type: 'number' },
                roas: { type: 'number' },
                frequency: { type: 'number' }
              },
              required: ['ctr']
            },
            creative_data: { type: 'array' },
            audience_data: { type: 'object' }
          },
          required: ['campaign_performance']
        }
      },
      {
        name: 'audience_optimizer',
        description: 'Detects audience overlap and provides consolidation recommendations',
        inputSchema: {
          type: 'object',
          properties: {
            adsets: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  adset_id: { type: 'string' },
                  targeting: { type: 'object' },
                  performance: { type: 'object' }
                }
              }
            }
          },
          required: ['adsets']
        }
      },
      {
        name: 'error_decoder',
        description: 'Converts Meta API error codes into human-readable explanations with corrective actions',
        inputSchema: {
          type: 'object',
          properties: {
            api_error: {
              type: 'object',
              properties: {
                code: { type: 'number' },
                message: { type: 'string' },
                type: { type: 'string' },
                fbtrace_id: { type: 'string' }
              },
              required: ['code', 'message']
            },
            context: {
              type: 'object',
              properties: {
                endpoint: { type: 'string' },
                payload: { type: 'object' },
                account_id: { type: 'string' }
              }
            }
          },
          required: ['api_error']
        }
      }
    ]
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  
  try {
    let result;
    
    switch (name) {
      case 'policy_analyzer':
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        result = await policyAnalyzer(args as any);
        break;
      case 'learning_diagnostics':
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        result = await learningDiagnostics(args as any);
        break;
      case 'delivery_optimizer':
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        result = await deliveryOptimizer(args as any);
        break;
      case 'performance_analyzer':
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        result = await performanceAnalyzer(args as any);
        break;
      case 'audience_optimizer':
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        result = await audienceOptimizer(args as any);
        break;
      case 'error_decoder':
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        result = await errorDecoder(args as any);
        break;
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2)
        }
      ]
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({ error: errorMessage }, null, 2)
        }
      ],
      isError: true
    };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Adyn Support Agent MCP server running on stdio');
}

main().catch(console.error);
