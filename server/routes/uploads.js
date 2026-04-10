const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../db');

function requireAuth(req, res, next) {
  if (!req.isAuthenticated()) return res.status(401).json({ error: 'Not authenticated' });
  next();
}

router.use(requireAuth);

// Configure multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const userDir = path.join(__dirname, '..', '..', 'uploads', String(req.user.id));
    if (!fs.existsSync(userDir)) fs.mkdirSync(userDir, { recursive: true });
    cb(null, userDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const name = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`;
    cb(null, name);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.gif', '.svg', '.webp'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) cb(null, true);
    else cb(new Error('Only image files are allowed'));
  }
});

// Upload image for a marker
router.post('/marker/:markerId', upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  const marker = db.get(
    'SELECT m.* FROM markers m JOIN projects p ON m.project_id = p.id WHERE m.id = ? AND p.user_id = ?',
    [req.params.markerId, req.user.id]
  );
  if (!marker) {
    fs.unlinkSync(req.file.path);
    return res.status(404).json({ error: 'Marker not found' });
  }

  const result = db.run(
    'INSERT INTO marker_images (marker_id, filename, original_name) VALUES (?, ?, ?)',
    [marker.id, req.file.filename, req.file.originalname]
  );

  res.json({
    id: result.lastInsertRowid,
    filename: req.file.filename,
    original_name: req.file.originalname,
    url: `/uploads/${req.user.id}/${req.file.filename}`
  });
});

// Upload custom icon for project markers
router.post('/icon', upload.single('icon'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  res.json({
    filename: req.file.filename,
    url: `/uploads/${req.user.id}/${req.file.filename}`
  });
});

// Delete marker image
router.delete('/marker-image/:imageId', (req, res) => {
  const image = db.get(
    `SELECT mi.* FROM marker_images mi
     JOIN markers m ON mi.marker_id = m.id
     JOIN projects p ON m.project_id = p.id
     WHERE mi.id = ? AND p.user_id = ?`,
    [req.params.imageId, req.user.id]
  );
  if (!image) return res.status(404).json({ error: 'Image not found' });

  const filePath = path.join(__dirname, '..', '..', 'uploads', String(req.user.id), image.filename);
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  db.run('DELETE FROM marker_images WHERE id = ?', [image.id]);
  res.json({ ok: true });
});

module.exports = router;
