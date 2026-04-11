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
  const users = db.all('SELECT id, email, name, avatar, role, is_approved, google_api_mode, subscription_until, ad_free_until, created_at FROM users ORDER BY created_at DESC');
  res.json(users);
});

// Update user
router.put('/users/:id', requireAdmin, (req, res) => {
  const user = db.get('SELECT * FROM users WHERE id = ?', [req.params.id]);
  if (!user) return res.status(404).json({ error: 'User not found' });
  const { is_approved, role, subscription_until, ad_free_until, google_api_mode } = req.body;
  db.run(
    `UPDATE users SET is_approved = ?, role = ?, google_api_mode = ?, subscription_until = ?, ad_free_until = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
    [is_approved ?? user.is_approved, role ?? user.role, google_api_mode ?? user.google_api_mode, subscription_until ?? user.subscription_until, ad_free_until ?? user.ad_free_until, user.id]
  );
  const updated = db.get('SELECT id, email, name, role, is_approved, google_api_mode, subscription_until, ad_free_until FROM users WHERE id = ?', [user.id]);
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

// ============ PROJECT VISIBILITY ============

// Toggle project public/private (super admin only)
router.put('/projects/:id/public', requireAdmin, (req, res) => {
  if (req.user.email !== 'bogdansarac@gmail.com') {
    return res.status(403).json({ error: 'Only super admin' });
  }
  const project = db.get('SELECT * FROM projects WHERE id = ?', [req.params.id]);
  if (!project) return res.status(404).json({ error: 'Not found' });
  const newState = project.is_public ? 0 : 1;
  db.run('UPDATE projects SET is_public = ? WHERE id = ?', [newState, project.id]);
  res.json({ ok: true, is_public: newState });
});

// ============ QUOTA MANAGEMENT ============

// Reset daily quota for a user (or all users)
// Logic: new_limit = max(current_limit, used_today + default_daily)
router.post('/quota/reset-daily', requireAdmin, (req, res) => {
  const { user_id } = req.body; // null = all users
  const today = new Date().toISOString().slice(0, 10);
  const dailyDefault = parseInt(db.get("SELECT value FROM app_settings WHERE key = 'api_daily_limit_per_user'")?.value) || 10;

  const resetOne = (uid) => {
    const todayTotal = db.get('SELECT SUM(count) as total FROM api_usage WHERE user_id = ? AND date = ?', [uid, today]);
    const used = todayTotal?.total || 0;
    const newLimit = Math.max(dailyDefault, used + dailyDefault);

    const existing = db.get('SELECT * FROM user_quota WHERE user_id = ?', [uid]);
    // Only apply if not already reset today (prevent stacking)
    if (existing?.daily_limit_date === today) return false;

    if (existing) {
      db.run('UPDATE user_quota SET daily_limit_override = ?, daily_limit_date = ? WHERE user_id = ?', [newLimit, today, uid]);
    } else {
      db.run('INSERT INTO user_quota (user_id, daily_limit_override, daily_limit_date) VALUES (?, ?, ?)', [uid, newLimit, today]);
    }
    return true;
  };

  if (user_id) {
    const ok = resetOne(parseInt(user_id));
    res.json({ ok, message: ok ? 'Daily quota reset' : 'Already reset today' });
  } else {
    const users = db.all('SELECT id FROM users');
    let count = 0;
    users.forEach(u => { if (resetOne(u.id)) count++; });
    res.json({ ok: true, message: `Daily quota reset for ${count} users` });
  }
});

// Reset monthly quota for a user (or all users)
// Logic: new_limit = max(current_limit, used_this_month + default_monthly)
router.post('/quota/reset-monthly', requireAdmin, (req, res) => {
  const { user_id } = req.body;
  const today = new Date().toISOString().slice(0, 10);
  const thisMonth = today.slice(0, 7);
  const monthStart = thisMonth + '-01';
  const monthlyDefault = parseInt(db.get("SELECT value FROM app_settings WHERE key = 'api_monthly_limit_per_user'")?.value) || 300;

  const resetOne = (uid) => {
    const monthTotal = db.get('SELECT SUM(count) as total FROM api_usage WHERE user_id = ? AND date >= ?', [uid, monthStart]);
    const used = monthTotal?.total || 0;
    const newLimit = Math.max(monthlyDefault, used + monthlyDefault);

    const existing = db.get('SELECT * FROM user_quota WHERE user_id = ?', [uid]);
    if (existing?.monthly_limit_period === thisMonth) return false;

    if (existing) {
      db.run('UPDATE user_quota SET monthly_limit_override = ?, monthly_limit_period = ? WHERE user_id = ?', [newLimit, thisMonth, uid]);
    } else {
      db.run('INSERT INTO user_quota (user_id, monthly_limit_override, monthly_limit_period) VALUES (?, ?, ?)', [uid, newLimit, thisMonth]);
    }
    return true;
  };

  if (user_id) {
    const ok = resetOne(parseInt(user_id));
    res.json({ ok, message: ok ? 'Monthly quota reset' : 'Already reset this month' });
  } else {
    const users = db.all('SELECT id FROM users');
    let count = 0;
    users.forEach(u => { if (resetOne(u.id)) count++; });
    res.json({ ok: true, message: `Monthly quota reset for ${count} users` });
  }
});

// Get quota info for all users (for admin usage tab)
router.get('/quota/users', requireAdmin, (req, res) => {
  const today = new Date().toISOString().slice(0, 10);
  const thisMonth = today.slice(0, 7);
  const monthStart = thisMonth + '-01';
  const dailyDefault = parseInt(db.get("SELECT value FROM app_settings WHERE key = 'api_daily_limit_per_user'")?.value) || 10;
  const monthlyDefault = parseInt(db.get("SELECT value FROM app_settings WHERE key = 'api_monthly_limit_per_user'")?.value) || 300;

  const users = db.all('SELECT id, name, email FROM users ORDER BY name');
  const result = users.map(u => {
    const todayRow = db.get('SELECT SUM(count) as total FROM api_usage WHERE user_id = ? AND date = ?', [u.id, today]);
    const monthRow = db.get('SELECT SUM(count) as total FROM api_usage WHERE user_id = ? AND date >= ?', [u.id, monthStart]);
    const quota = db.get('SELECT * FROM user_quota WHERE user_id = ?', [u.id]);
    const keyRow = db.get('SELECT is_active FROM user_api_keys WHERE user_id = ?', [u.id]);

    const dailyLimit = (quota?.daily_limit_date === today && quota?.daily_limit_override) ? quota.daily_limit_override : dailyDefault;
    const monthlyLimit = (quota?.monthly_limit_period === thisMonth && quota?.monthly_limit_override) ? quota.monthly_limit_override : monthlyDefault;

    return {
      id: u.id, name: u.name, email: u.email,
      todayUsed: todayRow?.total || 0,
      monthUsed: monthRow?.total || 0,
      dailyLimit, monthlyLimit,
      hasCustomKey: !!(keyRow?.is_active),
      dailyResetDone: quota?.daily_limit_date === today,
      monthlyResetDone: quota?.monthly_limit_period === thisMonth
    };
  });
  res.json(result);
});

// ============ API USAGE REPORTS ============

// Daily log with user details
router.get('/usage/daily-log', requireAdmin, (req, res) => {
  const { from, to, user_id } = req.query;
  const today = new Date().toISOString().slice(0, 10);
  const fromDate = from || today.slice(0, 7) + '-01';
  const toDate = to || today;

  let sql = `SELECT a.date, a.type, a.count, a.user_id, u.name, u.email
     FROM api_usage a JOIN users u ON a.user_id = u.id
     WHERE a.date BETWEEN ? AND ?`;
  const params = [fromDate, toDate];

  if (user_id) {
    sql += ' AND a.user_id = ?';
    params.push(parseInt(user_id));
  }

  sql += ' ORDER BY a.date DESC, a.count DESC';
  res.json(db.all(sql, params));
});

// Top users this month
router.get('/usage/top-users', requireAdmin, (req, res) => {
  const today = new Date().toISOString().slice(0, 10);
  const monthStart = today.slice(0, 7) + '-01';

  const users = db.all(
    `SELECT u.id, u.name, u.email, a.type, SUM(a.count) as count
     FROM api_usage a JOIN users u ON a.user_id = u.id
     WHERE a.date >= ?
     GROUP BY a.user_id, a.type
     ORDER BY count DESC`,
    [monthStart]
  );

  // Aggregate per user
  const userMap = {};
  users.forEach(r => {
    if (!userMap[r.id]) userMap[r.id] = { id: r.id, name: r.name, email: r.email, total: 0, breakdown: {} };
    userMap[r.id].total += r.count;
    userMap[r.id].breakdown[r.type] = r.count;
  });

  // Add all-time totals
  const allTime = db.all(
    `SELECT user_id, SUM(count) as total FROM api_usage GROUP BY user_id`
  );
  allTime.forEach(r => {
    if (userMap[r.user_id]) userMap[r.user_id].allTimeTotal = r.total;
  });

  // Check custom key status
  const keys = db.all('SELECT user_id, is_active FROM user_api_keys');
  keys.forEach(k => {
    if (userMap[k.user_id]) userMap[k.user_id].hasCustomKey = !!k.is_active;
  });

  const sorted = Object.values(userMap).sort((a, b) => b.total - a.total);
  res.json(sorted);
});

// Detailed API log entries (recent)
router.get('/usage/log', requireAdmin, (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 100, 500);
  const offset = parseInt(req.query.offset) || 0;
  const rows = db.all(
    `SELECT l.id, l.type, l.created_at, u.name, u.email
     FROM api_log l JOIN users u ON l.user_id = u.id
     ORDER BY l.created_at DESC LIMIT ? OFFSET ?`,
    [limit, offset]
  );
  res.json(rows);
});

// ============ DATABASE ============

// Get DB version info
router.get('/db-version', requireAdmin, (req, res) => {
  res.json({
    codeVersion: db.getDbVersion(),
    dbVersion: db.getStoredDbVersion(),
    needsReset: db.getDbVersion() !== db.getStoredDbVersion()
  });
});

// Reset database (super admin only — extra check on email)
router.post('/db-reset', requireAdmin, (req, res) => {
  if (req.user.email !== 'bogdansarac@gmail.com') {
    return res.status(403).json({ error: 'Only super admin can reset the database' });
  }
  try {
    const result = db.resetDatabase();
    res.json({ ok: true, message: 'Database reset successfully', version: result.version });
  } catch (e) {
    console.error('DB reset error:', e);
    res.status(500).json({ error: 'Failed to reset database: ' + e.message });
  }
});

module.exports = router;
