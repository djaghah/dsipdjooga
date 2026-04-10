// ============================
// SVG Icon Library
// All avatars, road signs, hydrant icons, and utility marker icons
// ============================
window.Icons = {

  // ==========================================
  // PROJECT AVATARS (10 unique designs)
  // ==========================================
  avatars: [
    // 0: Globe with pin
    `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs><linearGradient id="a0" x1="0" y1="0" x2="64" y2="64"><stop stop-color="#4f6ef7"/><stop offset="1" stop-color="#a855f7"/></linearGradient></defs>
      <rect width="64" height="64" rx="12" fill="url(#a0)"/>
      <circle cx="32" cy="30" r="16" stroke="white" stroke-width="2" fill="none" opacity="0.8"/>
      <ellipse cx="32" cy="30" rx="8" ry="16" stroke="white" stroke-width="1.5" fill="none" opacity="0.5"/>
      <line x1="16" y1="30" x2="48" y2="30" stroke="white" stroke-width="1.5" opacity="0.5"/>
      <line x1="16" y1="22" x2="48" y2="22" stroke="white" stroke-width="1" opacity="0.3"/>
      <line x1="16" y1="38" x2="48" y2="38" stroke="white" stroke-width="1" opacity="0.3"/>
      <circle cx="40" cy="42" r="6" fill="#ef4444" stroke="white" stroke-width="2"/>
      <circle cx="40" cy="40" r="2" fill="white"/>
    </svg>`,
    // 1: Mountain map
    `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs><linearGradient id="a1" x1="0" y1="0" x2="64" y2="64"><stop stop-color="#22c55e"/><stop offset="1" stop-color="#06b6d4"/></linearGradient></defs>
      <rect width="64" height="64" rx="12" fill="url(#a1)"/>
      <path d="M8 48 L24 20 L32 32 L40 24 L56 48Z" fill="white" opacity="0.9"/>
      <path d="M8 48 L20 28 L28 38Z" fill="white" opacity="0.6"/>
      <circle cx="48" cy="16" r="6" fill="#fbbf24" opacity="0.8"/>
    </svg>`,
    // 2: City grid
    `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs><linearGradient id="a2" x1="0" y1="0" x2="64" y2="64"><stop stop-color="#f59e0b"/><stop offset="1" stop-color="#ef4444"/></linearGradient></defs>
      <rect width="64" height="64" rx="12" fill="url(#a2)"/>
      <rect x="12" y="28" width="10" height="24" rx="2" fill="white" opacity="0.9"/>
      <rect x="27" y="16" width="10" height="36" rx="2" fill="white" opacity="0.8"/>
      <rect x="42" y="22" width="10" height="30" rx="2" fill="white" opacity="0.9"/>
      <rect x="14" y="32" width="2" height="2" fill="currentColor" opacity="0.3"/>
      <rect x="14" y="38" width="2" height="2" fill="currentColor" opacity="0.3"/>
      <rect x="18" y="32" width="2" height="2" fill="currentColor" opacity="0.3"/>
      <rect x="18" y="38" width="2" height="2" fill="currentColor" opacity="0.3"/>
    </svg>`,
    // 3: Compass
    `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs><linearGradient id="a3" x1="0" y1="0" x2="64" y2="64"><stop stop-color="#8b5cf6"/><stop offset="1" stop-color="#ec4899"/></linearGradient></defs>
      <rect width="64" height="64" rx="12" fill="url(#a3)"/>
      <circle cx="32" cy="32" r="18" stroke="white" stroke-width="2" fill="none" opacity="0.6"/>
      <polygon points="32,14 36,30 32,26 28,30" fill="white" opacity="0.9"/>
      <polygon points="32,50 28,34 32,38 36,34" fill="white" opacity="0.5"/>
      <circle cx="32" cy="32" r="3" fill="white"/>
    </svg>`,
    // 4: Road/Highway
    `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs><linearGradient id="a4" x1="0" y1="0" x2="64" y2="64"><stop stop-color="#0ea5e9"/><stop offset="1" stop-color="#6366f1"/></linearGradient></defs>
      <rect width="64" height="64" rx="12" fill="url(#a4)"/>
      <path d="M20 56 L28 8 L36 8 L44 56" stroke="white" stroke-width="2" fill="none" opacity="0.8"/>
      <line x1="32" y1="14" x2="32" y2="22" stroke="white" stroke-width="2" opacity="0.6"/>
      <line x1="32" y1="28" x2="32" y2="36" stroke="white" stroke-width="2" opacity="0.6"/>
      <line x1="32" y1="42" x2="32" y2="50" stroke="white" stroke-width="2" opacity="0.6"/>
    </svg>`,
    // 5: Fire/Emergency
    `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs><linearGradient id="a5" x1="0" y1="0" x2="64" y2="64"><stop stop-color="#ef4444"/><stop offset="1" stop-color="#f97316"/></linearGradient></defs>
      <rect width="64" height="64" rx="12" fill="url(#a5)"/>
      <path d="M32 10 C32 10 42 22 42 34 C42 40 38 48 32 50 C26 48 22 40 22 34 C22 22 32 10 32 10Z" fill="white" opacity="0.9"/>
      <path d="M32 24 C32 24 37 30 37 36 C37 39 35 44 32 44 C29 44 27 39 27 36 C27 30 32 24 32 24Z" fill="#ef4444" opacity="0.7"/>
    </svg>`,
    // 6: Water/Hydrant
    `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs><linearGradient id="a6" x1="0" y1="0" x2="64" y2="64"><stop stop-color="#06b6d4"/><stop offset="1" stop-color="#3b82f6"/></linearGradient></defs>
      <rect width="64" height="64" rx="12" fill="url(#a6)"/>
      <path d="M32 12 Q24 24 24 32 Q24 42 32 46 Q40 42 40 32 Q40 24 32 12Z" fill="white" opacity="0.9"/>
      <path d="M26 48 L38 48 L40 52 L24 52Z" fill="white" opacity="0.6"/>
    </svg>`,
    // 7: Tree/Nature
    `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs><linearGradient id="a7" x1="0" y1="0" x2="64" y2="64"><stop stop-color="#16a34a"/><stop offset="1" stop-color="#84cc16"/></linearGradient></defs>
      <rect width="64" height="64" rx="12" fill="url(#a7)"/>
      <polygon points="32,10 46,34 38,34 48,50 16,50 26,34 18,34" fill="white" opacity="0.9"/>
      <rect x="29" y="50" width="6" height="6" fill="white" opacity="0.6"/>
    </svg>`,
    // 8: Shield/Security
    `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs><linearGradient id="a8" x1="0" y1="0" x2="64" y2="64"><stop stop-color="#6366f1"/><stop offset="1" stop-color="#a855f7"/></linearGradient></defs>
      <rect width="64" height="64" rx="12" fill="url(#a8)"/>
      <path d="M32 10 L48 18 L48 32 C48 42 40 50 32 54 C24 50 16 42 16 32 L16 18Z" fill="white" opacity="0.85"/>
      <path d="M28 32 L31 35 L38 26" stroke="#6366f1" stroke-width="3" stroke-linecap="round" fill="none"/>
    </svg>`,
    // 9: Satellite
    `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs><linearGradient id="a9" x1="0" y1="0" x2="64" y2="64"><stop stop-color="#14b8a6"/><stop offset="1" stop-color="#0ea5e9"/></linearGradient></defs>
      <rect width="64" height="64" rx="12" fill="url(#a9)"/>
      <circle cx="24" cy="40" r="4" fill="white" opacity="0.9"/>
      <path d="M28 36 L40 24" stroke="white" stroke-width="2" opacity="0.8"/>
      <rect x="36" y="16" width="12" height="12" rx="2" fill="white" opacity="0.9" transform="rotate(15 42 22)"/>
      <path d="M18 46 Q10 38 18 30" stroke="white" stroke-width="1.5" fill="none" opacity="0.5"/>
      <path d="M14 50 Q4 40 14 26" stroke="white" stroke-width="1.5" fill="none" opacity="0.3"/>
    </svg>`
  ],

  // ==========================================
  // ROAD SIGNS (55 European standard signs)
  // ==========================================
  roadSigns: [
    // --- WARNING SIGNS (triangular, red border) ---
    // 0: Curve right
    { name: 'Curve Right', category: 'warning', svg: `<svg viewBox="0 0 64 64"><polygon points="32,4 60,56 4,56" fill="#fff" stroke="#c0392b" stroke-width="4"/><path d="M24 42 Q24 24 40 24" stroke="#222" stroke-width="4" fill="none" stroke-linecap="round"/><path d="M36 20 L40 24 L36 28" stroke="#222" stroke-width="3" fill="none" stroke-linecap="round"/></svg>` },
    // 1: Curve left
    { name: 'Curve Left', category: 'warning', svg: `<svg viewBox="0 0 64 64"><polygon points="32,4 60,56 4,56" fill="#fff" stroke="#c0392b" stroke-width="4"/><path d="M40 42 Q40 24 24 24" stroke="#222" stroke-width="4" fill="none" stroke-linecap="round"/><path d="M28 20 L24 24 L28 28" stroke="#222" stroke-width="3" fill="none" stroke-linecap="round"/></svg>` },
    // 2: Double curve
    { name: 'Double Curve', category: 'warning', svg: `<svg viewBox="0 0 64 64"><polygon points="32,4 60,56 4,56" fill="#fff" stroke="#c0392b" stroke-width="4"/><path d="M26 44 Q26 34 36 34 Q36 24 26 18" stroke="#222" stroke-width="3.5" fill="none" stroke-linecap="round"/></svg>` },
    // 3: Steep descent
    { name: 'Steep Descent', category: 'warning', svg: `<svg viewBox="0 0 64 64"><polygon points="32,4 60,56 4,56" fill="#fff" stroke="#c0392b" stroke-width="4"/><line x1="20" y1="24" x2="44" y2="42" stroke="#222" stroke-width="4" stroke-linecap="round"/><text x="38" y="50" font-size="12" font-weight="bold" fill="#222">10%</text></svg>` },
    // 4: Steep ascent
    { name: 'Steep Ascent', category: 'warning', svg: `<svg viewBox="0 0 64 64"><polygon points="32,4 60,56 4,56" fill="#fff" stroke="#c0392b" stroke-width="4"/><line x1="20" y1="42" x2="44" y2="24" stroke="#222" stroke-width="4" stroke-linecap="round"/><text x="16" y="50" font-size="12" font-weight="bold" fill="#222">10%</text></svg>` },
    // 5: Slippery road
    { name: 'Slippery Road', category: 'warning', svg: `<svg viewBox="0 0 64 64"><polygon points="32,4 60,56 4,56" fill="#fff" stroke="#c0392b" stroke-width="4"/><path d="M24 44 Q28 36 32 40 Q36 44 40 36" stroke="#222" stroke-width="3" fill="none"/><path d="M22 36 Q26 28 30 32 Q34 36 38 28" stroke="#222" stroke-width="2.5" fill="none"/></svg>` },
    // 6: Road narrows
    { name: 'Road Narrows', category: 'warning', svg: `<svg viewBox="0 0 64 64"><polygon points="32,4 60,56 4,56" fill="#fff" stroke="#c0392b" stroke-width="4"/><path d="M22 46 L30 18 M42 46 L34 18" stroke="#222" stroke-width="3" stroke-linecap="round"/></svg>` },
    // 7: Road works
    { name: 'Road Works', category: 'warning', svg: `<svg viewBox="0 0 64 64"><polygon points="32,4 60,56 4,56" fill="#fff" stroke="#c0392b" stroke-width="4"/><line x1="24" y1="20" x2="40" y2="46" stroke="#222" stroke-width="3"/><line x1="40" y1="20" x2="24" y2="46" stroke="#222" stroke-width="3"/><circle cx="32" cy="22" r="3" fill="#222"/></svg>` },
    // 8: Traffic signals
    { name: 'Traffic Signals', category: 'warning', svg: `<svg viewBox="0 0 64 64"><polygon points="32,4 60,56 4,56" fill="#fff" stroke="#c0392b" stroke-width="4"/><rect x="27" y="16" width="10" height="30" rx="3" fill="#333"/><circle cx="32" cy="22" r="3" fill="#e74c3c"/><circle cx="32" cy="31" r="3" fill="#f1c40f"/><circle cx="32" cy="40" r="3" fill="#27ae60"/></svg>` },
    // 9: Pedestrian crossing
    { name: 'Pedestrian Crossing', category: 'warning', svg: `<svg viewBox="0 0 64 64"><polygon points="32,4 60,56 4,56" fill="#fff" stroke="#c0392b" stroke-width="4"/><circle cx="34" cy="18" r="3" fill="#222"/><path d="M34 22 L34 36 M28 42 L34 36 L40 42 M26 28 L34 28 L40 24" stroke="#222" stroke-width="2.5" stroke-linecap="round" fill="none"/></svg>` },
    // 10: Children
    { name: 'Children', category: 'warning', svg: `<svg viewBox="0 0 64 64"><polygon points="32,4 60,56 4,56" fill="#fff" stroke="#c0392b" stroke-width="4"/><circle cx="28" cy="20" r="3" fill="#222"/><circle cx="38" cy="22" r="2.5" fill="#222"/><path d="M28 24 L28 36 L22 44 M28 36 L34 44 M24 28 L28 28 L32 26" stroke="#222" stroke-width="2" stroke-linecap="round" fill="none"/><path d="M38 26 L38 34 L34 40 M38 34 L42 40" stroke="#222" stroke-width="2" stroke-linecap="round" fill="none"/></svg>` },
    // 11: Animals crossing
    { name: 'Animals Crossing', category: 'warning', svg: `<svg viewBox="0 0 64 64"><polygon points="32,4 60,56 4,56" fill="#fff" stroke="#c0392b" stroke-width="4"/><path d="M20 42 L24 28 L30 24 L36 28 L40 24 L42 28 L44 42" stroke="#222" stroke-width="2.5" fill="none"/><path d="M26 42 L26 48 M38 42 L38 48" stroke="#222" stroke-width="2" stroke-linecap="round"/><circle cx="38" cy="24" r="1.5" fill="#222"/></svg>` },
    // 12: Falling rocks
    { name: 'Falling Rocks', category: 'warning', svg: `<svg viewBox="0 0 64 64"><polygon points="32,4 60,56 4,56" fill="#fff" stroke="#c0392b" stroke-width="4"/><path d="M22 46 L22 20 L42 46Z" fill="#222" opacity="0.8"/><circle cx="36" cy="26" r="3" fill="#222"/><circle cx="40" cy="34" r="2" fill="#222"/></svg>` },
    // 13: Intersection
    { name: 'Intersection', category: 'warning', svg: `<svg viewBox="0 0 64 64"><polygon points="32,4 60,56 4,56" fill="#fff" stroke="#c0392b" stroke-width="4"/><line x1="32" y1="18" x2="32" y2="46" stroke="#222" stroke-width="4" stroke-linecap="round"/><line x1="22" y1="32" x2="42" y2="32" stroke="#222" stroke-width="4" stroke-linecap="round"/></svg>` },
    // 14: Roundabout ahead
    { name: 'Roundabout Ahead', category: 'warning', svg: `<svg viewBox="0 0 64 64"><polygon points="32,4 60,56 4,56" fill="#fff" stroke="#c0392b" stroke-width="4"/><circle cx="32" cy="30" r="8" stroke="#222" stroke-width="3" fill="none"/><path d="M38 24 L40 22 L36 22" stroke="#222" stroke-width="2" fill="none"/><line x1="32" y1="38" x2="32" y2="46" stroke="#222" stroke-width="3" stroke-linecap="round"/></svg>` },

    // --- PROHIBITION SIGNS (circular, red border) ---
    // 15: No entry
    { name: 'No Entry', category: 'prohibition', svg: `<svg viewBox="0 0 64 64"><circle cx="32" cy="32" r="28" fill="#c0392b" stroke="#c0392b" stroke-width="2"/><rect x="12" y="28" width="40" height="8" rx="2" fill="white"/></svg>` },
    // 16: Speed limit 30
    { name: 'Speed 30', category: 'prohibition', svg: `<svg viewBox="0 0 64 64"><circle cx="32" cy="32" r="28" fill="white" stroke="#c0392b" stroke-width="5"/><text x="32" y="40" text-anchor="middle" font-size="24" font-weight="bold" fill="#222">30</text></svg>` },
    // 17: Speed limit 50
    { name: 'Speed 50', category: 'prohibition', svg: `<svg viewBox="0 0 64 64"><circle cx="32" cy="32" r="28" fill="white" stroke="#c0392b" stroke-width="5"/><text x="32" y="40" text-anchor="middle" font-size="24" font-weight="bold" fill="#222">50</text></svg>` },
    // 18: Speed limit 70
    { name: 'Speed 70', category: 'prohibition', svg: `<svg viewBox="0 0 64 64"><circle cx="32" cy="32" r="28" fill="white" stroke="#c0392b" stroke-width="5"/><text x="32" y="40" text-anchor="middle" font-size="24" font-weight="bold" fill="#222">70</text></svg>` },
    // 19: Speed limit 100
    { name: 'Speed 100', category: 'prohibition', svg: `<svg viewBox="0 0 64 64"><circle cx="32" cy="32" r="28" fill="white" stroke="#c0392b" stroke-width="5"/><text x="32" y="40" text-anchor="middle" font-size="20" font-weight="bold" fill="#222">100</text></svg>` },
    // 20: Speed limit 120
    { name: 'Speed 120', category: 'prohibition', svg: `<svg viewBox="0 0 64 64"><circle cx="32" cy="32" r="28" fill="white" stroke="#c0392b" stroke-width="5"/><text x="32" y="40" text-anchor="middle" font-size="20" font-weight="bold" fill="#222">120</text></svg>` },
    // 21: No overtaking
    { name: 'No Overtaking', category: 'prohibition', svg: `<svg viewBox="0 0 64 64"><circle cx="32" cy="32" r="28" fill="white" stroke="#c0392b" stroke-width="5"/><rect x="16" y="26" width="14" height="12" rx="6" fill="#c0392b"/><rect x="34" y="26" width="14" height="12" rx="6" fill="#222"/></svg>` },
    // 22: No parking
    { name: 'No Parking', category: 'prohibition', svg: `<svg viewBox="0 0 64 64"><circle cx="32" cy="32" r="28" fill="#3498db" stroke="#c0392b" stroke-width="5"/><text x="32" y="42" text-anchor="middle" font-size="30" font-weight="bold" fill="white">P</text><line x1="12" y1="52" x2="52" y2="12" stroke="#c0392b" stroke-width="5"/></svg>` },
    // 23: No stopping
    { name: 'No Stopping', category: 'prohibition', svg: `<svg viewBox="0 0 64 64"><circle cx="32" cy="32" r="28" fill="#3498db" stroke="#c0392b" stroke-width="5"/><line x1="12" y1="52" x2="52" y2="12" stroke="#c0392b" stroke-width="5"/><line x1="12" y1="12" x2="52" y2="52" stroke="#c0392b" stroke-width="5"/></svg>` },
    // 24: No U-turn
    { name: 'No U-turn', category: 'prohibition', svg: `<svg viewBox="0 0 64 64"><circle cx="32" cy="32" r="28" fill="white" stroke="#c0392b" stroke-width="5"/><path d="M24 44 L24 28 Q24 18 34 18 Q44 18 44 28 L44 34" stroke="#222" stroke-width="3.5" fill="none"/><path d="M40 30 L44 36 L48 30" stroke="#222" stroke-width="2.5" fill="none"/><line x1="12" y1="52" x2="52" y2="12" stroke="#c0392b" stroke-width="5"/></svg>` },
    // 25: No left turn
    { name: 'No Left Turn', category: 'prohibition', svg: `<svg viewBox="0 0 64 64"><circle cx="32" cy="32" r="28" fill="white" stroke="#c0392b" stroke-width="5"/><path d="M38 44 L38 28 L24 28" stroke="#222" stroke-width="3.5" fill="none" stroke-linecap="round"/><path d="M28 24 L24 28 L28 32" stroke="#222" stroke-width="2.5" fill="none" stroke-linecap="round"/><line x1="12" y1="52" x2="52" y2="12" stroke="#c0392b" stroke-width="5"/></svg>` },
    // 26: No right turn
    { name: 'No Right Turn', category: 'prohibition', svg: `<svg viewBox="0 0 64 64"><circle cx="32" cy="32" r="28" fill="white" stroke="#c0392b" stroke-width="5"/><path d="M26 44 L26 28 L40 28" stroke="#222" stroke-width="3.5" fill="none" stroke-linecap="round"/><path d="M36 24 L40 28 L36 32" stroke="#222" stroke-width="2.5" fill="none" stroke-linecap="round"/><line x1="12" y1="52" x2="52" y2="12" stroke="#c0392b" stroke-width="5"/></svg>` },
    // 27: No horn
    { name: 'No Horn', category: 'prohibition', svg: `<svg viewBox="0 0 64 64"><circle cx="32" cy="32" r="28" fill="white" stroke="#c0392b" stroke-width="5"/><path d="M20 32 Q20 24 28 24 L28 40 Q20 40 20 32Z" fill="#222"/><path d="M28 24 L40 18 L40 46 L28 40Z" fill="#222"/><line x1="12" y1="52" x2="52" y2="12" stroke="#c0392b" stroke-width="5"/></svg>` },
    // 28: No pedestrians
    { name: 'No Pedestrians', category: 'prohibition', svg: `<svg viewBox="0 0 64 64"><circle cx="32" cy="32" r="28" fill="white" stroke="#c0392b" stroke-width="5"/><circle cx="32" cy="18" r="4" fill="#222"/><path d="M32 22 L32 36 M24 44 L32 36 L40 44 M24 28 L32 28 L40 26" stroke="#222" stroke-width="3" stroke-linecap="round" fill="none"/><line x1="12" y1="52" x2="52" y2="12" stroke="#c0392b" stroke-width="5"/></svg>` },
    // 29: No bicycles
    { name: 'No Bicycles', category: 'prohibition', svg: `<svg viewBox="0 0 64 64"><circle cx="32" cy="32" r="28" fill="white" stroke="#c0392b" stroke-width="5"/><circle cx="22" cy="38" r="7" stroke="#222" stroke-width="2.5" fill="none"/><circle cx="42" cy="38" r="7" stroke="#222" stroke-width="2.5" fill="none"/><path d="M22 38 L30 22 L38 22 L42 38 M30 22 L34 38" stroke="#222" stroke-width="2" fill="none"/><line x1="12" y1="52" x2="52" y2="12" stroke="#c0392b" stroke-width="5"/></svg>` },
    // 30: No trucks
    { name: 'No Trucks', category: 'prohibition', svg: `<svg viewBox="0 0 64 64"><circle cx="32" cy="32" r="28" fill="white" stroke="#c0392b" stroke-width="5"/><rect x="14" y="22" width="24" height="16" rx="2" fill="#222"/><rect x="38" y="28" width="12" height="10" rx="2" fill="#222"/><circle cx="22" cy="42" r="3" fill="#222" stroke="white" stroke-width="1.5"/><circle cx="44" cy="42" r="3" fill="#222" stroke="white" stroke-width="1.5"/><line x1="12" y1="52" x2="52" y2="12" stroke="#c0392b" stroke-width="5"/></svg>` },
    // 31: End of speed limit
    { name: 'End Speed Limit', category: 'prohibition', svg: `<svg viewBox="0 0 64 64"><circle cx="32" cy="32" r="28" fill="white" stroke="#888" stroke-width="4"/><line x1="12" y1="52" x2="52" y2="12" stroke="#888" stroke-width="3"/><line x1="16" y1="48" x2="48" y2="16" stroke="#888" stroke-width="3"/><line x1="20" y1="48" x2="52" y2="16" stroke="#888" stroke-width="3"/></svg>` },

    // --- MANDATORY SIGNS (circular, blue bg) ---
    // 32: Turn right
    { name: 'Turn Right', category: 'mandatory', svg: `<svg viewBox="0 0 64 64"><circle cx="32" cy="32" r="28" fill="#2980b9"/><path d="M24 40 L24 30 L40 30" stroke="white" stroke-width="4" fill="none" stroke-linecap="round"/><path d="M36 24 L42 30 L36 36" stroke="white" stroke-width="3" fill="none" stroke-linecap="round"/></svg>` },
    // 33: Turn left
    { name: 'Turn Left', category: 'mandatory', svg: `<svg viewBox="0 0 64 64"><circle cx="32" cy="32" r="28" fill="#2980b9"/><path d="M40 40 L40 30 L24 30" stroke="white" stroke-width="4" fill="none" stroke-linecap="round"/><path d="M28 24 L22 30 L28 36" stroke="white" stroke-width="3" fill="none" stroke-linecap="round"/></svg>` },
    // 34: Go straight
    { name: 'Go Straight', category: 'mandatory', svg: `<svg viewBox="0 0 64 64"><circle cx="32" cy="32" r="28" fill="#2980b9"/><line x1="32" y1="46" x2="32" y2="20" stroke="white" stroke-width="4" stroke-linecap="round"/><path d="M26 26 L32 18 L38 26" stroke="white" stroke-width="3" fill="none" stroke-linecap="round"/></svg>` },
    // 35: Go straight or right
    { name: 'Straight or Right', category: 'mandatory', svg: `<svg viewBox="0 0 64 64"><circle cx="32" cy="32" r="28" fill="#2980b9"/><path d="M28 46 L28 22 M28 30 L42 30" stroke="white" stroke-width="3.5" fill="none" stroke-linecap="round"/><path d="M24 28 L28 20 L32 28" stroke="white" stroke-width="2.5" fill="none" stroke-linecap="round"/><path d="M38 26 L44 30 L38 34" stroke="white" stroke-width="2.5" fill="none" stroke-linecap="round"/></svg>` },
    // 36: Roundabout
    { name: 'Roundabout', category: 'mandatory', svg: `<svg viewBox="0 0 64 64"><circle cx="32" cy="32" r="28" fill="#2980b9"/><circle cx="32" cy="30" r="10" stroke="white" stroke-width="3" fill="none"/><path d="M40 24 L42 20 L36 22" stroke="white" stroke-width="2.5" fill="none" stroke-linecap="round"/><line x1="32" y1="40" x2="32" y2="50" stroke="white" stroke-width="3" stroke-linecap="round"/></svg>` },
    // 37: Bicycle path
    { name: 'Bicycle Path', category: 'mandatory', svg: `<svg viewBox="0 0 64 64"><circle cx="32" cy="32" r="28" fill="#2980b9"/><circle cx="24" cy="38" r="6" stroke="white" stroke-width="2" fill="none"/><circle cx="42" cy="38" r="6" stroke="white" stroke-width="2" fill="none"/><path d="M24 38 L30 22 L36 22 L42 38 M30 22 L34 38" stroke="white" stroke-width="2" fill="none"/></svg>` },
    // 38: Pedestrian path
    { name: 'Pedestrian Path', category: 'mandatory', svg: `<svg viewBox="0 0 64 64"><circle cx="32" cy="32" r="28" fill="#2980b9"/><circle cx="32" cy="16" r="4" fill="white"/><path d="M32 20 L32 36 M24 46 L32 36 L40 46 M24 26 L32 26 L40 24" stroke="white" stroke-width="3" stroke-linecap="round" fill="none"/></svg>` },
    // 39: Minimum speed 30
    { name: 'Min Speed 30', category: 'mandatory', svg: `<svg viewBox="0 0 64 64"><circle cx="32" cy="32" r="28" fill="#2980b9"/><text x="32" y="40" text-anchor="middle" font-size="22" font-weight="bold" fill="white">30</text></svg>` },

    // --- INFORMATION SIGNS (square/rect, blue bg) ---
    // 40: Parking
    { name: 'Parking', category: 'information', svg: `<svg viewBox="0 0 64 64"><rect x="4" y="4" width="56" height="56" rx="8" fill="#2980b9"/><text x="32" y="46" text-anchor="middle" font-size="36" font-weight="bold" fill="white">P</text></svg>` },
    // 41: Hospital
    { name: 'Hospital', category: 'information', svg: `<svg viewBox="0 0 64 64"><rect x="4" y="4" width="56" height="56" rx="8" fill="#2980b9"/><rect x="18" y="26" width="28" height="12" rx="2" fill="white"/><rect x="26" y="18" width="12" height="28" rx="2" fill="white"/></svg>` },
    // 42: Gas station
    { name: 'Gas Station', category: 'information', svg: `<svg viewBox="0 0 64 64"><rect x="4" y="4" width="56" height="56" rx="8" fill="#2980b9"/><rect x="18" y="14" width="18" height="32" rx="3" fill="white"/><rect x="22" y="18" width="10" height="8" rx="1" fill="#2980b9"/><path d="M40 22 L46 22 L46 38 L40 38" stroke="white" stroke-width="2.5" fill="none"/><rect x="16" y="46" width="22" height="4" rx="1" fill="white"/></svg>` },
    // 43: Information
    { name: 'Information', category: 'information', svg: `<svg viewBox="0 0 64 64"><rect x="4" y="4" width="56" height="56" rx="8" fill="#2980b9"/><circle cx="32" cy="18" r="4" fill="white"/><rect x="28" y="26" width="8" height="22" rx="2" fill="white"/></svg>` },
    // 44: One-way right
    { name: 'One-Way Right', category: 'information', svg: `<svg viewBox="0 0 64 64"><rect x="4" y="16" width="56" height="32" rx="6" fill="#2980b9"/><path d="M16 32 L40 32 M36 24 L46 32 L36 40" stroke="white" stroke-width="4" fill="none" stroke-linecap="round"/></svg>` },
    // 45: Dead end
    { name: 'Dead End', category: 'information', svg: `<svg viewBox="0 0 64 64"><rect x="4" y="4" width="56" height="56" rx="8" fill="#2980b9"/><rect x="28" y="14" width="8" height="20" fill="white"/><rect x="16" y="34" width="32" height="8" fill="white"/><rect x="16" y="14" width="32" height="6" fill="#c0392b"/></svg>` },
    // 46: Highway start
    { name: 'Highway Start', category: 'information', svg: `<svg viewBox="0 0 64 64"><rect x="4" y="4" width="56" height="56" rx="8" fill="#27ae60"/><path d="M18 46 L26 18 L32 30 L38 18 L46 46" stroke="white" stroke-width="3" fill="none"/><line x1="22" y1="36" x2="42" y2="36" stroke="white" stroke-width="2"/></svg>` },
    // 47: Highway end
    { name: 'Highway End', category: 'information', svg: `<svg viewBox="0 0 64 64"><rect x="4" y="4" width="56" height="56" rx="8" fill="#27ae60"/><path d="M18 46 L26 18 L32 30 L38 18 L46 46" stroke="white" stroke-width="3" fill="none"/><line x1="22" y1="36" x2="42" y2="36" stroke="white" stroke-width="2"/><line x1="12" y1="52" x2="52" y2="12" stroke="#c0392b" stroke-width="4"/></svg>` },

    // --- PRIORITY SIGNS ---
    // 48: Priority road
    { name: 'Priority Road', category: 'priority', svg: `<svg viewBox="0 0 64 64"><rect x="12" y="12" width="40" height="40" rx="4" fill="#f1c40f" stroke="white" stroke-width="4" transform="rotate(45 32 32)"/></svg>` },
    // 49: Yield
    { name: 'Yield', category: 'priority', svg: `<svg viewBox="0 0 64 64"><polygon points="32,56 4,8 60,8" fill="white" stroke="#c0392b" stroke-width="5"/></svg>` },
    // 50: Stop
    { name: 'Stop', category: 'priority', svg: `<svg viewBox="0 0 64 64"><polygon points="22,4 42,4 60,22 60,42 42,60 22,60 4,42 4,22" fill="#c0392b"/><text x="32" y="38" text-anchor="middle" font-size="16" font-weight="bold" fill="white">STOP</text></svg>` },
    // 51: End priority
    { name: 'End Priority', category: 'priority', svg: `<svg viewBox="0 0 64 64"><rect x="12" y="12" width="40" height="40" rx="4" fill="white" stroke="#222" stroke-width="3" transform="rotate(45 32 32)"/><line x1="14" y1="50" x2="50" y2="14" stroke="#222" stroke-width="3"/></svg>` },
    // 52: Give way to oncoming
    { name: 'Give Way', category: 'priority', svg: `<svg viewBox="0 0 64 64"><circle cx="32" cy="32" r="28" fill="white" stroke="#c0392b" stroke-width="5"/><path d="M22 38 L32 20 L42 38" stroke="#c0392b" stroke-width="4" fill="none" stroke-linecap="round"/><line x1="32" y1="38" x2="32" y2="46" stroke="#c0392b" stroke-width="4" stroke-linecap="round"/></svg>` },

    // --- ADDITIONAL COMMON SIGNS ---
    // 53: Pedestrian crossing (info)
    { name: 'Ped. Crossing Zone', category: 'information', svg: `<svg viewBox="0 0 64 64"><rect x="4" y="4" width="56" height="56" rx="8" fill="#2980b9"/><polygon points="16,48 24,16 40,16 48,48" fill="white" opacity="0.3"/><circle cx="34" cy="20" r="3" fill="white"/><path d="M34 24 L34 36 M28 44 L34 36 L40 44 M28 28 L34 28 L40 26" stroke="white" stroke-width="2.5" fill="none" stroke-linecap="round"/></svg>` },
    // 54: No entry one-way
    { name: 'Do Not Enter', category: 'prohibition', svg: `<svg viewBox="0 0 64 64"><circle cx="32" cy="32" r="28" fill="white" stroke="#c0392b" stroke-width="5"/><line x1="14" y1="14" x2="50" y2="50" stroke="#c0392b" stroke-width="5"/><line x1="14" y1="50" x2="50" y2="14" stroke="#c0392b" stroke-width="5"/></svg>` },
  ],

  // ==========================================
  // FIREFIGHTER / EMERGENCY ICONS (24 types)
  // ==========================================
  hydrants: [
    // --- HYDRANTS ---
    { name: 'Hidrant Suprateran', category: 'hydrants', svg: `<svg viewBox="0 0 64 64"><rect x="22" y="32" width="20" height="24" rx="3" fill="#e74c3c"/><rect x="18" y="28" width="28" height="8" rx="3" fill="#c0392b"/><rect x="28" y="16" width="8" height="16" rx="3" fill="#e74c3c"/><circle cx="32" cy="16" r="6" fill="#c0392b"/><rect x="12" y="38" width="10" height="6" rx="2" fill="#c0392b"/><rect x="42" y="38" width="10" height="6" rx="2" fill="#c0392b"/><rect x="26" y="56" width="12" height="4" rx="1" fill="#888"/></svg>` },
    { name: 'Hidrant Subteran', category: 'hydrants', svg: `<svg viewBox="0 0 64 64"><rect x="12" y="40" width="40" height="16" rx="4" fill="#7f8c8d"/><rect x="20" y="36" width="24" height="8" rx="2" fill="#95a5a6"/><circle cx="32" cy="28" r="10" fill="#3498db" opacity="0.8"/><text x="32" y="33" text-anchor="middle" font-size="14" font-weight="bold" fill="white">H</text><rect x="10" y="56" width="44" height="4" rx="1" fill="#555"/></svg>` },
    { name: 'Hidrant de Perete', category: 'hydrants', svg: `<svg viewBox="0 0 64 64"><rect x="8" y="8" width="48" height="48" rx="4" fill="#ecf0f1" stroke="#bdc3c7" stroke-width="2"/><circle cx="32" cy="28" r="10" fill="#e74c3c"/><rect x="28" y="38" width="8" height="12" rx="2" fill="#c0392b"/><circle cx="32" cy="28" r="4" fill="white" opacity="0.6"/><rect x="26" y="50" width="12" height="4" rx="1" fill="#888"/></svg>` },
    { name: 'Hidrant Uscat', category: 'hydrants', svg: `<svg viewBox="0 0 64 64"><rect x="24" y="20" width="16" height="32" rx="4" fill="#f39c12"/><rect x="20" y="16" width="24" height="8" rx="3" fill="#e67e22"/><circle cx="32" cy="36" r="6" stroke="white" stroke-width="2" fill="none"/><text x="32" y="40" text-anchor="middle" font-size="10" font-weight="bold" fill="white">D</text><rect x="26" y="52" width="12" height="4" rx="1" fill="#888"/></svg>` },
    { name: 'Hidrant Pilon', category: 'hydrants', svg: `<svg viewBox="0 0 64 64"><rect x="26" y="12" width="12" height="40" rx="4" fill="#e74c3c"/><rect x="22" y="8" width="20" height="8" rx="4" fill="#c0392b"/><rect x="14" y="24" width="12" height="6" rx="2" fill="#c0392b"/><rect x="38" y="24" width="12" height="6" rx="2" fill="#c0392b"/><rect x="14" y="36" width="12" height="6" rx="2" fill="#c0392b"/><rect x="38" y="36" width="12" height="6" rx="2" fill="#c0392b"/><rect x="22" y="52" width="20" height="6" rx="2" fill="#888"/></svg>` },
    { name: 'Hidrant DN65', category: 'hydrants', svg: `<svg viewBox="0 0 64 64"><rect x="22" y="28" width="20" height="26" rx="3" fill="#e74c3c"/><rect x="18" y="24" width="28" height="8" rx="3" fill="#c0392b"/><circle cx="32" cy="14" r="8" fill="#c0392b"/><text x="32" y="18" text-anchor="middle" font-size="8" font-weight="bold" fill="white">65</text><rect x="12" y="36" width="10" height="5" rx="2" fill="#c0392b"/><rect x="42" y="36" width="10" height="5" rx="2" fill="#c0392b"/><rect x="26" y="54" width="12" height="4" rx="1" fill="#888"/></svg>` },
    { name: 'Hidrant DN100', category: 'hydrants', svg: `<svg viewBox="0 0 64 64"><rect x="20" y="26" width="24" height="28" rx="4" fill="#c0392b"/><rect x="16" y="22" width="32" height="8" rx="4" fill="#922b21"/><circle cx="32" cy="14" r="9" fill="#922b21"/><text x="32" y="18" text-anchor="middle" font-size="7" font-weight="bold" fill="white">100</text><rect x="8" y="34" width="12" height="7" rx="2" fill="#922b21"/><rect x="44" y="34" width="12" height="7" rx="2" fill="#922b21"/><rect x="24" y="54" width="16" height="5" rx="2" fill="#888"/></svg>` },

    // --- WATER SOURCES ---
    { name: 'Rezervor Apă', category: 'water', svg: `<svg viewBox="0 0 64 64"><ellipse cx="32" cy="18" rx="20" ry="8" fill="#3498db"/><rect x="12" y="18" width="40" height="30" fill="#2980b9"/><ellipse cx="32" cy="48" rx="20" ry="8" fill="#2471a3"/><text x="32" y="38" text-anchor="middle" font-size="12" font-weight="bold" fill="white">H₂O</text></svg>` },
    { name: 'Cisternă', category: 'water', svg: `<svg viewBox="0 0 64 64"><ellipse cx="32" cy="32" rx="26" ry="16" fill="#2980b9"/><ellipse cx="32" cy="32" rx="26" ry="16" fill="none" stroke="#2471a3" stroke-width="2"/><rect x="28" y="14" width="8" height="6" rx="2" fill="#7f8c8d"/><text x="32" y="36" text-anchor="middle" font-size="10" font-weight="bold" fill="white">CIS</text></svg>` },
    { name: 'Sursă Naturală Apă', category: 'water', svg: `<svg viewBox="0 0 64 64"><path d="M8 40 Q16 32 24 38 Q32 44 40 36 Q48 28 56 34" stroke="#3498db" stroke-width="3" fill="none"/><path d="M8 48 Q16 40 24 46 Q32 52 40 44 Q48 36 56 42" stroke="#2980b9" stroke-width="3" fill="none"/><path d="M32 12 Q24 24 24 30 Q24 38 32 40 Q40 38 40 30 Q40 24 32 12Z" fill="#3498db" opacity="0.7"/></svg>` },
    { name: 'Bazin Incendiu', category: 'water', svg: `<svg viewBox="0 0 64 64"><rect x="8" y="24" width="48" height="32" rx="4" fill="#2980b9" stroke="#2471a3" stroke-width="2"/><path d="M12 28 Q20 24 28 28 Q36 32 44 28 Q52 24 52 28" stroke="white" stroke-width="2" fill="none" opacity="0.5"/><text x="32" y="46" text-anchor="middle" font-size="10" font-weight="bold" fill="white">BAZIN</text><rect x="28" y="16" width="8" height="10" rx="2" fill="#e74c3c"/></svg>` },

    // --- FIRE EQUIPMENT ---
    { name: 'Stingător ABC', category: 'equipment', svg: `<svg viewBox="0 0 64 64"><rect x="22" y="18" width="20" height="36" rx="6" fill="#e74c3c"/><rect x="28" y="10" width="8" height="10" rx="2" fill="#c0392b"/><path d="M36 12 L44 8" stroke="#222" stroke-width="2" stroke-linecap="round"/><rect x="18" y="28" width="8" height="4" rx="1" fill="#222"/><text x="32" y="42" text-anchor="middle" font-size="9" font-weight="bold" fill="white">ABC</text></svg>` },
    { name: 'Stingător CO₂', category: 'equipment', svg: `<svg viewBox="0 0 64 64"><rect x="22" y="18" width="20" height="36" rx="6" fill="#2c3e50"/><rect x="28" y="10" width="8" height="10" rx="2" fill="#1a252f"/><path d="M36 12 L46 6" stroke="#222" stroke-width="2" stroke-linecap="round"/><path d="M46 6 L48 14" stroke="#bdc3c7" stroke-width="3" stroke-linecap="round"/><text x="32" y="42" text-anchor="middle" font-size="9" font-weight="bold" fill="white">CO₂</text></svg>` },
    { name: 'Stingător Spumă', category: 'equipment', svg: `<svg viewBox="0 0 64 64"><rect x="22" y="18" width="20" height="36" rx="6" fill="#f1c40f"/><rect x="28" y="10" width="8" height="10" rx="2" fill="#d4ac0d"/><path d="M36 12 L44 8" stroke="#222" stroke-width="2" stroke-linecap="round"/><rect x="18" y="28" width="8" height="4" rx="1" fill="#222"/><text x="32" y="42" text-anchor="middle" font-size="7" font-weight="bold" fill="#222">FOAM</text></svg>` },
    { name: 'Furtun Incendiu', category: 'equipment', svg: `<svg viewBox="0 0 64 64"><circle cx="32" cy="32" r="20" fill="none" stroke="#e74c3c" stroke-width="6"/><circle cx="32" cy="32" r="10" fill="none" stroke="#e74c3c" stroke-width="4"/><circle cx="32" cy="32" r="3" fill="#c0392b"/></svg>` },
    { name: 'Dulap Hidrant Interior', category: 'equipment', svg: `<svg viewBox="0 0 64 64"><rect x="10" y="8" width="44" height="48" rx="4" fill="#e74c3c" stroke="#c0392b" stroke-width="2"/><rect x="16" y="14" width="32" height="36" rx="2" fill="white" opacity="0.9"/><circle cx="32" cy="28" r="8" fill="none" stroke="#e74c3c" stroke-width="2.5"/><circle cx="32" cy="28" r="3" fill="#e74c3c"/><text x="32" y="46" text-anchor="middle" font-size="7" font-weight="bold" fill="#c0392b">C52/C25</text></svg>` },

    // --- ALARMS & SYSTEMS ---
    { name: 'Buton Alarmă Incendiu', category: 'alarms', svg: `<svg viewBox="0 0 64 64"><rect x="12" y="12" width="40" height="40" rx="6" fill="#e74c3c"/><rect x="18" y="18" width="28" height="28" rx="3" fill="white"/><rect x="24" y="24" width="16" height="16" rx="2" fill="#e74c3c"/><text x="32" y="36" text-anchor="middle" font-size="8" font-weight="bold" fill="white">FIRE</text><rect x="28" y="40" width="8" height="4" rx="1" fill="#c0392b"/></svg>` },
    { name: 'Detector Fum', category: 'alarms', svg: `<svg viewBox="0 0 64 64"><ellipse cx="32" cy="34" rx="20" ry="12" fill="#ecf0f1" stroke="#bdc3c7" stroke-width="2"/><circle cx="32" cy="32" r="4" fill="#e74c3c"/><path d="M28 18 Q30 12 32 18 Q34 24 36 18" stroke="#95a5a6" stroke-width="2" fill="none" opacity="0.6"/><path d="M24 14 Q28 6 32 14 Q36 22 40 14" stroke="#95a5a6" stroke-width="1.5" fill="none" opacity="0.4"/></svg>` },
    { name: 'Sprinkler', category: 'alarms', svg: `<svg viewBox="0 0 64 64"><circle cx="32" cy="20" r="8" fill="#e74c3c" stroke="#c0392b" stroke-width="2"/><line x1="32" y1="28" x2="32" y2="16" stroke="#888" stroke-width="2"/><path d="M20 36 L26 28 M32 38 L32 28 M44 36 L38 28" stroke="#3498db" stroke-width="2" stroke-linecap="round"/><path d="M16 44 L24 34 M48 44 L40 34" stroke="#3498db" stroke-width="1.5" stroke-linecap="round" opacity="0.6"/><circle cx="22" cy="40" r="2" fill="#3498db" opacity="0.5"/><circle cx="32" cy="44" r="2" fill="#3498db" opacity="0.5"/><circle cx="42" cy="40" r="2" fill="#3498db" opacity="0.5"/></svg>` },
    { name: 'Racord Pompieri', category: 'alarms', svg: `<svg viewBox="0 0 64 64"><circle cx="32" cy="32" r="24" fill="white" stroke="#e74c3c" stroke-width="4"/><circle cx="24" cy="28" r="6" fill="#e74c3c"/><circle cx="40" cy="28" r="6" fill="#e74c3c"/><rect x="20" y="38" width="24" height="6" rx="2" fill="#c0392b"/><text x="32" y="54" text-anchor="middle" font-size="7" font-weight="bold" fill="#c0392b">RACORD</text></svg>` },

    // --- LOCATIONS ---
    { name: 'Stație Pompieri', category: 'locations', svg: `<svg viewBox="0 0 64 64"><path d="M8 36 L32 12 L56 36" fill="#c0392b"/><rect x="14" y="36" width="36" height="22" fill="#e74c3c"/><rect x="24" y="42" width="16" height="16" rx="4" fill="#f1c40f" opacity="0.8"/><rect x="28" y="36" width="8" height="6" fill="#c0392b"/><circle cx="32" cy="24" r="4" fill="#f1c40f"/></svg>` },
    { name: 'Punct Adunare', category: 'locations', svg: `<svg viewBox="0 0 64 64"><rect x="8" y="8" width="48" height="48" rx="8" fill="#27ae60"/><circle cx="24" cy="24" r="4" fill="white"/><path d="M24 28 L24 38 M20 32 L28 32" stroke="white" stroke-width="2" stroke-linecap="round"/><circle cx="40" cy="24" r="4" fill="white"/><path d="M40 28 L40 38 M36 32 L44 32" stroke="white" stroke-width="2" stroke-linecap="round"/><path d="M28 46 L36 46" stroke="white" stroke-width="3" stroke-linecap="round"/><path d="M32 42 L32 50" stroke="white" stroke-width="2" stroke-linecap="round"/></svg>` },
    { name: 'Ieșire Urgență', category: 'locations', svg: `<svg viewBox="0 0 64 64"><rect x="6" y="6" width="52" height="52" rx="6" fill="#27ae60"/><rect x="34" y="16" width="16" height="32" rx="2" fill="white" opacity="0.9"/><path d="M38 32 L46 32 M44 28 L48 32 L44 36" stroke="#27ae60" stroke-width="2.5" fill="none" stroke-linecap="round"/><circle cx="24" cy="20" r="4" fill="white"/><path d="M24 24 L24 38 M16 44 L24 38 L32 44 M18 30 L30 28" stroke="white" stroke-width="2.5" fill="none" stroke-linecap="round"/></svg>` },
    { name: 'Zonă HAZMAT', category: 'locations', svg: `<svg viewBox="0 0 64 64"><polygon points="32,4 60,56 4,56" fill="#f1c40f" stroke="#e67e22" stroke-width="3"/><text x="32" y="46" text-anchor="middle" font-size="28" font-weight="bold" fill="#222">☣</text></svg>` },
  ],

  // ==========================================
  // DEFAULT / GENERIC MARKERS
  // ==========================================
  defaultMarkers: [
    { name: 'Pin', svg: `<svg viewBox="0 0 64 64"><path d="M32 4 C20 4 12 14 12 24 C12 38 32 60 32 60 C32 60 52 38 52 24 C52 14 44 4 32 4Z" fill="#e74c3c"/><circle cx="32" cy="24" r="8" fill="white"/></svg>` },
    { name: 'Flag', svg: `<svg viewBox="0 0 64 64"><line x1="16" y1="12" x2="16" y2="56" stroke="#333" stroke-width="3" stroke-linecap="round"/><path d="M16 12 L52 12 L44 24 L52 36 L16 36Z" fill="#e74c3c"/></svg>` },
    { name: 'Star', svg: `<svg viewBox="0 0 64 64"><polygon points="32,4 38,24 58,24 42,36 48,56 32,44 16,56 22,36 6,24 26,24" fill="#f1c40f"/></svg>` },
    { name: 'Diamond', svg: `<svg viewBox="0 0 64 64"><rect x="16" y="16" width="32" height="32" rx="4" fill="#9b59b6" transform="rotate(45 32 32)"/></svg>` },
    { name: 'Circle', svg: `<svg viewBox="0 0 64 64"><circle cx="32" cy="32" r="24" fill="#3498db"/><circle cx="32" cy="32" r="12" fill="white" opacity="0.6"/></svg>` },
  ],

  // ==========================================
  // CUSTOM USER TYPES (loaded from server)
  // ==========================================
  customTypes: [],

  // ==========================================
  // HELPERS
  // ==========================================
  getAvatar(index) {
    return this.avatars[index % this.avatars.length];
  },

  getIconByType(type, index) {
    if (type === 'custom') {
      const ct = this.customTypes.find(t => t.id === index);
      return ct?.svg_data || this.defaultMarkers[0].svg;
    }
    switch (type) {
      case 'road_sign': return this.roadSigns[index]?.svg || this.defaultMarkers[0].svg;
      case 'hydrant': return this.hydrants[index]?.svg || this.defaultMarkers[0].svg;
      case 'default': return this.defaultMarkers[index]?.svg || this.defaultMarkers[0].svg;
      default: return this.defaultMarkers[0].svg;
    }
  },

  getIconName(type, index) {
    if (type === 'custom') {
      const ct = this.customTypes.find(t => t.id === index);
      return ct?.name || 'Custom';
    }
    switch (type) {
      case 'road_sign': return this.roadSigns[index]?.name || 'Unknown Sign';
      case 'hydrant': return this.hydrants[index]?.name || 'Unknown';
      case 'default': return this.defaultMarkers[index]?.name || 'Pin';
      default: return 'Pin';
    }
  },

  getAllForType(type) {
    switch (type) {
      case 'road_sign': return this.roadSigns.map((s, i) => ({ index: i, name: s.name, svg: s.svg, category: s.category, type: 'road_sign' }));
      case 'hydrant': return this.hydrants.map((h, i) => ({ index: i, name: h.name, svg: h.svg, category: h.category, type: 'hydrant' }));
      case 'custom': return this.customTypes.map(t => ({ index: t.id, name: t.name, svg: t.svg_data, category: 'custom', type: 'custom', scope: t.scope, project_id: t.project_id }));
      case 'default': return this.defaultMarkers.map((m, i) => ({ index: i, name: m.name, svg: m.svg, type: 'default' }));
      default: return this.defaultMarkers.map((m, i) => ({ index: i, name: m.name, svg: m.svg, type: 'default' }));
    }
  },

  // Get subcategories for firefighter icons
  getHydrantCategories() {
    const cats = {};
    this.hydrants.forEach((h, i) => {
      const cat = h.category || 'other';
      if (!cats[cat]) cats[cat] = [];
      cats[cat].push({ index: i, name: h.name, svg: h.svg });
    });
    return cats;
  },

  // Guess icon type from project name
  guessProjectType(name) {
    const lower = (name || '').toLowerCase();
    if (/hydrant|pompier|feu|feuer|water|apa|incend|fire|brand/i.test(lower)) return 'hydrant';
    if (/drum|road|sign|sema|semn|verkehr|route|circula|traffic|strasse/i.test(lower)) return 'road_sign';
    return 'default';
  },

  // Load custom types from server
  async loadCustomTypes(projectId) {
    try {
      const url = projectId ? `/api/marker-types?project_id=${projectId}` : '/api/marker-types';
      const res = await fetch(url);
      if (res.ok) this.customTypes = await res.json();
    } catch { this.customTypes = []; }
  }
};
