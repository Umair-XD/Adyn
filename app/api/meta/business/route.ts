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
    const businessId = searchParams.get('businessId');

    await connectDB();

    if (businessId) {
      // Get specific business structure
      const metaAccount = await MetaAccount.findOne({ 
        userId: session.user.id, 
        businessId,
        isActive: true 
      });

      if (!metaAccount) {
        return NextResponse.json({ error: 'Business account not found' }, { status: 404 });
      }

      const metaClient = new MetaAPIClient(metaAccount.accessToken);
      const businessStructure = await metaClient.getBusinessStructure(businessId);

      return NextResponse.json({ businessStructure });
    } else {
      // Get all business accounts for user
      const metaAccounts = await MetaAccount.find({ 
        userId: session.user.id, 
        isActive: true 
      }).select('-accessToken');

      // Group by business
      const businessGroups = metaAccounts.reduce((groups, account) => {
        const businessKey = account.businessId || 'personal';
        
        if (!groups[businessKey]) {
          groups[businessKey] = {
            businessId: account.businessId,
            businessName: account.businessName || 'Personal Accounts',
            portfolios: {}
          };
        }

        const portfolioKey = account.portfolioId || 'direct';
        if (!groups[businessKey].portfolios[portfolioKey]) {
          groups[businessKey].portfolios[portfolioKey] = {
            portfolioId: account.portfolioId,
            portfolioName: account.portfolioName || 'Direct Ad Accounts',
            accounts: []
          };
        }

        groups[businessKey].portfolios[portfolioKey].accounts.push(account);
        return groups;
      }, {} as Record<string, {
        businessId?: string;
        businessName: string;
        portfolios: Record<string, {
          portfolioId?: string;
          portfolioName: string;
          accounts: typeof metaAccounts;
        }>;
      }>);

      return NextResponse.json({ businessGroups });
    }

  } catch (error) {
    console.error('Meta business error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch business data' },
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

    const { businessId, action } = await req.json();

    if (!businessId || !action) {
      return NextResponse.json({ error: 'Business ID and action required' }, { status: 400 });
    }

    await connectDB();

    const metaAccount = await MetaAccount.findOne({ 
      userId: session.user.id, 
      businessId,
      isActive: true 
    });

    if (!metaAccount) {
      return NextResponse.json({ error: 'Business account not found' }, { status: 404 });
    }

    const metaClient = new MetaAPIClient(metaAccount.accessToken);

    switch (action) {
      case 'sync':
        // Re-sync business structure
        const businessStructure = await metaClient.getBusinessStructure(businessId);
        
        // Update all accounts for this business
        for (const portfolioData of businessStructure.portfolios) {
          for (const account of portfolioData.adAccounts) {
            await MetaAccount.findOneAndUpdate(
              { userId: session.user.id, accountId: account.account_id },
              {
                portfolioId: portfolioData.portfolio.id,
                portfolioName: portfolioData.portfolio.name,
                lastSyncAt: new Date()
              }
            );
          }
        }

        return NextResponse.json({ 
          success: true, 
          message: 'Business structure synced successfully',
          businessStructure 
        });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

  } catch (error) {
    console.error('Meta business action error:', error);
    return NextResponse.json(
      { error: 'Failed to perform business action' },
      { status: 500 }
    );
  }
}