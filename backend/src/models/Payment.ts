import mongoose, { Document, Schema } from 'mongoose';

export interface IPayment extends Document {
  id: string;
  order_id: string;
  provider: 'paypal' | 'nequi' | 'manual';
  provider_payment_id?: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled' | 'refunded';
  amount_cop: number;
  currency: string;
  raw_response: any;
  confirmed_at?: Date;
  created_at: Date;
  updated_at: Date;
}

const PaymentSchema = new Schema<IPayment>({
  id: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  order_id: {
    type: String,
    required: true,
    index: true
  },
  provider: {
    type: String,
    required: true,
    enum: ['paypal', 'nequi', 'manual']
  },
  provider_payment_id: {
    type: String,
    index: true
  },
  status: {
    type: String,
    required: true,
    enum: ['pending', 'completed', 'failed', 'cancelled', 'refunded'],
    default: 'pending',
    index: true
  },
  amount_cop: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    required: true,
    default: 'COP',
    enum: ['COP', 'USD']
  },
  raw_response: {
    type: Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  },
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
PaymentSchema.index({ provider: 1, status: 1 });
PaymentSchema.index({ confirmed_at: 1 });
PaymentSchema.index({ order_id: 1 }, { unique: true });

export default mongoose.model<IPayment>('Payment', PaymentSchema);
