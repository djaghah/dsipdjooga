const express = require('express');
const router = express.Router();
const db = require('../db');

function requireAuth(req, res, next) {
  if (!req.isAuthenticated()) return res.status(401).json({ error: 'Not authenticated' });
  next();
}

router.use(requireAuth);

// Get all marker types for user (system defaults come from frontend Icons.js)
// This returns only custom user-created types
router.get('/', (req, res) => {
  const { project_id } = req.query;
  let types;
  if (project_id) {
    // Get types scoped to all projects + this specific project
    types = db.all(
      `SELECT * FROM marker_types WHERE user_id = ? AND (scope = 'all' OR project_id = ?) AND is_active = 1 ORDER BY sort_order, name`,
      [req.user.id, project_id]
    );
  } else {
    types = db.all(
      'SELECT * FROM marker_types WHERE user_id = ? ORDER BY sort_order, name',
      [req.user.id]
    );
  }
  res.json(types);
});

// Get all types including inactive (for manage modal)
router.get('/all', (req, res) => {
  const types = db.all(
    'SELECT * FROM marker_types WHERE user_id = ? ORDER BY sort_order, name',
    [req.user.id]
  );
  res.json(types);
});

// Create custom marker type
router.post('/', (req, res) => {
  const { name, category, svg_data, scope, project_id } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: 'Name is required' });

  const result = db.run(
    `INSERT INTO marker_types (user_id, name, category, svg_data, scope, project_id)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [req.user.id, name.trim(), category || 'custom', svg_data || null,
     scope || 'all', project_id || null]
  );
  const type = db.get('SELECT * FROM marker_types WHERE id = ?', [result.lastInsertRowid]);
  res.status(201).json(type);
});

// Update marker type
router.put('/:id', (req, res) => {
  const type = db.get('SELECT * FROM marker_types WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
  if (!type) return res.status(404).json({ error: 'Not found' });

  const { name, category, svg_data, scope, project_id, is_active, sort_order } = req.body;
  db.run(
    `UPDATE marker_types SET name = ?, category = ?, svg_data = ?, scope = ?,
     project_id = ?, is_active = ?, sort_order = ? WHERE id = ?`,
    [name ?? type.name, category ?? type.category, svg_data ?? type.svg_data,
     scope ?? type.scope, project_id ?? type.project_id,
     is_active ?? type.is_active, sort_order ?? type.sort_order, type.id]
  );
  const updated = db.get('SELECT * FROM marker_types WHERE id = ?', [type.id]);
  res.json(updated);
});

// Delete marker type
router.delete('/:id', (req, res) => {
  const type = db.get('SELECT * FROM marker_types WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
  if (!type) return res.status(404).json({ error: 'Not found' });
  db.run('DELETE FROM marker_types WHERE id = ?', [type.id]);
  res.json({ ok: true });
});

// Upload custom icon image for a marker type
router.post('/:id/icon', (req, res) => {
  // This is handled through the uploads route - just link it
  const type = db.get('SELECT * FROM marker_types WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
  if (!type) return res.status(404).json({ error: 'Not found' });
  const { image_filename } = req.body;
  db.run('UPDATE marker_types SET image_filename = ? WHERE id = ?', [image_filename, type.id]);
  res.json({ ok: true });
});

module.exports = router;
