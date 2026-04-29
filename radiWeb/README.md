# RadiWeb – Portal Clínico de Imagenología

Sistema web para el registro y envío de imágenes radiológicas en centros de salud de DIRIS Lima Centro.

---

## 📋 Prerrequisitos

| Herramienta | Versión mínima |
|---|---|
| Node.js | 20 LTS |
| npm | 9+ |
| Angular CLI | 17+ |
| SQL Server | 2019+ / Azure SQL |
| Cuenta Azure | Para Blob Storage en producción |

---

## 🚀 Instalación

### 1. Clonar el repositorio
```bash
git clone <repo-url>
cd radiWeb
```

### 2. Backend (Node.js + Express)
```bash
cd backend
npm install
cp .env.example .env
# Editar .env con sus credenciales reales
```

### 3. Frontend (Angular)
```bash
cd ../frontend
npm install
```

---

## 🖥️ Ejecutar en Desarrollo

### Backend (puerto 3000)
```bash
cd backend
npm run dev
```

### Frontend (puerto 4200)
```bash
cd frontend
ng serve
# O: npm start
```

Abrir en el navegador: **http://localhost:4200**

### Usuarios de prueba (modo demo sin BD)
| Email | Contraseña | Rol |
|---|---|---|
| tecnologo@radiweb.pe | demo123 | Tecnólogo Médico |
| radiologo@radiweb.pe | demo123 | Médico Radiólogo |
| admin@radiweb.pe | demo123 | Administrador |

---

## 🗄️ Base de Datos

### Crear la base de datos
```sql
-- En SQL Server Management Studio o Azure Data Studio:
CREATE DATABASE radiWeb_db;
USE radiWeb_db;
-- Ejecutar el script completo:
```
```bash
sqlcmd -S your_server -d radiWeb_db -i database/init.sql
```

### Variables de entorno requeridas (.env)
```env
DB_SERVER=your_server.database.windows.net
DB_NAME=radiWeb_db
DB_USER=your_user
DB_PASSWORD=your_password
DB_ENCRYPT=true
```

---

## ☁️ Producción en Azure

### 1. Azure SQL Database
- Crear instancia en Azure Portal
- Ejecutar `database/init.sql`
- Configurar firewall para el servidor de la app

### 2. Azure Blob Storage
- Crear Storage Account
- Crear containers: `dicom-images` y `preview-images`
- Copiar connection string al `.env`

### 3. Azure App Service (Backend)
```bash
cd backend
npm run build
# Desplegar dist/ a Azure App Service
az webapp up --name radiweb-api --runtime "NODE:20-lts"
```

### 4. Azure Static Web Apps o App Service (Frontend)
```bash
cd frontend
ng build --configuration production
# dist/frontend/browser/ se despliega como sitio estático
```

### Variables de producción adicionales
```env
NODE_ENV=production
FRONTEND_URL=https://your-frontend.azurestaticapps.net
JWT_SECRET=<mínimo 256 bits, generado con: node -e "require('crypto').randomBytes(32).toString('hex')">
```

---

## 📡 API – Resumen de Endpoints

### Autenticación
| Método | Ruta | Descripción | Roles |
|---|---|---|---|
| POST | `/api/auth/login` | Login, retorna JWT | Todos |
| POST | `/api/auth/logout` | Cierra sesión | Autenticado |
| GET | `/api/auth/me` | Perfil del usuario | Autenticado |
| POST | `/api/auth/refresh` | Renovar token | Todos |

### Pacientes
| Método | Ruta | Descripción | Roles |
|---|---|---|---|
| GET | `/api/patients` | Listar pacientes | Todos |
| GET | `/api/patients/:id` | Detalle paciente | Todos |
| POST | `/api/patients` | Crear paciente | tecnologo, admin |
| PUT | `/api/patients/:id` | Actualizar paciente | tecnologo, admin |

### Estudios
| Método | Ruta | Descripción | Roles |
|---|---|---|---|
| GET | `/api/studies` | Listar estudios | Todos |
| GET | `/api/studies/stats/today` | Estadísticas del día | Todos |
| GET | `/api/studies/:id` | Detalle estudio | Todos |
| POST | `/api/studies` | Crear estudio | tecnologo |
| PATCH | `/api/studies/:id/status` | Cambiar estado | Todos |

### Imágenes DICOM
| Método | Ruta | Descripción | Roles |
|---|---|---|---|
| POST | `/api/images/upload` | Subir imagen(es) | tecnologo |
| GET | `/api/images/:studyId` | Imágenes del estudio | Todos |
| DELETE | `/api/images/:id` | Eliminar imagen | admin |

### Diagnósticos
| Método | Ruta | Descripción | Roles |
|---|---|---|---|
| POST | `/api/diagnoses` | Crear diagnóstico | radiologo |
| GET | `/api/diagnoses/:studyId` | Diagnóstico del estudio | Todos |
| PUT | `/api/diagnoses/:id` | Actualizar diagnóstico | radiologo |

### Usuarios (Admin)
| Método | Ruta | Descripción | Roles |
|---|---|---|---|
| GET | `/api/users` | Listar usuarios | admin |
| POST | `/api/users` | Crear usuario | admin |
| PUT | `/api/users/:id` | Actualizar usuario | admin |
| PATCH | `/api/users/:id/toggle` | Activar/desactivar | admin |

### Auditoría (Admin)
| Método | Ruta | Descripción | Roles |
|---|---|---|---|
| GET | `/api/audit` | Log de auditoría | admin |

---

## 🏗️ Estructura del Proyecto

```
radiWeb/
├── frontend/              # Angular 17 (standalone, lazy loading)
│   └── src/app/
│       ├── core/          # Guards, interceptors, services, models
│       ├── shared/        # Sidebar, navbar, badges, pipes
│       └── features/      # auth, dashboard, studies, viewer, admin
│
├── backend/               # Node.js + Express + TypeScript
│   └── src/
│       ├── config/        # DB, Azure, JWT config
│       ├── controllers/   # Lógica de negocio
│       ├── middlewares/   # Auth, roles, upload, error
│       ├── models/        # TypeScript interfaces
│       ├── routes/        # Definición de rutas
│       ├── services/      # Azure Blob, DICOM, Audit
│       ├── utils/         # Logger, helpers, constants
│       └── validations/   # Esquemas express-validator
│
└── backend/database/
    └── init.sql           # Script DDL SQL Server
```

---

## 🔒 Seguridad

- JWT con expiración de 8 horas
- Refresh token en cookie HttpOnly
- Bcrypt (12 rondas) para contraseñas
- Helmet.js para headers de seguridad
- CORS restringido al origen Angular
- Rate limiting: 5 intentos/15min en login
- Consultas parametrizadas (sin SQL injection)
- URLs DICOM con SAS tokens de tiempo limitado
- Auditoría completa de todas las acciones

---

## 📄 Licencia

DIRIS Lima Centro – Sistema interno de uso exclusivo.
