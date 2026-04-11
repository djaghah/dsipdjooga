// ============================
// Markers Manager
// ============================
window.Markers = {
  list: [],
  filteredList: [],
  editingMarker: null,
  viewMode: 'all', // 'all' or 'inview'

  async loadForProject(projectId) {
    try {
      const res = await fetch(`/api/markers/project/${projectId}`);
      if (!res.ok) return;
      this.list = await res.json();
      this.applyAllFilters();
      this.updateStats();
      MapManager.displayMarkers(this.list);
    } catch (e) {
      console.error('Failed to load markers:', e);
    }
  },

  clear() {
    this.list = [];
    this.filteredList = [];
    this.renderList();
    this.updateStats();
    MapManager.clearMapMarkers();
  },

  // Called by MapManager when map bounds change (zoom/pan)
  _boundsTimer: null,
  onMapBoundsChanged() {
    if (this.viewMode !== 'inview') return;
    clearTimeout(this._boundsTimer);
    this._boundsTimer = setTimeout(() => this.applyAllFilters(), 200);
  },

  // --- Combined filtering ---
  applyAllFilters() {
    const q = (document.getElementById('sidebar-search-input')?.value || '').toLowerCase();
    const status = document.getElementById('filter-status')?.value || '';
    const condition = document.getElementById('filter-condition')?.value || '';

    this.filteredList = this.list.filter(m => {
      // Text search
      if (q) {
        const name = (m.title || Icons.getIconName(m.icon_type, m.icon_index)).toLowerCase();
        const obs = (m.observations || '').toLowerCase();
        const resp = (m.responsible || '').toLowerCase();
        if (!name.includes(q) && !obs.includes(q) && !resp.includes(q)) return false;
      }
      // Status filter
      if (status && m.status !== status) return false;
      // Condition filter
      if (condition && m.condition !== condition) return false;
      // Bounds filter
      if (this.viewMode === 'inview' && !MapManager.isInBounds(m.lat, m.lng)) return false;
      return true;
    });

    this.renderList();
  },

  renderList() {
    const container = document.getElementById('marker-list');
    if (this.filteredList.length === 0) {
      container.innerHTML = `<div class="empty-state"><span class="material-icons-round">place</span><p>${I18n.t('sidebar.noMarkers')}</p></div>`;
      return;
    }

    const canEdit = App.currentProjectRole === 'admin';

    container.innerHTML = this.filteredList.map((m, idx) => {
      const iconSvg = Icons.getIconByType(m.icon_type, m.icon_index) || '';
      const iconName = m.title || Icons.getIconName(m.icon_type, m.icon_index);
      return `
        <div class="marker-card ${m.status === 'inactive' ? 'inactive' : ''}" data-id="${m.id}">
          <div class="marker-card-icon">${iconSvg}</div>
          <div class="marker-card-info">
            <div class="marker-card-title">${this.escHtml(iconName)}</div>
            <div class="marker-card-meta">
              <span class="marker-card-status-dot ${m.status || 'active'}"></span>
              <span>${m.lat.toFixed(4)}, ${m.lng.toFixed(4)}</span>
              ${m.responsible ? `<span>· ${this.escHtml(m.responsible)}</span>` : ''}
            </div>
          </div>
          ${canEdit ? `<div class="marker-card-actions">
            <button class="btn-icon btn-edit-marker" data-id="${m.id}" title="Editează">
              <span class="material-icons-round" style="font-size:16px">edit</span>
            </button>
            <button class="btn-icon btn-toggle-status" data-id="${m.id}" title="${m.status === 'active' ? 'Dezactivează' : 'Activează'}">
              <span class="material-icons-round" style="font-size:18px;color:${m.status === 'active' ? 'var(--success)' : 'var(--text-tertiary)'}">${m.status === 'active' ? 'toggle_on' : 'toggle_off'}</span>
            </button>
          </div>` : ''}
        </div>
      `;
    }).join('');

    // Edit button
    container.querySelectorAll('.btn-edit-marker').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const marker = this.list.find(m => m.id === parseInt(btn.dataset.id));
        if (marker) this.openEditModal(marker);
      });
    });

    // Toggle active/inactive
    container.querySelectorAll('.btn-toggle-status').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleStatus(parseInt(btn.dataset.id));
      });
    });

    // Click on card → center map on marker
    container.querySelectorAll('.marker-card').forEach(card => {
      card.addEventListener('click', (e) => {
        if (e.target.closest('.btn-icon')) return;
        const id = parseInt(card.dataset.id);
        const marker = this.list.find(m => m.id === id);
        if (!marker) return;

        container.querySelectorAll('.marker-card').forEach(c => c.classList.remove('active'));
        card.classList.add('active');
        // Focus on Leaflet or Google Maps depending on active provider
        if (App._useLeaflet && App._leafletMap) {
          App._leafletMap.setView([marker.lat, marker.lng], 17);
          App._leafletMarkers?.forEach(lm => {
            if (Math.abs(lm.getLatLng().lat - marker.lat) < 0.00001 && Math.abs(lm.getLatLng().lng - marker.lng) < 0.00001) lm.openPopup();
          });
        } else {
          MapManager.focusMarker(id);
        }
      });

      // Double-click on card → open edit (admin only)
      if (canEdit) {
        card.addEventListener('dblclick', (e) => {
          const marker = this.list.find(m => m.id === parseInt(card.dataset.id));
          if (marker) this.openEditModal(marker);
        });
      }
    });
  },

  filterList(query) {
    this.applyAllFilters();
  },

  updateStats() {
    document.getElementById('stat-total').textContent = this.list.length;
    document.getElementById('stat-active').textContent = this.list.filter(m => m.status === 'active').length;
    document.getElementById('stat-maintenance').textContent = this.list.filter(m => m.status === 'maintenance').length;
  },

  // --- Quick toggle active/inactive from sidebar ---
  async toggleStatus(markerId) {
    const marker = this.list.find(m => m.id === markerId);
    if (!marker) return;
    const newStatus = marker.status === 'active' ? 'inactive' : 'active';
    try {
      await fetch(`/api/markers/${markerId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      await this.loadForProject(App.currentProject.id);
      App.toast(`Marker ${newStatus}`, 'success');
    } catch {
      App.toast(I18n.t('toast.errorGeneric'), 'error');
    }
  },

  // --- Create marker modal ---
  openCreateModal(lat, lng, preselectedType, preselectedIndex) {
    this.editingMarker = null;
    document.getElementById('modal-marker-title').textContent = I18n.t('marker.add');
    document.getElementById('btn-delete-marker').classList.add('hidden');

    // Clear form
    document.getElementById('marker-title').value = '';
    document.getElementById('marker-lat').value = lat.toFixed(6);
    document.getElementById('marker-lng').value = lng.toFixed(6);
    document.getElementById('marker-observations').value = '';
    document.getElementById('marker-status').value = 'active';
    document.getElementById('marker-condition').value = 'good';
    document.getElementById('marker-priority').value = 'normal';
    document.getElementById('marker-responsible').value = '';
    document.getElementById('marker-cost').value = '';
    document.getElementById('marker-currency').value = 'EUR';
    document.getElementById('marker-install-date').value = '';
    document.getElementById('marker-maintenance-date').value = '';
    document.getElementById('marker-repair-date').value = '';
    document.getElementById('marker-warranty-date').value = '';
    document.getElementById('marker-images-preview').innerHTML = '';

    // Build icon picker (with optional preselection from context menu)
    this.buildIconPicker(null, preselectedType, preselectedIndex);

    // Setup save button
    document.getElementById('btn-save-marker').onclick = () => this.saveMarker();

    App.openModal('modal-marker');
  },

  openEditModal(marker) {
    this.editingMarker = marker;
    document.getElementById('modal-marker-title').textContent = I18n.t('marker.edit');
    document.getElementById('btn-delete-marker').classList.remove('hidden');

    // Fill form
    document.getElementById('marker-title').value = marker.title || '';
    document.getElementById('marker-lat').value = marker.lat;
    document.getElementById('marker-lng').value = marker.lng;
    document.getElementById('marker-observations').value = marker.observations || '';
    document.getElementById('marker-status').value = marker.status || 'active';
    document.getElementById('marker-condition').value = marker.condition || 'good';
    document.getElementById('marker-priority').value = marker.priority || 'normal';
    document.getElementById('marker-responsible').value = marker.responsible || '';
    document.getElementById('marker-cost').value = marker.cost || '';
    document.getElementById('marker-currency').value = marker.currency || 'EUR';
    document.getElementById('marker-install-date').value = marker.installation_date || '';
    document.getElementById('marker-maintenance-date').value = marker.maintenance_date || '';
    document.getElementById('marker-repair-date').value = marker.repair_date || '';
    document.getElementById('marker-warranty-date').value = marker.warranty_date || '';

    // Build icon picker with current selection
    this.buildIconPicker(marker);

    // Show images
    this.renderImagesPrev(marker);

    // Setup save
    document.getElementById('btn-save-marker').onclick = () => this.saveMarker();

    // Setup delete
    document.getElementById('btn-delete-marker').onclick = () => this.deleteMarker(marker.id);

    App.openModal('modal-marker');
  },

  buildIconPicker(marker, preType, preIndex) {
    const picker = document.getElementById('marker-icon-picker');
    const projectType = App.currentProject ? Icons.guessProjectType(App.currentProject.name) : 'default';
    const activeType = preType || marker?.icon_type || projectType;
    const activeIndex = preIndex ?? marker?.icon_index ?? 0;

    const hasCustom = Icons.customTypes.length > 0;

    // Type tabs
    let html = `<div class="picker-tabs">
      <button class="picker-tab ${activeType === 'default' ? 'active' : ''}" data-type="default">${I18n.t('picker.general')}</button>
      <button class="picker-tab ${activeType === 'hydrant' ? 'active' : ''}" data-type="hydrant">${I18n.t('picker.firefighter')}</button>
      <button class="picker-tab ${activeType === 'road_sign' ? 'active' : ''}" data-type="road_sign">${I18n.t('picker.signs')}</button>
      ${hasCustom ? `<button class="picker-tab ${activeType === 'custom' ? 'active' : ''}" data-type="custom">Custom</button>` : ''}
      <button class="picker-tab picker-tab-manage" id="btn-manage-marker-types" title="Manage marker types">
        <span class="material-icons-round" style="font-size:16px">settings</span>
      </button>
    </div>`;

    html += `<div class="picker-grid-container">`;
    html += this._renderIconGrid(activeType, activeType, activeIndex);
    html += `</div>`;

    picker.innerHTML = html;

    // Tab switching
    picker.querySelectorAll('.picker-tab[data-type]').forEach(tab => {
      tab.addEventListener('click', () => {
        picker.querySelectorAll('.picker-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        const type = tab.dataset.type;
        picker.querySelector('.picker-grid-container').innerHTML = this._renderIconGrid(type);
        this._bindIconClicks(picker);
      });
    });

    // Manage button
    const manageBtn = picker.querySelector('#btn-manage-marker-types');
    if (manageBtn) {
      manageBtn.addEventListener('click', () => MarkerTypes.openManageModal());
    }

    this._bindIconClicks(picker);
  },

  _renderIconGrid(type, selectedType, selectedIndex) {
    let html = '';

    if (type === 'hydrant') {
      // Group by category
      const cats = Icons.getHydrantCategories();
      const catLabels = { hydrants: 'Hidranți', water: 'Surse Apă', equipment: 'Echipament Stingere', alarms: 'Alarme & Sisteme', locations: 'Locații Speciale' };
      for (const [catName, catIcons] of Object.entries(cats)) {
        html += `<div class="picker-cat-label">${catLabels[catName] || catName}</div><div class="picker-grid">`;
        catIcons.forEach(icon => {
          const isSel = selectedType === 'hydrant' && selectedIndex === icon.index;
          html += `<div class="icon-option ${isSel ? 'selected' : ''}" data-type="hydrant" data-index="${icon.index}" title="${icon.name}">${icon.svg}<span class="icon-label">${icon.name}</span></div>`;
        });
        html += '</div>';
      }
    } else if (type === 'custom') {
      const allProjTypes = Icons.customTypes.filter(t => t.scope === 'all');
      const thisProjTypes = Icons.customTypes.filter(t => t.project_id && t.project_id == App.currentProject?.id);

      if (allProjTypes.length > 0) {
        html += `<div class="picker-cat-label">Toate Proiectele</div><div class="picker-grid">`;
        allProjTypes.forEach(ct => {
          const isSel = selectedType === 'custom' && selectedIndex === ct.id;
          html += `<div class="icon-option ${isSel ? 'selected' : ''}" data-type="custom" data-index="${ct.id}" title="${ct.name}">${ct.svg_data || ''}<span class="icon-label">${ct.name}</span></div>`;
        });
        html += '</div>';
      }
      if (thisProjTypes.length > 0) {
        html += `<div class="picker-cat-label">Proiectul Curent</div><div class="picker-grid">`;
        thisProjTypes.forEach(ct => {
          const isSel = selectedType === 'custom' && selectedIndex === ct.id;
          html += `<div class="icon-option ${isSel ? 'selected' : ''}" data-type="custom" data-index="${ct.id}" title="${ct.name}">${ct.svg_data || ''}<span class="icon-label">${ct.name}</span></div>`;
        });
        html += '</div>';
      }
      if (Icons.customTypes.length === 0) {
        html += `<div class="empty-state" style="padding:20px"><p>No custom types yet. Click ⚙ to create one.</p></div>`;
      }
    } else {
      const icons = Icons.getAllForType(type);
      html += `<div class="picker-grid">`;
      icons.forEach(icon => {
        const isSel = selectedType === type && selectedIndex === icon.index;
        html += `<div class="icon-option ${isSel ? 'selected' : ''}" data-type="${icon.type || type}" data-index="${icon.index}" title="${icon.name}">${icon.svg}<span class="icon-label">${icon.name}</span></div>`;
      });
      html += '</div>';
    }
    return html;
  },

  _bindIconClicks(picker) {
    picker.querySelectorAll('.icon-option').forEach(opt => {
      opt.addEventListener('click', () => {
        picker.querySelectorAll('.icon-option').forEach(o => o.classList.remove('selected'));
        opt.classList.add('selected');
      });
    });
  },

  renderImagesPrev(marker) {
    const preview = document.getElementById('marker-images-preview');
    if (!marker?.images?.length) {
      preview.innerHTML = '';
      return;
    }
    preview.innerHTML = marker.images.map(img => `
      <div class="image-thumb">
        <img src="/uploads/${App.user.id}/${img.filename}" alt="">
        <button class="image-thumb-delete" data-image-id="${img.id}" title="Delete">×</button>
      </div>
    `).join('');

    preview.querySelectorAll('.image-thumb-delete').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const imageId = btn.dataset.imageId;
        try {
          await fetch(`/api/uploads/marker-image/${imageId}`, { method: 'DELETE' });
          btn.closest('.image-thumb').remove();
        } catch {}
      });
    });

    // Image upload handler
    const uploadInput = document.getElementById('marker-image-upload');
    uploadInput.onchange = async () => {
      if (!uploadInput.files[0] || !marker?.id) return;
      const formData = new FormData();
      formData.append('image', uploadInput.files[0]);
      try {
        const res = await fetch(`/api/uploads/marker/${marker.id}`, { method: 'POST', body: formData });
        if (res.ok) {
          const img = await res.json();
          const thumb = document.createElement('div');
          thumb.className = 'image-thumb';
          thumb.innerHTML = `<img src="${img.url}" alt=""><button class="image-thumb-delete" data-image-id="${img.id}" title="Delete">×</button>`;
          thumb.querySelector('.image-thumb-delete').addEventListener('click', async (e) => {
            e.stopPropagation();
            await fetch(`/api/uploads/marker-image/${img.id}`, { method: 'DELETE' });
            thumb.remove();
          });
          preview.appendChild(thumb);
        }
      } catch {}
      uploadInput.value = '';
    };
  },

  async saveMarker() {
    const selected = document.querySelector('#marker-icon-picker .icon-option.selected');
    const iconType = selected?.dataset.type || 'default';
    const iconIndex = parseInt(selected?.dataset.index || 0);

    const data = {
      project_id: App.currentProject.id,
      lat: parseFloat(document.getElementById('marker-lat').value),
      lng: parseFloat(document.getElementById('marker-lng').value),
      title: document.getElementById('marker-title').value.trim(),
      icon_type: iconType,
      icon_index: iconIndex,
      observations: document.getElementById('marker-observations').value.trim(),
      status: document.getElementById('marker-status').value,
      condition: document.getElementById('marker-condition').value,
      priority: document.getElementById('marker-priority').value,
      responsible: document.getElementById('marker-responsible').value.trim(),
      cost: parseFloat(document.getElementById('marker-cost').value) || 0,
      currency: document.getElementById('marker-currency').value,
      installation_date: document.getElementById('marker-install-date').value || null,
      maintenance_date: document.getElementById('marker-maintenance-date').value || null,
      repair_date: document.getElementById('marker-repair-date').value || null,
      warranty_date: document.getElementById('marker-warranty-date').value || null
    };

    try {
      let res;
      if (this.editingMarker) {
        res = await fetch(`/api/markers/${this.editingMarker.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
      } else {
        res = await fetch('/api/markers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
      }

      if (!res.ok) throw new Error();

      // Handle image upload for new markers
      const newMarker = await res.json();
      const uploadInput = document.getElementById('marker-image-upload');
      if (!this.editingMarker && uploadInput.files[0]) {
        const formData = new FormData();
        formData.append('image', uploadInput.files[0]);
        await fetch(`/api/uploads/marker/${newMarker.id}`, { method: 'POST', body: formData });
      }

      App.closeModal('modal-marker');
      MapManager.removeTemporaryMarker();
      await this.loadForProject(App.currentProject.id);
      await Projects.loadAll(); // Update marker counts
      App.toast(I18n.t('toast.markerSaved'), 'success');
    } catch {
      App.toast(I18n.t('toast.errorGeneric'), 'error');
    }
  },

  async deleteMarker(id) {
    if (!confirm(I18n.t('common.confirm') + '?')) return;
    try {
      await fetch(`/api/markers/${id}`, { method: 'DELETE' });
      App.closeModal('modal-marker');
      MapManager.removeTemporaryMarker();
      await this.loadForProject(App.currentProject.id);
      await Projects.loadAll();
      App.toast(I18n.t('toast.markerDeleted'), 'success');
    } catch {
      App.toast(I18n.t('toast.errorGeneric'), 'error');
    }
  },

  escHtml(str) {
    const div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
  },

  // --- PDF Export ---
  exportPDF() {
    if (!App.currentProject) {
      App.toast(I18n.t('map.selectProjectFirst'), 'warning');
      return;
    }

    if (!window.jspdf?.jsPDF) {
      App.toast('PDF library loading... try again in a moment.', 'warning');
      return;
    }

    const markers = this.filteredList;
    const project = App.currentProject;
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const margin = 14;

    // Colors
    const accent = [79, 110, 247];
    const dark = [30, 33, 48];
    const gray = [120, 125, 145];
    const lightBg = [245, 246, 250];

    // --- Header band ---
    doc.setFillColor(...accent);
    doc.rect(0, 0, pageW, 28, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(project.name, margin, 12);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Djooga MapManager — ' + I18n.t('pdf.title'), margin, 19);
    doc.text(I18n.t('pdf.generated') + ': ' + new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString(), pageW - margin, 12, { align: 'right' });
    doc.text(markers.length + ' markers', pageW - margin, 19, { align: 'right' });

    // --- Applied filters ---
    let y = 34;
    const statusFilter = document.getElementById('filter-status')?.value || '';
    const condFilter = document.getElementById('filter-condition')?.value || '';
    const searchFilter = document.getElementById('sidebar-search-input')?.value || '';

    if (statusFilter || condFilter || searchFilter) {
      doc.setFontSize(9);
      doc.setTextColor(...gray);
      let filterText = I18n.t('pdf.filters') + ': ';
      if (statusFilter) filterText += I18n.t('pdf.status') + '=' + statusFilter + '  ';
      if (condFilter) filterText += I18n.t('pdf.condition') + '=' + condFilter + '  ';
      if (searchFilter) filterText += I18n.t('pdf.search') + '="' + searchFilter + '"';
      doc.text(filterText, margin, y);
      y += 6;
    }

    // --- Table ---
    if (markers.length === 0) {
      doc.setFontSize(12);
      doc.setTextColor(...gray);
      doc.text(I18n.t('pdf.noMarkers'), pageW / 2, 60, { align: 'center' });
    } else {
      const statusLabels = { active: I18n.t('filter.active'), inactive: I18n.t('filter.inactive'), maintenance: I18n.t('filter.maintenance') };
      const condLabels = { good: I18n.t('filter.good'), fair: I18n.t('filter.fair'), poor: I18n.t('filter.poor'), critical: I18n.t('filter.critical') };

      const headers = [
        '#',
        I18n.t('marker.title'),
        I18n.t('marker.status'),
        I18n.t('marker.condition'),
        I18n.t('marker.responsible'),
        I18n.t('marker.cost'),
        I18n.t('marker.installDate'),
        I18n.t('marker.maintenanceDate'),
        I18n.t('marker.warrantyDate'),
        'Lat, Lng'
      ];

      const rows = markers.map((m, i) => [
        i + 1,
        m.title || Icons.getIconName(m.icon_type, m.icon_index) || '-',
        statusLabels[m.status] || m.status || '-',
        condLabels[m.condition] || m.condition || '-',
        m.responsible || '-',
        m.cost ? `${m.cost} ${m.currency || 'EUR'}` : '-',
        m.installation_date || '-',
        m.maintenance_date || '-',
        m.warranty_date || '-',
        `${m.lat.toFixed(5)}, ${m.lng.toFixed(5)}`
      ]);

      doc.autoTable({
        startY: y,
        head: [headers],
        body: rows,
        margin: { left: margin, right: margin },
        styles: {
          fontSize: 8,
          cellPadding: 2.5,
          lineColor: [220, 222, 230],
          lineWidth: 0.3,
          textColor: dark
        },
        headStyles: {
          fillColor: accent,
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 8
        },
        alternateRowStyles: {
          fillColor: lightBg
        },
        columnStyles: {
          0: { cellWidth: 8, halign: 'center' },
          1: { cellWidth: 42 },
          5: { halign: 'right', cellWidth: 22 },
          9: { fontSize: 7, cellWidth: 32 }
        },
        didDrawPage: (data) => {
          // Footer on each page
          doc.setFontSize(7);
          doc.setTextColor(...gray);
          doc.text(
            `Djooga MapManager — ${project.name} — Page ${doc.internal.getCurrentPageInfo().pageNumber}`,
            pageW / 2, pageH - 6, { align: 'center' }
          );
        }
      });
    }

    // Save
    const safeName = project.name.replace(/[^a-zA-Z0-9-_ ]/g, '').replace(/\s+/g, '_');
    doc.save(`${safeName}_markers_${new Date().toISOString().slice(0, 10)}.pdf`);
    App.toast(I18n.t('pdf.export') + ' OK', 'success');
  }
};
