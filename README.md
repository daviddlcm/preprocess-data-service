# Microservicio de Predicción de Abandono - RunInsight

Microservicio en Node.js con Express para predicción de abandono de usuarios que se despliega en Railway.

## 🚀 Características

- **Conectividad con API Gateway**: Integración completa con `api-gateway-runinsight-production.up.railway.app`
- **Recolección de datos**: Recopila datos de múltiples servicios usando token de administrador
- **Cálculo automático**: Variables compuestas calculadas automáticamente
- **Predicciones inteligentes**: Usa API local de predicción con fallback
- **Rate limiting**: Manejo inteligente de límites de peticiones
- **Cache en memoria**: Almacenamiento temporal durante ejecución
- **Logging detallado**: Sistema completo de logs con Winston

## 📋 Funcionalidades

### Endpoints Principales

- `GET /predictions/all` - Obtener predicciones de todos los usuarios
- `GET /predictions/user/:id` - Predicción de usuario específico
- `POST /predictions/refresh` - Forzar recálculo de predicciones
- `GET /predictions/status` - Estado del procesamiento
- `GET /predictions/metadata` - Solo metadata de predicciones
- `GET /health` - Health check del servicio

### Variables Compuestas Calculadas

- `ratio_actividad = dias_activo / 7`
- `intensidad_uso = tiempo_total / vistas_abiertas`
- `consistencia_entrenamiento = entrenamientos / dias_activo`
- `tendencia_tiempo = 0` (placeholder)
- `tendencia_vistas = 0` (placeholder)
- `tendencia_entrenamientos = 0` (placeholder)

## 🏗️ Arquitectura

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   API Gateway   │    │  Prediction API  │    │  Data Processor │
│   (External)    │◄──►│   (Local/Remote) │◄──►│   (In-Memory)   │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│  User Data      │    │  Prediction      │    │  Cache &        │
│  Collection     │    │  Engine          │    │  Metadata       │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## 🚀 Despliegue en Railway

### 1. Preparación

```bash
# Clonar repositorio
git clone <repository-url>
cd service-data-preprocess

# Instalar dependencias
npm install
```

### 2. Variables de Entorno

Crear archivo `.env` basado en `env.example`:

```env
PORT=3000
NODE_ENV=production
ADMIN_TOKEN=your_admin_token_here
PREDICTION_API_URL=http://localhost:8000/predict
LOG_LEVEL=info
```

### 3. Despliegue

```bash
# Railway CLI
railway login
railway init
railway up

# O usar Railway Dashboard
# 1. Conectar repositorio en Railway
# 2. Configurar variables de entorno
# 3. Deploy automático
```

## 📊 Estructura de Respuesta

### Predicción Individual

```json
{
  "user_id": 123,
  "prediccion_abandono": false,
  "probabilidad_abandono": 0.15,
  "confianza_ensemble": 0.85,
  "riesgo": "Bajo",
  "modelos_abandono": 2,
  "total_modelos": 15,
  "es_anomalia": false,
  "recomendaciones": ["Mantener engagement", "Contenido premium"],
  "datos_originales": {
    "tiempo_total": 120.5,
    "vistas_abiertas": 15,
    "entrenamientos": 8
  }
}
```

### Predicciones Múltiples

```json
{
  "predictions": [...],
  "metadata": {
    "total_usuarios": 12,
    "usuarios_altos_riesgo": 3,
    "usuarios_medios_riesgo": 2,
    "usuarios_bajos_riesgo": 7,
    "timestamp": "2024-01-15T10:30:00"
  }
}
```

## 🔧 Configuración

### Variables de Entorno Requeridas

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `ADMIN_TOKEN` | Token para API Gateway | `eyJhbGciOiJIUzI1NiIs...` |
| `PREDICTION_API_URL` | URL de API de predicción | `http://localhost:8000/predict` |
| `PORT` | Puerto del servidor | `3000` |
| `LOG_LEVEL` | Nivel de logging | `info` |

### Endpoints de API Gateway

- `GET /users/{id}` - Datos de usuario
- `GET /engagement/stats/{id}` - Estadísticas de engagement
- `GET /trainings/user/{id}` - Datos de entrenamientos
- `GET /chatbot/text-mining/stats/{userId}/weekly` - Stats de chatbot
- `GET /engagement/analytics/{id}` - Analytics de engagement

## 🛡️ Manejo de Errores

### Rate Limiting
- Delays automáticos entre peticiones (3-4 segundos)
- Backoff exponencial en errores 429
- Retry automático con límite de intentos

### Timeouts
- 30 segundos por petición
- Continuación con datos parciales si un servicio falla
- Logging detallado de errores

### Fallbacks
- Predicción por defecto si falla la API de predicción
- Datos por defecto si falla la recolección
- Cache expirado automáticamente

## 📈 Monitoreo

### Health Check
```bash
curl https://your-service.railway.app/health
```

### Estado del Procesamiento
```bash
curl https://your-service.railway.app/predictions/status
```

### Logs
Los logs se almacenan en:
- Console (desarrollo)
- `logs/error.log` (errores)
- `logs/combined.log` (todos)

## 🔄 Ejecución Semanal

El servicio está diseñado para ejecutarse una vez por semana:

1. **Recolección**: Obtiene datos de todos los usuarios
2. **Procesamiento**: Calcula variables compuestas
3. **Predicción**: Genera predicciones de abandono
4. **Cache**: Almacena resultados en memoria
5. **Disponibilidad**: Endpoints disponibles para consulta

## 🧪 Testing

```bash
# Tests unitarios
npm test

# Desarrollo local
npm run dev

# Producción
npm start
```

## 📝 Notas de Implementación

- **Sin persistencia**: Los datos solo se almacenan en memoria durante la ejecución
- **Microservicio independiente**: No requiere base de datos externa
- **Escalabilidad**: Diseñado para Railway con auto-scaling
- **Seguridad**: Helmet, CORS, rate limiting implementados
- **Observabilidad**: Logging completo y health checks

## 🤝 Contribución

1. Fork el repositorio
2. Crear feature branch (`git checkout -b feature/amazing-feature`)
3. Commit cambios (`git commit -m 'Add amazing feature'`)
4. Push al branch (`git push origin feature/amazing-feature`)
5. Abrir Pull Request

## 📄 Licencia

MIT License - ver archivo LICENSE para detalles. 