require('dotenv').config();
const express = require('express');
const session = require('express-session');
const FileStore = require('session-file-store')(session);
const passport = require('passport');
const path = require('path');
const fs = require('fs');
const db = require('./server/db');
const configureAuth = require('./server/auth');

const app = express();
const PORT = process.env.PORT || 3000;

// Ensure directories exist
['uploads', 'data', 'data/sessions'].forEach(dir => {
  const p = path.join(__dirname, dir);
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
});

async function start() {
  // Initialize database (async for sql.js)
  await db.init();

  // Middleware
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Session
  app.use(session({
    store: new FileStore({
      path: path.join(__dirname, 'data', 'sessions'),
      ttl: 7 * 24 * 60 * 60, // 7 days
      retries: 1,
      logFn: () => {} // silent
    }),
    secret: process.env.SESSION_SECRET || 'dev-secret-change-me',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 7 * 24 * 60 * 60 * 1000 }
  }));

  // Passport
  configureAuth(passport);
  app.use(passport.initialize());
  app.use(passport.session());

  // Static files (no cache in development)
  app.use(express.static(path.join(__dirname, 'public'), {
    etag: false,
    maxAge: 0,
    setHeaders: (res) => { res.setHeader('Cache-Control', 'no-store'); }
  }));

  // User uploads - only accessible when authenticated, scoped to user
  app.use('/uploads/:userId', (req, res, next) => {
    if (!req.isAuthenticated()) return res.status(401).json({ error: 'Not authenticated' });
    if (String(req.user.id) !== req.params.userId) return res.status(403).json({ error: 'Forbidden' });
    next();
  }, (req, res, next) => {
    express.static(path.join(__dirname, 'uploads', req.params.userId))(req, res, next);
  });

  // API Routes
  app.use('/auth', require('./server/routes/auth')(passport));
  app.use('/api/projects', require('./server/routes/projects'));
  app.use('/api/markers', require('./server/routes/markers'));
  app.use('/api/uploads', require('./server/routes/uploads'));
  app.use('/api/marker-types', require('./server/routes/markerTypes'));
  app.use('/api/admin', require('./server/routes/admin'));

  // Contact request (public - for unapproved/expired users)
  app.post('/api/contact-request', (req, res) => {
    const { email, name, message } = req.body;
    if (!email) return res.status(400).json({ error: 'Email required' });
    db.run('INSERT INTO contact_requests (email, name, message) VALUES (?, ?, ?)',
      [email, name || '', message || '']);
    res.json({ ok: true });
  });

  // Public app settings (non-sensitive)
  app.get('/api/public-settings', (req, res) => {
    const keys = ['ad_splash_interval_minutes', 'ad_splash_duration_seconds', 'promo_video_url',
                  'google_ads_client', 'google_ads_slot_sidebar', 'google_ads_slot_splash',
                  'api_daily_limit_per_user'];
    const rows = db.all('SELECT * FROM app_settings');
    const obj = {};
    rows.forEach(r => { if (keys.includes(r.key)) obj[r.key] = r.value; });
    res.json(obj);
  });

  // API config endpoint (safe public data)
  app.get('/api/config', (req, res) => {
    res.json({
      mapsApiKey: process.env.GOOGLE_MAPS_API_KEY || '',
      mapsQuotaDaily: parseInt(process.env.GOOGLE_MAPS_DAILY_LIMIT) || 900
    });
  });

  // API usage tracking - per user, per type, with rate limit
  app.post('/api/usage/increment', (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ error: 'Not authenticated' });
    const { type } = req.body;
    if (!type) return res.status(400).json({ error: 'Type required' });
    const today = new Date().toISOString().slice(0, 10);

    // Check rate limit (super admin bypasses)
    if (req.user.role !== 'admin') {
      const limitSetting = db.get("SELECT value FROM app_settings WHERE key = 'api_daily_limit_per_user'");
      const limit = parseInt(limitSetting?.value) || 10;
      const todayTotal = db.get('SELECT SUM(count) as total FROM api_usage WHERE user_id = ? AND date = ?', [req.user.id, today]);
      if ((todayTotal?.total || 0) >= limit) {
        return res.status(429).json({ error: 'rate_limit', message: `Limita zilnică de ${limit} accesări API atinsă.`, limit });
      }
    }

    db.run(
      `INSERT INTO api_usage (user_id, date, type, count) VALUES (?, ?, ?, 1)
       ON CONFLICT(user_id, date, type) DO UPDATE SET count = count + 1`,
      [req.user.id, today, type]
    );
    res.json({ ok: true });
  });

  // Get usage summary: this user today + all users this month (for cost display)
  app.get('/api/usage', (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ error: 'Not authenticated' });
    const today = new Date().toISOString().slice(0, 10);
    const monthStart = today.slice(0, 7) + '-01';

    // This user today
    const myToday = db.all(
      'SELECT type, SUM(count) as count FROM api_usage WHERE user_id = ? AND date = ? GROUP BY type',
      [req.user.id, today]
    );

    // This user this month
    const myMonth = db.all(
      'SELECT type, SUM(count) as count FROM api_usage WHERE user_id = ? AND date >= ? GROUP BY type',
      [req.user.id, monthStart]
    );

    // All users this month (total platform cost)
    const allMonth = db.all(
      'SELECT type, SUM(count) as count FROM api_usage WHERE date >= ? GROUP BY type',
      [monthStart]
    );

    // Per-user breakdown this month
    const perUser = db.all(
      `SELECT u.name, u.email, a.type, SUM(a.count) as count
       FROM api_usage a JOIN users u ON a.user_id = u.id
       WHERE a.date >= ? GROUP BY a.user_id, a.type ORDER BY count DESC`,
      [monthStart]
    );

    // Cost calculation (USD):
    // Maps JS API: $7 per 1000 loads
    // Geocoding: $5 per 1000 requests
    // Places: $17 per 1000 requests (text search)
    const COSTS = { maps_load: 7, geocode: 5, places: 17 };
    const monthlyCredit = 200; // $200 free

    const totalCost = allMonth.reduce((sum, r) => sum + (r.count / 1000) * (COSTS[r.type] || 5), 0);
    const userCosts = {};
    perUser.forEach(r => {
      const key = r.name || r.email;
      if (!userCosts[key]) userCosts[key] = { name: key, calls: 0, cost: 0, breakdown: {} };
      userCosts[key].calls += r.count;
      userCosts[key].cost += (r.count / 1000) * (COSTS[r.type] || 5);
      userCosts[key].breakdown[r.type] = r.count;
    });

    res.json({
      today: Object.fromEntries(myToday.map(r => [r.type, r.count])),
      myMonth: Object.fromEntries(myMonth.map(r => [r.type, r.count])),
      allMonth: Object.fromEntries(allMonth.map(r => [r.type, r.count])),
      totalCostUSD: Math.round(totalCost * 100) / 100,
      creditUSD: monthlyCredit,
      remainingCreditUSD: Math.round((monthlyCredit - totalCost) * 100) / 100,
      users: Object.values(userCosts)
    });
  });

  // Legacy endpoint (backward compat for header bar)
  app.get('/api/maps-usage', (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ error: 'Not authenticated' });
    const today = new Date().toISOString().slice(0, 10);
    const usage = db.get('SELECT SUM(count) as count FROM api_usage WHERE date = ?', [today]) || { count: 0 };
    const limit = parseInt(process.env.GOOGLE_MAPS_DAILY_LIMIT) || 900;
    res.json({ used: usage.count || 0, limit, remaining: Math.max(0, limit - (usage.count || 0)) });
  });

  app.post('/api/maps-usage/increment', (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ error: 'Not authenticated' });
    const today = new Date().toISOString().slice(0, 10);
    db.run(
      `INSERT INTO api_usage (user_id, date, type, count) VALUES (?, ?, 'maps_load', 1)
       ON CONFLICT(user_id, date, type) DO UPDATE SET count = count + 1`,
      [req.user.id, today]
    );
    const usage = db.get('SELECT SUM(count) as count FROM api_usage WHERE date = ?', [today]) || { count: 0 };
    const limit = parseInt(process.env.GOOGLE_MAPS_DAILY_LIMIT) || 900;
    res.json({ used: usage.count || 0, limit, remaining: Math.max(0, limit - (usage.count || 0)) });
  });

  // Geocoding cache API
  app.get('/api/geocache', (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ error: 'Not authenticated' });
    const { query } = req.query;
    if (!query) return res.json([]);
    const results = db.all(
      'SELECT * FROM geocache WHERE query LIKE ? LIMIT 10',
      [`%${query}%`]
    );
    res.json(results);
  });

  app.post('/api/geocache', (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ error: 'Not authenticated' });
    const { query, lat, lng, name, address } = req.body;
    if (!query || lat == null || lng == null) return res.status(400).json({ error: 'Missing fields' });
    db.run(
      `INSERT OR REPLACE INTO geocache (query, lat, lng, name, address) VALUES (?, ?, ?, ?, ?)`,
      [query.toLowerCase(), lat, lng, name || '', address || '']
    );
    res.json({ ok: true });
  });

  // SPA fallback - serve index.html for all non-API routes
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  });

  app.listen(PORT, () => {
    console.log(`\n  🗺️  DSIP MapManager running at ${process.env.BASE_URL || `http://localhost:${PORT}`}\n`);
  });
}

start().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
