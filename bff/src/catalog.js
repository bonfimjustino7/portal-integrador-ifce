import config from './config.js';

export const systems = [
  {
    slug: 'horarios-professores',
    name: 'Sistema de Horarios dos Professores',
    description: 'Elaboracao e gestao de horarios academicos',
    icon: 'schedule',
    accessType: 'external-link',
    requiredRoles: ['professor', 'coordenador', 'diretor_ensino', 'admin'],
    gatewayRoute: '/gateway/horarios',
    exchangePath: '/sistema/horarios-professores/auth/exchange',
    baseUrl: config.aclPublicUrl,
  },
];

export function findSystemBySlug(slug) {
  return systems.find((system) => system.slug === slug);
}

export function toCatalogItem(system) {
  const { gatewayRoute, exchangePath, baseUrl, ...publicFields } = system;
  return publicFields;
}
