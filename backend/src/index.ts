import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import apiRouter from './routes/api';

dotenv.config();

process.on('uncaughtException', (err) => {
  console.error('[Backend] Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[Backend] Unhandled Rejection:', reason);
});

const app = express();
const PORT = process.env.PORT || 5001;

// Security and utility middleware
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors({ origin: true, credentials: true }));
app.use(morgan('dev'));
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Health Check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'Nearlook Agency ERP & IT CRM Backend API',
    database: 'SQLite (dev.db)',
    version: '1.0.0'
  });
});

// Central API Router
app.use('/api', apiRouter);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.originalUrl}` });
});

// Global Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('[Backend Error]:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'An unexpected error occurred on the server.'
  });
});

app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`> Nearlook Agency IT CRM Backend API running on port ${PORT}`);
  console.log(`> Database: SQLite (prisma/dev.db)`);
  console.log(`> Health: http://localhost:${PORT}/health`);
  console.log(`=======================================================`);
});

export default app;
