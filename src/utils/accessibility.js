// ============================================
// Accessibility Utilities
// ============================================

/** Announce a message to screen readers via the live region */
export function announce(message) {
  const el = document.getElementById('sr-announcer');
  if (el) {
    el.textContent = '';
    // Small delay to ensure announcement is re-read
    setTimeout(() => { el.textContent = message; }, 100);
  }
}

/** Trap focus within an element (for modals) */
export function trapFocus(element) {
  const focusable = element.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  const first = focusable[0];
  const last = focusable[focusable.length - 1];

  function handler(e) {
    if (e.key !== 'Tab') return;
    if (e.shiftKey) {
      if (document.activeElement === first) {
        e.preventDefault();
        last.focus();
      }
    } else {
      if (document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }

  element.addEventListener('keydown', handler);
  first?.focus();

  return () => element.removeEventListener('keydown', handler);
}

/** Set theme (light / dark / high-contrast) */
export function setTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('equipath-theme', theme);
}

/** Get current theme */
export function getTheme() {
  return localStorage.getItem('equipath-theme') ||
    (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
}

/** Initialize theme on page load */
export function initTheme() {
  const theme = getTheme();
  setTheme(theme);
}
