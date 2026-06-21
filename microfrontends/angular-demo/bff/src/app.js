import cors from 'cors';
import express from 'express';

const app = express();
const port = process.env.PORT || 4101;
const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:9000';

app.use(cors({ origin: corsOrigin }));
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'angular-demo-bff' });
});

app.get('/api/angular-demo/summary', (req, res) => {
  res.json({
    name: 'Angular Demo',
    type: 'microfrontend',
    status: 'available',
  });
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Angular demo BFF listening on ${port}`);
});
