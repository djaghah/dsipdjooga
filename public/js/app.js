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

    // Check auth
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
    document.getElementById('view-login').classList.add('active');
    document.getElementById('view-dashboard').classList.remove('active');
  },

  async showDashboard() {
    document.getElementById('view-login').classList.remove('active');
    document.getElementById('view-dashboard').classList.add('active');

    // Set user info
    const isSuperAdmin = this.user.role === 'admin' && this.user.email === 'bogdansarac@gmail.com';
    document.getElementById('user-name').innerHTML = (this.user.name || 'User') +
      (isSuperAdmin ? ' <span style="font-size:9px;color:#e74c3c;font-weight:700">SUPER</span>' : '');
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

      // Super admin sees total calls, regular users see cost
      const isSuperAdmin = this.user && this.user.role === 'admin' && this.user.email === 'bogdansarac@gmail.com';
      if (isSuperAdmin) {
        document.getElementById('usage-text').textContent = `${data.globalTotalCalls} total | $${data.totalCostUSD}/$${data.creditUSD}`;
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
    if (!d) { this.toast('Nu sunt date disponibile', 'warning'); return; }

    const typeLabels = { maps_load: 'Maps Load', geocode: 'Geocoding', places: 'Places Search' };
    const typeCosts = { maps_load: 7, geocode: 5, places: 17 };

    // Build content
    let html = `
      <div style="text-align:center;margin-bottom:20px">
        <div style="font-size:36px;font-weight:700;font-family:var(--font-mono);color:var(--accent)">$${d.totalCostUSD}</div>
        <div style="font-size:13px;color:var(--text-tertiary)">din $${d.creditUSD} credit lunar Google</div>
        <div style="margin-top:8px;height:8px;background:var(--bg-tertiary);border-radius:4px;overflow:hidden">
          <div style="height:100%;width:${Math.min(d.totalCostUSD / d.creditUSD * 100, 100)}%;background:${d.totalCostUSD > 160 ? 'var(--danger)' : d.totalCostUSD > 100 ? 'var(--warning)' : 'var(--accent)'};border-radius:4px;transition:width 0.3s"></div>
        </div>
        <div style="font-size:12px;color:var(--success);margin-top:4px">Rămân $${d.remainingCreditUSD} credit</div>
      </div>

      <h4 style="font-size:13px;font-weight:600;color:var(--text-secondary);text-transform:uppercase;margin-bottom:8px">Total platformă luna aceasta</h4>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:16px">`;

    for (const [type, count] of Object.entries(d.allMonth)) {
      const cost = (count / 1000) * (typeCosts[type] || 5);
      html += `<div style="background:var(--bg-tertiary);padding:10px;border-radius:var(--radius-md);text-align:center">
        <div style="font-size:20px;font-weight:700;font-family:var(--font-mono)">${count}</div>
        <div style="font-size:11px;color:var(--text-tertiary)">${typeLabels[type] || type}</div>
        <div style="font-size:11px;color:var(--accent)">$${cost.toFixed(2)}</div>
      </div>`;
    }
    html += `</div>`;

    // Total calls summary (visible to super admin)
    const isSuperAdmin = this._user_is_super_admin();
    if (isSuperAdmin && d.globalTotalCalls != null) {
      html += `<div style="display:flex;gap:12px;margin-bottom:16px;padding:12px;background:var(--bg-tertiary);border-radius:var(--radius-md);border:1px solid var(--accent);border-opacity:0.3">
        <div style="flex:1;text-align:center">
          <div style="font-size:24px;font-weight:700;font-family:var(--font-mono);color:var(--accent)">${d.globalTotalCalls}</div>
          <div style="font-size:11px;color:var(--text-tertiary)">Total apeluri platformă</div>
        </div>
        <div style="flex:1;text-align:center">
          <div style="font-size:24px;font-weight:700;font-family:var(--font-mono)">${d.dailyLimit || 10}</div>
          <div style="font-size:11px;color:var(--text-tertiary)">Limită zilnică/user</div>
        </div>
        <div style="flex:1;text-align:center">
          <div style="font-size:24px;font-weight:700;font-family:var(--font-mono)">${d.totalLimit || 50}</div>
          <div style="font-size:11px;color:var(--text-tertiary)">Limită totală/user</div>
        </div>
      </div>`;
    }

    // Per user breakdown
    if (d.users.length > 0) {
      html += `<h4 style="font-size:13px;font-weight:600;color:var(--text-secondary);text-transform:uppercase;margin-bottom:8px">Consum per utilizator</h4>`;
      d.users.sort((a, b) => b.cost - a.cost);
      d.users.forEach(u => {
        const details = Object.entries(u.breakdown).map(([t, c]) => `${typeLabels[t] || t}: ${c}`).join(', ');
        const totalAllTime = u.totalAllTime || 0;
        const totalLimitVal = d.totalLimit || 50;
        const totalPct = Math.min(100, Math.round(totalAllTime / totalLimitVal * 100));
        const totalColor = totalPct >= 90 ? 'var(--danger)' : totalPct >= 70 ? 'var(--warning)' : 'var(--accent)';
        html += `<div style="display:flex;align-items:center;gap:10px;padding:8px 10px;background:var(--bg-tertiary);border-radius:var(--radius-sm);margin-bottom:4px">
          <div style="flex:1;min-width:0">
            <div style="font-weight:500;font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${u.name}</div>
            <div style="font-size:11px;color:var(--text-tertiary)">${details}</div>
            ${isSuperAdmin ? `<div style="margin-top:4px;height:4px;background:var(--bg-secondary);border-radius:2px;overflow:hidden">
              <div style="height:100%;width:${totalPct}%;background:${totalColor};border-radius:2px"></div>
            </div>
            <div style="font-size:10px;color:var(--text-tertiary);margin-top:2px">Total: ${totalAllTime}/${totalLimitVal}</div>` : ''}
          </div>
          <div style="text-align:right;flex-shrink:0">
            <div style="font-weight:600;font-family:var(--font-mono);font-size:13px">${u.calls}</div>
            <div style="font-size:11px;color:var(--accent)">$${u.cost.toFixed(2)}</div>
          </div>
        </div>`;
      });
    }

    // My usage today
    const myT = d.today;
    if (myT && Object.keys(myT).length > 0) {
      const myTodayTotal = Object.values(myT).reduce((a, b) => a + b, 0);
      html += `<h4 style="font-size:13px;font-weight:600;color:var(--text-secondary);text-transform:uppercase;margin:16px 0 8px">Eu azi (${myTodayTotal}/${d.dailyLimit || 10} zilnic, ${d.myTotalCalls || 0}/${d.totalLimit || 50} total)</h4>
      <div style="display:flex;gap:8px">`;
      for (const [type, count] of Object.entries(myT)) {
        html += `<div style="background:var(--bg-tertiary);padding:8px 12px;border-radius:var(--radius-sm);font-size:13px">
          <strong>${count}</strong> ${typeLabels[type] || type}
        </div>`;
      }
      html += `</div>`;
    }

    document.getElementById('usage-modal-body').innerHTML = html;
    this.openModal('modal-usage');
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
