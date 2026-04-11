const initSqlJs = require('sql.js');
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, '..', 'data', 'dsip.db');
const DB_VERSION = 4; // Increment when schema changes — triggers "reset needed" warning in admin
let db = null;
let SQL = null;

async function init() {
  SQL = await initSqlJs();

  // Load existing database or create new
  if (fs.existsSync(DB_PATH)) {
    const buffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }

  // Enable WAL-like behavior (not available in sql.js but we handle persistence manually)
  createTables();
  seed();

  // Store current DB version
  try {
    db.run("INSERT OR REPLACE INTO app_settings (key, value) VALUES ('db_version', ?)", [String(DB_VERSION)]);
  } catch {}

  save();
}

// Reset database — drops everything, recreates schema + seed
function resetDatabase() {
  if (!SQL) throw new Error('SQL.js not initialized');

  // Close current DB
  if (db) {
    try { db.close(); } catch {}
  }

  // Delete DB file
  if (fs.existsSync(DB_PATH)) {
    fs.unlinkSync(DB_PATH);
  }

  // Create fresh DB
  db = new SQL.Database();
  createTables();
  seed();

  // Store version
  try {
    db.run("INSERT OR REPLACE INTO app_settings (key, value) VALUES ('db_version', ?)", [String(DB_VERSION)]);
  } catch {}

  save();
  return { version: DB_VERSION };
}

function getDbVersion() {
  return DB_VERSION;
}

function getStoredDbVersion() {
  try {
    const row = db.prepare("SELECT value FROM app_settings WHERE key = 'db_version'");
    if (row.step()) {
      const val = row.getAsObject().value;
      row.free();
      return parseInt(val) || 0;
    }
    row.free();
  } catch {}
  return 0;
}

