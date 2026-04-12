const express = require('express');
const router = express.Router();
const db = require('../db');

function requireAuth(req, res, next) {
  if (!req.isAuthenticated()) return res.status(401).json({ error: 'Not authenticated' });
  next();
}

// Check if user has access to project (owner or member)
function getProjectForUser(projectId, user) {
  const project = db.get('SELECT * FROM projects WHERE id = ?', [projectId]);
  if (!project) return null;
  if (project.user_id === user.id) return { ...project, my_role: 'admin' };
  const member = db.get(
    'SELECT role FROM project_members WHERE project_id = ? AND (user_id = ? OR user_email = ?)',
    [projectId, user.id, user.email]
  );
  if (member) return { ...project, my_role: member.role };
  return null;
}

router.use(requireAuth);

// Get all markers for a project
router.get('/project/:projectId', (req, res) => {
  const project = getProjectForUser(req.params.projectId, req.user);
  if (!project) return res.status(404).json({ error: 'Project not found' });
  const markers = db.all('SELECT * FROM markers WHERE project_id = ? ORDER BY created_at DESC', [project.id]);
  // Attach images
  const enriched = markers.map(m => {
    const images = db.all('SELECT * FROM marker_images WHERE marker_id = ?', [m.id]);
    let custom_data = {};
    try { custom_data = JSON.parse(m.custom_data || '{}'); } catch(e) {}
    return { ...m, custom_data, images };
  });
  res.json(enriched);
});

// Helper: get marker if user has access to its project
function getMarkerForUser(markerId, user, requireAdmin = false) {
  const marker = db.get('SELECT * FROM markers WHERE id = ?', [markerId]);
  if (!marker) return null;
  const access = getProjectForUser(marker.project_id, user);
  if (!access) return null;
  if (requireAdmin && access.my_role !== 'admin') return null;
  return marker;
}

// Get single marker (any member)
router.get('/:id', (req, res) => {
  const marker = getMarkerForUser(req.params.id, req.user);
  if (!marker) return res.status(404).json({ error: 'Marker not found' });
  const images = db.all('SELECT * FROM marker_images WHERE marker_id = ?', [marker.id]);
  let custom_data = {};
  try { custom_data = JSON.parse(marker.custom_data || '{}'); } catch(e) {}
  res.json({ ...marker, custom_data, images });
});

// Create marker (admin only)
router.post('/', (req, res) => {
  const { project_id, lat, lng, title, icon_type, icon_index, observations,
          cost, currency, maintenance_date, repair_date, warranty_date,
          installation_date, responsible, status, condition, priority, custom_data } = req.body;

  const project = getProjectForUser(project_id, req.user);
  if (!project) return res.status(404).json({ error: 'Project not found' });
  if (project.my_role !== 'admin') return res.status(403).json({ error: 'Admin only' });
  if (lat == null || lng == null) return res.status(400).json({ error: 'Coordinates required' });

  const result = db.run(
    `INSERT INTO markers (project_id, user_id, lat, lng, title, icon_type, icon_index,
     observations, cost, currency, maintenance_date, repair_date, warranty_date,
     installation_date, responsible, status, condition, priority, custom_data)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [project_id, req.user.id, lat, lng, title || '', icon_type || 'default', icon_index || 0,
     observations || '', cost || 0, currency || 'EUR', maintenance_date || null,
     repair_date || null, warranty_date || null, installation_date || null,
     responsible || '', status || 'active', condition || 'good', priority || 'normal',
     JSON.stringify(custom_data || {})]
  );
  const marker = db.get('SELECT * FROM markers WHERE id = ?', [result.lastInsertRowid]);
  res.status(201).json(marker);
});

// Update marker (admin only)
router.put('/:id', (req, res) => {
  const marker = getMarkerForUser(req.params.id, req.user, true);
  if (!marker) return res.status(403).json({ error: 'Not found or no permission' });

  const { lat, lng, title, icon_type, icon_index, observations,
          cost, currency, maintenance_date, repair_date, warranty_date,
          installation_date, responsible, status, condition, priority, custom_data } = req.body;

  db.run(
    `UPDATE markers SET lat = ?, lng = ?, title = ?, icon_type = ?, icon_index = ?,
     observations = ?, cost = ?, currency = ?, maintenance_date = ?, repair_date = ?,
     warranty_date = ?, installation_date = ?, responsible = ?, status = ?,
     condition = ?, priority = ?, custom_data = ?, updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [lat ?? marker.lat, lng ?? marker.lng, title ?? marker.title,
     icon_type ?? marker.icon_type, icon_index ?? marker.icon_index,
     observations ?? marker.observations, cost ?? marker.cost, currency ?? marker.currency,
     maintenance_date ?? marker.maintenance_date, repair_date ?? marker.repair_date,
     warranty_date ?? marker.warranty_date, installation_date ?? marker.installation_date,
     responsible ?? marker.responsible, status ?? marker.status,
     condition ?? marker.condition, priority ?? marker.priority,
     custom_data ? JSON.stringify(custom_data) : marker.custom_data,
     marker.id]
  );

  const updated = db.get('SELECT * FROM markers WHERE id = ?', [marker.id]);
  let cd = {};
  try { cd = JSON.parse(updated.custom_data || '{}'); } catch(e) {}
  res.json({ ...updated, custom_data: cd });
});

// Delete marker (admin only)
router.delete('/:id', (req, res) => {
  const marker = getMarkerForUser(req.params.id, req.user, true);
  if (!marker) return res.status(403).json({ error: 'Not found or no permission' });
  db.run('DELETE FROM markers WHERE id = ?', [marker.id]);
  res.json({ ok: true });
});

// Bulk get markers within bounds (any member)
router.post('/bounds', (req, res) => {
  const { project_id, north, south, east, west } = req.body;
  const project = getProjectForUser(project_id, req.user);
  if (!project) return res.status(404).json({ error: 'Project not found' });
  const markers = db.all(
    `SELECT * FROM markers WHERE project_id = ? AND lat BETWEEN ? AND ? AND lng BETWEEN ? AND ?`,
    [project_id, south, north, west, east]
  );
  res.json(markers);
});

module.exports = router;
