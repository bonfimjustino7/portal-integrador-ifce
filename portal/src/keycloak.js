import Keycloak from 'keycloak-js';

let keycloak;

const keycloakConfig = {
  url: import.meta.env.VITE_KEYCLOAK_URL || 'http://localhost:8180',
  realm: import.meta.env.VITE_KEYCLOAK_REALM || 'university',
  clientId: import.meta.env.VITE_KEYCLOAK_CLIENT_ID || 'painel-integrador',
};

export async function initKeycloak() {
  if (keycloak?.authenticated) {
    return keycloak;
  }

  keycloak = new Keycloak(keycloakConfig);

  await keycloak.init({
    onLoad: 'login-required',
    checkLoginIframe: false,
  });

  keycloak.onTokenExpired = () => {
    keycloak.updateToken(30).catch(() => keycloak.login());
  };

  return keycloak;
}

export async function getToken() {
  if (!keycloak) {
    await initKeycloak();
  }

  await keycloak.updateToken(30);
  return keycloak.token;
}

export function getUserProfile() {
  const claims = keycloak?.tokenParsed || {};

  return {
    name: claims.name || claims.preferred_username || claims.email || 'Usuario',
    email: claims.email,
    roles: claims.realm_access?.roles || [],
  };
}

export function logout() {
  return keycloak?.logout({ redirectUri: window.location.origin });
}
