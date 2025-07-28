const logger = require('../utils/logger');
const apiGateway = require('./apiGateway');
const predictionEngine = require('./predictionEngine');

class DataProcessor {
  constructor() {
    this.cache = new Map();
    this.lastRefresh = null;
    this.isProcessing = false;
  }

  // Obtener lista de usuarios (solo masiva)
  async getUserIds(token) {
    try {
      // Intentar obtener usuarios del API Gateway (solo masivo)
      const apiGateway = require('./apiGateway');
      const allUsers = await apiGateway.getAllUsers(token);
      
      if (allUsers && allUsers.length > 0) {
        const userIds = allUsers.map(user => user.user_id || user.id).filter(id => id);
        logger.info(`Obtenidos ${userIds.length} usuarios del API Gateway`);
        return userIds;
      }
      
      logger.warn('No se pudieron obtener usuarios del API Gateway');
      return [];
      
    } catch (error) {
      logger.error('Error obteniendo lista de usuarios:', error.message);
      return [];
    }
  }



  // Recolectar datos de múltiples usuarios (solo masiva)
  async collectMultipleUsersData(userIds, token) {
    logger.info(`Iniciando recolección masiva de datos para ${userIds.length} usuarios`);
    
    try {
      // Obtener todos los datos de una vez
      const allData = await apiGateway.getAllDataCombined(token);
      
      if (!allData || allData.length === 0) {
        logger.warn('No se obtuvieron datos del API Gateway');
        return {
          usersData: [],
          errors: [{ error: 'No se pudieron obtener datos del API Gateway' }]
        };
      }

      // Filtrar solo los usuarios que necesitamos
      const filteredData = allData.filter(user => userIds.includes(user.user_id));
      
      logger.info(`Datos recolectados: ${filteredData.length} usuarios de ${allData.length} totales`);
      
      return {
        usersData: filteredData,
        errors: []
      };
      
    } catch (error) {
      logger.error('Error en recolección masiva de datos:', error.message);
      
      return {
        usersData: [],
        errors: [{ error: 'Error en recolección masiva de datos' }]
      };
    }
  }



  // Procesar predicciones completas
  async processPredictions(token) {
    if (this.isProcessing) {
      throw new Error('Procesamiento ya en curso');
    }
    
    this.isProcessing = true;
    const startTime = Date.now();
    
    try {
      logger.info('Iniciando procesamiento de predicciones');
      
      // 1. Obtener lista de usuarios
      const userIds = await this.getUserIds(token);
      
      if (userIds.length === 0) {
        logger.warn('No se encontraron usuarios para procesar');
        return {
          predictions: [],
          metadata: {
            total_usuarios: 0,
            usuarios_altos_riesgo: 0,
            usuarios_medios_riesgo: 0,
            usuarios_bajos_riesgo: 0,
            timestamp: new Date().toISOString()
          },
          collectionErrors: [{ error: 'No se encontraron usuarios' }],
          predictionErrors: [],
          timestamp: new Date().toISOString()
        };
      }
      
      // 2. Recolectar datos
      const { usersData, errors: collectionErrors } = await this.collectMultipleUsersData(userIds, token);
      
      if (usersData.length === 0) {
        logger.warn('No se pudieron recolectar datos de ningún usuario');
        return {
          predictions: [],
          metadata: {
            total_usuarios: 0,
            usuarios_altos_riesgo: 0,
            usuarios_medios_riesgo: 0,
            usuarios_bajos_riesgo: 0,
            timestamp: new Date().toISOString()
          },
          collectionErrors: [{ error: 'No se pudieron recolectar datos' }],
          predictionErrors: [],
          timestamp: new Date().toISOString()
        };
      }
      
      // 3. Procesar predicciones
      const { predictions, errors: predictionErrors } = await predictionEngine.processMultipleUsers(usersData);
      
      // 4. Generar metadata
      const metadata = this.generateMetadata(predictions);
      
      // 5. Guardar en cache
      const result = {
        predictions,
        metadata,
        collectionErrors,
        predictionErrors,
        timestamp: new Date().toISOString()
      };
      
      this.cache.set('predictions', result);
      this.lastRefresh = new Date();
      
      const processingTime = Date.now() - startTime;
      logger.info(`Procesamiento completado en ${processingTime}ms`);
      
      return result;
      
    } catch (error) {
      logger.error('Error en procesamiento de predicciones:', error.message);
      throw error;
    } finally {
      this.isProcessing = false;
    }
  }

  // Generar metadata de las predicciones
  generateMetadata(predictions) {
    const totalUsuarios = predictions.length;
    const usuariosAltosRiesgo = predictions.filter(p => p.riesgo === 'Alto').length;
    const usuariosMediosRiesgo = predictions.filter(p => p.riesgo === 'Medio').length;
    const usuariosBajosRiesgo = predictions.filter(p => p.riesgo === 'Bajo').length;
    
    return {
      total_usuarios: totalUsuarios,
      usuarios_altos_riesgo: usuariosAltosRiesgo,
      usuarios_medios_riesgo: usuariosMediosRiesgo,
      usuarios_bajos_riesgo: usuariosBajosRiesgo,
      timestamp: new Date().toISOString()
    };
  }

  // Obtener predicciones del cache
  getCachedPredictions() {
    const cached = this.cache.get('predictions');
    if (!cached) {
      return null;
    }
    
    // Verificar si el cache es muy antiguo (más de 1 hora)
    const cacheAge = Date.now() - this.lastRefresh.getTime();
    const maxAge = 60 * 60 * 1000; // 1 hora
    
    if (cacheAge > maxAge) {
      logger.warn('Cache expirado, se requiere refrescar');
      return null;
    }
    
    return cached;
  }

  // Obtener predicción de usuario específico
  async getUserPrediction(userId) {
    try {
      // Intentar obtener del cache primero
      const cached = this.getCachedPredictions();
      if (cached) {
        const userPrediction = cached.predictions.find(p => p.user_id === userId);
        if (userPrediction) {
          return userPrediction;
        }
      }
      
      // Si no está en cache, no procesar individualmente
      logger.warn(`No se encontró predicción para usuario ${userId} en cache`);
      return null;
      
    } catch (error) {
      logger.error(`Error obteniendo predicción para usuario ${userId}:`, error.message);
      throw error;
    }
  }

  // Forzar refresco de predicciones
  async refreshPredictions(token) {
    logger.info('Forzando refresco de predicciones');
    this.cache.delete('predictions');
    return await this.processPredictions(token);
  }

  // Obtener estado del procesamiento
  getProcessingStatus() {
    return {
      isProcessing: this.isProcessing,
      lastRefresh: this.lastRefresh,
      hasCachedData: this.cache.has('predictions')
    };
  }
}

module.exports = new DataProcessor(); 