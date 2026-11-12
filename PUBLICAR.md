# Publicar la tienda en internet (una sola URL para tu docente)

Todo el proyecto (web + API) se publica como **un solo servicio** y la base de datos como PostgreSQL gratis,
ambos en **Render**. La primera vez que arranca, la API crea sola las 33 tablas y carga los datos de prueba.

Necesitas: una cuenta de **GitHub** y una de **Render** (gratis; en Render puedes entrar con tu cuenta de GitHub) y **git** instalado.

## 1. Subir el proyecto a GitHub
1. En GitHub: **New repository** → nombre `tienda-celulares` → Create (público es lo más simple).
2. En una terminal, dentro de esta carpeta (la que tiene `render.yaml`):

```
git init
git add .
git commit -m "Tienda de celulares"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/tienda-celulares.git
git push -u origin main
```

## 2. Publicar en Render (automático con `render.yaml`)
1. En Render: **New +** → **Blueprint**.
2. Conecta tu GitHub y elige el repositorio `tienda-celulares`.
3. Render muestra lo que va a crear (un servicio web `tienda-celulares` y una base `celulares-db`, los dos *Free*) → **Apply**.
4. Espera 5 a 10 minutos hasta que el servicio diga **Live**. Arriba del servicio aparece tu URL:
   `https://tienda-celulares-xxxx.onrender.com`

## 3. Comprobar (antes de enviarla)
- `TU_URL/api/salud` → debe mostrar `{"ok":true}`
- `TU_URL` → la vitrina con los productos
- `TU_URL/panel/login` → entra con `admin` / `Admin123!`

Si todo eso funciona, **esa URL es la que le envías a tu docente**. Puedes agregar los usuarios de prueba:

| Usuario | Clave | Rol |
|---|---|---|
| admin | Admin123! | Administrador |
| lucia | Clave123! | Vendedor |
| marco | Clave123! | Técnico |
| rosa | Clave123! | Almacenero |

## Cosas que debes saber (plan gratis de Render)
- **Se duerme tras 15 minutos sin visitas.** La primera visita después tarda cerca de **1 minuto** en cargar.
  Abre la URL 5 minutos antes de que tu docente la revise, y avísale que la primera carga puede demorar.
- **La base gratis dura 30 días** desde que se crea (suficiente para la evaluación). Guarda el respaldo `.sql`.
- **Las fotos subidas desde el panel se pierden al reiniciar** (el disco es temporal). Los productos de prueba no usan fotos.

## Si Render te pide tarjeta para el Blueprint (alternativa manual)
1. **New + → PostgreSQL** → nombre `celulares-db`, plan **Free** → Create. Copia el *Internal Database URL*.
2. **New + → Web Service** → tu repositorio → *Runtime*: Node, plan **Free**.
   - **Build Command:**
     `npm --prefix tienda-celulares-web install --include=dev && npm --prefix tienda-celulares-web run build && npm --prefix celulares_api install && rm -rf celulares_api/public && cp -r tienda-celulares-web/dist celulares_api/public`
   - **Start Command:** `npm --prefix celulares_api start`
   - **Environment:** `DATABASE_URL` = el Internal Database URL · `JWT_SECRET` = una cadena larga cualquiera (24+ caracteres) · `VITE_USE_MOCK` = `false` · `VITE_API_URL` = `/api` · `NODE_VERSION` = `22`

## Si algo falla
Abre el servicio en Render → pestaña **Logs**.
- `[init-db] ERROR` → problema al crear las tablas; copia el mensaje completo.
- `Define JWT_SECRET` → falta la variable `JWT_SECRET`.
- La web carga pero sin productos ni login → `VITE_USE_MOCK` no está en `false` (hay que volver a desplegar, porque se aplica al compilar).
