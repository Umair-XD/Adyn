import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const META_APP_ID = process.env.META_APP_ID;
const META_APP_SECRET = process.env.META_APP_SECRET;
const REDIRECT_URI = process.env.NEXTAUTH_URL + '/api/meta/callback';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!META_APP_ID) {
      return NextResponse.json({ error: 'Meta App ID not configured' }, { status: 500 });
    }

    // Generate state parameter for security
    const state = Buffer.from(JSON.stringify({ 
      userId: session.user.id,
      timestamp: Date.now()
    })).toString('base64');

    // Meta OAuth URL with required permissions
    const permissions = [
      'ads_management',
      'ads_read',
      'business_management',
      'pages_read_engagement',
      'pages_manage_ads'
    ].join(',');

    const authUrl = new URL('https://www.facebook.com/v21.0/dialog/oauth');
    authUrl.searchParams.set('client_id', META_APP_ID);
    authUrl.searchParams.set('redirect_uri', REDIRECT_URI);
    authUrl.searchParams.set('scope', permissions);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('state', state);

    return NextResponse.json({ 
      authUrl: authUrl.toString(),
      state 
    });

  } catch (error) {
    console.error('Meta connect error:', error);
    return NextResponse.json(
      { error: 'Failed to generate Meta auth URL' },
      { status: 500 }
    );
  }
}