# Pasar la base de datos a Neon (gratis, sin vencimiento) y no perder nada

**Por qué:** la base PostgreSQL gratis de Render se **borra a los 30 días** de creada (para este proyecto, alrededor del **12 de diciembre de 2026**) y no hace copias de seguridad. Neon tiene un plan gratis sin fecha de vencimiento.
Hazlo con calma, **antes** de esa fecha. Mientras no cambies el paso 5, el sitio sigue funcionando como siempre.

> **¿Vas a abrir el negocio real?** Lee antes `PRODUCCION.md`. En ese caso **omite los pasos 1 y 3** (no restaures los datos de la demo): la base nueva arranca limpia con `render.neon.yaml`.

## 1. Descargar un respaldo
Entra al panel como administrador → **Respaldo** → **Descargar respaldo**. Guarda el archivo `respaldo-fx-AAAA-MM-DD.json` (si no puedes entrar, sáltate este paso: la base nueva arrancará con los datos de prueba).

## 2. Crear la base en Neon
1. Entra a <https://neon.tech> (puedes usar tu cuenta de GitHub) → **Create project**. Nombre: `fx-technology`. Región: la más cercana (AWS São Paulo).
2. En el panel del proyecto → **Connect** → desactiva la opción **Connection pooling** (importante: el sistema necesita la conexión *directa*) y copia la cadena que empieza con `postgresql://...`.

## 3. Cargar tus datos en Neon (desde tu computadora, una sola vez)
Necesitas Node.js instalado. En PowerShell, dentro de la carpeta `celulares_api`:

```
npm install
$env:DATABASE_URL = "PEGA_AQUI_LA_CADENA_DE_NEON"
$env:JWT_SECRET = "cualquier-texto-largo-para-pruebas-123456"
node scripts/init-db.mjs
node scripts/restore-backup.mjs C:\ruta\al\respaldo-fx-2026-11-18.json
```
`init-db` crea las 41 tablas y `restore-backup` las llena con **tus** datos (reemplaza lo que haya). Debe terminar con `Listo: NNN registros restaurados.`

## 4. Apuntar Render a Neon
1. En tu carpeta `D:\deploy_celulares`: borra `render.yaml` y renombra `render.neon.yaml` como `render.yaml`.
2. `git add .`, `git commit -m "Base en Neon"`, `git push`.
3. En Render → tu servicio `tienda-celulares` → **Environment** → agrega `DATABASE_URL` con la cadena de Neon → **Save**. Render vuelve a desplegar solo.
   (Si Render te pide sincronizar el Blueprint, acepta: quitará la base vieja `celulares-db`; ya tienes tu respaldo.)

## 5. Comprobar
- `TU_URL/api/salud` debe mostrar `{"ok":true}`.
- Entra al panel y revisa que tus ventas y productos estén.
- Cuando todo esté bien, puedes borrar la base vieja en Render.

## Después
- Descarga un respaldo **cada semana** (el resumen te avisa a los 7 días) y guárdalo fuera del sistema.
- Para volver atrás o recuperar datos: `node scripts/restore-backup.mjs respaldo.json` con `DATABASE_URL` apuntando a la base que quieras (**reemplaza** todos sus datos).
- Neon también guarda un historial de cambios de unas horas y permite crear ramas para probar; no reemplaza tus respaldos propios.
