export class TokenInvalidError extends Error {
  constructor(message = 'Invalid SSO token') {
    super(message);
    this.name = 'TokenInvalidError';
    this.statusCode = 401;
  }
}

export class TokenExpiredError extends Error {
  constructor(message = 'Expired or inactive SSO token') {
    super(message);
    this.name = 'TokenExpiredError';
    this.statusCode = 401;
  }
}

export class KeycloakUnavailableError extends Error {
  constructor(message = 'Keycloak unavailable') {
    super(message);
    this.name = 'KeycloakUnavailableError';
    this.statusCode = 503;
  }
}

export class UserNotFoundError extends Error {
  constructor(message = 'User not provisioned in legacy system') {
    super(message);
    this.name = 'UserNotFoundError';
    this.statusCode = 403;
  }
}

export class LegacyServerUnavailableError extends Error {
  constructor(message = 'Legacy server unavailable') {
    super(message);
    this.name = 'LegacyServerUnavailableError';
    this.statusCode = 502;
  }
}
