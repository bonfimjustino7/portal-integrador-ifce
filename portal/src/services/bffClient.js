import axios from 'axios';
import { getToken } from '../keycloak.js';

const bffClient = axios.create({
  baseURL: import.meta.env.VITE_BFF_URL || 'http://localhost:4000',
  timeout: 10000,
});

bffClient.interceptors.request.use(async (config) => {
  const token = await getToken();
  config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default bffClient;
