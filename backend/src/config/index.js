import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const config = {
  port: process.env.PORT || 5000,
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  currency: process.env.CURRENCY || 'USD',
  currencySymbol: process.env.CURRENCY_SYMBOL || '$',
  taxRate: parseFloat(process.env.TAX_RATE || '0.18'), // 18% standard tax
  reservationTTLSeconds: parseInt(process.env.RESERVATION_TTL_SECONDS || '600', 10), // 10 minutes hold
  registrarLatencyMs: parseInt(process.env.REGISTRAR_LATENCY_MS || '1200', 10),

  // File persistence path for persistent storage across backend reloads
  storageFilePath: process.env.STORAGE_FILE_PATH || path.resolve(__dirname, '../../data/domains-store.json'),

  // Dynamically configurable TLD registry with pricing and tags - zero hardcoding in business logic
  supportedTlds: {
    '.com': { price: 11.99, renewalPrice: 14.99, popular: true, category: 'Global' },
    '.in': { price: 6.99, renewalPrice: 9.99, popular: true, category: 'Regional' },
    '.net': { price: 13.99, renewalPrice: 16.99, popular: false, category: 'Network' },
    '.org': { price: 12.99, renewalPrice: 15.99, popular: false, category: 'Organization' },
    '.io': { price: 34.99, renewalPrice: 39.99, popular: true, category: 'Tech' },
    '.tech': { price: 4.99, renewalPrice: 19.99, popular: false, category: 'Tech' },
    '.co': { price: 9.99, renewalPrice: 24.99, popular: false, category: 'Business' },
    '.ai': { price: 69.99, renewalPrice: 79.99, popular: true, category: 'AI & Data' },
    '.dev': { price: 14.99, renewalPrice: 18.99, popular: false, category: 'Developer' }
  }
};
