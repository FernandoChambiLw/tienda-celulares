import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import cors from 'cors';
import { UPLOADS_DIR } from './config.js';
import { errorHandler, notFoundHandler } from './errors.js';
import { auth } from './auth.js';

import authRoutes from './routes/auth.js';
import usuariosRoutes from './routes/usuarios.js';
import catalogosRoutes from './routes/catalogos.js';
import clientesRoutes from './routes/clientes.js';
import productosRoutes from './routes/productos.js';
import proveedoresRoutes from './routes/proveedores.js';
import inventarioRoutes from './routes/inventario.js';
import comprasRoutes from './routes/compras.js';
import ventasRoutes from './routes/ventas.js';
import reparacionesRoutes from './routes/reparaciones.js';
import reportesRoutes from './routes/reportes.js';
import publicoRoutes from './routes/publico.js';

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 24) {
  throw new Error('Define JWT_SECRET (mínimo 24 caracteres) en el archivo .env');
}
if (!process.env.DATABASE_URL) throw new Error('Define DATABASE_URL en el archivo .env');

const app = express();
// Detrás del proxy de Render (HTTPS): necesario para que el límite de intentos de login use la IP real.
app.set('trust proxy', 1);
const origins = (process.env.CORS_ORIGINS || '').split(',').map((s) => s.trim()).filter(Boolean);
app.use(cors(origins.length ? { origin: origins } : {}));
app.use(express.json({ limit: '1mb' }));
app.use('/uploads', express.static(UPLOADS_DIR));

app.get('/api/salud', (_req, res) => res.json({ ok: true }));

// Públicas
app.use('/api/auth', authRoutes);
app.use('/api/publico', publicoRoutes);

// Protegidas
app.use('/api', auth);
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/catalogos', catalogosRoutes);
app.use('/api/clientes', clientesRoutes);
app.use('/api/productos', productosRoutes);
app.use('/api/proveedores', proveedoresRoutes);
app.use('/api/inventario', inventarioRoutes);
app.use('/api/compras', comprasRoutes);
app.use('/api/ventas', ventasRoutes);
app.use('/api/reparaciones', reparacionesRoutes);
app.use('/api/reportes', reportesRoutes);

// Sitio web: si existe la carpeta public/ (build de la web), la API la sirve también.
// Así toda la aplicación vive en una sola URL y no hace falta configurar CORS.
const WEB_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'public');
if (fs.existsSync(path.join(WEB_DIR, 'index.html'))) {
  app.use(express.static(WEB_DIR));
  // Rutas de la web (/catalogo, /panel/...): devuelven index.html para que React Router las resuelva.
  app.get(/^\/(?!api(\/|$)|uploads(\/|$)).*/, (_req, res) => res.sendFile(path.join(WEB_DIR, 'index.html')));
}

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
