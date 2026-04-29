# 🏥 RadiWeb - Portal Clínico y Sistema RIS/PACS

RadiWeb es un sistema integral de información radiológica (RIS) y visor de imágenes médicas (PACS) basado en web. Permite la gestión eficiente de pacientes, estudios radiológicos (Rayos X, Tomografías, Ecografías, etc.) y la visualización remota de imágenes DICOM, facilitando el flujo de trabajo entre Tecnólogos Médicos y Médicos Radiólogos.

![RadiWeb Dashboard](radiWeb/frontend/src/assets/logo.png)

## ✨ Características Principales

- **🛡️ Acceso Basado en Roles:** Seguridad integrada con JWT para tres perfiles de usuario: `Administrador`, `Radiólogo` y `Tecnólogo`.
- **📊 Dashboards Personalizados:** Vistas de estadísticas y actividades recientes adaptadas a las necesidades operativas de cada rol.
- **🖼️ Visor Integrado de Imágenes Médicas:** Herramienta web para visualizar y manipular imágenes (Zoom, Pan, Rotación) con simulador de imágenes de prueba incluido.
- **📝 Informes Diagnósticos:** Interfaz dedicada para que los radiólogos escriban, editen y aprueben diagnósticos médicos.
- **🗄️ Gestión de Pacientes y Estudios:** CRUD completo de pacientes y programación/seguimiento del estado de los estudios radiológicos (`Pendiente`, `Enviado`, `Diagnosticado`, `Rechazado`).
- **🔍 Registro de Auditoría:** Trazabilidad completa de las acciones realizadas en el sistema (ideal para cumplimiento HIPAA y estándares médicos).

## 🛠️ Stack Tecnológico

**Frontend:**
- [Angular 19](https://angular.dev/) (Framework principal)
- SCSS / Vanilla CSS (Sistema de diseño modular y responsivo)
- Google Material Icons

**Backend:**
- [Node.js](https://nodejs.org/) & [Express](https://expressjs.com/)
- TypeScript
- Autenticación con JSON Web Tokens (JWT)
- Configurado para escalabilidad (Servicios separados para lógica, base de datos y Storage)

**Base de Datos:**
- [MySQL](https://www.mysql.com/)

---

## 🚀 Guía de Instalación y Ejecución Local

Para ejecutar RadiWeb en tu máquina local, sigue estos pasos:

### 1. Requisitos Previos
- **Node.js** (v18 o superior)
- **MySQL Server** instalado y corriendo en el puerto `3306`.
- **Git**

### 2. Clonar el Repositorio
```bash
git clone https://github.com/TuUsuario/radiweb-portal-clinico.git
cd radiweb-portal-clinico
```

### 3. Configuración de la Base de Datos (MySQL)
RadiWeb requiere una base de datos MySQL.
1. Abre tu gestor de base de datos favorito (DBeaver, MySQL Workbench, XAMPP, etc.).
2. Crea una base de datos llamada `radiweb_db`:
   ```sql
   CREATE DATABASE radiweb_db;
   ```
3. *(Opcional)* Si cuentas con el script `sample_data.sql` o `init.sql`, ejecútalo sobre esta base de datos para crear todas las tablas (Users, Patients, Studies, Images, Diagnoses, AuditLogs) y llenarlas con datos y cuentas de prueba.

### 4. Configurar y Ejecutar el Backend
1. Navega a la carpeta del backend:
   ```bash
   cd radiWeb/backend
   ```
2. Instala las dependencias:
   ```bash
   npm install
   ```
3. Configura las variables de entorno. Renombra el archivo `.env.example` a `.env` (si existe) o crea un `.env` con lo siguiente:
   ```env
   PORT=3000
   NODE_ENV=development
   JWT_SECRET=dev_secret_radiweb_local_32chars_minimum_please_change
   JWT_EXPIRES_IN=8h
   DB_HOST=localhost
   DB_PORT=3306
   DB_NAME=radiweb_db
   DB_USER=root
   DB_PASSWORD=tu_contraseña_de_mysql
   FRONTEND_URL=http://localhost:4200
   ```
   *Nota: Asegúrate de poner tu contraseña real de MySQL en `DB_PASSWORD`.*
4. Inicia el servidor de desarrollo:
   ```bash
   npm run dev
   ```
   El backend estará corriendo en `http://localhost:3000`.

### 5. Configurar y Ejecutar el Frontend
Abre una **nueva terminal**, manteniéndote en la raíz del proyecto.
1. Navega a la carpeta del frontend:
   ```bash
   cd radiWeb/frontend
   ```
2. Instala las dependencias de Angular:
   ```bash
   npm install
   ```
3. Inicia la aplicación de Angular:
   ```bash
   npm start
   ```
   *El frontend estará corriendo en `http://localhost:4200`.*

---

## 🧪 Datos de Prueba y Cuentas por Defecto

Si inicializaste la base de datos con los datos de prueba, puedes acceder al sistema con las siguientes cuentas y probar los distintos roles. 

**Contraseña para todos:** `Admin@2024`

| Rol | Correo Electrónico | Descripción |
| :--- | :--- | :--- |
| **Administrador** | `admin@radiweb.pe` | Acceso total: Auditoría, Usuarios y Dashboards. |
| **Radiólogo** | `doctor@radiweb.pe` | Acceso a estudios pendientes de diagnóstico y visor de imágenes médicas. |
| **Tecnólogo Médico** | `tecnico@radiweb.pe` | Acceso a registro de nuevos estudios, subida de fotos de pacientes e historial. |

> **Tip para el Visor Médico:** Como el modo local no está conectado a la nube (Azure Blob Storage), el sistema ha sido configurado en "Modo Mock". Cualquier foto que subas desde la cuenta del Tecnólogo se guardará en la carpeta local `mock-storage/` y será visible al abrir el visor de estudios.

## 📄 Licencia
Este proyecto es privado y todos los derechos están reservados. Creado como parte de un portafolio profesional de desarrollo de software.
