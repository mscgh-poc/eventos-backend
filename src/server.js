import 'dotenv/config';
import app from './app.js';

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  console.log(`🚀 Servidor backend de Eventos ejecutándose en http://localhost:${PORT}`);
  console.log(`🩺 Health check disponible en http://localhost:${PORT}/health`);
});

// Manejo de apagado elegante (Graceful shutdown)
const gracefulShutdown = () => {
  console.log('\nCerrando servidor HTTP...');
  server.close(() => {
    console.log('Servidor cerrado.');
    process.exit(0);
  });
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);
