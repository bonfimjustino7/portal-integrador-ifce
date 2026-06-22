import express from 'express';
import { sign } from '../services/LegacyJWTFactory.js';
import { findByEmail } from '../services/LegacyUserLookup.js';
import { fetchProfessorById, fetchProfessorSchedule, fetchTeachers } from '../services/LegacyProfessorClient.js';
import { validate } from '../services/SSOTokenValidator.js';

const router = express.Router();

class ForbiddenError extends Error {
  constructor(message = 'Access denied') {
    super(message);
    this.name = 'ForbiddenError';
    this.statusCode = 403;
  }
}

class UnauthorizedError extends Error {
  constructor(message = 'Authorization Bearer token or sso_token query parameter is required') {
    super(message);
    this.name = 'UnauthorizedError';
    this.statusCode = 401;
  }
}

function getSsoToken(req) {
  const authHeader = req.get('authorization') || '';
  const [scheme, token] = authHeader.split(' ');

  if (scheme === 'Bearer' && token) {
    return token;
  }

  return req.query.sso_token;
}

async function authenticateLegacyUser(req) {
  const ssoToken = getSsoToken(req);

  if (!ssoToken) {
    throw new UnauthorizedError();
  }

  const claims = await validate(ssoToken);
  const user = await findByEmail(claims.email);
  const legacyToken = sign(user);

  return { user, legacyToken };
}

function normalizeTeacher(teacher) {
  return {
    id: teacher.id,
    name: teacher.name,
    email: teacher.email,
    nameCode: teacher.nameCode,
    role: teacher.role,
  };
}

function normalizeTeachers(payload) {
  const teachers = Array.isArray(payload) ? payload : payload?.data;

  if (!Array.isArray(teachers)) {
    return [];
  }

  return teachers.map(normalizeTeacher);
}

function normalizeSchedule(payload) {
  const schedule = Array.isArray(payload) ? payload : payload?.data;

  if (!Array.isArray(schedule)) {
    return [];
  }

  return schedule.map((semester) => ({
    semesterId: semester.semesterId ?? null,
    semesterNumber: semester.semesterNumber ?? null,
    classCode: semester.classCode ?? '',
    courseName: semester.courseName ?? null,
    assignments: Array.isArray(semester.assignments)
      ? semester.assignments.map((assignment) => ({
          disciplineId: assignment.disciplineId,
          disciplineName: assignment.disciplineName,
          disciplineCode: assignment.disciplineCode,
          day: assignment.day,
          time: {
            hourStart: assignment.time?.hourStart,
            hourEnd: assignment.time?.hourEnd,
          },
        }))
      : [],
  }));
}

function isProfessor(user) {
  return String(user.role || '').toLowerCase() === 'professor';
}

router.get('/sistema/horarios-professores/integration/professors', async (req, res, next) => {
  try {
    const { user, legacyToken } = await authenticateLegacyUser(req);

    if (isProfessor(user)) {
      const legacyProfessor = await fetchProfessorById(user.id, legacyToken);

      return res.json({
        data: [normalizeTeacher(legacyProfessor)],
        source: 'legacy-horarios',
      });
    }

    const legacyTeachers = await fetchTeachers(legacyToken);

    return res.json({
      data: normalizeTeachers(legacyTeachers),
      source: 'legacy-horarios',
    });
  } catch (error) {
    return next(error);
  }
});

router.get('/sistema/horarios-professores/integration/professors/:id/schedule', async (req, res, next) => {
  try {
    const { user, legacyToken } = await authenticateLegacyUser(req);
    const professorId = Number(req.params.id);

    if (!Number.isInteger(professorId) || professorId <= 0) {
      return res.status(404).json({ error: 'Professor not found' });
    }

    if (isProfessor(user) && Number(user.id) !== professorId) {
      throw new ForbiddenError('Professor users can only access their own schedule');
    }

    const legacySchedule = await fetchProfessorSchedule(professorId, legacyToken);

    return res.json({
      professorId,
      schedule: normalizeSchedule(legacySchedule),
      source: 'legacy-horarios',
    });
  } catch (error) {
    return next(error);
  }
});

export default router;
