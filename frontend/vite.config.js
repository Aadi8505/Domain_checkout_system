import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    // Binds to all network interfaces so both http://127.0.0.1:5173 and http://localhost:5173 work
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
        secure: false,
        timeout: 15000,
        configure: (proxy) => {
          proxy.on('error', (err, req, res) => {
            console.warn(`[Vite Proxy] Error connecting to backend (127.0.0.1:5000) for ${req.url}:`, err.message);
            if (!res.headersSent && res.writeHead) {
              res.writeHead(503, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({
                success: false,
                message: 'Backend server at 127.0.0.1:5000 is unavailable. Please ensure backend is running.'
              }));
            }
          });
        }
      }
    }
  }
});
