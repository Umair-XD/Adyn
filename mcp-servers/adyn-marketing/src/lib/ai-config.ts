import { createGateway } from '@ai-sdk/gateway';

const apiKey = process.env.AI_GATEWAY_API_KEY;

if (!apiKey) {
  console.error('No API key found. Set AI_GATEWAY_API_KEY in your environment');
  throw new Error('AI_GATEWAY_API_KEY environment variable is not set');
}

const gateway = createGateway({ apiKey });
export const openai = gateway;

console.error(`✓ Vercel AI Gateway initialized with credits`);
console.error(`✓ Key: ${apiKey.substring(0, 10)}...`);
