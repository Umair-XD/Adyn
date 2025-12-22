import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongoose';
import MetaAccount from '@/models/MetaAccount';
import MetaAPIClient from '@/lib/meta-api';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const accountId = searchParams.get('accountId');
    const pixelId = searchParams.get('pixelId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (!accountId) {
      return NextResponse.json({ error: 'Account ID required' }, { status: 400 });
    }

    await connectDB();

    // Get Meta account
    const metaAccount = await MetaAccount.findOne({ 
      userId: session.user.id, 
      accountId,
      isActive: true 
    });

    if (!metaAccount) {
      return NextResponse.json({ error: 'Meta account not found' }, { status: 404 });
    }

    const metaClient = new MetaAPIClient(metaAccount.accessToken);

    if (pixelId) {
      // Get pixel events data
      try {
        // Try to get pixel insights first (more detailed)
        const pixelEvents = await metaClient.getPixelInsights(pixelId, startDate || undefined, endDate || undefined);
        
        return NextResponse.json({ 
          pixelId,
          events: pixelEvents,
          dateRange: { startDate, endDate },
          source: 'insights'
        });
      } catch (error) {
        console.error('Failed to get pixel insights, trying events endpoint:', error);
        
        try {
          // Fallback to basic events
          const pixelEvents = await metaClient.getPixelEvents(pixelId, startDate || undefined, endDate || undefined);
          
          return NextResponse.json({ 
            pixelId,
            events: pixelEvents,
            dateRange: { startDate, endDate },
            source: 'events'
          });
        } catch (fallbackError) {
          console.error('Both pixel endpoints failed:', fallbackError);
          
          return NextResponse.json({ 
            pixelId,
            events: [],
            dateRange: { startDate, endDate },
            error: 'Unable to fetch pixel data. This may be due to insufficient permissions or no recent pixel activity.',
            source: 'none'
          });
        }
      }
    } else {
      // Get all pixels for the account
      const pixels = await metaClient.getPixels(accountId);
      
      // Update stored pixels
      await MetaAccount.findOneAndUpdate(
        { userId: session.user.id, accountId },
        { 
          pixels: pixels.map(pixel => ({
            id: pixel.id,
            name: pixel.name,
            code: pixel.code,
            creationTime: new Date(pixel.creation_time),
            lastFiredTime: pixel.last_fired_time ? new Date(pixel.last_fired_time) : undefined
          })),
          lastSyncAt: new Date()
        }
      );

      return NextResponse.json({ pixels });
    }

  } catch (error) {
    console.error('Meta pixels error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pixel data' },
      { status: 500 }
    );
  }
}