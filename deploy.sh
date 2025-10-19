#!/bin/bash

# Script de despliegue automatizado para Lookmaxing
# Uso: ./deploy.sh [environment] [options]

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Función para imprimir mensajes con colores
print_header() {
    echo -e "${PURPLE}================================================${NC}"
    echo -e "${PURPLE}🚀 Lookmaxing Deployment Script${NC}"
    echo -e "${PURPLE}================================================${NC}"
    echo ""
}

print_message() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Función para mostrar ayuda
show_help() {
    echo "Uso: $0 [environment] [options]"
    echo ""
    echo "Entornos disponibles:"
    echo "  development    Despliegue en desarrollo (por defecto)"
    echo "  production     Despliegue en producción"
    echo "  staging        Despliegue en staging"
    echo ""
    echo "Opciones:"
    echo "  --build-only   Solo construir, no desplegar"
    echo "  --no-cache     No usar caché de Docker"
    echo "  --help         Mostrar esta ayuda"
    echo ""
    echo "Ejemplos:"
    echo "  $0 development     # Despliegue completo en desarrollo"
    echo "  $0 production      # Despliegue en producción"
    echo "  $0 --build-only    # Solo construir imágenes"
}

# Función para verificar dependencias
check_dependencies() {
    print_message "Verificando dependencias..."

    # Verificar Docker
    if ! command -v docker &> /dev/null; then
        print_error "Docker no está instalado. Por favor instala Docker primero."
        exit 1
    fi

    # Verificar Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose no está instalado. Por favor instala Docker Compose primero."
        exit 1
    fi

    # Verificar Git
    if ! command -v git &> /dev/null; then
        print_warning "Git no está instalado. Algunas funciones pueden no estar disponibles."
    fi

    print_success "Dependencias verificadas correctamente"
}

# Función para hacer backup de la base de datos (producción)
backup_database() {
    if [ "$ENVIRONMENT" = "production" ]; then
        print_message "Creando backup de la base de datos..."

        BACKUP_DIR="./backups"
        TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
        BACKUP_FILE="$BACKUP_DIR/mongodb_backup_$TIMESTAMP.archive"

        mkdir -p "$BACKUP_DIR"

        # Crear backup usando mongodump en el contenedor
        docker-compose -f docker-compose.prod.yml exec -T mongodb mongodump \
            --username admin \
            --password "$MONGO_PASSWORD" \
            --authenticationDatabase admin \
            --archive > "$BACKUP_FILE" 2>/dev/null || {
                print_warning "No se pudo crear backup automático. Continuando con despliegue..."
            }

        if [ -f "$BACKUP_FILE" ]; then
            print_success "Backup creado: $BACKUP_FILE"
        fi
    fi
}

# Función para validar configuración de producción
validate_production_config() {
    if [ "$ENVIRONMENT" = "production" ]; then
        print_message "Validando configuración de producción..."

        # Verificar variables críticas de entorno
        required_vars=(
            "FIREBASE_PROJECT_ID"
            "FIREBASE_CLIENT_EMAIL"
            "PAYPAL_CLIENT_ID_LIVE"
            "JWT_SECRET"
            "TWILIO_ACCOUNT_SID"
        )

        for var in "${required_vars[@]}"; do
            if [ -z "${!var}" ]; then
                print_error "Variable de entorno requerida no definida: $var"
                print_error "Por favor configura todas las variables en .env.production"
                exit 1
            fi
        done

        print_success "Configuración de producción validada"
    fi
}

# Función para construir imágenes
build_images() {
    print_message "Construyendo imágenes Docker..."

    BUILD_ARGS="--parallel"

    if [ "$NO_CACHE" = "true" ]; then
        BUILD_ARGS="$BUILD_ARGS --no-cache"
        print_message "Usando --no-cache para construcción limpia"
    fi

    # Construir backend
    print_message "Construyendo imagen del backend..."
    docker build $BUILD_ARGS -f Dockerfile.backend -t lookmaxing-backend:latest .

    # Construir frontend
    print_message "Construyendo imagen del frontend..."
    docker build $BUILD_ARGS -f Dockerfile.frontend -t lookmaxing-frontend:latest .

    print_success "Imágenes construidas correctamente"
}

# Función para ejecutar tests
run_tests() {
    print_message "Ejecutando tests..."

    # Ejecutar tests del backend
    docker run --rm \
        -v "$(pwd)/backend:/app" \
        -w /app \
        lookmaxing-backend:latest \
        npm test || {
            print_warning "Algunos tests fallaron. Continuando con despliegue..."
        }

    print_success "Tests ejecutados"
}

