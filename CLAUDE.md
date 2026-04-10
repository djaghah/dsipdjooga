# DSIP MapManager

## Overview
Node.js client-server application for geographic project management with Google Maps. Users authenticate via Google OAuth, create projects, and manage geolocated markers (fire hydrants, road signs, infrastructure).

## Architecture
- **Backend**: Express.js + Passport (Google OAuth) + SQLite (sql.js — pure JS, no native compilation)
- **Frontend**: Vanilla JS SPA with multiple views (login, unauthorized, expired, dashboard)
- **Database**: SQLite at `data/dsip.db`, sessions as files at `data/sessions/`
- **File uploads**: Per-user directories in `uploads/{userId}/`
- **Deployment**: Docker container behind nginx reverse proxy with SSL

## Key Files
- `server.js` — Express app entry, middleware, routes, session config (no-cache in dev)
- `server/db.js` — SQLite schema, query helpers, seed data (100 hydrants + 300 signs in Sibiu)
- `server/auth.js` — Passport Google OAuth + auto-admin for bogdansarac@gmail.com + whitelist check
- `server/routes/auth.js` — Login/logout/user preferences (prompt: select_account for multi-account)
- `server/routes/projects.js` — Project CRUD + project members (invite/role/remove)
- `server/routes/markers.js` — Marker CRUD with project-level access control (admin=edit, viewer=read)
- `server/routes/uploads.js` — Image upload with multer
- `server/routes/admin.js` — Super admin panel: users, whitelist, contact requests, app settings
- `server/routes/markerTypes.js` — Custom marker type CRUD
- `public/index.html` — SPA HTML (login, unauthorized, expired, dashboard, admin panel, ads)
- `public/css/style.css` — Full CSS with dark/light theme via CSS vars
- `public/js/app.js` — Main controller, project role enforcement (admin vs viewer UI)
- `public/js/map.js` — Google Maps: search (Geocoding API), SVG→PNG marker rendering, right-click context menu, move mode, POI toggle, rate limit check before API calls
- `public/js/markers.js` — Sidebar list (all/in-view toggle, scrollable), create/edit modal, icon picker with tabs
- `public/js/projects.js` — Project management modal with members panel (invite by email, role change)
- `public/js/icons.js` — SVGs: 10 avatars, 55 road signs, 24 firefighter icons, 5 default markers
- `public/js/i18n.js` — Translations: EN, RO, DE, FR (all keys in all languages)
- `public/js/theme.js` — Dark/light mode
- `public/js/admin.js` — Super admin panel, ads system, access control, admin/user role toggle
- `public/js/markerTypes.js` — Custom marker type management
- `Dockerfile` — Node 20 Alpine, non-root user, dumb-init, health check
- `docker-compose.yml` — Hardened: read-only fs, no-new-privileges, cap_drop ALL, memory/cpu limits
- `deploy.sh` — Git pull + docker rebuild script
- `dsip.service` — Systemd unit for auto-start on boot
- `nginx-maps.djooga.com.conf` — Nginx config template (certbot manages SSL)

## Database Schema
- `users` — Google OAuth users (google_id, email, name, avatar, locale, theme, role, is_approved, subscription_until, ad_free_until)
- `projects` — User projects (name, description, avatar_index, icon_type, center_lat, center_lng, default_zoom)
- `project_members` — Project-level roles (user_email, user_id, project_id, role: admin/viewer, invited_by)
- `markers` — Geolocated markers with metadata (lat/lng, icon_type, icon_index, status, condition, dates, cost, responsible, custom_data JSON)
- `marker_images` — Uploaded photos linked to markers
- `marker_types` — Custom marker types per user (svg_data, scope: all/project)
- `api_usage` — Per-user, per-type, per-day API call tracking (maps_load, geocode)
- `geocache` — Server-side geocoding result cache
- `whitelist` — Allowed email addresses (removed after user creates account)
- `contact_requests` — Access/renewal requests from unauthorized/expired users (acknowledged flag)
- `app_settings` — Key-value admin settings (api_daily_limit_per_user, ad timers, video URL)

