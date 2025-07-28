const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function testEndpoints() {
  console.log('🧪 Probando endpoints del microservicio...\n');

  try {
    // Test 1: Health check
    console.log('1. Health check...');
    const health = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Health check:', health.data);
    console.log('');

    // Test 2: Status
    console.log('2. Status del procesamiento...');
    const status = await axios.get(`${BASE_URL}/predictions/status`);
    console.log('✅ Status:', status.data);
    console.log('');

    // Test 3: Metadata
    console.log('3. Metadata...');
    try {
      const metadata = await axios.get(`${BASE_URL}/predictions/metadata`);
      console.log('✅ Metadata:', metadata.data);
    } catch (error) {
      console.log('ℹ️  Metadata no disponible (esperado en primera ejecución)');
    }
    console.log('');

    // Test 4: Predicciones (puede tomar tiempo)
    console.log('4. Predicciones para todos los usuarios...');
    console.log('⏳ Esto puede tomar varios minutos...');
    const predictions = await axios.get(`${BASE_URL}/predictions/all`);
    console.log('✅ Predicciones obtenidas:', predictions.data.predictions.length, 'usuarios');
    console.log('📊 Metadata:', predictions.data.metadata);
    console.log('');

    // Test 5: Predicción de usuario específico
    console.log('5. Predicción de usuario específico...');
    const userPrediction = await axios.get(`${BASE_URL}/predictions/user/1`);
    console.log('✅ Predicción usuario 1:', {
      user_id: userPrediction.data.user_id,
      prediccion_abandono: userPrediction.data.prediccion_abandono,
      riesgo: userPrediction.data.riesgo,
      probabilidad_abandono: userPrediction.data.probabilidad_abandono
    });
    console.log('');

    console.log('🎉 Todos los tests completados exitosamente!');

  } catch (error) {
    console.error('❌ Error en test:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
  }
}

// Ejecutar tests
testEndpoints(); 