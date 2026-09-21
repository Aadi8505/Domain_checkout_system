import express from 'express';
import cors from 'cors';
import { config } from './config/index.js';
import { InMemoryDomainRepository } from './repositories/inMemoryDomainRepository.js';
import { RegistrarClient } from './services/registrarClient.js';
import { DomainService } from './services/domainService.js';
import { CheckoutService } from './services/checkoutService.js';
import { DomainController } from './controllers/domainController.js';
import { CheckoutController } from './controllers/checkoutController.js';

const app = express();

// Middlewares
app.use(cors({
  origin: '*', // Allow all origins for dev/monorepo flexibility
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Request logging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Dependency Injection Composition Root
const domainRepository = new InMemoryDomainRepository();
const registrarClient = new RegistrarClient({ latencyMs: config.registrarLatencyMs });
const domainService = new DomainService(domainRepository);
const checkoutService = new CheckoutService(domainRepository, registrarClient);

const domainController = new DomainController(domainService);
const checkoutController = new CheckoutController(checkoutService);

// Domain Routes
app.get('/api/domains/search', domainController.search);
app.get('/api/domains/status/:domainName', domainController.getStatus);
app.get('/api/domains/config', domainController.getConfig);

// Checkout & Ownership Routes
app.post('/api/checkout/reserve', checkoutController.reserve);
app.post('/api/checkout/purchase', checkoutController.purchase);
app.get('/api/checkout/my-domains', checkoutController.getMyDomains);
app.get('/api/checkout/all', checkoutController.getAllPurchased);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'GoDaddy Domain Search & Checkout System',
    timestamp: new Date().toISOString(),
    currency: config.currency,
    supportedTldsCount: Object.keys(config.supportedTlds).length
  });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.method} ${req.url} not found` });
});

// Central Error Handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

const PORT = config.port;
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`🚀 GoDaddy Domain Backend running on http://localhost:${PORT}`);
    console.log(`📦 Loaded ${Object.keys(config.supportedTlds).length} configurable TLDs`);
  });
}

export { app, domainRepository, domainService, checkoutService };
