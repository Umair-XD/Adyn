import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { Protocol } from '@modelcontextprotocol/sdk/shared/protocol.js';
import path from 'path';
import { config } from 'dotenv';

// NUCLEAR FIX: Monkey-patch the MCP Protocol to definitively bypass the hardcoded 60s timeout.
// This affects ALL requests throughout the SDK.
(Protocol.prototype as any).requestTimeout = 3600000; // 1 hour

// Load environment variables from .env.local
config({ path: '.env.local' });

export class MCPClientManager {
  private adynClient: Client | null = null;
  private supportClient: Client | null = null;

  async connectAdyn() {
    if (this.adynClient) return this.adynClient;

    const serverPath = path.join(process.cwd(), 'mcp-servers', 'adyn-marketing', 'dist', 'index.js');

    // Debug: Check if AI_GATEWAY_API_KEY is available
    console.log('🔑 AI_GATEWAY_API_KEY available:', !!process.env.AI_GATEWAY_API_KEY);
    console.log('🔑 AI_GATEWAY_API_KEY length:', process.env.AI_GATEWAY_API_KEY?.length || 0);

    if (!process.env.AI_GATEWAY_API_KEY) {
      throw new Error('AI_GATEWAY_API_KEY environment variable is not set. Please check your .env.local file.');
    }

    const transport = new StdioClientTransport({
      command: 'node',
      args: [serverPath],
      env: {
        ...process.env,
        AI_GATEWAY_API_KEY: process.env.AI_GATEWAY_API_KEY,
        // Try to disable MCP timeouts via environment variables
        MCP_TIMEOUT: '0',
        MCP_REQUEST_TIMEOUT: '0',
        NODE_OPTIONS: '--max-old-space-size=8192', // Increase memory for long operations
        // Disable various Node.js timeouts
        UV_THREADPOOL_SIZE: '16', // Increase thread pool for better performance
        NODE_NO_WARNINGS: '1' // Reduce noise in logs
      }
    });

    this.adynClient = new Client({
      name: 'adyn-web-app',
      version: '1.0.0',
    }, {
      capabilities: {}
    });

    // Disable request timeout (Protocol level)
    (this.adynClient as any).requestTimeout = 0;

    // Connect with custom timeout handling
    await this.adynClient.connect(transport);

    return this.adynClient;
  }

  async connectSupport() {
    if (this.supportClient) return this.supportClient;

    const serverPath = path.join(process.cwd(), 'mcp-servers', 'adyn-support', 'dist', 'index.js');

    const transport = new StdioClientTransport({
      command: 'node',
      args: [serverPath],
      env: {
        ...process.env,
        MCP_TIMEOUT: '0',
        MCP_REQUEST_TIMEOUT: '0'
      }
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

    // FORCE enhanced mode - no fallbacks, no timeouts, no compromises
    console.log(`🚀 Starting MCP tool: ${toolName} (ENHANCED MODE ONLY)`);

    // Truncate large arguments in logs to avoid clutter
    const argsString = JSON.stringify(args);
    if (argsString.length > 1000) {
      console.log(`📊 Tool arguments: (Large payload, ${argsString.length} chars) ${argsString.substring(0, 500)}...`);
    } else {
      console.log(`📊 Tool arguments:`, argsString);
    }

    const startTime = Date.now();

    try {
      // For enhanced intelligent campaign constructor, use extended timeout handling
      if (toolName === 'enhanced_intelligent_campaign_constructor' ||
        toolName === 'chunked_enhanced_intelligent_campaign_constructor' ||
        toolName === 'campaign_builder') {
        console.log('⏳ Using EXTENDED timeout for enhanced campaign constructor...');

        // Ensure the client doesn't time out (3600s = 1 hour)
        if (client) {
          (client as any).requestTimeout = 3600000;
          // Access the internal protocol if available to set the timeout there too
          const protocol = (client as any)._protocol;
          if (protocol) {
            protocol.requestTimeout = 3600000;
            // Also check the transport if it has a timeout
            if (protocol.transport) {
              (protocol.transport as any).requestTimeout = 3600000;
            }
          }
        }

        // Add progress tracking
        const progressInterval = setInterval(() => {
          const elapsed = Date.now() - startTime;
          console.log(`⏳ Campaign generation in progress... ${Math.floor(elapsed / 1000)}s elapsed`);
        }, 15000); // Log every 15 seconds for more activity

        try {
          // No timeout race condition - wait indefinitely
          const result = await client.callTool({
            name: toolName,
            arguments: args,
          });

          clearInterval(progressInterval);
          const endTime = Date.now();
          console.log(`✅ Enhanced MCP tool ${toolName} completed in ${endTime - startTime}ms`);
          return result;
        } catch (error) {
          clearInterval(progressInterval);
          throw error;
        }
      } else {
        // Standard timeout for other tools
        const result = await client.callTool({
          name: toolName,
          arguments: args,
        });

        const endTime = Date.now();
        console.log(`✅ MCP tool ${toolName} completed in ${endTime - startTime}ms`);
        return result;
      }
    } catch (error) {
      const endTime = Date.now();
      console.error(`❌ MCP tool ${toolName} failed after ${endTime - startTime}ms:`, error);

      // Enhanced error logging
      if (error instanceof Error) {
        console.error(`🔍 Error details:`, {
          name: error.name,
          message: error.message,
          stack: error.stack?.split('\n').slice(0, 5).join('\n') // First 5 lines of stack
        });
      }

      // If it's a timeout error, provide more helpful context
      if (error instanceof Error && (error.message.includes('timeout') || error.message.includes('Request timed out'))) {
        console.error('🔥 TIMEOUT DETECTED - Enhanced campaign constructor needs more time');
        console.error('💡 This happens when processing complex products or large Meta datasets');
        console.error('🛠️ Debugging info:', {
          toolName,
          elapsedTime: `${endTime - startTime}ms`,
          args: Object.keys(args),
          processEnv: {
            MCP_TIMEOUT: process.env.MCP_TIMEOUT,
            MCP_REQUEST_TIMEOUT: process.env.MCP_REQUEST_TIMEOUT,
            NODE_OPTIONS: process.env.NODE_OPTIONS
          }
        });
        throw new Error(`Campaign generation timed out. The enhanced AI system is processing complex data which can take several minutes. Please try again or contact support if this persists.`);
      }

      throw error;
    }
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
