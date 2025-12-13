import mongoose, { Schema, Document } from 'mongoose';

export interface ISource extends Document {
  projectId: mongoose.Types.ObjectId;
  type: string;
  inputUrl?: string;
  rawInput?: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

const SourceSchema = new Schema<ISource>({
  projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
  type: { type: String, required: true },
  inputUrl: { type: String },
  rawInput: { type: String },
  status: { type: String, default: 'pending' },
}, {
  timestamps: true,
});

export default mongoose.models.Source || mongoose.model<ISource>('Source', SourceSchema);
