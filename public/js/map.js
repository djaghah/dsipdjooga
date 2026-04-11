// ============================
// Google Maps Manager
// ============================
window.MapManager = {
  map: null,
  markers: [],
  infoWindow: null,
  geocoder: null,
  tempMarker: null,
  mode: 'view',
  clusterer: null,
  mapLoaded: false,
  movingMarker: null,      // marker currently being moved
  movingOrigPos: null,     // original position before move
  pendingMarkers: null,    // markers queued while map loads
  showPOI: true,           // show Google POIs (restaurants, hospitals, etc.)
  geoCache: {},

  async init() {
    try { this.geoCache = JSON.parse(localStorage.getItem('dsip_geocache') || '{}'); } catch { this.geoCache = {}; }

    if (!App.config?.mapsApiKey) { console.warn('No Maps API key'); return; }

    // Session caching: if map was already loaded this session, don't count again
    const sessionKey = 'dsip_maps_loaded_' + new Date().toISOString().slice(0, 10);
    if (sessionStorage.getItem(sessionKey)) {
      // Map was loaded earlier in this session — skip increment, just load
      await this.loadGoogleMaps();
      return;
    }

    // Check user rate limit before loading maps
    const allowed = await this.checkAndIncrement('maps_load');
    if (!allowed) {
      // If map is already cached in browser (Google Maps script cached), allow view-only
      if (window.google?.maps) {
        this._quotaExceeded = true;
        await this.loadGoogleMaps();
        App.toast(I18n.t('quota.readOnly'), 'warning');
        return;
      }
      this.showQuotaExhausted();
      return;
    }

    // Mark session as loaded (so soft navigations / SPA re-renders don't re-count)
    sessionStorage.setItem(sessionKey, '1');
    await this.loadGoogleMaps();
  },

  // Try to increment usage — returns false if rate limited
  async checkAndIncrement(type) {
    try {
      const r = await fetch('/api/usage/increment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type })
      });
      if (r.status === 429) {
        const data = await r.json().catch(() => ({}));
        this._lastLimitError = data.error || 'rate_limit';
        return false;
      }
      return r.ok;
    } catch { return true; }
  },

  loadGoogleMaps() {
    return new Promise((resolve, reject) => {
      if (window.google?.maps) { this.onMapsLoaded(); return resolve(); }
      const s = document.createElement('script');
      s.src = `https://maps.googleapis.com/maps/api/js?key=${App.config.mapsApiKey}&libraries=places,marker&callback=__initMap`;
      s.async = true; s.defer = true;
      window.__initMap = () => { delete window.__initMap; this.onMapsLoaded(); resolve(); };
      s.onerror = () => reject();
      document.head.appendChild(s);
      const cs = document.createElement('script');
      cs.src = 'https://unpkg.com/@googlemaps/markerclusterer/dist/index.min.js';
      cs.async = true; document.head.appendChild(cs);
    });
  },

  async onMapsLoaded() {
    // Usage already incremented in init() before loading maps
    App.updateMapsUsage();
    this.mapLoaded = true;

    this.map = new google.maps.Map(document.getElementById('map'), {
      center: { lat: 45.7983, lng: 24.1256 }, // Sibiu centru
      zoom: 14,
      disableDefaultUI: false,
      mapTypeControl: true,
      mapTypeControlOptions: { style: google.maps.MapTypeControlStyle.DROPDOWN_MENU, position: google.maps.ControlPosition.TOP_RIGHT },
      streetViewControl: false,
      fullscreenControl: true,
      zoomControl: true,
      gestureHandling: 'greedy',
      styles: this.getMapStyles()
    });

    this.infoWindow = new google.maps.InfoWindow();
    this.geocoder = new google.maps.Geocoder();

    // --- Left click: close menus ---
    this.map.addListener('click', () => { this.hideContextMenu(); this.hideMarkerPopup(); });

    // --- Right-click: context menu (admin) ---
    this.map.addListener('rightclick', (e) => {
      if (this.mode === 'admin' && App.currentProject && !this.movingMarker) {
        this.showContextMenu(e.latLng, e.domEvent);
      }
    });

    // --- Double-click: quick add marker (admin) ---
    this.map.addListener('dblclick', (e) => {
      if (this.mode === 'admin' && App.currentProject && !this.movingMarker) {
        Markers.openCreateModal(e.latLng.lat(), e.latLng.lng());
      }
    });

    this.map.addListener('dragstart', () => { this.hideContextMenu(); this.hideMarkerPopup(); });
    this.map.addListener('zoom_changed', () => { this.hideContextMenu(); this.hideMarkerPopup(); });

    this.initSearch();
    this.initCoordInput();

    // Flush any markers that were queued while map was loading
    if (this.pendingMarkers) {
      const pm = this.pendingMarkers;
      this.pendingMarkers = null;
      this.displayMarkers(pm);
    }

    // Auto-resize map when container size changes (ads sidebar toggle)
    const mapEl = document.getElementById('map');
    if (window.ResizeObserver) {
      new ResizeObserver(() => {
        if (this.map) google.maps.event.trigger(this.map, 'resize');
      }).observe(mapEl);
    }

    // Notify sidebar when visible area changes
    this.map.addListener('idle', () => {
      if (typeof Markers !== 'undefined' && Markers.onMapBoundsChanged) {
        Markers.onMapBoundsChanged();
      }
    });
  },

  // ============================
  // SEARCH BAR (Geocoding API)
  // ============================
  initSearch() {
    const input = document.getElementById('map-search-input');
    const results = document.getElementById('map-search-results');
    let debounce = null;

    // --- Search on typing ---
    input.addEventListener('input', () => {
      clearTimeout(debounce);
      const q = input.value.trim();
      if (q.length < 3) { results.classList.add('hidden'); return; }

      // Check local cache
      const cached = this.geoCache[q.toLowerCase()];
      if (cached) { this.showSearchResults(Array.isArray(cached) ? cached : [cached], results); return; }

      debounce = setTimeout(() => this.doGeocode(q, results), 350);
    });

    // --- Enter key navigates to first result ---
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        clearTimeout(debounce);
        const q = input.value.trim();
        if (!q) return;
        const cached = this.geoCache[q.toLowerCase()];
        if (cached) {
          const item = Array.isArray(cached) ? cached[0] : cached;
          this.goToLocation(item.lat, item.lng, item.name || q);
          results.classList.add('hidden');
        } else {
          this.doGeocode(q, results, true);
        }
      }
    });

    document.addEventListener('click', (e) => {
      if (!e.target.closest('.map-search-box')) results.classList.add('hidden');
    });
  },

  async doGeocode(query, resultsEl, goToFirst = false) {
    if (!this.geocoder) {
      App.toast(I18n.t('toast.mapNotReady'), 'warning');
      return;
    }
    // Block geocoding if quota was exceeded (view-only mode)
    if (this._quotaExceeded) {
      App.toast(I18n.t('quota.searchBlocked'), 'warning');
      resultsEl.classList.add('hidden');
      return;
    }
    // Check rate limit before geocoding
    const allowed = await this.checkAndIncrement('geocode');
    if (!allowed) {
      const msg = this._lastLimitError === 'total_limit'
        ? 'Limita totală de căutări atinsă.'
        : 'Limita zilnică de căutări atinsă.';
      App.toast(msg, 'warning');
      resultsEl.classList.add('hidden');
      return;
    }
    this.geocoder.geocode({ address: query }, (res, status) => {
      if (status === 'OK' && res.length > 0) {
        const items = res.slice(0, 5).map(r => ({
          name: r.formatted_address,
          address: r.formatted_address,
          lat: r.geometry.location.lat(),
          lng: r.geometry.location.lng()
        }));
        this.geoCache[query.toLowerCase()] = items;
        this.saveGeoCache();

        if (goToFirst) {
          this.goToLocation(items[0].lat, items[0].lng, items[0].name);
          resultsEl.classList.add('hidden');
        } else {
          this.showSearchResults(items, resultsEl);
        }
      } else {
        console.error('Geocode failed:', status, 'for query:', query);
        if (status === 'REQUEST_DENIED') {
          App.toast('Geocoding API not enabled. Enable it in Google Cloud Console.', 'error');
        } else if (status === 'OVER_QUERY_LIMIT') {
          App.toast(I18n.t('toast.errorGeneric'), 'warning');
        } else {
          App.toast(I18n.t('toast.locationNotFound', { query }), 'warning');
        }
        resultsEl.classList.add('hidden');
      }
    });
  },

  goToLocation(lat, lng, name) {
    this.map.panTo({ lat, lng });
    this.map.setZoom(16);
    document.getElementById('map-search-input').value = name || '';
  },

  showSearchResults(items, container) {
    container.innerHTML = items.map(item => `
      <div class="search-result-item" data-lat="${item.lat}" data-lng="${item.lng}">
        <strong>${item.name || item.address || ''}</strong>
      </div>
    `).join('');
    container.classList.remove('hidden');
    container.querySelectorAll('.search-result-item').forEach(el => {
      el.addEventListener('click', () => {
        this.goToLocation(parseFloat(el.dataset.lat), parseFloat(el.dataset.lng), el.textContent.trim());
        container.classList.add('hidden');
      });
    });
  },

  // ============================
  // COORDINATE INPUT
  // ============================
  initCoordInput() {
    document.getElementById('btn-goto-coords').addEventListener('click', () => {
      const lat = parseFloat(document.getElementById('coord-lat').value);
      const lng = parseFloat(document.getElementById('coord-lng').value);
      if (isNaN(lat) || isNaN(lng)) { App.toast('Coordonate invalide', 'warning'); return; }
      this.goToLocation(lat, lng, `${lat.toFixed(4)}, ${lng.toFixed(4)}`);
    });
  },

  // ============================
  // CONTEXT MENU (right-click)
  // ============================
  showContextMenu(latLng, domEvent) {
    this.hideMarkerPopup();
    const menu = document.getElementById('map-context-menu');
    if (!menu) return;

    const mapDiv = document.getElementById('map-container');
    const rect = mapDiv.getBoundingClientRect();
    let x = domEvent.clientX - rect.left;
    let y = domEvent.clientY - rect.top;
    if (x + 240 > rect.width) x = rect.width - 248;
    if (y + 320 > rect.height) y = rect.height - 328;
    if (x < 8) x = 8; if (y < 8) y = 8;

    menu.style.left = x + 'px';
    menu.style.top = y + 'px';
    menu.dataset.lat = latLng.lat();
    menu.dataset.lng = latLng.lng();
    menu.classList.remove('hidden');
    this.buildContextMenuIcons(menu);
  },

  hideContextMenu() {
    const m = document.getElementById('map-context-menu');
    if (m) m.classList.add('hidden');
  },

  buildContextMenuIcons(menu) {
    const projectType = App.currentProject ? Icons.guessProjectType(App.currentProject.name) : 'default';
    const grid = menu.querySelector('.ctx-icon-grid');
    if (!grid) return;

    let html = '';
    if (projectType === 'hydrant') {
      const cats = Icons.getHydrantCategories();
      const labels = { hydrants: 'Hidranți', water: 'Surse Apă', equipment: 'Echipament', alarms: 'Alarme', locations: 'Locații' };
      for (const [cat, icons] of Object.entries(cats)) {
        html += `<div class="ctx-cat-label">${labels[cat] || cat}</div>`;
        icons.forEach(ic => { html += `<div class="ctx-icon-option" data-type="hydrant" data-index="${ic.index}" title="${ic.name}">${ic.svg}</div>`; });
      }
    } else {
      Icons.getAllForType(projectType).forEach(ic => {
        html += `<div class="ctx-icon-option" data-type="${ic.type || projectType}" data-index="${ic.index}" title="${ic.name}">${ic.svg}</div>`;
      });
    }

    // "Alege altceva..." opens full modal
    html += `<div class="ctx-icon-more" id="ctx-more-btn" title="Mai multe..."><span class="material-icons-round" style="font-size:20px">more_horiz</span></div>`;
    grid.innerHTML = html;

    grid.querySelectorAll('.ctx-icon-option').forEach(opt => {
      opt.addEventListener('click', () => {
        const lat = parseFloat(menu.dataset.lat);
        const lng = parseFloat(menu.dataset.lng);
        this.hideContextMenu();
        Markers.openCreateModal(lat, lng, opt.dataset.type, parseInt(opt.dataset.index));
      });
    });
    const more = grid.querySelector('#ctx-more-btn');
    if (more) more.addEventListener('click', () => {
      const lat = parseFloat(menu.dataset.lat);
      const lng = parseFloat(menu.dataset.lng);
      this.hideContextMenu();
      Markers.openCreateModal(lat, lng);
    });
  },

  // ============================
  // MARKER POPUP (click on existing marker)
  // ============================
  showMarkerPopup(marker, data) {
    this.hideContextMenu();
    this.hideMarkerPopup();
    const popup = document.getElementById('marker-popup');
    if (!popup) return;

    // Position popup near marker
    const proj = this.map.getProjection();
    const mapDiv = document.getElementById('map-container');
    if (!proj) return;

    const scale = Math.pow(2, this.map.getZoom());
    const worldPoint = proj.fromLatLngToPoint(marker.getPosition());
    const mapBounds = this.map.getBounds();
    const nw = proj.fromLatLngToPoint(mapBounds.getNorthEast());
    const sw = proj.fromLatLngToPoint(mapBounds.getSouthWest());

    // Pixel position relative to map container
    const rect = mapDiv.getBoundingClientRect();
    const pixelX = (worldPoint.x - Math.min(nw.x, sw.x)) * scale;
    const pixelY = (worldPoint.y - Math.min(nw.y, sw.y)) * scale;

    let x = pixelX + 20;
    let y = pixelY - 40;
    if (x + 180 > rect.width) x = pixelX - 200;
    if (y < 8) y = 8;
    if (y + 200 > rect.height) y = rect.height - 210;

    popup.style.left = x + 'px';
    popup.style.top = y + 'px';
    popup.dataset.markerId = data.id;
    popup.classList.remove('hidden');

    const iconSvg = Icons.getIconByType(data.icon_type, data.icon_index);
    const title = data.title || Icons.getIconName(data.icon_type, data.icon_index);

    popup.querySelector('.popup-icon').innerHTML = iconSvg;
    popup.querySelector('.popup-title').textContent = title;
    popup.querySelector('.popup-status').textContent = data.status || 'active';
    popup.querySelector('.popup-coords').textContent = `${data.lat.toFixed(6)}, ${data.lng.toFixed(6)}`;
    if (data.observations) {
      popup.querySelector('.popup-obs').textContent = data.observations;
      popup.querySelector('.popup-obs').style.display = '';
    } else {
      popup.querySelector('.popup-obs').style.display = 'none';
    }

    // Wire buttons
    popup.querySelector('.popup-btn-edit').onclick = () => { this.hideMarkerPopup(); Markers.openEditModal(data); };
    popup.querySelector('.popup-btn-move').onclick = () => { this.hideMarkerPopup(); this.startMoveMarker(marker, data); };
    popup.querySelector('.popup-btn-delete').onclick = () => { this.hideMarkerPopup(); Markers.deleteMarker(data.id); };
  },

  hideMarkerPopup() {
    const p = document.getElementById('marker-popup');
    if (p) p.classList.add('hidden');
  },

  // ============================
  // MOVE MARKER MODE
  // ============================
  startMoveMarker(gMarker, data) {
    this.movingMarker = gMarker;
    this.movingOrigPos = { lat: gMarker.getPosition().lat(), lng: gMarker.getPosition().lng() };
    gMarker.setDraggable(true);
    gMarker.setAnimation(google.maps.Animation.BOUNCE);
    setTimeout(() => gMarker.setAnimation(null), 700);

    // Show move bar
    const bar = document.getElementById('move-bar');
    bar.classList.remove('hidden');
    bar.querySelector('.move-bar-coords').textContent =
      `${this.movingOrigPos.lat.toFixed(6)}, ${this.movingOrigPos.lng.toFixed(6)}`;

    // Update coords as marker is dragged
    gMarker.addListener('drag', () => {
      const pos = gMarker.getPosition();
      bar.querySelector('.move-bar-coords').textContent = `${pos.lat().toFixed(6)}, ${pos.lng().toFixed(6)}`;
    });

    // Save
    bar.querySelector('.move-btn-save').onclick = async () => {
      const pos = gMarker.getPosition();
      try {
        await fetch(`/api/markers/${data.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lat: pos.lat(), lng: pos.lng() })
        });
        App.toast(I18n.t('markerActions.positionSaved'), 'success');
      } catch { App.toast(I18n.t('toast.errorGeneric'), 'error'); }
      this.endMoveMarker(false);
      Markers.loadForProject(App.currentProject.id);
    };

    // Cancel
    bar.querySelector('.move-btn-cancel').onclick = () => {
      this.endMoveMarker(true);
    };
  },

  endMoveMarker(restore) {
    if (!this.movingMarker) return;
    this.movingMarker.setDraggable(false);
    if (restore && this.movingOrigPos) {
      this.movingMarker.setPosition(this.movingOrigPos);
    }
    google.maps.event.clearListeners(this.movingMarker, 'drag');
    this.movingMarker = null;
    this.movingOrigPos = null;
    document.getElementById('move-bar').classList.add('hidden');
  },

  // ============================
  // MODE
  // ============================
  setMode(mode) {
    this.mode = mode;
    if (mode === 'view') {
      this.removeTemporaryMarker();
      this.hideContextMenu();
      this.hideMarkerPopup();
      this.endMoveMarker(true);
    }
  },

  // ============================
  // DISPLAY MARKERS ON MAP
  // ============================
  clearMapMarkers() {
    if (this.clusterer) {
      this.clusterer.setMap(null);
      this.clusterer = null;
    }
    this.markers.forEach(m => {
      google.maps.event.clearInstanceListeners(m);
      m.setMap(null);
    });
    this.markers = [];
    this._iconReady = {};
    if (this.infoWindow) this.infoWindow.close();
  },

  // Convert SVG to PNG data URL via Canvas (reliable at all zoom levels)
  _iconCache: {},
  _iconReady: {},
  _preRenderIcon(iconType, iconIndex) {
    const key = `${iconType}_${iconIndex}`;
    if (this._iconCache[key]) return;

    const FALLBACK = `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" width="64" height="64"><path d="M32 4C20 4 12 14 12 24C12 38 32 60 32 60S52 38 52 24C52 14 44 4 32 4Z" fill="#e74c3c"/><circle cx="32" cy="24" r="8" fill="#fff"/></svg>`;
    let svg = Icons.getIconByType(iconType, iconIndex);
    if (!svg || typeof svg !== 'string' || !svg.includes('<svg')) svg = FALLBACK;
    if (!svg.includes('xmlns')) svg = svg.replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" ');
    if (!svg.includes('width=')) svg = svg.replace(/^<svg /, '<svg width="64" height="64" ');

    const SIZE = 80; // render at 80px for crisp display at 40px marker
    const canvas = document.createElement('canvas');
    canvas.width = SIZE;
    canvas.height = SIZE;
    const ctx = canvas.getContext('2d');
    const img = new Image();
    const svgBlob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    img.onload = () => {
      ctx.drawImage(img, 0, 0, SIZE, SIZE);
      URL.revokeObjectURL(url);
      this._iconCache[key] = canvas.toDataURL('image/png');
      // If markers are waiting for this icon, update them
      if (this._iconReady[key]) {
        this._iconReady[key].forEach(gm => {
          gm.setIcon({
            url: this._iconCache[key],
            scaledSize: new google.maps.Size(40, 40),
            anchor: new google.maps.Point(20, 20)
          });
        });
        delete this._iconReady[key];
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      // Fallback: use SVG data URL directly
      this._iconCache[key] = 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg);
    };
    img.src = url;
  },

  _getIconUrl(iconType, iconIndex) {
    const key = `${iconType}_${iconIndex}`;
    return this._iconCache[key] || null;
  },

  displayMarkers(markerData) {
    if (!this.map || !this.mapLoaded) { this.pendingMarkers = markerData; return; }

    this.clearMapMarkers();
    if (!markerData?.length) return;

    const bounds = new google.maps.LatLngBounds();
    const useCluster = !!window.markerClusterer && markerData.length > 10;

    // Pre-render all needed icons
    const iconKeys = new Set();
    markerData.forEach(d => {
      if (this.mode === 'view' && d.status === 'inactive') return;
      iconKeys.add(`${d.icon_type}_${d.icon_index}`);
      this._preRenderIcon(d.icon_type, d.icon_index);
    });

    markerData.forEach(data => {
      if (this.mode === 'view' && data.status === 'inactive') return;

      const key = `${data.icon_type}_${data.icon_index}`;
      const pngUrl = this._getIconUrl(data.icon_type, data.icon_index);

      const gm = new google.maps.Marker({
        position: { lat: data.lat, lng: data.lng },
        map: useCluster ? null : this.map,
        title: data.title || Icons.getIconName(data.icon_type, data.icon_index),
        icon: pngUrl ? { url: pngUrl, scaledSize: new google.maps.Size(40, 40), anchor: new google.maps.Point(20, 20) } : undefined,
        opacity: data.status === 'inactive' ? 0.4 : 1
      });

      // If icon not ready yet (still rendering), queue for update
      if (!pngUrl) {
        if (!this._iconReady[key]) this._iconReady[key] = [];
        this._iconReady[key].push(gm);
      }

      // Hover
      gm.addListener('mouseover', () => {
        this.infoWindow.setContent(this.buildInfoWindow(data));
        this.infoWindow.open(this.map, gm);
      });
      gm.addListener('mouseout', () => this.infoWindow.close());

      // Click
      gm.addListener('click', () => {
        this.infoWindow.close();
        if (this.mode === 'admin' && !this.movingMarker) {
          this.showMarkerPopup(gm, data);
        } else if (this.mode === 'view') {
          this.infoWindow.setContent(this.buildInfoWindow(data, true));
          this.infoWindow.open(this.map, gm);
        }
      });

      gm.dsipData = data;
      this.markers.push(gm);
      bounds.extend(gm.getPosition());
    });

    // Clustering
    if (window.markerClusterer && this.markers.length > 0) {
      this.clusterer = new markerClusterer.MarkerClusterer({
        map: this.map, markers: this.markers,
        renderer: {
          render: ({ count, position }) => new google.maps.Marker({
            position,
            label: { text: String(count), color: 'white', fontWeight: 'bold', fontSize: '14px' },
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              scale: count > 100 ? 28 : count > 20 ? 24 : 20,
              fillColor: count > 100 ? '#e74c3c' : count > 20 ? '#f39c12' : '#4f6ef7',
              fillOpacity: 0.9, strokeColor: '#fff', strokeWeight: 3
            }
          })
        }
      });
    }

    // Map centering is handled by selectProject (panTo project center)
    // fitBounds only as fallback if project has no center defined
    if (!App.currentProject?.center_lat && this.markers.length > 0) {
      this.map.fitBounds(bounds, 60);
    }
  },

  removeTemporaryMarker() {
    if (this.tempMarker) { this.tempMarker.setMap(null); this.tempMarker = null; }
  },

  buildInfoWindow(data, detailed = false) {
    const iconSvg = Icons.getIconByType(data.icon_type, data.icon_index);
    const iconName = Icons.getIconName(data.icon_type, data.icon_index);
    let html = `<div class="info-window"><div class="info-window-icon">${iconSvg}</div><div class="info-window-title">${data.title || iconName}</div><div class="info-window-meta">`;
    if (data.observations) html += `<strong>Observații:</strong> ${data.observations}<br>`;
    html += `<strong>Status:</strong> ${data.status || 'active'}<br>`;
    if (data.condition) html += `<strong>Condiție:</strong> ${data.condition}<br>`;
    if (detailed) {
      if (data.responsible) html += `<strong>Responsabil:</strong> ${data.responsible}<br>`;
      if (data.cost) html += `<strong>Cost:</strong> ${data.cost} ${data.currency || 'EUR'}<br>`;
      if (data.maintenance_date) html += `<strong>Mentenanță:</strong> ${data.maintenance_date}<br>`;
      if (data.warranty_date) html += `<strong>Garanție:</strong> ${data.warranty_date}<br>`;
    }
    html += `<small style="color:#999">${data.lat.toFixed(6)}, ${data.lng.toFixed(6)}</small></div></div>`;
    return html;
  },

  focusMarker(markerId) {
    if (!this.map) return;

    // Find marker data from sidebar list (works even if marker is inactive/not on map)
    const data = Markers.list.find(m => m.id === markerId);
    if (!data) return;

    // Pan and zoom
    this.map.setZoom(16);
    this.map.panTo({ lat: data.lat, lng: data.lng });

    // Show info window on the map marker if it exists
    google.maps.event.addListenerOnce(this.map, 'idle', () => {
      const gm = this.markers.find(mk => mk.dsipData?.id === markerId);
      if (gm) {
        this.infoWindow.setContent(this.buildInfoWindow(data, true));
        this.infoWindow.open(this.map, gm);
        setTimeout(() => this.infoWindow.close(), 4000);
      }
    });
  },

  // Check if a lat/lng is within current map bounds
  isInBounds(lat, lng) {
    if (!this.map) return true;
    const bounds = this.map.getBounds();
    if (!bounds) return true;
    return bounds.contains({ lat, lng });
  },

  // ============================
  // MAP STYLES & POI TOGGLE
  // ============================
  togglePOI(show) {
    this.showPOI = show;
    this.updateMapStyle();
    // Update button state
    const btn = document.getElementById('btn-toggle-poi');
    if (btn) {
      btn.classList.toggle('active', show);
      btn.querySelector('.material-icons-round').textContent = show ? 'local_hospital' : 'layers_clear';
      btn.title = show ? 'Ascunde POI Google' : 'Arată POI Google';
    }
  },

  getMapStyles() {
    const styles = [];

    // Hide Google POIs when toggled off
    if (!this.showPOI) {
      styles.push(
        { featureType: 'poi', stylers: [{ visibility: 'off' }] },
        { featureType: 'poi.business', stylers: [{ visibility: 'off' }] },
        { featureType: 'poi.medical', stylers: [{ visibility: 'off' }] },
        { featureType: 'poi.school', stylers: [{ visibility: 'off' }] },
        { featureType: 'poi.sports_complex', stylers: [{ visibility: 'off' }] },
        { featureType: 'poi.place_of_worship', stylers: [{ visibility: 'off' }] },
        { featureType: 'poi.government', stylers: [{ visibility: 'off' }] },
        { featureType: 'transit', stylers: [{ visibility: 'off' }] }
      );
    }

    // Dark mode
    if (document.documentElement.getAttribute('data-theme') === 'dark') {
      styles.push(
        { elementType: 'geometry', stylers: [{ color: '#212121' }] },
        { elementType: 'labels.text.stroke', stylers: [{ color: '#212121' }] },
        { elementType: 'labels.text.fill', stylers: [{ color: '#757575' }] },
        { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#000000' }] },
        { featureType: 'road', elementType: 'geometry.fill', stylers: [{ color: '#2c2c2c' }] },
        { featureType: 'road.highway', elementType: 'geometry.fill', stylers: [{ color: '#3c3c3c' }] }
      );
    }

    return styles;
  },
  updateMapStyle() { if (this.map) this.map.setOptions({ styles: this.getMapStyles() }); },

  // ============================
  // CACHE
  // ============================
  saveGeoCache() {
    try {
      const keys = Object.keys(this.geoCache);
      if (keys.length > 500) keys.slice(0, 200).forEach(k => delete this.geoCache[k]);
      localStorage.setItem('dsip_geocache', JSON.stringify(this.geoCache));
    } catch {}
  },

  showQuotaExhausted() {
    const err = this._lastLimitError;
    const title = err === 'monthly_limit' ? I18n.t('quota.monthlyReached') : I18n.t('quota.dailyReached');
    const msg = err === 'monthly_limit'
      ? I18n.t('quota.monthlyMsg')
      : I18n.t('quota.dailyMsg');
    document.getElementById('map').innerHTML = `
      <div style="display:flex;align-items:center;justify-content:center;height:100%;flex-direction:column;color:var(--text-secondary);padding:40px;text-align:center;">
        <span class="material-icons-round" style="font-size:64px;opacity:0.3;margin-bottom:16px;">cloud_off</span>
        <h2>${title}</h2><p>${msg}</p>
      </div>`;
  }
};

// Theme hook
const origThemeSet = Theme.set.bind(Theme);
Theme.set = function(t, s) { origThemeSet(t, s); MapManager.updateMapStyle(); };
