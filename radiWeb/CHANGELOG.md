# CHANGELOG - RadiWeb Portal Clínico

Todos los cambios notables realizados durante el despliegue del portal clínico RadiWeb en Microsoft Azure.

## [1.0.0] - 2026-06-10

### Añadido
- Archivo `staticwebapp.config.json` para dar soporte a enrutamiento SPA en Azure Static Web Apps.
- Documento `docs/deployment-lessons-learned.md` recopilando las lecciones aprendidas y resolución de fallos en el despliegue.

### Modificado
- `backend/src/config/db.config.ts`: Habilitación dinámica de SSL (`rejectUnauthorized: false`) para la conexión a Azure MySQL Flexible Server.
- `backend/src/server.ts`: Activación de `trust proxy` en Express para evitar caídas en el módulo de rate limit tras pasar por el proxy de Azure.
- `backend/database/init.sql`: Actualización del hash bcrypt de la contraseña por defecto del usuario administrador (`Admin@2024`).
- `frontend/angular.json`: Se incluyó `staticwebapp.config.json` dentro de los assets compilados y distribución de producción.

### Solucionado
- Error de CORS entre Angular y App Service ajustando las variables de entorno de orígenes permitidos.
- Error `ER_SECURE_TRANSPORT_REQUIRED` en base de datos configurando adecuadamente el soporte SSL en mysql2.
- Error `ERR_ERL_UNEXPECTED_X_FORWARDED_FOR` de express-rate-limit configurando `trust proxy` en Express.
- Error 404 en el refresco de rutas (F5) en Azure Static Web Apps.
- Fallo de inserción en la tabla `Notifications` agregando la columna `study_id` y su clave foránea en la base de datos de producción.
