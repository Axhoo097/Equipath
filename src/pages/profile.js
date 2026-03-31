// ============================================
// Profile Page
// ============================================
import { getCurrentUser, getCurrentUserId } from '../services/auth.js';
import { updateUser } from '../services/db.js';
import { navigate } from '../router.js';
import { announce } from '../utils/accessibility.js';
import { showToast } from '../utils/helpers.js';

export function renderProfile(container) {
  const user = getCurrentUser();
  if (!user) { navigate('/login'); return; }

  if (user.role === 'employer') {
    renderEmployerProfile(container, user);
  } else {
    renderSeekerProfile(container, user);
  }
}

function renderSeekerProfile(container, user) {
  const skills = (user.skills || []).join(', ');

  container.innerHTML = `
    <div class="container container-md page">
      <h1 class="mb-2">Your Profile</h1>
      <p class="text-secondary mb-8">Keep your profile updated for better job matches.</p>

      <form id="profile-form" novalidate>
        <div class="card mb-6" style="padding:var(--space-8)">
          <h2 style="font-size:var(--font-size-xl)" class="mb-6">Personal Information</h2>
          
          <div class="grid grid-2">
            <div class="form-group">
              <label class="form-label" for="prof-name">Full Name</label>
              <input type="text" id="prof-name" class="form-input" value="${user.name || ''}" required aria-required="true" />
            </div>
            <div class="form-group">
              <label class="form-label" for="prof-email">Email</label>
              <input type="email" id="prof-email" class="form-input" value="${user.email || ''}" disabled aria-disabled="true" />
              <span class="form-hint">Email cannot be changed</span>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label" for="prof-disability">Disability Category</label>
            <select id="prof-disability" class="form-select">
              <option value="" ${!user.disabilityCategory ? 'selected' : ''}>Prefer not to say</option>
              <option value="visual" ${user.disabilityCategory === 'visual' ? 'selected' : ''}>Visual Impairment</option>
              <option value="hearing" ${user.disabilityCategory === 'hearing' ? 'selected' : ''}>Hearing Impairment</option>
              <option value="mobility" ${user.disabilityCategory === 'mobility' ? 'selected' : ''}>Mobility / Physical</option>
              <option value="cognitive" ${user.disabilityCategory === 'cognitive' ? 'selected' : ''}>Cognitive / Neurological</option>
              <option value="multiple" ${user.disabilityCategory === 'multiple' ? 'selected' : ''}>Multiple Disabilities</option>
              <option value="other" ${user.disabilityCategory === 'other' ? 'selected' : ''}>Other</option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label" for="prof-accommodation">Accommodation Needs</label>
            <textarea id="prof-accommodation" class="form-textarea" placeholder="e.g., Screen reader support, wheelchair-accessible workspace, flexible hours...">${user.accommodationNeeds || ''}</textarea>
            <span class="form-hint">This helps employers prepare accommodations for you.</span>
          </div>
        </div>

        <div class="card mb-6" style="padding:var(--space-8)">
          <h2 style="font-size:var(--font-size-xl)" class="mb-6">Skills & Experience</h2>
          
          <div class="form-group">
            <label class="form-label" for="prof-skills">Skills</label>
            <input type="text" id="prof-skills" class="form-input" value="${skills}" placeholder="e.g., javascript, python, data-analysis, writing" />
            <span class="form-hint">Comma-separated list of your skills. Use lowercase.</span>
          </div>

          <div class="grid grid-2">
            <div class="form-group">
              <label class="form-label" for="prof-education">Education</label>
              <select id="prof-education" class="form-select">
                <option value="" ${!user.education ? 'selected' : ''}>Select level</option>
                <option value="high-school" ${user.education === 'high-school' ? 'selected' : ''}>High School</option>
                <option value="associate" ${user.education === 'associate' ? 'selected' : ''}>Associate Degree</option>
                <option value="bachelor" ${user.education === 'bachelor' ? 'selected' : ''}>Bachelor's Degree</option>
                <option value="master" ${user.education === 'master' ? 'selected' : ''}>Master's Degree</option>
                <option value="doctorate" ${user.education === 'doctorate' ? 'selected' : ''}>Doctorate</option>
                <option value="vocational" ${user.education === 'vocational' ? 'selected' : ''}>Vocational / Trade</option>
                <option value="self-taught" ${user.education === 'self-taught' ? 'selected' : ''}>Self-Taught</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label" for="prof-experience">Years of Experience</label>
              <input type="text" id="prof-experience" class="form-input" value="${user.experience || ''}" placeholder="e.g., 3 years in web dev" />
            </div>
          </div>
        </div>

        <button type="submit" class="btn btn-primary btn-lg" id="profile-save">
          Save Profile
        </button>
      </form>
    </div>
  `;

  document.getElementById('profile-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const userId = getCurrentUserId();
    const skillsRaw = document.getElementById('prof-skills').value;
    const skillsArr = skillsRaw.split(',').map(s => s.trim().toLowerCase()).filter(Boolean);

    updateUser(userId, {
      name: document.getElementById('prof-name').value.trim(),
      disabilityCategory: document.getElementById('prof-disability').value,
      accommodationNeeds: document.getElementById('prof-accommodation').value.trim(),
      skills: skillsArr,
      education: document.getElementById('prof-education').value,
      experience: document.getElementById('prof-experience').value.trim(),
    });

    showToast('Profile saved successfully!', 'success');
    announce('Profile updated');
  });
}

