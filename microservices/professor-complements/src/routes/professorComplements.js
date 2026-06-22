import express from 'express';
import { getPool, mapComplementRow } from '../db.js';

const router = express.Router();

router.get('/api/professor-complements', async (_req, res, next) => {
  try {
    const [rows] = await getPool().query(`
      SELECT
        legacy_teacher_id,
        office_location,
        student_service_hours_json,
        research_area,
        lattes_url,
        public_note,
        updated_at
      FROM professor_complements
      ORDER BY legacy_teacher_id ASC
    `);

    res.json({ data: rows.map(mapComplementRow) });
  } catch (error) {
    next(error);
  }
});

router.get('/api/professor-complements/:legacyTeacherId', async (req, res, next) => {
  try {
    const legacyTeacherId = Number(req.params.legacyTeacherId);

    if (!Number.isInteger(legacyTeacherId) || legacyTeacherId <= 0) {
      res.status(400).json({ error: 'legacyTeacherId must be a positive integer' });
      return;
    }

    const [rows] = await getPool().query(
      `
        SELECT
          legacy_teacher_id,
          office_location,
          student_service_hours_json,
          research_area,
          lattes_url,
          public_note,
          updated_at
        FROM professor_complements
        WHERE legacy_teacher_id = ?
        LIMIT 1
      `,
      [legacyTeacherId],
    );

    if (rows.length === 0) {
      res.status(404).json({ error: 'Professor complement not found' });
      return;
    }

    res.json(mapComplementRow(rows[0]));
  } catch (error) {
    next(error);
  }
});

export default router;
