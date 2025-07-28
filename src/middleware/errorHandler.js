const logger = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
  // Log del error
  logger.error('Error en la aplicación:', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  // Determinar el tipo de error y responder apropiadamente
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Error de validación',
      message: err.message,
      details: err.details
    });
  }

  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({
      error: 'No autorizado',
      message: 'Token inválido o expirado'
    });
  }

  if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND') {
    return res.status(503).json({
      error: 'Servicio no disponible',
      message: 'No se pudo conectar con el servicio externo'
    });
  }

  if (err.status === 429) {
    return res.status(429).json({
      error: 'Demasiadas peticiones',
      message: 'Rate limit excedido, intenta de nuevo más tarde'
    });
  }

  if (err.status === 404) {
    return res.status(404).json({
      error: 'Recurso no encontrado',
      message: err.message
    });
  }

  // Error por defecto
  const statusCode = err.status || 500;
  const message = err.message || 'Error interno del servidor';

  res.status(statusCode).json({
    error: 'Error del servidor',
    message: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

module.exports = errorHandler; 