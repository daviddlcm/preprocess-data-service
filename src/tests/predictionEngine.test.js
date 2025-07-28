const predictionEngine = require('../services/predictionEngine');

describe('PredictionEngine', () => {
  describe('calculateCompositeVariables', () => {
    test('should calculate composite variables correctly', () => {
      const userData = {
        dias_activo: 5,
        tiempo_total: 100,
        vistas_abiertas: 10,
        entrenamientos: 3
      };

      const result = predictionEngine.calculateCompositeVariables(userData);

      expect(result.ratio_actividad).toBe(5 / 7);
      expect(result.intensidad_uso).toBe(100 / 10);
      expect(result.consistencia_entrenamiento).toBe(3 / 5);
      expect(result.tendencia_tiempo).toBe(0);
      expect(result.tendencia_vistas).toBe(0);
      expect(result.tendencia_entrenamientos).toBe(0);
    });

    test('should handle division by zero', () => {
      const userData = {
        dias_activo: 0,
        tiempo_total: 100,
        vistas_abiertas: 0,
        entrenamientos: 5
      };

      const result = predictionEngine.calculateCompositeVariables(userData);

      expect(result.ratio_actividad).toBe(0);
      expect(result.intensidad_uso).toBe(0);
      expect(result.consistencia_entrenamiento).toBe(0);
    });
  });

  describe('getDefaultPrediction', () => {
    test('should generate default prediction with low risk', () => {
      const predictionData = {
        user_id: 123,
        ratio_actividad: 0.8,
        intensidad_uso: 10,
        consistencia_entrenamiento: 0.7
      };

      const result = predictionEngine.getDefaultPrediction(predictionData);

      expect(result.user_id).toBe(123);
      expect(result.prediccion_abandono).toBe(false);
      expect(result.riesgo).toBe('Bajo');
      expect(result.probabilidad_abandono).toBeLessThan(0.6);
    });

    test('should generate default prediction with high risk', () => {
      const predictionData = {
        user_id: 456,
        ratio_actividad: 0.1,
        intensidad_uso: 2,
        consistencia_entrenamiento: 0.2
      };

      const result = predictionEngine.getDefaultPrediction(predictionData);

      expect(result.user_id).toBe(456);
      expect(result.riesgo).toBe('Alto');
      expect(result.probabilidad_abandono).toBeGreaterThan(0.6);
    });
  });

  describe('generateRecommendations', () => {
    test('should generate recommendations for low activity', () => {
      const predictionData = {
        ratio_actividad: 0.1,
        intensidad_uso: 10,
        consistencia_entrenamiento: 0.7
      };

      const recommendations = predictionEngine.generateRecommendations(predictionData);

      expect(recommendations).toContain('Incrementar actividad semanal');
    });

    test('should generate recommendations for low engagement', () => {
      const predictionData = {
        ratio_actividad: 0.8,
        intensidad_uso: 2,
        consistencia_entrenamiento: 0.7
      };

      const recommendations = predictionEngine.generateRecommendations(predictionData);

      expect(recommendations).toContain('Mejorar engagement con contenido');
    });

    test('should generate default recommendations for good metrics', () => {
      const predictionData = {
        ratio_actividad: 0.8,
        intensidad_uso: 10,
        consistencia_entrenamiento: 0.8,
        dias_inactivo: 1
      };

      const recommendations = predictionEngine.generateRecommendations(predictionData);

      expect(recommendations).toContain('Mantener engagement actual');
      expect(recommendations).toContain('Contenido premium recomendado');
    });
  });
}); 