import cors from 'cors';
import express from 'express';
import axios from 'axios';

const app = express();
const port = process.env.PORT || 4101;
const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:9000';
const kongUrl = process.env.KONG_URL || 'http://kong:8000';
const legacyProfessorsPath =
  process.env.LEGACY_PROFESSORS_PATH ||
  '/gateway/horarios/sistema/horarios-professores/integration/professors';
const professorComplementsPath =
  process.env.PROFESSOR_COMPLEMENTS_PATH ||
  '/gateway/professor-complements/api/professor-complements';

const gatewayClient = axios.create({
  baseURL: kongUrl,
  timeout: 8000,
});

app.use(cors({ origin: corsOrigin }));
app.use(express.json());

function decodeBase64Url(value) {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), '=');
  return Buffer.from(padded, 'base64').toString('utf8');
}

function decodeJwt(token) {
  const parts = token.split('.');

  if (parts.length < 2) {
    throw new Error('Malformed JWT');
  }

  return JSON.parse(decodeBase64Url(parts[1]));
}

function requireSsoToken(req, res, next) {
  const authHeader = req.get('authorization') || '';
  const [, token] = authHeader.match(/^Bearer\s+(.+)$/i) || [];

  if (!token) {
    return res.status(401).json({ error: 'Missing bearer token' });
  }

  try {
    const claims = decodeJwt(token);
    const now = Math.floor(Date.now() / 1000);

    if (claims.exp && claims.exp <= now) {
      return res.status(401).json({ error: 'Invalid or expired SSO token' });
    }

    req.ssoToken = token;
    req.user = {
      sub: claims.sub,
      email: claims.email,
      name: claims.name || claims.preferred_username || claims.email,
      roles: claims.realm_access?.roles || [],
    };

    return next();
  } catch (_error) {
    return res.status(401).json({ error: 'Invalid or expired SSO token' });
  }
}

async function gatewayGet(path, ssoToken, options = {}) {
  try {
    const response = await gatewayClient.get(path, {
      ...options,
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${ssoToken}`,
        ...options.headers,
      },
    });

    return response.data;
  } catch (error) {
    if (error.response) {
      const mapped = new Error(error.response.data?.error || 'Gateway request failed');
      mapped.statusCode = error.response.status;
      mapped.responseData = error.response.data;
      throw mapped;
    }

    const unavailable = new Error('API Gateway unavailable');
    unavailable.statusCode = 503;
    throw unavailable;
  }
}

function normalizeTeachers(payload) {
  const teachers = Array.isArray(payload?.data) ? payload.data : Array.isArray(payload) ? payload : [];

  return teachers.map((teacher) => ({
    id: Number(teacher.id),
    name: teacher.name,
    email: teacher.email,
    nameCode: teacher.nameCode,
    role: teacher.role,
  }));
}

function normalizeComplements(payload) {
  const complements = Array.isArray(payload?.data) ? payload.data : Array.isArray(payload) ? payload : [];
  const byTeacherId = new Map();

  complements.forEach((complement) => {
    const legacyTeacherId = Number(complement.legacyTeacherId);
    if (!Number.isNaN(legacyTeacherId)) {
      byTeacherId.set(legacyTeacherId, {
        legacyTeacherId,
        officeLocation: complement.officeLocation || null,
        studentServiceHours: complement.studentServiceHours || [],
        researchArea: complement.researchArea || null,
        lattesUrl: complement.lattesUrl || null,
        publicNote: complement.publicNote || null,
        updatedAt: complement.updatedAt || null,
      });
    }
  });

  return byTeacherId;
}

function normalizeSchedule(payload) {
  if (Array.isArray(payload?.schedule)) {
    return payload.schedule;
  }

  if (Array.isArray(payload?.data)) {
    return payload.data;
  }

  return [];
}

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

app.get('/api/angular-demo/professors', requireSsoToken, async (req, res) => {
  try {
    const legacyPayload = await gatewayGet(legacyProfessorsPath, req.ssoToken);
    const teachers = normalizeTeachers(legacyPayload);
    let complementStatus = 'available';
    let complementsByTeacherId = new Map();

    try {
      const complementPayload = await gatewayGet(professorComplementsPath, req.ssoToken);
      complementsByTeacherId = normalizeComplements(complementPayload);
    } catch (error) {
      complementStatus = 'unavailable';
    }

    res.json({
      data: teachers.map((teacher) => ({
        ...teacher,
        complement: complementsByTeacherId.get(teacher.id) || null,
      })),
      source: {
        legacy: 'horarios',
        complement: 'professor-complements',
      },
      complementSourceStatus: complementStatus,
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      error: error.message || 'Unable to load professors',
    });
  }
});

app.get('/api/angular-demo/professors/:id/schedule', requireSsoToken, async (req, res) => {
  const professorId = Number(req.params.id);

  if (!Number.isInteger(professorId) || professorId <= 0) {
    return res.status(400).json({ error: 'Invalid professor id' });
  }

  try {
    let schedule = [];

    try {
      const schedulePayload = await gatewayGet(
        `${legacyProfessorsPath}/${professorId}/schedule`,
        req.ssoToken,
      );
      schedule = normalizeSchedule(schedulePayload);
    } catch (error) {
      if (error.statusCode !== 404) {
        throw error;
      }
    }

    let complement = null;
    try {
      complement = await gatewayGet(`${professorComplementsPath}/${professorId}`, req.ssoToken);
    } catch (error) {
      if (error.statusCode !== 404) {
        complement = null;
      }
    }

    return res.json({
      professorId,
      schedule,
      complement,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      error: error.message || 'Unable to load professor schedule',
    });
  }
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Angular demo BFF listening on ${port}`);
});
