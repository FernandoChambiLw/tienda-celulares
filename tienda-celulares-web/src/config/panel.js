// Roles de la base de datos y qué secciones del panel ve cada uno.
// La API es la que realmente protege los datos; esto solo decide qué mostrar.
export const ROLES = {
  admin: 'Administrador',
  seller: 'Vendedor',
  tech: 'Tecnico',
  storekeeper: 'Almacenero',
};

const ALL = Object.values(ROLES);

// Cada entrada lleva su grupo (títulos del menú lateral) y su icono (ver components/panel/Icon.jsx).
export const PANEL_NAV = [
  { to: '/panel', label: 'Resumen', icon: 'home', end: true, roles: ALL },
  { to: '/panel/ventas', label: 'Ventas', icon: 'receipt', group: 'Vender', roles: [ROLES.admin, ROLES.seller] },
  { to: '/panel/pedidos', label: 'Pedidos', icon: 'bag', group: 'Vender', roles: [ROLES.admin, ROLES.seller] },
  { to: '/panel/caja', label: 'Caja', icon: 'cash', group: 'Vender', roles: [ROLES.admin, ROLES.seller] },
  { to: '/panel/cobros', label: 'Por cobrar', icon: 'clock', group: 'Vender', roles: [ROLES.admin, ROLES.seller] },
  { to: '/panel/clientes', label: 'Clientes', icon: 'users', group: 'Vender', roles: [ROLES.admin, ROLES.seller, ROLES.tech] },
  { to: '/panel/inventario', label: 'Inventario', icon: 'box', group: 'Almacén', roles: ALL },
  { to: '/panel/productos', label: 'Productos', icon: 'phone', group: 'Almacén', roles: [ROLES.admin, ROLES.storekeeper] },
  { to: '/panel/compras', label: 'Compras', icon: 'truck', group: 'Almacén', roles: [ROLES.admin, ROLES.storekeeper] },
  { to: '/panel/proveedores', label: 'Proveedores', icon: 'store', group: 'Almacén', roles: [ROLES.admin, ROLES.storekeeper] },
  { to: '/panel/reposicion', label: 'Reposición', icon: 'refill', group: 'Almacén', roles: [ROLES.admin, ROLES.storekeeper] },
  { to: '/panel/reparaciones', label: 'Reparaciones', icon: 'wrench', group: 'Taller', roles: [ROLES.admin, ROLES.tech] },
  { to: '/panel/garantias', label: 'Garantías', icon: 'shield', group: 'Taller', roles: [ROLES.admin, ROLES.seller, ROLES.tech] },
  { to: '/panel/reportes', label: 'Reportes', icon: 'chart', group: 'Administración', roles: [ROLES.admin] },
  { to: '/panel/usuarios', label: 'Personal', icon: 'badge', group: 'Administración', roles: [ROLES.admin] },
  { to: '/panel/respaldo', label: 'Respaldo', icon: 'save', group: 'Administración', roles: [ROLES.admin] },
  { to: '/panel/bitacora', label: 'Bitácora', icon: 'log', group: 'Administración', roles: [ROLES.admin] },
];

// El Administrador siempre pasa (igual que en la API).
export const canAccess = (rol, roles) => rol === ROLES.admin || roles.includes(rol);

export const roleLabel = (rol) => (rol === 'Tecnico' ? 'Técnico' : rol);
