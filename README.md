# Lookmaxing E-commerce Platform

Una plataforma completa de e-commerce para la venta de paquetes de lookmaxing, construida con Flutter Web y Node.js/Express.

## 🚀 Características Principales

- **Frontend**: Flutter Web exportado desde FlutterFlow
- **Backend**: Node.js/Express con TypeScript
- **Base de datos**: MongoDB + Firestore
- **Pagos**: PayPal y Nequi integrados
- **PWA**: Instalación como aplicación móvil
- **SEO**: Meta tags, OpenGraph, sitemap
- **Admin**: Panel de administración completo
- **Analytics**: Google Analytics 4 integrado

## 📋 Prerrequisitos

- Node.js 18+
- Flutter 3.16+
- MongoDB 5+
- Firebase CLI
- Cuenta de desarrollador PayPal
- Cuenta Nequi Conecta

## 🛠 Instalación y Configuración

### 1. Clonar el repositorio

```bash
git clone <repository-url>
cd lookmaxing
```

### 2. Configuración del Backend

```bash
cd backend
npm install
cp .env.example .env
# Editar .env con tus credenciales
```

**Variables de entorno requeridas:**

```env
# Server Configuration
PORT=3001
NODE_ENV=development

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/lookmaxing
FIREBASE_PROJECT_ID=your-firebase-project-id

# PayPal Configuration
PAYPAL_CLIENT_ID_SANDBOX=your-paypal-sandbox-client-id
PAYPAL_CLIENT_SECRET_SANDBOX=your-paypal-sandbox-client-secret
PAYPAL_CLIENT_ID_LIVE=your-paypal-live-client-id
PAYPAL_CLIENT_SECRET_LIVE=your-paypal-live-client-secret

# Nequi Configuration
NEQUI_CLIENT_ID_SANDBOX=your-nequi-sandbox-client-id
NEQUI_CLIENT_SECRET_SANDBOX=your-nequi-sandbox-client-secret
NEQUI_CLIENT_ID_LIVE=your-nequi-live-client-id
NEQUI_CLIENT_SECRET_LIVE=your-nequi-live-client-secret

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here
```

### 3. Configuración del Frontend

```bash
cd frontend
flutter pub get
```

### 4. Obtener credenciales de pago

