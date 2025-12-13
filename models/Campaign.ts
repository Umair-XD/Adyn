import mongoose, { Schema, Document } from 'mongoose';

export interface ICampaign extends Document {
  projectId: mongoose.Types.ObjectId;
  sourceId: mongoose.Types.ObjectId;
  name: string;
  objective?: string;
  platforms: string[];
  generationResult: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const CampaignSchema = new Schema<ICampaign>({
  projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
  sourceId: { type: Schema.Types.ObjectId, ref: 'Source', required: true },
  name: { type: String, required: true },
  objective: { type: String },
  platforms: [{ type: String }],
  generationResult: { type: Schema.Types.Mixed },
}, {
  timestamps: true,
});

export default mongoose.models.Campaign || mongoose.model<ICampaign>('Campaign', CampaignSchema);
