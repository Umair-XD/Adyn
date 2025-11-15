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
      const html = JSON.parse(fetchResult.content[0].text).html;

      console.log('Extracting content...');
      const extractResult = await mcpManager.callTool('adyn', 'extract_content', { html });
      const extracted = JSON.parse(extractResult.content[0].text);

      console.log('Analyzing content...');
      const textContent = extracted.text_blocks.join(' ');
      const analyzeResult = await mcpManager.callTool('adyn', 'semantic_analyze', { text: textContent });
      const analysis = JSON.parse(analyzeResult.content[0].text);

      console.log('Generating ads...');
      const adsResult = await mcpManager.callTool('adyn', 'generate_ads', {
        summary: analysis.summary,
        brand_tone: analysis.brand_tone,
        persona: analysis.audience_persona,
        keywords: analysis.keywords,
        platforms: ['facebook', 'instagram', 'tiktok', 'google']
      });
      const adsData = JSON.parse(adsResult.content[0].text);

      console.log('Building audience...');
      const audienceResult = await mcpManager.callTool('adyn', 'audience_builder', {
        persona: analysis.audience_persona,
        keywords: analysis.keywords,
        category: analysis.category
      });
      const audience = JSON.parse(audienceResult.content[0].text);

      console.log('Building campaign...');
      const campaignResult = await mcpManager.callTool('adyn', 'campaign_builder', {
        ads: adsData.ads,
        audience: audience,
        objective: objective || 'Conversions'
      });
      const strategy = JSON.parse(campaignResult.content[0].text);

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

      // Save campaign
      const campaign = await Campaign.create({
        projectId,
        sourceId: source._id,
        name: strategy.campaign_name,
        objective: strategy.objective,
        platforms: strategy.platform_mix,
        generationResult: adynOutput
      });

      // Update source status
      await Source.findByIdAndUpdate(source._id, { status: 'completed' });

      // Create generation log
      await GenerationLog.create({
        userId: session.user.id,
        agent: 'adyn',
        requestPayload: { projectId, url, objective },
        responsePayload: adynOutput
      });

      return NextResponse.json({
        success: true,
        campaignId: campaign._id.toString(),
        data: adynOutput
      });

    } catch (error: any) {
      // Update source status to failed
      await Source.findByIdAndUpdate(source._id, { status: 'failed' });

      throw error;
    }

  } catch (error: any) {
    console.error('Generation error:', error);
    return NextResponse.json(
      { error: error.message || 'Generation failed' },
      { status: 500 }
    );
  }
}
