// ============================================
// SPA Router — Hash-based client-side routing
// ============================================

const routes = {};
let currentRoute = null;

export function registerRoute(path, handler) {
  routes[path] = handler;
}

export function navigate(path) {
  window.location.hash = path;
}

export function getCurrentRoute() {
  return currentRoute;
}

export function initRouter() {
  const handleRoute = () => {
    const hash = window.location.hash.slice(1) || '/';
    currentRoute = hash;

    const main = document.getElementById('main-content');
    if (!main) return;

    // Find matching route
    const handler = routes[hash];
    if (handler) {
      main.innerHTML = '';
      handler(main);
      // Move focus to main content for screen readers
      main.focus();
      // Announce page change
      announceRoute(hash);
    } else {
      main.innerHTML = `
        <div class="container page">
          <div class="empty-state">
            <div class="empty-state-icon">🔍</div>
            <h3>Page Not Found</h3>
            <p>The page you're looking for doesn't exist.</p>
            <a href="#/" class="btn btn-primary">Go Home</a>
          </div>
        </div>
      `;
    }

    // Scroll to top
    window.scrollTo(0, 0);
  };

  window.addEventListener('hashchange', handleRoute);
  handleRoute();
}

function announceRoute(route) {
  const names = {
    '/': 'Home',
    '/login': 'Login',
    '/register': 'Create Account',
    '/dashboard': 'Dashboard',
    '/profile': 'Profile',
    '/assessment': 'Ability Assessment',
    '/jobs': 'Job Listings',
    '/post-job': 'Post a Job',
  };
  const name = names[route] || 'Page';
  const announcer = document.getElementById('sr-announcer');
  if (announcer) {
    announcer.textContent = `Navigated to ${name}`;
  }
}
