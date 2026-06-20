import React, { useState } from 'react';
import { getUserProfile } from '../keycloak.js';
import Dashboard from '../pages/Dashboard.jsx';
import SystemCatalog from '../pages/SystemCatalog.jsx';
import Navbar from './Navbar.jsx';
import Sidebar from './Sidebar.jsx';

export default function Shell() {
  const [activePage, setActivePage] = useState('catalog');
  const user = getUserProfile();

  return (
    <div className="app-shell">
      <Navbar user={user} />
      <div className="shell-body">
        <Sidebar activePage={activePage} onNavigate={setActivePage} />
        <main className="content">
          {activePage === 'dashboard' ? <Dashboard user={user} /> : <SystemCatalog user={user} />}
          <div id="mfe-slot" />
        </main>
      </div>
    </div>
  );
}
