// Uso:  node scripts/restore-backup.mjs respaldo.json
// Restaura un respaldo descargado desde el panel (Respaldo) en la base indicada por DATABASE_URL.
// ¡REEMPLAZA todos los datos actuales de esa base!  Úsalo sobre una base nueva (p. ej. en Neon) o para volver atrás.
import fs from 'node:fs';
import { tx, pool } from '../src/db.js';
import { restaurarTodo } from '../src/backup.js';

const file = process.argv[2];
if (!file) { console.error('Indica el archivo: node scripts/restore-backup.mjs respaldo.json'); process.exit(1); }
const backup = JSON.parse(fs.readFileSync(file, 'utf8'));
console.log(`Respaldo del ${backup.fecha} (${Object.keys(backup.tablas).length} tablas). Restaurando...`);
try {
  const resumen = await tx((c) => restaurarTodo(c, backup));
  const total = Object.values(resumen).reduce((a, b) => a + b, 0);
  console.log(`Listo: ${total} registros restaurados.`);
} catch (e) {
  console.error('No se pudo restaurar (no se cambió nada):', e.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
