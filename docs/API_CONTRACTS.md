# Contratos de la API REST — S.O.S. Geo

**Base URL Local:** `http://localhost:3000/api`  
**Formato de Intercambio:** `application/json` (Límite: `100kb`)  
**Autenticación:** Header `Authorization: Bearer <JWT_TOKEN>` en rutas protegidas.

---

## 1. Tabla General de Endpoints

| Método | Ruta | Descripción | Entidad | Permisos | Parámetros / Query | Cuerpo Requerido (Body) | Respuesta Esperada | Códigos HTTP |
| :---: | :--- | :--- | :--- | :---: | :--- | :--- | :--- | :---: |
| `GET` | `/api/health` | Health check del servidor | Sistema | Público | Ninguno | Ninguno | `{ status: "OK", message, timestamp }` | `200` |
| `POST` | `/api/auth/register` | Registro de nuevo usuario | `User` | Público | Ninguno | `{ name, email, password }` | `{ message, token, user: { id, name, email, role } }` | `201, 400` |
| `POST` | `/api/auth/login` | Inicio de sesión con JWT | `User` | Público | Ninguno | `{ email, password }` | `{ message, token, user: { id, name, email, role } }` | `200, 400, 401` |
| `GET` | `/api/auth/me` | Perfil del usuario autenticado | `User` | JWT | Ninguno | Ninguno | `{ data: { id, name, email, role } }` | `200, 401` |
| `GET` | `/api/categories` | Listar todas las categorías | `Category` | JWT | Ninguno | Ninguno | `{ count, data: [Category] }` | `200, 401` |
| `GET` | `/api/categories/:id` | Obtener categoría por ID | `Category` | JWT | `:id` (ObjectId) | Ninguno | `{ data: Category }` | `200, 401, 404` |
| `POST` | `/api/categories` | Crear categoría | `Category` | JWT | Ninguno | `{ name, description, color, icon }` | `{ message, data: Category }` | `201, 400, 401` |
| `PATCH` | `/api/categories/:id` | Editar categoría | `Category` | JWT | `:id` (ObjectId) | Parcial de `{ name, description, color, icon, isActive }` | `{ message, data: Category }` | `200, 400, 401, 404` |
| `DELETE` | `/api/categories/:id` | Eliminar categoría (valida uso) | `Category` | JWT | `:id` (ObjectId) | Ninguno | `{ message, data: Category }` | `200, 400, 401, 404` |
| `GET` | `/api/professionals` | Listar profesionales (con `populate`) | `Professional` | JWT | `?category=&status=` | Ninguno | `{ count, data: [ProfessionalPopulated] }` | `200, 401` |
| `GET` | `/api/professionals/:id` | Obtener profesional por ID | `Professional` | JWT | `:id` (ObjectId) | Ninguno | `{ data: ProfessionalPopulated }` | `200, 401, 404` |
| `POST` | `/api/professionals` | Crear profesional | `Professional` | JWT | Ninguno | `{ fullName, specialty, phone, email, experienceYears, status, category, zone? }` | `{ message, data: ProfessionalPopulated }` | `201, 400, 401` |
| `PATCH` | `/api/professionals/:id` | Editar profesional | `Professional` | JWT | `:id` (ObjectId) | Parcial de campos permitidos | `{ message, data: ProfessionalPopulated }` | `200, 400, 401, 404` |
| `DELETE` | `/api/professionals/:id` | Eliminar profesional | `Professional` | JWT | `:id` (ObjectId) | Ninguno | `{ message, data: Professional }` | `200, 401, 404` |
| `GET` | `/api/service-requests` | Listar solicitudes (con `populate`) | `ServiceRequest` | JWT | `?status=&priority=&category=` | Ninguno | `{ count, data: [ServiceRequestPopulated] }` | `200, 401` |
| `GET` | `/api/service-requests/:id` | Obtener solicitud por ID | `ServiceRequest` | JWT | `:id` (ObjectId) | Ninguno | `{ data: ServiceRequestPopulated }` | `200, 401, 404` |
| `POST` | `/api/service-requests` | Crear solicitud de servicio | `ServiceRequest` | JWT | Ninguno | `{ title, description, priority, status, contactName, contactPhone, category, location, professional? }` | `{ message, data: ServiceRequestPopulated }` | `201, 400, 401` |
| `PATCH` | `/api/service-requests/:id` | Actualizar solicitud / estado | `ServiceRequest` | JWT | `:id` (ObjectId) | Parcial de campos permitidos | `{ message, data: ServiceRequestPopulated }` | `200, 400, 401, 404` |
| `DELETE` | `/api/service-requests/:id` | Eliminar solicitud | `ServiceRequest` | JWT | `:id` (ObjectId) | Ninguno | `{ message, data: ServiceRequest }` | `200, 401, 404` |
| `GET` | `/api/locations` | Listar y filtrar ubicaciones exactas | `Location` | JWT | `?search=&category=&status=` | Ninguno | `{ count, data: [LocationPopulated] }` | `200, 400, 401` |
| `GET` | `/api/locations/geojson` | Obtener `FeatureCollection` filtrada | `Location` | JWT | `?search=&category=&status=` | Ninguno | `{ type: "FeatureCollection", features: [...] }` | `200, 400, 401` |
| `GET` | `/api/locations/:id` | Obtener ubicación por ID | `Location` | JWT | `:id` (ObjectId) | Ninguno | `{ data: LocationPopulated }` | `200, 401, 404` |
| `POST` | `/api/locations` | Registrar ubicación desde clic en mapa | `Location` | JWT | Ninguno | `{ name, description, category, status, latitude, longitude, contactPhone?, primaryProfessional? }` | `{ message, data: LocationPopulated }` | `201, 400, 401` |
| `PATCH` | `/api/locations/:id` | Editar ubicación desde popup | `Location` | JWT | `:id` (ObjectId) | Parcial: `{ name?, description?, category?, status?, latitude?, longitude?, contactPhone?, primaryProfessional? }` | `{ message, data: LocationPopulated }` | `200, 400, 401, 404` |
| `DELETE` | `/api/locations/:id` | Eliminar ubicación desde popup | `Location` | JWT | `:id` (ObjectId) | Ninguno | `{ message, data: Location }` | `200, 401, 404` |
| `GET` | `/api/zones` | Listar polígonos de zonas guardadas | `Zone` | JWT | Ninguno | Ninguno | `{ count, data: [ZonePopulated] }` | `200, 401` |
| `GET` | `/api/zones/geojson` | Obtener `FeatureCollection` de zonas | `Zone` | JWT | Ninguno | Ninguno | `{ type: "FeatureCollection", features: [...] }` | `200, 401` |
| `POST` | `/api/zones` | Guardar polígono dibujado en el mapa | `Zone` | JWT | Ninguno | `{ name, description?, color?, coordinates }` | `{ message, data: ZonePopulated }` | `201, 400, 401` |
| `DELETE` | `/api/zones/:id` | Eliminar zona del mapa y MongoDB | `Zone` | JWT | `:id` (ObjectId) | Ninguno | `{ message, data: Zone }` | `200, 401, 404` |