#### PayPal
1. Ve a [PayPal Developer](https://developer.paypal.com/)
2. Crea una aplicación
3. Copia Client ID y Client Secret (Sandbox y Live)

#### Nequi
1. Solicita acceso a [Nequi Conecta](https://www.nequi.com.co/conecta)
2. Obtén las credenciales sandbox
3. Para producción, completa el proceso de certificación

## 🚀 Despliegue

### Desarrollo Local

```bash
# Backend
cd backend
npm run dev

# Frontend (otra terminal)
cd frontend
flutter run -d chrome
```

### Producción

```bash
# Construir Flutter Web
cd frontend
flutter build web --release

# Desplegar a Firebase Hosting
firebase deploy
```

## 📊 API Endpoints

### Productos
- `GET /api/products` - Lista de productos
- `GET /api/products/:id` - Detalle de producto
- `POST /api/products` - Crear producto (Admin)
- `PUT /api/products/:id` - Actualizar producto (Admin)
- `DELETE /api/products/:id` - Eliminar producto (Admin)

### Órdenes
- `POST /api/orders` - Crear orden
- `GET /api/orders` - Lista de órdenes (Auth/Admin)
- `GET /api/orders/:id` - Detalle de orden (Auth/Admin)

### Pagos
- `POST /api/payments/paypal/create` - Crear pago PayPal
- `POST /api/payments/nequi/create` - Crear pago Nequi
- `POST /api/payments/paypal/capture/:orderId` - Capturar pago PayPal

### Webhooks
- `POST /api/webhooks/paypal` - Webhook PayPal
- `POST /api/webhooks/nequi` - Webhook Nequi

### Admin
- `GET /api/admin/dashboard/stats` - Estadísticas del dashboard
- `GET /api/admin/orders` - Gestión de órdenes
- `GET /api/admin/products` - Gestión de productos
- `GET /api/admin/payments` - Logs de pagos

## 🛒 Flujo de Compra

1. **Selección de productos** - El usuario navega y selecciona paquetes
2. **Carrito de compras** - Gestión de items en el carrito
3. **Checkout** - Información de contacto y método de pago
4. **Procesamiento de pago** - Redirección a PayPal o generación de QR Nequi
5. **Confirmación** - Webhook confirma el pago y actualiza el estado
6. **Notificación** - Email de confirmación al usuario

## 🔐 Seguridad

- **HTTPS obligatorio** en producción
- **HSTS** habilitado
- **CSP** configurado
- **Rate limiting** implementado
- **Validación de webhooks** con firma digital
- **Variables sensibles** en variables de entorno
- **Autenticación JWT** para rutas protegidas

## 🧪 Pruebas

```bash
# Backend tests
cd backend
npm run test

# Frontend tests
cd frontend
flutter test

# E2E tests (si implementas)
npm run test:e2e
```

## 📱 PWA Características

- Instalación como aplicación nativa
- Funcionamiento offline básico
- Iconos adaptativos
- Tema de colores personalizado
- Splash screen

## 🔍 SEO

- Meta tags dinámicos
- OpenGraph para redes sociales
- Sitemap automático
- Robots.txt
- URLs amigables

## 📈 Analytics

- Google Analytics 4 integrado
- Seguimiento de conversiones
- Eventos personalizados
- E-commerce tracking

## 🛠 Desarrollo

### Estructura del Proyecto

```
lookmaxing/
├── backend/                 # API Node.js/Express
│   ├── src/
│   │   ├── controllers/     # Controladores de rutas
│   │   ├── middleware/      # Middleware personalizado
│   │   ├── models/         # Modelos de datos
│   │   ├── routes/         # Definición de rutas
│   │   ├── services/       # Servicios externos (PayPal, Nequi)
│   │   └── utils/          # Utilidades
│   ├── tests/              # Tests del backend
│   └── package.json
├── frontend/               # Flutter Web app
│   ├── lib/
│   │   ├── models/         # Modelos de datos
│   │   ├── services/       # Servicios de API
│   │   ├── screens/        # Pantallas de la app
│   │   └── widgets/        # Widgets reutilizables
│   ├── web/                # Archivos PWA
│   └── pubspec.yaml
└── .github/workflows/      # CI/CD pipeline
```

### Comandos Útiles

```bash
# FlutterFlow CLI (si usas)
flutterflow export-code . --project-id your-project-id

# Construir para diferentes plataformas
flutter build web --web-renderer html
flutter build apk --release
flutter build ios --release

# Firebase
firebase init hosting
firebase deploy

# Docker (si usas)
docker build -t lookmaxing .
docker run -p 3001:3001 lookmaxing
```

## 📋 Checklist de Despliegue

- [ ] Variables de entorno configuradas
- [ ] Credenciales de pago obtenidas
- [ ] Base de datos inicializada
- [ ] Productos de prueba creados
- [ ] Webhooks configurados en PayPal/Nequi
- [ ] SSL certificado instalado
- [ ] DNS apuntando correctamente
- [ ] Analytics configurado
- [ ] Tests ejecutados correctamente
- [ ] Backup strategy implementada

## 🆘 Solución de Problemas

### Error común: "Flutter Web not building"
```bash
flutter clean
flutter pub get
flutter build web --web-renderer html
```

### Error común: "MongoDB connection failed"
- Verificar conexión MongoDB
- Revisar variables de entorno
- Comprobar permisos de red

### Error común: "PayPal authentication failed"
- Verificar Client ID y Secret
- Confirmar ambiente (sandbox/production)
- Revisar permisos de la aplicación PayPal

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para más detalles.

## 📞 Soporte

Para soporte técnico, contacta al equipo de desarrollo o abre un issue en el repositorio.

---

**¡Gracias por usar Lookmaxing! 🚀**
