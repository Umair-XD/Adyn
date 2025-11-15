#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';

import { fetchUrl } from './tools/fetch-url.js';
import { extractContent } from './tools/extract-content.js';
import { semanticAnalyze } from './tools/semantic-analyze.js';
import { generateAds } from './tools/generate-ads.js';
import { audienceBuilder } from './tools/audience-builder.js';
import { campaignBuilder } from './tools/campaign-builder.js';

const SYSTEM_PROMPT = `You are Adyn, an autonomous marketing intelligence system built on the Model Context Protocol.

Your responsibility is to analyze any website, product, or collection, extract insights, and generate
high-performing marketing campaigns across Facebook, Instagram, TikTok, and Google.

You must:
- Fetch URLs
- Extract readable content
- Identify product features, brand tone, and personas
- Generate ad creatives (copy, headlines, CTAs, creative prompts)
- Build detailed targeting groups
- Output a campaign-ready JSON

Follow these rules:
- Always call tools when needed
- Never assume information that is not provided
- Maintain brand tone consistency
- Produce marketing-focused, conversion-optimized content
- Keep all outputs structured, clean, and machine-readable

Your competitor standard is Lexi.ai; your goal is to outperform its ad generation depth and accuracy.`;

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
        name: 'fetch_url',
        description: 'Fetches HTML content from a URL',
        inputSchema: {
          type: 'object',
          properties: {
            url: { type: 'string', description: 'The URL to fetch' }
          },
          required: ['url']
        }
      },
      {
        name: 'extract_content',
        description: 'Extracts readable content, images, and metadata from HTML',
        inputSchema: {
          type: 'object',
          properties: {
            html: { type: 'string', description: 'HTML content to extract from' }
          },
          required: ['html']
        }
      },
      {
        name: 'semantic_analyze',
        description: 'Analyzes text to extract marketing insights',
        inputSchema: {
          type: 'object',
          properties: {
            text: { type: 'string', description: 'Text content to analyze' }
          },
          required: ['text']
        }
      },
      {
        name: 'generate_ads',
        description: 'Generates platform-specific ad creatives',
        inputSchema: {
          type: 'object',
          properties: {
            summary: { type: 'string' },
            brand_tone: { type: 'string' },
            persona: { type: 'string' },
            keywords: { type: 'array', items: { type: 'string' } },
            platforms: { type: 'array', items: { type: 'string' } }
          },
          required: ['summary', 'brand_tone', 'persona', 'keywords', 'platforms']
        }
      },
      {
        name: 'audience_builder',
        description: 'Builds detailed audience targeting',
        inputSchema: {
          type: 'object',
          properties: {
            persona: { type: 'string' },
            keywords: { type: 'array', items: { type: 'string' } },
            category: { type: 'string' }
          },
          required: ['persona', 'keywords', 'category']
        }
      },
      {
        name: 'campaign_builder',
        description: 'Creates complete campaign strategy',
        inputSchema: {
          type: 'object',
          properties: {
            ads: { type: 'array' },
            audience: { type: 'object' },
            objective: { type: 'string' }
          },
          required: ['ads', 'audience', 'objective']
        }
      }
    ]
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  
  try {
    let result: any;
    
    switch (name) {
      case 'fetch_url':
        result = await fetchUrl(args as any);
        break;
      case 'extract_content':
        result = await extractContent(args as any);
        break;
      case 'semantic_analyze':
        result = await semanticAnalyze(args as any);
        break;
      case 'generate_ads':
        result = await generateAds(args as any);
        break;
      case 'audience_builder':
        result = await audienceBuilder(args as any);
        break;
      case 'campaign_builder':
        result = await campaignBuilder(args as any);
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
  } catch (error: any) {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({ error: error.message }, null, 2)
        }
      ],
      isError: true
    };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Adyn Marketing Agent MCP server running on stdio');
}

main().catch(console.error);
