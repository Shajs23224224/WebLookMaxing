# Certificados SSL para Desarrollo Local

Este directorio contiene certificados SSL autofirmados para desarrollo local con `lookmaxing.com`.

## Archivos incluidos:

- `lookmaxing.com.crt` - Certificado SSL
- `lookmaxing.com.key` - Clave privada SSL

## Uso:

### Con Docker Compose:
Los certificados están montados automáticamente en el contenedor Nginx en `/etc/nginx/ssl/`.

### Para desarrollo local sin Docker:
1. Instala los certificados en tu sistema operativo
2. Configura tu servidor web para usarlos
3. Agrega `lookmaxing.com` a tu archivo `/etc/hosts` apuntando a `127.0.0.1`

## Generación de nuevos certificados:

```bash
# Generar nuevos certificados (válidos por 365 días)
openssl req -x509 -newkey rsa:4096 \
  -keyout lookmaxing.com.key \
  -out lookmaxing.com.crt \
  -days 365 -nodes \
  -subj "/C=US/ST=State/L=City/O=Organization/CN=lookmaxing.com"
```

## Notas de seguridad:

⚠️ **Estos certificados son para DESARROLLO únicamente**

- No uses estos certificados en producción
- Los navegadores mostrarán advertencias de seguridad
- Para producción, obtén certificados de una autoridad certificadora confiable (Let's Encrypt, etc.)

## Solución de problemas:

### Error "SSL certificate error" en navegador:
- Asegúrate de que el dominio en `/etc/hosts` coincida exactamente con el CN del certificado
- Reinicia tu servidor web después de instalar nuevos certificados

### Para desarrollo con HTTPS:
Si necesitas HTTPS en desarrollo sin Docker, considera usar herramientas como:
- `mkcert` (recomendado)
- `local-ssl-proxy`
- `ngrok` para túneles seguros
