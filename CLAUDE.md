# DSIP MapManager

## Overview
Node.js client-server application for geographic project management with Google Maps. Users authenticate via Google OAuth, create projects, and manage geolocated markers (fire hydrants, road signs, infrastructure).

## Architecture
- **Backend**: Express.js + Passport (Google OAuth) + SQLite (sql.js — pure JS, no native compilation)
- **Frontend**: Vanilla JS SPA with multiple views (login, unauthorized, expired, dashboard)
- **Database**: SQLite at `data/dsip.db`, sessions as files at `data/sessions/`
- **File uploads**: Per-user directories in `uploads/{userId}/`

## Key Files
- `server.js` — Express app entry, middleware, routes, session config
- `server/db.js` — SQLite schema, query helpers, seed data
- `server/auth.js` — Passport Google OAuth + auto-admin for bogdansarac@gmail.com
- `server/routes/auth.js` — Login/logout/user preferences
- `server/routes/projects.js` — Project CRUD
- `server/routes/markers.js` — Marker CRUD with bounds query
- `server/routes/uploads.js` — Image upload with multer
- `server/routes/admin.js` — Admin panel: users, contact requests, app settings
- `server/routes/markerTypes.js` — Custom marker type CRUD
- `public/index.html` — SPA HTML (login, unauthorized, expired, dashboard, admin panel, ads)
- `public/css/style.css` — Full CSS with dark/light theme
- `public/js/app.js` — Main controller
- `public/js/map.js` — Google Maps: search (Geocoding API), markers, right-click context menu, move mode, POI toggle
- `public/js/markers.js` — Sidebar list (all/in-view toggle), create/edit modal, icon picker with tabs
- `public/js/projects.js` — Project management modal
- `public/js/icons.js` — SVGs: 10 avatars, 55 road signs, 24 firefighter icons, 5 default markers
- `public/js/i18n.js` — Translations: EN, RO, DE, FR
- `public/js/theme.js` — Dark/light mode
- `public/js/admin.js` — Admin panel, ads system, access control, role toggle
- `public/js/markerTypes.js` — Custom marker type management

## Database Schema
- `users` — Google OAuth users (google_id, email, name, avatar, locale, theme, role, is_approved, subscription_until, ad_free_until)
- `projects` — User projects (name, description, avatar_index, icon_type)
- `project_members` — Project-level roles (user_id, project_id, role: admin/viewer)
- `markers` — Geolocated markers with metadata (lat/lng, icon, status, condition, dates, cost, responsible, custom_data JSON)
- `marker_images` — Uploaded photos linked to markers
- `marker_types` — Custom marker types per user (svg_data, scope: all/project)
- `api_usage` — Per-user, per-type, per-day API call tracking (maps_load, geocode)
- `geocache` — Server-side geocoding result cache
- `contact_requests` — Access/renewal requests from unauthorized/expired users
- `app_settings` — Key-value admin settings (ad timers, AdSense config, video URL)

## User Roles & Access
- **Super Admin**: bogdansarac@gmail.com — auto-assigned on first login, always admin
- **Admin**: Can access admin panel, manage users, approve accounts, set subscriptions
- **User**: Regular user, sees ads (unless ad_free_until is future), needs approval
- **Project roles**: Project creator = project admin. Can invite Gmail addresses as admin or viewer. Viewer = read-only, admin = can edit markers.
- **Admin/User toggle**: Admin can switch to "USER" view in header to test user experience (sees ads, etc.)

## Access Control Flow
1. User logs in with Google
2. If not approved (is_approved=0) → "Acces Restricționat" page with contact form, NO map loaded
3. If subscription_until expired → "Abonament Expirat" page with renewal form
4. If approved + active subscription → Dashboard

## Ads System
- **Google AdSense** publisher: `ca-pub-8858656137000126`
- Sidebar slot: `1236361551`, Splash slot: `9820382402`
- Ads shown only to non-ad-free users. Admin with ADMIN toggle = no ads. Admin with USER toggle = sees ads.
- Splash screen: every N minutes (default 5), countdown of M seconds (default 10). All configurable from Admin Panel > Settings.
- Promo video URL configurable from admin.
- **IMPORTANT**: AdSense only works on approved domains, NOT localhost. Site `djooga.com` must be added in AdSense console, then `maps.djooga.com` (subdomain) will serve ads automatically.

## API Rate Limiting
- Default: 10 API calls per user per day (configurable by super admin)
- Tracks: maps_load, geocode
- Cost display: $7/1000 maps_load, $5/1000 geocode, $17/1000 places
- $200/month Google free credit

## Seed Data
- On DB reset, auto-creates: super admin user, "Pompieri Sibiu" project with 100 hydrant markers, "Semne Rutiere Sibiu" project with 300 road sign markers — all in Sibiu city area

## Environment Variables (.env)
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` — OAuth 2.0 credentials
- `GOOGLE_MAPS_API_KEY` — Maps JavaScript API + Geocoding API key
- `GOOGLE_MAPS_DAILY_LIMIT` — Daily map load quota (default 900)
- `GOOGLE_ADS_CLIENT` — AdSense publisher ID (ca-pub-XXXX)
- `GOOGLE_ADS_SLOT_SIDEBAR` / `GOOGLE_ADS_SLOT_SPLASH` — Ad unit slot IDs
- `SESSION_SECRET` — Express session secret
- `PORT` / `BASE_URL` — Server config

## Deployment (planned)
- Domain: `maps.djooga.com`
- Server: nginx reverse proxy on existing machine
- Need to add `djooga.com` in AdSense Sites for ad approval
- Add verification snippet to `djooga.com` main page
- `maps.djooga.com` nginx block → proxy_pass to Node.js app

## Google Cloud Setup
1. console.cloud.google.com → create project
2. Enable: Maps JavaScript API, Geocoding API
3. OAuth 2.0 credentials (callback: `{BASE_URL}/auth/google/callback`)
4. API key (restrict to Maps JS, Geocoding)
5. Billing ($200/month free credit covers all usage)

## Coding Conventions
- Server: CommonJS (`require`), Express middleware pattern
- Client: IIFE-style globals on `window` (App, Theme, I18n, Icons, MapManager, Projects, Markers, AdminPanel, MarkerTypes)
- CSS: Custom properties for theming, BEM-ish class names
- i18n: `data-i18n` attributes on HTML elements, `I18n.t('key')` in JS code. **IMPORTANT**: When adding ANY new user-visible text, ALWAYS add it to ALL 4 languages (en, ro, de, fr) in `public/js/i18n.js`. Never hardcode strings in Romanian or any language — always use i18n keys.
- sql.js: in-memory DB with immediate save to disk on every write
