// Datos de ejemplo basados en 03_datos_prueba.sql (stock_total ya descuenta las ventas de prueba).
// mockBackend.js los convierte a la misma forma que devuelve la API real.

export const productos = [
  {
    id_producto: 1, codigo: 'CEL-SAM-A15', nombre: 'Samsung Galaxy A15 128GB',
    descripcion: 'Pantalla AMOLED 6.5", 4GB RAM', tipo_producto: 'Celular',
    precio_venta: 1550, garantia_meses: 12, foto_url: null, estado: 'Activo',
    marca: 'Samsung', categoria: 'Celulares', stock_total: 4,
    detalle: {
      modelo: 'Galaxy A15', ram_gb: 4, almacenamiento_gb: 128, sistema_operativo: 'Android',
      version_so: '14', tamanio_pantalla: '6.5', resolucion: '2340x1080',
      camara_principal_mp: '50.0', camara_frontal_mp: '13.0', bateria_mah: 5000,
      procesador: 'Helio G99', color: 'Negro', red: '4G', dual_sim: true,
    },
  },
  {
    id_producto: 2, codigo: 'CEL-XIA-RN13', nombre: 'Xiaomi Redmi Note 13 256GB',
    descripcion: 'AMOLED 120Hz, cámara 108MP', tipo_producto: 'Celular',
    precio_venta: 1900, garantia_meses: 12, foto_url: null, estado: 'Activo',
    marca: 'Xiaomi', categoria: 'Celulares', stock_total: 2,
    detalle: {
      modelo: 'Redmi Note 13', ram_gb: 8, almacenamiento_gb: 256, sistema_operativo: 'Android',
      version_so: '13', tamanio_pantalla: '6.6', resolucion: '2400x1080',
      camara_principal_mp: '108.0', camara_frontal_mp: '16.0', bateria_mah: 5000,
      procesador: 'Snapdragon 685', color: 'Azul', red: '4G', dual_sim: true,
    },
  },
  {
    id_producto: 3, codigo: 'CEL-MOT-G54', nombre: 'Motorola Moto G54 5G 128GB',
    descripcion: '5G, batería 6000 mAh', tipo_producto: 'Celular',
    precio_venta: 1650, garantia_meses: 12, foto_url: null, estado: 'Activo',
    marca: 'Motorola', categoria: 'Celulares', stock_total: 2,
    detalle: {
      modelo: 'Moto G54', ram_gb: 8, almacenamiento_gb: 128, sistema_operativo: 'Android',
      version_so: '13', tamanio_pantalla: '6.5', resolucion: '2400x1080',
      camara_principal_mp: '50.0', camara_frontal_mp: '16.0', bateria_mah: 6000,
      procesador: 'Dimensity 7020', color: 'Azul', red: '5G', dual_sim: true,
    },
  },
  {
    id_producto: 4, codigo: 'CEL-APP-I13', nombre: 'iPhone 13 128GB',
    descripcion: 'Chip A15 Bionic', tipo_producto: 'Celular',
    precio_venta: 5100, garantia_meses: 12, foto_url: null, estado: 'Activo',
    marca: 'Apple', categoria: 'Celulares', stock_total: 2,
    detalle: {
      modelo: 'iPhone 13', ram_gb: 4, almacenamiento_gb: 128, sistema_operativo: 'iOS',
      version_so: '17', tamanio_pantalla: '6.1', resolucion: '2532x1170',
      camara_principal_mp: '12.0', camara_frontal_mp: '12.0', bateria_mah: 3240,
      procesador: 'A15 Bionic', color: 'Medianoche', red: '5G', dual_sim: false,
    },
  },
  {
    id_producto: 5, codigo: 'ACC-FUN-A15', nombre: 'Funda silicona Galaxy A15',
    descripcion: 'Funda de silicona flexible', tipo_producto: 'Accesorio',
    precio_venta: 45, garantia_meses: 1, foto_url: null, estado: 'Activo',
    marca: 'Genérica', categoria: 'Fundas y protectores', stock_total: 19,
    detalle: {
      tipo_accesorio: 'Funda', compatibilidad: 'Samsung Galaxy A15', material: 'Silicona',
      color: 'Negro', conectividad: null, potencia_w: null, peso_gramos: null,
    },
  },
  {
    id_producto: 6, codigo: 'ACC-CAR-ANK', nombre: 'Cargador Anker 20W USB-C',
    descripcion: 'Carga rápida PD 20W', tipo_producto: 'Accesorio',
    precio_venta: 110, garantia_meses: 6, foto_url: null, estado: 'Activo',
    marca: 'Anker', categoria: 'Cargadores y cables', stock_total: 14,
    detalle: {
      tipo_accesorio: 'Cargador', compatibilidad: 'USB-C universal', material: 'Plástico',
      color: 'Blanco', conectividad: 'USB-C', potencia_w: '20.0', peso_gramos: null,
    },
  },
  {
    id_producto: 7, codigo: 'ACC-AUD-JBL', nombre: 'Audífonos JBL Tune 510BT',
    descripcion: 'Bluetooth, 40h de batería', tipo_producto: 'Accesorio',
    precio_venta: 290, garantia_meses: 12, foto_url: null, estado: 'Activo',
    marca: 'JBL', categoria: 'Audífonos', stock_total: 10,
    detalle: {
      tipo_accesorio: 'Audífonos', compatibilidad: 'Universal', material: 'Plástico',
      color: 'Negro', conectividad: 'Bluetooth', potencia_w: null, peso_gramos: null,
    },
  },
  {
    id_producto: 8, codigo: 'ACC-VID-UNI', nombre: 'Vidrio templado 9H universal',
    descripcion: 'Protector de pantalla', tipo_producto: 'Accesorio',
    precio_venta: 20, garantia_meses: 0, foto_url: null, estado: 'Activo',
    marca: 'Genérica', categoria: 'Protectores de pantalla', stock_total: 40,
    detalle: {
      tipo_accesorio: 'Protector pantalla', compatibilidad: 'Universal 6.5"', material: 'Vidrio',
      color: 'Transparente', conectividad: null, potencia_w: null, peso_gramos: null,
    },
  },
  {
    id_producto: 9, codigo: 'DIS-BAN-XIA', nombre: 'Xiaomi Smart Band 8',
    descripcion: 'Pulsera de actividad AMOLED', tipo_producto: 'Dispositivo',
    precio_venta: 260, garantia_meses: 12, foto_url: null, estado: 'Activo',
    marca: 'Xiaomi', categoria: 'Smartwatch y pulseras', stock_total: 8,
    detalle: {
      tipo_dispositivo: 'Pulsera inteligente', modelo: 'Smart Band 8', conectividad: 'Bluetooth 5.1',
      autonomia_horas: '336.0', resistencia_agua: '5 ATM', color: 'Negro', peso_gramos: null,
    },
  },
  {
    id_producto: 10, codigo: 'DIS-FIT-SAM', nombre: 'Samsung Galaxy Fit3',
    descripcion: 'Pulsera de actividad', tipo_producto: 'Dispositivo',
    precio_venta: 340, garantia_meses: 12, foto_url: null, estado: 'Activo',
    marca: 'Samsung', categoria: 'Smartwatch y pulseras', stock_total: 6,
    detalle: {
      tipo_dispositivo: 'Pulsera inteligente', modelo: 'Galaxy Fit3', conectividad: 'Bluetooth 5.3',
      autonomia_horas: '312.0', resistencia_agua: '5 ATM', color: 'Gris', peso_gramos: null,
    },
  },
];

const daysFromToday = (days) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toLocaleDateString('en-CA');
};

// La primera es la del script de datos (aún no empieza). La segunda es solo de demostración
// y siempre está vigente, para ver una oferta en pantalla.
export const promociones = [
  {
    id_promocion: 1, nombre: 'Black Friday audífonos', porcentaje_descuento: 10,
    fecha_inicio: '2026-11-20', fecha_fin: '2026-11-30', estado: 'Vigente', id_producto: 7,
  },
  {
    id_promocion: 2, nombre: 'Semana del cargador (demo)', porcentaje_descuento: 15,
    fecha_inicio: daysFromToday(-3), fecha_fin: daysFromToday(10), estado: 'Vigente', id_producto: 6,
  },
];
