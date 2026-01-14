import MetaAccountCache from '@/models/MetaAccountCache';
import HistoricalInsights from '@/models/HistoricalInsights';
import connectDB from './mongoose';

/**
 * CAMPAIGN SUCCESS ANALYZER
 * 
 * Provides insights and recommendations based on historical campaign performance
 */

export interface CampaignRecommendation {
  type: 'targeting' | 'budget' | 'creative' | 'placement' | 'timing';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  expectedImpact: string;
  basedOn: string;
}

export interface SuccessInsights {
  overallPerformance: {
    avgROAS: number;
    avgCTR: number;
    avgConversionRate: number;
    totalSpend: number;
    totalRevenue: number;
    totalConversions: number;
    accountMaturity: 'early_stage' | 'growing' | 'mature' | 'expert';
  };
  topPerformingCampaigns: Array<{
    campaignId: string;
    campaignName: string;
    successScore: number;
    roas: number;
    ctr: number;
    spend: number;
  }>;
  winningPatterns: Array<{
    pattern: string;
    impact: string;
    recommendation: string;
  }>;
  recommendations: CampaignRecommendation[];
}

export class CampaignSuccessAnalyzer {
  /**
   * Get comprehensive success insights for a user's Meta account
   */
  static async getSuccessInsights(
    userId: string,
    metaAccountId: string
  ): Promise<SuccessInsights> {
    await connectDB();

    // Get cached data with enhanced metrics
    const cache = await MetaAccountCache.findOne({
      userId,
      metaAccountId,
      isComplete: true
    });

    if (!cache) {
      throw new Error('No cached data available. Please sync first.');
    }

    const campaignMetrics = (cache as { campaignSuccessMetrics?: unknown[] }).campaignSuccessMetrics || [];
    const winningPatterns = (cache as { winningPatterns?: unknown[] }).winningPatterns || [];

    // Calculate overall performance
    const overallPerformance = this.calculateOverallPerformance(campaignMetrics);

    // Get top performing campaigns
    const topPerformingCampaigns = this.getTopPerformingCampaigns(campaignMetrics, 5);

    // Format winning patterns
    const formattedPatterns = this.formatWinningPatterns(winningPatterns);

    // Generate recommendations
    const recommendations = this.generateRecommendations(
      overallPerformance,
      campaignMetrics,
      winningPatterns
    );

    return {
      overallPerformance,
      topPerformingCampaigns,
      winningPatterns: formattedPatterns,
      recommendations
    };
  }

  /**
   * Calculate overall account performance
   */
  private static calculateOverallPerformance(metrics: unknown[]): SuccessInsights['overallPerformance'] {
    if (metrics.length === 0) {
      return {
        avgROAS: 0,
        avgCTR: 0,
        avgConversionRate: 0,
        totalSpend: 0,
        totalRevenue: 0,
        totalConversions: 0,
        accountMaturity: 'early_stage'
      };
    }

    const totals = metrics.reduce((acc: {
      roas: number;
      ctr: number;
      conversionRate: number;
      spend: number;
      revenue: number;
      conversions: number;
    }, m: unknown) => {
      const metric = m as {
        roas: number;
        ctr: number;
        conversionRate: number;
        totalSpend: number;
        totalRevenue: number;
        conversions: number;
      };
      return {
        roas: acc.roas + metric.roas,
        ctr: acc.ctr + metric.ctr,
        conversionRate: acc.conversionRate + metric.conversionRate,
        spend: acc.spend + metric.totalSpend,
        revenue: acc.revenue + metric.totalRevenue,
        conversions: acc.conversions + metric.conversions
      };
    }, { roas: 0, ctr: 0, conversionRate: 0, spend: 0, revenue: 0, conversions: 0 });

    const avgROAS = totals.roas / metrics.length;
    const avgCTR = totals.ctr / metrics.length;
    const avgConversionRate = totals.conversionRate / metrics.length;

    // Determine account maturity
    let accountMaturity: 'early_stage' | 'growing' | 'mature' | 'expert';
    if (totals.spend < 1000 || totals.conversions < 100) {
      accountMaturity = 'early_stage';
    } else if (totals.spend < 10000 || totals.conversions < 1000) {
      accountMaturity = 'growing';
    } else if (totals.spend < 50000 || totals.conversions < 5000) {
      accountMaturity = 'mature';
    } else {
      accountMaturity = 'expert';
    }

    return {
      avgROAS,
      avgCTR,
      avgConversionRate,
      totalSpend: totals.spend,
      totalRevenue: totals.revenue,
      totalConversions: totals.conversions,
      accountMaturity
    };
  }

  /**
   * Get top performing campaigns
   */
  private static getTopPerformingCampaigns(
    metrics: unknown[],
    limit: number
  ): SuccessInsights['topPerformingCampaigns'] {
    return (metrics as Array<{
      campaignId: string;
      campaignName: string;
      successScore: number;
      roas: number;
      ctr: number;
      totalSpend: number;
    }>)
      .sort((a, b) => b.successScore - a.successScore)
      .slice(0, limit)
      .map(m => ({
        campaignId: m.campaignId,
        campaignName: m.campaignName,
        successScore: m.successScore,
        roas: m.roas,
        ctr: m.ctr,
        spend: m.totalSpend
      }));
  }

  /**
   * Format winning patterns
   */
  private static formatWinningPatterns(patterns: unknown[]): SuccessInsights['winningPatterns'] {
    return (patterns as Array<{
      description: string;
      avgROAS: number;
      avgCTR: number;
      recommendations: string[];
    }>).map(p => ({
      pattern: p.description,
      impact: `ROAS: ${p.avgROAS.toFixed(2)}x, CTR: ${p.avgCTR.toFixed(2)}%`,
      recommendation: p.recommendations[0] || 'Apply this pattern to new campaigns'
    }));
  }

