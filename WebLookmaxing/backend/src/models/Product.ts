import mongoose, { Document, Schema } from 'mongoose';

export interface IProduct extends Document {
  id: string;
  title: string;
  slug: string;
  description: string;
  features: string[];
  price_cop: number;
  duration_days: number;
  images: string[];
  inventory?: number;
  sku: string;
  active: boolean;
  created_at: Date;
  updated_at: Date;
}

const ProductSchema = new Schema<IProduct>({
  id: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 2000
  },
  features: [{
    type: String,
    trim: true
  }],
  price_cop: {
    type: Number,
    required: true,
    min: 0
  },
  duration_days: {
    type: Number,
    required: true,
    min: 1
  },
  images: [{
    type: String,
    trim: true
  }],
  inventory: {
    type: Number,
    min: 0,
    default: null
  },
  sku: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true
  },
  active: {
    type: Boolean,
    default: true,
    index: true
  }
}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  },
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for formatted price
ProductSchema.virtual('formatted_price').get(function() {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(this.price_cop);
});

// Index for text search
ProductSchema.index({
  title: 'text',
  description: 'text',
  features: 'text'
});

export default mongoose.model<IProduct>('Product', ProductSchema);
