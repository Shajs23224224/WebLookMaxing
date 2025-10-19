import { Request, Response } from 'express';
import { body, param, validationResult } from 'express-validator';
import Product from '../models/Product';
import { logger } from '../utils/logger';

export const getProducts = async (req: Request, res: Response) => {
  try {
    const {
      page = 1,
      limit = 10,
      category,
      search,
      minPrice,
      maxPrice,
      sort = 'created_at',
      order = 'desc'
    } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    // Build query
    const query: any = { active: true };

    if (search) {
      query.$text = { $search: search as string };
    }

    if (minPrice || maxPrice) {
      query.price_cop = {};
      if (minPrice) query.price_cop.$gte = parseInt(minPrice as string, 10);
      if (maxPrice) query.price_cop.$lte = parseInt(maxPrice as string, 10);
    }

    // Build sort object
    const sortObj: any = {};
    sortObj[sort as string] = order === 'desc' ? -1 : 1;

    const products = await Product.find(query)
      .sort(sortObj)
      .skip(skip)
      .limit(limitNum)
      .lean();

    const total = await Product.countDocuments(query);

    res.json({
      products,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    logger.error('Error fetching products:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
};

export const getProductById = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const product = await Product.findOne({
      id: req.params.id,
      active: true
    }).lean();

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json(product);
  } catch (error) {
    logger.error('Error fetching product:', error);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
};

export const createProduct = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const productData = req.body;

    // Generate slug from title if not provided
    if (!productData.slug) {
      productData.slug = productData.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
    }

    const product = new Product(productData);
    await product.save();

    logger.info('Product created:', { productId: product.id });
    res.status(201).json(product);
  } catch (error) {
    logger.error('Error creating product:', error);
    if (error.code === 11000) {
      res.status(400).json({ error: 'Product with this ID or SKU already exists' });
    } else {
      res.status(500).json({ error: 'Failed to create product' });
    }
  }
};

export const updateProduct = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const product = await Product.findOneAndUpdate(
      { id: req.params.id },
      req.body,
      { new: true, runValidators: true }
    );

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    logger.info('Product updated:', { productId: product.id });
    res.json(product);
  } catch (error) {
    logger.error('Error updating product:', error);
    if (error.code === 11000) {
      res.status(400).json({ error: 'Product with this SKU already exists' });
    } else {
      res.status(500).json({ error: 'Failed to update product' });
    }
  }
};

export const deleteProduct = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const product = await Product.findOneAndUpdate(
      { id: req.params.id },
      { active: false },
      { new: true }
    );

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    logger.info('Product deleted:', { productId: product.id });
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    logger.error('Error deleting product:', error);
    res.status(500).json({ error: 'Failed to delete product' });
  }
};

// Validation rules
export const validate = (method: string) => {
  switch (method) {
    case 'createProduct':
      return [
        body('title').isLength({ min: 1, max: 200 }).withMessage('Title is required and must be less than 200 characters'),
        body('description').isLength({ min: 1, max: 2000 }).withMessage('Description is required and must be less than 2000 characters'),
        body('price_cop').isInt({ min: 0 }).withMessage('Price must be a positive integer'),
        body('duration_days').isInt({ min: 1 }).withMessage('Duration must be at least 1 day'),
        body('sku').isLength({ min: 1, max: 50 }).withMessage('SKU is required and must be less than 50 characters'),
        body('features').optional().isArray().withMessage('Features must be an array'),
        body('images').optional().isArray().withMessage('Images must be an array')
      ];
    case 'updateProduct':
      return [
        body('title').optional().isLength({ min: 1, max: 200 }).withMessage('Title must be less than 200 characters'),
        body('description').optional().isLength({ min: 1, max: 2000 }).withMessage('Description must be less than 2000 characters'),
        body('price_cop').optional().isInt({ min: 0 }).withMessage('Price must be a positive integer'),
        body('duration_days').optional().isInt({ min: 1 }).withMessage('Duration must be at least 1 day'),
        body('sku').optional().isLength({ min: 1, max: 50 }).withMessage('SKU must be less than 50 characters'),
        body('features').optional().isArray().withMessage('Features must be an array'),
        body('images').optional().isArray().withMessage('Images must be an array')
      ];
    case 'getProduct':
      return [
        param('id').isLength({ min: 1 }).withMessage('Product ID is required')
      ];
    default:
      return [];
  }
};
