// ============================================
// Navbar Component
// ============================================
import { getCurrentUser, signOut, notifyAuthChange } from '../services/auth.js';
import { navigate } from '../router.js';
import { setTheme, getTheme } from '../utils/accessibility.js';

export function renderNavbar() {
  const nav = document.getElementById('navbar');
  if (!nav) return;
  const user = getCurrentUser();
  const theme = getTheme();
  const themeIcon = theme === 'dark' ? '☀️' : theme === 'high-contrast' ? '◐' : '🌙';

  nav.innerHTML = `
    <div class="navbar">
      <div class="navbar-inner">
        <a href="#/" class="navbar-brand" aria-label="Equipath Home">
          <svg width="36" height="36" viewBox="0 0 32 32" aria-hidden="true">
            <defs><linearGradient id="ng" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#6366f1"/>
              <stop offset="100%" stop-color="#06b6d4"/>
            </linearGradient></defs>
            <circle cx="16" cy="16" r="15" fill="url(#ng)"/>
            <text x="16" y="21" text-anchor="middle" fill="white" font-family="Inter,sans-serif" font-weight="700" font-size="14">E</text>
          </svg>
          Equipath
        </a>

        <button class="nav-toggle" id="nav-toggle" aria-label="Toggle navigation menu" aria-expanded="false">
          <span></span><span></span><span></span>
        </button>

        <ul class="navbar-links" id="nav-links" role="menubar">
          ${user ? getAuthLinks(user) : getGuestLinks()}
        </ul>

        <div class="navbar-actions">
          <button class="btn btn-icon btn-ghost" id="theme-toggle" aria-label="Toggle theme" title="Toggle theme">
            ${themeIcon}
          </button>
          ${user ? `
            <button class="btn btn-ghost btn-sm" id="logout-btn" aria-label="Sign out">
              Sign Out
            </button>
          ` : ''}
        </div>
      </div>
    </div>
  `;

  // Mobile toggle
  const toggle = document.getElementById('nav-toggle');
  const links = document.getElementById('nav-links');
  toggle?.addEventListener('click', () => {
    const open = links.classList.toggle('open');
    toggle.setAttribute('aria-expanded', open);
  });

  // Theme toggle — cycle: light → dark → high-contrast → light
  document.getElementById('theme-toggle')?.addEventListener('click', () => {
    const current = getTheme();
    const next = current === 'light' ? 'dark' : current === 'dark' ? 'high-contrast' : 'light';
    setTheme(next);
    renderNavbar();
  });

  // Logout
  document.getElementById('logout-btn')?.addEventListener('click', () => {
    signOut();
    notifyAuthChange();
    navigate('/');
    renderNavbar();
  });

  // Highlight active link
  const hash = window.location.hash.slice(1) || '/';
  nav.querySelectorAll('.navbar-links a').forEach(a => {
    const href = a.getAttribute('href')?.slice(1);
    if (href === hash) a.classList.add('active');
  });
}

function getGuestLinks() {
  return `
    <li role="none"><a href="#/" role="menuitem">Home</a></li>
    <li role="none"><a href="#/login" role="menuitem">Login</a></li>
    <li role="none"><a href="#/register" role="menuitem" class="btn btn-primary btn-sm">Get Started</a></li>
  `;
}

function getAuthLinks(user) {
  if (user.role === 'employer') {
    return `
      <li role="none"><a href="#/dashboard" role="menuitem">Dashboard</a></li>
      <li role="none"><a href="#/post-job" role="menuitem">Post Job</a></li>
      <li role="none"><a href="#/profile" role="menuitem">Company Profile</a></li>
    `;
  }
  return `
    <li role="none"><a href="#/dashboard" role="menuitem">Dashboard</a></li>
    <li role="none"><a href="#/jobs" role="menuitem">Find Jobs</a></li>
    <li role="none"><a href="#/skill-map" role="menuitem">Skill Planner</a></li>
    <li role="none"><a href="#/assessment" role="menuitem">Assessment</a></li>
    <li role="none"><a href="#/profile" role="menuitem">Profile</a></li>
  `;
}
