import axios from 'axios';
import config from '../config.js';

const gatewayClient = axios.create({
  baseURL: config.gatewayUrl,
  timeout: 8000,
});

export async function requestTokenExchange(system, ssoToken) {
  try {
    const response = await gatewayClient.get(`${system.gatewayRoute}${system.exchangePath}`, {
      params: { sso_token: ssoToken },
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${ssoToken}`,
      },
    });

    return response.data;
  } catch (error) {
    if (error.response) {
      const mapped = new Error(error.response.data?.error || 'Gateway request failed');
      mapped.statusCode = error.response.status;
      throw mapped;
    }

    const unavailable = new Error('API Gateway unavailable');
    unavailable.statusCode = 503;
    throw unavailable;
  }
}