---

## 2. Contratos JSON Detallados

### 2.1 Autenticación (`POST /api/auth/register` y `POST /api/auth/login`)

**Request (`POST /api/auth/register`):**
```json
{
  "name": "Usuario Prueba Evaluador",
  "email": "demo@sosgeo.lasalle.mx",
  "password": "Password123!"
}
```

**Response (`201 Created` / `200 OK`):**
```json
{
  "message": "Autenticación exitosa",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "673f10000000000000000001",
    "name": "Usuario Prueba Evaluador",
    "email": "demo@sosgeo.lasalle.mx",
    "role": "admin"
  }
}
```

---

### 2.2 Ubicaciones Exactas (`POST /api/locations` y `GET /api/locations?search=&category=&status=`)

**Request (`POST /api/locations`):**
```json
{
  "name": "Base Grúas Express Bajío",
  "description": "Auxilio vial, cambio de neumático y remolque ligero 24/7.",
  "category": "673f1a2b3c4d5e6f7a8b9c01",
  "status": "activo",
  "contactPhone": "4779876543",
  "primaryProfessional": "673f2b3c4d5e6f7a8b9c0201",
  "latitude": 21.1248,
  "longitude": -101.6812
}
```

**Response (`201 Created`):**
```json
{
  "message": "Ubicación creada correctamente",
  "data": {
    "id": "673f3c4d5e6f7a8b9c030001",
    "name": "Base Grúas Express Bajío",
    "description": "Auxilio vial, cambio de neumático y remolque ligero 24/7.",
    "status": "activo",
    "contactPhone": "4779876543",
    "category": {
      "id": "673f1a2b3c4d5e6f7a8b9c01",
      "name": "Asistencia Automotriz",
      "color": "#d92d20",
      "icon": "car"
    },
    "primaryProfessional": {
      "id": "673f2b3c4d5e6f7a8b9c0201",
      "fullName": "Ing. Carlos Méndez",
      "specialty": "Mecánica y Auxilio Vial"
    },
    "registeredBy": {
      "id": "673f10000000000000000001",
      "name": "Usuario Prueba Evaluador"
    },
    "location": {
      "type": "Point",
      "coordinates": [-101.6812, 21.1248]
    },
    "createdAt": "2026-11-21T22:00:00.000Z",
    "updatedAt": "2026-11-21T22:00:00.000Z"
  }
}
```

---

### 2.3 Zonas Poligonales (`POST /api/zones`)

**Request (`POST /api/zones`):**
```json
{
  "name": "Zona Norte - Campestre",
  "description": "Cobertura prioritaria norte",
  "color": "#1570ef",
  "coordinates": [
    [
      [-101.6950, 21.1550],
      [-101.6750, 21.1550],
      [-101.6750, 21.1400],
      [-101.6950, 21.1400],
      [-101.6950, 21.1550]
    ]
  ]
}
```

**Response (`201 Created`):**
```json
{
  "message": "Zona creada correctamente",
  "data": {
    "id": "673f4d5e6f7a8b9c04000001",
    "name": "Zona Norte - Campestre",
    "description": "Cobertura prioritaria norte",
    "color": "#1570ef",
    "area": {
      "type": "Polygon",
      "coordinates": [
        [
          [-101.6950, 21.1550],
          [-101.6750, 21.1550],
          [-101.6750, 21.1400],
          [-101.6950, 21.1400],
          [-101.6950, 21.1550]
        ]
      ]
    },
    "createdAt": "2026-11-21T22:02:00.000Z",
    "updatedAt": "2026-11-21T22:02:00.000Z"
  }
}
```

---

### 2.4 Estructura Estándar de Errores (`middlewares/error.handler.js`)

```json
{
  "error": {
    "status": 400,
    "message": "La información enviada no es válida.",
    "details": [
      "El campo \"name\" es obligatorio",
      "La latitud debe estar entre -90 y 90."
    ],
    "path": "/api/locations",
    "timestamp": "2026-11-21T22:05:00.000Z"
  }
}
```
