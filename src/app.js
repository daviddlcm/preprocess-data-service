const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const logger = require('./utils/logger');
const errorHandler = require('./middleware/errorHandler');
const predictionsRoutes = require('./routes/predictions');

const app = express();

// Configuración de rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // máximo 100 requests por ventana
  message: {
    error: 'Demasiadas peticiones desde esta IP',
    message: 'Intenta de nuevo en 15 minutos'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Configuración de Helmet para permitir Swagger UI
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://unpkg.com"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://unpkg.com"],
      fontSrc: ["'self'", "https:", "data:"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      frameSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      formAction: ["'self'"]
    }
  }
}));

// Middleware
app.use(cors());
app.use(limiter);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging de requests
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path} - ${req.ip}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'RunInsight Prediction Service',
    version: '1.0.0'
  });
});

// Swagger documentation endpoint
app.get('/api-docs', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>RunInsight Prediction Service API - Documentación</title>
        <link rel="stylesheet" type="text/css" href="https://unpkg.com/swagger-ui-dist@5.9.0/swagger-ui.css" />
        <style>
            html { box-sizing: border-box; overflow: -moz-scrollbars-vertical; overflow-y: scroll; }
            *, *:before, *:after { box-sizing: inherit; }
            body { margin:0; background: #fafafa; }
            .swagger-ui .topbar { background-color: #2c3e50; }
            .swagger-ui .topbar .download-url-wrapper .select-label { color: #fff; }
            .swagger-ui .info .title { color: #2c3e50; }
            .swagger-ui .scheme-container { background-color: #34495e; }
        </style>
    </head>
    <body>
        <div id="swagger-ui"></div>
        <script src="https://unpkg.com/swagger-ui-dist@5.9.0/swagger-ui-bundle.js"></script>
        <script src="https://unpkg.com/swagger-ui-dist@5.9.0/swagger-ui-standalone-preset.js"></script>
        <script>
            window.onload = function() {
                const ui = SwaggerUIBundle({
                    url: '/swagger.json',
                    dom_id: '#swagger-ui',
                    deepLinking: true,
                    presets: [SwaggerUIBundle.presets.apis, SwaggerUIStandalonePreset],
                    plugins: [SwaggerUIBundle.plugins.DownloadUrl],
                    layout: "StandaloneLayout",
                    validatorUrl: null,
                    docExpansion: "list",
                    filter: true,
                    showExtensions: true,
                    showCommonExtensions: true,
                    supportedSubmitMethods: ['get', 'post', 'put', 'delete', 'patch'],
                    tryItOutEnabled: true
                });
            };
        </script>
    </body>
    </html>
  `);
});

// Swagger JSON endpoint
app.get('/swagger.json', (req, res) => {
  const path = require('path');
  res.sendFile(path.join(__dirname, '..', 'swagger.json'));
});

// Mount routes
app.use('/predictions', predictionsRoutes);

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint no encontrado',
    message: `La ruta ${req.originalUrl} no existe`,
    available_endpoints: [
      'GET /health',
      'GET /api-docs',
      'GET /swagger.json',
      'GET /predictions/all',
      'GET /predictions/user/:id',
      'POST /predictions/refresh',
      'GET /predictions/status',
      'GET /predictions/endpoints-status',
      'GET /predictions/auth-test'
    ]
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  logger.info(`Servidor de predicción iniciado en puerto ${PORT}`);
  logger.info(`Health check disponible en: http://localhost:${PORT}/health`);
  logger.info(`Documentación disponible en: http://localhost:${PORT}/api-docs`);
});

module.exports = app; 