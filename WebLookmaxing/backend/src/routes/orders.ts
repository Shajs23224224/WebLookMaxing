import { Router } from 'express';
import { authenticateToken, requireRole } from '../middleware/auth';
import {
  createOrder,
  getOrders,
  getOrderById,
  updateOrderStatus,
  validate
} from '../controllers/orderController';

const router = Router();

// Public routes (for order creation)
router.post('/', validate('createOrder'), createOrder);

// Authenticated routes
router.get('/', authenticateToken, getOrders);
router.get('/:id', authenticateToken, getOrderById);

// Admin only routes
router.put('/:id/status', authenticateToken, requireRole(['admin']), validate('updateOrderStatus'), updateOrderStatus);

export default router;
