import React from 'react';

export default function Sidebar({ activePage, onNavigate }) {
  return (
    <aside className="sidebar">
      <button
        type="button"
        className={activePage === 'dashboard' ? 'active' : ''}
        onClick={() => onNavigate('dashboard')}
      >
        Inicio
      </button>
      <button
        type="button"
        className={activePage === 'catalog' ? 'active' : ''}
        onClick={() => onNavigate('catalog')}
      >
        Sistemas
      </button>
      <button
        type="button"
        className={activePage === 'angular-mfe' ? 'active' : ''}
        onClick={() => onNavigate('angular-mfe')}
      >
        Modulo Angular
      </button>
    </aside>
  );
}
