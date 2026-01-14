import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { syncEnhancedMetaData, getCachedEnhancedData } from '../lib/meta-data-sync';
import CampaignSuccessAnalyzer from '../lib/campaign-success-analyzer';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function testEnhancedSync() {
  try {
    console.log('🚀 Testing Enhanced Meta Data Sync\n');

    // Connect to database
    await mongoose.connect(process.env.DATABASE_URL!);
    console.log('✅ Connected to MongoDB\n');

    // Import models
    const { default: User } = await import('../models/User');
    const { default: MetaAccount } = await import('../models/MetaAccount');

    // Find first user with Meta account
    const user = await User.findOne({});
    if (!user) {
      console.log('❌ No users found');
      process.exit(1);
    }

    const metaAccount = await MetaAccount.findOne({
      userId: user._id,
      isActive: true
    });

    if (!metaAccount) {
      console.log('❌ No active Meta account found');
      process.exit(1);
    }

    console.log(`📊 User: ${user.email || user._id}`);
    console.log(`📊 Meta Account: ${metaAccount.accountId}\n`);

    // Test 1: Run Enhanced Sync
    console.log('='.repeat(60));
    console.log('TEST 1: Enhanced Data Sync');
    console.log('='.repeat(60));

    const startTime = Date.now();

    await syncEnhancedMetaData({
      userId: user._id.toString(),
      metaAccountId: metaAccount.accountId,
      businessId: metaAccount.businessId || '',
      accessToken: metaAccount.accessToken,
      timePeriod: 'last_90_days',
      forceRefresh: true,
      includeHistoricalAnalysis: true
    });

    const syncDuration = Date.now() - startTime;
    console.log(`\n✅ Sync completed in ${(syncDuration / 1000).toFixed(2)}s\n`);

    // Test 2: Get Cached Data
    console.log('='.repeat(60));
    console.log('TEST 2: Retrieve Cached Enhanced Data');
    console.log('='.repeat(60));

    const cachedData = await getCachedEnhancedData(
      user._id.toString(),
      metaAccount.accountId
    );

    console.log('\n📦 Cached Data Summary:');
    console.log(`   - Has Enhanced Data: ${cachedData.hasEnhancedData}`);
    console.log(`   - Is Stale: ${cachedData.isStale}`);
    console.log(`   - Last Updated: ${cachedData.lastUpdated}`);
    console.log(`   - Campaigns: ${(cachedData.data.campaigns as unknown[])?.length || 0}`);
    console.log(`   - Ad Sets: ${(cachedData.data.adsets as unknown[])?.length || 0}`);
    console.log(`   - Ads: ${(cachedData.data.ads as unknown[])?.length || 0}`);
    console.log(`   - Insights: ${(cachedData.data.insights as unknown[])?.length || 0}`);

    if (cachedData.hasEnhancedData) {
      const successMetrics = (cachedData.data as { campaignSuccessMetrics?: unknown[] }).campaignSuccessMetrics || [];
      const winningPatterns = (cachedData.data as { winningPatterns?: unknown[] }).winningPatterns || [];
      const topCreatives = (cachedData.data as { topPerformingCreatives?: unknown[] }).topPerformingCreatives || [];

      console.log(`   - Success Metrics: ${successMetrics.length}`);
      console.log(`   - Winning Patterns: ${winningPatterns.length}`);
      console.log(`   - Top Creatives: ${topCreatives.length}`);
    }

    // Test 3: Get Success Insights
    console.log('\n' + '='.repeat(60));
    console.log('TEST 3: Campaign Success Insights');
    console.log('='.repeat(60));

    const insights = await CampaignSuccessAnalyzer.getSuccessInsights(
      user._id.toString(),
      metaAccount.accountId
    );

    console.log('\n📈 Overall Performance:');
    console.log(`   - Average ROAS: ${insights.overallPerformance.avgROAS.toFixed(2)}x`);
    console.log(`   - Average CTR: ${insights.overallPerformance.avgCTR.toFixed(2)}%`);
    console.log(`   - Average Conversion Rate: ${insights.overallPerformance.avgConversionRate.toFixed(2)}%`);
    console.log(`   - Total Spend: $${insights.overallPerformance.totalSpend.toFixed(2)}`);
    console.log(`   - Total Revenue: $${insights.overallPerformance.totalRevenue.toFixed(2)}`);
    console.log(`   - Total Conversions: ${insights.overallPerformance.totalConversions}`);
    console.log(`   - Account Maturity: ${insights.overallPerformance.accountMaturity}`);

    if (insights.topPerformingCampaigns.length > 0) {
      console.log('\n🏆 Top Performing Campaigns:');
      insights.topPerformingCampaigns.forEach((campaign, idx) => {
        console.log(`\n   ${idx + 1}. ${campaign.campaignName}`);
        console.log(`      - Success Score: ${campaign.successScore.toFixed(1)}/100`);
        console.log(`      - ROAS: ${campaign.roas.toFixed(2)}x`);
        console.log(`      - CTR: ${campaign.ctr.toFixed(2)}%`);
        console.log(`      - Spend: $${campaign.spend.toFixed(2)}`);
      });
    }

    if (insights.winningPatterns.length > 0) {
      console.log('\n🎯 Winning Patterns:');
      insights.winningPatterns.forEach((pattern, idx) => {
        console.log(`\n   ${idx + 1}. ${pattern.pattern}`);
        console.log(`      - Impact: ${pattern.impact}`);
        console.log(`      - Recommendation: ${pattern.recommendation}`);
      });
    }

    if (insights.recommendations.length > 0) {
      console.log('\n💡 Recommendations:');
      insights.recommendations.forEach((rec, idx) => {
        console.log(`\n   ${idx + 1}. [${rec.priority.toUpperCase()}] ${rec.title}`);
        console.log(`      - Type: ${rec.type}`);
        console.log(`      - ${rec.description}`);
        console.log(`      - Expected Impact: ${rec.expectedImpact}`);
        console.log(`      - Based On: ${rec.basedOn}`);
      });
    }

    // Test 4: Historical Trends
    console.log('\n' + '='.repeat(60));
    console.log('TEST 4: Historical Trends (Last 6 Months)');
    console.log('='.repeat(60));

    const trends = await CampaignSuccessAnalyzer.getHistoricalTrends(
      user._id.toString(),
      metaAccount.accountId,
      6
    );

    if (trends.trends.length > 0) {
      console.log('\n📊 Monthly Trends:');
      trends.trends.forEach(trend => {
        console.log(`\n   ${trend.month}:`);
        console.log(`      - Spend: $${trend.spend.toFixed(2)}`);
        console.log(`      - Revenue: $${trend.revenue.toFixed(2)}`);
        console.log(`      - ROAS: ${trend.roas.toFixed(2)}x`);
        console.log(`      - Conversions: ${trend.conversions}`);
      });

      console.log('\n📈 Growth Metrics:');
      console.log(`   - Spend Growth: ${trends.growth.spendGrowth.toFixed(1)}%`);
      console.log(`   - Revenue Growth: ${trends.growth.revenueGrowth.toFixed(1)}%`);
      console.log(`   - ROAS Growth: ${trends.growth.roasGrowth.toFixed(1)}%`);
    } else {
      console.log('\n⚠️  No historical trend data available yet');
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ All tests completed successfully!');
    console.log('='.repeat(60));

    // Close database connection
    await mongoose.connection.close();

  } catch (error) {
    console.error('\n❌ Test failed:', error);
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
    process.exit(1);
  }
}

testEnhancedSync();
