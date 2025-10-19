import { Router, Request, Response } from 'express';
import { PayPalService } from '../services/paypal';
import { NequiService } from '../services/nequi';
import Order from '../models/Order';
import Payment from '../models/Payment';
import { logger } from '../utils/logger';

const router = Router();

const paypalSandbox = new PayPalService(true);
const paypalLive = new PayPalService(false);
const nequiSandbox = new NequiService(true);
const nequiLive = new NequiService(false);

// PayPal webhook
router.post('/paypal', async (req: Request, res: Response) => {
  try {
    const signature = req.headers['paypal-transmission-signature'] as string;
    const webhookId = process.env.NODE_ENV === 'production'
      ? process.env.PAYPAL_WEBHOOK_ID_LIVE!
      : process.env.PAYPAL_WEBHOOK_ID_SANDBOX!;

    const paypalService = process.env.NODE_ENV === 'production' ? paypalLive : paypalSandbox;

    // Verify webhook signature
    if (!paypalService.verifyWebhookSignature(req.body, signature, webhookId)) {
      logger.warn('Invalid PayPal webhook signature');
      return res.status(400).json({ error: 'Invalid signature' });
    }

    const { event_type, resource } = req.body;

    logger.info('PayPal webhook received:', { event_type, resource_id: resource?.id });

    switch (event_type) {
      case 'PAYMENT.CAPTURE.COMPLETED':
        await handlePayPalPaymentCompleted(resource);
        break;
      case 'PAYMENT.CAPTURE.DENIED':
        await handlePayPalPaymentFailed(resource);
        break;
      default:
        logger.info('Unhandled PayPal webhook event:', event_type);
    }

    res.status(200).json({ received: true });
  } catch (error) {
    logger.error('Error processing PayPal webhook:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// Nequi webhook
router.post('/nequi', async (req: Request, res: Response) => {
  try {
    const signature = req.headers['x-nequi-signature'] as string;
    const timestamp = req.headers['x-nequi-timestamp'] as string;

    const nequiService = process.env.NODE_ENV === 'production' ? nequiLive : nequiSandbox;

    // Verify webhook signature
    if (!nequiService.verifyWebhookSignature(req.body, signature, timestamp)) {
      logger.warn('Invalid Nequi webhook signature');
      return res.status(400).json({ error: 'Invalid signature' });
    }

    const { eventType, paymentId, status } = req.body;

    logger.info('Nequi webhook received:', { eventType, paymentId, status });

    switch (eventType) {
      case 'PAYMENT_COMPLETED':
        await handleNequiPaymentCompleted(paymentId, req.body);
        break;
      case 'PAYMENT_FAILED':
        await handleNequiPaymentFailed(paymentId, req.body);
        break;
      default:
        logger.info('Unhandled Nequi webhook event:', eventType);
    }

    res.status(200).json({ received: true });
  } catch (error) {
    logger.error('Error processing Nequi webhook:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

async function handlePayPalPaymentCompleted(resource: any) {
  const orderId = resource.id;

  const payment = await Payment.findOne({ provider_payment_id: orderId });

  if (payment && payment.status === 'pending') {
    // Update payment status
    await Payment.findOneAndUpdate(
      { id: payment.id },
      {
        status: 'completed',
        raw_response: resource,
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

    logger.info('PayPal payment completed:', {
      orderId: payment.order_id,
      paymentId: payment.id
    });
  }
}

async function handlePayPalPaymentFailed(resource: any) {
  const orderId = resource.id;

  const payment = await Payment.findOne({ provider_payment_id: orderId });

  if (payment) {
    // Update payment status
    await Payment.findOneAndUpdate(
      { id: payment.id },
      {
        status: 'failed',
        raw_response: resource
      }
    );

    // Update order status
    await Order.findOneAndUpdate(
      { id: payment.order_id },
      {
        status: 'cancelled',
        payment_status: 'failed'
      }
    );

    logger.info('PayPal payment failed:', {
      orderId: payment.order_id,
      paymentId: payment.id
    });
  }
}

async function handleNequiPaymentCompleted(paymentId: string, webhookData: any) {
  const payment = await Payment.findOne({ provider_payment_id: paymentId });

  if (payment && payment.status === 'pending') {
    // Update payment status
    await Payment.findOneAndUpdate(
      { id: payment.id },
      {
        status: 'completed',
        raw_response: webhookData,
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

    logger.info('Nequi payment completed:', {
      orderId: payment.order_id,
      paymentId: payment.id
    });
  }
}

async function handleNequiPaymentFailed(paymentId: string, webhookData: any) {
  const payment = await Payment.findOne({ provider_payment_id: paymentId });

  if (payment) {
    // Update payment status
    await Payment.findOneAndUpdate(
      { id: payment.id },
      {
        status: 'failed',
        raw_response: webhookData
      }
    );

    // Update order status
    await Order.findOneAndUpdate(
      { id: payment.order_id },
      {
        status: 'cancelled',
        payment_status: 'failed'
      }
    );

    logger.info('Nequi payment failed:', {
      orderId: payment.order_id,
      paymentId: payment.id
    });
  }
}

export default router;
