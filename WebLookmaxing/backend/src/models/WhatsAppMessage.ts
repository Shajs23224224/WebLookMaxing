import mongoose, { Document, Schema } from 'mongoose';

export interface IWhatsAppMessage extends Document {
  messageId: string; // Twilio message SID
  from: string; // Business phone number
  to: string; // Customer phone number
  message: string;
  type: 'text' | 'image' | 'document' | 'audio' | 'video';
  mediaUrl?: string;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  timestamp: Date;
  userId?: mongoose.Types.ObjectId; // Reference to user if logged in
  orderId?: mongoose.Types.ObjectId; // Reference to order if related
  metadata?: {
    campaignId?: string;
    templateId?: string;
    userAgent?: string;
    ipAddress?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const WhatsAppMessageSchema = new Schema<IWhatsAppMessage>({
  messageId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  from: {
    type: String,
    required: true,
    index: true,
  },
  to: {
    type: String,
    required: true,
    index: true,
  },
  message: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ['text', 'image', 'document', 'audio', 'video'],
    default: 'text',
  },
  mediaUrl: {
    type: String,
  },
  status: {
    type: String,
    enum: ['sent', 'delivered', 'read', 'failed'],
    default: 'sent',
    index: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true,
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    index: true,
  },
  orderId: {
    type: Schema.Types.ObjectId,
    ref: 'Order',
    index: true,
  },
  metadata: {
    campaignId: String,
    templateId: String,
    userAgent: String,
    ipAddress: String,
  },
}, {
  timestamps: true,
});

// Indexes for performance
WhatsAppMessageSchema.index({ createdAt: -1 });
WhatsAppMessageSchema.index({ userId: 1, createdAt: -1 });
WhatsAppMessageSchema.index({ to: 1, createdAt: -1 });
WhatsAppMessageSchema.index({ status: 1, createdAt: -1 });

export const WhatsAppMessage = mongoose.model<IWhatsAppMessage>('WhatsAppMessage', WhatsAppMessageSchema);
