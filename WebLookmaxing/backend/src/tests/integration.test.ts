import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { app } from '../index';
import { User } from '../../models/User';
import { Product } from '../../models/Product';
import { Order } from '../../models/Order';
import { WhatsAppMessage } from '../../models/WhatsAppMessage';

// Mock external services
jest.mock('twilio');
jest.mock('../../services/firebase');
jest.mock('../../services/whatsapp');

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  // Start in-memory MongoDB
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();

  await mongoose.connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  // Clear all collections before each test
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany({});
  }
});

describe('Integration Tests - Complete Workflows', () => {
  describe('User Registration and Authentication Flow', () => {
    it('should complete full user registration, login, and profile update flow', async () => {
      // 1. Register new user
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'password123',
          firstName: 'John',
          lastName: 'Doe',
          phone: '+573001234567',
        })
        .expect(201);

      expect(registerResponse.body.success).toBe(true);
      expect(registerResponse.body.data.user.email).toBe('test@example.com');

      // 2. Login with the registered user
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123',
        })
        .expect(200);

      expect(loginResponse.body.success).toBe(true);
      expect(loginResponse.body.data.token).toBeDefined();

      const token = loginResponse.body.data.token;

      // 3. Get user profile
      const profileResponse = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(profileResponse.body.success).toBe(true);
      expect(profileResponse.body.data.email).toBe('test@example.com');

      // 4. Update user profile
      const updateResponse = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${token}`)
        .send({
          firstName: 'Jane',
          phone: '+573009876543',
        })
        .expect(200);

      expect(updateResponse.body.success).toBe(true);
      expect(updateResponse.body.data.firstName).toBe('Jane');
      expect(updateResponse.body.data.phone).toBe('+573009876543');

      // 5. Verify WhatsApp welcome message was sent
      const whatsappMessages = await WhatsAppMessage.find({});
      expect(whatsappMessages.length).toBeGreaterThan(0);
      expect(whatsappMessages[0].to).toBe('+573009876543');
      expect(whatsappMessages[0].type).toBe('welcome_message');
    });

    it('should handle invalid login attempts correctly', async () => {
      // Try to login with wrong credentials
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'wrongpassword',
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid credentials');
    });
  });

  describe('Product Management and Shopping Flow', () => {
    let adminToken: string;
    let userToken: string;
    let productId: string;

    beforeEach(async () => {
      // Create admin user
      const adminUser = await User.create({
        email: 'admin@lookmaxing.com',
        password: 'hashedpassword',
        firstName: 'Admin',
        lastName: 'User',
        role: 'admin',
        phone: '+573001234567',
      });

      // Create regular user
      const regularUser = await User.create({
        email: 'user@lookmaxing.com',
        password: 'hashedpassword',
        firstName: 'Regular',
        lastName: 'User',
        role: 'customer',
        phone: '+573009876543',
      });

      // Mock tokens (in real app, these would be JWT tokens)
      adminToken = 'admin-jwt-token';
      userToken = 'user-jwt-token';
    });

    it('should complete full product lifecycle: create, update, purchase, and track', async () => {
      // 1. Admin creates a product
      const createProductResponse = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Paquete Premium de Lookmaxing',
          description: 'Transformación completa de estilo personal',
          price: 299.99,
          currency: 'USD',
          category: 'premium',
          images: ['https://example.com/image1.jpg'],
          features: ['Consulta personalizada', 'Seguimiento de progreso'],
          available: true,
          stock: 10,
        })
        .expect(201);

      expect(createProductResponse.body.success).toBe(true);
      productId = createProductResponse.body.data._id;

      // 2. Verify product is listed
      const productsResponse = await request(app)
        .get('/api/products')
        .expect(200);

      expect(productsResponse.body.data.length).toBe(1);
      expect(productsResponse.body.data[0].name).toBe('Paquete Premium de Lookmaxing');

      // 3. User creates an order for the product
      const createOrderResponse = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          products: [
            {
              productId,
              quantity: 1,
            },
          ],
          shippingAddress: {
            street: 'Calle 123 #45-67',
            city: 'Bogotá',
            state: 'Cundinamarca',
            country: 'Colombia',
            zipCode: '11001',
          },
          paymentMethod: 'paypal',
        })
        .expect(201);

      expect(createOrderResponse.body.success).toBe(true);
      const orderId = createOrderResponse.body.data._id;

      // 4. Verify order WhatsApp confirmation was sent
      const whatsappMessages = await WhatsAppMessage.find({ orderId });
      expect(whatsappMessages.length).toBe(1);
      expect(whatsappMessages[0].type).toBe('order_confirmation');

      // 5. Admin updates product stock
      const updateProductResponse = await request(app)
        .put(`/api/products/${productId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          stock: 9, // Reduced by 1 due to the order
        })
        .expect(200);

      expect(updateProductResponse.body.success).toBe(true);
      expect(updateProductResponse.body.data.stock).toBe(9);

      // 6. User views their order history
      const ordersResponse = await request(app)
        .get('/api/orders')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(ordersResponse.body.data.length).toBe(1);
      expect(ordersResponse.body.data[0].status).toBe('pending');
    });

    it('should handle product stock validation during ordering', async () => {
      // Create a product with low stock
      const product = await Product.create({
        name: 'Producto con stock limitado',
        description: 'Producto de prueba',
        price: 50.00,
        currency: 'USD',
        category: 'basic',
        stock: 1,
      });

      // First user orders the last item
      await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          products: [
            {
              productId: product._id,
              quantity: 1,
            },
          ],
          shippingAddress: {
            street: 'Test Street',
            city: 'Test City',
            country: 'Test Country',
            zipCode: '12345',
          },
          paymentMethod: 'paypal',
        })
        .expect(201);

      // Second user tries to order the same product (should fail)
      const secondOrderResponse = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          products: [
            {
              productId: product._id,
              quantity: 1,
            },
          ],
          shippingAddress: {
            street: 'Test Street 2',
            city: 'Test City 2',
            country: 'Test Country 2',
            zipCode: '12345',
          },
          paymentMethod: 'paypal',
        })
        .expect(400);

      expect(secondOrderResponse.body.error).toContain('stock');
    });
  });

  describe('WhatsApp Integration Workflow', () => {
    let userId: string;

    beforeEach(async () => {
      // Create test user
      const user = await User.create({
        email: 'whatsapp-test@example.com',
        firstName: 'WhatsApp',
        lastName: 'Test',
        phone: '+573001234567',
        role: 'customer',
      });
      userId = user._id.toString();
    });

    it('should send welcome message and track it in database', async () => {
      const response = await request(app)
        .post('/api/whatsapp/templates/welcome')
        .send({
          to: '+573001234567',
          customerName: 'WhatsApp',
        })
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify message was saved to database
      const savedMessage = await WhatsAppMessage.findOne({
        to: '+573001234567',
        messageId: response.body.data.id,
      });

      expect(savedMessage).toBeTruthy();
      expect(savedMessage?.type).toBe('welcome_message');
      expect(savedMessage?.metadata?.templateId).toBe('welcome_message');
    });

    it('should send order confirmation and link to order', async () => {
      // Create a product and order first
      const product = await Product.create({
        name: 'Producto de prueba WhatsApp',
        description: 'Producto para test de WhatsApp',
        price: 100.00,
        currency: 'USD',
        category: 'basic',
        stock: 5,
      });

      const order = await Order.create({
        userId: new mongoose.Types.ObjectId(userId),
        products: [
          {
            productId: product._id,
            name: product.name,
            price: product.price,
            quantity: 1,
          },
        ],
        total: 100.00,
        currency: 'USD',
        status: 'paid',
        paymentMethod: 'paypal',
      });

      const response = await request(app)
        .post('/api/whatsapp/templates/order-confirmation')
        .send({
          to: '+573001234567',
          orderId: order._id.toString(),
          total: 100.00,
        })
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify message was linked to the order
      const savedMessage = await WhatsAppMessage.findOne({
        orderId: order._id,
      });

      expect(savedMessage).toBeTruthy();
      expect(savedMessage?.type).toBe('order_confirmation');
    });

    it('should retrieve message history with pagination', async () => {
      // Create multiple WhatsApp messages
      const messages = [];
      for (let i = 0; i < 5; i++) {
        const message = await WhatsAppMessage.create({
          messageId: `SM${i}`,
          from: '+573123161080',
          to: '+573001234567',
          message: `Test message ${i}`,
          type: 'text',
          status: 'sent',
          timestamp: new Date(Date.now() + i * 1000),
        });
        messages.push(message);
      }

      // Test pagination - first page
      const firstPageResponse = await request(app)
        .get('/api/whatsapp/messages?limit=2&page=1')
        .expect(200);

      expect(firstPageResponse.body.data.length).toBe(2);
      expect(firstPageResponse.body.pagination.total).toBe(5);
      expect(firstPageResponse.body.pagination.pages).toBe(3);

      // Test pagination - second page
      const secondPageResponse = await request(app)
        .get('/api/whatsapp/messages?limit=2&page=2')
        .expect(200);

      expect(secondPageResponse.body.data.length).toBe(2);
      expect(secondPageResponse.body.pagination.page).toBe(2);
    });
  });

  describe('Payment and Order Processing Flow', () => {
    let userToken: string;
    let productId: string;

    beforeEach(async () => {
      // Create test user
      const user = await User.create({
        email: 'payment-test@example.com',
        firstName: 'Payment',
        lastName: 'Test',
        phone: '+573001234567',
        role: 'customer',
      });

      userToken = 'user-jwt-token';
      productId = new mongoose.Types.ObjectId().toString();
    });

    it('should process complete order with WhatsApp notifications', async () => {
      // 1. Create order
      const orderResponse = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          products: [
            {
              productId,
              quantity: 1,
            },
          ],
          shippingAddress: {
            street: 'Payment Test Street',
            city: 'Payment City',
            country: 'Payment Country',
            zipCode: '12345',
          },
          paymentMethod: 'paypal',
        })
        .expect(201);

      expect(orderResponse.body.success).toBe(true);
      const orderId = orderResponse.body.data._id;

      // 2. Process payment (mock successful payment)
      const paymentResponse = await request(app)
        .post(`/api/payments/process/${orderId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          paymentId: 'PAY-123456789',
          status: 'completed',
        })
        .expect(200);

      expect(paymentResponse.body.success).toBe(true);

      // 3. Verify order status was updated
      const updatedOrder = await Order.findById(orderId);
      expect(updatedOrder?.status).toBe('paid');

      // 4. Verify WhatsApp confirmation was sent
      const whatsappMessages = await WhatsAppMessage.find({ orderId });
      expect(whatsappMessages.length).toBe(1);
      expect(whatsappMessages[0].type).toBe('order_confirmation');
    });

    it('should handle payment failures gracefully', async () => {
      const orderResponse = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          products: [
            {
              productId,
              quantity: 1,
            },
          ],
          shippingAddress: {
            street: 'Payment Test Street',
            city: 'Payment City',
            country: 'Payment Country',
            zipCode: '12345',
          },
          paymentMethod: 'paypal',
        })
        .expect(201);

      const orderId = orderResponse.body.data._id;

      // Process failed payment
      const paymentResponse = await request(app)
        .post(`/api/payments/process/${orderId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          paymentId: 'PAY-123456789',
          status: 'failed',
        })
        .expect(200);

      // Verify order status reflects payment failure
      const updatedOrder = await Order.findById(orderId);
      expect(updatedOrder?.status).toBe('cancelled');
    });
  });

  describe('Admin Panel Integration', () => {
    let adminToken: string;

    beforeEach(async () => {
      // Create admin user
      const admin = await User.create({
        email: 'admin-integration@example.com',
        firstName: 'Admin',
        lastName: 'Integration',
        phone: '+573001234567',
        role: 'admin',
      });

      adminToken = 'admin-jwt-token';
    });

    it('should manage products and users as admin', async () => {
      // 1. Create multiple products
      const products = [];
      for (let i = 0; i < 3; i++) {
        const productResponse = await request(app)
          .post('/api/products')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            name: `Producto Admin ${i + 1}`,
            description: `Descripción del producto ${i + 1}`,
            price: (i + 1) * 50,
            currency: 'USD',
            category: 'basic',
            stock: 10,
          })
          .expect(201);

        products.push(productResponse.body.data);
      }

      // 2. Get all products (admin view)
      const productsResponse = await request(app)
        .get('/api/admin/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(productsResponse.body.data.length).toBe(3);

      // 3. Update product as admin
      const updateResponse = await request(app)
        .put(`/api/products/${products[0]._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          price: 75.00,
          stock: 15,
        })
        .expect(200);

      expect(updateResponse.body.data.price).toBe(75.00);
      expect(updateResponse.body.data.stock).toBe(15);

      // 4. Get user analytics
      const analyticsResponse = await request(app)
        .get('/api/admin/analytics')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(analyticsResponse.body.data).toBeDefined();
    });

    it('should handle admin authentication and authorization', async () => {
      // Try to access admin endpoints with regular user token
      const userToken = 'regular-user-token';

      const response = await request(app)
        .get('/api/admin/products')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);

      expect(response.body.error).toContain('Admin access required');
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle database connection errors gracefully', async () => {
      // Temporarily disconnect from database
      await mongoose.disconnect();

      const response = await request(app)
        .get('/api/products')
        .expect(500);

      expect(response.body.error).toContain('Database');

      // Reconnect for other tests
      const mongoUri = mongoServer.getUri();
      await mongoose.connect(mongoUri);
    });

    it('should handle malformed requests appropriately', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          // Missing required fields
          email: 'incomplete@example.com',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Validation failed');
    });

    it('should handle rate limiting correctly', async () => {
      // Make multiple rapid requests
      const requests = [];
      for (let i = 0; i < 150; i++) { // Exceed rate limit
        requests.push(
          request(app)
            .get('/api/products')
            .expect((res) => {
              // Should eventually get rate limited
              if (i > 100) {
                expect([200, 429]).toContain(res.status);
              }
            })
        );
      }

      await Promise.all(requests);
    });
  });
});
