import React, { useEffect, useState } from 'react';
import { getUserProfile } from '../keycloak.js';
import Dashboard from '../pages/Dashboard.jsx';
import SystemCatalog from '../pages/SystemCatalog.jsx';
import Navbar from './Navbar.jsx';
import Sidebar from './Sidebar.jsx';

function pageFromLocation() {
  if (window.location.pathname.startsWith('/mfe/angular')) {
    return 'angular-mfe';
  }

  if (window.location.pathname.startsWith('/dashboard')) {
    return 'dashboard';
  }

  return 'catalog';
}

export default function Shell() {
  const [activePage, setActivePage] = useState(pageFromLocation);
  const user = getUserProfile();

  useEffect(() => {
    const handleLocationChange = () => {
      setActivePage(pageFromLocation());
    };

    window.addEventListener('popstate', handleLocationChange);
    return () => window.removeEventListener('popstate', handleLocationChange);
  }, []);

  function navigate(page) {
    const pathByPage = {
      dashboard: '/dashboard',
      catalog: '/',
      'angular-mfe': '/mfe/angular',
    };
    const path = pathByPage[page] || '/';

    window.history.pushState({}, '', path);
    window.dispatchEvent(new PopStateEvent('popstate'));
    setActivePage(page);
  }

  return (
    <div className="app-shell">
      <Navbar user={user} />
      <div className="shell-body">
        <Sidebar activePage={activePage} onNavigate={navigate} />
        <main className="content">
          {activePage === 'dashboard' && <Dashboard user={user} />}
          {activePage === 'catalog' && <SystemCatalog user={user} />}
          {activePage === 'angular-mfe' && (
            <section className="page">
              <div className="page-header">
                <h1>Modulo Angular</h1>
                <p>Microfrontend carregado sob demanda dentro do Portal Integrador.</p>
              </div>
              <div id="angular-mfe-root" />
            </section>
          )}
        </main>
      </div>
    </div>
  );
}
