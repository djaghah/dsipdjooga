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

  // SEO: proper content-type for sitemap
  app.get('/sitemap.xml', (req, res) => {
    res.setHeader('Content-Type', 'application/xml');
    res.sendFile(path.join(__dirname, 'public', 'sitemap.xml'));
  });

  // Static files (no cache in development)
  app.use(express.static(path.join(__dirname, 'public'), {
    etag: false,
    maxAge: 0,
    setHeaders: (res, filePath) => {
      res.setHeader('Cache-Control', 'no-store');
      // SEO headers
      res.setHeader('X-Content-Type-Options', 'nosniff');
      if (filePath.endsWith('.html')) {
        res.setHeader('X-Robots-Tag', 'index, follow');
      }
    }
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
                  'promo_video_urls', 'ad_free_extension_minutes',
                  'google_ads_client', 'google_ads_slot_sidebar', 'google_ads_slot_splash',
                  'api_daily_limit_per_user', 'api_total_limit_per_user'];
    const rows = db.all('SELECT * FROM app_settings');
    const obj = {};
    rows.forEach(r => { if (keys.includes(r.key)) obj[r.key] = r.value; });
    res.json(obj);
  });

  // API config endpoint (safe public data)
  app.get('/api/config', (req, res) => {
    let mapsApiKey = process.env.GOOGLE_MAPS_API_KEY || '';
    let isCustomKey = false;

    // If user is authenticated and has custom API key active, use theirs
    if (req.isAuthenticated()) {
      const userKey = db.get(
        'SELECT maps_api_key, is_active FROM user_api_keys WHERE user_id = ? AND is_active = 1',
        [req.user.id]
      );
      if (userKey?.maps_api_key) {
        mapsApiKey = userKey.maps_api_key;
        isCustomKey = true;
      }
    }

    res.json({
      mapsApiKey,
      isCustomKey,
      mapsQuotaDaily: parseInt(process.env.GOOGLE_MAPS_DAILY_LIMIT) || 900
    });
  });

  // Helper: get effective daily/monthly limits for a user (including admin overrides)
  function getUserLimits(userId) {
    const today = new Date().toISOString().slice(0, 10);
    const thisMonth = today.slice(0, 7);

    const dailyDefault = parseInt(db.get("SELECT value FROM app_settings WHERE key = 'api_daily_limit_per_user'")?.value) || 10;
    const monthlyDefault = parseInt(db.get("SELECT value FROM app_settings WHERE key = 'api_monthly_limit_per_user'")?.value) || 300;

    const quota = db.get('SELECT * FROM user_quota WHERE user_id = ?', [userId]);

    // Daily: use override if it's for today, else default
    let dailyLimit = dailyDefault;
    if (quota?.daily_limit_override && quota.daily_limit_date === today) {
      dailyLimit = quota.daily_limit_override;
    }

    // Monthly: use override if it's for this month, else default
    let monthlyLimit = monthlyDefault;
    if (quota?.monthly_limit_override && quota.monthly_limit_period === thisMonth) {
      monthlyLimit = quota.monthly_limit_override;
    }

    return { dailyLimit, monthlyLimit, dailyDefault, monthlyDefault };
  }

  // API usage tracking - per user, per type, with rate limit
  app.post('/api/usage/increment', (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ error: 'Not authenticated' });
    const { type } = req.body;
    if (!type) return res.status(400).json({ error: 'Type required' });
    const today = new Date().toISOString().slice(0, 10);
    const monthStart = today.slice(0, 7) + '-01';

    // Check if user has custom API key active (bypasses rate limits)
    const userKey = db.get(
      'SELECT is_active FROM user_api_keys WHERE user_id = ? AND is_active = 1',
      [req.user.id]
    );
    const hasCustomKey = !!userKey;
    const keySource = hasCustomKey ? 'custom' : 'system';

    // Check rate limit (super admin and custom-key users bypass)
    if (req.user.role !== 'admin' && !hasCustomKey) {
      const { dailyLimit, monthlyLimit } = getUserLimits(req.user.id);

      // Daily check
      const todayTotal = db.get('SELECT SUM(count) as total FROM api_usage WHERE user_id = ? AND date = ?', [req.user.id, today]);
      const todayUsed = todayTotal?.total || 0;
      if (todayUsed >= dailyLimit) {
        return res.status(429).json({ error: 'rate_limit', message: `Limita zilnică de ${dailyLimit} accesări API atinsă.`, limit: dailyLimit, used: todayUsed });
      }

      // Monthly check
      const monthTotal = db.get('SELECT SUM(count) as total FROM api_usage WHERE user_id = ? AND date >= ?', [req.user.id, monthStart]);
      const monthUsed = monthTotal?.total || 0;
      if (monthUsed >= monthlyLimit) {
        return res.status(429).json({ error: 'monthly_limit', message: `Limita lunară de ${monthlyLimit} accesări API atinsă.`, limit: monthlyLimit, used: monthUsed });
      }
    }

    // Track usage (always, even for custom-key users — admin sees all usage)
    db.run(
      `INSERT INTO api_usage (user_id, date, type, count) VALUES (?, ?, ?, 1)
       ON CONFLICT(user_id, date, type) DO UPDATE SET count = count + 1`,
      [req.user.id, today, type]
    );

    // Detailed log entry with key source
    db.run('INSERT INTO api_log (user_id, type, key_source) VALUES (?, ?, ?)', [req.user.id, type, keySource]);

    res.json({ ok: true, hasCustomKey });
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

    // All-time totals per user
    const perUserAllTime = db.all(
      `SELECT u.name, u.email, a.user_id, SUM(a.count) as total
       FROM api_usage a JOIN users u ON a.user_id = u.id
       GROUP BY a.user_id`
    );

    // Global all-time total
    const globalTotal = db.get('SELECT SUM(count) as total FROM api_usage') || { total: 0 };

    // This user all-time total
    const myAllTime = db.get('SELECT SUM(count) as total FROM api_usage WHERE user_id = ?', [req.user.id]) || { total: 0 };

    // Per-user effective limits (includes admin overrides)
    const myLimits = getUserLimits(req.user.id);
    const dailyLimit = myLimits.dailyLimit;
    const monthlyLimit = myLimits.monthlyLimit;

    // My usage today and this month
    const myTodayTotal = db.get('SELECT SUM(count) as total FROM api_usage WHERE user_id = ? AND date = ?', [req.user.id, today]);
    const myMonthTotal = db.get('SELECT SUM(count) as total FROM api_usage WHERE user_id = ? AND date >= ?', [req.user.id, monthStart]);
    const myTodayUsed = myTodayTotal?.total || 0;
    const myMonthUsed = myMonthTotal?.total || 0;

    // Monthly quota settings (platform-wide Google API quota)
    const quotaMapsSetting = db.get("SELECT value FROM app_settings WHERE key = 'monthly_free_quota_maps'");
    const quotaGeoSetting = db.get("SELECT value FROM app_settings WHERE key = 'monthly_free_quota_geocode'");
    const monthlyQuotaMaps = parseInt(quotaMapsSetting?.value) || 28500;
    const monthlyQuotaGeocode = parseInt(quotaGeoSetting?.value) || 40000;

    // Check if user has custom key
    const userKeyRow = db.get('SELECT is_active FROM user_api_keys WHERE user_id = ? AND is_active = 1', [req.user.id]);
    const hasCustomKey = !!userKeyRow;

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

    // Add all-time totals to user breakdown
    perUserAllTime.forEach(r => {
      const key = r.name || r.email;
      if (userCosts[key]) userCosts[key].totalAllTime = r.total;
    });

    // Monthly totals by type for quota display
    const monthMapsLoad = allMonth.find(r => r.type === 'maps_load')?.count || 0;
    const monthGeocode = allMonth.find(r => r.type === 'geocode')?.count || 0;

    res.json({
      today: Object.fromEntries(myToday.map(r => [r.type, r.count])),
      myMonth: Object.fromEntries(myMonth.map(r => [r.type, r.count])),
      allMonth: Object.fromEntries(allMonth.map(r => [r.type, r.count])),
      totalCostUSD: Math.round(totalCost * 100) / 100,
      creditUSD: monthlyCredit,
      remainingCreditUSD: Math.round((monthlyCredit - totalCost) * 100) / 100,
      users: Object.values(userCosts),
      globalTotalCalls: globalTotal.total || 0,
      myTotalCalls: myAllTime.total || 0,
      // Per-user quota (daily + monthly)
      dailyLimit,
      monthlyLimit,
      myTodayUsed,
      myMonthUsed,
      hasCustomKey,
      // Platform-wide Google API quota
      monthlyQuota: {
        maps: { used: monthMapsLoad, limit: monthlyQuotaMaps, pct: Math.round(monthMapsLoad / monthlyQuotaMaps * 100) },
        geocode: { used: monthGeocode, limit: monthlyQuotaGeocode, pct: Math.round(monthGeocode / monthlyQuotaGeocode * 100) }
      }
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

  // ============ AD-FREE EXTENSION (video play reward) ============
  app.post('/api/ad-free/extend', (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ error: 'Not authenticated' });

    const extSetting = db.get("SELECT value FROM app_settings WHERE key = 'ad_free_extension_minutes'");
    const minutes = parseInt(extSetting?.value) || 30;

    // Cooldown: reject if ad_free_until was extended in the last 2 minutes
    const user = db.get('SELECT ad_free_until FROM users WHERE id = ?', [req.user.id]);
    if (user?.ad_free_until) {
      const current = new Date(user.ad_free_until);
      const now = new Date();
      if (current > now && (current - now) > (minutes - 2) * 60 * 1000) {
        return res.json({ ok: true, ad_free_until: user.ad_free_until, message: 'Already extended' });
      }
    }

    const now = new Date();
    const currentAdFree = user?.ad_free_until ? new Date(user.ad_free_until) : now;
    const base = currentAdFree > now ? currentAdFree : now;
    const newAdFree = new Date(base.getTime() + minutes * 60 * 1000);
    const isoStr = newAdFree.toISOString();

    db.run('UPDATE users SET ad_free_until = ? WHERE id = ?', [isoStr, req.user.id]);

    res.json({ ok: true, ad_free_until: isoStr, minutes });
  });

  // ============ USER API KEYS ============
  app.get('/api/user-keys', (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ error: 'Not authenticated' });
    const row = db.get('SELECT * FROM user_api_keys WHERE user_id = ?', [req.user.id]);
    if (!row) return res.json({ hasKey: false });
    res.json({
      hasKey: true,
      isActive: !!row.is_active,
      mapsKeyPreview: row.maps_api_key ? '****' + row.maps_api_key.slice(-6) : null,
      updatedAt: row.updated_at
    });
  });

  app.put('/api/user-keys', (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ error: 'Not authenticated' });
    const { maps_api_key, is_active } = req.body;

    // Validate key format (Google API keys start with AIza)
    if (maps_api_key && !maps_api_key.startsWith('AIza')) {
      return res.status(400).json({ error: 'Invalid API key format (must start with AIza...)' });
    }

    const existing = db.get('SELECT id FROM user_api_keys WHERE user_id = ?', [req.user.id]);
    if (existing) {
      const updates = [];
      const params = [];
      if (maps_api_key !== undefined) { updates.push('maps_api_key = ?'); params.push(maps_api_key); }
      if (is_active !== undefined) { updates.push('is_active = ?'); params.push(is_active ? 1 : 0); }
      updates.push('updated_at = CURRENT_TIMESTAMP');
      params.push(req.user.id);
      db.run(`UPDATE user_api_keys SET ${updates.join(', ')} WHERE user_id = ?`, params);
    } else {
      db.run(
        'INSERT INTO user_api_keys (user_id, maps_api_key, is_active) VALUES (?, ?, ?)',
        [req.user.id, maps_api_key || null, is_active !== undefined ? (is_active ? 1 : 0) : 1]
      );
    }
    res.json({ ok: true });
  });

  app.post('/api/user-keys/toggle', (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ error: 'Not authenticated' });
    const row = db.get('SELECT is_active FROM user_api_keys WHERE user_id = ?', [req.user.id]);
    if (!row) return res.status(404).json({ error: 'No keys found' });
    const newState = row.is_active ? 0 : 1;
    db.run('UPDATE user_api_keys SET is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?', [newState, req.user.id]);
    res.json({ ok: true, isActive: !!newState });
  });

  app.delete('/api/user-keys', (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ error: 'Not authenticated' });
    db.run('DELETE FROM user_api_keys WHERE user_id = ?', [req.user.id]);
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
