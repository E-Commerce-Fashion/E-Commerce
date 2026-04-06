import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';

import { apiLimiter } from './middleware/rateLimit.middleware.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';
import logger from './utils/logger.js';

import authRoutes from './routes/auth.routes.js';
import productRoutes from './routes/product.routes.js';
import paymentRoutes from './routes/payment.routes.js';
import adminRoutes from './routes/admin.routes.js';

const app = express();
const PORT = process.env.PORT || 5000;

// ── SECURITY MIDDLEWARES ──────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", 'checkout.razorpay.com'],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'res.cloudinary.com'],
      connectSrc: ["'self'", process.env.CLIENT_URL],
      frameSrc: ['checkout.razorpay.com'],
    },
  },
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

app.use(cors({
  origin: [process.env.CLIENT_URL || 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

// ── WEBHOOK — raw body BEFORE json parser ─────────────────────────
app.use('/api/payments/webhook', express.raw({ type: 'application/json' }));

// ── BODY PARSERS ──────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// ── XSS PROTECTION ────────────────────────────────────────────────
// app.use(xss()); // Removed xss-clean due to incompatibility with newer node/express

// ── REQUEST LOGGING ───────────────────────────────────────────────
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined', {
    stream: { write: (msg) => logger.info(msg.trim()) },
  }));
}

// ── GLOBAL RATE LIMIT ─────────────────────────────────────────────
app.use('/api', apiLimiter);

// ── HEALTH CHECK ─────────────────────────────────────────────────
app.get('/health', (_, res) => res.json({
  status: 'ok',
  env: process.env.NODE_ENV,
  timestamp: new Date().toISOString(),
}));

// ── API ROUTES ────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/admin', adminRoutes);

// ── ERROR HANDLING ────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ── START SERVER ──────────────────────────────────────────────────
app.listen(PORT, () => {
  logger.info(`🚀 FashionForge API running on http://localhost:${PORT}`);
  logger.info(`📦 Environment: ${process.env.NODE_ENV}`);
});

export default app;
