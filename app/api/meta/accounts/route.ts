import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongoose';
import MetaAccount from '@/models/MetaAccount';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function GET(_req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    // Get user's Meta accounts
    const metaAccounts = await MetaAccount.find({ 
      userId: session.user.id, 
      isActive: true 
    }).select('-accessToken');

    return NextResponse.json({ accounts: metaAccounts });

  } catch (error) {
    console.error('Meta accounts error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Meta accounts' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const accountId = searchParams.get('accountId');

    if (!accountId) {
      return NextResponse.json({ error: 'Account ID required' }, { status: 400 });
    }

    await connectDB();

    // Deactivate the Meta account
    await MetaAccount.findOneAndUpdate(
      { userId: session.user.id, accountId },
      { isActive: false }
    );

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Meta account disconnect error:', error);
    return NextResponse.json(
      { error: 'Failed to disconnect Meta account' },
      { status: 500 }
    );
  }
}