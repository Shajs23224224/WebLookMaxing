import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

// Swagger configuration
const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Lookmaxing API',
    version: '1.0.0',
    description: 'API documentation for Lookmaxing e-commerce platform',
    contact: {
      name: 'Lookmaxing Support',
      email: 'support@lookmaxing.com',
      url: 'https://lookmaxing.com',
    },
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT',
    },
  },
  servers: [
    {
      url: process.env.NODE_ENV === 'production'
        ? 'https://api.lookmaxing.com'
        : 'http://localhost:3001',
      description: process.env.NODE_ENV === 'production' ? 'Production server' : 'Development server',
    },
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
      ApiKeyAuth: {
        type: 'apiKey',
        in: 'header',
        name: 'X-API-Key',
      },
    },
    schemas: {
      Error: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: false,
          },
          error: {
            type: 'string',
            example: 'Error message',
          },
          details: {
            type: 'object',
            nullable: true,
          },
        },
      },
      User: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            format: 'uuid',
            example: '507f1f77bcf86cd799439011',
          },
          email: {
            type: 'string',
            format: 'email',
            example: 'user@example.com',
          },
          firstName: {
            type: 'string',
            example: 'John',
          },
          lastName: {
            type: 'string',
            example: 'Doe',
          },
          phone: {
            type: 'string',
            example: '+1234567890',
          },
          role: {
            type: 'string',
            enum: ['customer', 'admin'],
            example: 'customer',
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
          },
          updatedAt: {
            type: 'string',
            format: 'date-time',
          },
        },
      },
      Product: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            format: 'uuid',
            example: '507f1f77bcf86cd799439011',
          },
          name: {
            type: 'string',
            example: 'Paquete Básico de Lookmaxing',
          },
          description: {
            type: 'string',
            example: 'Transformación básica de estilo personal',
          },
          price: {
            type: 'number',
            format: 'float',
            example: 99.99,
          },
          currency: {
            type: 'string',
            example: 'USD',
          },
          category: {
            type: 'string',
            enum: ['basic', 'premium', 'deluxe'],
            example: 'basic',
          },
          images: {
            type: 'array',
            items: {
              type: 'string',
              format: 'uri',
            },
          },
          features: {
            type: 'array',
            items: {
              type: 'string',
            },
          },
          available: {
            type: 'boolean',
            example: true,
          },
          stock: {
            type: 'integer',
            example: 100,
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
          },
          updatedAt: {
            type: 'string',
            format: 'date-time',
          },
        },
      },
      Order: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            format: 'uuid',
            example: '507f1f77bcf86cd799439011',
          },
          userId: {
            type: 'string',
            format: 'uuid',
            example: '507f1f77bcf86cd799439011',
          },
          products: {
            type: 'array',
            items: {
              $ref: '#/components/schemas/OrderItem',
            },
          },
          total: {
            type: 'number',
            format: 'float',
            example: 199.98,
          },
          currency: {
            type: 'string',
            example: 'USD',
          },
          status: {
            type: 'string',
            enum: ['pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled'],
            example: 'pending',
          },
          paymentMethod: {
            type: 'string',
            enum: ['paypal', 'nequi', 'card'],
            example: 'paypal',
          },
          shippingAddress: {
            $ref: '#/components/schemas/Address',
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
          },
          updatedAt: {
            type: 'string',
            format: 'date-time',
          },
        },
      },
      OrderItem: {
        type: 'object',
        properties: {
          productId: {
            type: 'string',
            format: 'uuid',
          },
          name: {
            type: 'string',
          },
          price: {
            type: 'number',
            format: 'float',
          },
          quantity: {
            type: 'integer',
          },
        },
      },
      Address: {
        type: 'object',
        properties: {
          street: {
            type: 'string',
          },
          city: {
            type: 'string',
          },
          state: {
            type: 'string',
          },
          country: {
            type: 'string',
          },
          zipCode: {
            type: 'string',
          },
        },
      },
      WhatsAppMessage: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            format: 'uuid',
          },
          from: {
            type: 'string',
            example: '+573123161080',
          },
          to: {
            type: 'string',
            example: 'customer-phone',
          },
          message: {
            type: 'string',
          },
          type: {
            type: 'string',
            enum: ['text', 'image', 'document', 'audio', 'video'],
            example: 'text',
          },
          timestamp: {
            type: 'string',
            format: 'date-time',
          },
          status: {
            type: 'string',
            enum: ['sent', 'delivered', 'read', 'failed'],
            example: 'sent',
          },
        },
      },
    },
  },
  security: [
    {
      BearerAuth: [],
    },
  ],
};

const options = {
  swaggerDefinition,
  apis: [
    './src/routes/*.ts',
    './src/models/*.ts',
    './src/controllers/*.ts',
    './src/middleware/*.ts',
  ],
};

export const swaggerSpec = swaggerJSDoc(options);
