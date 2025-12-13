import mongoose, { Schema, Document } from 'mongoose';

export interface IMetaAccount extends Document {
  userId: mongoose.Types.ObjectId;
  accountId: string;
  accountName: string;
  accessToken: string;
  refreshToken?: string;
  expiresAt?: Date;
  currency: string;
  timezoneName: string;
  accountStatus: number;
  permissions: string[];
  pixels: Array<{
    id: string;
    name: string;
    code: string;
    creationTime: Date;
    lastFiredTime?: Date;
  }>;
  isActive: boolean;
  lastSyncAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const MetaAccountSchema = new Schema<IMetaAccount>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  accountId: { type: String, required: true, unique: true },
  accountName: { type: String, required: true },
  accessToken: { type: String, required: true },
  refreshToken: { type: String },
  expiresAt: { type: Date },
  currency: { type: String, required: true },
  timezoneName: { type: String, required: true },
  accountStatus: { type: Number, required: true },
  permissions: [{ type: String }],
  pixels: [{
    id: { type: String, required: true },
    name: { type: String, required: true },
    code: { type: String, required: true },
    creationTime: { type: Date, required: true },
    lastFiredTime: { type: Date }
  }],
  isActive: { type: Boolean, default: true },
  lastSyncAt: { type: Date }
}, {
  timestamps: true
});

// Index for efficient queries
MetaAccountSchema.index({ userId: 1, isActive: 1 });
MetaAccountSchema.index({ accountId: 1 });

export default mongoose.models.MetaAccount || mongoose.model<IMetaAccount>('MetaAccount', MetaAccountSchema);