# Función para desplegar servicios
deploy_services() {
    print_message "Desplegando servicios en $ENVIRONMENT..."

    COMPOSE_FILE="docker-compose.dev.yml"

    if [ "$ENVIRONMENT" = "production" ]; then
        COMPOSE_FILE="docker-compose.prod.yml"
    elif [ "$ENVIRONMENT" = "staging" ]; then
        COMPOSE_FILE="docker-compose.staging.yml"
    fi

    # Detener servicios existentes
    print_message "Deteniendo servicios existentes..."
    docker-compose -f $COMPOSE_FILE down 2>/dev/null || true

    # Iniciar servicios
    print_message "Iniciando servicios..."
    docker-compose -f $COMPOSE_FILE up -d

    # Esperar a que los servicios estén listos
    print_message "Esperando a que los servicios estén listos..."
    sleep 10

    # Verificar estado de servicios
    if docker-compose -f $COMPOSE_FILE ps | grep -q "Up"; then
        print_success "Servicios desplegados correctamente"

        # Mostrar información útil
        echo ""
        echo -e "${GREEN}================================================${NC}"
        echo -e "${GREEN}🎉 Despliegue completado exitosamente!${NC}"
        echo -e "${GREEN}================================================${NC}"
        echo ""

        if [ "$ENVIRONMENT" = "production" ]; then
            print_message "URLs de producción:"
            print_message "  - Frontend: https://lookmaxing.com"
            print_message "  - API: https://api.lookmaxing.com"
            print_message "  - Documentación: https://api.lookmaxing.com/api/docs"
        else
            print_message "URLs de desarrollo:"
            print_message "  - Frontend: http://localhost:3000"
            print_message "  - API: http://localhost:3001"
            print_message "  - Documentación: http://localhost:3001/api/docs"
        fi

        echo ""
        print_message "Health Check:"
        curl -s http://localhost:3001/health | jq . 2>/dev/null || echo "Health check disponible en /health"
    else
        print_error "Algunos servicios no se iniciaron correctamente"
        print_message "Verificando logs..."
        docker-compose -f $COMPOSE_FILE logs --tail=50
        exit 1
    fi
}

# Función para limpiar recursos antiguos
cleanup_resources() {
    print_message "Limpiando recursos antiguos..."

    # Limpiar imágenes dangling
    docker image prune -f

    # Limpiar contenedores detenidos
    docker container prune -f

    # Limpiar redes no utilizadas (excepto las que necesitamos)
    docker network prune -f

    print_success "Limpieza completada"
}

# Función para verificar despliegue
verify_deployment() {
    print_message "Verificando despliegue..."

    # Verificar health check del backend
    if curl -f http://localhost:3001/health > /dev/null 2>&1; then
        print_success "Backend responde correctamente"
    else
        print_error "Backend no responde"
        return 1
    fi

    # Verificar que Nginx esté sirviendo el frontend
    if curl -f -I http://localhost/ | grep -q "200\|301\|302"; then
        print_success "Frontend se sirve correctamente"
    else
        print_error "Frontend no se sirve correctamente"
        return 1
    fi

    # Verificar documentación de API
    if curl -f http://localhost:3001/api/docs > /dev/null 2>&1; then
        print_success "Documentación de API disponible"
    else
        print_warning "Documentación de API no disponible"
    fi

    print_success "Verificación completada"
}

# Función principal
main() {
    # Configuración por defecto
    ENVIRONMENT="${1:-development}"
    BUILD_ONLY="false"
    NO_CACHE="false"

    # Procesar argumentos
    shift
    while [[ $# -gt 0 ]]; do
        case $1 in
            --build-only)
                BUILD_ONLY="true"
                shift
                ;;
            --no-cache)
                NO_CACHE="true"
                shift
                ;;
            --help)
                show_help
                exit 0
                ;;
            *)
                print_error "Opción desconocida: $1"
                show_help
                exit 1
                ;;
        esac
    done

    print_header
    print_message "Iniciando despliegue en entorno: $ENVIRONMENT"

    # Ejecutar pasos de despliegue
    check_dependencies

    if [ "$ENVIRONMENT" = "production" ]; then
        validate_production_config
        backup_database
    fi

    build_images

    if [ "$BUILD_ONLY" = "false" ]; then
        run_tests
        deploy_services
        verify_deployment
        cleanup_resources

        print_success "¡Despliegue completado exitosamente!"
        echo ""
        print_message "Para ver logs en tiempo real: docker-compose logs -f"
        print_message "Para detener servicios: docker-compose down"
        print_message "Para ver estado: docker-compose ps"
    else
        print_success "Construcción completada. Usa --deploy para desplegar."
    fi
}

# Ejecutar función principal
main "$@"
