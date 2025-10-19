# 📱 WhatsApp Integration Guide

## Configuración de WhatsApp Business API con Twilio

Para integrar WhatsApp en tu aplicación Lookmaxing, necesitarás configurar una cuenta de Twilio con WhatsApp Business API.

### 1. Crear cuenta de Twilio

1. Ve a [www.twilio.com](https://www.twilio.com) y crea una cuenta
2. Ve a la consola de Twilio y obtén tu:
   - **Account SID**
   - **Auth Token**
   - **Phone Number** (número de WhatsApp habilitado)

### 2. Configurar variables de entorno

Agrega estas variables a tu archivo `.env`:

```env
# WhatsApp/Twilio Configuration
TWILIO_ACCOUNT_SID=tu-account-sid-aqui
TWILIO_AUTH_TOKEN=tu-auth-token-aqui
TWILIO_PHONE_NUMBER=+573123161080
```

### 3. Configurar WhatsApp Business

1. En la consola de Twilio, ve a "Messaging" → "WhatsApp"
2. Conecta tu número de WhatsApp Business
3. Configura el webhook para recibir mensajes (opcional)

## 🚀 Uso de la API de WhatsApp

### Endpoints disponibles:

#### Enviar mensaje básico
```bash
POST /api/whatsapp/send
Content-Type: application/json

{
  "to": "+573123161080",
  "message": "Hola! Gracias por contactar Lookmaxing"
}
```

#### Enviar mensaje de bienvenida
```bash
POST /api/whatsapp/templates/welcome
Content-Type: application/json

{
  "to": "+573123161080",
  "customerName": "María"
}
```

#### Enviar confirmación de orden
```bash
POST /api/whatsapp/templates/order-confirmation
Content-Type: application/json

{
  "to": "+573123161080",
  "orderId": "ORD-001",
  "total": 99.99
}
```

#### Enviar mensaje de soporte
```bash
POST /api/whatsapp/templates/support
Content-Type: application/json

{
  "to": "+573123161080",
  "issue": "Tengo un problema con mi orden"
}
```

#### Obtener mensajes
```bash
GET /api/whatsapp/messages?limit=20&page=1&status=sent
```

#### Ver estado de mensaje
```bash
GET /api/whatsapp/messages/{messageId}/status
```

## 📊 Funcionalidades implementadas

### ✅ **Mensajes automáticos**
- Mensaje de bienvenida para nuevos clientes
- Confirmación de órdenes con detalles
- Mensajes de soporte técnico
- Recordatorios de citas

### ✅ **Gestión de mensajes**
- Almacenamiento en base de datos
- Seguimiento de estado (enviado/entregado/leído)
- Relación con usuarios y órdenes
- Paginación y filtros

### ✅ **Plantillas de mensajes**
- Mensajes personalizables
- Formato automático de números telefónicos
- Manejo de errores y reintentos

## 🔧 Configuración avanzada

### Webhooks (opcional)

Para recibir mensajes automáticamente, configura un webhook en Twilio apuntando a:
```
https://tu-dominio.com/api/webhooks/whatsapp
```

### Límites y restricciones

- **Rate limiting**: Máximo 100 mensajes por ventana de 15 minutos
- **Longitud máxima**: 4096 caracteres por mensaje
- **Tipos de medios**: Imágenes, documentos, audio, video
- **Número de WhatsApp**: Configurado para +57 3123161080

## 🛠️ Desarrollo local

Para desarrollo local sin costos de Twilio:

1. Usa el simulador de Twilio (ngrok + webhook.site)
2. Configura variables de entorno de prueba
3. Los mensajes se registrarán pero no se enviarán

## 📋 Ejemplos de uso

### Desde el frontend

```javascript
// Enviar mensaje personalizado
const response = await fetch('/api/whatsapp/send', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    to: '+573123161080',
    message: 'Gracias por tu consulta. Te contactaremos pronto.',
    userId: userId
  })
});

// Enviar confirmación automática de orden
const orderResponse = await fetch('/api/whatsapp/templates/order-confirmation', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    to: customerPhone,
    orderId: order.id,
    total: order.total
  })
});
```

## 📈 Métricas y monitoreo

- Todos los mensajes se almacenan en MongoDB
- Logs detallados de envío y errores
- Estado de entrega rastreable
- Estadísticas de uso disponibles en `/api/whatsapp/messages`

## 🔒 Seguridad

- Validación estricta de números telefónicos
- Sanitización de mensajes
- Límites de rate para prevenir abuso
- Logs de auditoría para cumplimiento

## 🚨 Solución de problemas

### Error común: "Invalid phone number"
- Asegúrate de incluir el código de país (+57 para Colombia)
- Verifica que el número esté en formato internacional

### Error común: "Authentication failed"
- Verifica que tu Account SID y Auth Token sean correctos
- Asegúrate de que el número esté habilitado para WhatsApp

### Error común: "Message failed"
- Verifica los límites de Twilio
- Revisa los logs para detalles específicos del error

## 📚 Recursos adicionales

- [Documentación oficial de Twilio WhatsApp](https://www.twilio.com/docs/whatsapp)
- [API Reference completa](http://localhost:3001/api/docs)
- [Ejemplos de código en el repositorio](https://github.com/tu-usuario/lookmaxing)
