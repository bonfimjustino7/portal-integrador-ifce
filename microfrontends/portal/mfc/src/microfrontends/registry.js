import { registerApplication } from 'single-spa';

let registered = false;
let angularBundlePromise;

const angularMfeBaseUrl = import.meta.env.VITE_ANGULAR_MFE_URL || 'http://localhost:4201';
const angularBffBaseUrl = import.meta.env.VITE_ANGULAR_BFF_URL || 'http://localhost:4101';

export function registerMicrofrontend({ name, activeWhen, loadFunction, customProps = {} }) {
  registerApplication({
    name,
    app: loadFunction,
    activeWhen,
    customProps,
  });
}

function appendOnce({ id, tagName, attributes }) {
  const existing = document.getElementById(id);
  if (existing) {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    const element = document.createElement(tagName);
    element.id = id;

    Object.entries(attributes).forEach(([key, value]) => {
      element.setAttribute(key, value);
    });

    element.addEventListener('load', resolve, { once: true });
    element.addEventListener('error', reject, { once: true });
    document.head.appendChild(element);
  });
}

async function loadAngularBundle() {
  if (!angularBundlePromise) {
    angularBundlePromise = (async () => {
      await appendOnce({
        id: 'portal-angular-mfe-styles',
        tagName: 'link',
        attributes: {
          rel: 'stylesheet',
          href: `${angularMfeBaseUrl}/styles.css`,
        },
      });
      await appendOnce({
        id: 'portal-angular-mfe-polyfills',
        tagName: 'script',
        attributes: {
          type: 'module',
          src: `${angularMfeBaseUrl}/polyfills.js`,
        },
      });
      await appendOnce({
        id: 'portal-angular-mfe-script',
        tagName: 'script',
        attributes: {
          type: 'module',
          src: `${angularMfeBaseUrl}/main.js`,
        },
      });

      if (!window.portalAngularMfe) {
        throw new Error('Angular microfrontend did not expose lifecycle functions.');
      }
      return window.portalAngularMfe;
    })();
  }

  return angularBundlePromise;
}

export function registerPortalMicrofrontends() {
  if (registered) return;
  registered = true;

  registerMicrofrontend({
    name: '@portal/angular-demo',
    activeWhen: (location) => location.pathname.startsWith('/mfe/angular'),
    loadFunction: async () => ({
      bootstrap: async () => {},
      mount: async () => {
        const angularMfe = await loadAngularBundle();
        await angularMfe.mount({
          domElement: document.getElementById('angular-mfe-root'),
          bffUrl: angularBffBaseUrl,
        });
      },
      unmount: async () => {
        if (window.portalAngularMfe) {
          await window.portalAngularMfe.unmount();
        }
      },
    }),
  });
}
