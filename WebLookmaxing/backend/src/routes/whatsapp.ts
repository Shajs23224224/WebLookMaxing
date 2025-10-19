import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { whatsAppService } from '../services/whatsapp';
import { WhatsAppMessage } from '../../models/WhatsAppMessage';
import { logger } from '../utils/logger';

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     SendWhatsAppRequest:
 *       type: object
 *       required:
 *         - to
 *         - message
 *       properties:
 *         to:
 *           type: string
 *           description: Phone number to send message to (with country code)
 *           example: "+573123161080"
 *         message:
 *           type: string
 *           description: Message content
 *           example: "Hola! Gracias por contactarnos."
 *         mediaUrl:
 *           type: string
 *           description: URL of media to send (optional)
 *           example: "https://example.com/image.jpg"
 *         userId:
 *           type: string
 *           description: User ID if message is related to a specific user
 *         orderId:
 *           type: string
 *           description: Order ID if message is related to a specific order
 */

/**
 * @swagger
 * /api/whatsapp/send:
 *   post:
 *     summary: Send WhatsApp message
 *     description: Send a WhatsApp message to a customer
 *     tags: [WhatsApp]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SendWhatsAppRequest'
 *     responses:
 *       200:
 *         description: Message sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Message sent successfully"
 *                 data:
 *                   $ref: '#/components/schemas/WhatsAppMessage'
 *       400:
 *         description: Validation error or bad request
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.post('/send', [
  body('to').isMobilePhone().withMessage('Valid phone number is required'),
  body('message').isLength({ min: 1, max: 4096 }).withMessage('Message must be between 1 and 4096 characters'),
  body('mediaUrl').optional().isURL().withMessage('Media URL must be a valid URL'),
], async (req: Request, res: Response) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array(),
      });
    }

    const { to, message, mediaUrl, userId, orderId } = req.body;

    // Send WhatsApp message
    const result = await whatsAppService.sendMessage(to, message, mediaUrl);

    // Save message to database
    const savedMessage = new WhatsAppMessage({
      messageId: result.id!,
      from: result.from,
      to: result.to,
      message: result.message,
      type: result.type,
      mediaUrl: result.mediaUrl,
      status: result.status,
      timestamp: result.timestamp,
      userId,
      orderId,
    });

    await savedMessage.save();

    logger.info('WhatsApp message saved to database', {
      messageId: savedMessage._id,
      to,
      type: result.type,
    });

    res.json({
      success: true,
      message: 'Message sent successfully',
      data: {
        ...result,
        databaseId: savedMessage._id,
      },
    });
  } catch (error) {
    logger.error('WhatsApp send endpoint error', { error, body: req.body });

    res.status(500).json({
      success: false,
      error: 'Failed to send WhatsApp message',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * @swagger
 * /api/whatsapp/templates/welcome:
 *   post:
 *     summary: Send welcome message
 *     description: Send a welcome message to a new customer
 *     tags: [WhatsApp]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - to
 *             properties:
 *               to:
 *                 type: string
 *                 description: Customer phone number
 *                 example: "+573123161080"
 *               customerName:
 *                 type: string
 *                 description: Customer name (optional)
 *                 example: "María"
 *     responses:
 *       200:
 *         description: Welcome message sent successfully
 *       400:
 *         description: Invalid phone number
 *       500:
 *         description: Internal server error
 */
