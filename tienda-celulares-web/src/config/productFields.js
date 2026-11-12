// Campos propios de cada tipo de producto (coinciden con las tablas celular,
// accesorio y dispositivo_complementario). El formulario se arma a partir de aquí,
// así agregar un campo es agregar una línea.
// kind: text | number | bool | select
export const PRODUCT_TYPES = ['Celular', 'Accesorio', 'Dispositivo'];

export const TYPE_FIELDS = {
  Celular: [
    { name: 'modelo', label: 'Modelo', kind: 'text', required: true },
    { name: 'ram_gb', label: 'RAM (GB)', kind: 'number' },
    { name: 'almacenamiento_gb', label: 'Almacenamiento (GB)', kind: 'number' },
    { name: 'sistema_operativo', label: 'Sistema operativo', kind: 'text' },
    { name: 'version_so', label: 'Versión del sistema', kind: 'text' },
    { name: 'tamanio_pantalla', label: 'Pantalla (pulgadas)', kind: 'number', step: '0.1' },
    { name: 'resolucion', label: 'Resolución', kind: 'text' },
    { name: 'camara_principal_mp', label: 'Cámara principal (MP)', kind: 'number', step: '0.1' },
    { name: 'camara_frontal_mp', label: 'Cámara frontal (MP)', kind: 'number', step: '0.1' },
    { name: 'bateria_mah', label: 'Batería (mAh)', kind: 'number' },
    { name: 'procesador', label: 'Procesador', kind: 'text' },
    { name: 'color', label: 'Color', kind: 'text' },
    { name: 'red', label: 'Red', kind: 'select', options: ['2G', '3G', '4G', '5G'] },
    { name: 'dual_sim', label: 'Dual SIM', kind: 'bool' },
  ],
  Accesorio: [
    { name: 'tipo_accesorio', label: 'Tipo de accesorio', kind: 'text', required: true },
    { name: 'compatibilidad', label: 'Compatibilidad', kind: 'text' },
    { name: 'material', label: 'Material', kind: 'text' },
    { name: 'color', label: 'Color', kind: 'text' },
    { name: 'peso_gramos', label: 'Peso (g)', kind: 'number', step: '0.01' },
    { name: 'conectividad', label: 'Conectividad', kind: 'text' },
    { name: 'potencia_w', label: 'Potencia (W)', kind: 'number', step: '0.1' },
  ],
  Dispositivo: [
    { name: 'tipo_dispositivo', label: 'Tipo de dispositivo', kind: 'text', required: true },
    { name: 'modelo', label: 'Modelo', kind: 'text' },
    { name: 'conectividad', label: 'Conectividad', kind: 'text' },
    { name: 'autonomia_horas', label: 'Autonomía (horas)', kind: 'number', step: '0.1' },
    { name: 'resistencia_agua', label: 'Resistencia al agua', kind: 'text' },
    { name: 'color', label: 'Color', kind: 'text' },
    { name: 'peso_gramos', label: 'Peso (g)', kind: 'number', step: '0.01' },
  ],
};

export const PRODUCT_STATES = ['Activo', 'Inactivo', 'Descontinuado'];
