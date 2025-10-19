# 🧪 Testing Suite - Integration & Load Tests

## 📋 Tabla de Contenidos

1. [Introducción](#introducción)
2. [Tests de Integración](#tests-de-integración)
3. [Tests de Carga](#tests-de-carga)
4. [Ejecución de Pruebas](#ejecución-de-pruebas)
5. [Monitoreo](#monitoreo)
6. [Análisis de Resultados](#análisis-de-resultados)
7. [Mejores Prácticas](#mejores-prácticas)

## 🎯 Introducción

Este proyecto incluye una suite completa de pruebas que cubren:

- **Tests de integración**: Validan que todos los componentes del sistema funcionen correctamente juntos
- **Tests de carga**: Evalúan el rendimiento bajo diferentes niveles de estrés
- **Tests de estrés**: Identifican puntos de quiebre bajo carga extrema
- **Tests de volumen**: Simulan tráfico real durante períodos extendidos

## 🔧 Tests de Integración

### 📁 Ubicación
```
backend/src/tests/integration.test.ts
```

### 🏗️ Arquitectura de Pruebas

Los tests de integración prueban flujos completos de usuario:

#### ✅ Flujos Probados

1. **Registro y Autenticación**
   ```typescript
   - Registro de nuevo usuario
   - Login exitoso
   - Actualización de perfil
   - Manejo de errores de autenticación
   ```

2. **Gestión de Productos**
   ```typescript
   - Creación de productos (admin)
   - Navegación y búsqueda
   - Actualización de inventario
   - Validación de stock
   ```

3. **Proceso de Compra**
   ```typescript
   - Creación de órdenes
   - Validación de inventario
   - Procesamiento de pagos
   - Confirmaciones automáticas
   ```

4. **Integración WhatsApp**
   ```typescript
   - Mensajes automáticos
   - Plantillas personalizadas
   - Seguimiento de estado
   - Base de datos de mensajes
   ```

5. **Panel Administrativo**
   ```typescript
   - Gestión de usuarios
   - Analytics y reportes
   - Control de acceso
   ```

### 🚨 Casos de Error Cubiertos

- **Conexión a base de datos fallida**
- **Solicitudes malformadas**
- **Rate limiting activado**
- **Stock insuficiente**
- **Credenciales inválidas**
- **Permisos insuficientes**

### 🛠️ Configuración de Tests

```typescript
// Configuración de MongoDB en memoria
beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

// Limpieza automática entre tests
beforeEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collection.deleteMany({});
  }
});
```

## ⚡ Tests de Carga

### 🛠️ Herramientas Utilizadas

- **Artillery**: Framework principal para pruebas de carga
- **Custom scripts**: Monitoreo y análisis avanzado
- **Sistema de reportes**: Generación automática de métricas

### 📊 Tipos de Pruebas de Carga

#### 1. **Prueba Básica** (`load-test-basic.yml`)
- **Usuarios concurrentes**: 5-20
- **Duración**: 8 minutos
- **Escenario**: Flujos típicos de usuario autenticado

#### 2. **Prueba Avanzada** (`load-test-advanced.yml`)
- **Usuarios concurrentes**: Hasta 200
- **Duración**: 15 minutos
- **Escenarios**: Estrés, resistencia, picos de carga

#### 3. **Prueba de Endpoints** (`load-test-endpoints.yml`)
- **Foco**: Endpoints específicos críticos
- **Objetivo**: Identificar bottlenecks individuales

#### 4. **Prueba Realista** (`load-test-realistic.yml`)
- **Simulación**: Tráfico de 24 horas
- **Patrones**: Comportamiento real de usuarios
- **Distribución**: 70% usuarios existentes, 20% nuevos, 10% admin

### 🎯 Métricas Monitoreadas

#### Métricas de Rendimiento
- **Tiempo de respuesta promedio**: < 250ms objetivo
- **Tiempo de respuesta máximo**: < 1000ms
- **Tasa de error**: < 1%
- **Throughput**: Requests por segundo

#### Métricas de Sistema
- **Uso de CPU**: < 70% promedio
- **Uso de memoria**: < 80% promedio
- **Conexiones de red**: Estabilidad
- **Load average**: < número de cores × 2

### 📈 Escenarios de Carga

#### Patrón de Usuario Realista
```yaml
- name: "Realistic user behavior"
  weight: 70  # 70% de usuarios siguen este patrón
  flow:
    - post: "/api/auth/login"
    - get: "/api/products"
    - get: "/api/products/{id}"
    - post: "/api/orders"  # Solo 20% llegan aquí
```

#### Comportamiento Administrativo
```yaml
- name: "Admin panel usage"
  weight: 10
  flow:
    - post: "/api/auth/login"
    - get: "/api/admin/analytics"
    - get: "/api/whatsapp/messages"
```

## 🚀 Ejecución de Pruebas

### Pruebas de Integración

```bash
# Ejecutar tests de integración
cd backend
npm test integration.test.ts

# Con cobertura
npm run test:coverage

# En modo watch (desarrollo)
npm run test:watch
```

### Pruebas de Carga

```bash
# Prueba básica
./load-test.sh basic

# Prueba avanzada
./load-test.sh advanced

# Prueba realista (24h simuladas)
./load-test.sh realistic

# Todas las pruebas
./load-test.sh --all

# Con directorio personalizado de reportes
./load-test.sh basic --output-dir ./custom-reports

# Contra entorno de producción
./load-test.sh basic --environment production
```

### Monitoreo Durante Pruebas

```bash
# Iniciar monitoreo
./monitor.sh start

# Ver métricas en tiempo real
./monitor.sh realtime

# Ver estado del monitoreo
./monitor.sh status

# Detener monitoreo
./monitor.sh stop

# Generar reporte final
./monitor.sh report
```

## 📊 Análisis de Resultados

### Interpretación de Métricas

#### Tiempos de Respuesta
```bash
# Excelente: < 100ms
# Bueno: 100-250ms
# Aceptable: 250-500ms
# Problema: > 500ms
```

#### Uso de Recursos
```bash
# CPU: < 50% (óptimo), < 70% (aceptable)
# Memoria: < 60% (óptimo), < 80% (aceptable)
# Load Average: < cores × 1.5 (óptimo)
```

### Reportes Generados

#### Reportes de Artillery
- **JSON**: Datos crudos detallados
- **HTML**: Visualización web interactiva
- **CSV**: Para análisis en Excel/Sheets

#### Reportes de Sistema
- **Métricas de CPU/Memoria**: Archivo CSV
- **Reportes de errores**: Logs detallados
- **Reportes de rendimiento**: Resúmenes ejecutivos

### 🔍 Identificación de Problemas

#### Cuellos de Botella Comunes
1. **Base de datos**: Consultas lentas, falta de índices
2. **CPU**: Procesamiento intensivo innecesario
3. **Memoria**: Memory leaks, objetos grandes
4. **Red**: Latencia alta, conexiones inestables
5. **Código**: Loops ineficientes, algoritmos subóptimos

## 🎛️ Configuración de Entorno

### Variables de Entorno para Testing

```bash
# Testing
NODE_ENV=test
MONGODB_URI=mongodb://localhost:27017/lookmaxing_test

# Logging mínimo durante tests
LOG_LEVEL=error

# Desactivar servicios externos en tests
MOCK_EXTERNAL_SERVICES=true
```

### Configuración de Producción

```bash
# Variables para pruebas de producción
ARTILLERY_CONFIG_TARGET=https://api.lookmaxing.com
MONITOR_PRODUCTION_METRICS=true
ENABLE_DETAILED_LOGGING=true
```

## 🛠️ Mejores Prácticas

### Desarrollo de Tests

1. **Tests Aislados**
   ```typescript
   // Cada test debe ser independiente
   beforeEach(async () => {
     // Limpieza completa
   });
   ```

2. **Mocks Inteligentes**
   ```typescript
   // Mock solo servicios externos
   jest.mock('../../services/whatsapp');
   jest.mock('../../services/firebase');
   ```

3. **Asserts Descriptivos**
   ```typescript
   // Mensajes claros en assertions
   expect(response.body.success).toBe(true);
   expect(errorMessage).toContain('Validation failed');
   ```

### Ejecución de Pruebas de Carga

1. **Ambiente Controlado**
   - Usa entornos dedicados para testing
   - No pruebes contra producción sin preparación

2. **Monitoreo Constante**
   ```bash
   # Siempre monitorea recursos durante pruebas
   ./monitor.sh start
   ./load-test.sh basic
   ./monitor.sh stop
   ```

3. **Análisis Incremental**
   - Empieza con pruebas pequeñas
   - Incrementa carga gradualmente
   - Identifica problemas paso a paso

### Mantenimiento

1. **Actualización Regular**
   ```bash
   # Ejecutar suite completa semanalmente
   ./load-test.sh --all
   npm run test
   ```

2. **Análisis de Tendencias**
   - Guarda históricos de métricas
   - Identifica degradación de rendimiento
   - Planifica mejoras proactivas

## 📋 Checklist de Testing

### Antes de Desplegar

- [ ] Tests de integración pasan (100% éxito)
- [ ] Tests de unidad pasan (cobertura > 80%)
- [ ] Pruebas de carga básicas pasan (tiempo < 250ms promedio)
- [ ] Pruebas de estrés identifican límites
- [ ] Monitoreo muestra uso de recursos aceptable

### Antes de Lanzamiento

- [ ] Pruebas de volumen (24h) simuladas correctamente
- [ ] Tests de recuperación (failover) funcionan
- [ ] Documentación de API actualizada
- [ ] Métricas de rendimiento documentadas

## 🚨 Solución de Problemas

### Problemas Comunes

#### Tests de Integración Fallan
```bash
# Verificar conexión a MongoDB
npm run test -- --testPathPattern=integration

# Debug detallado
DEBUG=* npm run test
```

#### Pruebas de Carga Lentas
```bash
# Optimizar configuración
# Reducir concurrencia inicialmente
# Verificar recursos del sistema
```

#### Memoria Insuficiente
```bash
# Monitorear uso de memoria
./monitor.sh start

# Optimizar configuración de Node.js
# Revisar código por memory leaks
```

## 📚 Recursos Adicionales

### Documentación Oficial
- [Artillery Documentation](https://artillery.io/docs/)
- [Jest Testing Guide](https://jestjs.io/docs/getting-started)
- [MongoDB Memory Server](https://nodkz.github.io/mongodb-memory-server/)

### Herramientas Relacionadas
- **K6**: Alternativa moderna a Artillery
- **Locust**: Para pruebas distribuidas
- **New Relic**: Monitoreo de producción
- **DataDog**: Observabilidad completa

---

**¡Felicitaciones!** 🎉 Ahora tienes una suite completa de pruebas que asegura la calidad y el rendimiento de tu aplicación Lookmaxing.

Para ejecutar las pruebas:

1. **Tests de integración**: `npm test` en el directorio backend
2. **Tests de carga**: `./load-test.sh basic`
3. **Monitoreo**: `./monitor.sh start`

¿Necesitas ayuda con algún aspecto específico de las pruebas?
