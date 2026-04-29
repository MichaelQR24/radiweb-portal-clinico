-- ============================================================
-- RadiWeb – Script de Creación de Base de Datos MySQL
-- DIRIS Lima Centro – Sistema de Gestión de Imágenes DICOM
-- ============================================================

-- Crear base de datos (ejecutar solo si no existe)
-- CREATE DATABASE IF NOT EXISTS radiweb_db;
-- USE radiweb_db;

-- ─── Tabla: Users ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS Users (
  id             INT            AUTO_INCREMENT PRIMARY KEY,
  name           VARCHAR(100)   NOT NULL,
  email          VARCHAR(100)   NOT NULL UNIQUE,
  password_hash  VARCHAR(255)   NOT NULL,
  role           ENUM('tecnologo', 'radiologo', 'admin') NOT NULL,
  is_active      TINYINT(1)     NOT NULL DEFAULT 1,
  created_at     DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_login     DATETIME       NULL,
  INDEX IX_Users_email (email),
  INDEX IX_Users_role (role)
);

-- ─── Tabla: Patients ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS Patients (
  id          INT           AUTO_INCREMENT PRIMARY KEY,
  full_name   VARCHAR(150)  NOT NULL,
  dni         VARCHAR(8)    NOT NULL UNIQUE,
  age         INT           NOT NULL CHECK (age >= 0 AND age <= 150),
  gender      ENUM('M', 'F', 'O') NOT NULL,
  created_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by  INT           NOT NULL,
  FOREIGN KEY (created_by) REFERENCES Users(id),
  INDEX IX_Patients_dni (dni),
  INDEX IX_Patients_full_name (full_name)
);

-- ─── Tabla: Studies ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS Studies (
  id               INT            AUTO_INCREMENT PRIMARY KEY,
  patient_id       INT            NOT NULL,
  study_type       VARCHAR(100)   NOT NULL,
  body_area        VARCHAR(100)   NOT NULL,
  referring_doctor VARCHAR(150)   NOT NULL,
  clinical_notes   LONGTEXT       NULL,
  status           ENUM('pendiente', 'enviado', 'diagnosticado', 'rechazado') NOT NULL DEFAULT 'pendiente',
  created_by       INT            NOT NULL,
  created_at       DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id) REFERENCES Patients(id),
  FOREIGN KEY (created_by) REFERENCES Users(id),
  INDEX IX_Studies_patient_id (patient_id),
  INDEX IX_Studies_status (status),
  INDEX IX_Studies_created_at (created_at)
);

-- ─── Tabla: Images ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS Images (
  id                INT           AUTO_INCREMENT PRIMARY KEY,
  study_id          INT           NOT NULL,
  original_filename VARCHAR(255)  NOT NULL,
  blob_url          VARCHAR(500)  NOT NULL,
  preview_url       VARCHAR(500)  NULL,
  format            ENUM('DICOM', 'PNG', 'JPG') NOT NULL,
  resolution        VARCHAR(50)   NULL,
  file_size_kb      INT           NOT NULL,
  quality_approved  TINYINT(1)    NOT NULL DEFAULT 0,
  uploaded_at       DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  uploaded_by       INT           NOT NULL,
  FOREIGN KEY (study_id) REFERENCES Studies(id) ON DELETE CASCADE,
  FOREIGN KEY (uploaded_by) REFERENCES Users(id),
  INDEX IX_Images_study_id (study_id)
);

-- ─── Tabla: Diagnoses ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS Diagnoses (
  id             INT            AUTO_INCREMENT PRIMARY KEY,
  study_id       INT            NOT NULL UNIQUE,
  report_text    LONGTEXT       NOT NULL,
  conclusion     VARCHAR(500)   NOT NULL,
  radiologist_id INT            NOT NULL,
  created_at     DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (study_id) REFERENCES Studies(id),
  FOREIGN KEY (radiologist_id) REFERENCES Users(id),
  INDEX IX_Diagnoses_study_id (study_id)
);

-- ─── Tabla: AuditLogs ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS AuditLogs (
  id         BIGINT        AUTO_INCREMENT PRIMARY KEY,
  user_id    INT           NOT NULL,
  action     VARCHAR(100)  NOT NULL,
  entity     VARCHAR(50)   NOT NULL,
  entity_id  INT           NULL,
  ip_address VARCHAR(50)   NOT NULL,
  timestamp  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES Users(id),
  INDEX IX_AuditLogs_user_id (user_id),
  INDEX IX_AuditLogs_timestamp (timestamp),
  INDEX IX_AuditLogs_entity (entity)
);

-- ─── Usuario administrador inicial ───────────────────────────
-- Contraseña: Admin@2024 (hashear con bcrypt antes de producción)
-- Hash generado con bcrypt salt rounds = 12
INSERT IGNORE INTO Users (name, email, password_hash, role, is_active, created_at)
VALUES (
  'Administrador RadiWeb',
  'admin@radiweb.pe',
  '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN9KVMHf9QjB2JKxvJxVS',
  'admin',
  1,
  NOW()
);

SELECT 'Base de datos RadiWeb inicializada correctamente.' AS message;
