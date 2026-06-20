import { createProxyMiddleware } from 'http-proxy-middleware';
import config from '../config.js';

const frontendProxy = createProxyMiddleware({
  target: config.legacy.clientUrl,
  changeOrigin: true,
  ws: true,
});

export default frontendProxy;
