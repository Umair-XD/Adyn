import { createGateway } from '@ai-sdk/gateway';

// Get API key from environment
const apiKey = process.env.AI_GATEWAY_API_KEY;

if (!apiKey) {
  console.error('No API key found. Set AI_GATEWAY_API_KEY in your environment');
  throw new Error('AI_GATEWAY_API_KEY environment variable is not set');
}

/**
 * Vercel AI Gateway Configuration (Credit-based)
 * 
 * Using Vercel AI Gateway credits only:
 * - createGateway from @ai-sdk/gateway
 * - Model names WITHOUT provider prefix (gpt-4o, NOT openai/gpt-4o)
 * - Vercel routes to providers internally using your Gateway credits
 */

const gateway = createGateway({ apiKey });

// Export the gateway function for use with model names (no provider prefix)
export const openai = gateway;

console.error(`✓ Vercel AI Gateway initialized with credits`);
console.error(`✓ Key: ${apiKey.substring(0, 10)}...`);
