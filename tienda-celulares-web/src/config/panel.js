// Roles de la base de datos y qué secciones del panel ve cada uno.
// La API es la que realmente protege los datos; esto solo decide qué mostrar.
export const ROLES = {
  admin: 'Administrador',
  seller: 'Vendedor',
  tech: 'Tecnico',
  storekeeper: 'Almacenero',
};

const ALL = Object.values(ROLES);

export const PANEL_NAV = [
  { to: '/panel', label: 'Resumen', end: true, roles: ALL },
  { to: '/panel/ventas', label: 'Ventas', roles: [ROLES.admin, ROLES.seller] },
  { to: '/panel/pedidos', label: 'Pedidos', roles: [ROLES.admin, ROLES.seller] },
  { to: '/panel/caja', label: 'Caja', roles: [ROLES.admin, ROLES.seller] },
  { to: '/panel/cobros', label: 'Por cobrar', roles: [ROLES.admin, ROLES.seller] },
  { to: '/panel/clientes', label: 'Clientes', roles: [ROLES.admin, ROLES.seller, ROLES.tech] },
  { to: '/panel/inventario', label: 'Inventario', roles: ALL },
  { to: '/panel/compras', label: 'Compras', roles: [ROLES.admin, ROLES.storekeeper] },
  { to: '/panel/proveedores', label: 'Proveedores', roles: [ROLES.admin, ROLES.storekeeper] },
  { to: '/panel/reposicion', label: 'Reposición', roles: [ROLES.admin, ROLES.storekeeper] },
  { to: '/panel/productos', label: 'Productos', roles: [ROLES.admin, ROLES.storekeeper] },
  { to: '/panel/reparaciones', label: 'Reparaciones', roles: [ROLES.admin, ROLES.tech] },
  { to: '/panel/garantias', label: 'Garantías', roles: [ROLES.admin, ROLES.seller, ROLES.tech] },
  { to: '/panel/reportes', label: 'Reportes', roles: [ROLES.admin] },
  { to: '/panel/usuarios', label: 'Personal', roles: [ROLES.admin] },
  { to: '/panel/respaldo', label: 'Respaldo', roles: [ROLES.admin] },
  { to: '/panel/bitacora', label: 'Bitácora', roles: [ROLES.admin] },
];

// El Administrador siempre pasa (igual que en la API).
export const canAccess = (rol, roles) => rol === ROLES.admin || roles.includes(rol);

export const roleLabel = (rol) => (rol === 'Tecnico' ? 'Técnico' : rol);
