import { Response } from 'express';
import { body, validationResult } from 'express-validator';
import Order from '../models/Order';
import Product from '../models/Product';
import { logger } from '../utils/logger';
import { generateOrderId, calculateTax } from '../utils/helpers';
import { AuthRequest } from '../middleware/auth';

export const createOrder = async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { items, user_email, user_phone, payment_method, shipping_address, notes } = req.body;

    // Validate items
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Items array is required and cannot be empty' });
    }

    // Get product details and validate inventory
    let subtotal_cop = 0;
    const validatedItems = [];

    for (const item of items) {
      const product = await Product.findOne({ id: item.product_id, active: true });

      if (!product) {
        return res.status(400).json({ error: `Product ${item.product_id} not found or inactive` });
      }

      if (product.inventory !== null && product.inventory < item.quantity) {
        return res.status(400).json({ error: `Insufficient inventory for product ${product.title}` });
      }

      subtotal_cop += product.price_cop * item.quantity;

      validatedItems.push({
        product_id: product.id,
        title: product.title,
        price_cop: product.price_cop,
        quantity: item.quantity,
        sku: product.sku
      });
    }

    // Calculate tax and total
    const tax_cop = calculateTax(subtotal_cop);
    const total_cop = subtotal_cop + tax_cop;

    // Create order
    const orderData = {
      id: generateOrderId(),
      user_id: req.user?.userId,
      user_email,
      user_phone,
      items: validatedItems,
      subtotal_cop,
      tax_cop,
      total_cop,
      currency: 'COP',
      status: 'pending',
      payment_provider: payment_method,
      payment_status: 'pending',
      shipping_address,
      notes
    };

    const order = new Order(orderData);
    await order.save();

    // Update inventory if applicable
    for (const item of validatedItems) {
      if (item.quantity > 0) {
        await Product.findOneAndUpdate(
          { id: item.product_id },
          { $inc: { inventory: -item.quantity } }
        );
      }
    }

    logger.info('Order created:', {
      orderId: order.id,
      userId: req.user?.userId,
      total: total_cop
    });

    res.status(201).json({
      orderId: order.id,
      total_cop,
      currency: order.currency,
      status: order.status
    });
  } catch (error) {
    logger.error('Error creating order:', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
};

export const getOrders = async (req: AuthRequest, res: Response) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      payment_status,
      user_id,
      start_date,
      end_date
    } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    // Build query
    const query: any = {};

    // If not admin, only show user's orders
    if (req.user?.role !== 'admin') {
      query.user_id = req.user?.userId;
    } else if (user_id) {
      query.user_id = user_id;
    }

    if (status) {
      query.status = status;
    }

    if (payment_status) {
      query.payment_status = payment_status;
    }

    if (start_date || end_date) {
      query.created_at = {};
      if (start_date) query.created_at.$gte = new Date(start_date as string);
      if (end_date) query.created_at.$lte = new Date(end_date as string);
    }

    const orders = await Order.find(query)
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean();

    const total = await Order.countDocuments(query);

    res.json({
      orders,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    logger.error('Error fetching orders:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
};

export const getOrderById = async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const order = await Order.findOne({ id: req.params.id });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Check permissions
    if (req.user?.role !== 'admin' && order.user_id !== req.user?.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(order);
  } catch (error) {
    logger.error('Error fetching order:', error);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
};

export const updateOrderStatus = async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Only admins can update order status
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { status, notes } = req.body;

    const order = await Order.findOneAndUpdate(
      { id: req.params.id },
      {
        status,
        notes,
        updated_at: new Date()
      },
      { new: true, runValidators: true }
    );

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    logger.info('Order status updated:', {
      orderId: order.id,
      oldStatus: order.status,
      newStatus: status
    });

    res.json(order);
  } catch (error) {
    logger.error('Error updating order status:', error);
    res.status(500).json({ error: 'Failed to update order status' });
  }
};

// Validation rules
export const validate = (method: string) => {
  switch (method) {
    case 'createOrder':
      return [
        body('items').isArray({ min: 1 }).withMessage('Items array is required and cannot be empty'),
        body('items.*.product_id').isLength({ min: 1 }).withMessage('Product ID is required'),
        body('items.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
        body('payment_method').isIn(['paypal', 'nequi', 'manual']).withMessage('Invalid payment method'),
        body('user_email').optional().isEmail().withMessage('Valid email is required'),
        body('user_phone').optional().isMobilePhone('es-CO').withMessage('Valid phone number is required')
      ];
    case 'updateOrderStatus':
      return [
        body('status').isIn(['pending', 'paid', 'cancelled', 'preparing', 'shipped', 'delivered', 'refunded']).withMessage('Invalid status')
      ];
    default:
      return [];
  }
};
