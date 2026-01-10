#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';

import { fetchUrl } from './tools/fetch-url.js';
import { extractContent } from './tools/extract-content.js';
import { semanticAnalyze } from './tools/semantic-analyze.js';
import { accountAudit } from './tools/account-audit.js';
import { strategyEngine } from './tools/strategy-engine.js';
import { audienceConstructor } from './tools/audience-constructor.js';
import { placementIntelligence } from './tools/placement-intelligence.js';
import { creativeStrategy } from './tools/creative-strategy.js';
import { budgetOptimizer } from './tools/budget-optimizer.js';
import { campaignOrchestrator } from './tools/campaign-orchestrator.js';
import { campaignBuilder } from './tools/campaign-builder.js';

const server = new Server(
  {
    name: 'adyn-marketing-agent',
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
        name: 'campaign_builder',
        description: 'COMPLETE BUILDER: Generates a complete Meta Ads campaign from product URL (Fetch → Analyze → Strategy → Audience → Creative → Budget → Assembly)',
        inputSchema: {
          type: 'object',
          properties: {
            product_url: { type: 'string', description: 'Product/service URL to analyze' },
            campaign_purpose: {
              type: 'string',
              enum: ['conversion', 'engagement', 'traffic', 'awareness'],
              description: 'Primary objective'
            },
            budget: { type: 'number', description: 'Total campaign budget' },
            geo_targets: {
              type: 'array',
              items: { type: 'string' },
              description: 'Target countries (e.g. ["US", "UK"])'
            },
            ad_account_id: { type: 'string', description: 'Optional Meta Ad Account ID' },
            raw_meta_account_data: {
              type: 'object',
              description: 'Optional raw insights for account intelligence'
            }
          },
          required: ['product_url', 'campaign_purpose', 'budget', 'geo_targets']
        }
      },
      {
        name: 'fetch_url',
        description: 'Fetches HTML content from product/catalog URLs',
        inputSchema: {
          type: 'object',
          properties: {
            url: { type: 'string' }
          },
          required: ['url']
        }
      },
      {
        name: 'extract_content',
        description: 'Extracts structured information from HTML',
        inputSchema: {
          type: 'object',
          properties: {
            html: { type: 'string' }
          },
          required: ['html']
        }
      },
      {
        name: 'semantic_analyze',
        description: 'AI analysis of product content',
        inputSchema: {
          type: 'object',
          properties: {
            text: { type: 'string' }
          },
          required: ['text']
        }
      },
      {
        name: 'account_audit',
        description: 'Audits Meta account data',
        inputSchema: {
          type: 'object',
          properties: {
            account_data: { type: 'object' }
          },
          required: ['account_data']
        }
      },
      {
        name: 'strategy_engine',
        description: 'Determines campaign strategy',
        inputSchema: {
          type: 'object',
          properties: {
            audit_result: { type: 'object' },
            business_goal: { type: 'string' },
            campaign_input: { type: 'object' }
          },
          required: ['audit_result', 'business_goal', 'campaign_input']
        }
      },
      {
        name: 'audience_constructor',
        description: 'Constructs target audiences',
        inputSchema: {
          type: 'object',
          properties: {
            strategy: { type: 'object' },
            audience_requirements: { type: 'array' }
          },
          required: ['strategy', 'audience_requirements']
        }
      },
      {
        name: 'placement_intelligence',
        description: 'Optimizes ad placements',
        inputSchema: {
          type: 'object',
          properties: {
            adsets: { type: 'array' },
            creative_assets: { type: 'array' }
          },
          required: ['adsets', 'creative_assets']
        }
      },
      {
        name: 'creative_strategy',
        description: 'Generates ad creatives',
        inputSchema: {
          type: 'object',
          properties: {
            adsets: { type: 'array' },
            creative_assets: { type: 'array' },
            brand_guidelines: { type: 'object' }
          },
          required: ['adsets', 'creative_assets']
        }
      },
      {
        name: 'budget_optimizer',
        description: 'Optimizes budget allocation',
        inputSchema: {
          type: 'object',
          properties: {
            strategy: { type: 'object' },
            adsets: { type: 'array' },
            total_budget: { type: 'number' }
          },
          required: ['strategy', 'adsets', 'total_budget']
        }
      },
      {
        name: 'campaign_orchestrator',
        description: 'Assembles final API payloads',
        inputSchema: {
          type: 'object',
          properties: {
            campaign_structure: { type: 'object' },
            account_id: { type: 'string' }
          },
          required: ['campaign_structure', 'account_id']
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
      case 'campaign_builder':
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        result = await campaignBuilder(args as any);
        break;
      case 'fetch_url':
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        result = await fetchUrl(args as any);
        break;
      case 'extract_content':
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        result = await extractContent(args as any);
        break;
      case 'semantic_analyze':
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        result = await semanticAnalyze(args as any);
        break;
      case 'account_audit':
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        result = await accountAudit(args as any);
        break;
      case 'strategy_engine':
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        result = await strategyEngine(args as any);
        break;
      case 'audience_constructor':
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        result = await audienceConstructor(args as any);
        break;
      case 'placement_intelligence':
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        result = await placementIntelligence(args as any);
        break;
      case 'creative_strategy':
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        result = await creativeStrategy(args as any);
        break;
      case 'budget_optimizer':
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        result = await budgetOptimizer(args as any);
        break;
      case 'campaign_orchestrator':
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        result = await campaignOrchestrator(args as any);
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
  process.env.NODE_OPTIONS = '--max-old-space-size=8192';
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Adyn Marketing Agent MCP server running on stdio');
}

main().catch(console.error);
