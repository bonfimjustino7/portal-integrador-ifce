import dotenv from 'dotenv';

dotenv.config();

const config = {
  port: Number(process.env.PORT || 4300),
  db: {
    host: process.env.DB_HOST || 'professor-complements-db',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'professor_complements_user',
    password: process.env.DB_PASSWORD || 'professor_complements_password',
    database: process.env.DB_DATABASE || 'professor_complements',
    waitAttempts: Number(process.env.DB_WAIT_ATTEMPTS || 30),
    waitDelayMs: Number(process.env.DB_WAIT_DELAY_MS || 2000),
  },
};

export default config;
