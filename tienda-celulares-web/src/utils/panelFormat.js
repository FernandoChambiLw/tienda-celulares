// Formatos para tablas del panel (fechas con hora, etiquetas de estado).
export const formatDateTime = (iso) =>
  new Date(iso).toLocaleString('es-BO', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

// 'YYYY-MM-DD...' -> 'dd/mm' sin desfases de zona horaria
export const formatDayMonth = (iso) => {
  const [, month, day] = iso.slice(0, 10).split('-');
  return `${day}/${month}`;
};

const SALE_TONE = { Completada: 'ok', Anulada: 'danger' };
export const saleTone = (estado) => SALE_TONE[estado] ?? 'neutral';

const REPAIR_TONE = { Recibido: 'neutral', Diagnostico: 'warn', 'En reparacion': 'warn', Listo: 'ok', Entregado: 'ok', Cancelado: 'danger' };
export const repairTone = (estado) => REPAIR_TONE[estado] ?? 'neutral';
export const REPAIR_STATES = ['Recibido', 'Diagnostico', 'En reparacion', 'Listo', 'Entregado', 'Cancelado'];

// 'YYYY-MM' -> 'nov 2026'
const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
export const formatMonth = (ym) => {
  const [year, month] = ym.split('-');
  return `${MONTHS[Number(month) - 1]} ${year}`;
};
