# S.O.S. Geo — Plataforma Web Georreferenciada de Asistencia

Proyecto final de la materia **Aplicación de Sistemas Georreferenciados** — **Universidad La Salle Bajío**.

## Descripción

**S.O.S. Geo** es una aplicación web georreferenciada que permite localizar puntos físicos de atención y asistencia ciudadana (automotriz, hogar, soporte tecnológico y asistencia vial), consultar profesionales por categoría, gestionar solicitudes de servicio y delimitar zonas poligonales de cobertura sobre un mapa interactivo.

## Equipo de Desarrollo

- **`@Kuripipeer`** — Backend (Node.js, Express en capas, Servicios, Rutas, Validadores y Auth JWT)
- **`@SergioErnestoRosasDucoing`** — Base de Datos (MongoDB Atlas, Mongoose, GeoJSON `Point`/`Polygon`, Índices `2dsphere` y Seeds)
- **`@angx7`** — Frontend (Angular CLI, TypeScript, Leaflet y Leaflet-Geoman)

## Estructura del Monorepositorio

```text
S.O.S.-Geo/
├── backend/          # API REST con Node.js, Express (CommonJS) y Mongoose
│   ├── .env.example  # Plantilla de variables de entorno sin credenciales reales
│   ├── request/      # Archivos .http para pruebas de endpoints
│   └── src/
│       ├── config/
│       ├── data/
│       ├── middlewares/
│       ├── models/
│       ├── routes/
│       ├── services/
│       └── utils/
├── frontend/         # Aplicación SPA con Angular CLI, Leaflet y Leaflet-Geoman
└── docs/             # Documentación de arquitectura, base de datos, contratos y backlog
```

## Requisitos Previos

- **Node.js** >= 20.x y **npm** >= 10.x
- **Angular CLI** (`npm install -g @angular/cli`)
- Cluster en **MongoDB Atlas**

## Configuración Local Rápida

### 1. Backend
```bash
cd backend
cp .env.example .env
# Configurar MONGODB_URI y JWT_SECRET en el archivo .env
npm install
npm run seed
npm run dev
```

### 2. Frontend
```bash
cd frontend
npm install
npm start
```

## Documentación Técnica

- [Plan del Proyecto](docs/PROJECT_PLAN.md)
- [Arquitectura del Sistema](docs/ARCHITECTURE.md)
- [Diseño de Base de Datos y GeoJSON](docs/DATABASE.md)
- [Contratos de la API REST](docs/API_CONTRACTS.md)
- [Backlog de Issues](docs/BACKLOG.md)
- [Flujo de Trabajo por Sprints](docs/TEAM_WORKFLOW.md)
- [Checklist de Cumplimiento de Rúbrica](docs/RUBRIC_CHECKLIST.md)
