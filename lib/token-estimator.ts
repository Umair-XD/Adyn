// Token usage estimation and cost calculation

export interface TokenUsage {
  total: number;
  byTool: Array<{
    tool: string;
    tokens: number;
  }>;
}

// Rough token estimation (1 token ≈ 4 characters)
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

export function calculateTokenUsage(
  toolName: string,
  input: Record<string, unknown>,
  output: Record<string, unknown>
): TokenUsage {
  const inputStr = JSON.stringify(input);
  const outputStr = JSON.stringify(output);
  
  const inputTokens = estimateTokens(inputStr);
  const outputTokens = estimateTokens(outputStr);
  const total = inputTokens + outputTokens;
  
  return {
    total,
    byTool: [
      {
        tool: toolName,
        tokens: total,
      },
    ],
  };
}

export function aggregateTokenUsage(usages: TokenUsage[]): TokenUsage {
  const byTool: { [key: string]: number } = {};
  let total = 0;
  
  for (const usage of usages) {
    total += usage.total;
    for (const tool of usage.byTool) {
      byTool[tool.tool] = (byTool[tool.tool] || 0) + tool.tokens;
    }
  }
  
  return {
    total,
    byTool: Object.entries(byTool).map(([tool, tokens]) => ({
      tool,
      tokens,
    })),
  };
}

// GPT-4o pricing (as of 2024)
// Input: $2.50 per 1M tokens
// Output: $10.00 per 1M tokens
export function calculateCost(usage: TokenUsage): number {
  // Rough estimate: average of input/output pricing
  const avgPricePerToken = (2.5 + 10.0) / 2 / 1_000_000;
  return usage.total * avgPricePerToken;
}
