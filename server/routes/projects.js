const express = require('express');
const router = express.Router();
const db = require('../db');

// Auth middleware
function requireAuth(req, res, next) {
  if (!req.isAuthenticated()) return res.status(401).json({ error: 'Not authenticated' });
  next();
}

router.use(requireAuth);

// List all projects for current user (owned + member of)
router.get('/', (req, res) => {
  const owned = db.all('SELECT *, "admin" as my_role FROM projects WHERE user_id = ? ORDER BY updated_at DESC', [req.user.id]);
  const memberOf = db.all(
    `SELECT p.*, pm.role as my_role FROM projects p
     JOIN project_members pm ON p.id = pm.project_id
     WHERE (pm.user_id = ? OR pm.user_email = ?) AND p.user_id != ?
     ORDER BY p.updated_at DESC`,
    [req.user.id, req.user.email, req.user.id]);
  const all = [...owned, ...memberOf];
  const enriched = all.map(p => {
    const count = db.get('SELECT COUNT(*) as count FROM markers WHERE project_id = ?', [p.id]);
    return { ...p, marker_count: count?.count || 0 };
  });
  res.json(enriched);
});

// Get single project
router.get('/:id', (req, res) => {
  const project = db.get('SELECT * FROM projects WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
  if (!project) return res.status(404).json({ error: 'Project not found' });
  const count = db.get('SELECT COUNT(*) as count FROM markers WHERE project_id = ?', [project.id]);
  res.json({ ...project, marker_count: count?.count || 0 });
});

// Create project
router.post('/', (req, res) => {
  const { name, description, avatar_index, icon_type } = req.body;
  if (!name || !name.trim()) return res.status(400).json({ error: 'Name is required' });
  const result = db.run(
    'INSERT INTO projects (user_id, name, description, avatar_index, icon_type) VALUES (?, ?, ?, ?, ?)',
    [req.user.id, name.trim(), description || '', avatar_index || 0, icon_type || 'default']
  );
  const project = db.get('SELECT * FROM projects WHERE id = ?', [result.lastInsertRowid]);
  res.status(201).json(project);
});

// Update project
router.put('/:id', (req, res) => {
  const project = db.get('SELECT * FROM projects WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
  if (!project) return res.status(404).json({ error: 'Project not found' });
  const { name, description, avatar_index, icon_type, center_lat, center_lng, default_zoom } = req.body;
  db.run(
    `UPDATE projects SET name = ?, description = ?, avatar_index = ?, icon_type = ?,
     center_lat = ?, center_lng = ?, default_zoom = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
    [name || project.name, description ?? project.description, avatar_index ?? project.avatar_index,
     icon_type || project.icon_type,
     center_lat ?? project.center_lat, center_lng ?? project.center_lng,
     default_zoom ?? project.default_zoom, project.id]
  );
  const updated = db.get('SELECT * FROM projects WHERE id = ?', [project.id]);
  res.json(updated);
});

// Delete project
router.delete('/:id', (req, res) => {
  const project = db.get('SELECT * FROM projects WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
  if (!project) return res.status(404).json({ error: 'Project not found' });
  db.run('DELETE FROM projects WHERE id = ?', [project.id]);
  res.json({ ok: true });
});

// ============ PROJECT MEMBERS ============

// Helper: check if user is project admin (owner or member with admin role)
function isProjectAdmin(projectId, userId, userEmail) {
  const project = db.get('SELECT * FROM projects WHERE id = ?', [projectId]);
  if (!project) return false;
  if (project.user_id === userId) return true; // owner
  const member = db.get('SELECT * FROM project_members WHERE project_id = ? AND (user_id = ? OR user_email = ?) AND role = ?',
    [projectId, userId, userEmail, 'admin']);
  return !!member;
}

// Get members of a project
router.get('/:id/members', (req, res) => {
  const project = db.get('SELECT * FROM projects WHERE id = ?', [req.params.id]);
  if (!project) return res.status(404).json({ error: 'Project not found' });
  // Must be member or owner
  const isMember = project.user_id === req.user.id ||
    db.get('SELECT id FROM project_members WHERE project_id = ? AND (user_id = ? OR user_email = ?)',
      [project.id, req.user.id, req.user.email]);
  if (!isMember) return res.status(403).json({ error: 'Not a member' });

  const members = db.all(
    `SELECT pm.*, u.name as user_name, u.avatar as user_avatar
     FROM project_members pm LEFT JOIN users u ON pm.user_id = u.id
     WHERE pm.project_id = ?`, [project.id]);

  // Add owner
  const owner = db.get('SELECT id, name, email, avatar FROM users WHERE id = ?', [project.user_id]);
  res.json({ owner, members });
});

// Invite member (by email)
router.post('/:id/members', (req, res) => {
  const { email, role } = req.body;
  if (!email) return res.status(400).json({ error: 'Email required' });
  if (!['admin', 'viewer'].includes(role)) return res.status(400).json({ error: 'Role must be admin or viewer' });

  if (!isProjectAdmin(parseInt(req.params.id), req.user.id, req.user.email)) {
    return res.status(403).json({ error: 'Only project admins can invite' });
  }

  const normalEmail = email.toLowerCase().trim();
  // Check if already member
  const existing = db.get('SELECT id FROM project_members WHERE project_id = ? AND user_email = ?',
    [req.params.id, normalEmail]);
  if (existing) return res.status(409).json({ error: 'Already a member' });

  // Check if user exists in system
  const existingUser = db.get('SELECT id FROM users WHERE email = ?', [normalEmail]);

  db.run('INSERT INTO project_members (project_id, user_email, user_id, role, invited_by) VALUES (?, ?, ?, ?, ?)',
    [req.params.id, normalEmail, existingUser?.id || null, role, req.user.id]);

  res.status(201).json({ ok: true, email: normalEmail, role });
});

// Update member role
router.put('/:id/members/:memberId', (req, res) => {
  if (!isProjectAdmin(parseInt(req.params.id), req.user.id, req.user.email)) {
    return res.status(403).json({ error: 'Only project admins can change roles' });
  }
  const { role } = req.body;
  if (!['admin', 'viewer'].includes(role)) return res.status(400).json({ error: 'Invalid role' });
  db.run('UPDATE project_members SET role = ? WHERE id = ? AND project_id = ?',
    [role, req.params.memberId, req.params.id]);
  res.json({ ok: true });
});

// Remove member
router.delete('/:id/members/:memberId', (req, res) => {
  if (!isProjectAdmin(parseInt(req.params.id), req.user.id, req.user.email)) {
    return res.status(403).json({ error: 'Only project admins can remove members' });
  }
  db.run('DELETE FROM project_members WHERE id = ? AND project_id = ?',
    [req.params.memberId, req.params.id]);
  res.json({ ok: true });
});

module.exports = router;
