import mongoose, { Schema, Document } from 'mongoose';

export interface IGenerationLog extends Document {
  userId: mongoose.Types.ObjectId;
  agent: string;
  requestPayload: any;
  responsePayload: any;
  createdAt: Date;
}

const GenerationLogSchema = new Schema<IGenerationLog>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  agent: { type: String, required: true },
  requestPayload: { type: Schema.Types.Mixed },
  responsePayload: { type: Schema.Types.Mixed },
}, {
  timestamps: { createdAt: true, updatedAt: false },
});

export default mongoose.models.GenerationLog || mongoose.model<IGenerationLog>('GenerationLog', GenerationLogSchema);
