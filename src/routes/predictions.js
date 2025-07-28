const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');
const dataProcessor = require('../services/dataProcessor');

// GET /predictions/all - Obtener predicciones de todos los usuarios
router.get('/all', async (req, res, next) => {
  try {
    logger.info('Solicitud de predicciones para todos los usuarios');
    
    // Obtener token desde headers
    const token = req.headers.token || req.headers.authorization;
    
    if (!token) {
      return res.status(401).json({
        error: 'Token requerido',
        message: 'Debe proporcionar un token en el header "token" o "authorization"'
      });
    }
    
    // Intentar obtener del cache primero
    let result = dataProcessor.getCachedPredictions();
    
    if (!result) {
      logger.info('Cache vacío o expirado, procesando nuevas predicciones');
      result = await dataProcessor.processPredictions(token);
    }
    
    // Preparar respuesta
    const response = {
      predictions: result.predictions,
      metadata: result.metadata
    };
    
    // Agregar información de errores si existen
    if (result.collectionErrors && result.collectionErrors.length > 0) {
      response.collection_errors = result.collectionErrors;
    }
    
    if (result.predictionErrors && result.predictionErrors.length > 0) {
      response.prediction_errors = result.predictionErrors;
    }
    
    logger.info(`Predicciones enviadas: ${result.predictions.length} usuarios`);
    res.json(response);
    
  } catch (error) {
    logger.error('Error obteniendo predicciones:', error.message);
    next(error);
  }
});

// GET /predictions/user/:id - Predicción de usuario específico
router.get('/user/:id', async (req, res, next) => {
  try {
    const userId = parseInt(req.params.id);
    
    if (isNaN(userId) || userId <= 0) {
      return res.status(400).json({
        error: 'ID de usuario inválido',
        message: 'El ID debe ser un número positivo'
      });
    }
    
    // Obtener token desde headers
    const token = req.headers.token || req.headers.authorization;
    
    if (!token) {
      return res.status(401).json({
        error: 'Token requerido',
        message: 'Debe proporcionar un token en el header "token" o "authorization"'
      });
    }
    
    logger.info(`Solicitud de predicción para usuario ${userId}`);
    
    const prediction = await dataProcessor.getUserPrediction(userId);
    
    if (!prediction) {
      return res.status(404).json({
        error: 'Usuario no encontrado',
        message: `No se encontró predicción para el usuario ${userId}. Primero debe ejecutar /predictions/all para generar predicciones.`
      });
    }
    
    logger.info(`Predicción enviada para usuario ${userId}`);
    res.json(prediction);
    
  } catch (error) {
    logger.error(`Error obteniendo predicción para usuario ${req.params.id}:`, error.message);
    next(error);
  }
});

// POST /predictions/refresh - Forzar recálculo de predicciones
router.post('/refresh', async (req, res, next) => {
  try {
    logger.info('Solicitud de refresco de predicciones');
    
    // Obtener token desde headers
    const token = req.headers.token || req.headers.authorization;
    
    if (!token) {
      return res.status(401).json({
        error: 'Token requerido',
        message: 'Debe proporcionar un token en el header "token" o "authorization"'
      });
    }
    
    // Verificar si ya hay un procesamiento en curso
    const status = dataProcessor.getProcessingStatus();
    if (status.isProcessing) {
      return res.status(409).json({
        error: 'Procesamiento en curso',
        message: 'Ya hay un procesamiento de predicciones en curso. Intenta de nuevo más tarde.'
      });
    }
    
    // Iniciar procesamiento en background
    const result = await dataProcessor.refreshPredictions(token);
    
    // Preparar respuesta
    const response = {
      message: 'Predicciones actualizadas exitosamente',
      predictions: result.predictions,
      metadata: result.metadata,
      processing_time: `${Date.now() - new Date(result.timestamp).getTime()}ms`
    };
    
    // Agregar información de errores si existen
    if (result.collectionErrors && result.collectionErrors.length > 0) {
      response.collection_errors = result.collectionErrors;
    }
    
    if (result.predictionErrors && result.predictionErrors.length > 0) {
      response.prediction_errors = result.predictionErrors;
    }
    
    logger.info(`Refresco completado: ${result.predictions.length} usuarios procesados`);
    res.json(response);
    
  } catch (error) {
    logger.error('Error en refresco de predicciones:', error.message);
    next(error);
  }
});

// GET /predictions/status - Obtener estado del procesamiento
router.get('/status', (req, res) => {
  try {
    const status = dataProcessor.getProcessingStatus();
    const cached = dataProcessor.getCachedPredictions();
    
    const response = {
      is_processing: status.isProcessing,
      last_refresh: status.lastRefresh,
      has_cached_data: status.hasCachedData,
      cache_age: status.lastRefresh ? 
        `${Math.round((Date.now() - status.lastRefresh.getTime()) / 1000)}s` : 
        'N/A'
    };
    
    if (cached) {
      response.cached_predictions_count = cached.predictions.length;
      response.cached_metadata = cached.metadata;
    }
    
    res.json(response);
    
  } catch (error) {
    logger.error('Error obteniendo estado:', error.message);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: error.message
    });
  }
});

