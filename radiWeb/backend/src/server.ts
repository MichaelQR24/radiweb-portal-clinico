import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';

import { logger } from './utils/logger';
import { errorMiddleware } from './middlewares/error.middleware';

import authRoutes from './routes/auth.routes';
import patientRoutes from './routes/patient.routes';
import studyRoutes from './routes/study.routes';
import imageRoutes from './routes/image.routes';
import diagnosisRoutes from './routes/diagnosis.routes';
import userRoutes from './routes/user.routes';
import auditRoutes from './routes/audit.routes';

const app = express();
const PORT = parseInt(process.env['PORT'] ?? '3000', 10);
const FRONTEND_URL = process.env['FRONTEND_URL'] ?? 'http://localhost:4200';

// ─── Seguridad ───────────────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// ─── CORS – solo origen Angular ──────────────────────────────
app.use(cors({
  origin: [FRONTEND_URL, 'http://localhost:4200'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ─── Parsers ─────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// ─── Logging HTTP ────────────────────────────────────────────
app.use(morgan('combined', {
  stream: { write: (msg: string) => logger.http(msg.trim()) },
}));

// ─── Mock Storage (Fallback si no hay Azure) ─────────────────
import path from 'path';
app.use('/mock-storage', express.static(path.join(process.cwd(), 'mock-storage')));

// ─── Health check ────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({
    success: true,
    message: 'RadiWeb API – Sistema en línea',
    timestamp: new Date().toISOString(),
    environment: process.env['NODE_ENV'],
    version: '1.0.0',
  });
});

// ─── Rutas API ───────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/studies', studyRoutes);
app.use('/api/images', imageRoutes);
app.use('/api/diagnoses', diagnosisRoutes);
app.use('/api/users', userRoutes);
app.use('/api/audit', auditRoutes);

// ─── 404 handler ─────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Recurso no encontrado' });
});

// ─── Manejador centralizado de errores ───────────────────────
app.use(errorMiddleware);

// ─── Iniciar servidor ────────────────────────────────────────
app.listen(PORT, () => {
  logger.info(`🚀 RadiWeb API corriendo en http://localhost:${PORT}`);
  logger.info(`📋 Entorno: ${process.env['NODE_ENV'] ?? 'development'}`);
  logger.info(`🌐 CORS permitido para: ${FRONTEND_URL}`);
  logger.info(`📊 Health check: http://localhost:${PORT}/health`);
});

// ─── Manejo de cierre limpio ─────────────────────────────────
process.on('SIGTERM', () => {
  logger.info('Señal SIGTERM recibida – cerrando servidor...');
  process.exit(0);
});

process.on('unhandledRejection', (reason) => {
  logger.error('Promesa rechazada no manejada:', reason);
});

export default app;
