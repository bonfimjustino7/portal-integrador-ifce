import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import config from './config.js';
import exchangeRoutes from './routes/exchange.js';
import apiProxy from './middleware/apiProxy.js';
import frontendProxy from './middleware/frontendProxy.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use(exchangeRoutes);

app.get('/auth-bridge', (_req, res) => {
  res.sendFile(path.join(__dirname, 'static', 'auth-bridge.html'));
});

app.use('/api', apiProxy);
app.use('/', frontendProxy);

app.use((error, _req, res, _next) => {
  const statusCode = error.statusCode || 500;
  res.status(statusCode).json({ error: error.message || 'Internal server error' });
});

app.listen(config.port, () => {
  console.log(`ACL listening on port ${config.port}`);
});
