#!/bin/bash

# Script de monitoreo para pruebas de carga
# Uso: ./monitor.sh [start|stop|status]

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
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

# Función para iniciar monitoreo
start_monitoring() {
    print_message "Iniciando monitoreo del sistema..."

    # Crear directorio para métricas
    mkdir -p ./monitoring/metrics

    # Monitoreo básico del sistema
    {
        echo "Timestamp,CPU%,Memory%,Disk%,Network In,Network Out,Load Average"
        while true; do
            timestamp=$(date +"%Y-%m-%d %H:%M:%S")

            # CPU y Memoria (Linux)
            if command -v top &> /dev/null; then
                cpu=$(top -bn1 | grep "Cpu(s)" | sed "s/.*, *\([0-9.]*\)%* id.*/\1/" | awk '{print 100 - $1}')
                mem=$(free | awk 'NR==2{printf "%.2f", $3*100/$2 }')
            else
                cpu="N/A"
                mem="N/A"
            fi

            # Load average
            load=$(uptime | awk -F'load average:' '{ print $2 }' | sed 's/,//g')

            # Información de red (simplificada)
            net_in="N/A"
            net_out="N/A"

            echo "$timestamp,$cpu,$mem,N/A,$net_in,$net_out,$load"
            sleep 5
        done
    } > ./monitoring/metrics/system_metrics.csv &

    echo $! > ./monitoring/monitor.pid
    print_success "Monitoreo iniciado (PID: $(cat ./monitoring/monitor.pid))"
    print_message "Métricas se están guardando en: ./monitoring/metrics/system_metrics.csv"
}

# Función para detener monitoreo
stop_monitoring() {
    if [ -f ./monitoring/monitor.pid ]; then
        local pid=$(cat ./monitoring/monitor.pid)
        print_message "Deteniendo monitoreo (PID: $pid)..."

        kill $pid 2>/dev/null || true

        # Esperar a que termine
        wait $pid 2>/dev/null || true

        rm -f ./monitoring/monitor.pid
        print_success "Monitoreo detenido"
    else
        print_warning "No se encontró proceso de monitoreo activo"
    fi
}

# Función para mostrar estado
show_status() {
    echo -e "${PURPLE}Estado del monitoreo:${NC}"

    if [ -f ./monitoring/monitor.pid ]; then
        local pid=$(cat ./monitoring/monitor.pid)
        if ps -p $pid > /dev/null; then
            print_success "Monitoreo activo (PID: $pid)"
            print_message "Métricas se están guardando en: ./monitoring/metrics/"
        else
            print_warning "Archivo PID encontrado pero proceso no activo"
            rm -f ./monitoring/monitor.pid
        fi
    else
        print_message "Monitoreo no activo"
    fi

    # Mostrar métricas recientes si existen
    if [ -f ./monitoring/metrics/system_metrics.csv ]; then
        echo ""
        echo -e "${BLUE}Últimas métricas:${NC}"
        tail -5 ./monitoring/metrics/system_metrics.csv
    fi
}

# Función para mostrar métricas en tiempo real
show_realtime_metrics() {
    print_message "Mostrando métricas en tiempo real (Ctrl+C para salir)..."

    if [ -f ./monitoring/metrics/system_metrics.csv ]; then
        tail -f ./monitoring/metrics/system_metrics.csv
    else
        print_error "No se encontraron métricas. Inicia el monitoreo primero."
        exit 1
    fi
}

# Función para generar reporte de monitoreo
generate_report() {
    local output_file="./monitoring/load_test_report_$(date +%Y%m%d_%H%M%S).md"

    print_message "Generando reporte de monitoreo..."

    cat > "$output_file" << EOF
# Reporte de Monitoreo de Pruebas de Carga

**Fecha y hora:** $(date)
**Sistema:** $(uname -a)
**Procesador:** $(nproc) cores
**Memoria total:** $(free -h | awk 'NR==2{print $2}')

## Resumen de Métricas

EOF

    if [ -f ./monitoring/metrics/system_metrics.csv ]; then
        echo "### Estadísticas generales" >> "$output_file"
        echo "\`\`\`" >> "$output_file"
        tail -20 ./monitoring/metrics/system_metrics.csv >> "$output_file"
        echo "\`\`\`" >> "$output_file"
    fi

    print_success "Reporte generado: $output_file"
}

# Función principal
main() {
    case "${1:-status}" in
        start)
            start_monitoring
            ;;
        stop)
            stop_monitoring
            ;;
        status)
            show_status
            ;;
        realtime)
            show_realtime_metrics
            ;;
        report)
            generate_report
            ;;
        *)
            echo "Uso: $0 [start|stop|status|realtime|report]"
            echo ""
            echo "Comandos:"
            echo "  start     Iniciar monitoreo del sistema"
            echo "  stop      Detener monitoreo"
            echo "  status    Mostrar estado del monitoreo"
            echo "  realtime  Mostrar métricas en tiempo real"
            echo "  report    Generar reporte de monitoreo"
            exit 1
            ;;
    esac
}

main "$@"
