import 'package:url_launcher/url_launcher.dart';
import 'package:webview_flutter/webview_flutter.dart';
import '../services/api_service.dart';
import '../models/models.dart';

enum PaymentMethod { paypal, nequi }

class PaymentService {
  static Future<PaymentResponse> createPayPalPayment({
    required String orderId,
    String? returnUrl,
    String? cancelUrl,
  }) async {
    return await ApiService.createPayPalPayment(
      orderId: orderId,
      returnUrl: returnUrl ?? 'https://lookmaxing.com/payment/success',
      cancelUrl: cancelUrl ?? 'https://lookmaxing.com/payment/cancel',
    );
  }

  static Future<PaymentResponse> createNequiPayment({
    required String orderId,
    required String phone,
    String? returnUrl,
  }) async {
    return await ApiService.createNequiPayment(
      orderId: orderId,
      phone: phone,
      returnUrl: returnUrl ?? 'https://lookmaxing.com/payment/success',
    );
  }

  static Future<void> launchPayPalPayment(String approvalUrl) async {
    if (await canLaunch(approvalUrl)) {
      await launch(approvalUrl, forceSafariVC: false, forceWebView: false);
    } else {
      throw Exception('Could not launch PayPal payment');
    }
  }

  static Future<void> launchNequiPayment(String redirectUrl) async {
    if (await canLaunch(redirectUrl)) {
      await launch(redirectUrl, forceSafariVC: false, forceWebView: false);
    } else {
      throw Exception('Could not launch Nequi payment');
    }
  }

  static String formatCurrency(double amount) {
    return 'COP \$${amount.toStringAsFixed(0)}';
  }

  static String getPaymentMethodName(PaymentMethod method) {
    switch (method) {
      case PaymentMethod.paypal:
        return 'PayPal';
      case PaymentMethod.nequi:
        return 'Nequi';
    }
  }

  static String getPaymentMethodIcon(PaymentMethod method) {
    switch (method) {
      case PaymentMethod.paypal:
        return 'assets/icons/paypal.png';
      case PaymentMethod.nequi:
        return 'assets/icons/nequi.png';
    }
  }
}