function createTables() {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      google_id TEXT UNIQUE NOT NULL,
      email TEXT,
      name TEXT,
      avatar TEXT,
      locale TEXT DEFAULT 'en',
      theme TEXT DEFAULT 'light',
      role TEXT DEFAULT 'user',
      is_approved INTEGER DEFAULT 0,
      subscription_until TEXT,
      ad_free_until TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS contact_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL,
      name TEXT DEFAULT '',
      message TEXT DEFAULT '',
      acknowledged INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS app_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS whitelist (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      added_by TEXT DEFAULT 'system',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Super admin does NOT need to be in whitelist — handled directly in auth.js

  // User API keys table
  db.run(`
    CREATE TABLE IF NOT EXISTS user_api_keys (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL UNIQUE,
      maps_api_key TEXT,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // API usage detailed log (per-request, includes key source)
  db.run(`
    CREATE TABLE IF NOT EXISTS api_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      type TEXT NOT NULL,
      key_source TEXT DEFAULT 'system',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Per-user quota overrides (admin can "reset" to give bonus)
  db.run(`
    CREATE TABLE IF NOT EXISTS user_quota (
      user_id INTEGER PRIMARY KEY,
      daily_limit_override INTEGER,
      daily_limit_date TEXT,
      monthly_limit_override INTEGER,
      monthly_limit_period TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Default settings
  const defaults = {
    admin_email: 'bogdansarac@gmail.com',
    ad_splash_interval_minutes: '5',
    ad_splash_duration_seconds: '10',
    promo_video_url: '',
    promo_video_urls: '[]',
    ad_free_extension_minutes: '30',
    api_daily_limit_per_user: '10',
    api_monthly_limit_per_user: '300',
    monthly_free_quota_maps: '28500',
    monthly_free_quota_geocode: '40000',
    google_ads_client: process.env.GOOGLE_ADS_CLIENT || '',
    google_ads_slot_sidebar: process.env.GOOGLE_ADS_SLOT_SIDEBAR || '',
    google_ads_slot_splash: process.env.GOOGLE_ADS_SLOT_SPLASH || ''
  };
  for (const [k, v] of Object.entries(defaults)) {
    try { db.run("INSERT OR IGNORE INTO app_settings (key, value) VALUES (?, ?)", [k, v]); } catch {}
  }

  db.run(`
    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      description TEXT DEFAULT '',
      avatar_index INTEGER DEFAULT 0,
      icon_type TEXT DEFAULT 'default',
      is_public INTEGER DEFAULT 0,
      center_lat REAL DEFAULT 45.7983,
      center_lng REAL DEFAULT 24.1256,
      default_zoom INTEGER DEFAULT 14,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Migration: add is_public column if missing (for existing DBs upgrading from v3)
  try { db.run('ALTER TABLE projects ADD COLUMN is_public INTEGER DEFAULT 0'); } catch {}

  db.run(`
    CREATE TABLE IF NOT EXISTS project_members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL,
      user_email TEXT NOT NULL,
      user_id INTEGER,
      role TEXT DEFAULT 'viewer',
      invited_by INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(project_id, user_email),
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS markers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      lat REAL NOT NULL,
      lng REAL NOT NULL,
      title TEXT DEFAULT '',
      icon_type TEXT DEFAULT 'default',
      icon_index INTEGER DEFAULT 0,
      observations TEXT DEFAULT '',
      cost REAL DEFAULT 0,
      currency TEXT DEFAULT 'EUR',
      maintenance_date TEXT,
      repair_date TEXT,
      warranty_date TEXT,
      installation_date TEXT,
      responsible TEXT DEFAULT '',
      status TEXT DEFAULT 'active',
      condition TEXT DEFAULT 'good',
      priority TEXT DEFAULT 'normal',
      custom_data TEXT DEFAULT '{}',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS marker_images (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      marker_id INTEGER NOT NULL,
      filename TEXT NOT NULL,
      original_name TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (marker_id) REFERENCES markers(id) ON DELETE CASCADE
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS api_usage (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      date TEXT NOT NULL,
      type TEXT NOT NULL,
      count INTEGER DEFAULT 0,
      UNIQUE(user_id, date, type)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS geocache (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      query TEXT UNIQUE NOT NULL,
      lat REAL NOT NULL,
      lng REAL NOT NULL,
      name TEXT DEFAULT '',
      address TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS marker_types (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      category TEXT DEFAULT 'custom',
      svg_data TEXT,
      image_filename TEXT,
      scope TEXT DEFAULT 'all',
      project_id INTEGER,
      is_active INTEGER DEFAULT 1,
      sort_order INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Create indexes (IF NOT EXISTS not supported for indexes in all versions, so try/catch)
  const indexes = [
    'CREATE INDEX IF NOT EXISTS idx_markers_project ON markers(project_id)',
    'CREATE INDEX IF NOT EXISTS idx_markers_user ON markers(user_id)',
    'CREATE INDEX IF NOT EXISTS idx_markers_coords ON markers(lat, lng)',
    'CREATE INDEX IF NOT EXISTS idx_projects_user ON projects(user_id)',
    'CREATE INDEX IF NOT EXISTS idx_geocache_query ON geocache(query)',
    'CREATE INDEX IF NOT EXISTS idx_api_usage_date ON api_usage(date)',
    'CREATE INDEX IF NOT EXISTS idx_api_log_created ON api_log(created_at)',
    'CREATE INDEX IF NOT EXISTS idx_api_log_user ON api_log(user_id)'
  ];
  indexes.forEach(sql => { try { db.run(sql); } catch {} });
}

function save() {
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(DB_PATH, buffer);
}

// Save immediately after every write for data safety
// (sql.js keeps DB in memory, so we must flush to disk)
function markDirtyAndSave() {
  try { save(); } catch (e) { console.error('DB save error:', e.message); }
}

// Also save on exit
process.on('exit', () => { if (db) try { save(); } catch {} });
process.on('SIGINT', () => { if (db) try { save(); } catch {} process.exit(); });
process.on('SIGTERM', () => { if (db) try { save(); } catch {} process.exit(); });

// --- Query helpers ---
function get(sql, params = []) {
  try {
    const stmt = db.prepare(sql);
    stmt.bind(Array.isArray(params) ? params : [params]);
    if (stmt.step()) {
      const row = stmt.getAsObject();
      stmt.free();
      return row;
    }
    stmt.free();
    return null;
  } catch (e) {
    console.error('DB get error:', e.message, sql);
    return null;
  }
}

function all(sql, params = []) {
  try {
    const stmt = db.prepare(sql);
    stmt.bind(Array.isArray(params) ? params : [params]);
    const results = [];
    while (stmt.step()) {
      results.push(stmt.getAsObject());
    }
    stmt.free();
    return results;
  } catch (e) {
    console.error('DB all error:', e.message, sql);
    return [];
  }
}

function run(sql, params = []) {
  try {
    db.run(sql, Array.isArray(params) ? params : [params]);
    markDirtyAndSave();
    // Get last insert rowid
    const result = db.exec('SELECT last_insert_rowid() as id');
    const lastId = result.length > 0 ? result[0].values[0][0] : 0;
    return { lastInsertRowid: lastId, changes: db.getRowsModified() };
  } catch (e) {
    console.error('DB run error:', e.message, sql);
    return { lastInsertRowid: 0, changes: 0 };
  }
}

// ============ SEED DATA ============
function seed() {
  // Check if already seeded
  const existing = get('SELECT id FROM users WHERE email = ?', ['bogdansarac@gmail.com']);
  if (existing) return; // Already seeded

  console.log('  Seeding database...');

  // 1. Create super admin user
  run(`INSERT INTO users (google_id, email, name, avatar, role, is_approved, subscription_until, ad_free_until)
       VALUES ('seed_admin', 'bogdansarac@gmail.com', 'Bogdan Sarac', '', 'admin', 1, '2099-12-31', '2099-12-31')`);
  const adminUser = get('SELECT id FROM users WHERE email = ?', ['bogdansarac@gmail.com']);
  const uid = adminUser.id;

  // Sibiu center
  const SIBIU_LAT = 45.7983;
  const SIBIU_LNG = 24.1256;

  // 2. Create "Pompieri Sibiu" project (PUBLIC by default for demo)
  run('INSERT INTO projects (user_id, name, description, avatar_index, icon_type, is_public, center_lat, center_lng, default_zoom) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [uid, 'Pompieri Sibiu', 'Hidranți și echipamente PSI în municipiul Sibiu', 5, 'hydrant', 1, SIBIU_LAT, SIBIU_LNG, 14]);
  const fireProject = get("SELECT id FROM projects WHERE name = 'Pompieri Sibiu'");
  const fpId = fireProject.id;

  // 3. Create "Semne Rutiere Sibiu" project (private)
  run('INSERT INTO projects (user_id, name, description, avatar_index, icon_type, is_public, center_lat, center_lng, default_zoom) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [uid, 'Semne Rutiere Sibiu', 'Semne de circulație în municipiul Sibiu', 4, 'road_sign', 0, SIBIU_LAT, SIBIU_LNG, 14]);
  const signProject = get("SELECT id FROM projects WHERE name = 'Semne Rutiere Sibiu'");
  const spId = signProject.id;

  // Add creator as project admin
  run('INSERT INTO project_members (project_id, user_email, user_id, role, invited_by) VALUES (?, ?, ?, ?, ?)',
    [fpId, 'bogdansarac@gmail.com', uid, 'admin', uid]);
  run('INSERT INTO project_members (project_id, user_email, user_id, role, invited_by) VALUES (?, ?, ?, ?, ?)',
    [spId, 'bogdansarac@gmail.com', uid, 'admin', uid]);

  // 3b. Create second user: vivianasarac@gmail.com (admin on Pompieri, viewer on Semne)
  run(`INSERT INTO users (google_id, email, name, avatar, role, is_approved, subscription_until, ad_free_until)
       VALUES ('seed_viviana', 'vivianasarac@gmail.com', 'Viviana Sarac', '', 'user', 1, '2099-12-31', '2099-12-31')`);
  const viviana = get('SELECT id FROM users WHERE email = ?', ['vivianasarac@gmail.com']);
  if (viviana) {
    run('INSERT INTO project_members (project_id, user_email, user_id, role, invited_by) VALUES (?, ?, ?, ?, ?)',
      [fpId, 'vivianasarac@gmail.com', viviana.id, 'admin', uid]);
    run('INSERT INTO project_members (project_id, user_email, user_id, role, invited_by) VALUES (?, ?, ?, ?, ?)',
      [spId, 'vivianasarac@gmail.com', viviana.id, 'viewer', uid]);
  }

  // ---- Sibiu area coordinates ----
  // Center: 45.7983, 24.1256
  // We spread markers across the city in a ~3km radius
  const sibiuCenter = { lat: 45.7983, lng: 24.1256 };

  function rndCoord(center, radiusKm) {
    const r = radiusKm / 111.32; // rough degrees
    return {
      lat: center.lat + (Math.random() - 0.5) * 2 * r,
      lng: center.lng + (Math.random() - 0.5) * 2 * r * 1.4
    };
  }

  // Sibiu streets for realistic titles
  const sibiuStreets = [
    'Strada Nicolae Bălcescu', 'Bulevardul Victoriei', 'Strada 9 Mai', 'Calea Dumbrăvii',
    'Strada Avrig', 'Strada Gladiolelor', 'Piața Mare', 'Piața Mică', 'Strada Cetății',
    'Strada Turnului', 'Strada Ocnei', 'Strada Filarmonicii', 'Bulevardul Corneliu Coposu',
    'Strada Someșului', 'Strada Moldoveanu', 'Strada Vasile Milea', 'Calea Cisnădiei',
    'Strada Eschile', 'Strada Henri Coandă', 'Bulevardul Mihai Viteazul',
    'Strada Râului', 'Strada Plugarilor', 'Strada Lugojului', 'Strada Alba Iulia',
    'Strada Constitutiei', 'Strada Bastionului', 'Strada Papiu Ilarian', 'Strada Xenopol',
    'Calea Șurii Mari', 'Strada Tilișca', 'Strada Otelarilor', 'Strada Uzinei',
    'Strada Autogarii', 'Aleea Filozofilor', 'Strada Semaforului', 'Strada Podului'
  ];
  const statuses = ['active', 'active', 'active', 'active', 'maintenance', 'inactive'];
  const conditions = ['good', 'good', 'good', 'fair', 'poor', 'critical'];
  const priorities = ['normal', 'normal', 'normal', 'high', 'low', 'urgent'];
  const responsibles = ['Ion Popescu', 'Maria Ionescu', 'Andrei Popa', 'Elena Dragomir', 'Vasile Radu', 'Ana Moldovan'];

  // 4. Seed 100 hydrant markers
  const hydrantTypes = 24; // total hydrant icon count
  for (let i = 0; i < 100; i++) {
    const c = rndCoord(sibiuCenter, 2.5);
    const street = sibiuStreets[i % sibiuStreets.length];
    const nr = Math.floor(Math.random() * 200) + 1;
    const iconIdx = i % hydrantTypes;
    const status = statuses[i % statuses.length];
    const condition = conditions[i % conditions.length];
    const cost = Math.floor(Math.random() * 5000) + 500;
    const year = 2018 + Math.floor(Math.random() * 8);
    const month = String(Math.floor(Math.random() * 12) + 1).padStart(2, '0');

    run(`INSERT INTO markers (project_id, user_id, lat, lng, title, icon_type, icon_index,
         observations, cost, currency, maintenance_date, installation_date,
         responsible, status, condition, priority)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [fpId, uid, c.lat, c.lng,
       `${street} nr. ${nr}`,
       'hydrant', iconIdx,
       `Hidrant ${['suprateran', 'subteran', 'perete', 'uscat', 'pilon'][iconIdx % 5]} - ${street}`,
       cost, 'RON',
       `${year}-${month}-15`,
       `${year - Math.floor(Math.random() * 5)}-${month}-01`,
       responsibles[i % responsibles.length],
       status, condition,
       priorities[i % priorities.length]]);
  }

  // 5. Seed 300 road sign markers
  const signTypes = 55; // total road sign icon count
  const signNames = [
    'Curbă la dreapta', 'Curbă la stânga', 'Curbă dublă', 'Pantă descendentă', 'Pantă ascendentă',
    'Drum alunecos', 'Drum îngust', 'Lucrări', 'Semafor', 'Trecere pietoni',
    'Copii', 'Animale', 'Cădere pietre', 'Intersecție', 'Sens giratoriu',
    'Accesul interzis', 'Limită 30', 'Limită 50', 'Limită 70', 'Limită 100',
    'Limită 120', 'Depășire interzisă', 'Parcare interzisă', 'Oprire interzisă',
    'Întoarcere interzisă', 'Virare stânga interzisă', 'Virare dreapta interzisă',
    'Claxon interzis', 'Pietoni interzis', 'Biciclete interzise', 'Camioane interzise',
    'Sfârșit limită', 'Virare dreapta', 'Virare stânga', 'Înainte',
    'Înainte sau dreapta', 'Sens giratoriu obligatoriu', 'Pistă biciclete',
    'Pistă pietoni', 'Viteză minimă 30', 'Parcare', 'Spital', 'Benzinărie',
    'Informare', 'Sens unic', 'Fundătură', 'Autostradă start', 'Autostradă sfârșit',
    'Drum cu prioritate', 'Cedează', 'Stop', 'Sfârșit prioritate', 'Cedare oncoming',
    'Trecere pietoni info', 'Acces interzis'
  ];

  for (let i = 0; i < 300; i++) {
    const c = rndCoord(sibiuCenter, 3);
    const street = sibiuStreets[i % sibiuStreets.length];
    const nr = Math.floor(Math.random() * 300) + 1;
    const iconIdx = i % signTypes;
    const signName = signNames[iconIdx] || `Semn ${iconIdx}`;
    const status = statuses[i % statuses.length];
    const condition = conditions[i % conditions.length];
    const year = 2015 + Math.floor(Math.random() * 11);
    const month = String(Math.floor(Math.random() * 12) + 1).padStart(2, '0');
    const warrantyYears = 3 + Math.floor(Math.random() * 7);

    run(`INSERT INTO markers (project_id, user_id, lat, lng, title, icon_type, icon_index,
         observations, cost, currency, installation_date, warranty_date, repair_date,
         responsible, status, condition, priority)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [spId, uid, c.lat, c.lng,
       `${signName} - ${street} nr. ${nr}`,
       'road_sign', iconIdx,
       `${signName} amplasat pe ${street}. Stâlp metalic, reflectorizant.`,
       Math.floor(Math.random() * 2000) + 200, 'RON',
       `${year}-${month}-01`,
       `${year + warrantyYears}-${month}-01`,
       condition === 'poor' || condition === 'critical' ? `${year + warrantyYears - 1}-06-15` : null,
       responsibles[i % responsibles.length],
       status, condition,
       priorities[i % priorities.length]]);
  }

  markDirtyAndSave();
  console.log('  ✓ Seeded: 1 admin + 100 hydrants + 300 road signs in Sibiu');
}

module.exports = { init, get, all, run, save, resetDatabase, getDbVersion, getStoredDbVersion };
