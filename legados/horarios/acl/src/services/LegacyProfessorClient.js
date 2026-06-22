import axios from 'axios';
import config from '../config.js';

class LegacyIntegrationError extends Error {
  constructor(statusCode, message, details) {
    super(message);
    this.name = 'LegacyIntegrationError';
    this.statusCode = statusCode;
    this.details = details;
  }
}

function mapLegacyError(error, fallbackMessage) {
  if (error.response) {
    const status = error.response.status;
    const legacyMessage = error.response.data?.error || error.response.data?.message;

    if ([401, 403, 404].includes(status)) {
      throw new LegacyIntegrationError(status, legacyMessage || fallbackMessage);
    }

    throw new LegacyIntegrationError(502, fallbackMessage, legacyMessage);
  }

  throw new LegacyIntegrationError(502, 'Legacy server unavailable');
}

function legacyAuthHeaders(legacyToken) {
  return {
    Authorization: `Bearer ${legacyToken}`,
  };
}

export async function fetchTeachers(legacyToken) {
  try {
    const response = await axios.get(`${config.legacy.serverUrl}/api/users/teachers`, {
      headers: legacyAuthHeaders(legacyToken),
      timeout: 5000,
    });

    return response.data;
  } catch (error) {
    mapLegacyError(error, 'Unable to fetch legacy professors');
  }
}

export async function fetchProfessorSchedule(professorId, legacyToken) {
  try {
    const response = await axios.get(`${config.legacy.serverUrl}/api/users/${professorId}/schedule`, {
      headers: legacyAuthHeaders(legacyToken),
      timeout: 5000,
    });

    return response.data;
  } catch (error) {
    mapLegacyError(error, 'Unable to fetch legacy professor schedule');
  }
}

export async function fetchProfessorById(professorId, legacyToken) {
  try {
    const response = await axios.get(`${config.legacy.serverUrl}/api/users/${professorId}`, {
      headers: legacyAuthHeaders(legacyToken),
      timeout: 5000,
    });

    return response.data;
  } catch (error) {
    mapLegacyError(error, 'Unable to fetch legacy professor');
  }
}
