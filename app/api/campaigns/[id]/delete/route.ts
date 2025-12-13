import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongoose';
import Campaign from '@/models/Campaign';
import Project from '@/models/Project';
import Source from '@/models/Source';
import GenerationLog from '@/models/GenerationLog';

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await params;
    await connectDB();

    const campaign = await Campaign.findById(resolvedParams.id);

    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    // Verify ownership
    const project = await Project.findById(campaign.projectId);
    if (project?.userId?.toString() !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Delete related source
    await Source.findByIdAndDelete(campaign.sourceId);

    // Delete related generation logs
    await GenerationLog.deleteMany({ campaignId: resolvedParams.id });

    // Delete the campaign
    await Campaign.findByIdAndDelete(resolvedParams.id);

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Delete campaign error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to delete campaign';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