## User Roles & Access
- **Super Admin**: bogdansarac@gmail.com — auto-assigned on first login, always admin, bypasses whitelist and rate limits, only one who sees Admin Panel button
- **User**: Regular user, needs to be in whitelist to login, sees ads (unless ad_free_until is future), subject to daily API rate limit
- **Project roles**: Project creator = project admin. Any project admin can invite Gmail addresses as admin or viewer. Viewer = read-only (no edit buttons, no admin mode, no right-click to add markers). Server enforces this on API level too.
- **Admin/User toggle**: Super admin can switch to "USER" view in header to test user experience (sees ads, rate limits don't apply but UI behaves as user)
- **Inactive users**: Super admin can set is_approved=0 → user cannot access platform

## Access Control Flow
1. User clicks "Sign in with Google" → always shows account picker (prompt: select_account)
2. Auth checks: is email in whitelist OR existing user? If not → create user with is_approved=0
3. If not approved → "Acces Restricționat" page with contact form, NO map loaded (0 API cost)
4. If subscription_until expired → "Abonament Expirat" page with renewal request form
5. If approved + active subscription → Dashboard
6. Super admin (bogdansarac@gmail.com) always passes all checks

## API Rate Limiting
- Rate limit checked BEFORE loading Google Maps and BEFORE each geocode request
- If limit exceeded → map doesn't load (shows "quota exhausted"), search blocked with toast
- Default: 10 API calls per user per day (configurable by super admin in Admin Panel > Settings)
- Super admin bypasses rate limit
- Tracks: maps_load, geocode per user per day
- Cost display in header bar (click to see detailed breakdown per user): $7/1000 maps_load, $5/1000 geocode
- $200/month Google free credit

## Marker Icon Rendering
- SVG icons are converted to PNG via Canvas at runtime (SVG → Blob → Image → Canvas → PNG data URL)
- Rendered at 80x80px for crisp display at 40x40px on map
- Cached in memory (_iconCache) — only rendered once per icon type
- Fixes Google Maps SVG scaling issues at different zoom levels

## Ads System
- **Google AdSense** publisher: `ca-pub-8858656137000126`
- Sidebar slot: `1236361551`, Splash slot: `9820382402`
- All AdSense config in `.env` file only (not in admin panel)
- Ads shown only to non-ad-free users. Super admin with ADMIN toggle = no ads. With USER toggle = sees ads.
- Splash screen: every N minutes (default 5), countdown of M seconds (default 10). Configurable from Admin Panel > Settings.
- Map auto-resizes when ads sidebar appears/disappears (ResizeObserver)
- **AdSense verification**: `djooga.com` has verification snippet at `/var/www/djooga.com/index.html`

## Seed Data
- On DB creation, auto-creates: super admin user (bogdansarac@gmail.com), 2 projects with Sibiu center (45.7983, 24.1256, zoom 14):
  - "Pompieri Sibiu" — 100 hydrant markers across Sibiu streets
  - "Semne Rutiere Sibiu" — 300 road sign markers across Sibiu streets
- Realistic data: street names, statuses (active/inactive/maintenance), conditions, costs, dates, responsible persons

## Environment Variables (.env) — NOT IN GIT
```
GOOGLE_CLIENT_ID=             # OAuth 2.0 client ID
GOOGLE_CLIENT_SECRET=         # OAuth 2.0 client secret
GOOGLE_MAPS_API_KEY=          # Maps JavaScript API + Geocoding API key
GOOGLE_MAPS_DAILY_LIMIT=900   # Global daily map load quota
GOOGLE_ADS_CLIENT=            # AdSense publisher ID (ca-pub-XXXX)
GOOGLE_ADS_SLOT_SIDEBAR=      # AdSense ad unit slot ID for sidebar
GOOGLE_ADS_SLOT_SPLASH=       # AdSense ad unit slot ID for splash screen
SESSION_SECRET=               # Express session secret (openssl rand -base64 48)
PORT=1978                     # Server port
BASE_URL=https://maps.djooga.com  # Public URL (used for OAuth callback)
```

## Google Cloud Console Setup (from scratch)
1. Go to https://console.cloud.google.com
2. Create new project (or select existing)
3. **Enable APIs**: APIs & Services → Library → enable:
   - Maps JavaScript API
   - Geocoding API
4. **Create API Key**: APIs & Services → Credentials → Create Credentials → API Key
   - Restrict to: Maps JavaScript API, Geocoding API
   - Restrict to referrers: `maps.djooga.com/*`, `localhost:*` (for dev)
5. **Create OAuth 2.0 Client**: APIs & Services → Credentials → Create Credentials → OAuth client ID
   - Application type: Web application
   - Authorized JavaScript origins: `https://maps.djooga.com`, `http://localhost:1978`
   - Authorized redirect URIs: `https://maps.djooga.com/auth/google/callback`, `http://localhost:1978/auth/google/callback`
6. **Billing**: Must be enabled for Maps API ($200/month free credit)

## Google AdSense Setup
1. Go to https://adsense.google.com
2. Account → publisher ID: `ca-pub-8858656137000126`
3. Sites → Add site: `djooga.com` (covers all subdomains)
4. Verification: AdSense code snippet is at `https://djooga.com/` (served by nginx from `/var/www/djooga.com/index.html`)
5. Ads → By ad unit → Display ads → create 2 units:
   - "DSIP Sidebar" → slot ID goes in `GOOGLE_ADS_SLOT_SIDEBAR`
   - "DSIP Splash" → slot ID goes in `GOOGLE_ADS_SLOT_SPLASH`
6. AdSense will NOT show ads until domain is approved (can take days)

## Deployment — Ubuntu Server (from scratch)

### Server info
- **Provider**: Contabo VPS
- **IP**: 38.242.237.2
- **OS**: Ubuntu Noble (24.04)
- **User**: djooga
- **App dir**: /home/djooga/maps
- **Domain**: maps.djooga.com
- **Port**: 1978 (internal, nginx proxies from 443)

### Prerequisites
- SSH access as user `djooga` (root and password login disabled)
- DNS A record: `maps.djooga.com` → 38.242.237.2
- DNS A record: `djooga.com` → 38.242.237.2

### Step 1: SSH Keys for GitHub
```bash
# Copy SSH keys to server (from Windows)
scp C:\Users\Bogdan.SARAC\.ssh\compa_gh djooga@38.242.237.2:~/.ssh/
scp C:\Users\Bogdan.SARAC\.ssh\compa_gh.pub djooga@38.242.237.2:~/.ssh/

# On server:
chmod 600 ~/.ssh/compa_gh
chmod 644 ~/.ssh/compa_gh.pub

cat >> ~/.ssh/config << 'EOF'
Host github.com
  HostName github.com
  User git
  IdentityFile ~/.ssh/compa_gh
  IdentitiesOnly yes
EOF

ssh-keyscan github.com >> ~/.ssh/known_hosts
ssh -T git@github.com   # Should say "Hi djaghah!"
```
Note: Public key must be added at https://github.com/settings/keys

### Step 2: Clone repository
```bash
cd /home/djooga
git clone git@github.com:djaghah/dsipdjooga.git maps
cd maps
```

### Step 3: Create .env
```bash
cp .env.example .env
nano .env   # Fill in all values from Windows .env
```

### Step 4: Install Docker
```bash
sudo apt update
sudo apt install ca-certificates curl -y
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc

echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt update
sudo apt install docker-ce docker-ce-cli containerd.io docker-compose-plugin -y
sudo usermod -aG docker djooga
# LOGOUT and LOGIN again for group to take effect
```

### Step 5: Create data dirs and start
```bash
cd /home/djooga/maps
mkdir -p data uploads data/sessions
docker compose up -d --build
docker compose logs --tail 10   # Verify it's running
```

### Step 6: Nginx
```bash
# Config for maps.djooga.com
sudo tee /etc/nginx/sites-available/maps.djooga.com << 'NGINX'
server {
    listen 80;
    server_name maps.djooga.com;
    client_max_body_size 5m;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    location / {
        proxy_pass http://127.0.0.1:1978;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 60s;
    }
}
NGINX

sudo ln -s /etc/nginx/sites-available/maps.djooga.com /etc/nginx/sites-enabled/

# AdSense verification page for djooga.com
sudo mkdir -p /var/www/djooga.com
sudo tee /var/www/djooga.com/index.html << 'HTML'
<!DOCTYPE html>
<html><head>
<meta charset="UTF-8"><title>Djooga</title>
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-8858656137000126" crossorigin="anonymous"></script>
</head><body><h1>Djooga</h1></body></html>
HTML

sudo tee /etc/nginx/sites-available/djooga.com << 'NGINX'
server {
    listen 80;
    server_name djooga.com www.djooga.com;
    root /var/www/djooga.com;
    index index.html;
}
NGINX

sudo ln -s /etc/nginx/sites-available/djooga.com /etc/nginx/sites-enabled/

# Rate limiting (add to nginx.conf http block if not already there)
# sudo sed -i '/http {/a \    limit_req_zone $binary_remote_addr zone=dsip:10m rate=30r/s;' /etc/nginx/nginx.conf

sudo nginx -t && sudo systemctl reload nginx
```

### Step 7: SSL with Certbot
```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d maps.djooga.com -d djooga.com -d www.djooga.com
# Enter email: bogdansarac@gmail.com, accept terms
# Certbot auto-renews via systemd timer
```

### Step 8: Systemd service (auto-start on boot)
```bash
sudo cp dsip.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable dsip
sudo systemctl start dsip
sudo systemctl status dsip   # Should show "active (running)"
```

### Updating the app
```bash
cd /home/djooga/maps
bash deploy.sh
```
Or manually: `git pull origin main && docker compose up -d --build`

### Useful commands
```bash
docker compose logs -f              # Live logs
docker compose ps                   # Container status
docker compose restart              # Restart container
sudo systemctl restart dsip         # Restart via systemd
docker compose exec dsip sh         # Shell into container
```

## Docker Security
- **Non-root**: App runs as user `dsip` (uid 1001) inside container
- **Read-only filesystem**: Only `data/` and `uploads/` volumes are writable
- **No new privileges**: `security_opt: no-new-privileges`
- **All capabilities dropped**: `cap_drop: ALL`
- **Resource limits**: 512MB RAM, 1 CPU
- **Localhost only**: Port bound to `127.0.0.1:1978` (not exposed externally)
- **dumb-init**: Proper signal handling for graceful shutdown
- **Health check**: wget to localhost every 30s

## Coding Conventions
- Server: CommonJS (`require`), Express middleware pattern
- Client: IIFE-style globals on `window` (App, Theme, I18n, Icons, MapManager, Projects, Markers, AdminPanel, MarkerTypes)
- CSS: Custom properties for theming, BEM-ish class names
- i18n: `data-i18n` attributes on HTML elements, `I18n.t('key')` in JS code. **IMPORTANT**: When adding ANY new user-visible text, ALWAYS add it to ALL 4 languages (en, ro, de, fr) in `public/js/i18n.js`. Never hardcode strings in Romanian or any language — always use i18n keys.
- sql.js: in-memory DB with immediate save to disk on every write
- Marker icons: SVG → Canvas → PNG data URL (not raw SVG data URLs — they break at zoom)
