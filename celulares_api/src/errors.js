/** Traduce errores de PostgreSQL a respuestas HTTP comprensibles. */
export function notFoundHandler(_req, res) {
  res.status(404).json({ error: 'Ruta no encontrada' });
}

export function errorHandler(err, _req, res, _next) {
  if (err.status) return res.status(err.status).json({ error: err.message });

  if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'JSON inválido' });
  if (err.code === 'LIMIT_FILE_SIZE') return res.status(400).json({ error: 'La imagen supera 3 MB' });

  switch (err.code) {
    case '23505':
      return res.status(409).json({ error: 'Registro duplicado', detalle: err.detail });
    case '23503':
      return res.status(409).json({ error: 'Referencia inexistente o registro en uso', detalle: err.detail });
    case '23514':
      if (err.constraint === 'inventario_stock_actual_check')
        return res.status(409).json({ error: 'Stock insuficiente' });
      return res.status(400).json({ error: 'Dato fuera de lo permitido', restriccion: err.constraint });
    case '23502':
      return res.status(400).json({ error: `Falta el campo ${err.column}` });
    case '22P02':
    case '22007':
    case '22008':
      return res.status(400).json({ error: 'Formato de dato inválido' });
    case 'P0001': // RAISE EXCEPTION de los triggers
      return res.status(409).json({ error: err.message });
  }
  console.error(err);
  res.status(500).json({ error: 'Error interno del servidor' });
}
