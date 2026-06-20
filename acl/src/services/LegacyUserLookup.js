import axios from 'axios';
import config from '../config.js';
import { LegacyServerUnavailableError, UserNotFoundError } from '../errors.js';

export async function findByEmail(email) {
  try {
    const response = await axios.get(`${config.legacy.serverUrl}/api/internal/user-by-email`, {
      headers: { 'X-Internal-Key': config.legacy.internalApiKey },
      params: { email },
      timeout: 5000,
    });

    return response.data;
  } catch (error) {
    if (error.response?.status === 404) {
      throw new UserNotFoundError();
    }

    if (error.response?.status === 403) {
      throw new LegacyServerUnavailableError('Legacy internal authentication failed');
    }

    throw new LegacyServerUnavailableError();
  }
}
