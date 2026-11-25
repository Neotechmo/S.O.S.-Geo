# Pruebas de integración de S.O.S. Geo

## Ejecución local

Con MongoDB local escuchando en `127.0.0.1:27017`, ejecuta desde `backend`:

```bash
npm run test:integration
```

El runner inicia Express en un puerto libre, usa una base local temporal y elimina esa base al terminar. Si MongoDB escucha en otro puerto local, pasa `QA_MONGO_PORT`. La prueba de `500` simula una falla en la consulta de ubicaciones dentro del proceso de pruebas y comprueba que la API devuelve un mensaje genérico.

Para ejecutar la colección manualmente con REST Client, registra el usuario de prueba desde `auth.http` y ejecuta las solicitudes de cada archivo en orden. Usa una base de pruebas. Los archivos de CRUD preparan sus propias referencias y eliminan sus registros temporales al final. Los usuarios creados desde `auth.http` permanecen en esa base.

## Resultado de esta ejecución

| Verificación | Resultado |
| --- | --- |
| Matriz local de backend (escenarios 1 a 11) | 11 de 11 pasaron con Express y MongoDB local. Se verificaron los estados `200`, `201`, `400`, `401`, `404` y `500`. |
| Colección REST Client | 85 peticiones de los 7 archivos `.http` verificadas. |
| Interfaz local con DOM simulado, Express y MongoDB real | Verificados la redirección sin sesión, el registro, el CRUD de puntos desde el popup, la actualización de la tabla y la persistencia de zonas al reabrir la aplicación. |
| MongoDB local | Se leyeron directamente los documentos `Point` y `Polygon` y sus índices `2dsphere`. Las coordenadas de los documentos de prueba coincidieron con `[longitud, latitud]`. |
| MongoDB Atlas | Pendiente. El resolvedor devolvió `ECONNREFUSED` en la consulta DNS SRV. |
| Despliegue público (escenario 12) | Pendiente. Faltan las URLs públicas del frontend y de la API. |

## Atlas y despliegue

Desde `backend`, ejecuta `npm run qa:atlas` con `MONGODB_URI` configurada en el entorno o en `.env`. La comprobación es de solo lectura. Revisa los índices visibles `2dsphere` de `locations.location` y `zones.area`, los rangos de las posiciones y el cierre de los anillos. Para corroborar visualmente el orden, compara un punto y un vértice de coordenadas conocidas con los valores guardados en Atlas.

Para la comprobación de disponibilidad pública, configura `QA_PUBLIC_FRONTEND_URL` con el origen HTTPS de la interfaz y `QA_PUBLIC_API_URL` con la base HTTPS de la API terminada en `/api`. El runner comprobará que `/map` sirve Angular y que la API responde al health check. La validación funcional del despliegue requiere abrir la aplicación pública, iniciar sesión con una cuenta de prueba y recorrer los flujos de la [matriz de rúbrica](../../docs/RUBRIC_CHECKLIST.md).
