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
- `server.js` — Express app entry, middleware, routes, session config, API usage/quota, ad-free extension, user API keys CRUD
- `server/db.js` — SQLite schema, query helpers, seed data (100 hydrants + 300 signs in Sibiu), DB_VERSION constant (bump on schema changes)
- `server/auth.js` — Passport Google OAuth + auto-admin for bogdansarac@gmail.com + whitelist check
- `server/routes/auth.js` — Login/logout/user preferences (prompt: select_account for multi-account)
- `server/routes/projects.js` — Project CRUD + project members (invite/role/remove)
- `server/routes/markers.js` — Marker CRUD with project-level access control (admin=edit, viewer=read)
- `server/routes/uploads.js` — Image upload with multer
- `server/routes/admin.js` — Super admin panel: users, whitelist, contact requests, app settings, DB version check + reset, quota management, API usage reports + logs, system status (CPU/RAM/Disk)
- `server/routes/markerTypes.js` — Custom marker type CRUD
- `public/index.html` — SPA HTML (login, unauthorized, expired, dashboard, admin panel, ads, API keys modal, usage modal)
- `public/css/style.css` — Full CSS with dark/light theme via CSS vars
- `public/js/app.js` — Main controller, project role enforcement, usage modal with daily/monthly quota, API keys modal
- `public/js/map.js` — Google Maps: search (Geocoding API), SVG→PNG marker rendering, right-click context menu, move mode, POI toggle, rate limit check, session caching
- `public/js/markers.js` — Sidebar list (all/in-view toggle, scrollable), create/edit modal, icon picker with tabs, PDF export
- `public/robots.txt` — SEO: crawler directives (allow /, block /api/ /auth/ /uploads/)
- `public/sitemap.xml` — SEO: sitemap with hreflang alternates (en/ro/de/fr)
- `public/js/projects.js` — Project management modal with members panel (invite by email, role change)
- `public/js/icons.js` — SVGs: 10 avatars, 55 road signs, 24 firefighter icons, 5 default markers
- `public/js/i18n.js` — Translations: EN, RO, DE, FR (all keys in all languages)
- `public/js/theme.js` — Dark/light mode
- `public/js/admin.js` — Super admin panel, splash overlay (video reward), access control, admin/user role toggle, DB reset, API usage tab with per-user quota table + reset + log, system status tab
- `public/js/markerTypes.js` — Custom marker type management
- `Dockerfile` — Node 20 Alpine, non-root user, dumb-init, health check
- `docker-compose.yml` — Hardened: read-only fs, no-new-privileges, cap_drop ALL, memory/cpu limits
- `deploy.sh` — Git pull + docker rebuild script
- `dsip.service` — Systemd unit for auto-start on boot
- `nginx-maps.djooga.com.conf` — Nginx config template (certbot manages SSL)

## Database Schema
- `users` — Google OAuth users (google_id, email, name, avatar, locale, theme, role, is_approved, subscription_until, ad_free_until)
- `projects` — User projects (name, description, avatar_index, icon_type, is_public, center_lat, center_lng, default_zoom)
- `project_members` — Project-level roles (user_email, user_id, project_id, role: admin/viewer, invited_by)
- `markers` — Geolocated markers with metadata (lat/lng, icon_type, icon_index, status, condition, dates, cost, responsible, custom_data JSON)
- `marker_images` — Uploaded photos linked to markers
- `marker_types` — Custom marker types per user (svg_data, scope: all/project)
- `api_usage` — Per-user, per-type, per-day API call tracking (maps_load, geocode)
- `api_log` — Detailed per-request API log with key_source (system/custom) for admin audit
- `user_api_keys` — User's own Google Maps API keys (maps_api_key, is_active)
- `user_quota` — Per-user quota overrides from admin resets (daily_limit_override, daily_limit_date, monthly_limit_override, monthly_limit_period)
- `geocache` — Server-side geocoding result cache
- `whitelist` — Allowed email addresses (removed after user creates account)
- `contact_requests` — Access/renewal requests from unauthorized/expired users (acknowledged flag)
- `app_settings` — Key-value admin settings (api_daily_limit_per_user, api_monthly_limit_per_user, ad timers, promo_video_urls, ad_free_extension_minutes, monthly quotas, db_version)

