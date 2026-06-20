import dotenv from 'dotenv';

dotenv.config();

const config = {
  port: Number(process.env.PORT || 4000),
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:9000',
  gatewayUrl: process.env.KONG_URL || 'http://kong:8000',
  aclPublicUrl: process.env.ACL_PUBLIC_URL || 'http://localhost:8080',
  keycloak: {
    url: process.env.KEYCLOAK_URL || 'http://keycloak:8080',
    realm: process.env.KEYCLOAK_REALM || 'university',
  },
};

export default config;
