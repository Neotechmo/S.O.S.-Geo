# Backlog del Proyecto (GitHub Projects / Issues) — S.O.S. Geo

Backlog completo de **20 Issues** distribuidos de forma equilibrada para el **equipo de 3 integrantes**, agrupados en 5 Milestones.

---

## Milestone 1: M1 - Preparación, Base de Datos y Core Backend

### Issue #1: `[DEVOPS] Inicialización del monorepositorio, estándares Git y variables de entorno`
- **Descripción:** Configurar la estructura raíz (`backend/`, `frontend/`, `docs/`), `.gitignore`, `.env.example` sin credenciales reales y scripts base en `backend/package.json`.
- **Requisitos de la rúbrica:** Requisitos técnicos obligatorios (Seguridad `.env.example`, Frontend Angular CLI, Backend Node/Express).
- **Criterios de aceptación:**
  1. Existe `backend/.env.example` con `PORT`, `FRONTEND_ORIGINS`, `MONGODB_URI`, `JWT_SECRET` y `JWT_EXPIRES_IN`.
  2. `.gitignore` excluye `node_modules/`, `.env`, `dist/`, `.angular/` y `temp/`.
  3. `frontend/` es un proyecto válido generado con `@angular/cli`.
- **Dependencias:** Ninguna.
- **Prioridad:** P0 | **Complejidad:** Baja (2 h) | **Rol sugerido:** Integrante 1 | **Rama:** `feature/repo-setup`

### Issue #2: `[BACKEND] Configuración de Express en capas, conexión Mongoose y manejo centralizado de errores`
- **Descripción:** Implementar `src/index.js`, `src/app.js`, `src/config/database.js`, `src/utils/appError.js` y `src/middlewares/error.handler.js` siguiendo la arquitectura del semestre.
- **Requisitos de la rúbrica:** Estructura del backend (10 pts).
- **Criterios de aceptación:**
  1. `GET /api/health` responde `200 OK` tras conectar a MongoDB Atlas.
  2. Rutas inexistentes devuelven `404` con formato `{ error: { status: 404, message, path, timestamp } }`.
  3. JSON malformado devuelve `400` y errores operativos usan `AppError`.
- **Dependencias:** Issue #1.
- **Prioridad:** P0 | **Complejidad:** Media (3 h) | **Rol sugerido:** Integrante 1 | **Rama:** `feature/backend-core`

### Issue #3: `[DATABASE] Modelo User, cifrado bcrypt y endpoints de Autenticación JWT`
- **Descripción:** Crear `user.model.js`, `auth.validator.js`, `auth.service.js`, `auth.handler.js` y `auth.router.js` (`POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`).
- **Requisitos de la rúbrica:** Inicio de Sesión (10 pts), Registro de usuarios (10 pts), Seguridad (`bcrypt`).
- **Criterios de aceptación:**
  1. Las contraseñas se guardan cifradas con `bcrypt` (nunca en texto plano) y no se devuelven en `toJSON`.
  2. Intentar registrar un correo existente devuelve `400` con mensaje claro de correo duplicado.
  3. Login con credenciales incorrectas devuelve `401` con mensaje claro; login exitoso devuelve JWT válido.
  4. Middleware `requireAuth` rechaza peticiones sin token con `401`.
- **Dependencias:** Issue #2.
- **Prioridad:** P0 | **Complejidad:** Media (4 h) | **Rol sugerido:** Integrante 1 | **Rama:** `feature/backend-auth`

---

## Milestone 2: M2 - Modelos, Relaciones ObjectId y 3 CRUDs Internos en Backend

### Issue #4: `[BACKEND] CRUD completo #1: Entidad Category y protección de integridad referencial`
- **Descripción:** Implementar `category.model.js`, `category.validator.js`, `categories.service.js` y `categories.router.js`.
- **Requisitos de la rúbrica:** CRUD internos (10 pts), Estructura del backend (10 pts).
- **Criterios de aceptación:**
  1. Soporta `GET`, `GET /:id`, `POST`, `PATCH /:id` y `DELETE /:id` en `/api/categories`.
  2. Valida color hexadecimal, nombre único y longitud de descripción.
  3. `DELETE /api/categories/:id` impide eliminar con `400` si la categoría está referenciada en ubicaciones, profesionales o solicitudes.
- **Dependencias:** Issue #3.
- **Prioridad:** P0 | **Complejidad:** Media (3 h) | **Rol sugerido:** Integrante 3 | **Rama:** `feature/backend-categories`

