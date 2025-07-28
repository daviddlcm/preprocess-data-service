const axios = require('axios');
const logger = require('../utils/logger');

class PredictionEngine {
  constructor() {
    this.predictionApiUrl = process.env.PREDICTION_API_URL || 'https://predict-service-production.up.railway.app/predict';
    this.timeout = 30000;
  }

  // Calcular variables compuestas
  calculateCompositeVariables(userData) {
    const {
      dias_activo = 0,
      tiempo_total = 0,
      vistas_abiertas = 0,
      entrenamientos = 0,
      dias_registrado = 0
    } = userData;

    // Evitar división por cero
    const ratio_actividad = dias_activo > 0 ? dias_activo / 7 : 0;
    const intensidad_uso = vistas_abiertas > 0 ? tiempo_total / vistas_abiertas : 0;
    const consistencia_entrenamiento = dias_activo > 0 ? entrenamientos / dias_activo : 0;

    // Placeholders para tendencias (se implementarán después)
    const tendencia_tiempo = 0;
    const tendencia_vistas = 0;
    const tendencia_entrenamientos = 0;

    return {
      ratio_actividad,
      intensidad_uso,
      consistencia_entrenamiento,
      tendencia_tiempo,
      tendencia_vistas,
      tendencia_entrenamientos
    };
  }

  // Preparar datos para predicción
  preparePredictionData(userData) {
    const compositeVars = this.calculateCompositeVariables(userData);
    
    return {
      // Datos originales
      user_id: userData.user_id,
      dias_registrado: userData.dias_registrado || 0,
      tiempo_total: userData.tiempo_total || 0,
      vistas_abiertas: userData.vistas_abiertas || 0,
      dias_activo: userData.dias_activo || 0,
      dias_inactivo: userData.dias_inactivo || 0,
      entrenamientos: userData.entrenamientos || 0,
      tiempo_total_entrenamientos: userData.tiempo_total_entrenamientos || 0,
      promedio_ritmo_entrenamientos: userData.promedio_ritmo_entrenamientos || 0,
      interacciones_chatbot: userData.interacciones_chatbot || 0,
      
      // Variables compuestas
      ...compositeVars,
      
      // Datos de chatbot (simplificados)
      preguntas_por_categoria: userData.preguntas_por_categoria || {}
    };
  }

  // Hacer predicción usando API local
  async makePrediction(predictionData) {
    try {
      logger.info(`Haciendo predicción para usuario ${predictionData.user_id} en ${this.predictionApiUrl}`);
      
      const response = await axios.post(this.predictionApiUrl, predictionData, {
        timeout: this.timeout,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      logger.info(`Predicción exitosa para usuario ${predictionData.user_id}`);
      return response.data;
    } catch (error) {
      logger.error(`Error en predicción para usuario ${predictionData.user_id}:`, error.message);
      
      if (error.code === 'ECONNREFUSED') {
        logger.error(`Servicio de predicciones no disponible en ${this.predictionApiUrl}`);
        logger.error('Asegúrate de que el servicio esté corriendo en localhost:5000');
      } else if (error.response) {
        logger.error(`Error HTTP ${error.response.status}:`, error.response.data);
      }
      
      // Retornar predicción por defecto si falla la API
      logger.info(`Usando predicción por defecto para usuario ${predictionData.user_id}`);
      return this.getDefaultPrediction(predictionData);
    }
  }

  // Predicción por defecto cuando falla la API
  getDefaultPrediction(predictionData) {
    const { user_id, ratio_actividad, intensidad_uso, consistencia_entrenamiento } = predictionData;
    
    // Lógica simple de predicción basada en variables clave
    let probabilidad_abandono = 0.5;
    let prediccion_abandono = false;
    let riesgo = "Medio";
    
    // Calcular probabilidad basada en variables
    if (ratio_actividad < 0.3) probabilidad_abandono += 0.2;
    if (intensidad_uso < 5) probabilidad_abandono += 0.15;
    if (consistencia_entrenamiento < 0.5) probabilidad_abandono += 0.1;
    
    // Determinar predicción
    prediccion_abandono = probabilidad_abandono > 0.6;
    
    // Determinar nivel de riesgo
    if (probabilidad_abandono > 0.7) riesgo = "Alto";
    else if (probabilidad_abandono > 0.4) riesgo = "Medio";
    else riesgo = "Bajo";
    
    return {
      user_id,
      prediccion_abandono,
      probabilidad_abandono: Math.min(probabilidad_abandono, 0.95),
      confianza_ensemble: 0.75,
      riesgo,
      modelos_abandono: 1,
      total_modelos: 1,
      es_anomalia: false,
      recomendaciones: this.generateRecommendations(predictionData),
      datos_originales: predictionData
    };
  }

  // Generar recomendaciones basadas en datos del usuario
  generateRecommendations(predictionData) {
    const { ratio_actividad, intensidad_uso, consistencia_entrenamiento, dias_inactivo } = predictionData;
    const recomendaciones = [];

    if (ratio_actividad < 0.3) {
      recomendaciones.push("Incrementar actividad semanal");
    }
    
    if (intensidad_uso < 5) {
      recomendaciones.push("Mejorar engagement con contenido");
    }
    
    if (consistencia_entrenamiento < 0.5) {
      recomendaciones.push("Establecer rutina de entrenamiento");
    }
    
    if (dias_inactivo > 7) {
      recomendaciones.push("Reactivar usuario inactivo");
    }
    
    if (recomendaciones.length === 0) {
      recomendaciones.push("Mantener engagement actual");
      recomendaciones.push("Contenido premium recomendado");
    }

    return recomendaciones;
  }

  // Procesar predicción completa para un usuario
  async processUserPrediction(userData) {
    try {
      const predictionData = this.preparePredictionData(userData);
      const prediction = await this.makePrediction(predictionData);
      
      logger.info(`Predicción completada para usuario ${userData.user_id}`);
      
      return prediction;
    } catch (error) {
      logger.error(`Error procesando predicción para usuario ${userData.user_id}:`, error.message);
      throw error;
    }
  }

  // Procesar múltiples usuarios
  async processMultipleUsers(usersData) {
    logger.info(`Procesando predicciones para ${usersData.length} usuarios`);
    
    const predictions = [];
    const errors = [];
    
    for (const userData of usersData) {
      try {
        const prediction = await this.processUserPrediction(userData);
        predictions.push(prediction);
      } catch (error) {
        logger.error(`Error procesando usuario ${userData.user_id}:`, error.message);
        errors.push({
          user_id: userData.user_id,
          error: error.message
        });
      }
    }
    
    logger.info(`Predicciones completadas: ${predictions.length} exitosas, ${errors.length} errores`);
    
    return {
      predictions,
      errors
    };
  }
}

module.exports = new PredictionEngine(); 