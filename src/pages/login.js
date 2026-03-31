// ============================================
// Login Page
// ============================================
import { signIn, notifyAuthChange } from '../services/auth.js';
import { navigate } from '../router.js';
import { announce } from '../utils/accessibility.js';
import { showToast } from '../utils/helpers.js';
import { renderNavbar } from '../components/navbar.js';

export function renderLogin(container) {
  container.innerHTML = `
    <div class="container container-sm page">
      <div class="card" style="padding:var(--space-10)">
        <div class="text-center mb-8">
          <h1 style="font-size:var(--font-size-3xl)">Welcome Back</h1>
          <p class="text-secondary mt-2">Sign in to your Equipath account</p>
        </div>

        <form id="login-form" novalidate>
          <div class="form-group">
            <label class="form-label" for="login-email">Email Address</label>
            <input 
              type="email" 
              id="login-email" 
              class="form-input" 
              placeholder="you@example.com"
              autocomplete="email"
              required
              aria-required="true"
            />
            <span class="form-error hidden" id="login-email-error" role="alert"></span>
          </div>

          <div class="form-group">
            <label class="form-label" for="login-password">Password</label>
            <input 
              type="password" 
              id="login-password" 
              class="form-input" 
              placeholder="Your password"
              autocomplete="current-password"
              required
              aria-required="true"
            />
            <span class="form-error hidden" id="login-password-error" role="alert"></span>
          </div>

          <div class="form-error hidden mb-4" id="login-general-error" role="alert" style="text-align:center"></div>

          <button type="submit" class="btn btn-primary btn-lg w-full" id="login-submit">
            Sign In
          </button>
        </form>

        <p class="text-center text-secondary mt-6" style="font-size:var(--font-size-sm)">
          Don't have an account? <a href="#/register">Create one free</a>
        </p>

        <div class="text-center mt-4" style="font-size:var(--font-size-xs);color:var(--color-text-muted)">
          <p>Demo accounts for testing:</p>
          <p><strong>Seeker:</strong> test@seeker.com / password123</p>
          <p><strong>Employer:</strong> hr@accesstech.com / password123</p>
        </div>
      </div>
    </div>
  `;

  const form = document.getElementById('login-form');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearErrors();

    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;

    // Validate
    let valid = true;
    if (!email) { showFieldError('login-email', 'Email is required'); valid = false; }
    if (!password) { showFieldError('login-password', 'Password is required'); valid = false; }
    if (!valid) return;

    try {
      const user = signIn(email, password);
      notifyAuthChange();
      renderNavbar();
      showToast(`Welcome back, ${user.name || 'User'}!`, 'success');
      announce('Successfully signed in');
      navigate('/dashboard');
    } catch (err) {
      const errorEl = document.getElementById('login-general-error');
      errorEl.textContent = err.message;
      errorEl.classList.remove('hidden');
      announce('Sign in failed: ' + err.message);
    }
  });
}

function showFieldError(fieldId, message) {
  const input = document.getElementById(fieldId);
  const error = document.getElementById(fieldId + '-error');
  input.setAttribute('aria-invalid', 'true');
  error.textContent = message;
  error.classList.remove('hidden');
}

function clearErrors() {
  document.querySelectorAll('.form-error').forEach(el => {
    el.classList.add('hidden');
    el.textContent = '';
  });
  document.querySelectorAll('[aria-invalid]').forEach(el => {
    el.removeAttribute('aria-invalid');
  });
}
