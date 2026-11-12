const numberFormat = new Intl.NumberFormat('es-BO', { maximumFractionDigits: 2 });

export function formatBs(amount) {
  return `Bs ${numberFormat.format(amount)}`;
}

// Recibe 'YYYY-MM-DD' (o un ISO completo) y evita desfases de zona horaria.
export function formatDate(isoDate) {
  const [year, month, day] = isoDate.slice(0, 10).split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString('es-BO', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}
