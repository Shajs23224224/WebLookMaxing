import axios from 'axios';
import { logger } from '../utils/logger';

interface PayPalConfig {
  clientId: string;
  clientSecret: string;
  isSandbox: boolean;
}

export class PayPalService {
  private config: PayPalConfig;
  private accessToken: string | null = null;
  private tokenExpiry: Date | null = null;

  constructor(isSandbox: boolean = true) {
    this.config = {
      clientId: isSandbox
        ? process.env.PAYPAL_CLIENT_ID_SANDBOX!
        : process.env.PAYPAL_CLIENT_ID_LIVE!,
      clientSecret: isSandbox
        ? process.env.PAYPAL_CLIENT_SECRET_SANDBOX!
        : process.env.PAYPAL_CLIENT_SECRET_LIVE!,
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
        ? 'https://api-m.sandbox.paypal.com'
        : 'https://api-m.paypal.com';

      const response = await axios.post(
        `${baseURL}/v1/oauth2/token`,
        'grant_type=client_credentials',
        {
          auth: {
            username: this.config.clientId,
            password: this.config.clientSecret
          },
          headers: {
            'Accept': 'application/json',
            'Accept-Language': 'en_US',
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );

      this.accessToken = response.data.access_token;
      // Set expiry to 30 minutes before actual expiry for safety margin
      this.tokenExpiry = new Date(Date.now() + (response.data.expires_in - 1800) * 1000);

      return this.accessToken;
    } catch (error) {
      logger.error('Error getting PayPal access token:', error);
      throw new Error('Failed to authenticate with PayPal');
    }
  }

  async createOrder(orderData: {
    amount: number;
    currency: string;
    description: string;
    orderId: string;
    returnUrl: string;
    cancelUrl: string;
  }) {
    try {
      const accessToken = await this.getAccessToken();
      const baseURL = this.config.isSandbox
        ? 'https://api-m.sandbox.paypal.com'
        : 'https://api-m.paypal.com';

      const response = await axios.post(
        `${baseURL}/v2/checkout/orders`,
        {
          intent: 'CAPTURE',
          purchase_units: [{
            reference_id: orderData.orderId,
            description: orderData.description,
            amount: {
              currency_code: orderData.currency,
              value: orderData.amount.toFixed(2),
              breakdown: {
                item_total: {
                  currency_code: orderData.currency,
                  value: orderData.amount.toFixed(2)
                }
              }
            }
          }],
          application_context: {
            return_url: orderData.returnUrl,
            cancel_url: orderData.cancelUrl,
            brand_name: 'Lookmaxing',
            locale: 'es-CO',
            landing_page: 'BILLING',
            user_action: 'PAY_NOW'
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            'PayPal-Request-Id': orderData.orderId
          }
        }
      );

      return {
        orderID: response.data.id,
        approvalUrl: response.data.links.find((link: any) => link.rel === 'approve')?.href
      };
    } catch (error) {
      logger.error('Error creating PayPal order:', error);
      throw new Error('Failed to create PayPal order');
    }
  }

  async captureOrder(orderId: string) {
    try {
      const accessToken = await this.getAccessToken();
      const baseURL = this.config.isSandbox
        ? 'https://api-m.sandbox.paypal.com'
        : 'https://api-m.paypal.com';

      const response = await axios.post(
        `${baseURL}/v2/checkout/orders/${orderId}/capture`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data;
    } catch (error) {
      logger.error('Error capturing PayPal order:', error);
      throw new Error('Failed to capture PayPal order');
    }
  }

  async refundOrder(captureId: string, amount?: number) {
    try {
      const accessToken = await this.getAccessToken();
      const baseURL = this.config.isSandbox
        ? 'https://api-m.sandbox.paypal.com'
        : 'https://api-m.paypal.com';

      const refundData: any = {};
      if (amount) {
        refundData.amount = {
          value: amount.toFixed(2),
          currency_code: 'COP'
        };
      }

      const response = await axios.post(
        `${baseURL}/v2/payments/captures/${captureId}/refund`,
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
      logger.error('Error refunding PayPal order:', error);
      throw new Error('Failed to refund PayPal order');
    }
  }

  verifyWebhookSignature(body: any, signature: string, webhookId: string): boolean {
    try {
      // PayPal webhook signature verification would go here
      // This is a simplified version - implement proper verification based on PayPal docs
      const expectedSignature = this.generateWebhookSignature(body, webhookId);

      // In production, compare the signature properly
      return signature === expectedSignature;
    } catch (error) {
      logger.error('Error verifying PayPal webhook signature:', error);
      return false;
    }
  }

  private generateWebhookSignature(body: any, webhookId: string): string {
    // This is a placeholder - implement proper signature generation
    // based on PayPal webhook signature algorithm
    return `placeholder-signature-${Date.now()}`;
  }
}
