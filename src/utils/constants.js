// Configuración de la API Gateway
const API_GATEWAY_CONFIG = {
  BASE_URL: 'https://api-gateway-runinsight-production.up.railway.app',
  TIMEOUT: 30000, // 30 segundos
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 3000, // 3 segundos base
  DELAY_BETWEEN_REQUESTS: 3000 // 3 segundos entre peticiones
};

// Endpoints de la API Gateway
const API_ENDPOINTS = {
  USERS: '/users/{id}',
  ENGAGEMENT_STATS: '/engagement/stats/{id}',
  TRAININGS: '/trainings/user/{id}',
  CHATBOT_STATS: '/chatbot/text-mining/stats/{userId}/weekly',
  ENGAGEMENT_ANALYTICS: '/engagement/analytics/{id}'
};

// Configuración de predicción
const PREDICTION_CONFIG = {
  DEFAULT_API_URL: 'http://localhost:4000/api/text-mining/stats',
  TIMEOUT: 30000,
  FALLBACK_ENABLED: true
};

// Configuración de cache
const CACHE_CONFIG = {
  MAX_AGE: 60 * 60 * 1000, // 1 hora
  CLEANUP_INTERVAL: 30 * 60 * 1000 // 30 minutos
};

// Configuración de rate limiting
const RATE_LIMIT_CONFIG = {
  WINDOW_MS: 15 * 60 * 1000, // 15 minutos
  MAX_REQUESTS: 100 // máximo 100 requests por ventana
};

// Configuración de optimización de performance
const PERFORMANCE_CONFIG = {
  BATCH_SIZE: 3, // Usuarios por lote
  DELAY_BETWEEN_BATCHES: 1000, // 1 segundo por usuario
  PARALLEL_REQUESTS_PER_USER: 5, // APIs en paralelo por usuario
  TIMEOUT_PER_REQUEST: 15000, // 15 segundos por petición
  MAX_CONCURRENT_USERS: 5 // Máximo usuarios concurrentes
};

// Configuración de rate limiting optimizada
const RATE_LIMIT_CONFIG_OPTIMIZED = {
  WINDOW_MS: 15 * 60 * 1000, // 15 minutos
  MAX_REQUESTS: 200, // Aumentado de 100 a 200
  DELAY_BETWEEN_REQUESTS: 500 // 500ms entre peticiones
};

// Niveles de riesgo
const RISK_LEVELS = {
  ALTO: 'Alto',
  MEDIO: 'Medio',
  BAJO: 'Bajo'
};

// Umbrales para predicción
const PREDICTION_THRESHOLDS = {
  RATIO_ACTIVIDAD_MIN: 0.3,
  INTENSIDAD_USO_MIN: 5,
  CONSISTENCIA_ENTRENAMIENTO_MIN: 0.5,
  PROBABILIDAD_ABANDONO_ALTO: 0.7,
  PROBABILIDAD_ABANDONO_MEDIO: 0.4
};

// Mensajes de error
const ERROR_MESSAGES = {
  PROCESSING_IN_PROGRESS: 'Procesamiento ya en curso',
  NO_DATA_AVAILABLE: 'No hay datos disponibles',
  USER_NOT_FOUND: 'Usuario no encontrado',
  INVALID_USER_ID: 'ID de usuario inválido',
  API_GATEWAY_ERROR: 'Error conectando con API Gateway',
  PREDICTION_API_ERROR: 'Error en API de predicción',
  RATE_LIMIT_EXCEEDED: 'Rate limit excedido'
};

// Recomendaciones predefinidas
const RECOMMENDATIONS = {
  INCREMENTAR_ACTIVIDAD: 'Incrementar actividad semanal',
  MEJORAR_ENGAGEMENT: 'Mejorar engagement con contenido',
  ESTABLECER_RUTINA: 'Establecer rutina de entrenamiento',
  REACTIVAR_USUARIO: 'Reactivar usuario inactivo',
  MANTENER_ENGAGEMENT: 'Mantener engagement actual',
  CONTENIDO_PREMIUM: 'Contenido premium recomendado'
};

// Configuración de logging
const LOG_CONFIG = {
  DEFAULT_LEVEL: 'info',
  ERROR_LOG_FILE: 'logs/error.log',
  COMBINED_LOG_FILE: 'logs/combined.log'
};

module.exports = {
  API_GATEWAY_CONFIG,
  API_ENDPOINTS,
  PREDICTION_CONFIG,
  CACHE_CONFIG,
  RATE_LIMIT_CONFIG,
  RATE_LIMIT_CONFIG_OPTIMIZED,
  PERFORMANCE_CONFIG,
  RISK_LEVELS,
  PREDICTION_THRESHOLDS,
  ERROR_MESSAGES,
  RECOMMENDATIONS,
  LOG_CONFIG
}; 