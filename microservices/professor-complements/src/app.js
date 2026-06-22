import express from 'express';
import config from './config.js';
import { initializeDatabase, pingDatabase } from './db.js';
import professorComplementsRoutes from './routes/professorComplements.js';

const app = express();

app.use(express.json());

app.get('/health', async (_req, res) => {
  try {
    await pingDatabase();
    res.json({ status: 'ok', service: 'professor-complements' });
  } catch (error) {
    res.status(503).json({
      status: 'error',
      service: 'professor-complements',
      error: 'Database unavailable',
    });
  }
});

app.use(professorComplementsRoutes);

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(500).json({ error: 'Internal server error' });
});

await initializeDatabase();

app.listen(config.port, '0.0.0.0', () => {
  console.log(`Professor complements service listening on ${config.port}`);
});
