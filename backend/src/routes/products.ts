import { Router } from 'express';
import { authenticateToken, requireRole } from '../middleware/auth';
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  validate
} from '../controllers/productController';

const router = Router();

// Public routes
router.get('/', getProducts);
router.get('/:id', validate('getProduct'), getProductById);

// Admin only routes
router.post('/', authenticateToken, requireRole(['admin']), validate('createProduct'), createProduct);
router.put('/:id', authenticateToken, requireRole(['admin']), validate('updateProduct'), updateProduct);
router.delete('/:id', authenticateToken, requireRole(['admin']), deleteProduct);

export default router;
