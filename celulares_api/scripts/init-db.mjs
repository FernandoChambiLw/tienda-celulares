// Inicializa la base de datos la primera vez: si el esquema "celulares" no existe,
// ejecuta db/01_esquema.sql, db/02_vistas_triggers.sql y db/03_datos_prueba.sql.
// Si ya existe, no toca nada (es seguro ejecutarlo en cada arranque).
import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const here = path.dirname(fileURLToPath(import.meta.url));
const dbDir = path.join(here, '..', 'db');

if (!process.env.DATABASE_URL) {
  console.error('Define DATABASE_URL (variable de entorno o archivo .env).');
  process.exit(1);
}

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
try {
  await client.connect();
  const { rows } = await client.query("SELECT to_regclass('celulares.usuario') AS t");
  if (rows[0].t) {
    console.log('[init-db] La base ya está inicializada: no se cambia nada.');
  } else {
    for (const file of ['01_esquema.sql', '02_vistas_triggers.sql', '03_datos_prueba.sql']) {
      console.log(`[init-db] Ejecutando ${file} ...`);
      await client.query(fs.readFileSync(path.join(dbDir, file), 'utf8'));
    }
    console.log('[init-db] Base inicializada (33 tablas + datos de prueba).');
  }
} catch (e) {
  console.error('[init-db] ERROR:', e.message);
  process.exitCode = 1;
} finally {
  await client.end().catch(() => {});
}
