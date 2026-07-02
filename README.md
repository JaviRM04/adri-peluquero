# Adrián Peluquero — Sistema de Reservas

Aplicación web de reserva de citas para peluquería, con protección contra reservas duplicadas, panel de administración y gestión de citas por token.

## Stack

- **Next.js 14** (App Router) + TypeScript
- **Prisma ORM** + SQLite (desarrollo) / PostgreSQL (producción)
- **Tailwind CSS** — diseño mobile-first
- **NextAuth.js** — autenticación del panel admin

## Instalación y puesta en marcha

### 1. Instalar dependencias

```bash
npm install
```

### 2. Configurar variables de entorno

Copia el archivo de ejemplo:

```bash
cp .env.example .env.local
```

Edita `.env.local`:

```env
DATABASE_URL="file:./dev.db"
ADMIN_PASSWORD="tu_contrasena_segura"
NEXTAUTH_SECRET="genera-uno-con-openssl-rand-base64-32"
NEXTAUTH_URL="http://localhost:3000"
```

### 3. Inicializar la base de datos

```bash
npm run db:push
```

### 4. Ejecutar en desarrollo

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000)

## Páginas

| Ruta | Descripción |
|------|-------------|
| `/` | Landing con info de la peluquería |
| `/reservar` | Formulario de reserva (calendario + datos) |
| `/cita/[token]` | Detalle de cita del cliente (ver y cancelar) |
| `/admin` | Panel de administración (requiere contraseña) |
| `/admin/login` | Login del admin |

## Configuración del negocio

Edita `lib/config.ts` para cambiar:
- Días laborables y horario de apertura/cierre
- Duración de cada cita
- Pausas (comida, descansos)
- Festivos
- Máximo de días de anticipación

## Despliegue en Vercel + Neon (PostgreSQL)

### 1. Crear cuenta en [Neon](https://neon.tech) y copiar la connection string

### 2. Cambiar el provider en `prisma/schema.prisma`

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

### 3. Añadir variables en Vercel

```
DATABASE_URL=postgresql://...
ADMIN_PASSWORD=...
NEXTAUTH_SECRET=...
NEXTAUTH_URL=https://tu-dominio.vercel.app
```

### 4. En el build command de Vercel, asegúrate de ejecutar migraciones

En `package.json` puedes añadir:
```json
"build": "prisma generate && prisma migrate deploy && next build"
```

## Seguridad

- Las citas solo se pueden ver/cancelar con el `cancellationToken` único.
- No existe ningún endpoint que permita cancelar por ID sin token.
- La restricción UNIQUE en `(date, startTime)` evita dobles reservas incluso con peticiones simultáneas.
- Las transacciones de Prisma protegen contra race conditions.
- El panel de admin requiere autenticación con NextAuth.

## Estructura del proyecto

```
├── app/
│   ├── api/
│   │   ├── appointments/
│   │   │   ├── route.ts          # GET (slots) + POST (crear cita)
│   │   │   └── [token]/route.ts  # GET + DELETE por token
│   │   ├── admin/
│   │   │   ├── appointments/     # GET + DELETE (admin)
│   │   │   └── blocked-slots/    # GET + POST + DELETE
│   │   └── auth/[...nextauth]/
│   ├── admin/
│   │   ├── page.tsx             # Dashboard admin
│   │   └── login/page.tsx
│   ├── cita/[token]/
│   │   ├── page.tsx             # Detalle de cita
│   │   └── cancelar/page.tsx
│   ├── reservar/page.tsx
│   └── page.tsx                 # Landing
├── components/
│   ├── AdminDashboard.tsx
│   ├── BookingCalendar.tsx
│   └── Providers.tsx
├── lib/
│   ├── auth.ts
│   ├── config.ts                # Configuración del negocio
│   ├── prisma.ts
│   ├── schemas.ts               # Validaciones Zod
│   └── utils.ts
└── prisma/
    └── schema.prisma
```
