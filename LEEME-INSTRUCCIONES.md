# ⚡ EPSILIUS — Guía de instalación y publicación
## Hecho para que vos hagas el resto (paso a paso, muy fácil)

---

## ¿Qué incluye esto?
- Sitio web completo (frontend + backend)
- Registro e inicio de sesión de usuarios
- Panel de admin (solo para epsiliusoficial@gmail.com)
- Subida de archivos y herramientas
- Sistema de compras con Mercado Pago
- Chat en tiempo real con Socket.io
- Comentarios y reseñas
- Formulario de contacto que llega a tu email
- Base de datos MongoDB

---

## PASO 1 — Instalá Node.js

1. Entrá a: https://nodejs.org
2. Descargá la versión **LTS** (la recomendada)
3. Instalala con todas las opciones por defecto
4. Para verificar, abrí CMD y escribí: `node -v`

---

## PASO 2 — Instalá las dependencias del proyecto

1. Abrí esta carpeta: `backend`
2. Hacé clic en la barra de direcciones de Windows Explorer
3. Escribí `cmd` y presioná Enter (abre el CMD en esa carpeta)
4. Escribí este comando y presioná Enter:

```
npm install
```

Esperá a que termine (puede tardar 1-2 minutos).

---

## PASO 3 — Creá tu base de datos GRATIS en MongoDB Atlas

1. Entrá a: https://cloud.mongodb.com
2. Creá una cuenta gratis
3. Creá un **Cluster gratuito** (M0 Free Tier)
4. En "Database Access" → Add New Database User → poné usuario y contraseña
5. En "Network Access" → Add IP Address → Allow Access from Anywhere (0.0.0.0/0)
6. En tu cluster, hacé clic en "Connect" → "Connect your application"
7. Copiá el string de conexión que se ve así:
   `mongodb+srv://usuario:password@cluster0.xxxxx.mongodb.net/`

---

## PASO 4 — Configurá las variables de entorno

1. En la carpeta `backend`, copiá el archivo `.env.example` y renombralo a `.env`
2. Abrilo con el Bloc de notas
3. Completá los valores:

```
MONGODB_URI=mongodb+srv://TU_USUARIO:TU_PASSWORD@cluster0.xxxxx.mongodb.net/epsilius
JWT_SECRET=cualquier_frase_larga_secreta_que_inventes
ADMIN_EMAIL=epsiliusoficial@gmail.com
EMAIL_USER=epsiliusoficial@gmail.com
EMAIL_PASS=TU_CONTRASEÑA_DE_APLICACION_GOOGLE
```

### Para EMAIL_PASS (Contraseña de aplicación de Google):
1. Entrá a: https://myaccount.google.com/security
2. Activá la "Verificación en 2 pasos" si no la tenés
3. Buscá "Contraseñas de aplicaciones"
4. Seleccioná "Correo" y "Windows" → Generá → Copiá esa contraseña de 16 dígitos

---

## PASO 5 — Probá en tu computadora

En el CMD dentro de la carpeta `backend`, escribí:

```
npm start
```

Deberías ver:
```
✅ MongoDB conectado
🚀 EPSILIUS corriendo en http://localhost:3000
```

Abrí tu navegador y entrá a: **http://localhost:3000**

¡Ya funciona en tu compu!

---

## PASO 6 — Publicar en internet GRATIS (para que todo el mundo lo vea)

### Opción A — Railway (recomendado, muy fácil)

1. Entrá a: https://railway.app
2. Registrate con tu cuenta de GitHub
3. Hacé clic en "New Project" → "Deploy from GitHub repo"
4. Subí tu carpeta de proyecto a GitHub primero:
   - Creá cuenta en https://github.com
   - Creá repositorio nuevo
   - Subí todos los archivos
5. En Railway, seleccioná ese repositorio
6. Railway detecta Node.js automáticamente
7. En "Variables", agregá todas las variables de tu `.env`
8. En "Settings" → "Root Directory" → escribí `backend`
9. Railway te da un link tipo: `https://epsilius-production.up.railway.app`

### Opción B — Render (también gratis)

1. Entrá a: https://render.com
2. Registrate
3. New → Web Service → conectá tu repo de GitHub
4. Root Directory: `backend`
5. Build Command: `npm install`
6. Start Command: `npm start`
7. Agregá las variables de entorno
8. Te da un link público automáticamente

---

## PASO 7 — Primer registro como ADMIN

1. Entrá a tu web ya publicada
2. Hacé clic en "Registrarse"
3. Usá exactamente: **epsiliusoficial@gmail.com**
4. Creá tu contraseña
5. ¡Automáticamente tendrás rol de ADMIN!
6. Aparecerá el menú "Admin" en la barra de navegación
7. Desde ahí podés subir herramientas, ver órdenes y gestionar todo

---

## Tu información ya está configurada en el código:
- 📧 Email: epsiliusoficial@gmail.com
- 💳 Mercado Pago: mateo.romero915

---

## Funcionalidades incluidas:

| Función | Estado |
|---------|--------|
| Registro / Login de usuarios | ✅ |
| Panel de admin completo | ✅ |
| Subir archivos/programas | ✅ |
| Imágenes de productos | ✅ |
| Tienda con filtros y búsqueda | ✅ |
| Página de detalle de producto | ✅ |
| Sistema de compras + Mercado Pago | ✅ |
| Gestión de órdenes desde admin | ✅ |
| Comentarios y reseñas con estrellas | ✅ |
| Likes en comentarios | ✅ |
| Chat en tiempo real | ✅ |
| Formulario de contacto al email | ✅ |
| Diseño responsive (móvil/PC) | ✅ |
| Productos destacados en inicio | ✅ |

---

## ¿Problemas? Escribime a epsiliusoficial@gmail.com
