import axios from 'axios';
import config from '../config.js';
import { KeycloakUnavailableError, TokenExpiredError, TokenInvalidError } from '../errors.js';

export async function validate(ssoToken) {
  if (!ssoToken) {
    throw new TokenInvalidError('Missing SSO token');
  }

  const introspectionUrl = `${config.keycloak.url}/realms/${config.keycloak.realm}/protocol/openid-connect/token/introspect`;
  const body = new URLSearchParams({
    client_id: config.keycloak.clientId,
    client_secret: config.keycloak.clientSecret,
    token: ssoToken,
  });

  let response;
  try {
    response = await axios.post(introspectionUrl, body, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      timeout: 5000,
    });
  } catch (error) {
    if (error.response?.status === 400 || error.response?.status === 401) {
      throw new TokenInvalidError();
    }
    throw new KeycloakUnavailableError();
  }

  const claims = response.data;

  if (!claims?.active) {
    throw new TokenExpiredError();
  }

  if (!claims.email) {
    throw new TokenInvalidError('SSO token does not include email claim');
  }

  return {
    email: claims.email,
    sub: claims.sub,
  };
}
