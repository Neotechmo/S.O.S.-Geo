# S.O.S. Geo — Plataforma Web Georreferenciada de Asistencia

Proyecto final de la materia **Aplicación de Sistemas Georreferenciados** — **Universidad La Salle Bajío**.

- **Aplicación en producción:** https://sosgeo.neotechmo.top
- **Health Check API:** https://sosgeo.neotechmo.top/api/health
- **Repositorio:** https://github.com/Neotechmo/S.O.S.-Geo

---

## Usuario de Prueba (Evaluación)

Para revisar todas las vistas y funcionalidades sin necesidad de registrarse:

- **Correo:** `demo@sosgeo.lasalle.mx`
- **Contraseña:** `Password123!`

*(Al iniciar sesión se precargan categorías, profesionales, zonas poligonales, ubicaciones en el mapa y solicitudes de servicio en León, Guanajuato).*

---

## Descripción

**S.O.S. Geo** es una plataforma web georreferenciada que permite localizar puntos físicos de atención y asistencia ciudadana (automotriz, servicios del hogar, soporte tecnológico y asistencia vial), consultar profesionales por categoría, gestionar solicitudes de servicio y delimitar zonas poligonales de cobertura sobre un mapa interactivo.

### Funcionalidades principales
- **Autenticación segura:** Registro e inicio de sesión con contraseñas cifradas con `bcrypt`, validación de correo único y protección de rutas y endpoints con `JWT` (`AuthGuard` + `requireAuth`).
- **Mapa interactivo y Ubicaciones (`GeoJSON Point`):** Registro de puntos exactos haciendo clic sobre el mapa (orden `[longitud, latitud]`), edición y eliminación directamente desde el popup del marcador, y tabla en tiempo real sincronizada sin recargar la página (mostrando el nombre de la categoría poblada y ocultando el ID).
- **Búsqueda y 3 Filtros en Backend:** Búsqueda parcial por nombre/descripción (`?search=`), filtro por categoría (`?category=`) y filtro por estado (`?status=`) resueltos en MongoDB y reflejados en el mapa y la tabla.
- **Zonas de cobertura (`GeoJSON Polygon`):** Trazo, guardado, recarga automática y eliminación de polígonos sobre el mapa con **Leaflet-Geoman**.
- **3 CRUDs internos con relaciones `ObjectId` + `.populate()`:** Categorías (`/api/categories`), Profesionales (`/api/professionals`) y Solicitudes de Servicio (`/api/service-requests`).

---

## Equipo de Desarrollo

- **`@Kuripipeer`** — Backend (Node.js, Express en capas, Servicios, Rutas, Validadores, Auth JWT y Despliegue AWS)
- **`@SergioErnestoRosasDucoing`** — Base de Datos (MongoDB Atlas, Mongoose, GeoJSON `Point`/`Polygon`, Índices `2dsphere` y Seeds)
- **`@angx7`** — Frontend (Angular CLI, TypeScript, Guards/Interceptors, Vistas CRUD, Leaflet y Leaflet-Geoman)

---

## Stack Tecnológico

