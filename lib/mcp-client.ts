import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import path from 'path';

export class MCPClientManager {
  private adynClient: Client | null = null;
  private supportClient: Client | null = null;

  async connectAdyn() {
    if (this.adynClient) return this.adynClient;
    
    const serverPath = path.join(process.cwd(), 'mcp-servers', 'adyn-marketing', 'dist', 'index.js');
    
    const transport = new StdioClientTransport({
      command: 'node',
      args: [serverPath],
      env: {
        ...process.env,
        AI_GATEWAY_API_KEY: process.env.AI_GATEWAY_API_KEY || ''
      }
    });
    
    this.adynClient = new Client({
      name: 'adyn-web-app',
      version: '1.0.0',
    }, {
      capabilities: {}
    });
    
    await this.adynClient.connect(transport);
    return this.adynClient;
  }

  async connectSupport() {
    if (this.supportClient) return this.supportClient;
    
    const serverPath = path.join(process.cwd(), 'mcp-servers', 'adyn-support', 'dist', 'index.js');
    
    const transport = new StdioClientTransport({
      command: 'node',
      args: [serverPath],
    });
    
    this.supportClient = new Client({
      name: 'adyn-web-app',
      version: '1.0.0',
    }, {
      capabilities: {}
    });
    
    await this.supportClient.connect(transport);
    return this.supportClient;
  }

  async callTool(agent: 'adyn' | 'support', toolName: string, args: Record<string, unknown>) {
    const client = agent === 'adyn' 
      ? await this.connectAdyn() 
      : await this.connectSupport();
    
    const result = await client.callTool({
      name: toolName,
      arguments: args,
    });
    
    return result;
  }

  async disconnect() {
    if (this.adynClient) {
      await this.adynClient.close();
      this.adynClient = null;
    }
    if (this.supportClient) {
      await this.supportClient.close();
      this.supportClient = null;
    }
  }
}

export const mcpManager = new MCPClientManager();
