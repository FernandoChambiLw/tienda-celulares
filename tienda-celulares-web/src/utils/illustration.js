// Decide qué ilustración y qué color mostrar cuando un producto no tiene foto.

const KIND_BY_CATEGORY = {
  Celulares: 'phone',
  Audífonos: 'headphones',
  'Cargadores y cables': 'charger',
  'Fundas y protectores': 'case',
  'Protectores de pantalla': 'glass',
  'Smartwatch y pulseras': 'band',
};

const KIND_BY_TYPE = { Celular: 'phone', Accesorio: 'box', Dispositivo: 'band' };

export function getIllustrationKind({ categoria, tipo }) {
  return KIND_BY_CATEGORY[categoria] ?? KIND_BY_TYPE[tipo] ?? 'box';
}

const normalize = (text) =>
  text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

const COLOR_HEX = {
  negro: '#1e2421',
  blanco: '#ebe7dc',
  azul: '#2e5fa3',
  medianoche: '#1b2230',
  gris: '#7c8480',
  transparente: '#8fb3a5',
  rojo: '#c23b2e',
  verde: '#1f7a57',
  dorado: '#c9a24a',
  plateado: '#b8bebb',
  rosado: '#e59aa6',
  morado: '#6b4fa3',
};

const DEFAULT_COLOR = '#139069';

export function resolveColor(colorName) {
  return (colorName && COLOR_HEX[normalize(colorName)]) || DEFAULT_COLOR;
}

// Fondo suave de la tarjeta según el tipo de producto.
export const TONE_BY_TYPE = { Celular: 'green', Accesorio: 'sand', Dispositivo: 'amber' };
