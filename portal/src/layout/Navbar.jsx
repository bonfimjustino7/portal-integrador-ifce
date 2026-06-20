import React from 'react';
import { logout } from '../keycloak.js';

export default function Navbar({ user }) {
  return (
    <header className="navbar">
      <div>
        <strong>Portal Integrador</strong>
        <span>IFCE Campus Cedro</span>
      </div>
      <div className="user-area">
        <span>{user.name}</span>
        <small>{user.roles.join(', ') || 'sem perfil'}</small>
        <button type="button" onClick={logout}>Sair</button>
      </div>
    </header>
  );
}
