// ============================
// Main Application Controller
// ============================
window.App = {
  user: null,
  currentProject: null,
  config: null,
  mode: 'view', // 'view' or 'admin'

  _user_is_super_admin() {
    return this.user && this.user.role === 'admin' && this.user.email === 'bogdansarac@gmail.com';
  },

  async init() {
    // Load config
    try {
      const res = await fetch('/api/config');
      this.config = await res.json();
    } catch { this.config = { mapsApiKey: '', mapsQuotaDaily: 900 }; }

    // Check auth — dashboard layout always visible
    try {
      const res = await fetch('/auth/me');
      if (res.ok) {
        this.user = await res.json();
        this.showDashboard();
      } else {
        this.showLogin();
      }
    } catch {
      this.showLogin();
    }
  },

  showLogin() {
    // Dashboard layout visible — public projects viewable with Leaflet (free, no API calls)
    document.getElementById('view-dashboard').classList.add('active');
    document.getElementById('view-login').classList.remove('active');
    // Show login button in header, hide user menu
    document.getElementById('btn-header-login').classList.remove('hidden');
    document.getElementById('user-menu-wrapper').classList.add('hidden');
    // Hide controls that require auth
    document.getElementById('admin-role-toggle').classList.add('hidden');
    document.getElementById('btn-admin-panel').classList.add('hidden');
    document.querySelectorAll('.view-mode-toggle, #btn-toggle-poi, .maps-usage').forEach(el => el.classList.add('hidden'));
    // Hide sidebar search/filters (no geocoding for public)
    document.getElementById('map-search-box').classList.add('hidden');
    document.getElementById('coord-input').classList.add('hidden');
    // Load public projects
    this.loadPublicProjects();
  },

  async showDashboard() {
    document.getElementById('view-login').classList.remove('active');
    document.getElementById('view-dashboard').classList.add('active');
    // Show user menu, hide login button
    document.getElementById('btn-header-login').classList.add('hidden');
    document.getElementById('user-menu-wrapper').classList.remove('hidden');
    // Show controls
    document.querySelectorAll('.view-mode-toggle, #btn-toggle-poi, .maps-usage').forEach(el => el.classList.remove('hidden'));
    document.getElementById('map-search-box').classList.remove('hidden');
    // Hide public map, show Google map
    document.getElementById('public-map').classList.add('hidden');
    document.getElementById('map').classList.remove('hidden');
    // Hide SEO landing content for authenticated users
    const seoLanding = document.getElementById('seo-landing');
    if (seoLanding) seoLanding.style.display = 'none';
    // Show no-project overlay until user selects a project
    document.getElementById('map-overlay-no-project').classList.remove('hidden');

    // Set user info
    const isSuperAdmin = this.user.role === 'admin' && this.user.email === 'bogdansarac@gmail.com';
    const nameEl = document.getElementById('user-name');
    nameEl.textContent = this.user.name || 'User';
    if (isSuperAdmin) {
      const badge = document.createElement('span');
      badge.style.cssText = 'font-size:9px;color:#e74c3c;font-weight:700;margin-left:4px';
      badge.textContent = 'SUPER';
      nameEl.appendChild(badge);
    }
    const avatarImg = document.getElementById('user-avatar');
    if (this.user.avatar) {
      avatarImg.src = this.user.avatar;
    } else {
      avatarImg.style.display = 'none';
    }

    // Set theme & language
    Theme.init(this.user.theme || 'light');
    I18n.setLocale(this.user.locale || 'en');

    // Access control + admin + ads (may redirect to unauthorized/expired view)
    const hasAccess = await AdminPanel.init();
    if (!hasAccess) return;

    // Highlight active lang
    document.querySelectorAll('.lang-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.lang === (this.user.locale || 'en'));
    });

    // Init components
    this.initDropdowns();
    this.initSidebar();
    this.initModeSwitcher();
    this.initPOIToggle();
    this.initThemeButtons();
    this.initLanguageButtons();
    this.initLogout();
    this.initModals();
    this.initUsageModal();
    this.initApiKeys();

    // Load projects
    Projects.loadAll();

    // Init map
    MapManager.init();

    // Update usage
    this.updateMapsUsage();
  },

  // --- Dropdowns ---
  initDropdowns() {
    // Project dropdown
    const projBtn = document.getElementById('btn-project-select');
    const projDrop = document.getElementById('project-dropdown');
    projBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      projDrop.classList.toggle('hidden');
      document.getElementById('user-dropdown').classList.add('hidden');
    });

    // User dropdown
    const userBtn = document.getElementById('btn-user-menu');
    const userDrop = document.getElementById('user-dropdown');
    userBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      userDrop.classList.toggle('hidden');
      projDrop.classList.add('hidden');
    });

    // Close dropdowns on outside click
    document.addEventListener('click', () => {
      projDrop.classList.add('hidden');
      userDrop.classList.add('hidden');
    });

    // Manage projects button
    document.getElementById('btn-manage-projects').addEventListener('click', () => {
      projDrop.classList.add('hidden');
      App.openModal('modal-projects');
      Projects.renderManageList();
    });
  },

  // --- Sidebar ---
  initSidebar() {
    const sidebar = document.getElementById('sidebar');
    const toggleBtn = document.getElementById('btn-toggle-sidebar');
    const expandBtn = document.getElementById('btn-expand-sidebar');

    toggleBtn.addEventListener('click', () => {
      sidebar.classList.add('collapsed');
      expandBtn.classList.remove('hidden');
    });

    expandBtn.addEventListener('click', () => {
      sidebar.classList.remove('collapsed');
      expandBtn.classList.add('hidden');
    });

    // Sidebar search
    document.getElementById('sidebar-search-input').addEventListener('input', () => {
      Markers.applyAllFilters();
    });

    // Filters
    document.getElementById('filter-status').addEventListener('change', () => Markers.applyAllFilters());
    document.getElementById('filter-condition').addEventListener('change', () => Markers.applyAllFilters());

    // PDF Export
    document.getElementById('btn-export-pdf').addEventListener('click', () => Markers.exportPDF());

    // View toggle: All / In View
    const btnAll = document.getElementById('btn-view-all');
    const btnInView = document.getElementById('btn-view-inview');
    btnAll.addEventListener('click', () => {
      Markers.viewMode = 'all';
      btnAll.classList.add('active');
      btnInView.classList.remove('active');
      Markers.applyAllFilters();
    });
    btnInView.addEventListener('click', () => {
      Markers.viewMode = 'inview';
      btnInView.classList.add('active');
      btnAll.classList.remove('active');
      Markers.applyAllFilters();
    });
  },

  // --- Mode switch ---
  initModeSwitcher() {
    const viewBtn = document.getElementById('btn-mode-view');
    const adminBtn = document.getElementById('btn-mode-admin');
    const coordInput = document.getElementById('coord-input');

    viewBtn.addEventListener('click', () => {
      this.mode = 'view';
      viewBtn.classList.add('active');
      adminBtn.classList.remove('active');
      coordInput.classList.add('hidden');
      MapManager.setMode('view');
    });

    adminBtn.addEventListener('click', () => {
      this.mode = 'admin';
      adminBtn.classList.add('active');
      viewBtn.classList.remove('active');
      coordInput.classList.remove('hidden');
      MapManager.setMode('admin');
    });
  },

  // --- POI Toggle ---
  initPOIToggle() {
    document.getElementById('btn-toggle-poi').addEventListener('click', () => {
      MapManager.togglePOI(!MapManager.showPOI);
    });
  },

  // --- Theme ---
  initThemeButtons() {
    document.getElementById('btn-theme-light').addEventListener('click', () => Theme.set('light'));
    document.getElementById('btn-theme-dark').addEventListener('click', () => Theme.set('dark'));
  },

  // --- Language ---
  initLanguageButtons() {
    document.querySelectorAll('.lang-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const locale = btn.dataset.lang;
        document.querySelectorAll('.lang-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        I18n.setLocale(locale);
        try {
          await fetch('/auth/me', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ locale })
          });
        } catch {}
        App.toast(I18n.t('toast.settingsSaved'), 'success');
      });
    });
  },

  // --- Logout ---
  initLogout() {
    document.getElementById('btn-logout').addEventListener('click', async () => {
      await fetch('/auth/logout', { method: 'POST' });
      window.location.reload();
    });
  },

  // --- Modals ---
  initModals() {
    document.querySelectorAll('[data-close-modal]').forEach(btn => {
      btn.addEventListener('click', () => {
        const modalId = btn.getAttribute('data-close-modal');
        this.closeModal(modalId);
      });
    });
    document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
      backdrop.addEventListener('click', () => {
        const modal = backdrop.closest('.modal');
        if (modal) modal.classList.add('hidden');
      });
    });
  },

  openModal(id) {
    const modal = document.getElementById(id);
    if (modal) {
      modal.classList.remove('hidden');
      const content = modal.querySelector('.modal-content');
      if (content) {
        content.style.animation = 'none';
        content.offsetHeight; // trigger reflow
        content.style.animation = 'fadeInScale 0.3s ease-out';
      }
    }
  },

  closeModal(id) {
    const modal = document.getElementById(id);
    if (modal) modal.classList.add('hidden');
  },

  // --- Maps usage ---
  async updateMapsUsage() {
    try {
      // Update header bar with cost-based info
      const res = await fetch('/api/usage');
      if (!res.ok) return;
      const data = await res.json();
      const pct = data.creditUSD > 0 ? (data.totalCostUSD / data.creditUSD * 100) : 0;
      const fill = document.getElementById('usage-fill');
      fill.style.width = Math.min(pct, 100) + '%';
      fill.classList.remove('warning', 'danger');
      if (pct > 80) fill.classList.add('danger');
      else if (pct > 50) fill.classList.add('warning');

      // Super admin sees detailed quota info
      const isSuperAdmin = this._user_is_super_admin();
      if (isSuperAdmin && data.monthlyQuota) {
        const mq = data.monthlyQuota;
        const mapsStr = `M:${mq.maps.used}/${mq.maps.limit}`;
        const geoStr = `G:${mq.geocode.used}/${mq.geocode.limit}`;
        document.getElementById('usage-text').textContent = `${mapsStr} | ${geoStr} | $${data.totalCostUSD}/$${data.creditUSD}`;
      } else if (data.hasCustomKey) {
        document.getElementById('usage-text').textContent = I18n.t('userKeys.usingCustom');
      } else {
        document.getElementById('usage-text').textContent = `$${data.totalCostUSD}/$${data.creditUSD}`;
      }

      // Store for modal
      this._usageData = data;
    } catch {}
  },

  // --- Usage modal ---
  initUsageModal() {
    document.querySelector('.maps-usage').addEventListener('click', () => this.showUsageDetails());
    document.querySelector('.maps-usage').style.cursor = 'pointer';
  },

  async showUsageDetails() {
    // Refresh data
    try {
      const res = await fetch('/api/usage');
      if (res.ok) this._usageData = await res.json();
    } catch {}

    const d = this._usageData;
    if (!d) { this.toast(I18n.t('toast.errorGeneric'), 'warning'); return; }

    const typeLabels = { maps_load: 'Maps Load', geocode: 'Geocoding', places: 'Places Search' };
    const typeCosts = { maps_load: 7, geocode: 5, places: 17 };

    // Build content
    let html = '';

    // --- My quota (daily + monthly) - visible to all users ---
    const dailyPct = d.dailyLimit > 0 ? Math.min(100, Math.round(d.myTodayUsed / d.dailyLimit * 100)) : 0;
    const monthPct = d.monthlyLimit > 0 ? Math.min(100, Math.round(d.myMonthUsed / d.monthlyLimit * 100)) : 0;
    const dailyColor = dailyPct >= 90 ? 'var(--danger)' : dailyPct >= 70 ? 'var(--warning)' : 'var(--accent)';
    const monthColor = monthPct >= 90 ? 'var(--danger)' : monthPct >= 70 ? 'var(--warning)' : 'var(--accent)';

    html += `<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:20px">
      <div style="background:var(--bg-tertiary);padding:16px;border-radius:var(--radius-md)">
        <div style="font-size:11px;color:var(--text-tertiary);text-transform:uppercase;margin-bottom:6px">${I18n.t('quota.daily')}</div>
        <div style="font-size:28px;font-weight:700;font-family:var(--font-mono);color:${dailyColor}">${d.myTodayUsed} / ${d.dailyLimit}</div>
        <div style="margin-top:6px;height:6px;background:var(--bg-secondary);border-radius:3px;overflow:hidden">
          <div style="height:100%;width:${dailyPct}%;background:${dailyColor};border-radius:3px;transition:width 0.3s"></div>
        </div>
        <div style="font-size:11px;color:var(--text-tertiary);margin-top:4px">${dailyPct}% ${I18n.t('admin.used')} | ${Math.max(0, d.dailyLimit - d.myTodayUsed)} ${I18n.t('quota.remaining')}</div>
      </div>
      <div style="background:var(--bg-tertiary);padding:16px;border-radius:var(--radius-md)">
        <div style="font-size:11px;color:var(--text-tertiary);text-transform:uppercase;margin-bottom:6px">${I18n.t('quota.monthly')}</div>
        <div style="font-size:28px;font-weight:700;font-family:var(--font-mono);color:${monthColor}">${d.myMonthUsed} / ${d.monthlyLimit}</div>
        <div style="margin-top:6px;height:6px;background:var(--bg-secondary);border-radius:3px;overflow:hidden">
          <div style="height:100%;width:${monthPct}%;background:${monthColor};border-radius:3px;transition:width 0.3s"></div>
        </div>
        <div style="font-size:11px;color:var(--text-tertiary);margin-top:4px">${monthPct}% ${I18n.t('admin.used')} | ${Math.max(0, d.monthlyLimit - d.myMonthUsed)} ${I18n.t('quota.remaining')}</div>
      </div>
    </div>`;

    // Custom key badge
    if (d.hasCustomKey) {
      html += `<div style="display:flex;align-items:center;gap:8px;padding:10px 14px;margin-bottom:16px;background:rgba(16,185,129,0.1);border:1px solid var(--success);border-radius:var(--radius-md);font-size:13px;color:var(--success)">
        <span class="material-icons-round">vpn_key</span> ${I18n.t('userKeys.usingCustom')} — ${I18n.t('quota.noLimits')}
      </div>`;
    }

    // --- My usage breakdown today ---
    const myT = d.today;
    if (myT && Object.keys(myT).length > 0) {
      html += `<h4 style="font-size:13px;font-weight:600;color:var(--text-secondary);text-transform:uppercase;margin-bottom:8px">${I18n.t('quota.todayBreakdown')}</h4>
      <div style="display:flex;gap:8px;margin-bottom:16px">`;
      for (const [type, count] of Object.entries(myT)) {
        html += `<div style="background:var(--bg-tertiary);padding:8px 12px;border-radius:var(--radius-sm);font-size:13px">
          <strong>${count}</strong> ${typeLabels[type] || type}
        </div>`;
      }
      html += `</div>`;
    }

    // --- Platform cost (visible to all, details for super admin) ---
    const isSuperAdmin = this._user_is_super_admin();
    html += `<div style="text-align:center;margin-bottom:16px;padding:12px;background:var(--bg-tertiary);border-radius:var(--radius-md)">
      <div style="font-size:24px;font-weight:700;font-family:var(--font-mono);color:var(--accent)">$${d.totalCostUSD} / $${d.creditUSD}</div>
      <div style="font-size:11px;color:var(--text-tertiary)">${I18n.t('admin.costThisMonth')}</div>
      <div style="margin-top:6px;height:6px;background:var(--bg-secondary);border-radius:3px;overflow:hidden;max-width:300px;margin:6px auto 0">
        <div style="height:100%;width:${Math.min(d.totalCostUSD / d.creditUSD * 100, 100)}%;background:${d.totalCostUSD > 160 ? 'var(--danger)' : 'var(--accent)'};border-radius:3px"></div>
      </div>
    </div>`;

    // Platform breakdown by type
    if (Object.keys(d.allMonth).length > 0) {
      html += `<div style="display:grid;grid-template-columns:repeat(${Object.keys(d.allMonth).length}, 1fr);gap:8px;margin-bottom:16px">`;
      for (const [type, count] of Object.entries(d.allMonth)) {
        const cost = (count / 1000) * (typeCosts[type] || 5);
        html += `<div style="background:var(--bg-tertiary);padding:10px;border-radius:var(--radius-md);text-align:center">
          <div style="font-size:18px;font-weight:700;font-family:var(--font-mono)">${count}</div>
          <div style="font-size:11px;color:var(--text-tertiary)">${typeLabels[type] || type}</div>
          <div style="font-size:11px;color:var(--accent)">$${cost.toFixed(2)}</div>
        </div>`;
      }
      html += `</div>`;
    }

    // Per user breakdown (super admin only)
    if (isSuperAdmin && d.users.length > 0) {
      html += `<h4 style="font-size:13px;font-weight:600;color:var(--text-secondary);text-transform:uppercase;margin-bottom:8px">${I18n.t('admin.topUsers')}</h4>`;
      d.users.sort((a, b) => b.cost - a.cost);
      d.users.forEach(u => {
        const details = Object.entries(u.breakdown).map(([t, c]) => `${typeLabels[t] || t}: ${c}`).join(', ');
        html += `<div style="display:flex;align-items:center;gap:10px;padding:8px 10px;background:var(--bg-tertiary);border-radius:var(--radius-sm);margin-bottom:4px">
          <div style="flex:1;min-width:0">
            <div style="font-weight:500;font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${u.name}</div>
            <div style="font-size:11px;color:var(--text-tertiary)">${details}</div>
          </div>
          <div style="text-align:right;flex-shrink:0">
            <div style="font-weight:600;font-family:var(--font-mono);font-size:13px">${u.calls}</div>
            <div style="font-size:11px;color:var(--accent)">$${u.cost.toFixed(2)}</div>
          </div>
        </div>`;
      });
    }

    document.getElementById('usage-modal-body').innerHTML = html;
    this.openModal('modal-usage');
  },

  // --- Public projects (unauthenticated view with Leaflet) ---
  _leafletMap: null,
  _leafletMarkers: [],

  async loadPublicProjects() {
    try {
      const res = await fetch('/api/public-projects');
      if (!res.ok) return;
      const projects = await res.json();
      if (projects.length === 0) {
        document.getElementById('map-overlay-no-project').classList.remove('hidden');
        return;
      }
      // Render in project dropdown
      const container = document.getElementById('project-list');
      container.innerHTML = `<div style="padding:6px 12px;font-size:10px;font-weight:600;text-transform:uppercase;color:var(--text-tertiary);letter-spacing:0.5px">${I18n.t('projects.publicProjects')}</div>` +
        projects.map(p => `
          <div class="project-item" data-id="${p.id}">
            <div class="project-item-avatar">${Icons.getAvatar(p.avatar_index)}</div>
            <div class="project-item-info">
              <div class="project-item-name">${p.name} <span style="font-size:9px;color:var(--success);background:rgba(16,185,129,0.1);padding:1px 5px;border-radius:99px">public</span></div>
              <div class="project-item-count">${p.marker_count || 0} markers</div>
            </div>
          </div>`).join('');

      container.querySelectorAll('.project-item').forEach(item => {
        item.addEventListener('click', () => {
          const p = projects.find(x => x.id === parseInt(item.dataset.id));
          if (p) this.selectPublicProject(p);
        });
      });

      // Auto-select first public project
      if (projects.length > 0) this.selectPublicProject(projects[0]);
    } catch (e) {
      console.error('Failed to load public projects:', e);
    }
  },

  async selectPublicProject(project) {
    document.getElementById('project-name').textContent = project.name;
    document.getElementById('project-avatar').innerHTML = Icons.getAvatar(project.avatar_index);
    document.getElementById('project-dropdown').classList.add('hidden');
    document.getElementById('map-overlay-no-project').classList.add('hidden');

    // Hide Google Map, show Leaflet public map
    document.getElementById('map').classList.add('hidden');
    const pubMap = document.getElementById('public-map');
    pubMap.classList.remove('hidden');

    // Fetch markers
    try {
      const res = await fetch(`/api/public-projects/${project.id}/markers`);
      if (!res.ok) return;
      const data = await res.json();

      // Initialize Leaflet map (free, no API key)
      if (this._leafletMap) { this._leafletMap.remove(); this._leafletMap = null; }
      this._leafletMap = L.map('public-map').setView([project.center_lat || 45.7983, project.center_lng || 24.1256], project.default_zoom || 14);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19
      }).addTo(this._leafletMap);

      // Add markers
      this._leafletMarkers = [];
      const markerList = data.markers || [];
      markerList.forEach(m => {
        const marker = L.marker([m.lat, m.lng]).addTo(this._leafletMap);
        marker.bindPopup(`<strong>${m.title || 'Marker'}</strong><br>${m.status || ''} · ${m.condition || ''}`);
        this._leafletMarkers.push(marker);
      });

      // Render sidebar marker list (read-only)
      const listEl = document.getElementById('marker-list');
      if (markerList.length === 0) {
        listEl.innerHTML = '<div class="empty-state"><span class="material-icons-round">place</span><p>No markers</p></div>';
      } else {
        listEl.innerHTML = markerList.map(m => `
          <div class="marker-item" data-lat="${m.lat}" data-lng="${m.lng}">
            <div class="marker-item-icon">${Icons.getIconByType(m.icon_type, m.icon_index)}</div>
            <div class="marker-item-info">
              <div class="marker-item-title">${m.title || 'Marker'}</div>
              <div class="marker-item-meta">${m.status || ''} · ${m.condition || ''}</div>
            </div>
          </div>`).join('');

        listEl.querySelectorAll('.marker-item').forEach(item => {
          item.addEventListener('click', () => {
            const lat = parseFloat(item.dataset.lat);
            const lng = parseFloat(item.dataset.lng);
            if (this._leafletMap) this._leafletMap.setView([lat, lng], 17);
          });
        });
      }

      // Stats
      document.getElementById('stat-total').textContent = markerList.length;
      document.getElementById('stat-active').textContent = markerList.filter(m => m.status === 'active').length;
      document.getElementById('stat-maintenance').textContent = markerList.filter(m => m.status === 'maintenance').length;

      // Disable sidebar controls that need auth
      document.getElementById('btn-export-pdf').classList.add('hidden');
    } catch (e) {
      console.error('Failed to load public project:', e);
    }
  },

  // --- API Keys modal ---
  initApiKeys() {
    const btn = document.getElementById('btn-api-keys');
    if (btn) {
      btn.addEventListener('click', () => {
        document.getElementById('user-dropdown').classList.add('hidden');
        this.openApiKeysModal();
      });
    }
  },

  async openApiKeysModal() {
    this.openModal('modal-api-keys');
    const statusEl = document.getElementById('api-keys-status');
    const keyInput = document.getElementById('user-maps-key');
    const toggleBtn = document.getElementById('btn-toggle-api-keys');
    const deleteBtn = document.getElementById('btn-delete-api-keys');

    // Load current keys
    try {
      const r = await fetch('/api/user-keys');
      const data = await r.json();
      if (data.hasKey) {
        statusEl.innerHTML = `<div style="display:flex;align-items:center;gap:8px;padding:10px;border-radius:var(--radius-md);background:${data.isActive ? 'rgba(16,185,129,0.1);border:1px solid var(--success)' : 'var(--bg-tertiary);border:1px solid var(--border)'}">
          <span class="material-icons-round" style="color:${data.isActive ? 'var(--success)' : 'var(--text-tertiary)'}">${data.isActive ? 'check_circle' : 'pause_circle'}</span>
          <span style="font-size:13px">${data.isActive ? I18n.t('userKeys.usingCustom') : I18n.t('userKeys.inactive')}</span>
          ${data.mapsKeyPreview ? `<span style="font-family:var(--font-mono);font-size:12px;color:var(--text-tertiary);margin-left:auto">${data.mapsKeyPreview}</span>` : ''}
        </div>`;
        keyInput.placeholder = data.mapsKeyPreview || 'AIza...';
        toggleBtn.querySelector('span:last-child').textContent = data.isActive ? I18n.t('userKeys.deactivate') : I18n.t('userKeys.activate');
        toggleBtn.querySelector('.material-icons-round').textContent = data.isActive ? 'toggle_off' : 'toggle_on';
        toggleBtn.classList.remove('hidden');
        deleteBtn.classList.remove('hidden');
      } else {
        statusEl.innerHTML = `<div style="display:flex;align-items:center;gap:8px;padding:10px;border-radius:var(--radius-md);background:var(--bg-tertiary)">
          <span class="material-icons-round" style="color:var(--text-tertiary)">vpn_key_off</span>
          <span style="font-size:13px;color:var(--text-tertiary)">${I18n.t('userKeys.usingSystem')}</span>
        </div>`;
        toggleBtn.classList.add('hidden');
        deleteBtn.classList.add('hidden');
      }
    } catch {}

    // Show/hide key
    const visBtn = document.getElementById('btn-toggle-key-vis');
    visBtn.onclick = () => {
      keyInput.type = keyInput.type === 'password' ? 'text' : 'password';
      visBtn.querySelector('.material-icons-round').textContent = keyInput.type === 'password' ? 'visibility' : 'visibility_off';
    };

    // Save
    document.getElementById('btn-save-api-keys').onclick = async () => {
      const key = keyInput.value.trim();
      if (!key) { this.toast(I18n.t('toast.errorGeneric'), 'warning'); return; }
      const r = await fetch('/api/user-keys', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ maps_api_key: key, is_active: true })
      });
      if (r.ok) {
        this.toast(I18n.t('userKeys.saved'), 'success');
        keyInput.value = '';
        this.openApiKeysModal(); // refresh
      } else {
        const err = await r.json().catch(() => ({}));
        this.toast(err.error || I18n.t('toast.errorGeneric'), 'error');
      }
    };

    // Toggle
    toggleBtn.onclick = async () => {
      const r = await fetch('/api/user-keys/toggle', { method: 'POST' });
      if (r.ok) {
        this.toast(I18n.t('userKeys.saved'), 'success');
        this.openApiKeysModal();
      }
    };

    // Delete
    deleteBtn.onclick = async () => {
      if (!confirm(I18n.t('userKeys.confirmDelete'))) return;
      await fetch('/api/user-keys', { method: 'DELETE' });
      this.toast(I18n.t('userKeys.deleted'), 'success');
      this.openApiKeysModal();
    };
  },

  // --- Toast ---
  toast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    const icons = { success: 'check_circle', error: 'error', warning: 'warning', info: 'info' };
    toast.innerHTML = `<span class="material-icons-round">${icons[type] || 'info'}</span><span>${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => {
      toast.classList.add('removing');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  },

  // --- Select project ---
  async selectProject(project) {
    this.currentProject = project;
    document.getElementById('project-name').textContent = project.name;
    document.getElementById('project-avatar').innerHTML = Icons.getAvatar(project.avatar_index);
    document.getElementById('project-dropdown').classList.add('hidden');
    document.getElementById('map-overlay-no-project').classList.add('hidden');

    // Determine role on this project
    const isOwner = project.user_id === this.user.id;
    this.currentProjectRole = isOwner ? 'admin' : (project.my_role || 'viewer');

    // Apply role-based UI
    this.applyProjectRole();

    // Load custom marker types for this project
    await Icons.loadCustomTypes(project.id);

    // Load markers for this project
    await Markers.loadForProject(project.id);

    // Re-evaluate ad visibility now that we have content
    AdminPanel.applyAdVisibility();

    // Navigate map to project center AFTER layout has settled
    // (ads sidebar may change map container size — ResizeObserver handles resize,
    //  but we need a small delay for layout to complete)
    setTimeout(() => {
      if (MapManager.map && project.center_lat && project.center_lng) {
        MapManager.map.setCenter({ lat: project.center_lat, lng: project.center_lng });
        MapManager.map.setZoom(project.default_zoom || 14);
      }
    }, 250);

    // Update dropdown active state
    document.querySelectorAll('.project-item').forEach(item => {
      item.classList.toggle('active', item.dataset.id == project.id);
    });

    // Init preset SVGs in manage types modal
    this.initPresetSvgs();
  },

  // Show/hide admin controls based on project role
  applyProjectRole() {
    const canEdit = this.currentProjectRole === 'admin';
    // Admin mode button
    document.getElementById('btn-mode-admin').style.display = canEdit ? '' : 'none';
    // If currently in admin mode but no permission, switch to view
    if (!canEdit && this.mode === 'admin') {
      document.getElementById('btn-mode-view').click();
    }
  },

  initPresetSvgs() {
    const grid = document.getElementById('preset-svg-grid');
    if (!grid) return;
    const presets = MarkerTypes.getPresetSvgs();
    grid.innerHTML = presets.map((p, i) => `
      <div class="preset-svg-option" data-index="${i}" title="${p.name}">${p.svg}</div>
    `).join('');
    grid.querySelectorAll('.preset-svg-option').forEach(opt => {
      opt.addEventListener('click', () => {
        const idx = parseInt(opt.dataset.index);
        const preset = presets[idx];
        document.getElementById('new-type-svg').value = preset.svg;
        if (!document.getElementById('new-type-name').value) {
          document.getElementById('new-type-name').value = preset.name;
        }
        grid.querySelectorAll('.preset-svg-option').forEach(o => o.classList.remove('selected'));
        opt.classList.add('selected');
      });
    });
  }
};

// Initialize on load
document.addEventListener('DOMContentLoaded', () => App.init());