### Issue #5: `[GEO] Modelo y endpoints de Zone con GeoJSON Polygon e índice 2dsphere`
- **Descripción:** Implementar `zone.model.js`, `zone.validator.js`, `zones.service.js` y `zones.router.js` para almacenar zonas como GeoJSON `Polygon` en orden `[longitud, latitud]`.
- **Requisitos de la rúbrica:** Trazo de zonas en Mapa (15 pts), Requisitos técnicos obligatorios (`Polygon`, `[lng, lat]`, `2dsphere`).
- **Criterios de aceptación:**
  1. `zoneSchema` define `area: { type: "Polygon", coordinates: [[[Number]]] }` e índice `2dsphere`.
  2. El validador verifica que cada vértice tenga `[longitud, latitud]` dentro de `[-180..180, -90..90]`, mínimo 4 puntos y que el primer y último punto sean iguales.
  3. `GET /api/zones`, `POST /api/zones` y `DELETE /api/zones/:id` funcionan y limpian referencias en `Professional` al borrar.
- **Dependencias:** Issue #3.
- **Prioridad:** P0 | **Complejidad:** Media-Alta (4 h) | **Rol sugerido:** Integrante 3 | **Rama:** `feature/backend-zones`

### Issue #6: `[BACKEND] CRUD completo #2: Entidad Professional con referencias ObjectId a Category y Zone`
- **Descripción:** Implementar `professional.model.js`, `professional.validator.js`, `professionals.service.js` y `professionals.router.js` usando `.populate('category')` y `.populate('zone')`.
- **Requisitos de la rúbrica:** CRUD internos (10 pts — relación `ObjectId` + `populate`).
- **Criterios de aceptación:**
  1. Operaciones `GET`, `POST`, `PATCH /:id` y `DELETE /:id` completas en `/api/professionals`.
  2. `GET /api/professionals` devuelve `category` y `zone` poblados con sus nombres y colores.
  3. Valida que el `ObjectId` de `category` exista en MongoDB antes de crear o actualizar.
- **Dependencias:** Issue #4, Issue #5.
- **Prioridad:** P0 | **Complejidad:** Media (4 h) | **Rol sugerido:** Integrante 3 | **Rama:** `feature/backend-professionals`

### Issue #7: `[GEO] Modelo y endpoints de Location con GeoJSON Point, 2dsphere y 3 filtros en Backend`
- **Descripción:** Implementar `location.model.js`, `location.validator.js`, `locations.service.js` y `locations.router.js` con soporte para `?search=&category=&status=` y `.populate('category primaryProfessional registeredBy')`.
- **Requisitos de la rúbrica:** Registro (5 pts), Edición (5 pts), Eliminación (5 pts), Tabla (10 pts) y Búsqueda/Filtros en backend (10 pts).
- **Criterios de aceptación:**
  1. Guarda coordenadas como GeoJSON `Point` en orden `[longitud, latitud]` con índice `2dsphere`.
  2. `GET /api/locations?search=texto&category=<id>&status=activo` filtra en MongoDB con regex insensible a mayúsculas en `name` y `description`, `ObjectId` de categoría y estado.
  3. `GET`, `POST`, `PATCH /:id` y `DELETE /:id` devuelven el objeto `category` poblado (`id, name, color, icon`).
- **Dependencias:** Issue #4, Issue #6.
- **Prioridad:** P0 | **Complejidad:** Alta (5 h) | **Rol sugerido:** Integrante 2 | **Rama:** `feature/backend-locations`

### Issue #8: `[BACKEND] CRUD completo #3: Entidad ServiceRequest con múltiples referencias ObjectId`
- **Descripción:** Implementar `service-request.model.js`, `service-request.validator.js`, `service-requests.service.js` y `service-requests.router.js` relacionando `Category`, `Location`, `Professional` y `User`.
- **Requisitos de la rúbrica:** CRUD internos (10 pts).
- **Criterios de aceptación:**
  1. Operaciones `GET`, `POST`, `PATCH /:id` y `DELETE /:id` en `/api/service-requests`.
  2. Todas las lecturas y escrituras devuelven `category`, `location`, `professional` y `requestedBy` poblados con `.populate()`.
- **Dependencias:** Issue #6, Issue #7.
- **Prioridad:** P1 | **Complejidad:** Media (4 h) | **Rol sugerido:** Integrante 1 | **Rama:** `feature/backend-service-requests`

