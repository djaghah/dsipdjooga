const GoogleStrategy = require('passport-google-oauth20').Strategy;
const db = require('./db');

const SUPER_ADMIN_EMAIL = 'bogdansarac@gmail.com';

module.exports = function configureAuth(passport) {
  passport.serializeUser((user, done) => done(null, user.id));

  passport.deserializeUser((id, done) => {
    try {
      const user = db.get('SELECT * FROM users WHERE id = ?', [id]);
      done(null, user || false);
    } catch (err) {
      done(err, false);
    }
  });

  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: `${process.env.BASE_URL || 'http://localhost:3000'}/auth/google/callback`
  }, (accessToken, refreshToken, profile, done) => {
    try {
      const email = (profile.emails?.[0]?.value || '').toLowerCase();
      const googleId = profile.id;
      const name = profile.displayName || '';
      const avatar = profile.photos?.[0]?.value || '';

      // Super admin always passes — no whitelist check needed
      const isSuperAdmin = email === SUPER_ADMIN_EMAIL;
      const whitelisted = isSuperAdmin || db.get('SELECT id FROM whitelist WHERE email = ?', [email]);
      let user = db.get('SELECT * FROM users WHERE google_id = ?', [googleId]);

      // Also check by email (for seeded users)
      if (!user && email) {
        user = db.get('SELECT * FROM users WHERE email = ?', [email]);
        if (user) {
          db.run('UPDATE users SET google_id = ? WHERE id = ?', [googleId, user.id]);
          user = db.get('SELECT * FROM users WHERE id = ?', [user.id]);
        }
      }

      if (!user && !whitelisted) {
        // Not whitelisted, no existing account — create rejected user
        db.run(
          `INSERT INTO users (google_id, email, name, avatar, role, is_approved) VALUES (?, ?, ?, ?, 'user', 0)`,
          [googleId, email, name, avatar]
        );
        user = db.get('SELECT * FROM users WHERE google_id = ?', [googleId]);
        return done(null, user);
      }

      if (!user) {
        // New whitelisted user — create approved
        const isSuperAdmin = email === SUPER_ADMIN_EMAIL;
        db.run(
          `INSERT INTO users (google_id, email, name, avatar, role, is_approved, subscription_until, ad_free_until)
           VALUES (?, ?, ?, ?, ?, 1, ?, ?)`,
          [googleId, email, name, avatar,
           isSuperAdmin ? 'admin' : 'user',
           '2099-12-31',
           isSuperAdmin ? '2099-12-31' : null]
        );
        user = db.get('SELECT * FROM users WHERE google_id = ?', [googleId]);
        // Remove from whitelist — they're now a full user
        db.run('DELETE FROM whitelist WHERE email = ?', [email]);
      } else {
        // Existing user — update profile
        db.run(
          'UPDATE users SET name = ?, avatar = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
          [name || user.name, avatar || user.avatar, user.id]
        );
        if (email === SUPER_ADMIN_EMAIL && user.role !== 'admin') {
          db.run('UPDATE users SET role = ?, is_approved = 1 WHERE id = ?', ['admin', user.id]);
        }
        user = db.get('SELECT * FROM users WHERE id = ?', [user.id]);
      }

      return done(null, user);
    } catch (err) {
      console.error('Auth error:', err);
      return done(err, false);
    }
  }));
};
