import axios from 'axios';
import crypto from 'crypto';
import { logger } from '../utils/logger';

interface NequiConfig {
  clientId: string;
  clientSecret: string;
  isSandbox: boolean;
}

export class NequiService {
  private config: NequiConfig;
  private accessToken: string | null = null;
  private tokenExpiry: Date | null = null;

  constructor(isSandbox: boolean = true) {
    this.config = {
      clientId: isSandbox
        ? process.env.NEQUI_CLIENT_ID_SANDBOX!
        : process.env.NEQUI_CLIENT_ID_LIVE!,
      clientSecret: isSandbox
        ? process.env.NEQUI_CLIENT_SECRET_SANDBOX!
        : process.env.NEQUI_CLIENT_SECRET_LIVE!,
      isSandbox
    };
  }

  private async getAccessToken(): Promise<string> {
    // Return cached token if still valid
    if (this.accessToken && this.tokenExpiry && this.tokenExpiry > new Date()) {
      return this.accessToken;
    }

    try {
      const baseURL = this.config.isSandbox
        ? 'https://api-sandbox.nequi.com'
        : 'https://api.nequi.com';

      // This is a placeholder implementation
      // Real Nequi authentication would follow their specific OAuth flow
      const authString = Buffer.from(`${this.config.clientId}:${this.config.clientSecret}`).toString('base64');

      const response = await axios.post(
        `${baseURL}/oauth2/token`,
        'grant_type=client_credentials',
        {
          headers: {
            'Authorization': `Basic ${authString}`,
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );

      this.accessToken = response.data.access_token;
      // Set expiry to 30 minutes before actual expiry for safety margin
      this.tokenExpiry = new Date(Date.now() + (response.data.expires_in - 1800) * 1000);

      return this.accessToken;
    } catch (error) {
      logger.error('Error getting Nequi access token:', error);
      throw new Error('Failed to authenticate with Nequi');
    }
  }

  async createPaymentRequest(paymentData: {
    amount: number;
    phone: string;
    reference: string;
    description: string;
    returnUrl?: string;
  }) {
    try {
      const accessToken = await this.getAccessToken();
      const baseURL = this.config.isSandbox
        ? 'https://api-sandbox.nequi.com'
        : 'https://api.nequi.com';

      // This is a placeholder implementation
      // Real Nequi payment request would follow their specific API format
      const response = await axios.post(
        `${baseURL}/v1/payments/requests`,
        {
          amount: {
            value: paymentData.amount,
            currency: 'COP'
          },
          phone: paymentData.phone,
          reference: paymentData.reference,
          description: paymentData.description,
          callbackUrl: paymentData.returnUrl || `${process.env.API_BASE_URL}/api/webhooks/nequi`
        },
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        paymentId: response.data.paymentId,
        qrImage: response.data.qrImageBase64,
        redirectUrl: response.data.redirectUrl
      };
    } catch (error) {
      logger.error('Error creating Nequi payment request:', error);
      throw new Error('Failed to create Nequi payment request');
    }
  }

  async getPaymentStatus(paymentId: string) {
    try {
      const accessToken = await this.getAccessToken();
      const baseURL = this.config.isSandbox
        ? 'https://api-sandbox.nequi.com'
        : 'https://api.nequi.com';

      const response = await axios.get(
        `${baseURL}/v1/payments/requests/${paymentId}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );

      return response.data;
    } catch (error) {
      logger.error('Error getting Nequi payment status:', error);
      throw new Error('Failed to get Nequi payment status');
    }
  }

  async refundPayment(paymentId: string, amount?: number) {
    try {
      const accessToken = await this.getAccessToken();
      const baseURL = this.config.isSandbox
        ? 'https://api-sandbox.nequi.com'
        : 'https://api.nequi.com';

      const refundData: any = {};
      if (amount) {
        refundData.amount = {
          value: amount,
          currency: 'COP'
        };
      }

      const response = await axios.post(
        `${baseURL}/v1/payments/requests/${paymentId}/refund`,
        refundData,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data;
    } catch (error) {
      logger.error('Error refunding Nequi payment:', error);
      throw new Error('Failed to refund Nequi payment');
    }
  }

  verifyWebhookSignature(payload: any, signature: string, timestamp: string): boolean {
    try {
      // Nequi webhook signature verification would go here
      // This is a simplified version - implement proper verification based on Nequi docs
      const expectedSignature = this.generateWebhookSignature(payload, timestamp);

      // In production, compare the signature properly using HMAC
      return signature === expectedSignature;
    } catch (error) {
      logger.error('Error verifying Nequi webhook signature:', error);
      return false;
    }
  }

  private generateWebhookSignature(payload: any, timestamp: string): string {
    // This is a placeholder - implement proper signature generation
    // based on Nequi webhook signature algorithm
    const secret = process.env.NEQUI_WEBHOOK_SECRET || 'fallback-secret';
    const data = JSON.stringify(payload) + timestamp;

    return crypto.createHmac('sha256', secret).update(data).digest('hex');
  }
}