- **Frontend:** Angular 21 (Angular CLI), TypeScript, Leaflet, Leaflet-Geoman (`@geoman-io/leaflet-geoman-free`).
- **Backend:** Node.js, Express 5 (JavaScript CommonJS), arquitectura por capas (`config`, `models`, `routes`, `services`, `middlewares`, `utils`, `data`), manejo centralizado de errores con `AppError`.
- **Base de Datos:** MongoDB Atlas + Mongoose, índices geoespaciales `2dsphere` en `Location.location` (`Point`) y `Zone.area` (`Polygon`).
- **Seguridad:** `bcryptjs`, `jsonwebtoken`, `dotenv`, CORS por variable de entorno.
- **Infraestructura:** AWS EC2 + Caddy (HTTPS automático con Let's Encrypt) + PM2 + Terraform (`infra/`).

---

## Estructura del Monorepositorio

```text
S.O.S.-Geo/
├── backend/          # API REST con Node.js, Express (CommonJS) y Mongoose
│   ├── .env.example  # Plantilla de variables de entorno sin credenciales reales
│   ├── request/      # Colección de pruebas .http para REST Client
│   └── src/
│       ├── config/       # Conexión a MongoDB Atlas (database.js)
│       ├── data/         # Seeds iniciales y usuario demo (seed.js)
│       ├── middlewares/  # Validadores, requireAuth y errorHandler
│       ├── models/       # Esquemas Mongoose + índices 2dsphere
│       ├── routes/       # Routers REST por entidad
│       ├── services/     # Lógica de negocio y consultas Mongoose
│       └── utils/        # AppError y utilidades JWT
├── frontend/         # Aplicación SPA con Angular CLI, Leaflet y Leaflet-Geoman
├── infra/            # Infraestructura como código en AWS con Terraform
└── docs/             # Documentación de arquitectura, base de datos, contratos y backlog
```

---

## Ejecución Local Paso a Paso

### Requisitos Previos
- **Node.js** `>= 20.x` y **npm** `>= 10.x`
- Cuenta y cluster en **MongoDB Atlas** (con acceso de red configurado)

### 1. Clonar el repositorio
```bash
git clone https://github.com/Neotechmo/S.O.S.-Geo.git
cd S.O.S.-Geo
```

### 2. Configurar e iniciar el Backend
```bash
cd backend
cp .env.example .env
```
Edita `backend/.env` con tus credenciales locales (nunca subas este archivo a Git):
```ini
PORT=3000
FRONTEND_ORIGINS=http://localhost:4200,http://127.0.0.1:4200
MONGODB_URI="mongodb+srv://<Usuario>:<Contraseña>@<Cluster>.mongodb.net/sos_geo_db"
JWT_SECRET="tu_secreto_jwt_local"
JWT_EXPIRES_IN="8h"
```
Instala dependencias, carga los datos iniciales (incluyendo el usuario de prueba) y levanta el servidor:
```bash
npm install
npm run seed
npm run dev
```
El backend quedará disponible en `http://localhost:3000` (health check en `http://localhost:3000/api/health`).

### 3. Configurar e iniciar el Frontend
En otra terminal, desde la raíz del proyecto:
```bash
cd frontend
npm install
npm start
```
Abre **`http://localhost:4200`** en tu navegador. *(En desarrollo local, Angular usa automáticamente `src/environments/environment.development.ts` apuntando a `http://localhost:3000/api`)*.

---

## Endpoints Principales de la API

| Recurso | Rutas | Descripción |
| :--- | :--- | :--- |
| Sistema | `GET /api/health` | Estado del servidor |
| Autenticación | `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me` | Registro, login con JWT y perfil |
| Categorías | `GET, POST /api/categories` \| `GET, PATCH, DELETE /api/categories/:id` | CRUD #1 protegido contra huérfanos |
| Profesionales | `GET, POST /api/professionals` \| `GET, PATCH, DELETE /api/professionals/:id` | CRUD #2 con `populate(category, zone)` |
| Solicitudes | `GET, POST /api/service-requests` \| `GET, PATCH, DELETE /api/service-requests/:id` | CRUD #3 con `populate` completo |
| Ubicaciones | `GET, POST /api/locations` \| `GET /api/locations/geojson` \| `GET, PATCH, DELETE /api/locations/:id` | Puntos `GeoJSON Point` + filtros `?search=&category=&status=` |
| Zonas | `GET, POST /api/zones` \| `GET /api/zones/geojson` \| `GET, PATCH, DELETE /api/zones/:id` | Polígonos `GeoJSON Polygon` |

---

## Documentación Técnica

- [Plan del Proyecto](docs/PROJECT_PLAN.md)
- [Arquitectura del Sistema](docs/ARCHITECTURE.md)
- [Diseño de Base de Datos y GeoJSON](docs/DATABASE.md)
- [Contratos de la API REST](docs/API_CONTRACTS.md)
- [Backlog de Issues](docs/BACKLOG.md)
- [Flujo de Trabajo por Sprints](docs/TEAM_WORKFLOW.md)
- [Checklist de Cumplimiento de Rúbrica](docs/RUBRIC_CHECKLIST.md)
- [Guía de Despliegue en AWS con Terraform](infra/README.md)
