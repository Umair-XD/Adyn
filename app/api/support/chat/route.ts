import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { message } = await req.json();

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // For now, return a simple response
    // In production, this would connect to the Adyn Support MCP server
    const response = generateSupportResponse(message);

    return NextResponse.json({
      success: true,
      message: response
    });

  } catch (error) {
    console.error('Support chat error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Chat failed';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

function generateSupportResponse(message: string): string {
  const lowerMessage = message.toLowerCase();
  
  if (lowerMessage.includes('analyze') || lowerMessage.includes('generate') || lowerMessage.includes('campaign')) {
    return "This action is done by Adyn. Please use the main workspace to analyze URLs and generate campaigns.";
  }
  
  if (lowerMessage.includes('how') && lowerMessage.includes('work')) {
    return "Adyn analyzes websites by fetching the URL, extracting content, performing semantic analysis, and generating platform-specific ad campaigns. Simply go to a project and click 'Analyze URL' to get started!";
  }
  
  if (lowerMessage.includes('project')) {
    return "Projects help you organize your marketing campaigns. Create a new project from the dashboard, then add URLs to analyze within that project. Each analysis creates a new campaign.";
  }
  
  if (lowerMessage.includes('export')) {
    return "You can export any campaign as JSON by viewing the campaign details and clicking the 'Export JSON' button. This gives you a complete data file you can use in other tools.";
  }
  
  if (lowerMessage.includes('platform')) {
    return "Adyn generates ads for Facebook, Instagram, TikTok, and Google Ads. Each platform gets customized ad copy, headlines, CTAs, and creative descriptions optimized for that platform's best practices.";
  }
  
  return "I'm here to help you use the Adyn platform! You can ask me about features, how to analyze URLs, manage projects, or export campaigns. What would you like to know?";
}
