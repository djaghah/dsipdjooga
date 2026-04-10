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
    if (App.user.role === 'admin' && this.viewingAsAdmin) return true;
    if (App.user.ad_free_until && new Date(App.user.ad_free_until) > new Date()) return true;
    return false;
  },

  applyAdVisibility() {
    const adFree = this.isAdFree();
    const sidebar = document.getElementById('ads-sidebar');
    if (adFree) {
      sidebar.classList.add('hidden');
      this.stopSplashTimer();
    } else {
      sidebar.classList.remove('hidden');
      this.initAds();
      this.startSplashTimer();
    }
    // Notify map to resize after ads sidebar toggled
    setTimeout(() => {
      if (MapManager.map && window.google?.maps) {
        google.maps.event.trigger(MapManager.map, 'resize');
      }
    }, 150);
  },

  initAds() {
    const client = this.settings.google_ads_client;
    if (!client) return;

    // Load AdSense script if not loaded
    if (!document.getElementById('adsense-script')) {
      const s = document.createElement('script');
      s.id = 'adsense-script';
      s.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${client}`;
      s.async = true;
      s.crossOrigin = 'anonymous';
      document.head.appendChild(s);
    }

    // Configure slots
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

    // Promo video
    const videoUrl = this.settings.promo_video_url;
    if (videoUrl) {
      document.getElementById('promo-video-area').classList.remove('hidden');
      const link = document.getElementById('promo-video-link');
      link.href = videoUrl;
      link.querySelector('span:last-child') || (link.innerHTML = '<span class="material-icons-round">play_circle</span> Urmărește Video');
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

  showSplash() {
    if (this.isAdFree()) return;
    const splash = document.getElementById('ad-splash');
    splash.classList.remove('hidden');

    const duration = parseInt(this.settings.ad_splash_duration_seconds) || 10;
    let remaining = duration;
    const btn = document.getElementById('btn-close-splash');
    const countdown = document.getElementById('splash-countdown');
    btn.disabled = true;
    countdown.textContent = remaining;

    // Reset button text
    const btnLabel = btn.querySelector('[data-i18n]');
    if (btnLabel) btnLabel.textContent = I18n.t('ads.continue');

    // Configure splash ad
    const client = this.settings.google_ads_client;
    const splashSlot = this.settings.google_ads_slot_splash;
    if (client && splashSlot) {
      const ins = document.querySelector('#ad-slot-splash .adsbygoogle');
      if (ins && !ins.dataset.configured) {
        ins.dataset.adClient = client;
        ins.dataset.adSlot = splashSlot;
        ins.dataset.configured = '1';
        try { (window.adsbygoogle = window.adsbygoogle || []).push({}); } catch {}
      }
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

    // Close handler (remove old, add new to avoid stacking)
    const closeHandler = () => {
      splash.classList.add('hidden');
      if (this._splashTick) { clearInterval(this._splashTick); this._splashTick = null; }
      btn.removeEventListener('click', closeHandler);
      this.startSplashTimer(); // restart timer for next splash
    };
    btn.removeEventListener('click', this._splashCloseHandler);
    this._splashCloseHandler = closeHandler;
    btn.addEventListener('click', closeHandler);
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
        const roleSel = row.querySelector('.usr-role');
        await fetch(`/api/admin/users/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            is_approved: approvedCb ? (approvedCb.checked ? 1 : 0) : 1,
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
    document.getElementById('set-api-total-limit').value = s.api_total_limit_per_user || 50;
    document.getElementById('set-ad-interval').value = s.ad_splash_interval_minutes || 5;
    document.getElementById('set-ad-duration').value = s.ad_splash_duration_seconds || 10;
    document.getElementById('set-video-url').value = s.promo_video_url || '';

    document.getElementById('btn-save-settings').onclick = async () => {
      await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_daily_limit_per_user: document.getElementById('set-api-limit').value,
          api_total_limit_per_user: document.getElementById('set-api-total-limit').value,
          ad_splash_interval_minutes: document.getElementById('set-ad-interval').value,
          ad_splash_duration_seconds: document.getElementById('set-ad-duration').value,
          promo_video_url: document.getElementById('set-video-url').value
        })
      });
      App.toast('Setări salvate!', 'success');
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
  }
};