## User Roles & Access
- **Super Admin**: bogdansarac@gmail.com — auto-assigned on first login, always admin, bypasses whitelist and rate limits, only one who sees Admin Panel button
- **User**: Regular user, needs to be in whitelist to login, sees ads (unless ad_free_until is future), subject to daily + monthly API rate limits
- **Project roles**: Project creator = project admin. Any project admin can invite Gmail addresses as admin or viewer. Viewer = read-only (no edit buttons, no admin mode, no right-click to add markers). Server enforces this on API level too.
- **Admin/User toggle**: Super admin can switch to "USER" view in header to test user experience (sees ads, rate limits don't apply but UI behaves as user)
- **Inactive users**: Super admin can set is_approved=0 → user cannot access platform

## Public Projects
- Super admin can mark any project as `is_public` (toggle via admin API)
- **Unauthenticated users** see public projects in the dropdown and can view them
- Public view uses **Leaflet + OpenStreetMap** (100% free, zero Google API calls)
- Login button in header (where user menu would be), not a blocking overlay
- Sidebar shows read-only marker list; click marker = zoom on Leaflet map
- All API-consuming controls hidden: search, geocoding, admin mode, POI toggle
- **Zero cost**: no Google Maps JS API, no geocoding, no Places API for public view
- After login: switches to Google Maps with full features

## Access Control Flow
1. Unauthenticated user → sees dashboard layout with public projects (Leaflet map, zero API cost)
2. User clicks "Sign in with Google" → always shows account picker (prompt: select_account)
3. Auth checks: is email in whitelist OR existing user? If not → create user with is_approved=0
4. If not approved → "Acces Restricționat" page with contact form, NO map loaded (0 API cost)
5. If subscription_until expired → "Abonament Expirat" page with renewal request form
6. If approved + active subscription → Dashboard with Google Maps
7. Super admin (bogdansarac@gmail.com) always passes all checks

## Security
- **Security headers**: X-Frame-Options SAMEORIGIN, X-Content-Type-Options nosniff, Referrer-Policy strict-origin, Permissions-Policy, HSTS in production, X-XSS-Protection 0 (deprecated, CSP recommended)
- **Session cookies**: httpOnly, sameSite: lax, secure in production
- **Session fixation**: Session regenerated after OAuth login (`req.session.regenerate`)
- **Session secret**: Production fails to start if `SESSION_SECRET` env var is missing
- **Rate limiting**: Global 120 req/min per IP, strict 30/15min for contact form, 60/min for public projects. Nginx: `limit_req_zone` in `http{}` block, `limit_req zone=dsip burst=50 nodelay` per server
- **Server-side authorization**: `requireApproved` middleware on all protected routes — checks `is_approved` + `subscription_until` (not just client-side)
- **API key protection**: `/api/config` returns empty key for unauthenticated, unapproved, or expired users
- **CSRF prevention**: SameSite cookie attribute (lax) prevents cross-site request forgery
- **XSS prevention**: All user-controlled data escaped via `escHtml()` before innerHTML insertion. Each JS module has its own `escHtml()` method. Custom SVG marker types rendered via `<img src="data:image/svg+xml,...">` (sandboxed, no script execution). Toast messages use `textContent`. SQL queries parameterized.
- **YouTube embed**: Proper allow attributes. postMessage origin check uses strict `=== 'https://www.youtube.com'`. postMessage send also targets `'https://www.youtube.com'` (not wildcard `'*'`)
- **Docker**: Non-root, read-only fs, dropped capabilities, no-new-privileges, resource limits
- **Uploads**: Scoped per user (`/uploads/:userId`), auth + ownership check. Allowed: jpg, jpeg, png, gif, webp (NO svg — XSS vector). Both file extension AND MIME type validated against allowlists.
- **Admin settings**: `PUT /api/admin/settings` validates keys against an allowlist (prevents arbitrary key injection)
- **Usage tracking**: `/api/usage/increment` validates `type` against allowlist (`maps_load`, `geocode`, `places`). Legacy endpoint deprecated (410 Gone)
- **Contact form**: Email format validated, field lengths capped (name: 200, message: 2000)
- **Geocache**: LIKE metacharacters (`%`, `_`) escaped to prevent cache enumeration
- **API usage data**: `/api/usage` returns per-user breakdown only to admin role
- **JSON body limit**: 1MB for both JSON and URL-encoded bodies
- **Nginx hardening**: `server_tokens off`, security headers repeated in static asset location block, `proxy_hide_header X-Powered-By`, buffer limits, TLSv1/1.1 removed (only TLSv1.2+TLSv1.3)
- **SPA fallback**: GET `*` returns 404 JSON for `/api/*` and `/auth/*` routes instead of serving index.html
- **Global error handler**: Express error middleware catches unhandled errors, returns generic 500 JSON (no stack traces)
- **Error message sanitization**: API key validation and other error responses don't expose internal details (Google API error messages, exception stack traces)
- **Input validation**: Marker coordinates validated (type, range -90/90 -180/180). Status/condition/priority validated against enum allowlists. Marker type scope validated ('all'/'project'). Email type-checked before string operations.
- **IDOR prevention**: Project member update/delete verifies memberId exists in the specified project before modifying
- **Video URL validation**: Only YouTube (youtube.com/youtu.be) and direct video files (mp4/webm/ogg) over HTTP/HTTPS are allowed. Unknown format iframe fallback removed.
- **Project access control**: GET/PUT project routes check both owner AND project members (not owner-only). DELETE is owner-only. Members with admin role can edit project settings.

## API Rate Limiting & Quotas
- **Daily quota**: default 10/day per user, configurable from admin
- **Monthly quota**: default 300/month per user, configurable from admin
- Rate limit checked BEFORE loading Google Maps and BEFORE each geocode request
- If daily limit exceeded → map doesn't load (shows "quota exhausted"), search blocked
- If monthly limit exceeded → similar message, contact admin
- Super admin bypasses ALL rate limits
- Users with custom API keys bypass rate limits (use their own Google quota)
- **Session caching**: `sessionStorage` prevents re-counting maps_load within same browser session
- **View-only mode**: If quota exceeded but Maps JS is cached in browser, map loads in view-only (no search/geocoding)
- **Admin quota reset**: Super admin can reset daily or monthly quota per user or all users
  - Logic: `new_limit = max(current_limit, used + default_limit)` — ensures user gets full allowance from now, no stacking
  - Example: user at 3/10 daily → admin resets → 3/13 (user has 10 remaining). Reset again → still 3/13
- Tracks: maps_load, geocode per user per day in `api_usage` table (count = count + 1)
- Detailed log in `api_log` table: each call with user, type, key_source (system/custom), timestamp
- Super admin header shows: M:used/limit | G:used/limit | $cost/$credit
- Usage modal shows per-user daily/monthly quota with progress bars
- Cost display: $7/1000 maps_load, $5/1000 geocode, $200/month Google free credit

## User Custom API Keys
- Users can bring their own Google Maps API key to bypass system rate limits
- Menu: User dropdown → "API Keys" → modal with key input, toggle, delete
- Key validation: must start with `AIza` (Google API key format)
- When active: Maps JS API loads with user's key, geocoding uses user's key, no system rate limits
- Key stored in `user_api_keys` table, only last 6 chars shown in UI (preview)
- User must: create Google Cloud project, enable Maps JS API + Geocoding API, create API key, add `maps.djooga.com/*` to HTTP referrer restrictions
- Admin sees in API Usage tab which users have custom keys
- All usage still tracked in `api_usage` and `api_log` (for admin visibility)

## Marker Icon Rendering
- SVG icons are converted to PNG via Canvas at runtime (SVG → Blob → Image → Canvas → PNG data URL)
- Rendered at 80x80px for crisp display at 40x40px on map
- Cached in memory (_iconCache) — only rendered once per icon type
- Fixes Google Maps SVG scaling issues at different zoom levels

## Ads & Monetization System
- **Google AdSense** publisher: `ca-pub-8858656137000126`
- Sidebar slot: `1236361551` — only AdSense placement (shown alongside real content = compliant)
- All AdSense config in `.env` file only (not in admin panel)
- Ads shown only to non-ad-free users. Super admin with ADMIN toggle = no ads. With USER toggle = sees ads.
- **Splash overlay (video reward)**:
  - Two-column layout: left = logo + countdown + close button, right = video player
  - Appears every N minutes (default 5), countdown M seconds (default 10). Configurable from Admin Panel.
  - **Video list**: admin sets multiple YouTube/MP4 URLs (one per line), one shown randomly
  - Video starts PAUSED — user must click play (AdSense compliant, no forced autoplay)
  - **Reward**: If user clicks play → `ad_free_until` extended by N minutes (default 30, configurable)
  - Shows "Mulțumim! Fără reclame până la HH:MM" in splash + toast notification
  - YouTube play detected via postMessage API (`enablejsapi=1`), direct video via `play` event
  - NO AdSense in splash overlay (removed — blocking overlays violate AdSense policy)
  - Close button enabled after countdown, stops video, restarts timer
- Map auto-resizes when ads sidebar appears/disappears (ResizeObserver)
- **AdSense verification**: `djooga.com` has verification snippet at `/var/www/djooga.com/index.html`

## PDF Export
- Button in sidebar header (PDF icon next to Markers title)
- Generates landscape A4 PDF using jsPDF + autoTable plugin (CDN loaded)
- Content: project name header, applied filters, full marker table (title, status, condition, responsible, cost, dates, coordinates)
- Respects current sidebar filters (status, condition, search text)
- File name: `ProjectName_markers_YYYY-MM-DD.pdf`
- All labels use i18n translations

## Database Versioning
- `DB_VERSION` constant in `server/db.js` (currently 3) — increment when schema changes
- Stored in `app_settings` key `db_version` on every server start
- Admin Panel > Settings shows version match/mismatch with warning when outdated
- "Resetare Baza de Date" button: super admin only, double-confirm, deletes `data/dsip.db`, creates fresh schema + seed
- Endpoints: `GET /api/admin/db-version`, `POST /api/admin/db-reset`

## SEO
- `public/robots.txt` — allows /, disallows /api/, /auth/, /uploads/, /data/
- `public/sitemap.xml` — with hreflang alternates (en, ro, de, fr)
- 5 JSON-LD schemas in `<head>`: WebApplication, Organization, FAQPage, BreadcrumbList
- Extended meta tags: 50+ keywords, hreflang, Open Graph with locales, Twitter card
- Full landing page below login hero (visible to Google crawlers):
  - Feature grid (9 cards), use cases (4 articles), how it works (4 steps), visible FAQ (6 items), SEO footer
- Semantic HTML: header, main, section, article, footer, details
- Google Search Console: domain property verified via DNS TXT record

## Seed Data
- On DB creation, auto-creates: super admin user (bogdansarac@gmail.com), 2 projects with Sibiu center (45.7983, 24.1256, zoom 14):
  - "Pompieri Sibiu" — 100 hydrant markers across Sibiu streets
  - "Semne Rutiere Sibiu" — 300 road sign markers across Sibiu streets
- Realistic data: street names, statuses (active/inactive/maintenance), conditions, costs, dates, responsible persons

## Google Analytics
- **GA4 Property**: Measurement ID `G-JF9J8WD5N8`
- Configured via `GOOGLE_ANALYTICS_ID` in `.env`
- Script injected dynamically in `app.js` on init (from `/api/config` response)
- Tracks all visitors (authenticated + unauthenticated public project viewers)
- Free tier (no cost)

## Admin System Status Tab
- Super admin only — tab "System" in admin panel
- Endpoint: `GET /api/admin/system-status`
- Shows: CPU usage %, RAM usage %, Disk usage % (with progress bars)
- System info: platform, hostname, uptime, Node.js version, PID, process RSS
- Auto-refreshes every 10 seconds while tab is open
- Disk info uses `df` command (works on Linux/Docker, shows 0% on Windows dev)

## Environment Variables (.env) — NOT IN GIT
```
GOOGLE_CLIENT_ID=             # OAuth 2.0 client ID
GOOGLE_CLIENT_SECRET=         # OAuth 2.0 client secret
GOOGLE_MAPS_API_KEY=          # Maps JavaScript API + Geocoding API key
GOOGLE_MAPS_DAILY_LIMIT=900   # Global daily map load quota
GOOGLE_ADS_CLIENT=            # AdSense publisher ID (ca-pub-XXXX)
GOOGLE_ADS_SLOT_SIDEBAR=      # AdSense ad unit slot ID for sidebar
GOOGLE_ADS_SLOT_SPLASH=       # AdSense ad unit slot ID for splash screen
GOOGLE_ANALYTICS_ID=          # GA4 Measurement ID (G-XXXXXXXXXX)
SESSION_SECRET=               # Express session secret (REQUIRED in production)
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
- **Disk**: 145G total, ~46G used (32%)
- **SSH users**: `jooga` and `djooga` only — root login disabled, password login disabled
- **App user**: `djooga` (has sudo rights)
- **App dir**: /home/djooga/maps
- **Domain**: maps.djooga.com
- **Port**: 1978 (internal, nginx proxies from 443)

### Other apps on same server
- **Volley Stats**: volley.djooga.com → 127.0.0.1:1976, dir /home/djooga/volley, systemd volley.service
- **Jooga Web/API**: test.djooga.com → 3000/3001, dir /home/djooga/jooga-app (HTTP only, no SSL)
- **AdSense verify**: djooga.com → static /var/www/djooga.com

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
- **XSS prevention**: ALWAYS escape user-controlled data before innerHTML insertion. Each module (App, Markers, Projects, MarkerTypes, AdminPanel, MapManager) has an `escHtml()` method. For custom SVG data, render via `<img src="data:image/svg+xml,...">` (sandboxed). For toast messages, use `textContent` not `innerHTML`.
