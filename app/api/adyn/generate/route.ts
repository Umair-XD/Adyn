import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongoose';
import Project from '@/models/Project';
import Source from '@/models/Source';
import Campaign from '@/models/Campaign';
import GenerationLog from '@/models/GenerationLog';
import { mcpManager } from '@/lib/mcp-client';
import { AdynOutput } from '@/types';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { projectId, url, objective } = await req.json();

    if (!projectId || !url) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    await connectDB();

    // Verify project ownership
    const project = await Project.findOne({
      _id: projectId,
      userId: session.user.id
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Create source record
    const source = await Source.create({
      projectId,
      type: 'url',
      inputUrl: url,
      status: 'processing'
    });

    try {
      // Track module usage with actual token data
      const moduleUsages: Array<{
        module: string;
        inputTokens: number;
        outputTokens: number;
        totalTokens: number;
        reasoningTokens: number;
        cachedInputTokens: number;
        cost: number;
        callCount: number;
      }> = [];

      // Execute MCP tool chain with token tracking
      console.log('Fetching URL...');
      const fetchInput = { url };
      const fetchResult = await mcpManager.callTool('adyn', 'fetch_url', fetchInput);
      const fetchContent = Array.isArray(fetchResult.content) ? fetchResult.content[0] : fetchResult.content;
      const fetchData = JSON.parse((fetchContent as { text?: string })?.text || '{}');
      const html = fetchData.html;
      // fetch_url doesn't use AI, so no tokens
      moduleUsages.push({
        module: 'fetch_url',
        inputTokens: 0,
        outputTokens: 0,
        totalTokens: 0,
        reasoningTokens: 0,
        cachedInputTokens: 0,
        cost: 0,
        callCount: 1
      });

      console.log('Extracting content...');
      const extractInput = { html };
      const extractResult = await mcpManager.callTool('adyn', 'extract_content', extractInput);
      const extractContent = Array.isArray(extractResult.content) ? extractResult.content[0] : extractResult.content;
      const extracted = JSON.parse((extractContent as { text?: string })?.text || '{}');
      // extract_content doesn't use AI, so no tokens
      moduleUsages.push({
        module: 'extract_content',
        inputTokens: 0,
        outputTokens: 0,
        totalTokens: 0,
        reasoningTokens: 0,
        cachedInputTokens: 0,
        cost: 0,
        callCount: 1
      });

      console.log('Analyzing content...');
      const textContent = extracted.text_blocks?.join(' ') || '';
      const analyzeInput = { text: textContent };
      const analyzeResult = await mcpManager.callTool('adyn', 'semantic_analyze', analyzeInput);
      const analyzeContent = Array.isArray(analyzeResult.content) ? analyzeResult.content[0] : analyzeResult.content;
      const analysis = JSON.parse((analyzeContent as { text?: string })?.text || '{}');
      if (analysis.usage) {
        const cost = (analysis.usage.promptTokens / 1_000_000 * 2.50) + (analysis.usage.completionTokens / 1_000_000 * 10.00);
        moduleUsages.push({
          module: 'semantic_analyze',
          inputTokens: analysis.usage.promptTokens,
          outputTokens: analysis.usage.completionTokens,
          totalTokens: analysis.usage.totalTokens,
          reasoningTokens: analysis.usage.reasoningTokens,
          cachedInputTokens: analysis.usage.cachedInputTokens,
          cost,
          callCount: 1
        });
      }

      console.log('Building audience...');
      const audienceInput = {
        persona: analysis.audience_persona,
        keywords: analysis.keywords,
        category: analysis.category,
        target_segments: analysis.target_segments,
        geographic_analysis: analysis.geographic_analysis
      };
      const audienceResult = await mcpManager.callTool('adyn', 'audience_builder', audienceInput);
      const audienceContent = Array.isArray(audienceResult.content) ? audienceResult.content[0] : audienceResult.content;
      const audience = JSON.parse((audienceContent as { text?: string })?.text || '{}');
      if (audience.usage) {
        const cost = (audience.usage.promptTokens / 1_000_000 * 2.50) + (audience.usage.completionTokens / 1_000_000 * 10.00);
        moduleUsages.push({
          module: 'audience_builder',
          inputTokens: audience.usage.promptTokens,
          outputTokens: audience.usage.completionTokens,
          totalTokens: audience.usage.totalTokens,
          reasoningTokens: audience.usage.reasoningTokens,
          cachedInputTokens: audience.usage.cachedInputTokens,
          cost,
          callCount: 1
        });
      }

      console.log('Generating ads...');
      const adsInput = {
        summary: analysis.summary,
        brand_tone: analysis.brand_tone,
        persona: analysis.audience_persona,
        keywords: analysis.keywords,
        platforms: ['facebook', 'instagram', 'tiktok', 'google'],
        target_segments: analysis.target_segments,
        use_cases: analysis.use_cases
      };
      const adsResult = await mcpManager.callTool('adyn', 'generate_ads', adsInput);
      const adsContent = Array.isArray(adsResult.content) ? adsResult.content[0] : adsResult.content;
      const adsData = JSON.parse((adsContent as { text?: string })?.text || '{}');
      if (adsData.usage) {
        const cost = (adsData.usage.promptTokens / 1_000_000 * 2.50) + (adsData.usage.completionTokens / 1_000_000 * 10.00);
        moduleUsages.push({
          module: 'generate_ads',
          inputTokens: adsData.usage.promptTokens,
          outputTokens: adsData.usage.completionTokens,
          totalTokens: adsData.usage.totalTokens,
          reasoningTokens: adsData.usage.reasoningTokens,
          cachedInputTokens: adsData.usage.cachedInputTokens,
          cost,
          callCount: 1
        });
      }

      console.log('Building campaign...');
      const campaignInput = {
        ads: adsData.ads,
        audience: audience,
        objective: objective || 'Conversions'
      };
      const campaignResult = await mcpManager.callTool('adyn', 'campaign_builder', campaignInput);
      const campaignContent = Array.isArray(campaignResult.content) ? campaignResult.content[0] : campaignResult.content;
      const strategy = JSON.parse((campaignContent as { text?: string })?.text || '{}');
      if (strategy.usage) {
        const cost = (strategy.usage.promptTokens / 1_000_000 * 2.50) + (strategy.usage.completionTokens / 1_000_000 * 10.00);
        moduleUsages.push({
          module: 'campaign_builder',
          inputTokens: strategy.usage.promptTokens,
          outputTokens: strategy.usage.completionTokens,
          totalTokens: strategy.usage.totalTokens,
          reasoningTokens: strategy.usage.reasoningTokens,
          cachedInputTokens: strategy.usage.cachedInputTokens,
          cost,
          callCount: 1
        });
      }

      // Build unified output
      const adynOutput: AdynOutput = {
        product_summary: analysis,
        marketing_insights: {
          keywords: analysis.keywords,
          value_proposition: analysis.value_proposition,
          brand_tone: analysis.brand_tone,
          category: analysis.category
        },
        ad_creatives: adsData.ads,
        audience_targeting: audience,
        campaign_strategy: strategy
      };

      // Save campaign with fallback name
      const campaignName = strategy.campaign_name || `Campaign - ${new Date().toISOString().split('T')[0]}`;
      const campaign = await Campaign.create({
        projectId,
        sourceId: source._id,
        name: campaignName,
        objective: strategy.objective || objective || 'Conversions',
        platforms: strategy.platform_mix || ['facebook', 'instagram'],
        generationResult: adynOutput
      });

      // Update source status
      await Source.findByIdAndUpdate(source._id, { status: 'completed' });

      // Calculate totals from module usage
      const totalPromptTokens = moduleUsages.reduce((sum, m) => sum + m.inputTokens, 0);
      const totalCompletionTokens = moduleUsages.reduce((sum, m) => sum + m.outputTokens, 0);
      const totalTokens = moduleUsages.reduce((sum, m) => sum + m.totalTokens, 0);
      const totalCost = moduleUsages.reduce((sum, m) => sum + m.cost, 0);

      // Create generation log with detailed module usage
      await GenerationLog.create({
        userId: session.user.id,
        campaignId: campaign._id,
        agent: 'adyn',
        requestPayload: { projectId, url, objective },
        responsePayload: adynOutput,
        tokensUsed: {
          prompt: totalPromptTokens,
          completion: totalCompletionTokens,
          total: totalTokens
        },
        moduleUsage: moduleUsages,
        estimatedCost: totalCost
      });

      return NextResponse.json({
        success: true,
        campaignId: campaign._id.toString(),
        data: adynOutput
      });

    } catch (error) {
      // Update source status to failed
      await Source.findByIdAndUpdate(source._id, { status: 'failed' });

      throw error;
    }

  } catch (error) {
    console.error('Generation error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Generation failed';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
