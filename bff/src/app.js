import cors from 'cors';
import express from 'express';
import config from './config.js';
import { authMiddleware } from './middleware/authMiddleware.js';
import catalogRoutes from './routes/catalog.js';
import systemsRoutes from './routes/systems.js';
import userRoutes from './routes/user.js';

const app = express();

app.use(cors({
  origin: config.corsOrigin,
  credentials: true,
}));
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use(authMiddleware);
app.use(catalogRoutes);
app.use(userRoutes);
app.use(systemsRoutes);

app.use((error, _req, res, _next) => {
  const statusCode = error.statusCode || 500;
  res.status(statusCode).json({ error: error.message || 'Internal server error' });
});

app.listen(config.port, () => {
  console.log(`BFF listening on port ${config.port}`);
});
