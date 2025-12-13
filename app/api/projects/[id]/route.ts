import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongoose';
import Project from '@/models/Project';
import Source from '@/models/Source';
import Campaign from '@/models/Campaign';

interface DocWithId {
  _id: { toString: () => string };
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    await connectDB();

    const project = await Project.findOne({
      _id: id,
      userId: session.user.id
    }).lean();

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const sources = await Source.find({ projectId: id })
      .sort({ createdAt: -1 })
      .lean();

    const campaigns = await Campaign.find({ projectId: id })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ 
      project: {
        ...project,
        id: (project as DocWithId)._id.toString(),
        sources: sources.map(s => ({ ...s, id: (s as DocWithId)._id.toString() })),
        campaigns: campaigns.map(c => ({ ...c, id: (c as DocWithId)._id.toString() }))
      }
    });

  } catch (error) {
    console.error('Get project error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch project';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const { name, description } = await req.json();

    await connectDB();

    const project = await Project.findOneAndUpdate(
      { _id: id, userId: session.user.id },
      { name, description },
      { new: true }
    );

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Update project error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to update project';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    const project = await Project.findOneAndDelete({
      _id: id,
      userId: session.user.id
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Delete related sources and campaigns
    await Source.deleteMany({ projectId: id });
    await Campaign.deleteMany({ projectId: id });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Delete project error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to delete project';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