function renderEmployerProfile(container, user) {
  const feats = (user.accessibilityFeatures || []);

  container.innerHTML = `
    <div class="container container-md page">
      <h1 class="mb-2">Company Profile</h1>
      <p class="text-secondary mb-8">Showcase your company's commitment to accessibility.</p>

      <form id="employer-profile-form" novalidate>
        <div class="card mb-6" style="padding:var(--space-8)">
          <h2 style="font-size:var(--font-size-xl)" class="mb-6">Company Details</h2>
          
          <div class="grid grid-2">
            <div class="form-group">
              <label class="form-label" for="emp-name">Company Name</label>
              <input type="text" id="emp-name" class="form-input" value="${user.companyName || ''}" required />
            </div>
            <div class="form-group">
              <label class="form-label" for="emp-industry">Industry</label>
              <select id="emp-industry" class="form-select">
                ${['Technology','Healthcare','Education','Finance','Non-Profit','Government','Retail','Manufacturing','Other']
                  .map(i => `<option value="${i}" ${user.industry === i ? 'selected' : ''}>${i}</option>`).join('')}
              </select>
            </div>
          </div>

          <div class="grid grid-2">
            <div class="form-group">
              <label class="form-label" for="emp-location">Location</label>
              <input type="text" id="emp-location" class="form-input" value="${user.location || ''}" placeholder="City, Country" />
            </div>
            <div class="form-group">
              <label class="form-label" for="emp-size">Company Size</label>
              <select id="emp-size" class="form-select">
                ${['1-10','10-50','50-200','200-500','500+'].map(s =>
                  `<option value="${s}" ${user.companySize === s ? 'selected' : ''}>${s} employees</option>`
                ).join('')}
              </select>
            </div>
          </div>
        </div>

        <div class="card mb-6" style="padding:var(--space-8)">
          <h2 style="font-size:var(--font-size-xl)" class="mb-6">Accessibility Features</h2>
          <p class="text-secondary mb-4">Select all accommodations your workplace provides:</p>
          
          <div class="grid grid-2">
            ${[
              ['wheelchair-ramp', 'Wheelchair Ramp/Access'],
              ['elevator-access', 'Elevator Access'],
              ['screen-reader-stations', 'Screen Reader Stations'],
              ['assistive-tech', 'Assistive Technology Provided'],
              ['sign-language-interpreter', 'Sign Language Interpreters'],
              ['flexible-hours', 'Flexible Working Hours'],
              ['remote-option', 'Remote Work Option'],
              ['quiet-workspace', 'Quiet Workspace Available'],
              ['accessible-parking', 'Accessible Parking'],
              ['mental-health-support', 'Mental Health Support'],
            ].map(([val, label]) => `
              <label class="form-check">
                <input type="checkbox" name="accessibility" value="${val}" ${feats.includes(val) ? 'checked' : ''} />
                <span>${label}</span>
              </label>
            `).join('')}
          </div>
        </div>

        <button type="submit" class="btn btn-primary btn-lg">Save Company Profile</button>
      </form>
    </div>
  `;

  document.getElementById('employer-profile-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const userId = getCurrentUserId();
    const checked = [...document.querySelectorAll('input[name="accessibility"]:checked')].map(c => c.value);

    updateUser(userId, {
      companyName: document.getElementById('emp-name').value.trim(),
      industry: document.getElementById('emp-industry').value,
      location: document.getElementById('emp-location').value.trim(),
      companySize: document.getElementById('emp-size').value,
      accessibilityFeatures: checked,
    });

    showToast('Company profile updated!', 'success');
    announce('Company profile saved');
  });
}
