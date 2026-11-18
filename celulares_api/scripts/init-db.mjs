// Inicializa la base de datos la primera vez: si el esquema "celulares" no existe,
// ejecuta db/01_esquema.sql, db/02_vistas_triggers.sql y db/03_datos_prueba.sql.
// Si ya existe, no toca nada (es seguro ejecutarlo en cada arranque).
import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';
import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';

const here = path.dirname(fileURLToPath(import.meta.url));
const dbDir = path.join(here, '..', 'db');

if (!process.env.DATABASE_URL) {
  console.error('Define DATABASE_URL (variable de entorno o archivo .env).');
  process.exit(1);
}

const produccion = String(process.env.DATOS_DEMO ?? '').toLowerCase() === 'no';
let primeraVez = false;
const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
try {
  await client.connect();
  const { rows } = await client.query("SELECT to_regclass('celulares.usuario') AS t");
  if (rows[0].t) {
    console.log('[init-db] La base ya está inicializada: no se cambia nada.');
  } else {
    primeraVez = true;
    for (const file of ['01_esquema.sql', '02_vistas_triggers.sql', '03_datos_prueba.sql']) {
      console.log(`[init-db] Ejecutando ${file} ...`);
      await client.query(fs.readFileSync(path.join(dbDir, file), 'utf8'));
    }
    console.log('[init-db] Base inicializada (41 tablas + datos de prueba).');
  }
  // Extensiones posteriores (pedidos, fotos): idempotentes, se aplican siempre.
  for (const file of ['04_pedidos_fotos.sql', '05_caja_cobros_bitacora.sql', '06_produccion.sql']) {
    console.log(`[init-db] Aplicando ${file} ...`);
    await client.query(fs.readFileSync(path.join(dbDir, file), 'utf8'));
  }
  if (primeraVez && produccion) {
    console.log('[init-db] DATOS_DEMO=no: limpiando los datos de ejemplo ...');
    await client.query(fs.readFileSync(path.join(dbDir, '07_limpiar_demo.sql'), 'utf8'));
    let clave = process.env.ADMIN_PASSWORD;
    const generada = !clave || clave.length < 8;
    if (generada) clave = crypto.randomBytes(9).toString('base64url');
    await client.query("UPDATE celulares.usuario SET password_hash = $1, debe_cambiar_clave = TRUE WHERE username = 'admin'", [await bcrypt.hash(clave, 10)]);
    console.log('[init-db] Base de producción lista. Usuario: admin');
    console.log(generada ? `[init-db] Clave inicial (cámbiala al entrar): ${clave}` : '[init-db] Clave inicial = la variable ADMIN_PASSWORD (te pedirá cambiarla al entrar).');
  }
} catch (e) {
  console.error('[init-db] ERROR:', e.message);
  process.exitCode = 1;
} finally {
  await client.end().catch(() => {});
}
