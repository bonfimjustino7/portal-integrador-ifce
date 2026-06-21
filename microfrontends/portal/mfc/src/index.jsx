import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { start } from 'single-spa';
import Shell from './layout/Shell.jsx';
import { initKeycloak } from './keycloak.js';
import { registerPortalMicrofrontends } from './microfrontends/registry.js';
import './styles.css';

function AppBootstrap() {
  const [state, setState] = useState({ loading: true, error: null });

  useEffect(() => {
    let mounted = true;

    initKeycloak()
      .then(() => {
        if (!mounted) return;
        registerPortalMicrofrontends();
        start();
        setState({ loading: false, error: null });
      })
      .catch(() => {
        if (!mounted) return;
        setState({
          loading: false,
          error: 'Nao foi possivel iniciar a autenticacao do portal.',
        });
      });

    return () => {
      mounted = false;
    };
  }, []);

  if (state.loading) {
    return <main className="center-state">Carregando portal...</main>;
  }

  if (state.error) {
    return <main className="center-state error">{state.error}</main>;
  }

  return <Shell />;
}

createRoot(document.getElementById('root')).render(<AppBootstrap />);
