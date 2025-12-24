import mongoose, { Schema, Document } from 'mongoose';

export interface IMetaAccount extends Document {
  userId: mongoose.Types.ObjectId;
  
  // Business Account Info
  businessId?: string;
  businessName?: string;
  
  // Portfolio Info (if account is in a portfolio)
  portfolioId?: string;
  portfolioName?: string;
  
  // Ad Account Info
  accountId: string;
  accountName: string;
  accessToken: string;
  refreshToken?: string;
  expiresAt?: Date;
  currency: string;
  timezoneName: string;
  accountStatus: number;
  permissions: string[];
  
  // Pixels
  pixels: Array<{
    id: string;
    name: string;
    code: string;
    creationTime: Date;
    lastFiredTime?: Date;
  }>;
  
  // Metadata
  isActive: boolean;
  lastSyncAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const MetaAccountSchema = new Schema<IMetaAccount>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  
  // Business Account Info
  businessId: { type: String },
  businessName: { type: String },
  
  // Portfolio Info
  portfolioId: { type: String },
  portfolioName: { type: String },
  
  // Ad Account Info
  accountId: { type: String, required: true, index: true },
  accountName: { type: String, required: true },
  accessToken: { type: String, required: true },
  refreshToken: { type: String },
  expiresAt: { type: Date },
  currency: { type: String, required: true },
  timezoneName: { type: String, required: true },
  accountStatus: { type: Number, required: true },
  permissions: [{ type: String }],
  
  // Pixels
  pixels: [{
    id: { type: String, required: true },
    name: { type: String, required: true },
    code: { type: String, required: true },
    creationTime: { type: Date, required: true },
    lastFiredTime: { type: Date }
  }],
  
  // Metadata
  isActive: { type: Boolean, default: true },
  lastSyncAt: { type: Date }
}, {
  timestamps: true,
  autoIndex: false
});

// Add compound indexes for efficient queries
MetaAccountSchema.index({ userId: 1, accountId: 1 }, { unique: true });
MetaAccountSchema.index({ userId: 1, isActive: 1 });

export default (mongoose.models.MetaAccount as mongoose.Model<IMetaAccount>) || 
  mongoose.model<IMetaAccount>('MetaAccount', MetaAccountSchema);