// models/index.js
import fs from 'fs/promises'; // Use a versão assíncrona do fs
import path from 'path';
import { fileURLToPath } from 'url';
import { Sequelize } from 'sequelize';
import process from 'process';
import config from '../config/config.js';

// Substitua __filename e __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const basename = path.basename(__filename);
const env = process.env.NODE_ENV || 'development';

const db = {};

async function initializeDatabase() {
  let sequelize;
  const dbConfig = config[env]; 

  if (dbConfig.use_env_variable) {
    sequelize = new Sequelize(process.env[dbConfig.use_env_variable], dbConfig);
  } else {
    sequelize = new Sequelize(dbConfig.database, dbConfig.username, dbConfig.password, dbConfig);
  }

  const files = await fs.readdir(__dirname);

  for (const file of files) {
    if (
      file.indexOf('.') !== 0 &&
      file !== basename &&
      file.endsWith('.js') &&
      file.indexOf('.test.js') === -1
    ) {
      const modelPath = path.join(__dirname, file);
      const modelURL = new URL(`file://${modelPath}`).href; 
      const model = (await import(modelURL)).default(sequelize, Sequelize.DataTypes);
      db[model.name] = model;
    }
  }

  Object.keys(db).forEach(modelName => {
    if (db[modelName].associate) {
      db[modelName].associate(db);
    }
  });

  db.sequelize = sequelize;
  db.Sequelize = Sequelize;

  return db;
}

export default await initializeDatabase();