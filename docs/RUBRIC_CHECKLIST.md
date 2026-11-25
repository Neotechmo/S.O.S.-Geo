# Matriz de Cumplimiento, Pruebas, Riesgos y Checklist de Rúbrica — S.O.S. Geo

---

## 1. Matriz de Cumplimiento de la Rúbrica Oficial (100 Puntos)

| Rubro en Rúbrica | Descripción Oficial | Puntos | Implementación en S.O.S. Geo |
| :--- | :--- | :---: | :--- |
| **Requisitos Técnicos Obligatorios** | Angular/React/Vue CLI, Leaflet/Mapbox, Express en capas del semestre, MongoDB Atlas + GeoJSON `[lng, lat]` + `2dsphere`, `bcrypt` + `.env.example`, Despliegue público. | **Eliminatorio** | Angular CLI, Leaflet + Leaflet-Geoman, Express CommonJS en 6 capas, MongoDB Atlas con `Point` y `Polygon` `2dsphere`, `bcryptjs` + JWT, desplegado en Vercel + Render + Atlas. |
| **1. Inicio de Sesión** | Vista propia de login. Validación contra MongoDB comparando contraseña cifrada. Mensaje claro de error. Sin sesión no se entra a vistas internas. | **10** | Vista `/auth`, endpoint `POST /api/auth/login`, `bcrypt.compare`, `AuthGuard` protegiendo `/map`, `/directory` y `/requests`. |
| **2. Registro de usuarios** | Crear cuenta desde pantalla de acceso. Guardado con contraseña cifrada, validación de campos y sin correos duplicados. | **10** | Vista `/auth`, endpoint `POST /api/auth/register`, validador `auth.validator.js`, índice `unique` en `email` + validación en `AuthService`. |
| **3. CRUD internos** | Al menos 3 CRUD completos distintos de usuarios, ubicaciones y zonas. Al menos una relación `ObjectId` + `populate`. | **10** | 3 CRUDs completos: `Category`, `Professional` (ref a `Category` y `Zone`) y `ServiceRequest` (ref a `Category`, `Professional`, `Location`, `User`). |
| **4. Registro de ubicaciones exactas** | Clic en mapa registra ubicación con nombre, descripción, categoría y coordenadas GeoJSON `Point [lng, lat]` y aparece con popup. | **5** | Evento `map.on('click')` en Angular captura `[lng, lat]`, envía `POST /api/locations`, guarda `Point` y dibuja marcador con popup interactivo. |
| **5. Edición de ubicaciones** | Editar información de ubicación exacta dando clic sobre el popup y editando ahí mismo en MongoDB. | **5** | Botón "Editar" dentro del popup despliega formulario inline en el propio popup, envía `PATCH /api/locations/:id` y actualiza MongoDB, marcador y tabla. |
| **6. Eliminación de ubicaciones** | Eliminar ubicaciones exactas dando clic sobre el popup y eliminando ahí mismo en MongoDB. | **5** | Botón "Eliminar" dentro del popup ejecuta `DELETE /api/locations/:id`, elimina en MongoDB y remueve marcador y fila de la tabla al instante. |
| **7. Tabla de ubicaciones registradas** | Tabla en tiempo real con todos los datos excepto el ID (categoría por nombre, no `ObjectId`). Se actualiza sin recargar la página. | **10** | Componente `LocationsRealtimeTableComponent` sincronizado en memoria; oculta `id` y muestra `location.category.name`. |
| **8. Búsqueda y Filtros** | Búsqueda por nombre (parcial, insensible a mayúsculas), filtro por categoría y tercer filtro en backend (`?search=&category=&status=`), reflejado en mapa y tabla. | **10** | Barra de filtros invoca `GET /api/locations?search=...&category=...&status=...`; el backend filtra en MongoDB y el frontend actualiza mapa y tabla. |
| **9. Trazo de zonas en Mapa** | Usuario dibuja polígonos con nombre, se guardan como GeoJSON `Polygon [lng, lat]`, se cargan al abrir y permanecen hasta eliminarse. | **15** | Integración de Leaflet-Geoman (`pm:create`), asigna nombre, `POST /api/zones`, carga inicial con `GET /api/zones` y borrado desde popup del polígono (`DELETE /api/zones/:id`). |
| **10. Diseño de interfaz** | Mínimo 3 vistas: 1) login/registro, 2) principal con mapa y tabla, 3) otra relacionada. Navegación clara y alertas de éxito/error. | **10** | 4 vistas funcionales con barra de navegación clara y sistema de notificaciones visuales (`AlertToastComponent`). |
| **11. Estructura del backend** | Capas del semestre (`routes`, `services`, `middlewares`, `models`, `config`, `utils`), `AppError`, 404 y códigos HTTP (`200, 201, 400, 401, 404, 500`). | **10** | Estructura por capas idéntica a la trabajada en el semestre, con un servicio y un validador por entidad. |
| **TOTAL** | Suma total de la rúbrica | **100** | **100 / 100 puntos cubiertos** |

