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
      <a href="/mfe/stub">MFE exemplo</a>
    </aside>
  );
}