// GET /predictions/metadata - Obtener solo metadata
router.get('/metadata', (req, res) => {
  try {
    const cached = dataProcessor.getCachedPredictions();
    
    if (!cached) {
      return res.status(404).json({
        error: 'No hay datos disponibles',
        message: 'No hay predicciones en cache. Usa /refresh para generar nuevas predicciones.'
      });
    }
    
    res.json(cached.metadata);
    
  } catch (error) {
    logger.error('Error obteniendo metadata:', error.message);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: error.message
    });
  }
});

// GET /predictions/config - Obtener configuración actual
router.get('/config', (req, res) => {
  try {
    const { PERFORMANCE_CONFIG, RATE_LIMIT_CONFIG_OPTIMIZED } = require('../utils/constants');
    
    res.json({
      performance: PERFORMANCE_CONFIG,
      rate_limiting: RATE_LIMIT_CONFIG_OPTIMIZED,
      cache: {
        max_age: '1 hora',
        cleanup_interval: '30 minutos'
      },
      timeouts: {
        request_timeout: '15 segundos',
        retry_attempts: 2,
        retry_delay: '1 segundo'
      }
    });
    
  } catch (error) {
    logger.error('Error obteniendo configuración:', error.message);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: error.message
    });
  }
});

// POST /predictions/config - Actualizar configuración
router.post('/config', (req, res) => {
  try {
    const { batchSize, delayBetweenBatches, maxConcurrentUsers } = req.body;
    
    // Aquí podrías actualizar la configuración dinámicamente
    // Por ahora solo validamos los parámetros
    const validConfig = {
      batchSize: Math.min(Math.max(batchSize || 3, 1), 10),
      delayBetweenBatches: Math.min(Math.max(delayBetweenBatches || 1000, 100), 5000),
      maxConcurrentUsers: Math.min(Math.max(maxConcurrentUsers || 5, 1), 20)
    };
    
    logger.info('Configuración actualizada:', validConfig);
    
    res.json({
      message: 'Configuración actualizada exitosamente',
      config: validConfig
    });
    
  } catch (error) {
    logger.error('Error actualizando configuración:', error.message);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: error.message
    });
  }
});

// GET /predictions/endpoints-status - Verificar estado de endpoints masivos
router.get('/endpoints-status', async (req, res) => {
  try {
    const apiGateway = require('../services/apiGateway');
    
    // Obtener token desde headers
    const token = req.headers.token || req.headers.authorization;
    
    if (!token) {
      return res.status(401).json({
        error: 'Token requerido',
        message: 'Debe proporcionar un token en el header "token" o "authorization"'
      });
    }
    
    const status = {
      timestamp: new Date().toISOString(),
      endpoints: {}
    };

    // Verificar cada endpoint masivo
    const endpoints = [
      { name: 'users', method: apiGateway.getAllUsers.bind(apiGateway) },
      { name: 'engagement', method: apiGateway.getAllEngagementStats.bind(apiGateway) },
      { name: 'trainings', method: apiGateway.getAllTrainings.bind(apiGateway) },
      { name: 'chatbot', method: apiGateway.getAllChatbotStats.bind(apiGateway) },
      { name: 'analytics', method: apiGateway.getAllEngagementAnalytics.bind(apiGateway) }
    ];

    for (const endpoint of endpoints) {
      try {
        const startTime = Date.now();
        const data = await endpoint.method(token);
        const responseTime = Date.now() - startTime;
        
        status.endpoints[endpoint.name] = {
          available: true,
          response_time: responseTime,
          data_count: Array.isArray(data) ? data.length : 0,
          error: null
        };
      } catch (error) {
        status.endpoints[endpoint.name] = {
          available: false,
          response_time: null,
          data_count: 0,
          error: error.message
        };
      }
    }

    // Determinar estrategia recomendada
    const availableEndpoints = Object.values(status.endpoints).filter(ep => ep.available).length;
    status.recommended_strategy = availableEndpoints >= 3 ? 'massive' : 'individual';
    status.available_endpoints = availableEndpoints;

    res.json(status);
    
  } catch (error) {
    logger.error('Error verificando endpoints:', error.message);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: error.message
    });
  }
});

