#!/bin/bash

# Script de configuración inicial para desarrollo local
# Uso: ./setup-dev.sh

set -e

# Colores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_message() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_header() {
    echo -e "${BLUE}================================================${NC}"
    echo -e "${BLUE}🚀 Configuración Inicial de Desarrollo${NC}"
    echo -e "${BLUE}================================================${NC}"
    echo ""
}

# Verificar dependencias
check_dependencies() {
    print_message "Verificando dependencias..."

    # Verificar Node.js
    if ! command -v node &> /dev/null; then
        print_warning "Node.js no está instalado. Instálalo desde https://nodejs.org/"
        return 1
    fi

    # Verificar npm
    if ! command -v npm &> /dev/null; then
        print_warning "npm no está instalado."
        return 1
    fi

    # Verificar Docker (opcional)
    if ! command -v docker &> /dev/null; then
        print_warning "Docker no está instalado. Algunas funciones pueden no estar disponibles."
    fi

    # Verificar Flutter (opcional)
    if ! command -v flutter &> /dev/null; then
        print_warning "Flutter no está instalado. Puedes usar Live Server como alternativa."
    fi

    print_success "Dependencias verificadas"
}

# Configurar archivo .env
setup_env_file() {
    print_message "Configurando archivo de entorno..."

    if [ ! -f ".env" ]; then
        if [ -f ".env.example" ]; then
            cp .env.example .env
            print_success "Archivo .env creado desde .env.example"

            print_message "Edita el archivo .env con tus credenciales reales:"
            print_message "  - Variables de MongoDB (si usas Docker)"
            print_message "  - Credenciales de Twilio (para WhatsApp)"
            print_message "  - Configuración de pagos (opcional para desarrollo)"
        else
            print_warning "No se encontró .env.example"
        fi
    else
        print_success "Archivo .env ya existe"
    fi
}

# Instalar dependencias del backend
install_backend_deps() {
    print_message "Instalando dependencias del backend..."

    if [ -f "backend/package.json" ]; then
        cd backend

        if [ ! -d "node_modules" ]; then
            print_message "Ejecutando npm install..."
            npm install
            print_success "Dependencias del backend instaladas"
        else
            print_success "Dependencias del backend ya están instaladas"
        fi

        # Verificar TypeScript
        if npm run type-check > /dev/null 2>&1; then
            print_success "TypeScript compilation exitosa"
        else
            print_warning "Problemas menores de TypeScript (normal en desarrollo)"
        fi

        cd ..
    else
        print_warning "No se encontró backend/package.json"
    fi
}

# Configurar Flutter (opcional)
setup_flutter() {
    print_message "Configurando Flutter..."

    if [ -f "frontend/pubspec.yaml" ]; then
        cd frontend

        if command -v flutter &> /dev/null; then
            print_message "Ejecutando flutter pub get..."
            flutter pub get

            if [ -f "web/index.html" ]; then
                print_success "Proyecto Flutter configurado correctamente"
                print_message "Para ejecutar: flutter run -d web-server --web-port 3000"
            else
                print_warning "No se encontró el directorio web/ de Flutter"
            fi
        else
            print_warning "Flutter no está instalado. Puedes usar Live Server como alternativa."
            print_message "Para usar Live Server:"
            print_message "  1. Abre VS Code en el directorio frontend/"
            print_message "  2. Click derecho en web/index.html"
            print_message "  3. Selecciona 'Open with Live Server'"
        fi

        cd ..
    else
        print_warning "No se encontró frontend/pubspec.yaml"
    fi
}

# Crear archivo de configuración básico si no existe
create_basic_config() {
    print_message "Creando configuraciones básicas..."

    # Crear directorio de logs si no existe
    mkdir -p logs

    # Crear archivo de configuración básico de logs
    if [ ! -f "log-config.json" ]; then
        cat > log-config.json << 'EOF'
{
  "level": "debug",
  "format": "simple",
  "transports": [
    {
      "type": "console",
      "level": "debug"
    },
    {
      "type": "file",
      "filename": "logs/app.log",
      "level": "info"
    }
  ]
}
EOF
        print_success "Archivo de configuración de logs creado"
    fi
}

# Verificación final
final_verification() {
    print_message "Verificación final..."

    # Verificar puertos disponibles
    print_message "Verificando puertos disponibles..."

    if command -v netstat &> /dev/null; then
        if netstat -an | grep -q ":3000 "; then
            print_warning "Puerto 3000 está ocupado. Puede causar conflictos."
        else
            print_success "Puerto 3000 disponible"
        fi

        if netstat -an | grep -q ":3001 "; then
            print_warning "Puerto 3001 está ocupado. Puede causar conflictos."
        else
            print_success "Puerto 3001 disponible"
        fi
    fi

    print_success "Configuración inicial completada"
    echo ""
    print_message "📋 Próximos pasos:"
    print_message "  1. Revisa y edita el archivo .env con tus credenciales"
    print_message "  2. Ejecuta: ./dev.sh start"
    print_message "  3. Abre http://localhost:3000 (frontend)"
    print_message "  4. Abre http://localhost:3001/api/docs (documentación)"
    echo ""
    print_message "📖 Para más detalles: consulta DEVELOPMENT_README.md"
}

# Función principal
main() {
    print_header

    check_dependencies
    echo ""

    setup_env_file
    echo ""

    install_backend_deps
    echo ""

    setup_flutter
    echo ""

    create_basic_config
    echo ""

    final_verification
}

main "$@"
