import { createProxyMiddleware } from 'http-proxy-middleware';
import config from '../config.js';

const apiProxy = createProxyMiddleware({
  target: config.legacy.serverUrl,
  changeOrigin: true,
  pathRewrite: (path) => `/api${path}`,
  on: {
    proxyReq: (proxyReq) => {
      proxyReq.removeHeader('origin');
    },
  },
});

export default apiProxy;
