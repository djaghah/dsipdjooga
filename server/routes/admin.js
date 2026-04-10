const express = require('express');
const router = express.Router();
const db = require('../db');

function requireAdmin(req, res, next) {
  if (!req.isAuthenticated()) return res.status(401).json({ error: 'Not authenticated' });
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
  next();
}

// ============ USERS ============

// Get all users
router.get('/users', requireAdmin, (req, res) => {
  const users = db.all('SELECT id, email, name, avatar, role, is_approved, subscription_until, ad_free_until, created_at FROM users ORDER BY created_at DESC');
  res.json(users);
});

// Update user
router.put('/users/:id', requireAdmin, (req, res) => {
  const user = db.get('SELECT * FROM users WHERE id = ?', [req.params.id]);
  if (!user) return res.status(404).json({ error: 'User not found' });
  const { is_approved, role, subscription_until, ad_free_until } = req.body;
  db.run(
    `UPDATE users SET is_approved = ?, role = ?, subscription_until = ?, ad_free_until = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
    [is_approved ?? user.is_approved, role ?? user.role, subscription_until ?? user.subscription_until, ad_free_until ?? user.ad_free_until, user.id]
  );
  const updated = db.get('SELECT id, email, name, role, is_approved, subscription_until, ad_free_until FROM users WHERE id = ?', [user.id]);
  res.json(updated);
});

// Delete user
router.delete('/users/:id', requireAdmin, (req, res) => {
  if (parseInt(req.params.id) === req.user.id) return res.status(400).json({ error: 'Cannot delete yourself' });
  db.run('DELETE FROM users WHERE id = ?', [req.params.id]);
  res.json({ ok: true });
});

// ============ CONTACT REQUESTS ============

// List contact requests
router.get('/contacts', requireAdmin, (req, res) => {
  const ack = req.query.ack;
  let sql = 'SELECT * FROM contact_requests';
  const params = [];
  if (ack === '0' || ack === '1') { sql += ' WHERE acknowledged = ?'; params.push(parseInt(ack)); }
  sql += ' ORDER BY created_at DESC';
  res.json(db.all(sql, params));
});

// Acknowledge
router.put('/contacts/:id/ack', requireAdmin, (req, res) => {
  db.run('UPDATE contact_requests SET acknowledged = 1 WHERE id = ?', [req.params.id]);
  res.json({ ok: true });
});

// ============ SETTINGS ============

// ============ WHITELIST ============

router.get('/whitelist', requireAdmin, (req, res) => {
  res.json(db.all('SELECT * FROM whitelist ORDER BY created_at DESC'));
});

router.post('/whitelist', requireAdmin, (req, res) => {
  const { email } = req.body;
  if (!email?.trim()) return res.status(400).json({ error: 'Email required' });
  const normalized = email.toLowerCase().trim();
  const existing = db.get('SELECT id FROM whitelist WHERE email = ?', [normalized]);
  if (existing) return res.status(409).json({ error: 'Already whitelisted' });
  db.run('INSERT INTO whitelist (email, added_by) VALUES (?, ?)', [normalized, req.user.email]);
  // If user already exists but was rejected, approve them
  const user = db.get('SELECT id FROM users WHERE email = ? AND is_approved = 0', [normalized]);
  if (user) db.run('UPDATE users SET is_approved = 1 WHERE id = ?', [user.id]);
  res.status(201).json({ ok: true });
});

router.delete('/whitelist/:id', requireAdmin, (req, res) => {
  db.run('DELETE FROM whitelist WHERE id = ?', [req.params.id]);
  res.json({ ok: true });
});

// ============ SETTINGS ============

// Get all settings
router.get('/settings', requireAdmin, (req, res) => {
  const rows = db.all('SELECT * FROM app_settings');
  const obj = {};
  rows.forEach(r => { obj[r.key] = r.value; });
  res.json(obj);
});

// Update settings
router.put('/settings', requireAdmin, (req, res) => {
  for (const [key, value] of Object.entries(req.body)) {
    db.run('INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?)', [key, String(value)]);
  }
  res.json({ ok: true });
});

module.exports = router;
