import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongoose';
import Project from '@/models/Project';
import Campaign from '@/models/Campaign';
import Source from '@/models/Source';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const projects = await Project.find({ userId: session.user.id })
      .sort({ createdAt: -1 })
      .lean();

    // Get counts for each project
    const projectsWithCounts = await Promise.all(
      projects.map(async (project) => {
        const campaignCount = await Campaign.countDocuments({ projectId: project._id });
        const sourceCount = await Source.countDocuments({ projectId: project._id });
        
        return {
          ...project,
          id: project._id.toString(),
          _count: {
            campaigns: campaignCount,
            sources: sourceCount
          }
        };
      })
    );

    return NextResponse.json({ projects: projectsWithCounts });

  } catch (error: any) {
    console.error('Get projects error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch projects' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, description } = await req.json();

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    await connectDB();

    const project = await Project.create({
      userId: session.user.id,
      name,
      description: description || ''
    });

    return NextResponse.json({ 
      success: true, 
      project: {
        ...project.toObject(),
        id: project._id.toString()
      }
    });

  } catch (error: any) {
    console.error('Create project error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create project' },
      { status: 500 }
    );
  }
}