// GET /predictions/prediction-service-status - Verificar estado del servicio de predicciones
router.get('/prediction-service-status', async (req, res) => {
  try {
    const predictionEngine = require('../services/predictionEngine');
    const axios = require('axios');
    
    const status = {
      timestamp: new Date().toISOString(),
      prediction_service_url: predictionEngine.predictionApiUrl,
      status: 'unknown'
    };

    try {
      // Intentar hacer una predicción de prueba
      const testData = {
        user_id: 999,
        dias_registrado: 30,
        tiempo_total: 100,
        vistas_abiertas: 10,
        dias_activo: 5,
        dias_inactivo: 2,
        entrenamientos: 5,
        tiempo_total_entrenamientos: 30,
        promedio_ritmo_entrenamientos: 5,
        interacciones_chatbot: 10,
        ratio_actividad: 0.71,
        intensidad_uso: 10,
        consistencia_entrenamiento: 1,
        tendencia_tiempo: 0,
        tendencia_vistas: 0,
        tendencia_entrenamientos: 0,
        preguntas_por_categoria: {}
      };

      const startTime = Date.now();
      const response = await axios.post(predictionEngine.predictionApiUrl, testData, {
        timeout: 10000,
        headers: { 'Content-Type': 'application/json' }
      });
      const responseTime = Date.now() - startTime;

      status.status = 'available';
      status.response_time = responseTime;
      status.test_prediction = {
        user_id: response.data.user_id,
        prediccion_abandono: response.data.prediccion_abandono,
        probabilidad_abandono: response.data.probabilidad_abandono,
        riesgo: response.data.riesgo
      };

    } catch (error) {
      status.status = 'unavailable';
      status.error = error.message;
      
      if (error.code === 'ECONNREFUSED') {
        status.error_details = 'Servicio no disponible - verifica que esté corriendo en localhost:5000';
      } else if (error.response) {
        status.error_details = `HTTP ${error.response.status}: ${error.response.data}`;
      }
    }

    res.json(status);
    
  } catch (error) {
    logger.error('Error verificando servicio de predicciones:', error.message);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: error.message
    });
  }
});

// GET /predictions/auth-test - Verificar autenticación con API Gateway
router.get('/auth-test', async (req, res) => {
  try {
    const apiGateway = require('../services/apiGateway');
    const axios = require('axios');

    // Obtener token desde headers
    const token = req.headers.token || req.headers.authorization;
    
    if (!token) {
      return res.status(401).json({
        error: 'Token requerido',
        message: 'Debe proporcionar un token en el header "token" o "authorization"'
      });
    }

    const testResults = {
      timestamp: new Date().toISOString(),
      token_provided: !!token,
      token_preview: token ? `${token.substring(0, 10)}...` : 'No proporcionado',
      endpoints: {}
    };

    // Test de endpoints básicos (solo para verificar autenticación)
    const testEndpoints = [
      { name: 'users_single', url: '/users/1', method: 'GET' },
      { name: 'engagement_single', url: '/engagement/stats/1', method: 'GET' },
      { name: 'trainings_single', url: '/trainings/user/1', method: 'GET' },
      { name: 'chatbot_single', url: '/chatbot/text-mining/stats/1', method: 'GET' },
      { name: 'analytics_single', url: '/engagement/analytics/1', method: 'GET' }
    ];

    for (const endpoint of testEndpoints) {
      try {
        const startTime = Date.now();
                        const response = await apiGateway.makeRequest({
                  method: endpoint.method,
                  url: endpoint.url
                }, token);
        const responseTime = Date.now() - startTime;
        
        testResults.endpoints[endpoint.name] = {
          available: true,
          response_time: responseTime,
          status: 'success'
        };
      } catch (error) {
        testResults.endpoints[endpoint.name] = {
          available: false,
          error: error.message,
          status: error.response?.status || 'unknown'
        };
      }
    }

    // Test de endpoints masivos
    const massiveEndpoints = [
      { name: 'users_all', method: apiGateway.getAllUsers.bind(apiGateway) },
      { name: 'engagement_all', method: apiGateway.getAllEngagementStats.bind(apiGateway) },
      { name: 'trainings_all', method: apiGateway.getAllTrainings.bind(apiGateway) },
      { name: 'chatbot_all', method: apiGateway.getAllChatbotStats.bind(apiGateway) },
      { name: 'analytics_all', method: apiGateway.getAllEngagementAnalytics.bind(apiGateway) }
    ];

    for (const endpoint of massiveEndpoints) {
      try {
        const startTime = Date.now();
        const data = await endpoint.method(token);
        const responseTime = Date.now() - startTime;
        
        testResults.endpoints[endpoint.name] = {
          available: true,
          response_time: responseTime,
          data_count: Array.isArray(data) ? data.length : 0,
          status: 'success'
        };
      } catch (error) {
        testResults.endpoints[endpoint.name] = {
          available: false,
          error: error.message,
          status: 'failed'
        };
      }
    }

    // Resumen
    const availableEndpoints = Object.values(testResults.endpoints).filter(ep => ep.available).length;
    const totalEndpoints = Object.keys(testResults.endpoints).length;
    
    testResults.summary = {
      total_endpoints: totalEndpoints,
      available_endpoints: availableEndpoints,
      success_rate: `${((availableEndpoints / totalEndpoints) * 100).toFixed(1)}%`,
      recommendation: availableEndpoints >= 3 ? 'ready' : 'needs_attention'
    };

    res.json(testResults);
    
  } catch (error) {
    logger.error('Error en test de autenticación:', error.message);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: error.message
    });
  }
});

module.exports = router; 