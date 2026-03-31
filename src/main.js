// ============================================
// Equipath — Main Application Entry Point
// ============================================
import './styles/index.css';
import './styles/accessibility.css';
import './styles/components.css';

import { registerRoute, initRouter } from './router.js';
import { initTheme } from './utils/accessibility.js';
import { seedData } from './services/db.js';
import { renderNavbar } from './components/navbar.js';

// Pages
import { renderLanding } from './pages/landing.js';
import { renderLogin } from './pages/login.js';
import { renderRegister } from './pages/register.js';
import { renderDashboard } from './pages/dashboard.js';
import { renderProfile } from './pages/profile.js';
import { renderAssessment } from './pages/assessment.js';
import { renderJobs } from './pages/jobs.js';
import { renderPostJob } from './pages/post-job.js';

// --- Initialize App ---
function initApp() {
  // Theme
  initTheme();

  // Seed demo data
  seedData();

  // Register routes
  registerRoute('/', renderLanding);
  registerRoute('/login', renderLogin);
  registerRoute('/register', renderRegister);
  registerRoute('/dashboard', renderDashboard);
  registerRoute('/profile', renderProfile);
  registerRoute('/assessment', renderAssessment);
  registerRoute('/jobs', renderJobs);
  registerRoute('/post-job', renderPostJob);

  // Render navbar & start router
  renderNavbar();
  initRouter();

  // Re-render navbar on hash change (for active state)
  window.addEventListener('hashchange', () => renderNavbar());

  console.log('✅ Equipath initialized');
}

// Boot
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
