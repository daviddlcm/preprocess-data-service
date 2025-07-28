const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function testPerformance() {
  console.log('🚀 Test de Performance del Microservicio\n');

  try {
    // Test 1: Health check (baseline)
    console.log('1. Health check (baseline)...');
    const startHealth = Date.now();
    const health = await axios.get(`${BASE_URL}/health`);
    const healthTime = Date.now() - startHealth;
    console.log(`✅ Health check: ${healthTime}ms`);
    console.log('');

    // Test 2: Configuración actual
    console.log('2. Configuración actual...');
    const config = await axios.get(`${BASE_URL}/predictions/config`);
    console.log('✅ Configuración:', config.data);
    console.log('');

    // Test 2.5: Estado de endpoints masivos
    console.log('2.5. Estado de endpoints masivos...');
    const endpointsStatus = await axios.get(`${BASE_URL}/predictions/endpoints-status`);
    console.log('✅ Endpoints masivos:', endpointsStatus.data);
    console.log(`📊 Estrategia recomendada: ${endpointsStatus.data.recommended_strategy}`);
    console.log(`🔗 Endpoints disponibles: ${endpointsStatus.data.available_endpoints}/5`);
    console.log('');

    // Test 3: Predicciones con medición de tiempo
    console.log('3. Predicciones (con medición de tiempo)...');
    const startPredictions = Date.now();
    
    const predictions = await axios.get(`${BASE_URL}/predictions/all`);
    const predictionsTime = Date.now() - startPredictions;
    
    console.log(`✅ Predicciones completadas en: ${predictionsTime}ms`);
    console.log(`📊 Usuarios procesados: ${predictions.data.predictions.length}`);
    console.log(`📈 Metadata:`, predictions.data.metadata);
    
    // Calcular métricas de performance
    const avgTimePerUser = predictionsTime / predictions.data.predictions.length;
    console.log(`⚡ Tiempo promedio por usuario: ${avgTimePerUser.toFixed(2)}ms`);
    console.log('');

    // Test 4: Predicción individual
    console.log('4. Predicción individual...');
    const startIndividual = Date.now();
    const individual = await axios.get(`${BASE_URL}/predictions/user/1`);
    const individualTime = Date.now() - startIndividual;
    console.log(`✅ Predicción individual: ${individualTime}ms`);
    console.log('');

    // Test 5: Comparación con cache
    console.log('5. Test con cache...');
    const startCache = Date.now();
    const cached = await axios.get(`${BASE_URL}/predictions/all`);
    const cacheTime = Date.now() - startCache;
    console.log(`✅ Respuesta con cache: ${cacheTime}ms`);
    console.log(`🚀 Mejora de velocidad: ${((predictionsTime - cacheTime) / predictionsTime * 100).toFixed(1)}%`);
    console.log('');

    // Resumen de performance
    console.log('📊 RESUMEN DE PERFORMANCE:');
    console.log(`   • Health check: ${healthTime}ms`);
    console.log(`   • Predicciones completas: ${predictionsTime}ms`);
    console.log(`   • Predicción individual: ${individualTime}ms`);
    console.log(`   • Respuesta con cache: ${cacheTime}ms`);
    console.log(`   • Tiempo promedio por usuario: ${avgTimePerUser.toFixed(2)}ms`);
    console.log(`   • Usuarios por segundo: ${(1000 / avgTimePerUser).toFixed(2)}`);
    console.log('');

    // Recomendaciones
    console.log('💡 RECOMENDACIONES:');
    if (predictionsTime > 60000) {
      console.log('   ⚠️  Tiempo total > 60s: Considerar aumentar BATCH_SIZE');
    }
    if (avgTimePerUser > 5000) {
      console.log('   ⚠️  Tiempo por usuario > 5s: Optimizar timeouts');
    }
    if (cacheTime > 1000) {
      console.log('   ⚠️  Cache lento: Revisar implementación');
    }
    console.log('   ✅ Performance dentro de rangos aceptables');

  } catch (error) {
    console.error('❌ Error en test de performance:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
  }
}

// Ejecutar test de performance
testPerformance(); 