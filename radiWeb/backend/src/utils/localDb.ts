import fs from 'fs';
import path from 'path';

const DB_FILE = path.join(__dirname, '../../data/db.json');

interface DbSchema {
  patients: any[];
  studies: any[];
  diagnoses: Record<number, any>;
  images: Record<number, any[]>;
  users: any[];
}

const DEFAULT_DB: DbSchema = {
  patients: [
    { id: 1, full_name: 'Juan Pérez García', dni: '12345678', age: 45, gender: 'M', created_at: new Date(), created_by: 2 },
    { id: 2, full_name: 'María López Sánchez', dni: '87654321', age: 32, gender: 'F', created_at: new Date(), created_by: 2 },
    { id: 3, full_name: 'Carlos Ruiz Mendoza', dni: '11223344', age: 58, gender: 'M', created_at: new Date(), created_by: 2 },
  ],
  studies: [
    { id: 1, patient_id: 1, study_type: 'Resonancia Magnética (MRI)', body_area: 'Cerebro', referring_doctor: 'Dr. García', clinical_notes: 'Cefaleas persistentes', status: 'pendiente', created_by: 2, created_at: new Date(), updated_at: new Date(), patient_name: 'Juan Pérez García', patient_dni: '12345678' },
    { id: 2, patient_id: 2, study_type: 'Tomografía Computarizada (CT)', body_area: 'Tórax', referring_doctor: 'Dra. Morales', clinical_notes: 'Control post-tratamiento', status: 'enviado', created_by: 2, created_at: new Date(Date.now() - 3600000), updated_at: new Date(), patient_name: 'María López Sánchez', patient_dni: '87654321' },
    { id: 3, patient_id: 3, study_type: 'Rayos X', body_area: 'Tórax', referring_doctor: 'Dr. Vargas', clinical_notes: 'Tos persistente', status: 'diagnosticado', created_by: 2, created_at: new Date(Date.now() - 86400000), updated_at: new Date(), patient_name: 'Carlos Ruiz Mendoza', patient_dni: '11223344' },
  ],
  diagnoses: {},
  images: {},
  users: [
    { id: 1, name: 'Tecnólogo Demo', email: 'tecnologo@radiweb.pe', password_hash: '$2b$12$demo', role: 'tecnologo', is_active: true, created_at: new Date(), last_login: null },
    { id: 2, name: 'Radiólogo Demo', email: 'radiologo@radiweb.pe', password_hash: '$2b$12$demo', role: 'radiologo', is_active: true, created_at: new Date(), last_login: null },
    { id: 3, name: 'Admin Demo', email: 'admin@radiweb.pe', password_hash: '$2b$12$demo', role: 'admin', is_active: true, created_at: new Date(), last_login: null },
  ]
};

// Initialize DB file
if (!fs.existsSync(path.dirname(DB_FILE))) {
  fs.mkdirSync(path.dirname(DB_FILE), { recursive: true });
}
if (!fs.existsSync(DB_FILE)) {
  fs.writeFileSync(DB_FILE, JSON.stringify(DEFAULT_DB, null, 2), 'utf-8');
}

function readDb(): DbSchema {
  try {
    const data = fs.readFileSync(DB_FILE, 'utf-8');
    const parsed = JSON.parse(data);
    
    // Revive dates
    if (parsed.patients) parsed.patients.forEach((p: any) => p.created_at = new Date(p.created_at));
    if (parsed.studies) parsed.studies.forEach((s: any) => {
      s.created_at = new Date(s.created_at);
      s.updated_at = new Date(s.updated_at);
    });
    
    return parsed;
  } catch (e) {
    console.error('Error reading local DB, returning default', e);
    return DEFAULT_DB;
  }
}

function writeDb(db: DbSchema): void {
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
}

export const localDb = {
  get patients() { return readDb().patients; },
  set patients(val) { const db = readDb(); db.patients = val; writeDb(db); },
  
  get studies() { return readDb().studies; },
  set studies(val) { const db = readDb(); db.studies = val; writeDb(db); },

  get diagnoses() { return readDb().diagnoses; },
  set diagnoses(val) { const db = readDb(); db.diagnoses = val; writeDb(db); },

  get images() { return readDb().images; },
  set images(val) { const db = readDb(); db.images = val; writeDb(db); },

  get users() { return readDb().users; },
  set users(val) { const db = readDb(); db.users = val; writeDb(db); },
};
