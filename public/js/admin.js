// ============================
// Admin Panel + Ads + Access Control
// ============================
window.AdminPanel = {
  viewingAsAdmin: true, // toggle state
  adSplashTimer: null,
  settings: {},

  // ============ INIT ============
  async init() {
    // Load public settings
    try {
      const r = await fetch('/api/public-settings');
      if (r.ok) this.settings = await r.json();
    } catch {}

    const user = App.user;
    const isAdmin = user.role === 'admin';

    // --- Admin toggle + super admin panel ---
    const isSuperAdmin = isAdmin && user.email === 'bogdansarac@gmail.com';
    if (isAdmin) {
      document.getElementById('admin-role-toggle').classList.remove('hidden');
      // Admin panel only for super admin
      if (isSuperAdmin) {
        document.getElementById('btn-admin-panel').classList.remove('hidden');
      }

      const chk = document.getElementById('chk-admin-view');
      chk.checked = true;
      this.viewingAsAdmin = true;

      chk.addEventListener('change', () => {
        this.viewingAsAdmin = chk.checked;
        document.getElementById('admin-role-label').textContent = chk.checked ? 'ADMIN' : 'USER';
        document.getElementById('admin-role-label').style.color = chk.checked ? 'var(--warning)' : 'var(--text-tertiary)';
        this.applyAdVisibility();
      });

      document.getElementById('btn-admin-panel').addEventListener('click', () => this.openPanel());
    }

    // --- Access control ---
    if (!user.is_approved) {
      // Not approved → show unauthorized page
      this.showUnauthorized(user);
      return false;
    }

    if (user.subscription_until && new Date(user.subscription_until) < new Date()) {
      // Subscription expired
      this.showExpired(user);
      return false;
    }

    // --- Ads system ---
    this.applyAdVisibility();

    return true; // access granted
  },

  // ============ ACCESS CONTROL ============
  showUnauthorized(user) {
    document.getElementById('view-dashboard').classList.remove('active');
    document.getElementById('view-unauthorized').classList.add('active');
    document.getElementById('unauth-email').textContent = user.email;

    document.getElementById('btn-send-contact').addEventListener('click', async () => {
      const name = document.getElementById('contact-name').value;
      const message = document.getElementById('contact-message').value;
      await fetch('/api/contact-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email, name, message })
      });
      document.getElementById('btn-send-contact').disabled = true;
      document.getElementById('contact-sent-msg').style.display = '';
    });
  },

  showExpired(user) {
    document.getElementById('view-dashboard').classList.remove('active');
    document.getElementById('view-expired').classList.add('active');
    document.getElementById('expired-date').textContent = user.subscription_until;

    document.getElementById('btn-send-expired').addEventListener('click', async () => {
      const message = document.getElementById('expired-message').value;
      await fetch('/api/contact-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email, name: user.name, message: '[RENEWAL] ' + message })
      });
      document.getElementById('btn-send-expired').disabled = true;
      document.getElementById('expired-sent-msg').style.display = '';
    });
  },

  // ============ ADS ============
  isAdFree() {
    // Only super admin viewing as ADMIN is ad-free
    if (App.user?.role === 'admin' && this.viewingAsAdmin && App.user?.email === 'bogdansarac@gmail.com') return true;
    if (App.user?.ad_free_until && new Date(App.user.ad_free_until) > new Date()) return true;
    return false;
  },

  applyAdVisibility() {
    const adFree = this.isAdFree();
    const sidebar = document.getElementById('ads-sidebar');
    const collapseBtn = document.getElementById('btn-collapse-ads');
    const expandBtn = document.getElementById('btn-expand-ads');

    // Check if user has a VALID ad_free_until date in the future
    const hasValidAdFree = App.user?.ad_free_until && new Date(App.user.ad_free_until) > new Date();
    // Super admin with ADMIN toggle
    const isSuperAdminMode = App.user?.role === 'admin' && this.viewingAsAdmin && App.user?.email === 'bogdansarac@gmail.com';

    if (isSuperAdminMode) {
      // Super admin ADMIN mode — collapsed, can expand
      sidebar.classList.add('hidden');
      expandBtn.classList.remove('hidden');
      collapseBtn.classList.remove('hidden');
      this.stopSplashTimer();
      this._initAdsToggle();
    } else if (hasValidAdFree) {
      // User has ad-free time remaining — collapsed, CAN expand
      sidebar.classList.add('hidden');
      expandBtn.classList.remove('hidden');
      collapseBtn.classList.remove('hidden');
      this.stopSplashTimer();
      this._initAdsToggle();
    } else {
      // No ad-free (or expired) — sidebar ALWAYS open, CANNOT minimize
      sidebar.classList.remove('hidden');
      expandBtn.classList.add('hidden');
      collapseBtn.classList.add('hidden');
      this.initAds();
      this.startSplashTimer();
    }
    // Notify maps to resize
    setTimeout(() => {
      if (MapManager.map && window.google?.maps) google.maps.event.trigger(MapManager.map, 'resize');
      if (App._leafletMap) App._leafletMap.invalidateSize();
    }, 300);
  },

  _adsToggleWired: false,
  _initAdsToggle() {
    if (this._adsToggleWired) return;
    this._adsToggleWired = true;
    const sidebar = document.getElementById('ads-sidebar');
    const collapseBtn = document.getElementById('btn-collapse-ads');
    const expandBtn = document.getElementById('btn-expand-ads');

    collapseBtn.addEventListener('click', () => {
      sidebar.classList.add('hidden');
      expandBtn.classList.remove('hidden');
      setTimeout(() => {
        if (MapManager.map && window.google?.maps) google.maps.event.trigger(MapManager.map, 'resize');
        if (App._leafletMap) App._leafletMap.invalidateSize();
      }, 150);
    });

    expandBtn.addEventListener('click', () => {
      sidebar.classList.remove('hidden');
      expandBtn.classList.add('hidden');
      this.initAds();
      setTimeout(() => {
        if (MapManager.map && window.google?.maps) google.maps.event.trigger(MapManager.map, 'resize');
        if (App._leafletMap) App._leafletMap.invalidateSize();
      }, 150);
    });
  },

  initAds() {
    // AdSense (optional — may not be approved yet)
    const client = this.settings.google_ads_client;
    if (client) {
      if (!document.getElementById('adsense-script')) {
        const s = document.createElement('script');
        s.id = 'adsense-script';
        s.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${client}`;
        s.async = true;
        s.crossOrigin = 'anonymous';
        document.head.appendChild(s);
      }
      const sidebarSlot = this.settings.google_ads_slot_sidebar;
      if (sidebarSlot) {
        const ins = document.querySelector('#ad-slot-sidebar .adsbygoogle');
        if (ins && !ins.dataset.configured) {
          ins.dataset.adClient = client;
          ins.dataset.adSlot = sidebarSlot;
          ins.dataset.configured = '1';
          try { (window.adsbygoogle = window.adsbygoogle || []).push({}); } catch {}
        }
      }
    }

    // Promo video (from video list or single URL)
    let videoUrl = null;
    try {
      const urls = JSON.parse(this.settings.promo_video_urls || '[]');
      if (Array.isArray(urls) && urls.length > 0) {
        const valid = urls.filter(u => u && u.trim());
        if (valid.length > 0) videoUrl = valid[0].trim(); // Show first video in sidebar
      }
    } catch {}
    if (!videoUrl) videoUrl = this.settings.promo_video_url || null;

    if (videoUrl) {
      const area = document.getElementById('promo-video-area');
      area.classList.remove('hidden');

      // Build video preview with play button
      const ytId = this._getYouTubeId(videoUrl);
      if (ytId) {
        area.innerHTML = `
          <div style="position:relative;border-radius:var(--radius-md);overflow:hidden;cursor:pointer;background:#000" id="sidebar-video-thumb">
            <img src="https://img.youtube.com/vi/${ytId}/mqdefault.jpg" style="width:100%;display:block;opacity:0.8" alt="Video">
            <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center">
              <span class="material-icons-round" style="font-size:48px;color:white;text-shadow:0 2px 8px rgba(0,0,0,0.5)">play_circle</span>
            </div>
          </div>`;
        area.querySelector('#sidebar-video-thumb').addEventListener('click', () => {
          // Open video in a small embedded player replacing thumbnail
          area.querySelector('#sidebar-video-thumb').innerHTML = `<iframe src="https://www.youtube.com/embed/${ytId}?autoplay=1&controls=1&modestbranding=1&rel=0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen style="width:100%;aspect-ratio:16/9;border:none;border-radius:var(--radius-md)"></iframe>`;
        });
      } else {
        area.innerHTML = `<a href="${videoUrl}" target="_blank" class="promo-video-link"><span class="material-icons-round">play_circle</span> Video</a>`;
      }
    }
  },

  startSplashTimer() {
    this.stopSplashTimer();
    const interval = parseInt(this.settings.ad_splash_interval_minutes) || 5;
    this.adSplashTimer = setTimeout(() => this.showSplash(), interval * 60 * 1000);
  },

  stopSplashTimer() {
    if (this.adSplashTimer) { clearTimeout(this.adSplashTimer); this.adSplashTimer = null; }
  },

  // Parse YouTube URL → embed ID
  _getYouTubeId(url) {
    if (!url) return null;
    const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|shorts\/))([a-zA-Z0-9_-]{11})/);
    return m ? m[1] : null;
  },

  // Get random video URL from list
  _getRandomVideoUrl() {
    // Try video list first
    try {
      const urls = JSON.parse(this.settings.promo_video_urls || '[]');
      if (Array.isArray(urls) && urls.length > 0) {
        const valid = urls.filter(u => u && u.trim());
        if (valid.length > 0) return valid[Math.floor(Math.random() * valid.length)].trim();
      }
    } catch {}
    // Fallback to single URL
    return this.settings.promo_video_url || null;
  },

  showSplash() {
    if (this.isAdFree()) return;

    const videoUrl = this._getRandomVideoUrl();
    if (!videoUrl) return; // No videos configured, skip splash

    const splash = document.getElementById('ad-splash');
    splash.classList.remove('hidden');

    const duration = parseInt(this.settings.ad_splash_duration_seconds) || 10;
    let remaining = duration;
    const btn = document.getElementById('btn-close-splash');
    const countdown = document.getElementById('splash-countdown');
    btn.disabled = true;
    countdown.textContent = remaining;

    const videoContainer = document.getElementById('splash-video-container');
    const rewardMsg = document.getElementById('splash-reward-msg');
    rewardMsg.classList.add('hidden');
    this._splashRewarded = false;

    // Build video (PAUSED — user must click play)
    const ytId = this._getYouTubeId(videoUrl);
    if (ytId) {
      // YouTube embed — NO autoplay, WITH controls, user clicks play
      videoContainer.innerHTML = `<iframe id="splash-yt-frame" src="https://www.youtube.com/embed/${ytId}?autoplay=0&controls=1&modestbranding=1&rel=0&showinfo=0&enablejsapi=1" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
      // Detect play via YouTube IFrame API postMessage
      this._setupYouTubePlayDetection();
    } else if (videoUrl.match(/\.(mp4|webm|ogg)(\?|$)/i)) {
      // Direct video file — NOT autoplaying, WITH controls
      videoContainer.innerHTML = `<video id="splash-direct-video" controls playsinline><source src="${videoUrl}"></video>`;
      const vid = document.getElementById('splash-direct-video');
      if (vid) vid.addEventListener('play', () => this._onVideoPlay(), { once: true });
    } else {
      // Unknown format — iframe
      videoContainer.innerHTML = `<iframe src="${videoUrl}" allow="encrypted-media" allowfullscreen></iframe>`;
    }

    // Clear any previous timer
    if (this._splashTick) clearInterval(this._splashTick);

    this._splashTick = setInterval(() => {
      remaining--;
      countdown.textContent = remaining;
      if (remaining <= 0) {
        clearInterval(this._splashTick);
        this._splashTick = null;
        btn.disabled = false;
      }
    }, 1000);

    // Close handler
    const closeHandler = () => {
      splash.classList.add('hidden');
      if (this._splashTick) { clearInterval(this._splashTick); this._splashTick = null; }
      // Stop video
      videoContainer.innerHTML = `<div class="splash-video-placeholder"><span class="material-icons-round" style="font-size:48px;opacity:0.4">play_circle</span><p>${I18n.t('ads.playToExtend')}</p></div>`;
      btn.removeEventListener('click', closeHandler);
      // Restart timer for next splash (only if not ad-free now)
      if (!this.isAdFree()) this.startSplashTimer();
    };
    btn.removeEventListener('click', this._splashCloseHandler);
    this._splashCloseHandler = closeHandler;
    btn.addEventListener('click', closeHandler);
  },

  // YouTube play detection via postMessage
  _setupYouTubePlayDetection() {
    const handler = (event) => {
      if (!event.origin.includes('youtube.com')) return;
      try {
        const data = JSON.parse(event.data);
        // YouTube IFrame API sends state changes: 1 = playing
        if (data.event === 'onStateChange' && data.info === 1) {
          this._onVideoPlay();
          window.removeEventListener('message', handler);
        }
        // Also detect infoDelivery with playerState
        if (data.event === 'infoDelivery' && data.info?.playerState === 1) {
          this._onVideoPlay();
          window.removeEventListener('message', handler);
        }
      } catch {}
    };
    window.addEventListener('message', handler);
    // Also try sending a "listening" command to the iframe
    setTimeout(() => {
      const iframe = document.getElementById('splash-yt-frame');
      if (iframe?.contentWindow) {
        iframe.contentWindow.postMessage('{"event":"listening","id":"1"}', '*');
      }
    }, 500);
  },

  // Called when user plays the video — reward with ad-free extension
  async _onVideoPlay() {
    if (this._splashRewarded) return;
    this._splashRewarded = true;

    try {
      const r = await fetch('/api/ad-free/extend', { method: 'POST' });
      if (r.ok) {
        const data = await r.json();
        // Update local user data
        App.user.ad_free_until = data.ad_free_until;

        // Show reward message in splash
        const rewardMsg = document.getElementById('splash-reward-msg');
        const rewardText = document.getElementById('splash-reward-text');
        const until = new Date(data.ad_free_until);
        const timeStr = until.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        rewardText.textContent = I18n.t('ads.thankYou', { time: timeStr });
        rewardMsg.classList.remove('hidden');

        // Show toast
        const toast = document.getElementById('adfree-toast');
        const toastText = document.getElementById('adfree-toast-text');
        toastText.textContent = I18n.t('ads.thankYou', { time: timeStr });
        toast.classList.remove('hidden');
        setTimeout(() => toast.classList.add('hidden'), 8000);

        // Re-evaluate ad visibility
        this.applyAdVisibility();
      }
    } catch (e) {
      console.error('Ad-free extend error:', e);
    }
  },

  // ============ ADMIN PANEL ============
  async openPanel() {
    App.openModal('modal-admin');
    this.initAdminTabs();
    this.loadUsers();
    this.loadMessages();
    this.loadSettings();
  },

  initAdminTabs() {
    document.querySelectorAll('.admin-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.admin-tab-content').forEach(c => c.classList.remove('active'));
        tab.classList.add('active');
        document.getElementById('admin-tab-' + tab.dataset.tab).classList.add('active');
        // Lazy-load API usage tab
        if (tab.dataset.tab === 'api-usage') this.loadApiUsage();
      });
    });
  },

  async loadUsers() {
    // Load whitelist + users
    const [usersRes, wlRes] = await Promise.all([
      fetch('/api/admin/users'),
      fetch('/api/admin/whitelist')
    ]);
    if (!usersRes.ok) return;
    const users = await usersRes.json();
    const whitelist = wlRes.ok ? await wlRes.json() : [];
    const container = document.getElementById('admin-users-list');

    // Whitelist section
    let html = `<div style="margin-bottom:20px">
      <h4 style="font-size:13px;font-weight:600;color:var(--text-secondary);margin-bottom:8px">
        <span class="material-icons-round" style="font-size:16px;vertical-align:middle">checklist</span> Whitelist (adrese permise să se conecteze)
      </h4>
      <div style="display:flex;gap:6px;margin-bottom:8px">
        <input id="wl-email" type="email" class="form-input" placeholder="adresa@gmail.com" style="flex:1;padding:6px 10px;font-size:13px">
        <button id="btn-add-wl" class="btn btn-sm btn-accent">+ Adaugă</button>
      </div>
      <div id="wl-list" style="display:flex;flex-wrap:wrap;gap:4px">
        ${whitelist.map(w => `
          <span class="wl-chip" style="display:inline-flex;align-items:center;gap:4px;padding:4px 10px;background:var(--bg-tertiary);border-radius:99px;font-size:12px">
            ${w.email}
            <button class="btn-icon wl-remove" data-id="${w.id}" style="padding:2px"><span class="material-icons-round" style="font-size:14px;color:var(--danger)">close</span></button>
          </span>
        `).join('')}
      </div>
    </div>`;

    // Users section
    const SUPER = 'bogdansarac@gmail.com';
    html += `<h4 style="font-size:13px;font-weight:600;color:var(--text-secondary);margin-bottom:8px">
      <span class="material-icons-round" style="font-size:16px;vertical-align:middle">people</span> Utilizatori
    </h4>`;

    html += users.map(u => {
      const isSuper = u.email === SUPER;
      const badge = isSuper ? '<span style="color:#e74c3c;font-size:10px;font-weight:700;background:rgba(231,76,60,0.1);padding:1px 6px;border-radius:99px">SUPER</span>'
        : u.role === 'admin' ? '<span style="color:var(--warning);font-size:10px;font-weight:700;background:rgba(245,158,11,0.1);padding:1px 6px;border-radius:99px">ADMIN</span>' : '';
      return `
      <div class="admin-user-row" data-id="${u.id}" style="${!u.is_approved ? 'opacity:0.5' : ''}">
        <div style="flex:1;min-width:0">
          <div style="font-weight:500">${u.name || 'N/A'} ${badge}</div>
          <div style="font-size:12px;color:var(--text-tertiary)">${u.email}</div>
        </div>
        <div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap">
          ${isSuper ? '' : `
            <label style="font-size:11px;display:flex;align-items:center;gap:4px;cursor:pointer" title="Activ/Inactiv">
              <input type="checkbox" class="usr-approved" data-id="${u.id}" ${u.is_approved ? 'checked' : ''}> Activ
            </label>
            <select class="usr-api-mode filter-select" data-id="${u.id}" style="width:90px;padding:2px 6px;font-size:10px" title="Google API mode">
              <option value="none" ${(u.google_api_mode || 'none') === 'none' ? 'selected' : ''}>OSM</option>
              <option value="system" ${u.google_api_mode === 'system' ? 'selected' : ''}>System</option>
              <option value="own" ${u.google_api_mode === 'own' ? 'selected' : ''}>Own Keys</option>
            </select>
            <select class="usr-role filter-select" data-id="${u.id}" style="width:80px;padding:2px 6px;font-size:11px">
              <option value="user" ${u.role === 'user' ? 'selected' : ''}>User</option>
              <option value="admin" ${u.role === 'admin' ? 'selected' : ''}>Admin</option>
            </select>
          `}
          <input type="date" class="usr-sub form-input" data-id="${u.id}" value="${u.subscription_until || ''}" style="width:130px;padding:4px 6px;font-size:11px" title="Abonament până la">
          <input type="date" class="usr-adfree form-input" data-id="${u.id}" value="${u.ad_free_until || ''}" style="width:130px;padding:4px 6px;font-size:11px" title="Fără reclame până la">
          ${isSuper ? '' : `<button class="btn btn-sm btn-accent usr-save" data-id="${u.id}">Save</button>`}
        </div>
      </div>`;
    }).join('');

    container.innerHTML = html;

    // Add to whitelist
    document.getElementById('btn-add-wl').addEventListener('click', async () => {
      const email = document.getElementById('wl-email').value.trim();
      if (!email) return;
      const r = await fetch('/api/admin/whitelist', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      if (r.ok) { App.toast('Adăugat în whitelist', 'success'); this.loadUsers(); }
      else { const e = await r.json(); App.toast(e.error || 'Eroare', 'error'); }
      document.getElementById('wl-email').value = '';
    });

    // Remove from whitelist
    container.querySelectorAll('.wl-remove').forEach(btn => {
      btn.addEventListener('click', async () => {
        await fetch(`/api/admin/whitelist/${btn.dataset.id}`, { method: 'DELETE' });
        this.loadUsers();
      });
    });

    // Save user
    container.querySelectorAll('.usr-save').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.dataset.id;
        const row = container.querySelector(`.admin-user-row[data-id="${id}"]`);
        const approvedCb = row.querySelector('.usr-approved');
        const apiModeSel = row.querySelector('.usr-api-mode');
        const roleSel = row.querySelector('.usr-role');
        await fetch(`/api/admin/users/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            is_approved: approvedCb ? (approvedCb.checked ? 1 : 0) : 1,
            google_api_mode: apiModeSel ? apiModeSel.value : undefined,
            role: roleSel ? roleSel.value : undefined,
            subscription_until: row.querySelector('.usr-sub').value || null,
            ad_free_until: row.querySelector('.usr-adfree').value || null
          })
        });
        App.toast('Utilizator actualizat', 'success');
      });
    });
  },

  async loadMessages() {
    const filter = document.getElementById('msg-filter').value;
    const url = filter !== '' ? `/api/admin/contacts?ack=${filter}` : '/api/admin/contacts';
    const res = await fetch(url);
    if (!res.ok) return;
    const msgs = await res.json();

    // Badge
    const unack = msgs.filter(m => !m.acknowledged).length;
    const badge = document.getElementById('msg-badge');
    if (unack > 0) { badge.textContent = unack; badge.classList.remove('hidden'); }
    else { badge.classList.add('hidden'); }

    const container = document.getElementById('admin-messages-list');
    if (msgs.length === 0) {
      container.innerHTML = '<div class="empty-state" style="padding:20px"><p>Niciun mesaj</p></div>';
      return;
    }

    container.innerHTML = msgs.map(m => `
      <div class="admin-msg-row ${m.acknowledged ? 'acked' : ''}">
        <div style="flex:1">
          <div style="font-weight:500">${m.name || m.email}</div>
          <div style="font-size:12px;color:var(--text-tertiary)">${m.email} · ${new Date(m.created_at).toLocaleString()}</div>
          <div style="font-size:13px;margin-top:4px">${m.message || '<em>fără mesaj</em>'}</div>
        </div>
        ${!m.acknowledged ? `<button class="btn btn-sm btn-accent msg-ack" data-id="${m.id}">✓ ACK</button>` : '<span style="color:var(--success);font-size:12px">✓</span>'}
      </div>
    `).join('');

    container.querySelectorAll('.msg-ack').forEach(btn => {
      btn.addEventListener('click', async () => {
        await fetch(`/api/admin/contacts/${btn.dataset.id}/ack`, { method: 'PUT' });
        this.loadMessages();
      });
    });

    document.getElementById('msg-filter').onchange = () => this.loadMessages();
  },

  async loadSettings() {
    const res = await fetch('/api/admin/settings');
    if (!res.ok) return;
    const s = await res.json();
    document.getElementById('set-api-limit').value = s.api_daily_limit_per_user || 10;
    document.getElementById('set-api-monthly-limit').value = s.api_monthly_limit_per_user || 300;
    document.getElementById('set-ad-interval').value = s.ad_splash_interval_minutes || 5;
    document.getElementById('set-ad-duration').value = s.ad_splash_duration_seconds || 10;
    document.getElementById('set-adfree-ext').value = s.ad_free_extension_minutes || 30;
    document.getElementById('set-quota-maps').value = s.monthly_free_quota_maps || 28500;
    document.getElementById('set-quota-geocode').value = s.monthly_free_quota_geocode || 40000;

    // Video URLs: parse JSON array to one-per-line textarea
    let videoUrls = '';
    try {
      const arr = JSON.parse(s.promo_video_urls || '[]');
      if (Array.isArray(arr)) videoUrls = arr.join('\n');
    } catch {}
    // Fallback: if old single URL exists and list is empty
    if (!videoUrls && s.promo_video_url) videoUrls = s.promo_video_url;
    document.getElementById('set-video-urls').value = videoUrls;

    document.getElementById('btn-save-settings').onclick = async () => {
      // Parse video URLs textarea to JSON array
      const urlLines = document.getElementById('set-video-urls').value.split('\n').map(l => l.trim()).filter(Boolean);

      await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_daily_limit_per_user: document.getElementById('set-api-limit').value,
          api_monthly_limit_per_user: document.getElementById('set-api-monthly-limit').value,
          ad_splash_interval_minutes: document.getElementById('set-ad-interval').value,
          ad_splash_duration_seconds: document.getElementById('set-ad-duration').value,
          ad_free_extension_minutes: document.getElementById('set-adfree-ext').value,
          monthly_free_quota_maps: document.getElementById('set-quota-maps').value,
          monthly_free_quota_geocode: document.getElementById('set-quota-geocode').value,
          promo_video_urls: JSON.stringify(urlLines),
          promo_video_url: urlLines[0] || ''
        })
      });
      App.toast(I18n.t('admin.settingsSaved'), 'success');
    };

    // DB version check
    try {
      const dbRes = await fetch('/api/admin/db-version');
      if (dbRes.ok) {
        const dbInfo = await dbRes.json();
        const infoEl = document.getElementById('db-version-info');
        if (dbInfo.needsReset) {
          infoEl.innerHTML = `<span style="color:var(--danger);font-weight:600">⚠ Versiune DB: ${dbInfo.dbVersion} → Cod: ${dbInfo.codeVersion} — RESET NECESAR</span>`;
        } else {
          infoEl.textContent = `Versiune DB: ${dbInfo.dbVersion} (la zi cu codul v${dbInfo.codeVersion})`;
        }
      }
    } catch {}

    // Reset DB button
    document.getElementById('btn-reset-db').onclick = async () => {
      const confirmed = confirm('ATENȚIE!\n\nAceastă acțiune va ȘTERGE toată baza de date curentă (utilizatori, proiecte, markeri, setări) și va recrea una nouă cu seed-ul implicit.\n\nEști sigur?');
      if (!confirmed) return;
      const confirmed2 = confirm('Ultima confirmare: chiar vrei să resetezi baza de date?');
      if (!confirmed2) return;

      try {
        const r = await fetch('/api/admin/db-reset', { method: 'POST' });
        if (r.ok) {
          App.toast('Baza de date a fost resetată! Se reîncarcă...', 'success');
          setTimeout(() => window.location.reload(), 1500);
        } else {
          const err = await r.json();
          App.toast(err.error || 'Eroare la resetare', 'error');
        }
      } catch (e) {
        App.toast('Eroare: ' + e.message, 'error');
      }
    };
  },

  // ============ API USAGE TAB ============
  async loadApiUsage() {
    const container = document.getElementById('admin-api-usage-content');
    container.innerHTML = `<p style="text-align:center;color:var(--text-tertiary)">${I18n.t('common.loading')}</p>`;

    try {
      const [quotaRes, logRes, usageRes] = await Promise.all([
        fetch('/api/admin/quota/users'),
        fetch('/api/admin/usage/log?limit=200'),
        fetch('/api/usage')
      ]);
      const quotaUsers = quotaRes.ok ? await quotaRes.json() : [];
      const logEntries = logRes.ok ? await logRes.json() : [];
      const usage = usageRes.ok ? await usageRes.json() : {};
      this._quotaUsers = quotaUsers;

      let html = '';

      // --- Platform Google API quota summary ---
      if (usage.monthlyQuota) {
        const mq = usage.monthlyQuota;
        html += `<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-bottom:20px">
          <div style="background:var(--bg-tertiary);padding:14px;border-radius:var(--radius-md)">
            <div style="font-size:11px;color:var(--text-tertiary);margin-bottom:4px">${I18n.t('admin.mapsLoadQuota')}</div>
            <div style="font-size:22px;font-weight:700;font-family:var(--font-mono);color:${mq.maps.pct > 80 ? 'var(--danger)' : 'var(--accent)'}">${mq.maps.used.toLocaleString()} / ${mq.maps.limit.toLocaleString()}</div>
            <div style="margin-top:6px;height:5px;background:var(--bg-secondary);border-radius:3px;overflow:hidden">
              <div style="height:100%;width:${Math.min(mq.maps.pct, 100)}%;background:${mq.maps.pct > 80 ? 'var(--danger)' : 'var(--accent)'};border-radius:3px"></div>
            </div>
          </div>
          <div style="background:var(--bg-tertiary);padding:14px;border-radius:var(--radius-md)">
            <div style="font-size:11px;color:var(--text-tertiary);margin-bottom:4px">${I18n.t('admin.geocodeQuota')}</div>
            <div style="font-size:22px;font-weight:700;font-family:var(--font-mono);color:${mq.geocode.pct > 80 ? 'var(--danger)' : 'var(--accent)'}">${mq.geocode.used.toLocaleString()} / ${mq.geocode.limit.toLocaleString()}</div>
            <div style="margin-top:6px;height:5px;background:var(--bg-secondary);border-radius:3px;overflow:hidden">
              <div style="height:100%;width:${Math.min(mq.geocode.pct, 100)}%;background:${mq.geocode.pct > 80 ? 'var(--danger)' : 'var(--accent)'};border-radius:3px"></div>
            </div>
          </div>
          <div style="background:var(--bg-tertiary);padding:14px;border-radius:var(--radius-md);text-align:center">
            <div style="font-size:11px;color:var(--text-tertiary);margin-bottom:4px">${I18n.t('admin.costThisMonth')}</div>
            <div style="font-size:22px;font-weight:700;font-family:var(--font-mono);color:var(--accent)">$${usage.totalCostUSD} / $${usage.creditUSD}</div>
            <div style="font-size:11px;color:var(--success);margin-top:4px">$${usage.remainingCreditUSD} ${I18n.t('admin.remaining')}</div>
          </div>
        </div>`;
      }

      // --- Reset all buttons ---
      html += `<div style="display:flex;gap:8px;margin-bottom:16px;flex-wrap:wrap">
        <button class="btn btn-sm btn-accent" id="btn-reset-all-daily"><span class="material-icons-round" style="font-size:16px">today</span> ${I18n.t('admin.resetAllDaily')}</button>
        <button class="btn btn-sm btn-secondary" id="btn-reset-all-monthly"><span class="material-icons-round" style="font-size:16px">date_range</span> ${I18n.t('admin.resetAllMonthly')}</button>
        <div style="flex:1"></div>
        <input id="quota-user-search" type="text" class="form-input" placeholder="${I18n.t('sidebar.search')}" style="width:200px;padding:4px 10px;font-size:12px">
      </div>`;

      // --- Per-user quota table ---
      html += `<div style="overflow-x:auto;margin-bottom:20px"><table style="width:100%;font-size:12px;border-collapse:collapse" id="quota-table">
        <thead><tr style="background:var(--bg-tertiary)">
          <th style="padding:8px;text-align:left">${I18n.t('common.name')}</th>
          <th style="padding:8px;text-align:center">${I18n.t('admin.dailyQuota')}</th>
          <th style="padding:8px;text-align:center">${I18n.t('admin.monthlyQuota')}</th>
          <th style="padding:8px;text-align:center">${I18n.t('userKeys.title')}</th>
          <th style="padding:8px;text-align:center">${I18n.t('admin.actions')}</th>
        </tr></thead><tbody id="quota-tbody">`;
      quotaUsers.forEach(u => { html += this._renderQuotaRow(u); });
      html += `</tbody></table></div>`;

      // --- Detailed API Log ---
      html += `<h4 style="font-size:13px;font-weight:600;color:var(--text-secondary);text-transform:uppercase;margin-bottom:8px">${I18n.t('admin.apiLog')}</h4>`;
      html += `<div style="max-height:300px;overflow-y:auto;border:1px solid var(--border);border-radius:var(--radius-md)">
        <table style="width:100%;font-size:11px;border-collapse:collapse">
          <thead style="position:sticky;top:0;background:var(--bg-tertiary)"><tr>
            <th style="padding:6px 8px;text-align:left">${I18n.t('admin.time')}</th>
            <th style="padding:6px 8px;text-align:left">${I18n.t('common.name')}</th>
            <th style="padding:6px 8px;text-align:left">Type</th>
            <th style="padding:6px 8px;text-align:center">${I18n.t('admin.keySource')}</th>
          </tr></thead><tbody>`;
      logEntries.forEach(l => {
        const time = new Date(l.created_at).toLocaleString();
        const keyBadge = l.key_source === 'custom'
          ? '<span style="color:var(--success);font-size:10px;font-weight:600;background:rgba(16,185,129,0.1);padding:1px 6px;border-radius:99px">CUSTOM</span>'
          : '<span style="color:var(--text-tertiary);font-size:10px">system</span>';
        html += `<tr style="border-bottom:1px solid var(--border)">
          <td style="padding:4px 8px;color:var(--text-tertiary);white-space:nowrap">${time}</td>
          <td style="padding:4px 8px">${l.name || l.email}</td>
          <td style="padding:4px 8px;font-family:var(--font-mono)">${l.type}</td>
          <td style="padding:4px 8px;text-align:center">${keyBadge}</td>
        </tr>`;
      });
      html += `</tbody></table></div>`;

      container.innerHTML = html;

      // --- Wire up events ---
      // Search filter
      document.getElementById('quota-user-search').addEventListener('input', (e) => {
        const q = e.target.value.toLowerCase();
        document.querySelectorAll('#quota-tbody tr').forEach(row => {
          const text = row.textContent.toLowerCase();
          row.style.display = text.includes(q) ? '' : 'none';
        });
      });

      // Reset all daily
      document.getElementById('btn-reset-all-daily').addEventListener('click', async () => {
        if (!confirm(I18n.t('admin.confirmResetAllDaily'))) return;
        const r = await fetch('/api/admin/quota/reset-daily', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
        const d = await r.json();
        App.toast(d.message, 'success');
        this.loadApiUsage();
      });

      // Reset all monthly
      document.getElementById('btn-reset-all-monthly').addEventListener('click', async () => {
        if (!confirm(I18n.t('admin.confirmResetAllMonthly'))) return;
        const r = await fetch('/api/admin/quota/reset-monthly', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
        const d = await r.json();
        App.toast(d.message, 'success');
        this.loadApiUsage();
      });

      // Per-user reset buttons
      container.querySelectorAll('.btn-reset-daily').forEach(btn => {
        btn.addEventListener('click', async () => {
          const uid = btn.dataset.userId;
          const r = await fetch('/api/admin/quota/reset-daily', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: uid })
          });
          const d = await r.json();
          App.toast(d.message, d.ok ? 'success' : 'warning');
          this.loadApiUsage();
        });
      });
      container.querySelectorAll('.btn-reset-monthly').forEach(btn => {
        btn.addEventListener('click', async () => {
          const uid = btn.dataset.userId;
          const r = await fetch('/api/admin/quota/reset-monthly', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: uid })
          });
          const d = await r.json();
          App.toast(d.message, d.ok ? 'success' : 'warning');
          this.loadApiUsage();
        });
      });

    } catch (e) {
      container.innerHTML = `<p style="color:var(--danger)">Error: ${e.message}</p>`;
    }
  },

  _renderQuotaRow(u) {
    const dailyPct = Math.min(100, Math.round(u.todayUsed / u.dailyLimit * 100));
    const monthPct = Math.min(100, Math.round(u.monthUsed / u.monthlyLimit * 100));
    const dailyColor = dailyPct >= 90 ? 'var(--danger)' : dailyPct >= 70 ? 'var(--warning)' : 'var(--accent)';
    const monthColor = monthPct >= 90 ? 'var(--danger)' : monthPct >= 70 ? 'var(--warning)' : 'var(--accent)';

    return `<tr style="border-bottom:1px solid var(--border)" data-user-id="${u.id}">
      <td style="padding:8px">
        <strong>${u.name || 'N/A'}</strong><br>
        <span style="font-size:10px;color:var(--text-tertiary)">${u.email}</span>
      </td>
      <td style="padding:8px;text-align:center;min-width:120px">
        <div style="font-family:var(--font-mono);font-weight:600;color:${dailyColor}">${u.todayUsed}/${u.dailyLimit}</div>
        <div style="height:4px;background:var(--bg-secondary);border-radius:2px;overflow:hidden;margin-top:3px">
          <div style="height:100%;width:${dailyPct}%;background:${dailyColor};border-radius:2px"></div>
        </div>
        ${u.dailyResetDone ? '<span style="font-size:9px;color:var(--success)">+reset</span>' : ''}
      </td>
      <td style="padding:8px;text-align:center;min-width:120px">
        <div style="font-family:var(--font-mono);font-weight:600;color:${monthColor}">${u.monthUsed}/${u.monthlyLimit}</div>
        <div style="height:4px;background:var(--bg-secondary);border-radius:2px;overflow:hidden;margin-top:3px">
          <div style="height:100%;width:${monthPct}%;background:${monthColor};border-radius:2px"></div>
        </div>
        ${u.monthlyResetDone ? '<span style="font-size:9px;color:var(--success)">+reset</span>' : ''}
      </td>
      <td style="padding:8px;text-align:center">
        ${u.hasCustomKey ? '<span style="color:var(--success);font-size:16px">&#10003;</span>' : '<span style="color:var(--text-tertiary)">-</span>'}
      </td>
      <td style="padding:8px;text-align:center">
        <div style="display:flex;gap:4px;justify-content:center">
          <button class="btn-icon btn-reset-daily" data-user-id="${u.id}" title="Reset Daily" style="padding:4px">
            <span class="material-icons-round" style="font-size:16px;color:var(--accent)">today</span>
          </button>
          <button class="btn-icon btn-reset-monthly" data-user-id="${u.id}" title="Reset Monthly" style="padding:4px">
            <span class="material-icons-round" style="font-size:16px;color:var(--warning)">date_range</span>
          </button>
        </div>
      </td>
    </tr>`;
  }
};
