import { registerApplication } from 'single-spa';

let registered = false;

export function registerMicrofrontend({ name, activeWhen, loadFunction, customProps = {} }) {
  registerApplication({
    name,
    app: loadFunction,
    activeWhen,
    customProps,
  });
}

export function registerPortalMicrofrontends() {
  if (registered) return;
  registered = true;

  registerMicrofrontend({
    name: '@portal/stub',
    activeWhen: (location) => location.pathname.startsWith('/mfe/stub'),
    loadFunction: async () => ({
      bootstrap: async () => {},
      mount: async () => {
        const root = document.getElementById('mfe-root');
        if (root) {
          root.textContent = 'Microfrontend de exemplo carregado sob demanda.';
        }
      },
      unmount: async () => {
        const root = document.getElementById('mfe-root');
        if (root) {
          root.textContent = '';
        }
      },
    }),
  });
}
