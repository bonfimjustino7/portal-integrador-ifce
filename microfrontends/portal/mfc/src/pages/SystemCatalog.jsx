import React, { useEffect, useState } from 'react';
import { CalendarClock } from 'lucide-react';
import bffClient from '../services/bffClient.js';

const catalogIcons = {
  schedule: CalendarClock,
};

function getIconFallback(system) {
  return (system.name || system.slug || '?')
    .split(/[\s-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase();
}

function CatalogIcon({ system }) {
  const Icon = catalogIcons[system.icon];

  return (
    <div className="system-icon" aria-label={`Icone de ${system.name}`}>
      {Icon ? <Icon aria-hidden="true" /> : getIconFallback(system)}
    </div>
  );
}

export default function SystemCatalog() {
  const [systems, setSystems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [accessingSlug, setAccessingSlug] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;

    bffClient.get('/api/catalog')
      .then((response) => {
        if (!mounted) return;
        setSystems(response.data.systems || []);
        setError(null);
      })
      .catch(() => {
        if (!mounted) return;
        setError('Nao foi possivel carregar o catalogo de sistemas.');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  async function accessSystem(system) {
    if (!system.accessible) return;

    setAccessingSlug(system.slug);
    setError(null);

    try {
      const response = await bffClient.post(`/api/systems/${system.slug}/access`);
      window.location.href = response.data.accessUrl;
    } catch (requestError) {
      const status = requestError.response?.status;
      const message = status === 403
        ? 'Voce nao tem acesso a este sistema.'
        : 'Nao foi possivel acessar o sistema. Tente novamente mais tarde.';
      setError(message);
      setAccessingSlug(null);
    }
  }

  if (loading) {
    return <section className="page">Carregando catalogo...</section>;
  }

  return (
    <section className="page">
      <div className="page-header">
        <h1>Sistemas integrados</h1>
        <p>Escolha um sistema para abrir com sua sessao institucional.</p>
      </div>

      {error && <div className="notice error">{error}</div>}

      {systems.length === 0 ? (
        <div className="notice">Nenhum sistema disponivel para o seu perfil.</div>
      ) : (
        <div className="system-grid">
          {systems.map((system) => (
            <article className={!system.accessible ? 'system-card disabled' : 'system-card'} key={system.slug}>
              <CatalogIcon system={system} />
              <h2>{system.name}</h2>
              <p>{system.description}</p>
              <button
                type="button"
                disabled={!system.accessible || accessingSlug === system.slug}
                onClick={() => accessSystem(system)}
              >
                {accessingSlug === system.slug ? 'Abrindo...' : 'Acessar'}
              </button>
              {!system.accessible && <small>Indisponivel para o seu perfil</small>}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
