import { Router } from 'express';
import { authenticateToken, requireRole } from '../middleware/auth';
import {
  createPayPalPayment,
  createNequiPayment,
  capturePayPalPayment,
  refundPayment,
  validate
} from '../controllers/paymentController';

const router = Router();

// Public routes (for payment creation)
router.post('/paypal/create', validate('createPayPalPayment'), createPayPalPayment);
router.post('/nequi/create', validate('createNequiPayment'), createNequiPayment);

// PayPal specific routes
router.post('/paypal/capture/:orderId', validate('capturePayPalPayment'), capturePayPalPayment);

// Admin only routes
router.post('/refund', authenticateToken, requireRole(['admin']), validate('refundPayment'), refundPayment);

export default router;
