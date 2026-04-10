// ============================
// Marker Types Manager (Custom types)
// ============================
window.MarkerTypes = {
  async openManageModal() {
    await Icons.loadCustomTypes(App.currentProject?.id);
    this.renderManageModal();
    App.openModal('modal-marker-types');
  },

  renderManageModal() {
    const container = document.getElementById('manage-types-list');
    const allTypes = Icons.customTypes;

    // Build list of all system + custom types
    let html = '';

    // System types info
    html += `<div class="types-section-header">
      <span class="material-icons-round" style="font-size:18px">inventory_2</span>
      <span>Tipuri Sistem (implicite)</span>
    </div>
    <div class="types-info-text">
      Tipurile de sistem (Hidranți, Semne Rutiere, General) sunt disponibile în toate proiectele și nu pot fi șterse.
    </div>`;

    // Custom types
    html += `<div class="types-section-header" style="margin-top:16px">
      <span class="material-icons-round" style="font-size:18px">palette</span>
      <span>Tipuri Custom</span>
    </div>`;

    if (allTypes.length === 0) {
      html += `<div class="empty-state" style="padding:16px"><p>Niciun tip custom. Creează unul mai jos.</p></div>`;
    } else {
      allTypes.forEach(t => {
        const scopeLabel = t.scope === 'all' ? '🌐 Toate proiectele' : `📁 Proiect #${t.project_id}`;
        html += `
          <div class="manage-type-item" data-id="${t.id}">
            <div class="manage-type-icon">${t.svg_data || '<span class="material-icons-round">help_outline</span>'}</div>
            <div class="manage-type-info">
              <div class="manage-type-name">${this.escHtml(t.name)}</div>
              <div class="manage-type-scope">${scopeLabel} · ${t.is_active ? '✅ Activ' : '⏸ Inactiv'}</div>
            </div>
            <div class="manage-type-actions">
              <button class="btn-icon btn-toggle-type" data-id="${t.id}" data-active="${t.is_active}" title="${t.is_active ? 'Dezactivează' : 'Activează'}">
                <span class="material-icons-round" style="color:${t.is_active ? 'var(--success)' : 'var(--text-tertiary)'}">${t.is_active ? 'toggle_on' : 'toggle_off'}</span>
              </button>
              <button class="btn-icon btn-delete-type" data-id="${t.id}" title="Șterge">
                <span class="material-icons-round" style="color:var(--danger)">delete</span>
              </button>
            </div>
          </div>
        `;
      });
    }

    container.innerHTML = html;

    // Toggle active
    container.querySelectorAll('.btn-toggle-type').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = parseInt(btn.dataset.id);
        const isActive = btn.dataset.active === '1';
        await fetch(`/api/marker-types/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ is_active: isActive ? 0 : 1 })
        });
        await Icons.loadCustomTypes(App.currentProject?.id);
        this.renderManageModal();
      });
    });

    // Delete
    container.querySelectorAll('.btn-delete-type').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (!confirm('Ștergi acest tip de marker?')) return;
        await fetch(`/api/marker-types/${btn.dataset.id}`, { method: 'DELETE' });
        await Icons.loadCustomTypes(App.currentProject?.id);
        this.renderManageModal();
        App.toast('Tip șters', 'success');
      });
    });
  },

  async createType() {
    const name = document.getElementById('new-type-name').value.trim();
    const svgData = document.getElementById('new-type-svg').value.trim();
    const scope = document.getElementById('new-type-scope').value;

    if (!name) { App.toast('Introdu un nume', 'warning'); return; }
    if (!svgData) { App.toast('Introdu SVG-ul iconiței', 'warning'); return; }

    const body = {
      name,
      svg_data: svgData,
      scope,
      project_id: scope === 'project' ? App.currentProject?.id : null
    };

    try {
      const res = await fetch('/api/marker-types', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      if (!res.ok) throw new Error();
      document.getElementById('new-type-name').value = '';
      document.getElementById('new-type-svg').value = '';
      await Icons.loadCustomTypes(App.currentProject?.id);
      this.renderManageModal();
      App.toast('Tip creat!', 'success');
    } catch {
      App.toast(I18n.t('toast.errorGeneric'), 'error');
    }
  },

  // Quick-create from a preset SVG (copy a system icon as custom)
  getPresetSvgs() {
    return [
      { name: 'Punct Roșu', svg: `<svg viewBox="0 0 64 64"><circle cx="32" cy="32" r="24" fill="#e74c3c"/></svg>` },
      { name: 'Punct Albastru', svg: `<svg viewBox="0 0 64 64"><circle cx="32" cy="32" r="24" fill="#3498db"/></svg>` },
      { name: 'Punct Verde', svg: `<svg viewBox="0 0 64 64"><circle cx="32" cy="32" r="24" fill="#27ae60"/></svg>` },
      { name: 'Punct Galben', svg: `<svg viewBox="0 0 64 64"><circle cx="32" cy="32" r="24" fill="#f1c40f"/></svg>` },
      { name: 'Triunghi Atenție', svg: `<svg viewBox="0 0 64 64"><polygon points="32,4 60,56 4,56" fill="#f39c12" stroke="#e67e22" stroke-width="3"/><text x="32" y="46" text-anchor="middle" font-size="28" font-weight="bold" fill="#222">!</text></svg>` },
      { name: 'Cheie Service', svg: `<svg viewBox="0 0 64 64"><circle cx="32" cy="32" r="28" fill="#7f8c8d"/><path d="M20 44 L36 28 M36 24 Q42 18 48 24 Q54 30 48 36 L44 32 L40 36 L36 32 L36 28" stroke="white" stroke-width="3" fill="none" stroke-linecap="round"/></svg>` },
      { name: 'Camera Video', svg: `<svg viewBox="0 0 64 64"><rect x="8" y="18" width="36" height="28" rx="4" fill="#2c3e50"/><polygon points="44,24 58,16 58,48 44,40" fill="#2c3e50"/><circle cx="26" cy="32" r="6" fill="#3498db" opacity="0.8"/></svg>` },
      { name: 'Electricitate', svg: `<svg viewBox="0 0 64 64"><circle cx="32" cy="32" r="28" fill="#f1c40f"/><polygon points="36,8 22,34 30,34 28,56 42,30 34,30" fill="#222"/></svg>` },
    ];
  },

  escHtml(str) {
    const div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
  }
};
