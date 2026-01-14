import mongoose, { Schema, Document } from 'mongoose';

export interface IHistoricalInsights extends Document {
  userId: mongoose.Types.ObjectId;
  accountId?: string;
  metaAccountId?: string;
  campaignId?: string;
  adsetId?: string;
  adId?: string;
  level?: 'campaign' | 'adset' | 'ad' | 'account';
  
  // Performance Metrics
  impressions?: number;
  clicks?: number;
  spend?: number;
  cpm?: number;
  cpc?: number;
  ctr?: number;
  reach?: number;
  frequency?: number;
  
  // Conversion Metrics
  actions?: Array<{
    action_type: string;
    value: string;
  }>;
  conversions?: number;
  conversionValues?: number;
  costPerActionType?: Record<string, number>;
  
  // Campaign Details
  objective?: string;
  optimizationGoal?: string;
  campaignName?: string;
  adsetName?: string;
  adName?: string;
  
  // Targeting Information
  targeting?: {
    age_min?: number;
    age_max?: number;
    genders?: number[];
    geo_locations?: Record<string, unknown>;
    interests?: Array<{ id: string; name: string }>;
    behaviors?: Array<{ id: string; name: string }>;
    custom_audiences?: string[];
    lookalike_audiences?: string[];
  };
  
  // Creative Information
  creative?: {
    title?: string;
    body?: string;
    call_to_action_type?: string;
    image_hash?: string;
    video_id?: string;
    thumbnail_url?: string;
  };
  
  // Time Period
  dateStart: Date;
  dateEnd: Date;
  
  // Analysis Tags
  productCategory?: string;
  productKeywords?: string[];
  performanceScore?: number; // 0-100 calculated score
  
  // ENHANCED: Aggregated Campaign Metrics
  campaignMetrics?: Array<{
    campaignId: string;
    campaignName: string;
    objective: string;
    totalSpend: number;
    totalRevenue: number;
    roas: number;
    conversions: number;
    conversionRate: number;
    ctr: number;
    cpc: number;
    cpm: number;
    reach: number;
    impressions: number;
    clicks: number;
    frequency: number;
    successScore: number;
    performanceRating: 'excellent' | 'good' | 'average' | 'poor';
    learningPhase: 'learning' | 'active' | 'mature';
    dateRange: {
      start: Date;
      end: Date;
    };
  }>;
  
  // ENHANCED: Winning Patterns
  winningPatterns?: Array<{
    patternType: 'targeting' | 'creative' | 'placement' | 'timing' | 'budget';
    description: string;
    successRate: number;
    avgROAS: number;
    avgCTR: number;
    sampleSize: number;
    recommendations: string[];
  }>;
  
  // ENHANCED: Aggregated Account Metrics
  aggregatedMetrics?: {
    totalSpend: number;
    totalRevenue: number;
    avgROAS: number;
    avgCTR: number;
    totalConversions: number;
  };
  
  // Metadata
  lastUpdated: Date;
  createdAt: Date;
}

const HistoricalInsightsSchema = new Schema<IHistoricalInsights>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  accountId: { type: String },
  metaAccountId: { type: String },
  campaignId: { type: String },
  adsetId: { type: String },
  adId: { type: String },
  level: { type: String, enum: ['campaign', 'adset', 'ad', 'account'] },
  
  // Performance Metrics
  impressions: { type: Number, default: 0 },
  clicks: { type: Number, default: 0 },
  spend: { type: Number, default: 0 },
  cpm: { type: Number, default: 0 },
  cpc: { type: Number, default: 0 },
  ctr: { type: Number, default: 0 },
  reach: { type: Number, default: 0 },
  frequency: { type: Number, default: 0 },
  
  // Conversion Metrics
  actions: [{
    action_type: String,
    value: String
  }],
  conversions: { type: Number, default: 0 },
  conversionValues: { type: Number, default: 0 },
  costPerActionType: { type: Map, of: Number },
  
  // Campaign Details
  objective: String,
  optimizationGoal: String,
  campaignName: String,
  adsetName: String,
  adName: String,
  
  // Targeting Information
  targeting: {
    age_min: Number,
    age_max: Number,
    genders: [Number],
    geo_locations: Schema.Types.Mixed,
    interests: [{
      id: String,
      name: String
    }],
    behaviors: [{
      id: String,
      name: String
    }],
    custom_audiences: [String],
    lookalike_audiences: [String]
  },
  
  // Creative Information
  creative: {
    title: String,
    body: String,
    call_to_action_type: String,
    image_hash: String,
    video_id: String,
    thumbnail_url: String
  },
  
  // Time Period
  dateStart: { type: Date, required: true },
  dateEnd: { type: Date, required: true },
  
  // Analysis Tags
  productCategory: String,
  productKeywords: [String],
  performanceScore: { type: Number, min: 0, max: 100 },
  
  // ENHANCED: Aggregated Campaign Metrics
  campaignMetrics: [{
    campaignId: String,
    campaignName: String,
    objective: String,
    totalSpend: Number,
    totalRevenue: Number,
    roas: Number,
    conversions: Number,
    conversionRate: Number,
    ctr: Number,
    cpc: Number,
    cpm: Number,
    reach: Number,
    impressions: Number,
    clicks: Number,
    frequency: Number,
    successScore: Number,
    performanceRating: {
      type: String,
      enum: ['excellent', 'good', 'average', 'poor']
    },
    learningPhase: {
      type: String,
      enum: ['learning', 'active', 'mature']
    },
    dateRange: {
      start: Date,
      end: Date
    }
  }],
  
  // ENHANCED: Winning Patterns
  winningPatterns: [{
    patternType: {
      type: String,
      enum: ['targeting', 'creative', 'placement', 'timing', 'budget']
    },
    description: String,
    successRate: Number,
    avgROAS: Number,
    avgCTR: Number,
    sampleSize: Number,
    recommendations: [String]
  }],
  
  // ENHANCED: Aggregated Account Metrics
  aggregatedMetrics: {
    totalSpend: Number,
    totalRevenue: Number,
    avgROAS: Number,
    avgCTR: Number,
    totalConversions: Number
  },
  
  // Metadata
  lastUpdated: { type: Date, default: Date.now }
}, {
  timestamps: true
});

// Indexes for efficient queries - avoid accountId to prevent conflicts
HistoricalInsightsSchema.index({ userId: 1, metaAccountId: 1 });
HistoricalInsightsSchema.index({ userId: 1, campaignId: 1 });
HistoricalInsightsSchema.index({ userId: 1, productCategory: 1 });
HistoricalInsightsSchema.index({ userId: 1, performanceScore: -1 });
HistoricalInsightsSchema.index({ campaignId: 1 });
HistoricalInsightsSchema.index({ adsetId: 1 });
HistoricalInsightsSchema.index({ adId: 1 });
HistoricalInsightsSchema.index({ dateStart: 1, dateEnd: 1 });
HistoricalInsightsSchema.index({ 'aggregatedMetrics.avgROAS': -1 });
HistoricalInsightsSchema.index({ 'aggregatedMetrics.totalRevenue': -1 });

export default mongoose.models.HistoricalInsights || mongoose.model<IHistoricalInsights>('HistoricalInsights', HistoricalInsightsSchema);