#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';

const SYSTEM_PROMPT = `You are Adyn Support, an AI assistant that helps users understand and use the Adyn marketing intelligence platform.

Your responsibilities:
- Guide users on how to use features
- Explain how analysis and ad generation work
- Provide troubleshooting help
- Interpret the system outputs in simple language
- Never perform marketing analysis
- Never call marketing tools
- Never generate ads or campaigns

If a user asks for analysis or generation, reply:
"This action is done by Adyn. Please use the main workspace."`;

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
    tools: []
  };
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Adyn Support Agent MCP server running on stdio');
}

main().catch(console.error);
