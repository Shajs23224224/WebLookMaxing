import 'package:http/http.dart' as http;
import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/product.dart';
import '../models/order.dart';
import '../models/cart_item.dart';

class ApiService {
  static const String baseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://localhost:3001',
  );

  static Map<String, String> get _headers => {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };

  // Product services
  static Future<List<Product>> getProducts({
    int page = 1,
    int limit = 10,
    String? search,
    String? category,
    double? minPrice,
    double? maxPrice,
  }) async {
    try {
      final queryParams = <String, String>{};
      queryParams['page'] = page.toString();
      queryParams['limit'] = limit.toString();

      if (search != null) queryParams['search'] = search;
      if (category != null) queryParams['category'] = category;
      if (minPrice != null) queryParams['minPrice'] = minPrice.toString();
      if (maxPrice != null) queryParams['maxPrice'] = maxPrice.toString();

      final uri = Uri.parse('$baseUrl/api/products').replace(queryParameters: queryParams);
      final response = await http.get(uri, headers: _headers);

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return (data['products'] as List)
            .map((json) => Product.fromJson(json))
            .toList();
      } else {
        throw Exception('Failed to load products');
      }
    } catch (e) {
      throw Exception('Network error: $e');
    }
  }

  static Future<Product> getProduct(String id) async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/api/products/$id'),
        headers: _headers,
      );

      if (response.statusCode == 200) {
        return Product.fromJson(json.decode(response.body));
      } else {
        throw Exception('Product not found');
      }
    } catch (e) {
      throw Exception('Network error: $e');
    }
  }

  // Cart services
  static Future<void> saveCart(List<CartItem> items) async {
    final prefs = await SharedPreferences.getInstance();
    final cartJson = json.encode(items.map((item) => item.toJson()).toList());
    await prefs.setString('cart', cartJson);
  }

  static Future<List<CartItem>> getCart() async {
    final prefs = await SharedPreferences.getInstance();
    final cartJson = prefs.getString('cart');

    if (cartJson != null) {
      final List<dynamic> cartList = json.decode(cartJson);
      return cartList.map((json) => CartItem.fromJson(json)).toList();
    }

    return [];
  }

  // Order services
  static Future<Order> createOrder({
    required List<CartItem> items,
    required String paymentMethod,
    String? userEmail,
    String? userPhone,
  }) async {
    try {
      final orderData = {
        'items': items.map((item) => {
          'product_id': item.productId,
          'quantity': item.quantity,
        }).toList(),
        'payment_method': paymentMethod,
        'user_email': userEmail,
        'user_phone': userPhone,
      };

      final response = await http.post(
        Uri.parse('$baseUrl/api/orders'),
        headers: _headers,
        body: json.encode(orderData),
      );

      if (response.statusCode == 201) {
        return Order.fromJson(json.decode(response.body));
      } else {
        final error = json.decode(response.body);
        throw Exception(error['error'] ?? 'Failed to create order');
      }
    } catch (e) {
      throw Exception('Network error: $e');
    }
  }

  // Payment services
  static Future<PaymentResponse> createPayPalPayment({
    required String orderId,
    String? returnUrl,
    String? cancelUrl,
  }) async {
    try {
      final paymentData = {
        'order_id': orderId,
        'return_url': returnUrl,
        'cancel_url': cancelUrl,
      };

      final response = await http.post(
        Uri.parse('$baseUrl/api/payments/paypal/create'),
        headers: _headers,
        body: json.encode(paymentData),
      );

      if (response.statusCode == 200) {
        return PaymentResponse.fromJson(json.decode(response.body));
      } else {
        final error = json.decode(response.body);
        throw Exception(error['error'] ?? 'Failed to create PayPal payment');
      }
    } catch (e) {
      throw Exception('Network error: $e');
    }
  }

  static Future<PaymentResponse> createNequiPayment({
    required String orderId,
    required String phone,
    String? returnUrl,
  }) async {
    try {
      final paymentData = {
        'order_id': orderId,
        'phone': phone,
        'return_url': returnUrl,
      };

      final response = await http.post(
        Uri.parse('$baseUrl/api/payments/nequi/create'),
        headers: _headers,
        body: json.encode(paymentData),
      );

      if (response.statusCode == 200) {
        return PaymentResponse.fromJson(json.decode(response.body));
      } else {
        final error = json.decode(response.body);
        throw Exception(error['error'] ?? 'Failed to create Nequi payment');
      }
    } catch (e) {
      throw Exception('Network error: $e');
    }
  }
}

class PaymentResponse {
  final String orderId;
  final String approvalUrl;
  final String? qrImage;
  final String? redirectUrl;

  PaymentResponse({
    required this.orderId,
    required this.approvalUrl,
    this.qrImage,
    this.redirectUrl,
  });

  factory PaymentResponse.fromJson(Map<String, dynamic> json) {
    return PaymentResponse(
      orderId: json['orderID'] ?? json['paymentId'] ?? '',
      approvalUrl: json['approvalUrl'] ?? '',
      qrImage: json['qrImage'],
      redirectUrl: json['redirectUrl'],
    );
  }
}
