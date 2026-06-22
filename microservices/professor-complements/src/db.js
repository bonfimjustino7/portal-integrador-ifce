import mysql from 'mysql2/promise';
import config from './config.js';
import seedComplements from './seed.js';

let pool;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export function getPool() {
  if (!pool) {
    pool = mysql.createPool({
      host: config.db.host,
      port: config.db.port,
      user: config.db.user,
      password: config.db.password,
      database: config.db.database,
      waitForConnections: true,
      connectionLimit: 10,
      namedPlaceholders: true,
    });
  }

  return pool;
}

async function waitForDatabase() {
  let lastError;

  for (let attempt = 1; attempt <= config.db.waitAttempts; attempt += 1) {
    try {
      await getPool().query('SELECT 1');
      return;
    } catch (error) {
      lastError = error;
      console.warn(
        `Waiting for professor complements database (${attempt}/${config.db.waitAttempts}): ${error.message}`,
      );
      await sleep(config.db.waitDelayMs);
    }
  }

  throw lastError;
}

export async function initializeDatabase() {
  await waitForDatabase();

  await getPool().query(`
    CREATE TABLE IF NOT EXISTS professor_complements (
      id INT UNSIGNED NOT NULL AUTO_INCREMENT,
      legacy_teacher_id INT UNSIGNED NOT NULL,
      office_location VARCHAR(255) NOT NULL,
      student_service_hours_json JSON NOT NULL,
      research_area VARCHAR(255) NOT NULL,
      lattes_url VARCHAR(500) NULL,
      public_note TEXT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY professor_complements_legacy_teacher_id_unique (legacy_teacher_id)
    )
  `);

  for (const complement of seedComplements) {
    await getPool().query(
      `
        INSERT INTO professor_complements (
          legacy_teacher_id,
          office_location,
          student_service_hours_json,
          research_area,
          lattes_url,
          public_note,
          updated_at
        )
        VALUES (:legacyTeacherId, :officeLocation, :studentServiceHours, :researchArea, :lattesUrl, :publicNote, :updatedAt)
        ON DUPLICATE KEY UPDATE
          office_location = VALUES(office_location),
          student_service_hours_json = VALUES(student_service_hours_json),
          research_area = VALUES(research_area),
          lattes_url = VALUES(lattes_url),
          public_note = VALUES(public_note),
          updated_at = VALUES(updated_at)
      `,
      {
        ...complement,
        studentServiceHours: JSON.stringify(complement.studentServiceHours),
        updatedAt: complement.updatedAt.slice(0, 19).replace('T', ' '),
      },
    );
  }
}

export async function pingDatabase() {
  await getPool().query('SELECT 1');
}

export function mapComplementRow(row) {
  return {
    legacyTeacherId: row.legacy_teacher_id,
    officeLocation: row.office_location,
    studentServiceHours:
      typeof row.student_service_hours_json === 'string'
        ? JSON.parse(row.student_service_hours_json)
        : row.student_service_hours_json,
    researchArea: row.research_area,
    lattesUrl: row.lattes_url,
    publicNote: row.public_note,
    updatedAt: row.updated_at instanceof Date ? row.updated_at.toISOString() : row.updated_at,
  };
}
