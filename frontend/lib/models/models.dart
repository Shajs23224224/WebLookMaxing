class Product {
  final String id;
  final String title;
  final String slug;
  final String description;
  final List<String> features;
  final double priceCop;
  final int durationDays;
  final List<String> images;
  final int? inventory;
  final String sku;
  final bool active;
  final DateTime createdAt;
  final DateTime updatedAt;

  Product({
    required this.id,
    required this.title,
    required this.slug,
    required this.description,
    required this.features,
    required this.priceCop,
    required this.durationDays,
    required this.images,
    this.inventory,
    required this.sku,
    required this.active,
    required this.createdAt,
    required this.updatedAt,
  });

  factory Product.fromJson(Map<String, dynamic> json) {
    return Product(
      id: json['id'] ?? '',
      title: json['title'] ?? '',
      slug: json['slug'] ?? '',
      description: json['description'] ?? '',
      features: List<String>.from(json['features'] ?? []),
      priceCop: (json['price_cop'] ?? 0).toDouble(),
      durationDays: json['duration_days'] ?? 0,
      images: List<String>.from(json['images'] ?? []),
      inventory: json['inventory'],
      sku: json['sku'] ?? '',
      active: json['active'] ?? true,
      createdAt: DateTime.parse(json['created_at'] ?? DateTime.now().toIso8601String()),
      updatedAt: DateTime.parse(json['updated_at'] ?? DateTime.now().toIso8601String()),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'slug': slug,
      'description': description,
      'features': features,
      'price_cop': priceCop,
      'duration_days': durationDays,
      'images': images,
      'inventory': inventory,
      'sku': sku,
      'active': active,
      'created_at': createdAt.toIso8601String(),
      'updated_at': updatedAt.toIso8601String(),
    };
  }

  String get formattedPrice {
    return 'COP \$${priceCop.toStringAsFixed(0)}';
  }

  String get mainImage {
    return images.isNotEmpty ? images.first : '';
  }
}

class CartItem {
  final String productId;
  final String title;
  final double priceCop;
  final String sku;
  final String image;
  int quantity;

  CartItem({
    required this.productId,
    required this.title,
    required this.priceCop,
    required this.sku,
    required this.image,
    this.quantity = 1,
  });

  factory CartItem.fromProduct(Product product, {int quantity = 1}) {
    return CartItem(
      productId: product.id,
      title: product.title,
      priceCop: product.priceCop,
      sku: product.sku,
      image: product.mainImage,
      quantity: quantity,
    );
  }

  double get total => priceCop * quantity;

  Map<String, dynamic> toJson() {
    return {
      'product_id': productId,
      'title': title,
      'price_cop': priceCop,
      'sku': sku,
      'image': image,
      'quantity': quantity,
    };
  }

  factory CartItem.fromJson(Map<String, dynamic> json) {
    return CartItem(
      productId: json['product_id'] ?? '',
      title: json['title'] ?? '',
      priceCop: (json['price_cop'] ?? 0).toDouble(),
      sku: json['sku'] ?? '',
      image: json['image'] ?? '',
      quantity: json['quantity'] ?? 1,
    );
  }

  CartItem copyWith({int? quantity}) {
    return CartItem(
      productId: productId,
      title: title,
      priceCop: priceCop,
      sku: sku,
      image: image,
      quantity: quantity ?? this.quantity,
    );
  }
}

class Order {
  final String orderId;
  final double totalCop;
  final String currency;
  final String status;

  Order({
    required this.orderId,
    required this.totalCop,
    required this.currency,
    required this.status,
  });

  factory Order.fromJson(Map<String, dynamic> json) {
    return Order(
      orderId: json['orderId'] ?? '',
      totalCop: (json['total_cop'] ?? 0).toDouble(),
      currency: json['currency'] ?? 'COP',
      status: json['status'] ?? 'pending',
    );
  }

  String get formattedTotal {
    return 'COP \$${totalCop.toStringAsFixed(0)}';
  }
}
