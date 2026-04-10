// ============================
// Theme Manager
// ============================
window.Theme = {
  current: 'light',

  init(theme) {
    this.set(theme || 'light', false);
  },

  set(theme, save = true) {
    this.current = theme;
    document.documentElement.setAttribute('data-theme', theme);

    // Update theme buttons
    document.querySelectorAll('.theme-btn').forEach(btn => {
      btn.classList.toggle('active', btn.id === `btn-theme-${theme}`);
    });

    // Smooth body transition
    document.body.style.transition = 'background 0.4s ease, color 0.4s ease';

    if (save) {
      fetch('/auth/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ theme })
      }).catch(() => {});
    }
  },

  toggle() {
    this.set(this.current === 'light' ? 'dark' : 'light');
  }
};
