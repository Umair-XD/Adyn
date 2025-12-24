import { NextRequest, NextResponse } from 'next/server';
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
    console.log('Exchanging code for access token...');
    const tokenResponse = await axios.get('https://graph.facebook.com/v21.0/oauth/access_token', {
      params: {
        client_id: META_APP_ID,
        client_secret: META_APP_SECRET,
        redirect_uri: REDIRECT_URI,
        code
      }
    });

    const { access_token } = tokenResponse.data;
    console.log('Got access token, exchanging for long-lived token...');
    
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
    console.log('Got long-lived token, initializing Meta client...');

    // Initialize Meta API client
    const metaClient = new MetaAPIClient(longLivedToken);

    // Get user's business accounts first
    console.log('Fetching business accounts...');
    const businessAccounts = await metaClient.getBusinessAccounts();
    
    if (businessAccounts.length === 0) {
      // Fallback to personal ad accounts if no business accounts
      const adAccounts = await metaClient.getAdAccounts();
      
      if (adAccounts.length === 0) {
        return NextResponse.redirect(new URL('/dashboard?error=meta_no_accounts', req.url));
      }

      // Save personal ad accounts (no business/portfolio structure)
      for (const account of adAccounts) {
        const pixels = await metaClient.getPixels(account.account_id);
        
        await MetaAccount.findOneAndUpdate(
          { userId: stateData.userId, accountId: account.account_id },
          {
            userId: stateData.userId,
            accountId: account.account_id,
            accountName: account.name,
            accessToken: longLivedToken,
            expiresAt,
            currency: account.currency,
            timezoneName: account.timezone_name,
            accountStatus: account.account_status,
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
      }
    } else {
      // Handle business accounts with portfolios
      for (const business of businessAccounts) {
        const businessStructure = await metaClient.getBusinessStructure(business.id);
        
        // Save portfolio ad accounts
        for (const portfolioData of businessStructure.portfolios) {
          for (const account of portfolioData.adAccounts) {
            const pixels = await metaClient.getPixels(account.account_id);
            
            await MetaAccount.findOneAndUpdate(
              { userId: stateData.userId, accountId: account.account_id },
              {
                userId: stateData.userId,
                businessId: business.id,
                businessName: business.name,
                portfolioId: portfolioData.portfolio.id,
                portfolioName: portfolioData.portfolio.name,
                accountId: account.account_id,
                accountName: account.name,
                accessToken: longLivedToken,
                expiresAt,
                currency: account.currency,
                timezoneName: account.timezone_name,
                accountStatus: account.account_status,
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
          }
        }
        
        // Save direct ad accounts (not in portfolios)
        for (const account of businessStructure.directAdAccounts) {
          const pixels = await metaClient.getPixels(account.account_id);
          
          await MetaAccount.findOneAndUpdate(
            { userId: stateData.userId, accountId: account.account_id },
            {
              userId: stateData.userId,
              businessId: business.id,
              businessName: business.name,
              accountId: account.account_id,
              accountName: account.name,
              accessToken: longLivedToken,
              expiresAt,
              currency: account.currency,
              timezoneName: account.timezone_name,
              accountStatus: account.account_status,
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
        }
      }
    }

    return NextResponse.redirect(new URL('/dashboard?success=meta_connected', req.url));

  } catch (error) {
    console.error('Meta callback error:', error);
    
    // Log more specific error details
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    
    // Check if it's an axios error with response data
    if (error && typeof error === 'object' && 'response' in error) {
      const axiosError = error as { response?: { data?: unknown; status?: number } };
      console.error('API Response Error:', axiosError.response?.data);
      console.error('API Response Status:', axiosError.response?.status);
    }
    
    return NextResponse.redirect(new URL('/dashboard?error=meta_auth_failed&reason=server_error', req.url));
  }
}