### Issue #9: `[DATABASE] Script de Seeds con Usuario de Prueba y datos georreferenciados en León, Gto.`
- **Descripción:** Crear `src/data/seed.js` y archivos `*.seed.js` que carguen el usuario de prueba evaluador (`demo@sosgeo.lasalle.mx`), 4 categorías, 3 zonas poligonales en León, 6 profesionales, 10 ubicaciones exactas y 5 solicitudes de servicio vinculadas por `ObjectId`.
- **Requisitos de la rúbrica:** Entregable #2 (Usuario de prueba con datos cargados para revisar sin registrarse).
- **Criterios de aceptación:**
  1. `npm run seed` limpia e inserta todas las colecciones respetando las relaciones `ObjectId`.
  2. El usuario de prueba puede iniciar sesión inmediatamente y visualizar marcadores, polígonos, profesionales, categorías y solicitudes.
- **Dependencias:** Issue #7, Issue #8.
- **Prioridad:** P0 | **Complejidad:** Media (3 h) | **Rol sugerido:** Integrante 3 | **Rama:** `feature/database-seeds`

---

## Milestone 3: M3 - Frontend Angular, Auth y Vistas de CRUDs Internos

### Issue #10: `[FRONTEND] Arquitectura base en Angular, Router, AuthGuard, Interceptor JWT y Sistema de Alertas`
- **Descripción:** Configurar rutas en `app.routes.ts`, `authGuard`, `authInterceptor` (que adjunta `Authorization: Bearer <token>`), `NavbarComponent` y `AlertToastComponent` para mensajes de éxito y error.
- **Requisitos de la rúbrica:** Inicio de Sesión (bloqueo de vistas internas sin sesión), Diseño de interfaz (10 pts — navegación clara y mensajes visibles de éxito/error).
- **Criterios de aceptación:**
  1. Si un usuario no autenticado intenta entrar a `/map`, `/directory` o `/requests`, es redirigido automáticamente a `/auth`.
  2. Existe un componente visible de notificaciones que muestra éxitos (verde) y errores del backend (rojo).
- **Dependencias:** Issue #1.
- **Prioridad:** P0 | **Complejidad:** Media (4 h) | **Rol sugerido:** Integrante 1 | **Rama:** `feature/frontend-core-auth`

### Issue #11: `[FRONTEND] Vista 1: Pantalla de Inicio de Sesión y Registro de Usuarios`
- **Descripción:** Construir los formularios reactivos de Login y Registro conectados a `/api/auth/login` y `/api/auth/register`.
- **Requisitos de la rúbrica:** Inicio de Sesión (10 pts), Registro de usuarios (10 pts).
- **Criterios de aceptación:**
  1. Permite alternar entre "Iniciar Sesión" y "Crear Cuenta".
  2. Muestra mensajes claros cuando la contraseña/correo son incorrectos o cuando el correo ya está registrado.
  3. Al autenticarse redirige a `/map`.
- **Dependencias:** Issue #3, Issue #10.
- **Prioridad:** P0 | **Complejidad:** Media (3 h) | **Rol sugerido:** Integrante 1 | **Rama:** `feature/frontend-login-register`

### Issue #12: `[FRONTEND] Vista 3: CRUD de Categorías y CRUD de Profesionales`
- **Descripción:** Construir `DirectoryAdminPageComponent` con formularios y tablas para crear, listar, editar y eliminar `Category` y `Professional` (seleccionando categoría y zona por desplegable).
- **Requisitos de la rúbrica:** CRUD internos (10 pts), Diseño de interfaz (10 pts).
- **Criterios de aceptación:**
  1. Permite crear, listar, editar y eliminar categorías y profesionales sin recargar la página.
  2. Muestra el nombre de la categoría y zona asignada al profesional (usando los datos poblados).
  3. Muestra mensaje de error claro si se intenta eliminar una categoría que tiene registros asociados.
- **Dependencias:** Issue #4, Issue #6, Issue #10.
- **Prioridad:** P1 | **Complejidad:** Media-Alta (5 h) | **Rol sugerido:** Integrante 3 | **Rama:** `feature/frontend-directory-cruds`

