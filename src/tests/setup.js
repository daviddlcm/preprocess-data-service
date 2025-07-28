// Configuración global para tests
process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'error'; // Reducir logs en tests

// Mock de console.log para evitar output en tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
};

// Timeout global para tests
jest.setTimeout(10000); 