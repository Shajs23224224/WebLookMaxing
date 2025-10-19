# 🚀 Desarrollo Local - Guía de Configuración

## ⚡ Inicio Rápido para Desarrollo

### 1. **Configurar Variables de Entorno**

```bash
# Copiar configuración de ejemplo
cp .env.example .env

# Editar .env con tus credenciales reales (opcional para desarrollo básico)
```

### 2. **Ejecutar con Docker (Recomendado)**

```bash
# Construir e iniciar todos los servicios
docker-compose -f docker-compose.dev.yml up --build

# Servicios disponibles:
# - Backend API: http://localhost:3001
# - Frontend Flutter: http://localhost:3000
# - Base de datos MongoDB: localhost:27017
# - Documentación API: http://localhost:3001/api/docs
```

### 3. **Ejecutar con Live Server (Alternativa)**

⚠️ **IMPORTANTE**: Para usar Live Server correctamente:

```bash
# 1. Navegar al directorio del frontend Flutter
cd frontend

# 2. Ejecutar Flutter Web
flutter run -d web-server --web-port 3000

# 3. O usar Live Server apuntando al directorio frontend/web/
# En VS Code: Click derecho en frontend/web/index.html → "Open with Live Server"
```

## 🔧 Desarrollo Frontend Flutter

### **Configuración Inicial**
```bash
cd frontend

# Instalar dependencias
flutter pub get

# Ejecutar en modo desarrollo
flutter run -d web-server --web-port 3000
```

### **Ejecutar con Live Server**
1. Abre VS Code en el directorio `frontend/`
2. Click derecho en `web/index.html`
3. Selecciona "Open with Live Server"
4. La aplicación se abrirá en `http://localhost:5500`

## 🔧 Desarrollo Backend Node.js

### **Configuración Inicial**
```bash
cd backend

# Instalar dependencias
npm install

# Ejecutar en modo desarrollo
npm run dev

# Ejecutar tests
npm test

# Construir para producción
npm run build
```

### **Variables de Entorno Requeridas**

```env
# Archivo .env (crear desde .env.example)
NODE_ENV=development
PORT=3001
MONGODB_URI=mongodb://admin:password123@mongodb:27017/lookmaxing?authSource=admin
JWT_SECRET=your-development-jwt-secret-key-minimum-32-characters-long
```

## 🐳 Desarrollo con Docker

### **Servicios Disponibles**
```bash
# Ver estado de servicios
docker-compose -f docker-compose.dev.yml ps

# Ver logs en tiempo real
docker-compose -f docker-compose.dev.yml logs -f

# Reiniciar servicios
docker-compose -f docker-compose.dev.yml restart

# Detener servicios
docker-compose -f docker-compose.dev.yml down
```

### **Acceso a Servicios**
- **Frontend Flutter**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **API Docs**: http://localhost:3001/api/docs
- **MongoDB**: localhost:27017

## 🧪 Testing

### **Tests Automatizados**
```bash
# Tests de integración
cd backend && npm run test:integration

# Tests de carga
./load-test.sh basic

# Monitoreo durante pruebas
./monitor.sh start
```

### **Verificación de Salud**
```bash
# Verificar que todo funciona correctamente
./health-check.sh
```

## 🛠️ Comandos Útiles

### **Desarrollo Diario**
```bash
# Iniciar desarrollo completo
./dev.sh start

# Construir para producción
./dev.sh build

# Detener desarrollo
./dev.sh stop
```

### **Base de Datos**
```bash
# Conectar a MongoDB
docker exec -it lookmaxing-mongodb mongo -u admin -p password123

# Ver datos de la aplicación
use lookmaxing
db.users.find().limit(5)
```

### **Logs y Debugging**
```bash
# Ver logs del backend
docker-compose -f docker-compose.dev.yml logs backend

# Ver logs del frontend
docker-compose -f docker-compose.dev.yml logs frontend

# Logs de sistema
./monitor.sh start
```

## 🚨 Solución de Problemas

### **Problema: Live Server no carga la aplicación Flutter**
**Solución**: Asegúrate de abrir Live Server desde el directorio `frontend/web/`, no desde la raíz del proyecto.

### **Problema: No se puede conectar a la base de datos**
**Solución**:
```bash
# Reiniciar servicios de Docker
docker-compose -f docker-compose.dev.yml down
docker-compose -f docker-compose.dev.yml up -d mongodb
docker-compose -f docker-compose.dev.yml up backend
```

### **Problema: Puerto ocupado**
**Solución**:
```bash
# Ver qué está usando el puerto
netstat -ano | findstr :3000
netstat -ano | findstr :3001

# Matar proceso si es necesario
taskkill /PID <PID> /F
```

### **Problema: Variables de entorno no cargan**
**Solución**:
```bash
# Verificar que .env existe y tiene permisos
dir .env*

# Recargar variables en la terminal
source .env 2>/dev/null || echo "Variables cargadas"
```

## 📝 Notas Importantes

1. **Archivo `.env`**: Nunca subas este archivo al repositorio (está en .gitignore)
2. **Base de datos**: Los datos se mantienen en Docker volumes, persisten entre reinicios
3. **Puerto 3000**: Reservado para Flutter Web
4. **Puerto 3001**: Reservado para Backend API
5. **Live Server**: Siempre abrir desde `frontend/web/` para proyectos Flutter

## 🎯 Próximos Pasos

1. ✅ Configurar variables de entorno básicas
2. ✅ Ejecutar servicios con Docker
3. ✅ Verificar funcionamiento con health check
4. 🚀 ¡Comenzar desarrollo!

---

**¿Necesitas ayuda adicional?** Consulta la [documentación completa](README.md) o los archivos específicos en `/docs/`.
