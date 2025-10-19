import mongoose, { Document, Schema } from 'mongoose';

export interface IOrderItem {
  product_id: string;
  title: string;
  price_cop: number;
  quantity: number;
  sku: string;
}

export interface IOrder extends Document {
  id: string;
  user_id?: string;
  user_email?: string;
  user_phone?: string;
  items: IOrderItem[];
  subtotal_cop: number;
  tax_cop: number;
  total_cop: number;
  currency: string;
  status: 'pending' | 'paid' | 'cancelled' | 'preparing' | 'shipped' | 'delivered' | 'refunded';
  payment_provider: 'paypal' | 'nequi' | 'manual';
  payment_id?: string;
  payment_status: 'pending' | 'completed' | 'failed' | 'cancelled' | 'refunded';
  shipping_address?: {
    name: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
  };
  notes?: string;
  created_at: Date;
  updated_at: Date;
  paid_at?: Date;
  shipped_at?: Date;
  delivered_at?: Date;
}

const OrderItemSchema = new Schema<IOrderItem>({
  product_id: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  price_cop: {
    type: Number,
    required: true,
    min: 0
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  sku: {
    type: String,
    required: true,
    trim: true
  }
}, { _id: false });

const OrderSchema = new Schema<IOrder>({
  id: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  user_id: {
    type: String,
    index: true
  },
  user_email: {
    type: String,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
  },
  user_phone: {
    type: String,
    trim: true
  },
  items: [OrderItemSchema],
  subtotal_cop: {
    type: Number,
    required: true,
    min: 0
  },
  tax_cop: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  total_cop: {
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
  status: {
    type: String,
    required: true,
    enum: ['pending', 'paid', 'cancelled', 'preparing', 'shipped', 'delivered', 'refunded'],
    default: 'pending',
    index: true
  },
  payment_provider: {
    type: String,
    required: true,
    enum: ['paypal', 'nequi', 'manual']
  },
  payment_id: {
    type: String,
    index: true
  },
  payment_status: {
    type: String,
    required: true,
    enum: ['pending', 'completed', 'failed', 'cancelled', 'refunded'],
    default: 'pending',
    index: true
  },
  shipping_address: {
    name: { type: String, trim: true },
    phone: { type: String, trim: true },
    address: { type: String, trim: true },
    city: { type: String, trim: true },
    state: { type: String, trim: true },
    postal_code: { type: String, trim: true },
    country: { type: String, trim: true, default: 'Colombia' }
  },
  notes: {
    type: String,
    trim: true,
    maxlength: 500
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
OrderSchema.index({ user_email: 1, created_at: -1 });
OrderSchema.index({ payment_provider: 1, payment_status: 1 });
OrderSchema.index({ status: 1, created_at: -1 });

// Virtual for formatted total
OrderSchema.virtual('formatted_total').get(function() {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: this.currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(this.total_cop);
});

export default mongoose.model<IOrder>('Order', OrderSchema);
