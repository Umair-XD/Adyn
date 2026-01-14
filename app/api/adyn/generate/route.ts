import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongoose';
import Project from '@/models/Project';
import Source from '@/models/Source';
import CampaignJob from '@/models/CampaignJob';

// Hobby plan limit - return immediately
export const maxDuration = 10;
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { projectId, url, objective, budget, geoTargets } = await req.json();

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

    // Create campaign job for background processing
    const job = await CampaignJob.create({
      userId: session.user.id,
      projectId,
      sourceId: source._id.toString(),
      status: 'pending',
      progress: 0,
      currentStep: 'Queued for processing',
      input: {
        url,
        objective,
        budget: budget || 1000,
        geoTargets: geoTargets || ['US']
      }
    });

    // Trigger background processing (non-blocking)
    // Use fetch to call the worker endpoint without waiting
    const workerUrl = `${req.nextUrl.origin}/api/adyn/generate/worker`;
    
    fetch(workerUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        jobId: job._id.toString(),
        userId: session.user.id 
      })
    }).catch(err => {
      console.error('Failed to trigger worker:', err);
    });

    console.log(`✅ Campaign job created: ${job._id}`);

    // Return immediately with job ID
    return NextResponse.json({
      success: true,
      jobId: job._id.toString(),
      status: 'pending',
      message: 'Campaign generation started. Poll /api/adyn/generate/status for updates.'
    });

  } catch (error) {
    console.error('Campaign job creation error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to start campaign generation';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
