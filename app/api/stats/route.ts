import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongoose';
import GenerationLog from '@/models/GenerationLog';
import Campaign from '@/models/Campaign';

// OpenAI GPT-4o pricing per 1M tokens
const PRICING = {
  prompt: 2.50,      // $2.50 per 1M input tokens
  completion: 10.00  // $10.00 per 1M output tokens
};

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const campaignId = searchParams.get('campaignId');

    await connectDB();

    if (campaignId) {
      // Get stats for specific campaign
      const campaign = await Campaign.findById(campaignId);
      
      if (!campaign) {
        return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
      }

      // Try to find logs with campaignId first, fallback to all user logs if none found
      let logs = await GenerationLog.find({ campaignId }).lean();
      
      if (logs.length === 0) {
        // For old campaigns without campaignId tracking, show all user logs
        logs = await GenerationLog.find({ userId: session.user.id }).lean();
      }
      
      const stats = calculateStats(logs as GenerationLogData[]);

      return NextResponse.json({
        campaign: {
          id: campaign._id.toString(),
          name: campaign.name
        },
        ...stats,
        note: logs.length === 0 ? 'No generation logs found for this campaign' : undefined
      });
    } else {
      // Get overall stats for user
      const logs = await GenerationLog.find({ userId: session.user.id }).lean();
      const campaigns = await Campaign.countDocuments({
        projectId: { $in: await getProjectIds(session.user.id) }
      });

      const stats = calculateStats(logs as GenerationLogData[]);

      return NextResponse.json({
        totalCampaigns: campaigns,
        ...stats
      });
    }

  } catch (error) {
    console.error('Stats error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch stats';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

async function getProjectIds(userId: string) {
  const Project = (await import('@/models/Project')).default;
  const projects = await Project.find({ userId }).select('_id').lean();
  return projects.map(p => p._id);
}

interface GenerationLogData {
  tokensUsed?: {
    prompt?: number;
    completion?: number;
    total?: number;
  };
  tokenUsage?: {
    total?: number;
    byTool?: Array<{
      inputTokens?: number;
      outputTokens?: number;
      totalTokens?: number;
    }>;
  };
  moduleUsage?: Array<{
    module: string;
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
    reasoningTokens: number;
    cachedInputTokens: number;
    cost: number;
    callCount: number;
  }>;
  requestPayload?: Record<string, unknown>;
  responsePayload?: Record<string, unknown>;
  agent?: string;
  campaignId?: unknown;
}

function calculateStats(logs: GenerationLogData[]) {
  let totalPromptTokens = 0;
  let totalCompletionTokens = 0;
  let totalTokens = 0;
  let totalCost = 0;

  const distribution: { [key: string]: { tokens: number; cost: number; count: number } } = {};
  const moduleBreakdown: { [key: string]: { inputTokens: number; outputTokens: number; totalTokens: number; reasoningTokens: number; cachedInputTokens: number; cost: number; callCount: number } } = {};

  for (const log of logs) {
    let promptTokens = 0;
    let completionTokens = 0;
    let tokens = 0;

    // Handle new format (tokensUsed)
    if (log.tokensUsed) {
      promptTokens = log.tokensUsed.prompt || 0;
      completionTokens = log.tokensUsed.completion || 0;
      tokens = log.tokensUsed.total || promptTokens + completionTokens;
    }
    // Handle moduleUsage format (per-action breakdown)
    else if (log.moduleUsage && log.moduleUsage.length > 0) {
      for (const module of log.moduleUsage) {
        promptTokens += module.inputTokens;
        completionTokens += module.outputTokens;
        tokens += module.totalTokens;

        // Aggregate module breakdown
        if (!moduleBreakdown[module.module]) {
          moduleBreakdown[module.module] = {
            inputTokens: 0,
            outputTokens: 0,
            totalTokens: 0,
            reasoningTokens: 0,
            cachedInputTokens: 0,
            cost: 0,
            callCount: 0
          };
        }
        moduleBreakdown[module.module].inputTokens += module.inputTokens;
        moduleBreakdown[module.module].outputTokens += module.outputTokens;
        moduleBreakdown[module.module].totalTokens += module.totalTokens;
        moduleBreakdown[module.module].reasoningTokens += module.reasoningTokens || 0;
        moduleBreakdown[module.module].cachedInputTokens += module.cachedInputTokens || 0;
        moduleBreakdown[module.module].cost += module.cost;
        moduleBreakdown[module.module].callCount += module.callCount;
      }
    }
    // Handle old format (tokenUsage with byTool)
    else if (log.tokenUsage?.byTool) {
      for (const tool of log.tokenUsage.byTool) {
        promptTokens += tool.inputTokens || 0;
        completionTokens += tool.outputTokens || 0;
      }
      tokens = log.tokenUsage.total || promptTokens + completionTokens;
    }
    // Estimate from payload sizes if no token data
    else if (log.requestPayload && log.responsePayload) {
      const inputText = JSON.stringify(log.requestPayload);
      const outputText = JSON.stringify(log.responsePayload);
      promptTokens = Math.ceil(inputText.length / 4);
      completionTokens = Math.ceil(outputText.length / 4);
      tokens = promptTokens + completionTokens;
    }

    totalPromptTokens += promptTokens;
    totalCompletionTokens += completionTokens;
    totalTokens += tokens;

    // Calculate cost
    const cost = (promptTokens / 1_000_000 * PRICING.prompt) + 
                 (completionTokens / 1_000_000 * PRICING.completion);
    totalCost += cost;

    // Distribution by agent
    const agent = log.agent || 'unknown';
    if (!distribution[agent]) {
      distribution[agent] = { tokens: 0, cost: 0, count: 0 };
    }
    distribution[agent].tokens += tokens;
    distribution[agent].cost += cost;
    distribution[agent].count += 1;
  }

  return {
    totalGenerations: logs.length,
    tokenUsage: {
      prompt: totalPromptTokens,
      completion: totalCompletionTokens,
      total: totalTokens
    },
    estimatedCost: {
      total: totalCost,
      perMillionTokens: {
        prompt: PRICING.prompt,
        completion: PRICING.completion
      }
    },
    distribution: Object.entries(distribution).map(([agent, data]) => ({
      agent,
      ...data
    })),
    moduleBreakdown: Object.entries(moduleBreakdown).map(([module, data]) => ({
      module,
      ...data
    })).sort((a, b) => b.totalTokens - a.totalTokens)
  };
}
