# RunInsight Prediction Service API - Documentación

## 📚 Descripción General

El **RunInsight Prediction Service** es un microservicio desarrollado en Node.js + Express que se encarga de recolectar datos de múltiples servicios, calcular variables compuestas y generar predicciones de abandono de usuarios.

## 🚀 Características Principales

- **Recolección de datos**: Conecta con API Gateway para obtener datos de usuarios, engagement, entrenamientos y chatbot
- **Cálculo automático**: Genera variables compuestas como ratio de actividad, intensidad de uso, etc.
- **Predicciones inteligentes**: Utiliza modelos de machine learning para predecir riesgo de abandono
- **Cache inteligente**: Almacena resultados por 1 hora para optimizar rendimiento
- **Rate limiting**: Manejo inteligente de límites de peticiones
- **Logging detallado**: Sistema completo de logs con Winston

## 📋 Endpoints Principales

### 🔍 Health Check
- `GET /health` - Verificación del estado del servicio

### 📊 Predicciones
- `GET /predictions/all` - Obtener predicciones de todos los usuarios
- `GET /predictions/user/{id}` - Predicción de usuario específico
- `POST /predictions/refresh` - Forzar recálculo de predicciones

### 🔧 Diagnósticos
- `GET /predictions/status` - Estado del procesamiento
- `GET /predictions/endpoints-status` - Estado de endpoints masivos
- `GET /predictions/auth-test` - Test de autenticación y endpoints

## 🔐 Autenticación

Todos los endpoints que requieren datos del API Gateway necesitan un **token de administrador** en el header:

```
token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 📊 Estructura de Respuesta

### Predicción Individual
```json
{
  "user_id": 2,
  "prediccion_abandono": false,
  "probabilidad_abandono": 0.5,
  "confianza_ensemble": 0.75,
  "riesgo": "Medio",
  "modelos_abandono": 1,
  "total_modelos": 1,
  "es_anomalia": false,
  "recomendaciones": ["Reactivar usuario inactivo"],
  "datos_originales": {
    "tiempo_total": 117,
    "vistas_abiertas": 18,
    "dias_activo": 9,
    "entrenamientos": 8,
    "interacciones_chatbot": 6,
    "preguntas_nutricion": 2,
    "preguntas_entrenamiento": 1,
    // ... más datos
  }
}
```

### Predicciones Múltiples
```json
{
  "predictions": [...],
  "metadata": {
    "total_usuarios": 9,
    "usuarios_altos_riesgo": 3,
    "usuarios_medios_riesgo": 2,
    "usuarios_bajos_riesgo": 4,
    "timestamp": "2025-07-28T09:30:00.000Z"
  }
}
```

## 🔧 Variables Compuestas Calculadas

- **ratio_actividad** = dias_activo / 7
- **intensidad_uso** = tiempo_total / vistas_abiertas
- **consistencia_entrenamiento** = entrenamientos / dias_activo
- **tendencia_tiempo** = 0 (placeholder)
- **tendencia_vistas** = 0 (placeholder)
- **tendencia_entrenamientos** = 0 (placeholder)

## 🌐 Servidores Disponibles

- **Desarrollo**: `http://localhost:3000`
- **Producción**: `https://your-service.railway.app`

## 📖 Cómo Usar la Documentación

### 1. Abrir la Documentación
```bash
# Abrir el archivo HTML en tu navegador
open swagger-ui.html
```

### 2. Probar Endpoints
1. Haz clic en cualquier endpoint
2. Haz clic en "Try it out"
3. Ingresa el token en el header
4. Ejecuta la petición

### 3. Ejemplos de Uso

#### Obtener Predicciones de Todos los Usuarios
```bash
curl -X GET "http://localhost:3000/predictions/all" \
  -H "token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

#### Obtener Predicción de Usuario Específico
```bash
curl -X GET "http://localhost:3000/predictions/user/2" \
  -H "token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

#### Forzar Recálculo
```bash
curl -X POST "http://localhost:3000/predictions/refresh" \
  -H "token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

## 🔍 Diagnósticos

### Estado de Endpoints
```bash
curl -X GET "http://localhost:3000/predictions/endpoints-status" \
  -H "token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Test de Autenticación
```bash
curl -X GET "http://localhost:3000/predictions/auth-test" \
  -H "token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

## ⚠️ Códigos de Error

- **401**: Token no proporcionado o inválido
- **404**: Usuario no encontrado
- **500**: Error interno del servidor

## 🔄 Cache

- **Duración**: 1 hora
- **Comportamiento**: Los resultados se almacenan en memoria
- **Invalidación**: Usar `POST /predictions/refresh` para forzar recálculo

## 📈 Monitoreo

### Health Check
```bash
curl http://localhost:3000/health
```

### Estado del Procesamiento
```bash
curl http://localhost:3000/predictions/status
```

## 🛠️ Desarrollo

### Instalar Dependencias
```bash
npm install
```

### Ejecutar en Desarrollo
```bash
npm start
```

### Variables de Entorno
```env
API_GATEWAY_URL=https://api-gateway-runinsight-production.up.railway.app
PREDICTION_API_URL=http://localhost:4000/api/text-mining/stats
PORT=3000
NODE_ENV=production
LOG_LEVEL=info
```

## 📝 Notas Importantes

1. **Token Requerido**: Todos los endpoints que acceden al API Gateway requieren token de administrador
2. **Rate Limiting**: El servicio maneja automáticamente los límites de peticiones
3. **Fallbacks**: Si un servicio falla, el sistema continúa con datos parciales
4. **Logging**: Todos los errores y eventos se registran detalladamente

## 🤝 Contribución

Para contribuir al proyecto:

1. Fork el repositorio
2. Crea una rama para tu feature
3. Commit tus cambios
4. Push a la rama
5. Abre un Pull Request

## 📞 Soporte

Para soporte técnico o preguntas sobre la API:

- **Email**: support@runinsight.com
- **Documentación**: Abrir `swagger-ui.html` en tu navegador
- **Issues**: Crear un issue en el repositorio

---

**Versión**: 1.0.0  
**Última actualización**: 2025-07-28  
**Autor**: RunInsight Team 