### Issue #13: `[FRONTEND] Vista 4: CRUD de Solicitudes de Servicio (ServiceRequest)`
- **Descripción:** Construir `RequestsAdminPageComponent` para crear, listar, filtrar, cambiar estado/prioridad y eliminar solicitudes de asistencia vinculadas a Categoría, Ubicación y Profesional.
- **Requisitos de la rúbrica:** CRUD internos (10 pts), Diseño de interfaz (10 pts).
- **Criterios de aceptación:**
  1. Permite crear, listar, editar y eliminar solicitudes de servicio.
  2. En la tabla se visualizan los nombres poblados de la Categoría, el Punto de Atención (`Location`), el Profesional y el Usuario solicitante.
- **Dependencias:** Issue #8, Issue #10.
- **Prioridad:** P1 | **Complejidad:** Media (4 h) | **Rol sugerido:** Integrante 1 | **Rama:** `feature/frontend-requests-crud`

---

## Milestone 4: M4 - Funcionalidades Geoespaciales en Frontend (Mapa, Popups, Tabla y Zonas)

### Issue #14: `[GEO] Vista 2: Mapa Leaflet, Registro de Ubicaciones por clic y Edición/Eliminación en Popup`
- **Descripción:** Integrar Leaflet en `MapDashboardPageComponent`: cargar ubicaciones en el mapa, registrar nueva ubicación al hacer clic sobre el mapa y permitir **editar y eliminar directamente dentro del popup** de cada marcador.
- **Requisitos de la rúbrica:** Registro de ubicaciones exactas (5 pts), Edición de ubicaciones desde popup (5 pts), Eliminación de ubicaciones desde popup (5 pts).
- **Criterios de aceptación:**
  1. Al hacer clic en cualquier punto del mapa se captura `[longitud, latitud]`, se completa nombre, descripción, categoría y estado, se guarda en MongoDB y aparece el marcador con su popup.
  2. Al abrir el popup de un marcador y dar clic en "Editar", se pueden modificar sus datos **ahí mismo en el popup** y guardar en MongoDB (`PATCH /api/locations/:id`).
  3. Al abrir el popup de un marcador y dar clic en "Eliminar", se elimina **ahí mismo desde el popup** en MongoDB (`DELETE /api/locations/:id`) y desaparece del mapa.
- **Dependencias:** Issue #7, Issue #10.
- **Prioridad:** P0 | **Complejidad:** Alta (6 h) | **Rol sugerido:** Integrante 2 | **Rama:** `feature/frontend-map-locations`

### Issue #15: `[FRONTEND] Vista 2: Tabla de ubicaciones en tiempo real y Barra de Búsqueda + 3 Filtros Backend`
- **Descripción:** Construir `LocationsRealtimeTableComponent` y `LocationFilterBarComponent` sincronizados con el mapa mediante `LocationsService`.
- **Requisitos de la rúbrica:** Tabla de ubicaciones registradas (10 pts), Búsqueda y Filtros en backend (10 pts).
- **Criterios de aceptación:**
  1. La tabla muestra todos los datos de las ubicaciones guardadas **excepto el ID**.
  2. La columna Categoría muestra el **nombre de la categoría**, nunca su `ObjectId`.
  3. Crear, editar o eliminar una ubicación en el mapa actualiza la tabla instantáneamente **sin recargar la página**.
  4. Los filtros de búsqueda parcial por nombre (`search`), categoría (`category`) y estado (`status`) envían parámetros `?search=&category=&status=` al backend y actualizan tanto el mapa como la tabla.
- **Dependencias:** Issue #14.
- **Prioridad:** P0 | **Complejidad:** Media-Alta (5 h) | **Rol sugerido:** Integrante 2 | **Rama:** `feature/frontend-table-filters`

### Issue #16: `[GEO] Vista 2: Trazo, Persistencia y Eliminación de Zonas (Polígonos) con Leaflet-Geoman`
- **Descripción:** Integrar `@geoman-io/leaflet-geoman-free` en el mapa para dibujar polígonos, asignarles un nombre, guardarlos en MongoDB como GeoJSON `Polygon`, recargarlos al abrir la app y eliminarlos desde su popup.
- **Requisitos de la rúbrica:** Trazo de zonas en Mapa (15 pts).
- **Criterios de aceptación:**
  1. El usuario puede dibujar un polígono en el mapa, asignarle un nombre y guardarlo en MongoDB (`POST /api/zones`).
  2. Al recargar la página o volver a iniciar sesión, todos los polígonos guardados se dibujan en el mapa (`GET /api/zones`).
  3. Al hacer clic en un polígono, su popup muestra el nombre de la zona y un botón para eliminarla (`DELETE /api/zones/:id`), permaneciendo en MongoDB hasta que el usuario la elimine.
