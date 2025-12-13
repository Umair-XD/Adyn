import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongoose';
import MetaAccount from '@/models/MetaAccount';
import MetaAPIClient from '@/lib/meta-api';
import axios from 'axios';

const META_APP_ID = process.env.META_APP_ID;
const META_APP_SECRET = process.env.META_APP_SECRET;
const REDIRECT_URI = process.env.NEXTAUTH_URL + '/api/meta/callback';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    if (error) {
      return NextResponse.redirect(new URL(`/dashboard?error=meta_auth_failed&reason=${error}`, req.url));
    }

    if (!code || !state) {
      return NextResponse.redirect(new URL('/dashboard?error=meta_auth_failed&reason=missing_params', req.url));
    }

    // Verify state parameter
    let stateData;
    try {
      stateData = JSON.parse(Buffer.from(state, 'base64').toString());
    } catch {
      return NextResponse.redirect(new URL('/dashboard?error=meta_auth_failed&reason=invalid_state', req.url));
    }

    // Check if state is not too old (5 minutes)
    if (Date.now() - stateData.timestamp > 5 * 60 * 1000) {
      return NextResponse.redirect(new URL('/dashboard?error=meta_auth_failed&reason=expired_state', req.url));
    }

    await connectDB();

    // Exchange code for access token
    const tokenResponse = await axios.get('https://graph.facebook.com/v21.0/oauth/access_token', {
      params: {
        client_id: META_APP_ID,
        client_secret: META_APP_SECRET,
        redirect_uri: REDIRECT_URI,
        code
      }
    });

    const { access_token, expires_in } = tokenResponse.data;
    
    // Get long-lived token
    const longLivedTokenResponse = await axios.get('https://graph.facebook.com/v21.0/oauth/access_token', {
      params: {
        grant_type: 'fb_exchange_token',
        client_id: META_APP_ID,
        client_secret: META_APP_SECRET,
        fb_exchange_token: access_token
      }
    });

    const longLivedToken = longLivedTokenResponse.data.access_token;
    const expiresAt = new Date(Date.now() + (longLivedTokenResponse.data.expires_in * 1000));

    // Initialize Meta API client
    const metaClient = new MetaAPIClient(longLivedToken);

    // Get user's ad accounts
    const adAccounts = await metaClient.getAdAccounts();
    
    if (adAccounts.length === 0) {
      return NextResponse.redirect(new URL('/dashboard?error=meta_no_accounts', req.url));
    }

    // For now, use the first ad account (in production, let user choose)
    const primaryAccount = adAccounts[0];

    // Get pixels for the account
    const pixels = await metaClient.getPixels(primaryAccount.account_id);

    // Save or update Meta account
    await MetaAccount.findOneAndUpdate(
      { userId: stateData.userId, accountId: primaryAccount.account_id },
      {
        userId: stateData.userId,
        accountId: primaryAccount.account_id,
        accountName: primaryAccount.name,
        accessToken: longLivedToken,
        expiresAt,
        currency: primaryAccount.currency,
        timezoneName: primaryAccount.timezone_name,
        accountStatus: primaryAccount.account_status,
        permissions: ['ads_management', 'ads_read', 'business_management', 'pages_read_engagement', 'pages_manage_ads'],
        pixels: pixels.map(pixel => ({
          id: pixel.id,
          name: pixel.name,
          code: pixel.code,
          creationTime: new Date(pixel.creation_time),
          lastFiredTime: pixel.last_fired_time ? new Date(pixel.last_fired_time) : undefined
        })),
        isActive: true,
        lastSyncAt: new Date()
      },
      { upsert: true, new: true }
    );

    return NextResponse.redirect(new URL('/dashboard?success=meta_connected', req.url));

  } catch (error) {
    console.error('Meta callback error:', error);
    return NextResponse.redirect(new URL('/dashboard?error=meta_auth_failed&reason=server_error', req.url));
  }
}