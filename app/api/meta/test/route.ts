import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

const META_APP_ID = process.env.META_APP_ID;
const META_APP_SECRET = process.env.META_APP_SECRET;

export async function GET(req: NextRequest) {
  try {
    // Test if we can get an app access token
    const response = await axios.get('https://graph.facebook.com/oauth/access_token', {
      params: {
        client_id: META_APP_ID,
        client_secret: META_APP_SECRET,
        grant_type: 'client_credentials'
      }
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Meta API credentials are working',
      appId: META_APP_ID,
      hasAppToken: !!response.data.access_token
    });

  } catch (error: unknown) {
    const axiosError = error as { response?: { data?: unknown; status?: number }; message?: string };
    
    return NextResponse.json({ 
      success: false, 
      error: 'Meta API credentials test failed',
      details: axiosError.response?.data || axiosError.message,
      status: axiosError.response?.status
    }, { status: 500 });
  }
}