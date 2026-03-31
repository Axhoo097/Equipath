// ============================================
// Register Page
// ============================================
import { signUp, notifyAuthChange } from '../services/auth.js';
import { navigate } from '../router.js';
import { announce } from '../utils/accessibility.js';
import { showToast } from '../utils/helpers.js';
import { renderNavbar } from '../components/navbar.js';

export function renderRegister(container) {
  container.innerHTML = `
    <div class="container container-sm page">
      <div class="card" style="padding:var(--space-10)">
        <div class="text-center mb-8">
          <h1 style="font-size:var(--font-size-3xl)">Create Your Account</h1>
          <p class="text-secondary mt-2">Join Equipath — inclusive employment for all</p>
        </div>

        <form id="register-form" novalidate>
          <!-- Role Selection -->
          <fieldset style="border:none;margin-bottom:var(--space-6)">
            <legend class="form-label mb-4">I am a:</legend>
            <div class="flex gap-4">
              <label class="card card-flat flex items-center gap-3" style="flex:1;padding:var(--space-4);cursor:pointer;border:2px solid var(--color-border);border-radius:var(--radius-lg);" id="role-seeker-label">
                <input type="radio" name="role" value="jobseeker" id="role-seeker" checked style="width:20px;height:20px;accent-color:var(--color-primary)"/>
                <div>
                  <strong>Job Seeker</strong>
                  <div class="text-muted" style="font-size:var(--font-size-sm)">Find accessible jobs</div>
                </div>
              </label>
              <label class="card card-flat flex items-center gap-3" style="flex:1;padding:var(--space-4);cursor:pointer;border:2px solid var(--color-border);border-radius:var(--radius-lg);" id="role-employer-label">
                <input type="radio" name="role" value="employer" id="role-employer" style="width:20px;height:20px;accent-color:var(--color-primary)"/>
                <div>
                  <strong>Employer</strong>
                  <div class="text-muted" style="font-size:var(--font-size-sm)">Post inclusive jobs</div>
                </div>
              </label>
            </div>
          </fieldset>

          <div class="form-group">
            <label class="form-label" for="reg-name">Full Name</label>
            <input type="text" id="reg-name" class="form-input" placeholder="Your name" required aria-required="true" autocomplete="name" />
            <span class="form-error hidden" id="reg-name-error" role="alert"></span>
          </div>

          <div class="form-group">
            <label class="form-label" for="reg-email">Email Address</label>
            <input type="email" id="reg-email" class="form-input" placeholder="you@example.com" required aria-required="true" autocomplete="email" />
            <span class="form-error hidden" id="reg-email-error" role="alert"></span>
          </div>

          <div class="form-group">
            <label class="form-label" for="reg-password">Password</label>
            <input type="password" id="reg-password" class="form-input" placeholder="Min 8 characters" required aria-required="true" autocomplete="new-password" minlength="8" />
            <span class="form-error hidden" id="reg-password-error" role="alert"></span>
            <span class="form-hint">Must be at least 8 characters</span>
          </div>

          <!-- Job Seeker extra fields -->
          <div id="seeker-fields">
            <div class="form-group">
              <label class="form-label" for="reg-disability">Disability Category (optional)</label>
              <select id="reg-disability" class="form-select" aria-describedby="disability-hint">
                <option value="">Prefer not to say</option>
                <option value="visual">Visual Impairment</option>
                <option value="hearing">Hearing Impairment</option>
                <option value="mobility">Mobility / Physical</option>
                <option value="cognitive">Cognitive / Neurological</option>
                <option value="multiple">Multiple Disabilities</option>
                <option value="other">Other</option>
              </select>
              <span class="form-hint" id="disability-hint">This information is private and helps us match you to suitable roles.</span>
            </div>
          </div>

          <!-- Employer extra fields -->
          <div id="employer-fields" class="hidden">
            <div class="form-group">
              <label class="form-label" for="reg-company">Company Name</label>
              <input type="text" id="reg-company" class="form-input" placeholder="Your company" />
            </div>
            <div class="form-group">
              <label class="form-label" for="reg-industry">Industry</label>
              <select id="reg-industry" class="form-select">
                <option value="">Select industry</option>
                <option value="Technology">Technology</option>
                <option value="Healthcare">Healthcare</option>
                <option value="Education">Education</option>
                <option value="Finance">Finance</option>
                <option value="Non-Profit">Non-Profit</option>
                <option value="Government">Government</option>
                <option value="Retail">Retail</option>
                <option value="Manufacturing">Manufacturing</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div class="form-error hidden mb-4" id="reg-general-error" role="alert" style="text-align:center"></div>

          <button type="submit" class="btn btn-primary btn-lg w-full" id="reg-submit">
            Create Account
          </button>
        </form>

        <p class="text-center text-secondary mt-6" style="font-size:var(--font-size-sm)">
          Already have an account? <a href="#/login">Sign in</a>
        </p>
      </div>
    </div>
  `;

  // Toggle seeker/employer fields
  const roleRadios = document.querySelectorAll('input[name="role"]');
  const seekerFields = document.getElementById('seeker-fields');
  const employerFields = document.getElementById('employer-fields');

  roleRadios.forEach(radio => {
    radio.addEventListener('change', () => {
      const isEmployer = radio.value === 'employer' && radio.checked;
      seekerFields.classList.toggle('hidden', isEmployer);
      employerFields.classList.toggle('hidden', !isEmployer);
      // Update visual selection
      document.getElementById('role-seeker-label').style.borderColor = !isEmployer ? 'var(--color-primary)' : 'var(--color-border)';
      document.getElementById('role-employer-label').style.borderColor = isEmployer ? 'var(--color-primary)' : 'var(--color-border)';
    });
  });

  // Initial state
  document.getElementById('role-seeker-label').style.borderColor = 'var(--color-primary)';

  // Form submit
  document.getElementById('register-form').addEventListener('submit', (e) => {
    e.preventDefault();
    clearErrors();

    const role = document.querySelector('input[name="role"]:checked').value;
    const name = document.getElementById('reg-name').value.trim();
    const email = document.getElementById('reg-email').value.trim();
    const password = document.getElementById('reg-password').value;

    // Validate
    let valid = true;
    if (!name) { showFieldError('reg-name', 'Name is required'); valid = false; }
    if (!email) { showFieldError('reg-email', 'Email is required'); valid = false; }
    if (password.length < 8) { showFieldError('reg-password', 'Password must be at least 8 characters'); valid = false; }
    if (!valid) return;

    const extraData = { name };
    if (role === 'jobseeker') {
      extraData.disabilityCategory = document.getElementById('reg-disability').value;
      extraData.skills = [];
      extraData.education = '';
      extraData.experience = '';
    } else {
      extraData.companyName = document.getElementById('reg-company').value.trim() || name;
      extraData.industry = document.getElementById('reg-industry').value;
      extraData.accessibilityFeatures = [];
      extraData.employerReadinessScore = 0;
    }

    try {
      signUp(email, password, role, extraData);
      notifyAuthChange();
      renderNavbar();
      showToast('Account created successfully!', 'success');
      announce('Account created. Redirecting to dashboard.');
      navigate('/dashboard');
    } catch (err) {
      const errorEl = document.getElementById('reg-general-error');
      errorEl.textContent = err.message;
      errorEl.classList.remove('hidden');
      announce('Registration failed: ' + err.message);
    }
  });
}

function showFieldError(fieldId, message) {
  const input = document.getElementById(fieldId);
  const error = document.getElementById(fieldId + '-error');
  if (input) input.setAttribute('aria-invalid', 'true');
  if (error) { error.textContent = message; error.classList.remove('hidden'); }
}

function clearErrors() {
  document.querySelectorAll('.form-error').forEach(el => { el.classList.add('hidden'); el.textContent = ''; });
  document.querySelectorAll('[aria-invalid]').forEach(el => { el.removeAttribute('aria-invalid'); });
}
