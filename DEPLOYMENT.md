# Guía de Despliegue en Railway

## 🚀 Despliegue Rápido

### 1. Preparación del Repositorio

```bash
# Asegúrate de que todos los archivos estén commitados
git add .
git commit -m "Initial deployment"
git push origin main
```

### 2. Conectar con Railway

#### Opción A: Railway CLI
```bash
# Instalar Railway CLI
npm install -g @railway/cli

# Login
railway login

# Inicializar proyecto
railway init

# Desplegar
railway up
```

#### Opción B: Railway Dashboard
1. Ve a [railway.app](https://railway.app)
2. Crea una nueva cuenta o inicia sesión
3. Haz clic en "New Project"
4. Selecciona "Deploy from GitHub repo"
5. Conecta tu repositorio
6. Railway detectará automáticamente que es un proyecto Node.js

### 3. Configurar Variables de Entorno

En Railway Dashboard, ve a la pestaña "Variables" y configura:

```env
ADMIN_TOKEN=your_admin_token_here
PREDICTION_API_URL=http://localhost:8000/predict
LOG_LEVEL=info
NODE_ENV=production
```

**Nota**: Railway automáticamente establece `PORT` y otras variables del sistema.

### 4. Verificar Despliegue

```bash
# Obtener URL del servicio
railway status

# Ver logs
railway logs

# Health check
curl https://your-service.railway.app/health
```

## 🔧 Configuración Avanzada

### Variables de Entorno Requeridas

| Variable | Descripción | Requerida | Ejemplo |
|----------|-------------|-----------|---------|
| `ADMIN_TOKEN` | Token para API Gateway | ✅ | `eyJhbGciOiJIUzI1NiIs...` |
| `PREDICTION_API_URL` | URL de API de predicción | ❌ | `http://localhost:8000/predict` |
| `LOG_LEVEL` | Nivel de logging | ❌ | `info` |
| `NODE_ENV` | Entorno de ejecución | ❌ | `production` |

### Configuración de Railway

El archivo `railway.json` incluye:

- **Builder**: NIXPACKS (detecta automáticamente Node.js)
- **Health Check**: `/health` endpoint
- **Restart Policy**: Reinicio automático en fallos
- **Start Command**: `npm start`

### Monitoreo y Logs

```bash
# Ver logs en tiempo real
railway logs --follow

# Ver métricas
railway status

# Escalar servicio
railway scale
```

## 🧪 Testing del Despliegue

### 1. Health Check
```bash
curl https://your-service.railway.app/health
```

Respuesta esperada:
```json
{
  "status": "OK",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "service": "prediction-service",
  "version": "1.0.0"
}
```

### 2. Status del Procesamiento
```bash
curl https://your-service.railway.app/predictions/status
```

### 3. Predicciones (Primera Ejecución)
```bash
curl https://your-service.railway.app/predictions/all
```

**Nota**: La primera ejecución puede tomar varios minutos mientras recolecta datos.

## 🔄 Actualizaciones

### Despliegue Automático
Railway detecta automáticamente cambios en el repositorio y despliega automáticamente.

### Despliegue Manual
```bash
# Forzar nuevo despliegue
railway up

# O desde GitHub
git push origin main
```

## 🛠️ Troubleshooting

### Problemas Comunes

1. **Error de Variables de Entorno**
   ```
   Error: ADMIN_TOKEN is required
   ```
   **Solución**: Configurar `ADMIN_TOKEN` en Railway Dashboard

2. **Timeout en Health Check**
   ```
   Health check failed
   ```
   **Solución**: Verificar que el servicio esté iniciando correctamente

3. **Error de Conexión a API Gateway**
   ```
   Error conectando con API Gateway
   ```
   **Solución**: Verificar `ADMIN_TOKEN` y conectividad

### Logs de Debug

```bash
# Ver logs detallados
railway logs --follow

# Filtrar por nivel
railway logs | grep ERROR
```

### Escalado

```bash
# Escalar a más recursos
railway scale --cpu 2 --memory 2GB

# Ver configuración actual
railway status
```

## 📊 Métricas y Monitoreo

### Métricas Disponibles
- **CPU Usage**: Uso de CPU del servicio
- **Memory Usage**: Uso de memoria
- **Request Count**: Número de peticiones
- **Response Time**: Tiempo de respuesta
- **Error Rate**: Tasa de errores

### Alertas
Configurar alertas en Railway Dashboard para:
- CPU > 80%
- Memory > 80%
- Error Rate > 5%
- Response Time > 30s

## 🔒 Seguridad

### Variables Sensibles
- `ADMIN_TOKEN`: Nunca committear al repositorio
- Usar Railway Variables para datos sensibles
- Rotar tokens regularmente

### Rate Limiting
- Configurado automáticamente
- 100 requests por 15 minutos por IP
- Backoff exponencial en errores

## 📈 Optimización

### Performance
- Cache en memoria para predicciones
- Timeouts configurados (30s)
- Retry automático con backoff

### Costos
- Railway cobra por uso de recursos
- Monitorear uso de CPU/Memory
- Optimizar código para reducir recursos

## 🆘 Soporte

### Recursos Útiles
- [Railway Documentation](https://docs.railway.app/)
- [Node.js Best Practices](https://nodejs.org/en/docs/guides/)
- [Express.js Security](https://expressjs.com/en/advanced/best-practices-security.html)

### Contacto
- Railway Support: [support@railway.app](mailto:support@railway.app)
- Railway Discord: [discord.gg/railway](https://discord.gg/railway) 