---

## 2. Matriz de Trazabilidad y Plan de Pruebas

| # | Requisito / Escenario de Prueba | Entidad | Endpoint Backend | Vista Angular | Procedimiento de Prueba | Evidencia Esperada (para PDF) |
| :---: | :--- | :--- | :--- | :--- | :--- | :--- |
| **1** | **Autenticación correcta e incorrecta** | `User` | `POST /api/auth/login` | Vista 1 (`/auth`) | Ingresar con contraseña errónea (esperar `401` y alerta visible); luego ingresar con `demo@sosgeo.lasalle.mx` (esperar `200`, token JWT y redirección a `/map`). | Captura de pantalla con alerta de error `401` y captura entrando al dashboard `/map`. |
| **2** | **Registro y correo duplicado** | `User` | `POST /api/auth/register` | Vista 1 (`/auth`) | Registrar un usuario nuevo (`201`); intentar registrar el mismo correo nuevamente y verificar bloqueo (`400`) y hash de contraseña en Atlas. | Captura de mensaje "El correo ya está registrado" + captura del documento en Atlas con password cifrado `$2b$10$...`. |
| **3** | **Rutas protegidas** | `User` | Middleware `requireAuth` | Vistas 2, 3 y 4 (`authGuard`) | Cerrar sesión (borrar token) e intentar navegar manualmente a `/map` o invocar `GET /api/locations` sin header `Authorization`. | Captura de redirección automática a `/auth` y respuesta `401 Unauthorized` en REST Client. |
| **4** | **Los 3 CRUD completos** | `Category`, `Professional`, `ServiceRequest` | `/api/categories`, `/api/professionals`, `/api/service-requests` | Vista 3 (`/directory`) y Vista 4 (`/requests`) | Crear, listar (verificando datos poblados con `populate`), editar y eliminar un registro en cada uno de los 3 módulos. | Capturas de las 3 tablas y formularios creando, editando y eliminando registros. |
| **5** | **Creación, edición y eliminación de puntos desde el mapa/popup** | `Location` | `POST`, `PATCH /:id`, `DELETE /:id` en `/api/locations` | Vista 2 (`/map`) | 1) Clic en el mapa y guardar ubicación. 2) Clic en su marcador → en el popup clic en "Editar", cambiar nombre/estado y guardar. 3) En el popup clic en "Eliminar". | 3 capturas secuenciales: creación por clic, formulario de edición abierto dentro del popup y marcador eliminado. |
| **6** | **Sincronización de mapa y tabla sin recargar** | `Location` | `/api/locations` | Vista 2 (`/map`) | Observar la tabla inferior al crear, editar o borrar un punto en el mapa; verificar que no tiene columna ID y que muestra el nombre de la categoría. | Captura de pantalla mostrando mapa y tabla sincronizados, con nombre de categoría legible (sin `ObjectId`). |
| **7** | **Filtros combinados del backend** | `Location` | `GET /api/locations?search=&category=&status=` | Vista 2 (`/map`) | Buscar texto parcial en minúsculas/mayúsculas + seleccionar una categoría + seleccionar un estado; verificar en pestaña Network la petición al backend. | Captura de DevTools (Network) mostrando query params `?search=...&category=...&status=...` y mapa/tabla filtrados. |
| **8** | **Persistencia de polígonos tras recargar** | `Zone` | `POST /api/zones`, `GET /api/zones`, `DELETE /api/zones/:id` | Vista 2 (`/map`) | Dibujar polígono con Leaflet-Geoman, asignarle nombre, guardar, recargar el navegador (`F5`) y comprobar que sigue dibujado; luego eliminarlo. | Captura del polígono trazado, captura tras recargar la página y documento `Polygon` en MongoDB Atlas. |
| **9** | **Integridad de referencias** | `Category`, `Location`, `Professional` | `DELETE /api/categories/:id` | Vista 3 (`/directory`) | Intentar eliminar una categoría que tiene ubicaciones o profesionales asignados. | Captura de alerta de error `400` impidiendo dejar referencias huérfanas. |
| **10** | **Validación de coordenadas** | `Location`, `Zone` | `POST /api/locations`, `POST /api/zones` | Backend Validators | Enviar vía REST Client `latitude: 120` o `longitude: -250` o un polígono sin cerrar. | Captura de respuesta `400 Bad Request` con el detalle de validación de coordenadas. |
| **11** | **Manejo centralizado de errores** | Sistema | `notFoundHandler`, `errorHandler` | Backend (`AppError`) | Invocar una ruta inexistente o un ObjectId sin registro (esperar `404`) y un ID malformado como `GET /api/locations/123` (esperar `400`). El runner simula un fallo interno para comprobar `500`. | Respuestas estructuradas por `error.handler.js` con los códigos esperados. |
| **12** | **Acceso público al despliegue** | Todas | URLs de Render y Vercel | Producción | Abrir la liga pública desde otra red/dispositivo (o modo incógnito), iniciar sesión con el usuario de prueba y probar mapa, zonas y CRUDs. | Captura de la aplicación funcionando con el dominio público en la barra de direcciones. |

