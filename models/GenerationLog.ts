import mongoose, { Schema, Document } from 'mongoose';

export interface IGenerationLog extends Document {
  userId: mongoose.Types.ObjectId;
  campaignId?: mongoose.Types.ObjectId;
  agent: string;
  requestPayload: Record<string, unknown>;
  responsePayload: Record<string, unknown>;
  tokensUsed?: {
    prompt: number;
    completion: number;
    total: number;
  };
  moduleUsage?: Array<{
    module: string;
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
    reasoningTokens: number;
    cachedInputTokens: number;
    cost: number;
    callCount: number;
  }>;
  estimatedCost?: number;
  createdAt: Date;
}

const GenerationLogSchema = new Schema<IGenerationLog>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  campaignId: { type: Schema.Types.ObjectId, ref: 'Campaign' },
  agent: { type: String, required: true },
  requestPayload: { type: Schema.Types.Mixed },
  responsePayload: { type: Schema.Types.Mixed },
  tokensUsed: {
    prompt: { type: Number },
    completion: { type: Number },
    total: { type: Number }
  },
  moduleUsage: [{
    module: { type: String, required: true },
    inputTokens: { type: Number, required: true },
    outputTokens: { type: Number, required: true },
    totalTokens: { type: Number, required: true },
    reasoningTokens: { type: Number, default: 0 },
    cachedInputTokens: { type: Number, default: 0 },
    cost: { type: Number, required: true },
    callCount: { type: Number, required: true }
  }],
  estimatedCost: { type: Number },
}, {
  timestamps: { createdAt: true, updatedAt: false },
});

export default mongoose.models.GenerationLog || mongoose.model<IGenerationLog>('GenerationLog', GenerationLogSchema);
