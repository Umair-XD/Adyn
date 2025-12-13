// Token usage estimation and cost calculation

export interface TokenUsage {
  total: number;
  byTool: Array<{
    tool: string;
    tokens: number;
    inputTokens: number;
    outputTokens: number;
  }>;
}

export interface ModuleTokenUsage {
  module: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  cost: number;
  callCount: number;
  timestamp: Date;
}

export interface DetailedTokenUsage {
  totalTokens: number;
  totalCost: number;
  moduleBreakdown: ModuleTokenUsage[];
  summary: {
    totalCalls: number;
    averageTokensPerCall: number;
    mostExpensiveModule: string;
    leastExpensiveModule: string;
  };
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
        inputTokens,
        outputTokens,
      },
    ],
  };
}

export function aggregateTokenUsage(usages: TokenUsage[]): TokenUsage {
  const byTool: { [key: string]: { tokens: number; inputTokens: number; outputTokens: number } } = {};
  let total = 0;
  
  for (const usage of usages) {
    total += usage.total;
    for (const tool of usage.byTool) {
      if (!byTool[tool.tool]) {
        byTool[tool.tool] = { tokens: 0, inputTokens: 0, outputTokens: 0 };
      }
      byTool[tool.tool].tokens += tool.tokens;
      byTool[tool.tool].inputTokens += tool.inputTokens;
      byTool[tool.tool].outputTokens += tool.outputTokens;
    }
  }
  
  return {
    total,
    byTool: Object.entries(byTool).map(([tool, data]) => ({
      tool,
      tokens: data.tokens,
      inputTokens: data.inputTokens,
      outputTokens: data.outputTokens,
    })),
  };
}

export function aggregateModuleUsage(usages: TokenUsage[]): ModuleTokenUsage[] {
  const byModule: { [key: string]: ModuleTokenUsage } = {};
  
  for (const usage of usages) {
    for (const tool of usage.byTool) {
      if (!byModule[tool.tool]) {
        byModule[tool.tool] = {
          module: tool.tool,
          inputTokens: 0,
          outputTokens: 0,
          totalTokens: 0,
          cost: 0,
          callCount: 0,
          timestamp: new Date(),
        };
      }
      
      byModule[tool.tool].inputTokens += tool.inputTokens;
      byModule[tool.tool].outputTokens += tool.outputTokens;
      byModule[tool.tool].totalTokens += tool.tokens;
      byModule[tool.tool].callCount += 1;
      
      // Calculate cost using GPT-4o pricing
      const inputCost = (tool.inputTokens / 1_000_000) * 2.50;
      const outputCost = (tool.outputTokens / 1_000_000) * 10.00;
      byModule[tool.tool].cost += inputCost + outputCost;
    }
  }
  
  return Object.values(byModule).sort((a, b) => b.totalTokens - a.totalTokens);
}

// GPT-4o pricing (as of 2024)
// Input: $2.50 per 1M tokens
// Output: $10.00 per 1M tokens
export function calculateCost(usage: TokenUsage): number {
  // Rough estimate: average of input/output pricing
  const avgPricePerToken = (2.5 + 10.0) / 2 / 1_000_000;
  return usage.total * avgPricePerToken;
}
