#!/bin/bash

# Script de desarrollo para Lookmaxing
# Uso: ./dev.sh [start|stop|restart|build|test]

set -e

# Función para mostrar ayuda
show_help() {
    echo "Uso: $0 [comando]"
    echo ""
    echo "Comandos disponibles:"
    echo "  start       Iniciar servicios de desarrollo"
    echo "  stop        Detener servicios de desarrollo"
    echo "  restart     Reiniciar servicios de desarrollo"
    echo "  build       Construir imágenes Docker"
    echo "  test        Ejecutar tests"
    echo "  setup       Configuración inicial (primera vez)"
    echo "  logs        Ver logs en tiempo real"
    echo "  status      Ver estado de servicios"
    echo "  clean       Limpiar contenedores e imágenes"
    echo ""
    echo "Ejemplos:"
    echo "  $0 start    # Iniciar desarrollo completo"
    echo "  $0 setup    # Primera configuración"
    echo "  $0 logs     # Ver logs"
}

# Función para verificar si archivo .env existe
check_env_file() {
    if [ ! -f ".env" ]; then
        echo "⚠️  Archivo .env no encontrado."
        echo "   Ejecuta primero: cp .env.example .env"
        echo "   Luego edita .env con tus credenciales"
        exit 1
    fi
}

# Función para iniciar servicios
start_services() {
    echo "🚀 Iniciando servicios de desarrollo..."
    check_env_file

    # Construir imágenes si no existen
    if ! docker images | grep -q "lookmaxing-backend" || ! docker images | grep -q "lookmaxing-frontend"; then
        echo "📦 Construyendo imágenes Docker..."
        docker-compose -f docker-compose.dev.yml build
    fi

    # Iniciar servicios
    docker-compose -f docker-compose.dev.yml up -d

    echo ""
    echo "✅ Servicios iniciados correctamente!"
    echo ""
    echo "🌐 URLs disponibles:"
    echo "   Frontend:     http://localhost:3000"
    echo "   Backend API:  http://localhost:3001"
    echo "   API Docs:     http://localhost:3001/api/docs"
    echo "   Health Check: http://localhost:3001/health"
    echo ""
    echo "📊 Estado de servicios:"
    docker-compose -f docker-compose.dev.yml ps
}

# Función para detener servicios
stop_services() {
    echo "🛑 Deteniendo servicios de desarrollo..."
    docker-compose -f docker-compose.dev.yml down
    echo "✅ Servicios detenidos"
}

# Función para reiniciar servicios
restart_services() {
    echo "🔄 Reiniciando servicios de desarrollo..."
    stop_services
    echo ""
    start_services
}

# Función para construir imágenes
build_images() {
    echo "🔨 Construyendo imágenes Docker..."
    check_env_file
    docker-compose -f docker-compose.dev.yml build
    echo "✅ Imágenes construidas correctamente"
}

# Función para ejecutar tests
run_tests() {
    echo "🧪 Ejecutando tests..."
    cd backend
    npm test
    cd ..
}

# Función para configuración inicial
initial_setup() {
    echo "⚙️  Ejecutando configuración inicial..."

    # Crear archivo .env si no existe
    if [ ! -f ".env" ]; then
        cp .env.example .env
        echo "✅ Archivo .env creado"
    fi

    # Crear directorios necesarios
    mkdir -p logs

    # Instalar dependencias del backend
    if [ -f "backend/package.json" ]; then
        cd backend
        npm install
        cd ..
        echo "✅ Dependencias del backend instaladas"
    fi

    echo ""
    echo "✅ Configuración inicial completada!"
    echo ""
    echo "📝 Próximos pasos:"
    echo "   1. Edita el archivo .env con tus credenciales reales"
    echo "   2. Ejecuta: $0 start"
    echo "   3. Abre http://localhost:3000 para ver la aplicación"
}

# Función para ver logs
show_logs() {
    echo "📋 Mostrando logs en tiempo real..."
    echo "   Presiona Ctrl+C para salir"
    echo ""
    docker-compose -f docker-compose.dev.yml logs -f
}

# Función para ver estado
show_status() {
    echo "📊 Estado de servicios:"
    docker-compose -f docker-compose.dev.yml ps
    echo ""
    echo "🔍 Información adicional:"
    echo "   Contenedores corriendo: $(docker-compose -f docker-compose.dev.yml ps -q | wc -l)"
    echo "   Imágenes disponibles: $(docker images | grep lookmaxing | wc -l)"
}

# Función para limpiar
clean_all() {
    echo "🧹 Limpiando contenedores e imágenes..."
    docker-compose -f docker-compose.dev.yml down --volumes --remove-orphans
    docker system prune -f
    echo "✅ Limpieza completada"
}

# Función principal
main() {
    case "${1:-help}" in
        start)
            start_services
            ;;
        stop)
            stop_services
            ;;
        restart)
            restart_services
            ;;
        build)
            build_images
            ;;
        test)
            run_tests
            ;;
        setup)
            initial_setup
            ;;
        logs)
            show_logs
            ;;
        status)
            show_status
            ;;
        clean)
            clean_all
            ;;
        help|*)
            show_help
            exit 0
            ;;
    esac
}

main "$@"
