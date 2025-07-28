const axios = require('axios');
const logger = require('../utils/logger');

class ApiGatewayService {
  constructor() {
    this.baseURL = 'https://api-gateway-runinsight-production.up.railway.app';
    this.timeout = 15000; // Reducido de 30s a 15s
    this.retryAttempts = 2; // Reducido de 3 a 2
    this.retryDelay = 1000; // Reducido de 3s a 1s base
    
    // Configuración base del cliente axios (sin token)
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: this.timeout,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'PredictionService/1.0.0'
      }
    });
    
    // Interceptor para logging
    this.client.interceptors.request.use(
      (config) => {
        logger.debug(`Petición a API Gateway: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        logger.error('Error en petición a API Gateway:', error.message);
        return Promise.reject(error);
      }
    );

    this.client.interceptors.response.use(
      (response) => {
        logger.debug(`Respuesta exitosa de API Gateway: ${response.status}`);
        return response;
      },
      (error) => {
        logger.error('Error en respuesta de API Gateway:', {
          status: error.response?.status,
          message: error.message,
          url: error.config?.url
        });
        return Promise.reject(error);
      }
    );
  }

  // Función para delay con backoff exponencial
  async delay(attempt) {
    const delayTime = this.retryDelay * Math.pow(2, attempt - 1);
    logger.debug(`Esperando ${delayTime}ms antes del reintento ${attempt}`);
    return new Promise(resolve => setTimeout(resolve, delayTime));
  }

  // Función para hacer peticiones con retry
  async makeRequest(config, token, attempt = 1) {
    try {
      // Agregar token a los headers si se proporciona
      const requestConfig = {
        ...config,
        headers: {
          ...config.headers,
          'token': token
        }
      };
      
      const response = await this.client(requestConfig);
      return response.data;
    } catch (error) {
      if (attempt >= this.retryAttempts) {
        throw error;
      }

      // Solo reintentar en ciertos errores
      if (error.response?.status === 429 || 
          error.response?.status >= 500 || 
          error.code === 'ECONNRESET' ||
          error.code === 'ETIMEDOUT') {
        
        logger.warn(`Reintentando petición (${attempt}/${this.retryAttempts}): ${config.url}`);
        await this.delay(attempt);
        return this.makeRequest(config, token, attempt + 1);
      }

      throw error;
    }
  }

  // Obtener datos de usuario
  async getUserData(userId, token) {
    try {
      const data = await this.makeRequest({
        method: 'GET',
        url: `/users/${userId}`
      }, token);

      return {
        user_id: data.user_id || userId,
        dias_registrado: data.dias_registrado || 0
      };
    } catch (error) {
      logger.error(`Error obteniendo datos de usuario ${userId}:`, error.message);
      return {
        user_id: userId,
        dias_registrado: 0
      };
    }
  }

  // Obtener estadísticas de engagement
  async getEngagementStats(userId, token) {
    try {
      const data = await this.makeRequest({
        method: 'GET',
        url: `/engagement/${userId}`
      }, token);

      return {
        tiempo_total: data.tiempo_total || 0,
        vistas_abiertas: data.vistas_abiertas || 0,
        dias_activo: data.dias_activo || 0,
        dias_inactivo: data.dias_inactivo || 0
      };
    } catch (error) {
      logger.error(`Error obteniendo engagement stats para usuario ${userId}:`, error.message);
      return {
        tiempo_total: 0,
        vistas_abiertas: 0,
        dias_activo: 0,
        dias_inactivo: 0
      };
    }
  }

  // Obtener datos de entrenamientos
  async getTrainingsData(userId, token) {
    try {
      const data = await this.makeRequest({
        method: 'GET',
        url: `/trainings/user/${userId}`
      }, token);

      // La respuesta tiene estructura: { message: "...", trainings: [...], success: true }
      if (data && data.trainings && Array.isArray(data.trainings)) {
        const trainings = data.trainings;
        const totalTime = trainings.reduce((sum, training) => sum + (training.time_minutes || 0), 0);
        const totalRhythm = trainings.reduce((sum, training) => sum + (training.rhythm || 0), 0);
        const avgRhythm = trainings.length > 0 ? totalRhythm / trainings.length : 0;

        return {
          entrenamientos: trainings.length,
          tiempo_total_entrenamientos: totalTime,
          promedio_ritmo_entrenamientos: avgRhythm
        };
      } else {
        logger.warn(`Estructura de respuesta inesperada para trainings del usuario ${userId}:`, data);
        return {
          entrenamientos: 0,
          tiempo_total_entrenamientos: 0,
          promedio_ritmo_entrenamientos: 0
        };
      }
    } catch (error) {
      logger.error(`Error obteniendo datos de entrenamientos para usuario ${userId}:`, error.message);
      return {
        entrenamientos: 0,
        tiempo_total_entrenamientos: 0,
        promedio_ritmo_entrenamientos: 0
      };
    }
  }

  // Obtener estadísticas de chatbot desde API Gateway
  async getChatbotStats(userId, token) {
    try {
      const data = await this.makeRequest({
        method: 'GET',
        url: `/chatbot/text-mining/stats/${userId}`
      }, token);

      if (data && data.success && data.stats) {
        const stats = data.stats;
        
        // Mapear la respuesta del API Gateway al formato esperado
        return {
          preguntas_por_categoria: {
            nutricion: stats.preguntas_nutricion || 0,
            entrenamiento: stats.preguntas_entrenamiento || 0,
            recuperacion: stats.preguntas_recuperacion || 0,
            prevencion: stats.preguntas_prevencion_lesiones || 0,
            equipamiento: stats.preguntas_equipamiento || 0
          },
          // Datos adicionales del API Gateway
          total_preguntas: stats.total_preguntas || 0,
          score_ponderado: stats.score_ponderado || 0,
          ultima_actualizacion: stats.ultima_actualizacion
        };
      } else {
        logger.warn(`Respuesta inesperada del API Gateway para chatbot del usuario ${userId}:`, data);
        return {
          preguntas_por_categoria: {}
        };
      }
    } catch (error) {
      logger.error(`Error obteniendo stats de chatbot para usuario ${userId}:`, error.message);
      return {
        preguntas_por_categoria: {}
      };
    }
  }

  // Obtener analytics de engagement
  async getEngagementAnalytics(userId, token) {
    try {
      // Obtener interacciones de chatbot desde el API Gateway
      const data = await this.makeRequest({
        method: 'GET',
        url: `/chatbot/text-mining/stats/${userId}`
      }, token);

      let interacciones_chatbot = 0;
      
      if (data && data.success && data.stats) {
        const stats = data.stats;
        interacciones_chatbot = stats.total_preguntas || 0;
      }

      return {
        interacciones_chatbot: interacciones_chatbot
      };
    } catch (error) {
      logger.error(`Error obteniendo analytics de engagement para usuario ${userId}:`, error.message);
      return {
        interacciones_chatbot: 0
      };
    }
  }

  // Obtener todos los usuarios de una vez
  async getAllUsers(token) {
    try {
      const data = await this.makeRequest({
        method: 'GET',
        url: '/users/clients/all'
      }, token);

      // La respuesta tiene estructura: { message: "...", clients: { data: [...] } }
      if (data && data.clients && data.clients.data) {
        logger.info(`Obtenidos ${data.clients.data.length} usuarios del endpoint masivo`);
        return data.clients.data;
      } else if (Array.isArray(data)) {
        logger.info(`Obtenidos ${data.length} usuarios del endpoint masivo`);
        return data;
      } else {
        logger.warn('Estructura de respuesta inesperada para usuarios:', data);
        return [];
      }
    } catch (error) {
      logger.error('Error obteniendo todos los usuarios:', error.message);
      return [];
    }
  }



  // Obtener todos los engagement stats de una vez
  async getAllEngagementStats(token) {
    try {
      const data = await this.makeRequest({
        method: 'GET',
        url: '/engagement'
      }, token);

      // La respuesta tiene estructura: { success: true, message: "...", data: [...] }
      if (data && data.success && data.data) {
        logger.info(`Obtenidos ${data.data.length} logs de engagement del endpoint masivo`);
        // Procesar logs y convertirlos en estadísticas por usuario
        return this.processEngagementLogs(data.data);
      } else if (Array.isArray(data)) {
        logger.info(`Obtenidos ${data.length} logs de engagement del endpoint masivo`);
        return this.processEngagementLogs(data);
      } else {
        logger.warn('Estructura de respuesta inesperada para engagement:', data);
        return [];
      }
    } catch (error) {
      logger.error('Error obteniendo todos los engagement stats:', error.message);
      logger.info('Endpoint masivo de engagement no disponible, usando individual');
      return this.getEngagementStatsIndividually(token);
    }
  }

  // Obtener engagement stats individualmente
  async getEngagementStatsIndividually(token) {
    logger.info('Obteniendo engagement stats individualmente...');
    const engagementStats = [];
    
    // Solo intentar con los usuarios que sabemos que existen
    const knownUsers = [1, 2, 4, 6, 7, 8, 9, 10, 11, 12];
    
    // Procesar en lotes de 3 para evitar rate limiting
    const batchSize = 3;
    for (let i = 0; i < knownUsers.length; i += batchSize) {
      const batch = knownUsers.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (userId) => {
        try {
          const engagementData = await this.getEngagementStats(userId, token);
          if (engagementData && (engagementData.tiempo_total > 0 || engagementData.vistas_abiertas > 0)) {
            return {
              user_id: userId,
              ...engagementData
            };
          }
        } catch (error) {
          // Continuar con el siguiente usuario
        }
        return null;
      });
      
      const batchResults = await Promise.all(batchPromises);
      engagementStats.push(...batchResults.filter(result => result !== null));
      
      // Pausa entre lotes para evitar rate limiting
      if (i + batchSize < knownUsers.length) {
        await this.delay(1);
      }
    }
    
    logger.info(`Encontrados ${engagementStats.length} engagement stats individualmente`);
    return engagementStats;
  }

  // Obtener todos los entrenamientos de una vez
  async getAllTrainings(token) {
    try {
      // Como no existe endpoint masivo, usamos directamente el individual
      logger.info('Endpoint masivo de entrenamientos no disponible, usando individual');
      return this.getTrainingsIndividually(token);
    } catch (error) {
      logger.error('Error obteniendo todos los entrenamientos:', error.message);
      return [];
    }
  }

  // Obtener entrenamientos individualmente
  async getTrainingsIndividually(token) {
    logger.info('Obteniendo entrenamientos individualmente...');
    const allTrainings = [];
    
    // Solo intentar con los usuarios que sabemos que existen (1, 2, 4, 6, 7, 8, 9, 10, 11, 12)
    const knownUsers = [1, 2, 4, 6, 7, 8, 9, 10, 11, 12];
    
    // Procesar en lotes de 3 para evitar rate limiting
    const batchSize = 3;
    for (let i = 0; i < knownUsers.length; i += batchSize) {
      const batch = knownUsers.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (userId) => {
        try {
          const data = await this.makeRequest({
            method: 'GET',
            url: `/trainings/user/${userId}`
          }, token);

          // La respuesta tiene estructura: { message: "...", trainings: [...], success: true }
          if (data && data.trainings && Array.isArray(data.trainings)) {
            const trainings = data.trainings.map(training => ({
              ...training,
              user_id: userId
            }));
            return trainings;
          }
        } catch (error) {
          // Continuar con el siguiente usuario
        }
        return [];
      });
      
      const batchResults = await Promise.all(batchPromises);
      allTrainings.push(...batchResults.flat());
      
      // Pausa entre lotes para evitar rate limiting
      if (i + batchSize < knownUsers.length) {
        await this.delay(1);
      }
    }
    
    logger.info(`Encontrados ${allTrainings.length} entrenamientos individualmente`);
    return allTrainings;
  }



  // Obtener todos los chatbot stats de una vez
  async getAllChatbotStats(token) {
    try {
      // Como no existe endpoint masivo, usamos directamente el individual
      logger.info('Endpoint masivo de chatbot no disponible, usando individual');
      return this.getChatbotStatsIndividually(token);
    } catch (error) {
      logger.error('Error obteniendo todos los chatbot stats:', error.message);
      return [];
    }
  }

  // Obtener chatbot stats individualmente
  async getChatbotStatsIndividually(token) {
    logger.info('Obteniendo chatbot stats individualmente...');
    const chatbotStats = [];
    
    // Solo intentar con los usuarios que sabemos que existen
    const knownUsers = [1, 2, 4, 6, 7, 8, 9, 10, 11, 12];
    
    // Procesar en lotes de 3 para evitar rate limiting
    const batchSize = 3;
    for (let i = 0; i < knownUsers.length; i += batchSize) {
      const batch = knownUsers.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (userId) => {
        try {
          const chatbotData = await this.getChatbotStats(userId, token);
          if (chatbotData && Object.keys(chatbotData.preguntas_por_categoria || {}).length > 0) {
            return {
              user_id: userId,
              ...chatbotData
            };
          }
        } catch (error) {
          // Continuar con el siguiente usuario
        }
        return null;
      });
      
      const batchResults = await Promise.all(batchPromises);
      chatbotStats.push(...batchResults.filter(result => result !== null));
      
      // Pausa entre lotes para evitar rate limiting
      if (i + batchSize < knownUsers.length) {
        await this.delay(1);
      }
    }
    
    logger.info(`Encontrados ${chatbotStats.length} chatbot stats individualmente`);
    return chatbotStats;
  }



  // Obtener todos los analytics de engagement de una vez
  async getAllEngagementAnalytics(token) {
    try {
      // Como no existe endpoint masivo, usamos directamente el individual
      logger.info('Endpoint masivo de analytics no disponible, usando individual');
      return this.getEngagementAnalyticsIndividually(token);
    } catch (error) {
      logger.error('Error obteniendo todos los engagement analytics:', error.message);
      return [];
    }
  }

  // Obtener engagement analytics individualmente
  async getEngagementAnalyticsIndividually(token) {
    logger.info('Obteniendo engagement analytics individualmente...');
    const analytics = [];
    
    // Solo intentar con los usuarios que sabemos que existen
    const knownUsers = [1, 2, 4, 6, 7, 8, 9, 10, 11, 12];
    
    // Procesar en lotes de 3 para evitar rate limiting
    const batchSize = 3;
    for (let i = 0; i < knownUsers.length; i += batchSize) {
      const batch = knownUsers.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (userId) => {
        try {
          const analyticsData = await this.getEngagementAnalytics(userId, token);
          if (analyticsData && analyticsData.interacciones_chatbot > 0) {
            return {
              user_id: userId,
              ...analyticsData
            };
          }
        } catch (error) {
          // Continuar con el siguiente usuario
        }
        return null;
      });
      
      const batchResults = await Promise.all(batchPromises);
      analytics.push(...batchResults.filter(result => result !== null));
      
      // Pausa entre lotes para evitar rate limiting
      if (i + batchSize < knownUsers.length) {
        await this.delay(1);
      }
    }
    
    logger.info(`Encontrados ${analytics.length} analytics individualmente`);
    return analytics;
  }



  // Obtener todos los datos combinados de una vez
  async getAllDataCombined(token) {
    logger.info('Obteniendo todos los datos combinados de una vez');
    
    try {
      // Hacer todas las peticiones masivas en paralelo
      const [
        users,
        engagementStats,
        trainings,
        chatbotStats,
        engagementAnalytics
      ] = await Promise.all([
        this.getAllUsers(token),
        this.getAllEngagementStats(token),
        this.getAllTrainings(token),
        this.getAllChatbotStats(token),
        this.getAllEngagementAnalytics(token)
      ]);

      logger.info(`Datos obtenidos: ${users.length} usuarios, ${engagementStats.length} engagement, ${trainings.length} entrenamientos`);

      // Combinar datos por user_id
      const combinedData = this.combineDataByUserId(users, engagementStats, trainings, chatbotStats, engagementAnalytics);

      return combinedData;
    } catch (error) {
      logger.error('Error obteniendo datos combinados:', error.message);
      return [];
    }
  }

  // Combinar datos por user_id
  combineDataByUserId(users, engagementStats, trainings, chatbotStats, engagementAnalytics) {
    const combinedData = [];
    
    // Debug: Ver estructura de datos
    logger.info(`Debug - Users count: ${users.length}`);
    logger.info(`Debug - Engagement stats count: ${engagementStats.length}`);
    logger.info(`Debug - Trainings count: ${trainings.length}`);
    logger.info(`Debug - Chatbot stats count: ${chatbotStats.length}`);
    logger.info(`Debug - Analytics count: ${engagementAnalytics.length}`);
    
    if (engagementStats.length > 0) {
      logger.info(`Debug - First engagement stat:`, JSON.stringify(engagementStats[0]));
    }
    if (users.length > 0) {
      logger.info(`Debug - First user:`, JSON.stringify(users[0]));
    }
    
    // Crear mapas para acceso rápido
    const engagementMap = new Map(engagementStats.map(stat => [stat.user_id, stat]));
    const trainingsMap = new Map();
    const chatbotMap = new Map(chatbotStats.map(stat => [stat.user_id, stat]));
    const analyticsMap = new Map(engagementAnalytics.map(analytics => [analytics.user_id, analytics]));

    // Agrupar entrenamientos por usuario
    trainings.forEach(training => {
      const userId = training.user_id;
      if (!trainingsMap.has(userId)) {
        trainingsMap.set(userId, []);
      }
      trainingsMap.get(userId).push(training);
    });

    // Combinar datos para cada usuario
    users.forEach(user => {
      const userId = user.id || user.user_id;
      const engagement = engagementMap.get(userId) || {};
      const userTrainings = trainingsMap.get(userId) || [];
      const chatbot = chatbotMap.get(userId) || {};
      const analytics = analyticsMap.get(userId) || {};

      // Debug: Ver qué datos se están combinando
      logger.info(`Debug - User ${userId}: engagement=${!!engagement}, trainings=${userTrainings.length}, chatbot=${!!chatbot}, analytics=${!!analytics}`);

      // Calcular métricas de entrenamientos
      const trainingMetrics = this.calculateTrainingMetrics(userTrainings);

      const combinedUser = {
        user_id: userId,
        // Datos de usuario
        dias_registrado: user.dias_registrado || 0,
        
        // Datos de engagement
        tiempo_total: engagement.tiempo_total || 0,
        vistas_abiertas: engagement.vistas_abiertas || 0,
        dias_activo: engagement.dias_activo || 0,
        dias_inactivo: engagement.dias_inactivo || 0,
        
        // Datos de entrenamientos (calculados)
        entrenamientos: trainingMetrics.count,
        tiempo_total_entrenamientos: trainingMetrics.totalTime,
        promedio_ritmo_entrenamientos: trainingMetrics.avgPace,
        
        // Datos de chatbot
        interacciones_chatbot: analytics.interacciones_chatbot || 0,
        preguntas_por_categoria: chatbot.preguntas_por_categoria || {},
        
        // Datos originales para debugging
        _raw_data: {
          user,
          engagement,
          trainings: userTrainings,
          chatbot,
          analytics
        }
      };

      combinedData.push(combinedUser);
    });

    logger.info(`Datos combinados para ${combinedData.length} usuarios`);
    return combinedData;
  }

  // Calcular métricas de entrenamientos
  calculateTrainingMetrics(trainings) {
    if (!trainings || trainings.length === 0) {
      return {
        count: 0,
        totalTime: 0,
        avgPace: 0
      };
    }

    const totalTime = trainings.reduce((sum, training) => sum + (training.time_minutes || 0), 0);
    const totalPace = trainings.reduce((sum, training) => sum + (training.rhythm || 0), 0);
    const avgPace = trainings.length > 0 ? totalPace / trainings.length : 0;

    return {
      count: trainings.length,
      totalTime,
      avgPace
    };
  }

  // Procesar logs de engagement y convertirlos en estadísticas por usuario
  processEngagementLogs(engagementLogs) {
    const userStats = new Map();
    
    engagementLogs.forEach(log => {
      const userId = log.user_id;
      
      if (!userStats.has(userId)) {
        userStats.set(userId, {
          user_id: userId,
          tiempo_total: 0,
          vistas_abiertas: 0,
          dias_activo: new Set(),
          dias_inactivo: 0
        });
      }
      
      const stats = userStats.get(userId);
      
      // Sumar tiempo total (convertir segundos a minutos)
      stats.tiempo_total += (log.duration_seconds || 0) / 60;
      
      // Contar vistas abiertas
      stats.vistas_abiertas += 1;
      
      // Agregar día activo (extraer fecha de viewed_at)
      if (log.viewed_at) {
        const date = new Date(log.viewed_at);
        const dayKey = date.toISOString().split('T')[0]; // YYYY-MM-DD
        stats.dias_activo.add(dayKey);
      }
    });
    
    // Convertir Set a número y calcular días inactivos
    const processedStats = [];
    userStats.forEach((stats, userId) => {
      const diasActivo = stats.dias_activo.size;
      const diasInactivo = Math.max(0, 30 - diasActivo); // Asumir 30 días como período
      
      processedStats.push({
        user_id: userId,
        tiempo_total: Math.round(stats.tiempo_total * 100) / 100, // Redondear a 2 decimales
        vistas_abiertas: stats.vistas_abiertas,
        dias_activo: diasActivo,
        dias_inactivo: diasInactivo
      });
    });
    
    logger.info(`Procesados ${processedStats.length} usuarios con estadísticas de engagement`);
    return processedStats;
  }
}

module.exports = new ApiGatewayService(); 