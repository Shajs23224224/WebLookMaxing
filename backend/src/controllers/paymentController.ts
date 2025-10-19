import { Response } from 'express';
import { body, param, validationResult } from 'express-validator';
import Order from '../models/Order';
import Payment from '../models/Payment';
import { PayPalService } from '../services/paypal';
import { NequiService } from '../services/nequi';
import { logger } from '../utils/logger';
import { generatePaymentId } from '../utils/helpers';
import { AuthRequest } from '../middleware/auth';

const paypalSandbox = new PayPalService(true);
const paypalLive = new PayPalService(false);
const nequiSandbox = new NequiService(true);
const nequiLive = new NequiService(false);

export const createPayPalPayment = async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { order_id, return_url, cancel_url } = req.body;

    // Get order details
    const order = await Order.findOne({ id: order_id });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (order.status !== 'pending') {
      return res.status(400).json({ error: 'Order is not in pending status' });
    }

    // Check permissions
    if (req.user?.role !== 'admin' && order.user_id !== req.user?.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Use sandbox or live based on environment
    const paypalService = process.env.NODE_ENV === 'production' ? paypalLive : paypalSandbox;

    const paymentData = await paypalService.createOrder({
      amount: order.total_cop,
      currency: order.currency,
      description: `Lookmaxing - Order ${order.id}`,
      orderId: order.id,
      returnUrl: return_url || `${process.env.FRONTEND_URL}/payment/success`,
      cancelUrl: cancel_url || `${process.env.FRONTEND_URL}/payment/cancel`
    });

    // Create payment record
    const payment = new Payment({
      id: generatePaymentId(),
      order_id: order.id,
      provider: 'paypal',
      provider_payment_id: paymentData.orderID,
      status: 'pending',
      amount_cop: order.total_cop,
      currency: order.currency
    });

    await payment.save();

    // Update order payment ID
    await Order.findOneAndUpdate(
      { id: order_id },
      { payment_id: payment.id }
    );

    logger.info('PayPal payment created:', {
      orderId: order.id,
      paymentId: payment.id,
      paypalOrderId: paymentData.orderID
    });

    res.json({
      orderID: paymentData.orderID,
      approvalUrl: paymentData.approvalUrl
    });
  } catch (error) {
    logger.error('Error creating PayPal payment:', error);
    res.status(500).json({ error: 'Failed to create PayPal payment' });
  }
};

export const createNequiPayment = async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { order_id, phone, return_url } = req.body;

    // Get order details
    const order = await Order.findOne({ id: order_id });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (order.status !== 'pending') {
      return res.status(400).json({ error: 'Order is not in pending status' });
    }

    // Check permissions
    if (req.user?.role !== 'admin' && order.user_id !== req.user?.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Use sandbox or live based on environment
    const nequiService = process.env.NODE_ENV === 'production' ? nequiLive : nequiSandbox;

    const paymentData = await nequiService.createPaymentRequest({
      amount: order.total_cop,
      phone,
      reference: order.id,
      description: `Lookmaxing - Order ${order.id}`,
      returnUrl: return_url || `${process.env.FRONTEND_URL}/payment/success`
    });

    // Create payment record
    const payment = new Payment({
      id: generatePaymentId(),
      order_id: order.id,
      provider: 'nequi',
      provider_payment_id: paymentData.paymentId,
      status: 'pending',
      amount_cop: order.total_cop,
      currency: order.currency
    });

    await payment.save();

    // Update order payment ID
    await Order.findOneAndUpdate(
      { id: order_id },
      { payment_id: payment.id }
    );

    logger.info('Nequi payment created:', {
      orderId: order.id,
      paymentId: payment.id,
      nequiPaymentId: paymentData.paymentId
    });

    res.json({
      paymentId: paymentData.paymentId,
      qrImage: paymentData.qrImage,
      redirectUrl: paymentData.redirectUrl
    });
  } catch (error) {
    logger.error('Error creating Nequi payment:', error);
    res.status(500).json({ error: 'Failed to create Nequi payment' });
  }
};

export const capturePayPalPayment = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { orderId } = req.params;

    // Use sandbox or live based on environment
    const paypalService = process.env.NODE_ENV === 'production' ? paypalLive : paypalSandbox;

    const captureData = await paypalService.captureOrder(orderId);

    if (captureData.status === 'COMPLETED') {
      // Find payment and order
      const payment = await Payment.findOne({ provider_payment_id: orderId });

      if (payment) {
        // Update payment status
        await Payment.findOneAndUpdate(
          { id: payment.id },
          {
            status: 'completed',
            raw_response: captureData,
            confirmed_at: new Date()
          }
        );

        // Update order status
        await Order.findOneAndUpdate(
          { id: payment.order_id },
          {
            status: 'paid',
            payment_status: 'completed',
            paid_at: new Date()
          }
        );

        logger.info('PayPal payment captured:', {
          orderId: payment.order_id,
          paymentId: payment.id,
          paypalOrderId: orderId
        });
      }
    }

    res.json(captureData);
  } catch (error) {
    logger.error('Error capturing PayPal payment:', error);
    res.status(500).json({ error: 'Failed to capture PayPal payment' });
  }
};

export const refundPayment = async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Only admins can refund payments
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { payment_id, amount } = req.body;

    const payment = await Payment.findOne({ id: payment_id });

    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    let refundResult;

    if (payment.provider === 'paypal') {
      const paypalService = process.env.NODE_ENV === 'production' ? paypalLive : paypalSandbox;
      refundResult = await paypalService.refundOrder(payment.provider_payment_id!, amount);
    } else if (payment.provider === 'nequi') {
      const nequiService = process.env.NODE_ENV === 'production' ? nequiLive : nequiSandbox;
      refundResult = await nequiService.refundPayment(payment.provider_payment_id!, amount);
    } else {
      return res.status(400).json({ error: 'Refund not supported for this payment provider' });
    }

    // Update payment status
    await Payment.findOneAndUpdate(
      { id: payment_id },
      {
        status: 'refunded',
        raw_response: refundResult
      }
    );

    // Update order status
    await Order.findOneAndUpdate(
      { id: payment.order_id },
      { status: 'refunded' }
    );

    logger.info('Payment refunded:', {
      paymentId: payment.id,
      orderId: payment.order_id,
      provider: payment.provider
    });

    res.json(refundResult);
  } catch (error) {
    logger.error('Error refunding payment:', error);
    res.status(500).json({ error: 'Failed to refund payment' });
  }
};

// Validation rules
export const validate = (method: string) => {
  switch (method) {
    case 'createPayPalPayment':
      return [
        body('order_id').isLength({ min: 1 }).withMessage('Order ID is required'),
        body('return_url').optional().isURL().withMessage('Valid return URL is required'),
        body('cancel_url').optional().isURL().withMessage('Valid cancel URL is required')
      ];
    case 'createNequiPayment':
      return [
        body('order_id').isLength({ min: 1 }).withMessage('Order ID is required'),
        body('phone').isMobilePhone('es-CO').withMessage('Valid Colombian phone number is required'),
        body('return_url').optional().isURL().withMessage('Valid return URL is required')
      ];
    case 'capturePayPalPayment':
      return [
        param('orderId').isLength({ min: 1 }).withMessage('PayPal order ID is required')
      ];
    case 'refundPayment':
      return [
        body('payment_id').isLength({ min: 1 }).withMessage('Payment ID is required'),
        body('amount').optional().isNumeric().withMessage('Amount must be a number')
      ];
    default:
      return [];
  }
};
