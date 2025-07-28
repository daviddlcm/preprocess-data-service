const axios = require('axios');

const PREDICTION_SERVICE_URL = 'http://localhost:5000';
const MICROSERVICE_URL = 'http://localhost:3000';

async function testIntegration() {
  console.log('🔗 Test de Integración con Servicio de Predicciones\n');

  try {
    // Test 1: Verificar servicio de predicciones local
    console.log('1. Verificando servicio de predicciones local...');
    try {
      const predictionHealth = await axios.get(`${PREDICTION_SERVICE_URL}/health`, { timeout: 5000 });
      console.log('✅ Servicio de predicciones disponible:', predictionHealth.data);
    } catch (error) {
      console.log('❌ Servicio de predicciones no disponible en localhost:5000');
      console.log('   Asegúrate de que esté corriendo en http://localhost:5000');
      return;
    }
    console.log('');

    // Test 2: Probar predicción directa
    console.log('2. Probando predicción directa...');
    const testData = {
      user_id: 1,
      dias_registrado: 30,
      tiempo_total: 120.5,
      vistas_abiertas: 15,
      dias_activo: 5,
      dias_inactivo: 2,
      entrenamientos: 8,
      tiempo_total_entrenamientos: 45.2,
      promedio_ritmo_entrenamientos: 5.5,
      interacciones_chatbot: 12,
      ratio_actividad: 0.71,
      intensidad_uso: 8.03,
      consistencia_entrenamiento: 1.6,
      tendencia_tiempo: 0,
      tendencia_vistas: 0,
      tendencia_entrenamientos: 0,
      preguntas_por_categoria: {}
    };

    try {
      const directPrediction = await axios.post(`${PREDICTION_SERVICE_URL}/predict`, testData, { timeout: 10000 });
      console.log('✅ Predicción directa exitosa:', {
        user_id: directPrediction.data.user_id,
        prediccion_abandono: directPrediction.data.prediccion_abandono,
        probabilidad_abandono: directPrediction.data.probabilidad_abandono,
        riesgo: directPrediction.data.riesgo
      });
    } catch (error) {
      console.log('❌ Error en predicción directa:', error.message);
      if (error.response) {
        console.log('   Status:', error.response.status);
        console.log('   Data:', error.response.data);
      }
    }
    console.log('');

    // Test 3: Verificar microservicio
    console.log('3. Verificando microservicio...');
    try {
      const microserviceHealth = await axios.get(`${MICROSERVICE_URL}/health`, { timeout: 5000 });
      console.log('✅ Microservicio disponible:', microserviceHealth.data);
    } catch (error) {
      console.log('❌ Microservicio no disponible en localhost:3000');
      console.log('   Ejecuta: npm start');
      return;
    }
    console.log('');

    // Test 4: Probar integración completa
    console.log('4. Probando integración completa...');
    console.log('   ⏳ Esto puede tomar tiempo...');
    
    const startTime = Date.now();
    const integrationTest = await axios.get(`${MICROSERVICE_URL}/predictions/user/1`, { timeout: 30000 });
    const integrationTime = Date.now() - startTime;
    
    console.log('✅ Integración exitosa:', {
      user_id: integrationTest.data.user_id,
      prediccion_abandono: integrationTest.data.prediccion_abandono,
      probabilidad_abandono: integrationTest.data.probabilidad_abandono,
      riesgo: integrationTest.data.riesgo,
      tiempo_respuesta: `${integrationTime}ms`
    });
    console.log('');

    // Test 5: Verificar configuración
    console.log('5. Verificando configuración...');
    const config = await axios.get(`${MICROSERVICE_URL}/predictions/config`);
    console.log('✅ Configuración actual:', config.data);
    console.log('');

    // Test 2.5: Test de autenticación
    console.log('2.5. Test de autenticación con API Gateway...');
    const authTest = await axios.get(`${MICROSERVICE_URL}/predictions/auth-test`);
    console.log('✅ Test de autenticación:', authTest.data.summary);
    console.log(`📊 Token configurado: ${authTest.data.admin_token_configured}`);
    console.log(`🔗 Endpoints disponibles: ${authTest.data.summary.available_endpoints}/${authTest.data.summary.total_endpoints}`);
    console.log(`📈 Tasa de éxito: ${authTest.data.summary.success_rate}`);
    console.log('');

    // Test 2.6: Estado de endpoints masivos
    console.log('2.6. Estado de endpoints masivos...');
    const endpointsStatus = await axios.get(`${MICROSERVICE_URL}/predictions/endpoints-status`);
    console.log('✅ Endpoints masivos:', endpointsStatus.data);
    console.log(`📊 Estrategia recomendada: ${endpointsStatus.data.recommended_strategy}`);
    console.log(`🔗 Endpoints disponibles: ${endpointsStatus.data.available_endpoints}/5`);
    console.log('');

    console.log('🎉 Integración completada exitosamente!');
    console.log('');
    console.log('📊 RESUMEN:');
    console.log('   • Servicio de predicciones: ✅');
    console.log('   • Microservicio: ✅');
    console.log('   • Integración: ✅');
    console.log('   • Tiempo de respuesta: ' + integrationTime + 'ms');

  } catch (error) {
    console.error('❌ Error en test de integración:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
  }
}

// Ejecutar test de integración
testIntegration(); 