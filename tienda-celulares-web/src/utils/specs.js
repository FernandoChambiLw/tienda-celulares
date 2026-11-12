// Convierte las columnas de celular / accesorio / dispositivo_complementario
// en una lista legible: [{ label, value }].
const yesNo = (value) => (value ? 'Sí' : 'No');

const SPEC_DEFINITIONS = {
  Celular: [
    ['modelo', 'Modelo'],
    ['procesador', 'Procesador'],
    ['ram_gb', 'Memoria RAM', (v) => `${v} GB`],
    ['almacenamiento_gb', 'Almacenamiento', (v) => `${v} GB`],
    ['tamanio_pantalla', 'Pantalla', (v) => `${v}"`],
    ['resolucion', 'Resolución'],
    ['camara_principal_mp', 'Cámara principal', (v) => `${v} MP`],
    ['camara_frontal_mp', 'Cámara frontal', (v) => `${v} MP`],
    ['bateria_mah', 'Batería', (v) => `${v} mAh`],
    ['sistema_operativo', 'Sistema operativo'],
    ['version_so', 'Versión del sistema'],
    ['red', 'Red'],
    ['dual_sim', 'Dual SIM', yesNo],
    ['color', 'Color'],
  ],
  Accesorio: [
    ['tipo_accesorio', 'Tipo'],
    ['compatibilidad', 'Compatibilidad'],
    ['material', 'Material'],
    ['color', 'Color'],
    ['conectividad', 'Conectividad'],
    ['potencia_w', 'Potencia', (v) => `${v} W`],
    ['peso_gramos', 'Peso', (v) => `${v} g`],
  ],
  Dispositivo: [
    ['tipo_dispositivo', 'Tipo'],
    ['modelo', 'Modelo'],
    ['conectividad', 'Conectividad'],
    ['autonomia_horas', 'Autonomía', (v) => `${v} h`],
    ['resistencia_agua', 'Resistencia al agua'],
    ['color', 'Color'],
    ['peso_gramos', 'Peso', (v) => `${v} g`],
  ],
};

const isPresent = (value) => value !== null && value !== undefined && value !== '';

export function buildSpecList(tipo, detalle) {
  if (!detalle) return [];
  return (SPEC_DEFINITIONS[tipo] ?? [])
    .filter(([key]) => isPresent(detalle[key]))
    .map(([key, label, format = String]) => ({ label, value: format(detalle[key]) }));
}