---

## 3. Riesgos y Mitigaciones

| # | Riesgo Identificado | Impacto | Probabilidad | Estrategia de Mitigación |
| :---: | :--- | :---: | :---: | :--- |
| **R1** | **Inversión de coordenadas (`[lat, lng]` en vez de `[lng, lat]`)**: Leaflet usa `[lat, lng]` en `L.marker([lat, lng])`, mientras que GeoJSON y MongoDB exigen `[longitud, latitud]`. | **Crítico (Eliminatorio)** | Alta | En backend (`location.model.js` y `zone.model.js`) se guarda estrictamente `[longitude, latitude]`. En Angular se crea una función utilitaria centralizada `toLeafletLatLng(coords: [number, number]): [number, number]`. |
| **R2** | **Eventos de clic dentro de popups de Leaflet en Angular**: El HTML de un popup de Leaflet se inyecta fuera del ciclo normal de templates de Angular. | Alto | Media | Construir el DOM del popup enlazando los botones "Editar" y "Eliminar" mediante `L.DomEvent.on(btn, 'click', () => this.ngZone.run(...))` para actualizar el estado de Angular y la tabla de inmediato. |
| **R3** | **Polígonos abiertos al enviar de Leaflet-Geoman a MongoDB**: MongoDB rechaza un `GeoJSON Polygon` con error `2dsphere` si el primer vértice no es exactamente igual al último. | Alto | Media | Tanto en el servicio de Angular como en `zones.service.js` del backend, verificar si `first[0] !== last[0] || first[1] !== last[1]` y cerrar automáticamente el anillo lineal antes de guardar. |
| **R4** | **Suspensión o caída del backend gratuito en Render durante la revisión del profesor.** | **Crítico (Eliminatorio)** | Media | Configurar `/api/health`, probar la liga pública antes de entregar y mantener activo el servicio durante todo el periodo de evaluación. |
| **R5** | **Preguntas individuales sobre el código en la revisión (Regla de Dominio del Código).** | **Crítico (Calificación 0)** | Media | Revisión cruzada obligatoria en todos los PRs entre los 3 integrantes y sesión de repaso técnico completo antes de la entrega. |

---

## 4. Checklist Final Antes de Entregar en Teams

