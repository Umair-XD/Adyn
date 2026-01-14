import mongoose, { Schema, Document } from 'mongoose';

export interface ICampaignJob extends Document {
  userId: string;
  projectId: string;
  sourceId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number; // 0-100
  currentStep: string;
  input: {
    url: string;
    objective: string;
    budget: number;
    geoTargets: string[];
  };
  result?: any;
  error?: string;
  campaignId?: string;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

const CampaignJobSchema = new Schema<ICampaignJob>({
  userId: { type: String, required: true, index: true },
  projectId: { type: String, required: true, index: true },
  sourceId: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending',
    index: true
  },
  progress: { type: Number, default: 0 },
  currentStep: { type: String, default: 'Initializing...' },
  input: {
    url: { type: String, required: true },
    objective: { type: String, required: true },
    budget: { type: Number, required: true },
    geoTargets: [{ type: String }]
  },
  result: { type: Schema.Types.Mixed },
  error: { type: String },
  campaignId: { type: String },
  completedAt: { type: Date }
}, {
  timestamps: true
});

// Index for efficient polling queries
CampaignJobSchema.index({ userId: 1, status: 1, createdAt: -1 });

export default mongoose.models.CampaignJob || mongoose.model<ICampaignJob>('CampaignJob', CampaignJobSchema);