- **Dependencias:** Issue #5, Issue #14.
- **Prioridad:** P0 | **Complejidad:** Alta (5 h) | **Rol sugerido:** Integrante 3 | **Rama:** `feature/frontend-map-zones`

---

## Milestone 5: M5 - Pruebas, Despliegue Público y Documentación Final

### Issue #17: `[BACKEND] Suite de pruebas de integración HTTP y verificación de rúbrica`
- **Descripción:** Completar la colección de pruebas en `backend/request/*.http` y ejecutar la matriz completa de 12 escenarios de prueba (auth, duplicados, 3 CRUDs, GeoJSON, filtros, errores 400/401/404).
- **Requisitos de la rúbrica:** Todos los rubros funcionales y Estructura del backend (códigos HTTP).
- **Criterios de aceptación:**
  1. Todos los endpoints responden con los códigos HTTP exactos (`200, 201, 400, 401, 404, 500`).
  2. Se verifica en MongoDB Atlas que `Location.location` es `Point [lng, lat]` y `Zone.area` es `Polygon [lng, lat]` con índices `2dsphere` activos.
- **Dependencias:** Issues #1 a #16.
- **Prioridad:** P0 | **Complejidad:** Media (3 h) | **Rol sugerido:** Los 3 integrantes | **Rama:** `feature/qa-integration-tests`

### Issue #18: `[DEVOPS] Despliegue público en MongoDB Atlas, Render/Railway y Vercel/Netlify`
- **Descripción:** Configurar cluster en MongoDB Atlas (`0.0.0.0/0` Network Access para revisión), desplegar Backend en Render/Railway, ejecutar `npm run seed` en producción y desplegar Frontend Angular en Vercel/Netlify.
- **Requisitos de la rúbrica:** Requisitos técnicos obligatorios (Despliegue accesible desde internet) y Entregables #1 y #2.
- **Criterios de aceptación:**
  1. La URL pública del frontend carga sin errores de CORS ni Mixed Content.
  2. El usuario de prueba inicia sesión en la URL pública y tiene datos precargados en mapa, zonas, tabla y los 3 CRUDs.
- **Dependencias:** Issue #17.
- **Prioridad:** P0 | **Complejidad:** Media (4 h) | **Rol sugerido:** Integrante 1 | **Rama:** `feature/production-deploy`

### Issue #19: `[DOCS] Limpieza de seguridad del repositorio y README.md definitivo`
- **Descripción:** Auditar que el repositorio público no contenga archivos `.env` ni credenciales en el historial de Git, y redactar el `README.md` con instrucciones paso a paso de instalación local, variables de entorno, arquitectura y credenciales del usuario de prueba.
- **Requisitos de la rúbrica:** Entregable #3 (Repositorio público con `README.md` y `.env.example` sin contraseñas reales).
- **Criterios de aceptación:**
  1. Un clon limpio del repositorio puede levantarse localmente siguiendo únicamente las instrucciones del `README.md`.
  2. `git log -p` no contiene cadenas `mongodb+srv://` con contraseñas reales.
- **Dependencias:** Issue #18.
- **Prioridad:** P0 | **Complejidad:** Baja (2 h) | **Rol sugerido:** Integrante 2 | **Rama:** `feature/docs-readme`

### Issue #20: `[DOCS] Elaboración del Reporte PDF institucional y repaso de dominio de código`
- **Descripción:** Redactar el Reporte del Desarrollo en PDF con los 5 apartados obligatorios de la página 4 de la rúbrica y realizar una sesión de repaso cruzado entre los 3 integrantes.
- **Requisitos de la rúbrica:** Entregable #4 (Reporte en PDF) y Regla de Dominio del Código.
- **Criterios de aceptación:**
  1. El PDF incluye: Portada institucional, Problemática y solución, Desarrollo paso a paso (estructura backend + modelos MongoDB y relaciones), Resultados (capturas de cada requisito de la rúbrica funcionando en el despliegue) y Conclusiones individuales (3 conclusiones, una por cada integrante).
  2. Los 3 integrantes pueden explicar cualquier fragmento del frontend, backend y MongoDB.
- **Dependencias:** Issue #18, Issue #19.
- **Prioridad:** P0 | **Complejidad:** Media (4 h) | **Rol sugerido:** Los 3 integrantes | **Rama:** `feature/docs-final-report`
