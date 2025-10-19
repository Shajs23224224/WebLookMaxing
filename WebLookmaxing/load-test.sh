#!/bin/bash

# Script para ejecutar pruebas de carga con Artillery
# Uso: ./load-test.sh [tipo] [opciones]

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

print_header() {
    echo -e "${PURPLE}================================================${NC}"
    echo -e "${PURPLE}🚀 Artillery Load Testing Suite${NC}"
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

show_help() {
    echo "Uso: $0 [tipo] [opciones]"
    echo ""
    echo "Tipos de prueba disponibles:"
    echo "  basic         Prueba básica de carga (usuarios normales)"
    echo "  advanced      Prueba avanzada con estrés y resistencia"
    echo "  endpoints     Prueba específica de endpoints críticos"
    echo "  realistic     Simulación de tráfico real de un día"
    echo "  whatsapp      Prueba específica de WhatsApp API"
    echo ""
    echo "Opciones:"
    echo "  --output-dir DIR    Directorio para reportes (por defecto: ./reports)"
    echo "  --environment ENV   Entorno (development/production)"
    echo "  --help             Mostrar esta ayuda"
    echo ""
    echo "Ejemplos:"
    echo "  $0 basic              # Ejecutar prueba básica"
    echo "  $0 advanced --output-dir ./custom-reports"
    echo "  $0 realistic --environment production"
}

# Función para verificar dependencias
check_dependencies() {
    print_message "Verificando dependencias..."

    if ! command -v artillery &> /dev/null; then
        print_error "Artillery no está instalado."
        print_message "Instálalo con: npm install -g artillery"
        exit 1
    fi

    if ! command -v jq &> /dev/null; then
        print_warning "jq no está instalado. Algunos reportes pueden no funcionar correctamente."
    fi

    print_success "Dependencias verificadas"
}

# Función para configurar entorno
setup_environment() {
    local env="${1:-development}"

    if [ "$env" = "production" ]; then
        print_warning "Ejecutando pruebas contra entorno de producción"
        echo "Asegúrate de que las variables de entorno estén configuradas correctamente"
        export ARTILLERY_CONFIG_TARGET="https://api.lookmaxing.com"
    else
        print_message "Ejecutando pruebas contra entorno de desarrollo"
        export ARTILLERY_CONFIG_TARGET="http://localhost:3001"
    fi
}

# Función para ejecutar prueba
run_test() {
    local test_type="$1"
    local output_dir="${2:-./reports}"
    local timestamp=$(date +"%Y%m%d_%H%M%S")

    print_message "Ejecutando prueba: $test_type"
    print_message "Directorio de reportes: $output_dir"

    # Crear directorio de reportes
    mkdir -p "$output_dir"

    # Archivo de configuración según el tipo
    local config_file="load-test-${test_type}.yml"

    if [ ! -f "$config_file" ]; then
        print_error "Archivo de configuración no encontrado: $config_file"
        exit 1
    fi

    # Ejecutar Artillery
    local report_file="${output_dir}/report_${test_type}_${timestamp}.json"

    print_message "Ejecutando Artillery..."
    artillery run "$config_file" --output "$report_file"

    # Generar reporte HTML si está disponible
    if command -v artillery &> /dev/null; then
        local html_report="${output_dir}/report_${test_type}_${timestamp}.html"
        artillery report "$report_file" --output "$html_report"
        print_message "Reporte HTML generado: $html_report"
    fi

    print_success "Prueba completada. Reporte guardado en: $report_file"

    # Mostrar resumen básico
    show_summary "$report_file"
}

# Función para mostrar resumen de resultados
show_summary() {
    local report_file="$1"

    if [ ! -f "$report_file" ]; then
        print_warning "Archivo de reporte no encontrado: $report_file"
        return
    fi

    print_message "Resumen de resultados:"
    echo ""

    # Extraer métricas clave usando jq si está disponible
    if command -v jq &> /dev/null; then
        echo -e "${BLUE}Métricas generales:${NC}"
        jq '.aggregate' "$report_file"

        echo ""
        echo -e "${BLUE}Códigos de respuesta:${NC}"
        jq '.aggregate.codes' "$report_file"

        echo ""
        echo -e "${BLUE}Tiempos de respuesta:${NC}"
        jq '.aggregate.responseTime' "$report_file"
    else
        print_warning "jq no está disponible. Instala jq para ver métricas detalladas."
        print_message "Reporte completo disponible en: $report_file"
    fi
}

# Función para ejecutar todas las pruebas
run_all_tests() {
    local output_dir="${1:-./reports}"

    print_header
    print_message "Ejecutando suite completa de pruebas de carga"

    local test_types=("basic" "advanced" "endpoints" "realistic" "whatsapp")

    for test_type in "${test_types[@]}"; do
        echo ""
        print_message "Ejecutando prueba: $test_type"
        echo "----------------------------------------"

        run_test "$test_type" "$output_dir"

        # Pausa entre pruebas
        if [ "$test_type" != "whatsapp" ]; then
            print_message "Pausa de 30 segundos antes de la siguiente prueba..."
            sleep 30
        fi
    done

    print_success "Suite completa de pruebas finalizada!"
    print_message "Todos los reportes están disponibles en: $output_dir"
}

# Función principal
main() {
    local test_type=""
    local output_dir="./reports"
    local environment="development"

    # Procesar argumentos
    while [[ $# -gt 0 ]]; do
        case $1 in
            basic|advanced|endpoints|realistic|whatsapp)
                test_type="$1"
                shift
                ;;
            --output-dir)
                output_dir="$2"
                shift 2
                ;;
            --environment)
                environment="$2"
                shift 2
                ;;
            --help)
                show_help
                exit 0
                ;;
            --all)
                run_all_tests "$output_dir"
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

    # Si no se especificó tipo de prueba, mostrar ayuda
    if [ -z "$test_type" ]; then
        print_warning "No se especificó tipo de prueba"
        show_help
        exit 1
    fi

    # Ejecutar flujo principal
    check_dependencies
    setup_environment "$environment"

    run_test "$test_type" "$output_dir"

    print_success "¡Prueba de carga completada exitosamente!"
    echo ""
    print_message "Para ejecutar la suite completa: $0 --all"
    print_message "Para ver ayuda: $0 --help"
}

# Ejecutar función principal con todos los argumentos
main "$@"
