// Única puerta de entrada a las variables de entorno de Vite.
export const env = {
  apiUrl: import.meta.env.VITE_API_URL ?? '/api',
  // Dónde viven las fotos (la API las sirve en /uploads). Vacío = mismo origen que la web.
  assetsUrl: import.meta.env.VITE_ASSETS_URL ?? '',
  useMock: (import.meta.env.VITE_USE_MOCK ?? 'true') === 'true',
};

// La API guarda las fotos como '/uploads/abc.jpg' (ruta relativa).
export const assetUrl = (path) => `${env.assetsUrl}${path}`;