  /**
   * Generate actionable recommendations
   */
  private static generateRecommendations(
    overallPerformance: SuccessInsights['overallPerformance'],
    campaignMetrics: unknown[],
    winningPatterns: unknown[]
  ): CampaignRecommendation[] {
    const recommendations: CampaignRecommendation[] = [];

    // Budget recommendations
    if (overallPerformance.avgROAS > 3) {
      recommendations.push({
        type: 'budget',
        priority: 'high',
        title: 'Scale Your Budget',
        description: `Your average ROAS of ${overallPerformance.avgROAS.toFixed(2)}x is excellent. Consider increasing your budget by 50-100% to maximize returns.`,
        expectedImpact: 'Potential revenue increase of 50-100%',
        basedOn: `${campaignMetrics.length} campaigns with strong ROAS`
      });
    } else if (overallPerformance.avgROAS < 1.5) {
      recommendations.push({
        type: 'budget',
        priority: 'high',
        title: 'Optimize Before Scaling',
        description: `Your average ROAS of ${overallPerformance.avgROAS.toFixed(2)}x needs improvement. Focus on optimization before increasing budget.`,
        expectedImpact: 'Reduce wasted spend by 30-50%',
        basedOn: 'Low ROAS across campaigns'
      });
    }

    // CTR recommendations
    if (overallPerformance.avgCTR < 1.0) {
      recommendations.push({
        type: 'creative',
        priority: 'high',
        title: 'Improve Ad Creatives',
        description: `Your average CTR of ${overallPerformance.avgCTR.toFixed(2)}% is below industry standards. Test new ad creatives with stronger hooks and clearer CTAs.`,
        expectedImpact: 'Potential CTR increase of 50-100%',
        basedOn: 'Low CTR across campaigns'
      });
    }

    // Winning pattern recommendations
    if (winningPatterns.length > 0) {
      const topPattern = winningPatterns[0] as {
        patternType: string;
        description: string;
        avgROAS: number;
        recommendations: string[];
      };
      recommendations.push({
        type: topPattern.patternType as 'targeting' | 'budget' | 'creative' | 'placement' | 'timing',
        priority: 'high',
        title: 'Apply Winning Pattern',
        description: topPattern.description,
        expectedImpact: `ROAS improvement to ${topPattern.avgROAS.toFixed(2)}x`,
        basedOn: topPattern.recommendations[0] || 'Historical performance data'
      });
    }

    // Account maturity recommendations
    if (overallPerformance.accountMaturity === 'early_stage') {
      recommendations.push({
        type: 'targeting',
        priority: 'medium',
        title: 'Build Conversion History',
        description: 'Your account is in the learning phase. Focus on generating at least 50 conversions per week to train Meta\'s algorithm.',
        expectedImpact: 'Better ad delivery and lower costs',
        basedOn: 'Account maturity analysis'
      });
    }

    // Conversion rate recommendations
    if (overallPerformance.avgConversionRate < 2.0) {
      recommendations.push({
        type: 'targeting',
        priority: 'medium',
        title: 'Refine Audience Targeting',
        description: `Your conversion rate of ${overallPerformance.avgConversionRate.toFixed(2)}% suggests targeting improvements needed. Consider narrowing your audience or using lookalike audiences.`,
        expectedImpact: 'Conversion rate increase of 50-100%',
        basedOn: 'Low conversion rate analysis'
      });
    }

    return recommendations.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }

  /**
   * Get historical trend analysis
   */
  static async getHistoricalTrends(
    userId: string,
    metaAccountId: string,
    months: number = 6
  ): Promise<{
    trends: Array<{
      month: string;
      spend: number;
      revenue: number;
      roas: number;
      conversions: number;
    }>;
    growth: {
      spendGrowth: number;
      revenueGrowth: number;
      roasGrowth: number;
    };
  }> {
    await connectDB();

    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    const historicalData = await HistoricalInsights.find({
      userId,
      metaAccountId,
      dateStart: { $gte: startDate },
      level: 'account'
    }).sort({ dateStart: 1 });

    // Group by month
    const monthlyData = new Map<string, {
      spend: number;
      revenue: number;
      conversions: number;
    }>();

    for (const record of historicalData) {
      const month = record.dateStart.toISOString().substring(0, 7); // YYYY-MM
      const existing = monthlyData.get(month) || { spend: 0, revenue: 0, conversions: 0 };
      
      const aggregated = (record as { aggregatedMetrics?: {
        totalSpend: number;
        totalRevenue: number;
        totalConversions: number;
      } }).aggregatedMetrics;

      if (aggregated) {
        existing.spend += aggregated.totalSpend;
        existing.revenue += aggregated.totalRevenue;
        existing.conversions += aggregated.totalConversions;
        monthlyData.set(month, existing);
      }
    }

    const trends = Array.from(monthlyData.entries()).map(([month, data]) => ({
      month,
      spend: data.spend,
      revenue: data.revenue,
      roas: data.spend > 0 ? data.revenue / data.spend : 0,
      conversions: data.conversions
    }));

    // Calculate growth
    let growth = { spendGrowth: 0, revenueGrowth: 0, roasGrowth: 0 };
    if (trends.length >= 2) {
      const first = trends[0];
      const last = trends[trends.length - 1];
      
      growth = {
        spendGrowth: first.spend > 0 ? ((last.spend - first.spend) / first.spend) * 100 : 0,
        revenueGrowth: first.revenue > 0 ? ((last.revenue - first.revenue) / first.revenue) * 100 : 0,
        roasGrowth: first.roas > 0 ? ((last.roas - first.roas) / first.roas) * 100 : 0
      };
    }

    return { trends, growth };
  }
}

export default CampaignSuccessAnalyzer;
