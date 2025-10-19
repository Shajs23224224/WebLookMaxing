import request from 'supertest';
import { app } from '../index';
import { WhatsAppMessage } from '../../models/WhatsAppMessage';
import { whatsAppService } from '../../services/whatsapp';

// Mock the WhatsApp service
jest.mock('../../services/whatsapp');
const mockedWhatsAppService = whatsAppService as jest.Mocked<typeof whatsAppService>;

describe('WhatsApp API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/whatsapp/send', () => {
    it('should send a WhatsApp message successfully', async () => {
      const mockMessage = {
        id: 'SM123456789',
        from: '+573123161080',
        to: '+573001234567',
        message: 'Test message',
        type: 'text' as const,
        timestamp: new Date(),
        status: 'sent' as const,
      };

      mockedWhatsAppService.sendMessage.mockResolvedValue(mockMessage);

      // Mock the database save
      const mockSave = jest.fn().mockResolvedValue({
        _id: '507f1f77bcf86cd799439011',
        ...mockMessage,
      });
      jest.spyOn(WhatsAppMessage.prototype, 'save').mockImplementation(mockSave);

      const response = await request(app)
        .post('/api/whatsapp/send')
        .send({
          to: '+573001234567',
          message: 'Test message',
        })
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: 'Message sent successfully',
        data: {
          ...mockMessage,
          databaseId: '507f1f77bcf86cd799439011',
        },
      });

      expect(mockedWhatsAppService.sendMessage).toHaveBeenCalledWith(
        '+573001234567',
        'Test message',
        undefined
      );
    });

    it('should send a WhatsApp message with media', async () => {
      const mockMessage = {
        id: 'SM123456789',
        from: '+573123161080',
        to: '+573001234567',
        message: 'Test message with image',
        type: 'image' as const,
        mediaUrl: 'https://example.com/image.jpg',
        timestamp: new Date(),
        status: 'sent' as const,
      };

      mockedWhatsAppService.sendMessage.mockResolvedValue(mockMessage);

      const mockSave = jest.fn().mockResolvedValue({
        _id: '507f1f77bcf86cd799439011',
        ...mockMessage,
      });
      jest.spyOn(WhatsAppMessage.prototype, 'save').mockImplementation(mockSave);

      const response = await request(app)
        .post('/api/whatsapp/send')
        .send({
          to: '+573001234567',
          message: 'Test message with image',
          mediaUrl: 'https://example.com/image.jpg',
        })
        .expect(200);

      expect(mockedWhatsAppService.sendMessage).toHaveBeenCalledWith(
        '+573001234567',
        'Test message with image',
        'https://example.com/image.jpg'
      );
    });

    it('should validate phone number format', async () => {
      const response = await request(app)
        .post('/api/whatsapp/send')
        .send({
          to: 'invalid-phone',
          message: 'Test message',
        })
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: 'Validation failed',
      });
    });

    it('should validate message length', async () => {
      const longMessage = 'a'.repeat(5000); // Exceeds 4096 limit

      const response = await request(app)
        .post('/api/whatsapp/send')
        .send({
          to: '+573001234567',
          message: longMessage,
        })
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: 'Validation failed',
      });
    });

    it('should validate media URL format', async () => {
      const response = await request(app)
        .post('/api/whatsapp/send')
        .send({
          to: '+573001234567',
          message: 'Test message',
          mediaUrl: 'not-a-url',
        })
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: 'Validation failed',
      });
    });

    it('should handle WhatsApp service errors', async () => {
      mockedWhatsAppService.sendMessage.mockRejectedValue(new Error('WhatsApp service error'));

      const response = await request(app)
        .post('/api/whatsapp/send')
        .send({
          to: '+573001234567',
          message: 'Test message',
        })
        .expect(500);

      expect(response.body).toMatchObject({
        success: false,
        error: 'Failed to send WhatsApp message',
      });
    });
  });

  describe('POST /api/whatsapp/templates/welcome', () => {
    it('should send welcome message successfully', async () => {
      const mockMessage = {
        id: 'SM123456789',
        from: '+573123161080',
        to: '+573001234567',
        message: '¡Hola John! 👋 Bienvenido a Lookmaxing. Gracias por elegirnos para tu transformación de estilo. ¿En qué podemos ayudarte hoy?',
        type: 'text' as const,
        timestamp: new Date(),
        status: 'sent' as const,
      };

      mockedWhatsAppService.sendWelcomeMessage.mockResolvedValue(mockMessage);

      const mockSave = jest.fn().mockResolvedValue({
        _id: '507f1f77bcf86cd799439011',
        ...mockMessage,
        metadata: { templateId: 'welcome_message' },
      });
      jest.spyOn(WhatsAppMessage.prototype, 'save').mockImplementation(mockSave);

      const response = await request(app)
        .post('/api/whatsapp/templates/welcome')
        .send({
          to: '+573001234567',
          customerName: 'John',
        })
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: 'Welcome message sent successfully',
      });

      expect(mockedWhatsAppService.sendWelcomeMessage).toHaveBeenCalledWith(
        '+573001234567',
        'John'
      );
    });

    it('should send welcome message without name', async () => {
      const mockMessage = {
        id: 'SM123456789',
        from: '+573123161080',
        to: '+573001234567',
        message: '¡Hola! 👋 Bienvenido a Lookmaxing. Gracias por elegirnos para tu transformación de estilo. ¿En qué podemos ayudarte hoy?',
        type: 'text' as const,
        timestamp: new Date(),
        status: 'sent' as const,
      };

      mockedWhatsAppService.sendWelcomeMessage.mockResolvedValue(mockMessage);

      const mockSave = jest.fn().mockResolvedValue({
        _id: '507f1f77bcf86cd799439011',
        ...mockMessage,
        metadata: { templateId: 'welcome_message' },
      });
      jest.spyOn(WhatsAppMessage.prototype, 'save').mockImplementation(mockSave);

      const response = await request(app)
        .post('/api/whatsapp/templates/welcome')
        .send({
          to: '+573001234567',
        })
        .expect(200);

      expect(mockedWhatsAppService.sendWelcomeMessage).toHaveBeenCalledWith(
        '+573001234567',
        undefined
      );
    });
  });

  describe('POST /api/whatsapp/templates/order-confirmation', () => {
    it('should send order confirmation successfully', async () => {
      const mockMessage = {
        id: 'SM123456789',
        from: '+573123161080',
        to: '+573001234567',
        message: '✅ ¡Tu orden #ORD-001 ha sido confirmada!\n\n💰 Total: $99.99\n📦 Estamos preparando tu paquete con cuidado.\n⏰ Te notificaremos cuando sea enviado.\n\n¿Tienes alguna pregunta sobre tu orden?',
        type: 'text' as const,
        timestamp: new Date(),
        status: 'sent' as const,
      };

      mockedWhatsAppService.sendOrderConfirmation.mockResolvedValue(mockMessage);

      const mockSave = jest.fn().mockResolvedValue({
        _id: '507f1f77bcf86cd799439011',
        ...mockMessage,
        metadata: { templateId: 'order_confirmation' },
      });
      jest.spyOn(WhatsAppMessage.prototype, 'save').mockImplementation(mockSave);

      const response = await request(app)
        .post('/api/whatsapp/templates/order-confirmation')
        .send({
          to: '+573001234567',
          orderId: 'ORD-001',
          total: 99.99,
        })
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: 'Order confirmation sent successfully',
      });

      expect(mockedWhatsAppService.sendOrderConfirmation).toHaveBeenCalledWith(
        '+573001234567',
        'ORD-001',
        99.99
      );
    });
  });

  describe('POST /api/whatsapp/templates/support', () => {
    it('should send support message successfully', async () => {
      const mockMessage = {
        id: 'SM123456789',
        from: '+573123161080',
        to: '+573001234567',
        message: '🎧 ¡Estamos aquí para ayudarte!\n\n📝 Consulta: Tengo un problema con mi orden\n\nNuestro equipo de soporte te contactará pronto. También puedes llamarnos al +57 312 316 1080',
        type: 'text' as const,
        timestamp: new Date(),
        status: 'sent' as const,
      };

      mockedWhatsAppService.sendSupportMessage.mockResolvedValue(mockMessage);

      const mockSave = jest.fn().mockResolvedValue({
        _id: '507f1f77bcf86cd799439011',
        ...mockMessage,
        metadata: { templateId: 'support_message' },
      });
      jest.spyOn(WhatsAppMessage.prototype, 'save').mockImplementation(mockSave);

      const response = await request(app)
        .post('/api/whatsapp/templates/support')
        .send({
          to: '+573001234567',
          issue: 'Tengo un problema con mi orden',
        })
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: 'Support message sent successfully',
      });

      expect(mockedWhatsAppService.sendSupportMessage).toHaveBeenCalledWith(
        '+573001234567',
        'Tengo un problema con mi orden'
      );
    });
  });

  describe('GET /api/whatsapp/messages', () => {
    it('should get WhatsApp messages with pagination', async () => {
      const mockMessages = [
        {
          _id: '507f1f77bcf86cd799439011',
          messageId: 'SM123456789',
          from: '+573123161080',
          to: '+573001234567',
          message: 'Test message',
          type: 'text',
          status: 'sent',
          timestamp: new Date(),
          createdAt: new Date(),
        },
      ];

      jest.spyOn(WhatsAppMessage, 'find').mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        populate: jest.fn().mockResolvedValue(mockMessages),
      } as any);

      jest.spyOn(WhatsAppMessage, 'countDocuments').mockResolvedValue(1);

      const response = await request(app)
        .get('/api/whatsapp/messages?limit=10&page=1')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: mockMessages,
        pagination: {
          total: 1,
          page: 1,
          pages: 1,
          limit: 10,
        },
      });
    });

    it('should filter messages by status', async () => {
      const mockMessages = [];

      jest.spyOn(WhatsAppMessage, 'find').mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        populate: jest.fn().mockResolvedValue(mockMessages),
      } as any);

      await request(app)
        .get('/api/whatsapp/messages?status=sent&limit=10&page=1')
        .expect(200);

      expect(WhatsAppMessage.find).toHaveBeenCalledWith({ status: 'sent' });
    });
  });

  describe('GET /api/whatsapp/messages/:messageId/status', () => {
    it('should get message status successfully', async () => {
      mockedWhatsAppService.getMessageStatus.mockResolvedValue('delivered');

      const response = await request(app)
        .get('/api/whatsapp/messages/SM123456789/status')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        messageId: 'SM123456789',
        status: 'delivered',
      });

      expect(mockedWhatsAppService.getMessageStatus).toHaveBeenCalledWith('SM123456789');
    });

    it('should handle message status errors', async () => {
      mockedWhatsAppService.getMessageStatus.mockRejectedValue(new Error('Twilio error'));

      const response = await request(app)
        .get('/api/whatsapp/messages/SM123456789/status')
        .expect(500);

      expect(response.body).toMatchObject({
        success: false,
        error: 'Failed to get message status',
      });
    });
  });
});