router.post('/templates/welcome', [
  body('to').isMobilePhone().withMessage('Valid phone number is required'),
  body('customerName').optional().isLength({ min: 1 }).withMessage('Customer name cannot be empty'),
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array(),
      });
    }

    const { to, customerName } = req.body;

    const result = await whatsAppService.sendWelcomeMessage(to, customerName);

    // Save to database
    const savedMessage = new WhatsAppMessage({
      messageId: result.id!,
      from: result.from,
      to: result.to,
      message: result.message,
      type: result.type,
      status: result.status,
      timestamp: result.timestamp,
      metadata: {
        templateId: 'welcome_message',
      },
    });

    await savedMessage.save();

    res.json({
      success: true,
      message: 'Welcome message sent successfully',
      data: result,
    });
  } catch (error) {
    logger.error('WhatsApp welcome message error', { error, body: req.body });

    res.status(500).json({
      success: false,
      error: 'Failed to send welcome message',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * @swagger
 * /api/whatsapp/templates/order-confirmation:
 *   post:
 *     summary: Send order confirmation
 *     description: Send order confirmation message to customer
 *     tags: [WhatsApp]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - to
 *               - orderId
 *               - total
 *             properties:
 *               to:
 *                 type: string
 *                 example: "+573123161080"
 *               orderId:
 *                 type: string
 *                 example: "ORD-001"
 *               total:
 *                 type: number
 *                 example: 99.99
 *     responses:
 *       200:
 *         description: Order confirmation sent successfully
 *       400:
 *         description: Missing required fields
 *       500:
 *         description: Internal server error
 */
router.post('/templates/order-confirmation', [
  body('to').isMobilePhone().withMessage('Valid phone number is required'),
  body('orderId').isLength({ min: 1 }).withMessage('Order ID is required'),
  body('total').isNumeric().withMessage('Total must be a number'),
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array(),
      });
    }

    const { to, orderId, total } = req.body;

    const result = await whatsAppService.sendOrderConfirmation(to, orderId, total);

    // Save to database
    const savedMessage = new WhatsAppMessage({
      messageId: result.id!,
      from: result.from,
      to: result.to,
      message: result.message,
      type: result.type,
      status: result.status,
      timestamp: result.timestamp,
      metadata: {
        templateId: 'order_confirmation',
      },
    });

    await savedMessage.save();

    res.json({
      success: true,
      message: 'Order confirmation sent successfully',
      data: result,
    });
  } catch (error) {
    logger.error('WhatsApp order confirmation error', { error, body: req.body });

    res.status(500).json({
      success: false,
      error: 'Failed to send order confirmation',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * @swagger
 * /api/whatsapp/templates/support:
 *   post:
 *     summary: Send support message
 *     description: Send support request acknowledgment to customer
 *     tags: [WhatsApp]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - to
 *               - issue
 *             properties:
 *               to:
 *                 type: string
 *                 example: "+573123161080"
 *               issue:
 *                 type: string
 *                 example: "Tengo un problema con mi orden"
 *     responses:
 *       200:
 *         description: Support message sent successfully
 *       400:
 *         description: Missing required fields
 *       500:
 *         description: Internal server error
 */
router.post('/templates/support', [
  body('to').isMobilePhone().withMessage('Valid phone number is required'),
  body('issue').isLength({ min: 1, max: 500 }).withMessage('Issue description is required'),
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array(),
      });
    }

    const { to, issue } = req.body;

    const result = await whatsAppService.sendSupportMessage(to, issue);

    // Save to database
    const savedMessage = new WhatsAppMessage({
      messageId: result.id!,
      from: result.from,
      to: result.to,
      message: result.message,
      type: result.type,
      status: result.status,
      timestamp: result.timestamp,
      metadata: {
        templateId: 'support_message',
      },
    });

    await savedMessage.save();

    res.json({
      success: true,
      message: 'Support message sent successfully',
      data: result,
    });
  } catch (error) {
    logger.error('WhatsApp support message error', { error, body: req.body });

    res.status(500).json({
      success: false,
      error: 'Failed to send support message',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * @swagger
 * /api/whatsapp/messages:
 *   get:
 *     summary: Get WhatsApp messages
 *     description: Retrieve WhatsApp messages with optional filtering
 *     tags: [WhatsApp]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *         description: Filter by user ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [sent, delivered, read, failed]
 *         description: Filter by message status
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *         description: Number of messages to return (default: 20)
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Page number (default: 1)
 *     responses:
 *       200:
 *         description: Messages retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/WhatsAppMessage'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                     page:
 *                       type: integer
 *                     pages:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *       500:
 *         description: Internal server error
 */
router.get('/messages', async (req: Request, res: Response) => {
  try {
    const { userId, status, limit = 20, page = 1 } = req.query;

    // Build filter
    const filter: any = {};
    if (userId) filter.userId = userId;
    if (status) filter.status = status;

    // Calculate skip for pagination
    const skip = (Number(page) - 1) * Number(limit);

    // Get messages with pagination
    const messages = await WhatsAppMessage.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .populate('userId', 'firstName lastName email')
      .populate('orderId', 'orderNumber total');

    // Get total count
    const total = await WhatsAppMessage.countDocuments(filter);

    res.json({
      success: true,
      data: messages,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit)),
        limit: Number(limit),
      },
    });
  } catch (error) {
    logger.error('WhatsApp get messages error', { error, query: req.query });

    res.status(500).json({
      success: false,
      error: 'Failed to retrieve WhatsApp messages',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * @swagger
 * /api/whatsapp/messages/{messageId}/status:
 *   get:
 *     summary: Get message status
 *     description: Get the delivery status of a WhatsApp message from Twilio
 *     tags: [WhatsApp]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: messageId
 *         required: true
 *         schema:
 *           type: string
 *         description: Twilio message ID
 *     responses:
 *       200:
 *         description: Status retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 messageId:
 *                   type: string
 *                   example: "SMxxxxxxxxxxxxx"
 *                 status:
 *                   type: string
 *                   enum: [sent, delivered, read, failed]
 *                   example: "delivered"
 *       404:
 *         description: Message not found
 *       500:
 *         description: Internal server error
 */
router.get('/messages/:messageId/status', async (req: Request, res: Response) => {
  try {
    const { messageId } = req.params;

    const status = await whatsAppService.getMessageStatus(messageId);

    res.json({
      success: true,
      messageId,
      status,
    });
  } catch (error) {
    logger.error('WhatsApp get status error', { error, messageId: req.params.messageId });

    res.status(500).json({
      success: false,
      error: 'Failed to get message status',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
