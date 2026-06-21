import dotenv from 'dotenv';

dotenv.config();

const config = {
  port: Number(process.env.PORT || 8080),
  keycloak: {
    url: process.env.KEYCLOAK_URL || 'http://keycloak:8080',
    realm: process.env.KEYCLOAK_REALM || 'university',
    clientId: process.env.KEYCLOAK_CLIENT_ID || 'acl-client',
    clientSecret: process.env.KEYCLOAK_CLIENT_SECRET || 'change-me',
  },
  legacy: {
    serverUrl: process.env.LEGACY_SERVER_URL || 'http://legacy-server:5001',
    clientUrl: process.env.LEGACY_CLIENT_URL || 'http://legacy-client:3000',
    internalApiKey: process.env.INTERNAL_API_KEY || 'dev-internal-api-key',
    jwtSecret: process.env.JWT_SECRET || 'sua_chave_secreta_aqui',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '8h',
  },
};

export default config;
