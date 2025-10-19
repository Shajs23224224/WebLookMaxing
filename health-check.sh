#!/bin/bash

# Script de verificación de salud del sistema Lookmaxing
# Uso: ./health-check.sh [environment]

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Función para verificar servicio HTTP
check_http_service() {
    local url="$1"
    local service_name="$2"
    local expected_status="${3:-200}"

    print_message "Verificando $service_name ($url)..."

    if command -v curl &> /dev/null; then
        local status_code
        status_code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$url" 2>/dev/null || echo "000")

        if [[ "$status_code" == "$expected_status" ]]; then
            print_success "$service_name responde correctamente (HTTP $status_code)"
            return 0
        else
            print_error "$service_name no responde correctamente (HTTP $status_code, esperado $expected_status)"
            return 1
        fi
    else
        print_warning "curl no disponible, omitiendo verificación HTTP"
        return 0
    fi
}

# Función para verificar servicio con health check
check_health_endpoint() {
    local base_url="$1"
    local service_name="$2"

    print_message "Verificando health check de $service_name..."

    local health_url="${base_url}/health"
    check_http_service "$health_url" "$service_name Health Check" "200"
}

# Función para verificar base de datos
check_database() {
    print_message "Verificando conexión a MongoDB..."

    if command -v mongosh &> /dev/null; then
        # Usar mongosh si está disponible
        if echo "db.adminCommand('ismaster')" | mongosh --quiet > /dev/null 2>&1; then
            print_success "MongoDB responde correctamente"
            return 0
        fi
    elif command -v mongo &> /dev/null; then
        # Usar mongo si está disponible (versión antigua)
        if echo "db.adminCommand('ismaster')" | mongo --quiet > /dev/null 2>&1; then
            print_success "MongoDB responde correctamente"
            return 0
        fi
    fi

    # Verificar si MongoDB está corriendo como servicio
    if pgrep mongod > /dev/null; then
        print_success "MongoDB está corriendo (mongod process encontrado)"
        return 0
    fi

    print_error "No se pudo verificar MongoDB"
    return 1
}

# Función para verificar Docker
check_docker() {
    print_message "Verificando Docker..."

    if command -v docker &> /dev/null; then
        if docker info > /dev/null 2>&1; then
            print_success "Docker está funcionando correctamente"
            return 0
        else
            print_error "Docker no responde correctamente"
            return 1
        fi
    else
        print_warning "Docker no está instalado"
        return 0
    fi
}

# Función para verificar servicios Docker
check_docker_services() {
    print_message "Verificando servicios Docker..."

    if command -v docker-compose &> /dev/null; then
        # Verificar si hay servicios corriendo
        if docker-compose ps -q | grep -q .; then
            print_success "Servicios Docker están corriendo"

            # Listar servicios activos
            echo "Servicios activos:"
            docker-compose ps --format "table {{.Service}}\t{{.Status}}\t{{.Ports}}"

            # Verificar cada servicio importante
            check_health_endpoint "http://localhost:3001" "Backend API"
            check_http_service "http://localhost:3000" "Frontend" "200"

            return 0
        else
            print_warning "No hay servicios Docker corriendo"
            return 0
        fi
    else
        print_warning "Docker Compose no está disponible"
        return 0
    fi
}

# Función para verificar Node.js
check_nodejs() {
    print_message "Verificando Node.js..."

    if command -v node &> /dev/null; then
        local version=$(node --version)
        print_success "Node.js está instalado ($version)"

        if command -v npm &> /dev/null; then
            local npm_version=$(npm --version)
            print_success "npm está instalado ($npm_version)"
            return 0
        else
            print_error "npm no está instalado"
            return 1
        fi
    else
        print_error "Node.js no está instalado"
        return 1
    fi
}

# Función para verificar dependencias del proyecto
check_project_dependencies() {
    print_message "Verificando dependencias del proyecto..."

    if [ -f "backend/package.json" ]; then
        cd backend

        if [ -d "node_modules" ]; then
            print_success "Dependencias del backend están instaladas"
        else
            print_warning "Dependencias del backend no están instaladas (ejecuta: npm install)"
        fi

        # Verificar si el proyecto se puede construir
        if npm run type-check > /dev/null 2>&1; then
            print_success "TypeScript compilation exitosa"
        else
            print_warning "Problemas de TypeScript detectados"
        fi

        cd ..
    else
        print_error "No se encontró backend/package.json"
    fi
}

# Función para verificar configuración de entorno
check_environment_config() {
    print_message "Verificando configuración de entorno..."

    local missing_vars=()

    # Variables críticas para desarrollo
    local critical_vars=(
        "JWT_SECRET"
        "MONGODB_URI"
    )

    for var in "${critical_vars[@]}"; do
        if [ -z "${!var}" ]; then
            missing_vars+=("$var")
        fi
    done

    if [ ${#missing_vars[@]} -eq 0 ]; then
        print_success "Todas las variables críticas de entorno están configuradas"
        return 0
    else
        print_warning "Variables de entorno faltantes: ${missing_vars[*]}"
        print_message "Copia .env.example a .env y configura las variables necesarias"
        return 1
    fi
}

# Función para ejecutar pruebas básicas
run_basic_tests() {
    print_message "Ejecutando pruebas básicas..."

    if [ -f "backend/package.json" ]; then
        cd backend

        # Ejecutar pruebas de linting
        if npm run lint > /tmp/lint-output.log 2>&1; then
            print_success "Linting exitoso"
        else
            print_warning "Problemas de linting encontrados"
            echo "Detalles del linting:"
            cat /tmp/lint-output.log | head -10
        fi

        cd ..
    fi
}

# Función principal
main() {
    local environment="${1:-development}"

    print_header "🔍 VERIFICACIÓN DE SALUD DEL SISTEMA LOOKMAXING"
    echo "Entorno: $environment"
    echo "Fecha: $(date)"
    echo ""

    local all_checks_passed=true

    # Ejecutar todas las verificaciones
    check_nodejs || all_checks_passed=false
    echo ""

    check_docker || all_checks_passed=false
    echo ""

    check_database || all_checks_passed=false
    echo ""

    check_docker_services || all_checks_passed=false
    echo ""

    check_project_dependencies || all_checks_passed=false
    echo ""

    check_environment_config || all_checks_passed=false
    echo ""

    run_basic_tests || all_checks_passed=false
    echo ""

    # Resumen final
    echo ""
    if $all_checks_passed; then
        print_success "✅ Todas las verificaciones pasaron correctamente"
        echo ""
        print_message "El sistema Lookmaxing está listo para usar."
        print_message ""
        print_message "Comandos útiles:"
        print_message "  Desarrollo: ./dev.sh start"
        print_message "  Tests: npm run test:all"
        print_message "  Despliegue: ./deploy.sh development"
    else
        print_error "❌ Algunas verificaciones fallaron"
        echo ""
        print_message "Revisa los errores anteriores y corrígelos antes de continuar."
        print_message ""
        print_message "Para ayuda: consulta la documentación en README.md"
        exit 1
    fi
}

# Función de encabezado
print_header() {
    echo -e "${BLUE}================================================${NC}"
    echo -e "${BLUE}🏥 Lookmaxing System Health Check${NC}"
    echo -e "${BLUE}================================================${NC}"
}

main "$@"