### A. Requisitos Técnicos Eliminatorios
- [ ] Frontend creado con **Angular CLI** (sin HTML/JS suelto).
- [ ] Mapa implementado con **Leaflet** y trazo de zonas con **Leaflet-Geoman** (los 3 integrantes saben explicarlo).
- [ ] Backend en **Node.js + Express** con las carpetas del semestre: `config`, `models`, `routes`, `services`, `middlewares` y `utils`.
- [ ] Base de datos en **MongoDB Atlas con Mongoose**: ubicaciones guardadas como `GeoJSON Point` y zonas como `GeoJSON Polygon`, siempre en orden **`[longitud, latitud]`** y con índice **`2dsphere`** verificado en Atlas.
- [ ] Contraseñas cifradas con **`bcrypt`** (nunca en texto plano).
- [ ] Credenciales y `MONGODB_URI` solo en `.env` (ignorado por Git) y archivo **`.env.example` sin datos reales** incluido en el repositorio.
- [ ] Frontend, backend y base de datos **desplegados y accesibles desde internet** durante todo el periodo de revisión.

### B. Funcionalidad y Puntuación (100 Puntos)
- [ ] **Inicio de sesión (10 pts):** Valida contra MongoDB + `bcrypt`, muestra error claro si falla y bloquea vistas internas sin sesión.
- [ ] **Registro de usuarios (10 pts):** Cifra contraseña, valida campos y rechaza correos duplicados con mensaje claro.
- [ ] **3 CRUDs internos completos (10 pts):** `Category`, `Professional` y `ServiceRequest` permiten crear, listar, editar y eliminar usando `ObjectId` + `.populate()`.
- [ ] **Registro de ubicaciones exactas (5 pts):** Clic en el mapa guarda `GeoJSON Point [lng, lat]` con nombre, descripción y categoría y muestra su popup.
- [ ] **Edición de ubicaciones (5 pts):** Se edita dando clic sobre el popup y editando **ahí mismo** en MongoDB.
- [ ] **Eliminación de ubicaciones (5 pts):** Se elimina dando clic sobre el popup y eliminando **ahí mismo** en MongoDB.
- [ ] **Tabla de ubicaciones registradas (10 pts):** Muestra todos los datos excepto el ID, muestra el **nombre de la categoría** (no su `ObjectId`) y se actualiza sin recargar la página al crear, editar o eliminar en el mapa.
- [ ] **Búsqueda y Filtros (10 pts):** Búsqueda parcial por nombre (insensible a mayúsculas), filtro por categoría y filtro por estado resueltos en el **backend** (`?search=&category=&status=`) y reflejados en mapa y tabla.
- [ ] **Trazo de zonas en Mapa (15 pts):** Dibuja polígonos con nombre, los guarda como `GeoJSON Polygon [lng, lat]`, se cargan al abrir la app y permanecen hasta que el usuario los elimine.
- [ ] **Diseño de interfaz (10 pts):** Mínimo 3 vistas con navegación clara y alertas visibles de éxito y error.
- [ ] **Estructura del backend (10 pts):** `routes` solo reciben y llaman al servicio; `services` tienen toda la lógica y Mongoose; `middlewares` validan y manejan errores con `AppError`, 404 y `errorHandler`; códigos HTTP `200, 201, 400, 401, 404, 500`.

### C. Los 4 Entregables Obligatorios en Teams (Subidos por 1 solo integrante)
- [ ] **1. Liga de la aplicación publicada** funcionando y probada en ventana de incógnito.
- [ ] **2. Usuario de prueba (correo y contraseña)** con datos previamente cargados (`seed.js`) para revisar sin tener que registrarse.
- [ ] **3. Liga del repositorio público** con `frontend/`, `backend/`, `README.md` con instrucciones de ejecución local y `.env.example` sin credenciales reales.
- [ ] **4. Reporte del desarrollo en PDF** con:
  - [ ] Portada institucional (Universidad La Salle Bajío).
  - [ ] Problemática y cómo la resuelve la aplicación.
  - [ ] Desarrollo paso a paso (estructura del backend, modelos de MongoDB y sus relaciones).
  - [ ] Resultados (capturas de cada requisito de la rúbrica funcionando).
  - [ ] Conclusiones (**3 conclusiones individuales**, una por cada integrante del equipo).
