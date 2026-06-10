# Lecciones Aprendidas de Despliegue - RadiWeb

Este documento recopila las incidencias técnicas identificadas y solucionadas durante el despliegue del portal clínico RadiWeb en Microsoft Azure (App Service, Static Web Apps, MySQL Flexible Server y Blob Storage).

---

## 1. Error de CORS entre Angular y App Service
* **Fecha aproximada:** 08/06/2026
* **Síntoma observado:** Las peticiones desde el frontend (Angular SPA) hacia el backend (App Service) fallaban con errores de política CORS en el navegador (`Access-Control-Allow-Origin` ausente).
* **Causa raíz:** La variable de entorno `FRONTEND_URL` configurada en el backend no coincidía exactamente con la URL asignada por Azure Static Web Apps al frontend, o el middleware CORS en Express no estaba configurado correctamente para leer variables de entorno dinámicas.
* **Diagnóstico realizado:** Inspección de la consola del navegador (errores de origen cruzado) y verificación de la configuración de CORS en el archivo `server.ts` del backend.
* **Solución aplicada:** Se configuró el middleware CORS en el backend utilizando `process.env.FRONTEND_URL` como origen dinámico y se añadió la URL de Azure Static Web Apps en los ajustes del App Service.
* **Archivos modificados:** [server.ts](file:///c:/Users/Micha/Desktop/radiweb---portal-cl%C3%ADnico/radiweb---portal-cl%C3%ADnico/radiWeb/backend/src/server.ts)
* **Comandos utilizados:** `az webapp config appsettings set --name radiweb-backend --resource-group radiweb-rg --settings FRONTEND_URL=https://salmon-water-00c17bd0f.7.azurestaticapps.net`
* **Cómo verificar:** Realizar peticiones HTTP desde el frontend desplegado y verificar que el navegador las complete exitosamente (código 200/201).

---

## 2. Error SSL MySQL: ER_SECURE_TRANSPORT_REQUIRED
* **Fecha aproximada:** 08/06/2026
* **Síntoma observado:** El backend fallaba al conectar a la base de datos MySQL Flexible Server en Azure arrojando la excepción `Error: ER_SECURE_TRANSPORT_REQUIRED`.
* **Causa raíz:** Azure MySQL Flexible Server requiere por defecto conexiones cifradas (SSL/TLS), y la configuración del pool de conexiones no especificaba los parámetros SSL requeridos.
* **Diagnóstico realizado:** Revisión de las excepciones en los logs de arranque del contenedor del backend en Azure App Service.
* **Solución aplicada:** Se adaptó `db.config.ts` para habilitar dinámicamente la opción `ssl: { rejectUnauthorized: false }` cuando la variable `DB_HOST` no es `localhost` (entorno de Azure).
* **Archivos modificados:** [db.config.ts](file:///c:/Users/Micha/Desktop/radiweb---portal-cl%C3%ADnico/radiweb---portal-cl%C3%ADnico/radiWeb/backend/src/config/db.config.ts)
* **Comandos utilizados:** `npm run build`
* **Cómo verificar:** Confirmar en los logs del contenedor el mensaje: `"Conexión a MySQL establecida"`.

---

## 3. Error express-rate-limit: ERR_ERL_UNEXPECTED_X_FORWARDED_FOR
* **Fecha aproximada:** 09/06/2026
* **Síntoma observado:** El backend se caía inmediatamente al recibir la primera petición con la excepción `ValidationError: The 'X-Forwarded-For' header is set but the Express 'trust proxy' setting is false`.
* **Causa raíz:** El paquete `express-rate-limit` detectaba cabeceras de proxy (`X-Forwarded-For`) inyectadas por Azure App Service/SWA, pero Express no estaba configurado para confiar en ellas.
* **Diagnóstico realizado:** Inspección de los logs del contenedor Docker de Azure (`default_docker.log`) tras recibir la petición de login.
* **Solución aplicada:** Se añadió `app.set('trust proxy', 1);` en la inicialización de la aplicación Express en `server.ts`.
* **Archivos modificados:** [server.ts](file:///c:/Users/Micha/Desktop/radiweb---portal-cl%C3%ADnico/radiweb---portal-cl%C3%ADnico/radiWeb/backend/src/server.ts)
* **Comandos utilizados:** Re-despliegue usando paquete ZIP slim con `az webapp deploy`.
* **Cómo verificar:** Peticiones HTTP consecutivas funcionan y aplican rate limiting sin crashear el servidor.

---

## 4. Error de Autenticación por Hash Bcrypt Incorrecto
* **Fecha aproximada:** 09/06/2026
* **Síntoma observado:** Al iniciar sesión con `admin@radiweb.pe` y la contraseña `Admin@2024`, el servidor retornaba `"Credenciales inválidas"`.
* **Causa raíz:** El hash insertado en `init.sql` (`$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN9KVMHf9QjB2JKxvJxVS`) no correspondía a `Admin@2024`, fallando la comparación criptográfica de `bcryptjs.compare`.
* **Diagnóstico realizado:** Verificación offline comparando el hash mediante un script de prueba con Bcrypt.
* **Solución aplicada:** Se generó un nuevo hash válido para `Admin@2024` y se actualizó el registro en la base de datos.
* **Archivos modificados:** [init.sql](file:///c:/Users/Micha/Desktop/radiweb---portal-cl%C3%ADnico/radiweb---portal-cl%C3%ADnico/radiWeb/backend/database/init.sql) (y actualización manual directa en la base de datos).
* **Cómo verificar:** El inicio de sesión de administrador funciona correctamente y genera el respectivo JWT.

---

## 5. Error Angular SPA (404 al hacer F5)
* **Fecha aproximada:** 09/06/2026
* **Síntoma observado:** Al recargar la página (F5) en rutas específicas de Angular como `/login` o `/dashboard/admin`, Azure Static Web Apps devolvía un error `404 Not Found`.
* **Causa raíz:** En aplicaciones de una sola página (SPA), el enrutamiento lo gestiona el cliente. El servidor de Azure intentaba buscar un archivo físico en esa ruta y fallaba al no existir.
* **Diagnóstico realizado:** Carga directa de rutas profundas en el navegador.
* **Solución aplicada:** Se creó el archivo `staticwebapp.config.json` con una regla de navegación que redirige todas las rutas no encontradas a `index.html`.
* **Archivos modificados:** [staticwebapp.config.json](file:///c:/Users/Micha/Desktop/radiweb---portal-cl%C3%ADnico/radiweb---portal-cl%C3%ADnico/radiWeb/frontend/src/staticwebapp.config.json) y [angular.json](file:///c:/Users/Micha/Desktop/radiweb---portal-cl%C3%ADnico/radiweb---portal-cl%C3%ADnico/radiWeb/frontend/angular.json) (en la sección `assets` para su distribución).
* **Cómo verificar:** Refrescar la página (F5) en cualquier ruta del frontend carga correctamente la aplicación Angular.

---

## 6. Error de Notificaciones: Unknown column 'study_id'
* **Fecha aproximada:** 10/06/2026
* **Síntoma observado:** Las notificaciones a los roles no se creaban en la base de datos y la tabla `Notifications` permanecía vacía.
* **Causa raíz:** La tabla `Notifications` se creó inicialmente sin la columna `study_id`. Debido al uso de `CREATE TABLE IF NOT EXISTS`, las migraciones posteriores no alteraron la estructura existente de la tabla en Azure MySQL.
* **Diagnóstico realizado:** Análisis de los logs del backend que revelaron la excepción silenciada `ER_BAD_FIELD_ERROR: Unknown column 'study_id' in 'field list'` al ejecutar `notifyRole()` o `createNotification()`.
* **Solución aplicada:** Se ejecutó una sentencia `ALTER TABLE` directa en la base de datos en producción para añadir la columna `study_id` y su clave foránea.
* **Comandos utilizados:**
  ```sql
  ALTER TABLE Notifications 
  ADD COLUMN study_id INT NULL AFTER message,
  ADD CONSTRAINT FK_Notifications_Studies FOREIGN KEY (study_id) REFERENCES Studies(id) ON DELETE CASCADE,
  ADD INDEX IX_Notifications_study_id (study_id);
  ```
* **Cómo verificar:** Al crear un estudio o realizar un diagnóstico, se verifica que la tabla de base de datos inserte correctamente la notificación y se pueda consultar.

---

## 7. Corrección de Usuarios y Roles
* **Fecha aproximada:** 09/06/2026
* **Síntoma observado:** Inconsistencias al asignar roles o consultar información de acceso en la cola de trabajo del tecnólogo y radiólogo.
* **Causa raíz:** Roles con nomenclatura variada en el frontend o inconsistencias en los registros de usuarios iniciales en la base de datos.
* **Solución aplicada:** Homologación de roles de usuario al estándar lowercase: `tecnologo`, `radiologo`, `admin` tanto en base de datos como en los Guards del frontend.
* **Cómo verificar:** Acceso correcto a vistas de dashboard correspondientes según el rol de sesión del usuario.

---

## 8. Validación de Azure Blob Storage
* **Fecha aproximada:** 09/06/2026
* **Síntoma observado:** Necesidad de validar que la subida de imágenes DICOM y previsualizaciones PNG al almacenamiento en la nube estuviera funcionando de manera segura.
* **Diagnóstico realizado:** Prueba de carga de archivos de estudio desde el portal por parte de un Tecnólogo.
* **Solución aplicada:** Inicialización correcta del cliente de Azure Blob Storage con la cadena de conexión del entorno (`AZURE_STORAGE_CONNECTION_STRING`) y generación exitosa de URLs SAS temporales para previsualización.
* **Cómo verificar:** Los archivos subidos se reflejan en el portal de Azure en el contenedor `dicom-images` y son visibles desde el visor del portal.
