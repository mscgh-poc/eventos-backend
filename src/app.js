import express from 'express';
import cors from 'cors';
import healthRouter from './routes/health.js';
import eventosRouter from './routes/eventos.js';

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Request logging minimal
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (process.env.NODE_ENV !== 'test') {
      console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} ${res.statusCode} (${duration}ms)`);
    }
  });
  next();
});

// Rutas
app.use('/health', healthRouter);
app.use('/api/eventos', eventosRouter);

// Root bienvenida
app.get('/', (req, res) => {
  res.json({
    message: 'API de Gestión de Eventos Académicos - UNMSM FISI',
    endpoints: {
      health: '/health',
      eventos: '/api/eventos',
      delayDemo: '/api/eventos/delay/2000',
    },
  });
});

// Manejo de 404
app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

export default app;
