import { Twilio } from 'twilio';
import { logger } from '../utils/logger';

export interface WhatsAppMessage {
  id?: string;
  from: string;
  to: string;
  message: string;
  type?: 'text' | 'image' | 'document' | 'audio' | 'video';
  mediaUrl?: string;
  timestamp?: Date;
  status?: 'sent' | 'delivered' | 'read' | 'failed';
}

export class WhatsAppService {
  private twilioClient: Twilio;
  private fromNumber: string;

  constructor() {
    // Initialize Twilio client
    this.twilioClient = new Twilio(
      process.env.TWILIO_ACCOUNT_SID!,
      process.env.TWILIO_AUTH_TOKEN!
    );

    this.fromNumber = process.env.TWILIO_PHONE_NUMBER || '+573123161080';

    logger.info('WhatsApp service initialized', {
      fromNumber: this.fromNumber,
      accountSid: process.env.TWILIO_ACCOUNT_SID?.substring(0, 10) + '...'
    });
  }

  /**
   * Send a WhatsApp message to a customer
   */
  async sendMessage(to: string, message: string, mediaUrl?: string): Promise<WhatsAppMessage> {
    try {
      logger.info('Sending WhatsApp message', { to, messageLength: message.length });

      // Format phone number (ensure it includes country code)
      const formattedTo = this.formatPhoneNumber(to);

      let messageData;

      if (mediaUrl) {
        // Send message with media
        messageData = await this.twilioClient.messages.create({
          from: `whatsapp:${this.fromNumber}`,
          to: `whatsapp:${formattedTo}`,
          body: message,
          mediaUrl: [mediaUrl],
        });
      } else {
        // Send text message only
        messageData = await this.twilioClient.messages.create({
          from: `whatsapp:${this.fromNumber}`,
          to: `whatsapp:${formattedTo}`,
          body: message,
        });
      }

      const whatsappMessage: WhatsAppMessage = {
        id: messageData.sid,
        from: this.fromNumber,
        to: formattedTo,
        message,
        type: mediaUrl ? 'image' : 'text',
        mediaUrl,
        timestamp: new Date(),
        status: 'sent',
      };

      logger.info('WhatsApp message sent successfully', {
        messageId: messageData.sid,
        to: formattedTo,
        status: messageData.status
      });

      return whatsappMessage;
    } catch (error) {
      logger.error('Failed to send WhatsApp message', { error, to, messageLength: message.length });

      // Create failed message object
      const failedMessage: WhatsAppMessage = {
        from: this.fromNumber,
        to,
        message,
        type: mediaUrl ? 'image' : 'text',
        mediaUrl,
        timestamp: new Date(),
        status: 'failed',
      };

      throw new Error(`WhatsApp message failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Send welcome message to new customers
   */
  async sendWelcomeMessage(to: string, customerName?: string): Promise<WhatsAppMessage> {
    const welcomeMessage = customerName
      ? `¡Hola ${customerName}! 👋 Bienvenido a Lookmaxing. Gracias por elegirnos para tu transformación de estilo. ¿En qué podemos ayudarte hoy?`
      : '¡Hola! 👋 Bienvenido a Lookmaxing. Gracias por elegirnos para tu transformación de estilo. ¿En qué podemos ayudarte hoy?';

    return this.sendMessage(to, welcomeMessage);
  }

  /**
   * Send order confirmation message
   */
  async sendOrderConfirmation(to: string, orderId: string, total: number): Promise<WhatsAppMessage> {
    const confirmationMessage = `✅ ¡Tu orden #${orderId} ha sido confirmada!\n\n💰 Total: $${total.toFixed(2)}\n📦 Estamos preparando tu paquete con cuidado.\n⏰ Te notificaremos cuando sea enviado.\n\n¿Tienes alguna pregunta sobre tu orden?`;

    return this.sendMessage(to, confirmationMessage);
  }

  /**
   * Send support message
   */
  async sendSupportMessage(to: string, issue: string): Promise<WhatsAppMessage> {
    const supportMessage = `🎧 ¡Estamos aquí para ayudarte!\n\n📝 Consulta: ${issue}\n\nNuestro equipo de soporte te contactará pronto. También puedes llamarnos al +57 312 316 1080`;

    return this.sendMessage(to, supportMessage);
  }

  /**
   * Format phone number to ensure it has country code
   */
  private formatPhoneNumber(phone: string): string {
    // Remove all non-numeric characters
    const cleaned = phone.replace(/\D/g, '');

    // Add country code if not present (assuming Colombia +57)
    if (cleaned.length === 10) {
      return `57${cleaned}`;
    } else if (cleaned.length === 12 && cleaned.startsWith('57')) {
      return cleaned;
    } else if (cleaned.length === 13 && cleaned.startsWith('+57')) {
      return cleaned.substring(1); // Remove + and return just the numbers
    }

    // Return as-is if already properly formatted
    return cleaned;
  }

  /**
   * Get message status from Twilio
   */
  async getMessageStatus(messageId: string): Promise<string> {
    try {
      const message = await this.twilioClient.messages(messageId).fetch();
      return message.status;
    } catch (error) {
      logger.error('Failed to get message status', { error, messageId });
      return 'unknown';
    }
  }

  /**
   * Send promotional message (use sparingly and with consent)
   */
  async sendPromotionalMessage(to: string, promotion: string): Promise<WhatsAppMessage> {
    const promoMessage = `🎉 ¡Oferta especial para ti!\n\n${promotion}\n\n¡Aprovecha esta oportunidad única! ¿Te interesa saber más?`;

    return this.sendMessage(to, promoMessage);
  }

  /**
   * Send appointment reminder
   */
  async sendAppointmentReminder(to: string, appointmentDate: Date, service: string): Promise<WhatsAppMessage> {
    const formattedDate = appointmentDate.toLocaleDateString('es-CO', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const reminderMessage = `📅 Recordatorio de cita\n\n🕐 Fecha: ${formattedDate}\n💆 Servicio: ${service}\n\n¡Te esperamos! Si necesitas cambiar la hora, avísanos.`;

    return this.sendMessage(to, reminderMessage);
  }
}

// Export singleton instance
export const whatsAppService = new WhatsAppService();
