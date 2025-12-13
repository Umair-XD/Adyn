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
      // Execute MCP tool chain
      console.log('Fetching URL...');
      const fetchResult = await mcpManager.callTool('adyn', 'fetch_url', { url });
      const fetchContent = Array.isArray(fetchResult.content) ? fetchResult.content[0] : fetchResult.content;
      const html = JSON.parse((fetchContent as { text?: string })?.text || '{}').html;

      console.log('Extracting content...');
      const extractResult = await mcpManager.callTool('adyn', 'extract_content', { html });
      const extractContent = Array.isArray(extractResult.content) ? extractResult.content[0] : extractResult.content;
      const extracted = JSON.parse((extractContent as { text?: string })?.text || '{}');

      console.log('Analyzing content...');
      const textContent = extracted.text_blocks?.join(' ') || '';
      const analyzeResult = await mcpManager.callTool('adyn', 'semantic_analyze', { text: textContent });
      const analyzeContent = Array.isArray(analyzeResult.content) ? analyzeResult.content[0] : analyzeResult.content;
      const analysis = JSON.parse((analyzeContent as { text?: string })?.text || '{}');

      console.log('Building audience...');
      const audienceResult = await mcpManager.callTool('adyn', 'audience_builder', {
        persona: analysis.audience_persona,
        keywords: analysis.keywords,
        category: analysis.category,
        target_segments: analysis.target_segments
      });
      const audienceContent = Array.isArray(audienceResult.content) ? audienceResult.content[0] : audienceResult.content;
      const audience = JSON.parse((audienceContent as { text?: string })?.text || '{}');

      console.log('Generating ads...');
      const adsResult = await mcpManager.callTool('adyn', 'generate_ads', {
        summary: analysis.summary,
        brand_tone: analysis.brand_tone,
        persona: analysis.audience_persona,
        keywords: analysis.keywords,
        platforms: ['facebook', 'instagram', 'tiktok', 'google'],
        target_segments: analysis.target_segments,
        use_cases: analysis.use_cases
      });
      const adsContent = Array.isArray(adsResult.content) ? adsResult.content[0] : adsResult.content;
      const adsData = JSON.parse((adsContent as { text?: string })?.text || '{}');

      console.log('Building campaign...');
      const campaignResult = await mcpManager.callTool('adyn', 'campaign_builder', {
        ads: adsData.ads,
        audience: audience,
        objective: objective || 'Conversions'
      });
      const campaignContent = Array.isArray(campaignResult.content) ? campaignResult.content[0] : campaignResult.content;
      const strategy = JSON.parse((campaignContent as { text?: string })?.text || '{}');

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

      // Estimate token usage
      const { estimateTokens } = await import('@/lib/token-estimator');
      const inputText = JSON.stringify({ projectId, url, objective });
      const outputText = JSON.stringify(adynOutput);
      const promptTokens = estimateTokens(inputText);
      const completionTokens = estimateTokens(outputText);
      const totalTokens = promptTokens + completionTokens;

      // Calculate cost (GPT-4o pricing)
      const estimatedCost = (promptTokens / 1_000_000 * 2.50) + (completionTokens / 1_000_000 * 10.00);

      // Create generation log
      await GenerationLog.create({
        userId: session.user.id,
        campaignId: campaign._id,
        agent: 'adyn',
        requestPayload: { projectId, url, objective },
        responsePayload: adynOutput,
        tokensUsed: {
          prompt: promptTokens,
          completion: completionTokens,
          total: totalTokens
        },
        estimatedCost
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
