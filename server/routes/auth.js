const express = require('express');
const db = require('../db');

module.exports = function(passport) {
  const router = express.Router();

  // Start Google OAuth (always show account picker)
  router.get('/google', passport.authenticate('google', {
    scope: ['profile', 'email'],
    prompt: 'select_account'
  }));

  // Google OAuth callback — H3 FIX: regenerate session to prevent session fixation
  router.get('/google/callback',
    passport.authenticate('google', { failureRedirect: '/?error=auth_failed' }),
    (req, res) => {
      const userId = req.user.id;
      req.session.regenerate((err) => {
        if (err) return res.redirect('/?error=session_error');
        req.session.passport = { user: userId };
        req.session.save(() => res.redirect('/#/dashboard'));
      });
    }
  );

  // Get current user
  router.get('/me', (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ error: 'Not authenticated' });
    const { google_id, ...user } = req.user;
    res.json(user);
  });

  // Update user preferences
  router.put('/me', (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ error: 'Not authenticated' });
    const { locale, theme } = req.body;
    const updates = [];
    const params = [];
    if (locale && ['en', 'ro', 'de', 'fr'].includes(locale)) {
      updates.push('locale = ?');
      params.push(locale);
    }
    if (theme && ['light', 'dark'].includes(theme)) {
      updates.push('theme = ?');
      params.push(theme);
    }
    if (updates.length === 0) return res.json(req.user);
    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(req.user.id);
    db.run(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, params);
    const user = db.get('SELECT * FROM users WHERE id = ?', [req.user.id]);
    const { google_id, ...safe } = user;
    res.json(safe);
  });

  // Logout
  router.post('/logout', (req, res) => {
    req.logout(() => {
      req.session.destroy(() => {
        res.json({ ok: true });
      });
    });
  });

  return router;
};
