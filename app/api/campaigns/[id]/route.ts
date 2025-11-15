import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongoose';
import Campaign from '@/models/Campaign';
import Project from '@/models/Project';
import Source from '@/models/Source';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    await connectDB();

    const campaign = await Campaign.findById(id).lean();

    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    // Verify ownership through project
    const project = await Project.findOne({
      _id: campaign.projectId,
      userId: session.user.id
    }).lean();

    if (!project) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    const source = await Source.findById(campaign.sourceId).lean();

    return NextResponse.json({ 
      campaign: {
        ...campaign,
        id: campaign._id.toString(),
        project: {
          ...project,
          id: project._id.toString()
        },
        source: source ? {
          ...source,
          id: source._id.toString()
        } : null
      }
    });

  } catch (error: any) {
    console.error('Get campaign error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch campaign' },
      { status: 500 }
    );
  }
}
