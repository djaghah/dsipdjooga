// ============================
// Projects Manager
// ============================
window.Projects = {
  list: [],
  editingId: null,
  selectedAvatarIndex: 0,

  async loadAll() {
    try {
      const res = await fetch('/api/projects');
      if (!res.ok) return;
      this.list = await res.json();
      this.renderDropdown();
    } catch (e) {
      console.error('Failed to load projects:', e);
    }
  },

  renderDropdown() {
    const container = document.getElementById('project-list');
    if (this.list.length === 0) {
      container.innerHTML = `<div class="empty-state" style="padding:20px"><span class="material-icons-round" style="font-size:32px">folder_off</span><p style="font-size:13px">${I18n.t('sidebar.noMarkers')}</p></div>`;
      return;
    }

    const myProjects = this.list.filter(p => p.user_id === App.user.id);
    const sharedProjects = this.list.filter(p => p.user_id !== App.user.id);

    let html = '';
    if (myProjects.length > 0) {
      html += `<div style="padding:6px 12px;font-size:10px;font-weight:600;text-transform:uppercase;color:var(--text-tertiary);letter-spacing:0.5px">${I18n.t('projects.myProjects')}</div>`;
      html += myProjects.map(p => this._renderProjectItem(p, 'admin')).join('');
    }
    if (sharedProjects.length > 0) {
      html += `<div style="padding:6px 12px;font-size:10px;font-weight:600;text-transform:uppercase;color:var(--text-tertiary);letter-spacing:0.5px;margin-top:4px">${I18n.t('projects.sharedWithMe')}</div>`;
      html += sharedProjects.map(p => this._renderProjectItem(p, p.my_role)).join('');
    }

    container.innerHTML = html;

    container.querySelectorAll('.project-item').forEach(item => {
      item.addEventListener('click', () => {
        const id = parseInt(item.dataset.id);
        const project = this.list.find(p => p.id === id);
        if (project) App.selectProject(project);
      });
    });
  },

  _renderProjectItem(p, role) {
    const roleBadge = role === 'admin'
      ? '<span style="font-size:9px;color:var(--warning);background:rgba(245,158,11,0.1);padding:1px 5px;border-radius:99px;font-weight:600">admin</span>'
      : '<span style="font-size:9px;color:var(--info);background:rgba(59,130,246,0.1);padding:1px 5px;border-radius:99px;font-weight:600">viewer</span>';
    return `
      <div class="project-item ${App.currentProject?.id === p.id ? 'active' : ''}" data-id="${p.id}">
        <div class="project-item-avatar">${Icons.getAvatar(p.avatar_index)}</div>
        <div class="project-item-info">
          <div class="project-item-name">${this.escHtml(p.name)} ${roleBadge}</div>
          <div class="project-item-count">${I18n.t('projects.markerCount', { count: p.marker_count || 0 })}</div>
        </div>
      </div>`;
  },

  renderManageList() {
    const container = document.getElementById('manage-project-list');
    const avatarSection = document.getElementById('avatar-picker-section');
    const avatarPicker = document.getElementById('avatar-picker');

    // Avatar picker
    avatarPicker.innerHTML = Icons.avatars.map((svg, i) => `
      <div class="avatar-option ${i === this.selectedAvatarIndex ? 'selected' : ''}" data-index="${i}">${svg}</div>
    `).join('');
    avatarPicker.querySelectorAll('.avatar-option').forEach(opt => {
      opt.addEventListener('click', () => {
        this.selectedAvatarIndex = parseInt(opt.dataset.index);
        avatarPicker.querySelectorAll('.avatar-option').forEach(o => o.classList.remove('selected'));
        opt.classList.add('selected');
      });
    });

    // Create project form
    const nameInput = document.getElementById('new-project-name');
    const createBtn = document.getElementById('btn-create-project');

    nameInput.onfocus = () => avatarSection.classList.remove('hidden');

    createBtn.onclick = async () => {
      const name = nameInput.value.trim();
      if (!name) return;
      try {
        const res = await fetch('/api/projects', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, avatar_index: this.selectedAvatarIndex })
        });
        if (!res.ok) throw new Error();
        const project = await res.json();
        nameInput.value = '';
        avatarSection.classList.add('hidden');
        this.selectedAvatarIndex = 0;
        await this.loadAll();
        this.renderManageList();
        App.toast(I18n.t('toast.projectCreated'), 'success');
      } catch {
        App.toast(I18n.t('toast.errorGeneric'), 'error');
      }
    };

    // Project list
    if (this.list.length === 0) {
      container.innerHTML = `<div class="empty-state"><span class="material-icons-round">folder_open</span><p>No projects yet. Create one above!</p></div>`;
      return;
    }

    const myProjects = this.list.filter(p => p.user_id === App.user.id);
    const sharedProjects = this.list.filter(p => p.user_id !== App.user.id);

    let html = '';
    if (myProjects.length > 0) {
      html += `<div style="font-size:11px;font-weight:600;text-transform:uppercase;color:var(--text-tertiary);padding:8px 0 4px;letter-spacing:0.5px">${I18n.t('projects.myProjects')}</div>`;
      html += myProjects.map(p => this._renderManageItem(p, true)).join('');
    }
    if (sharedProjects.length > 0) {
      html += `<div style="font-size:11px;font-weight:600;text-transform:uppercase;color:var(--text-tertiary);padding:12px 0 4px;letter-spacing:0.5px">${I18n.t('projects.sharedWithMe')}</div>`;
      html += sharedProjects.map(p => this._renderManageItem(p, false)).join('');
    }
    container.innerHTML = html;

    // Edit buttons
    container.querySelectorAll('.btn-edit-project').forEach(btn => {
      btn.addEventListener('click', () => this.startEdit(parseInt(btn.dataset.id)));
    });

    // Members buttons
    container.querySelectorAll('.btn-members-project').forEach(btn => {
      btn.addEventListener('click', () => this.showMembers(parseInt(btn.dataset.id)));
    });

    // Delete buttons
    container.querySelectorAll('.btn-delete-project').forEach(btn => {
      btn.addEventListener('click', async () => {
        const name = btn.dataset.name;
        const id = parseInt(btn.dataset.id);
        if (!confirm(I18n.t('projects.confirmDelete', { name }))) return;
        try {
          await fetch(`/api/projects/${id}`, { method: 'DELETE' });
          if (App.currentProject?.id === id) {
            App.currentProject = null;
            document.getElementById('project-name').textContent = I18n.t('dashboard.selectProject');
            document.getElementById('project-avatar').innerHTML = '';
            document.getElementById('map-overlay-no-project').classList.remove('hidden');
            Markers.clear();
          }
          await this.loadAll();
          this.renderManageList();
          App.toast(I18n.t('toast.projectDeleted'), 'success');
        } catch {
          App.toast(I18n.t('toast.errorGeneric'), 'error');
        }
      });
    });
  },

  async startEdit(id) {
    const project = this.list.find(p => p.id === id);
    if (!project) return;

    const item = document.querySelector(`.manage-project-item[data-id="${id}"]`);
    if (!item) return;

    const infoDiv = item.querySelector('.manage-project-info');
    const currentName = project.name;

    infoDiv.innerHTML = `
      <input type="text" class="form-input edit-name" value="${this.escHtml(currentName)}" style="font-size:14px;padding:6px 8px;">
      <div style="display:flex;gap:6px;margin-top:6px;flex-wrap:wrap;">
        ${Icons.avatars.map((svg, i) => `<div class="avatar-option ${i === project.avatar_index ? 'selected' : ''}" data-index="${i}" style="width:32px;height:32px">${svg}</div>`).join('')}
      </div>
      <div style="display:flex;gap:6px;margin-top:8px;align-items:center">
        <label style="font-size:11px;color:var(--text-tertiary)">Lat</label>
        <input type="number" step="any" class="form-input edit-lat" value="${project.center_lat || 45.7983}" style="width:110px;padding:4px 6px;font-size:12px;font-family:var(--font-mono)">
        <label style="font-size:11px;color:var(--text-tertiary)">Lng</label>
        <input type="number" step="any" class="form-input edit-lng" value="${project.center_lng || 24.1256}" style="width:110px;padding:4px 6px;font-size:12px;font-family:var(--font-mono)">
        <label style="font-size:11px;color:var(--text-tertiary)">Zoom</label>
        <input type="number" min="1" max="20" class="form-input edit-zoom" value="${project.default_zoom || 14}" style="width:50px;padding:4px 6px;font-size:12px">
      </div>
      <div style="display:flex;gap:6px;margin-top:8px;">
        <button class="btn btn-sm btn-accent btn-save-edit">${I18n.t('common.save')}</button>
        <button class="btn btn-sm btn-secondary btn-cancel-edit">${I18n.t('common.cancel')}</button>
      </div>
    `;

    let selectedAvatar = project.avatar_index;
    infoDiv.querySelectorAll('.avatar-option').forEach(opt => {
      opt.addEventListener('click', () => {
        selectedAvatar = parseInt(opt.dataset.index);
        infoDiv.querySelectorAll('.avatar-option').forEach(o => o.classList.remove('selected'));
        opt.classList.add('selected');
      });
    });

    infoDiv.querySelector('.btn-save-edit').addEventListener('click', async () => {
      const newName = infoDiv.querySelector('.edit-name').value.trim();
      if (!newName) return;
      try {
        await fetch(`/api/projects/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: newName,
            avatar_index: selectedAvatar,
            center_lat: parseFloat(infoDiv.querySelector('.edit-lat').value) || 45.7983,
            center_lng: parseFloat(infoDiv.querySelector('.edit-lng').value) || 24.1256,
            default_zoom: parseInt(infoDiv.querySelector('.edit-zoom').value) || 14
          })
        });
        await this.loadAll();
        this.renderManageList();
        if (App.currentProject?.id === id) {
          App.currentProject = this.list.find(p => p.id === id);
          if (App.currentProject) {
            document.getElementById('project-name').textContent = App.currentProject.name;
            document.getElementById('project-avatar').innerHTML = Icons.getAvatar(App.currentProject.avatar_index);
          }
        }
        App.toast(I18n.t('toast.settingsSaved'), 'success');
      } catch {
        App.toast(I18n.t('toast.errorGeneric'), 'error');
      }
    });

    infoDiv.querySelector('.btn-cancel-edit').addEventListener('click', () => {
      this.renderManageList();
    });
  },

  _renderManageItem(p, isOwner) {
    const roleBadge = isOwner
      ? '<span style="font-size:9px;color:var(--warning);background:rgba(245,158,11,0.1);padding:1px 5px;border-radius:99px;font-weight:600">owner</span>'
      : `<span style="font-size:9px;color:var(--info);background:rgba(59,130,246,0.1);padding:1px 5px;border-radius:99px;font-weight:600">${p.my_role || 'viewer'}</span>`;
    return `
      <div class="manage-project-item" data-id="${p.id}">
        <div class="manage-project-avatar">${Icons.getAvatar(p.avatar_index)}</div>
        <div class="manage-project-info">
          <div class="manage-project-name">${this.escHtml(p.name)} ${roleBadge}</div>
          <div class="manage-project-meta">${I18n.t('projects.markerCount', { count: p.marker_count || 0 })} · ${new Date(p.created_at).toLocaleDateString()}</div>
        </div>
        <div class="manage-project-actions">
          ${(isOwner || role === 'admin') ? `
            <button class="btn-icon btn-members-project" title="Membrii" data-id="${p.id}">
              <span class="material-icons-round">group</span>
            </button>
          ` : ''}
          ${isOwner ? `
            <button class="btn-icon btn-edit-project" title="Editează" data-id="${p.id}">
              <span class="material-icons-round">edit</span>
            </button>
            <button class="btn-icon btn-delete-project" title="Șterge" data-id="${p.id}" data-name="${this.escHtml(p.name)}">
              <span class="material-icons-round" style="color:var(--danger)">delete</span>
            </button>
          ` : ''}
        </div>
      </div>`;
  },

  async showMembers(projectId) {
    const project = this.list.find(p => p.id === projectId);
    if (!project) return;

    try {
      const res = await fetch(`/api/projects/${projectId}/members`);
      if (!res.ok) return;
      const { owner, members } = await res.json();

      const item = document.querySelector(`.manage-project-item[data-id="${projectId}"]`);
      if (!item) return;

      // Expand members panel below the project item
      let panel = item.nextElementSibling;
      if (panel?.classList.contains('members-panel')) {
        panel.remove(); // Toggle off
        return;
      }

      panel = document.createElement('div');
      panel.className = 'members-panel';
      panel.innerHTML = `
        <div style="padding:12px;background:var(--bg-tertiary);border-radius:var(--radius-md);margin:4px 0 8px">
          <div style="font-size:12px;font-weight:600;color:var(--text-secondary);margin-bottom:8px">
            Membrii proiectului "${this.escHtml(project.name)}"
          </div>

          <!-- Owner -->
          <div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid var(--border-light)">
            <span class="material-icons-round" style="font-size:16px;color:var(--warning)">star</span>
            <span style="flex:1;font-size:13px">${owner?.name || owner?.email || 'N/A'} <span style="font-size:11px;color:var(--text-tertiary)">${owner?.email || ''}</span></span>
            <span style="font-size:10px;color:var(--warning);font-weight:600">OWNER</span>
          </div>

          <!-- Members list -->
          <div id="members-list-${projectId}">
            ${members.length === 0 ? '<div style="padding:8px 0;font-size:12px;color:var(--text-tertiary)">Niciun membru invitat</div>' :
              members.map(m => `
                <div class="member-row" style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid var(--border-light)">
                  <span class="material-icons-round" style="font-size:16px;color:var(--text-tertiary)">person</span>
                  <span style="flex:1;font-size:13px">${m.user_name || m.user_email} <span style="font-size:11px;color:var(--text-tertiary)">${m.user_email}</span></span>
                  <select class="member-role filter-select" data-member-id="${m.id}" style="width:90px;padding:2px 6px;font-size:11px">
                    <option value="viewer" ${m.role === 'viewer' ? 'selected' : ''}>Viewer</option>
                    <option value="admin" ${m.role === 'admin' ? 'selected' : ''}>Admin</option>
                  </select>
                  <button class="btn-icon member-remove" data-member-id="${m.id}" title="Elimină">
                    <span class="material-icons-round" style="font-size:16px;color:var(--danger)">person_remove</span>
                  </button>
                </div>
              `).join('')}
          </div>

          <!-- Invite form -->
          <div style="display:flex;gap:6px;margin-top:10px">
            <input type="email" class="form-input invite-email" placeholder="adresa@gmail.com" style="flex:1;padding:6px 10px;font-size:12px">
            <select class="filter-select invite-role" style="width:90px;padding:4px 6px;font-size:11px">
              <option value="viewer">Viewer</option>
              <option value="admin">Admin</option>
            </select>
            <button class="btn btn-sm btn-accent invite-btn">
              <span class="material-icons-round" style="font-size:14px">person_add</span> Invită
            </button>
          </div>
        </div>
      `;

      item.after(panel);

      // Role change
      panel.querySelectorAll('.member-role').forEach(sel => {
        sel.addEventListener('change', async () => {
          await fetch(`/api/projects/${projectId}/members/${sel.dataset.memberId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ role: sel.value })
          });
          App.toast('Rol actualizat', 'success');
        });
      });

      // Remove member
      panel.querySelectorAll('.member-remove').forEach(btn => {
        btn.addEventListener('click', async () => {
          if (!confirm('Elimini acest membru?')) return;
          await fetch(`/api/projects/${projectId}/members/${btn.dataset.memberId}`, { method: 'DELETE' });
          panel.remove();
          this.showMembers(projectId); // Refresh
        });
      });

      // Invite
      panel.querySelector('.invite-btn').addEventListener('click', async () => {
        const email = panel.querySelector('.invite-email').value.trim();
        const role = panel.querySelector('.invite-role').value;
        if (!email) return;
        const r = await fetch(`/api/projects/${projectId}/members`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, role })
        });
        if (r.ok) {
          App.toast(`${email} invitat ca ${role}`, 'success');
          panel.remove();
          this.showMembers(projectId); // Refresh
        } else {
          const err = await r.json();
          App.toast(err.error || 'Eroare', 'error');
        }
      });
    } catch (e) {
      App.toast('Eroare la încărcare membrii', 'error');
    }
  },

  escHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
};
