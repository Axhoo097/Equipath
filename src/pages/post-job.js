// ============================================
// Post Job Page (Employer)
// ============================================
import { getCurrentUser, getCurrentUserId } from '../services/auth.js';
import { createJob } from '../services/db.js';
import { navigate } from '../router.js';
import { announce } from '../utils/accessibility.js';
import { showToast } from '../utils/helpers.js';

export function renderPostJob(container) {
  const user = getCurrentUser();
  if (!user) { navigate('/login'); return; }
  if (user.role !== 'employer') { navigate('/dashboard'); return; }

  container.innerHTML = `
    <div class="container container-md page">
      <h1 class="mb-2">Post a New Job</h1>
      <p class="text-secondary mb-8">Create an inclusive job listing that welcomes candidates of all abilities.</p>

      <form id="post-job-form" novalidate>
        <div class="card mb-6" style="padding:var(--space-8)">
          <h2 style="font-size:var(--font-size-xl)" class="mb-6">Job Details</h2>

          <div class="form-group">
            <label class="form-label" for="job-title">Job Title *</label>
            <input type="text" id="job-title" class="form-input" placeholder="e.g., Frontend Developer" required aria-required="true" />
            <span class="form-error hidden" id="job-title-error" role="alert"></span>
          </div>

          <div class="form-group">
            <label class="form-label" for="job-desc">Job Description *</label>
            <textarea id="job-desc" class="form-textarea" rows="5" placeholder="Describe the role, responsibilities, and what makes this position accessible..." required aria-required="true"></textarea>
            <span class="form-error hidden" id="job-desc-error" role="alert"></span>
          </div>

          <div class="form-group">
            <label class="form-label" for="job-skills">Required Skills</label>
            <input type="text" id="job-skills" class="form-input" placeholder="e.g., javascript, python, communication (comma-separated)" />
            <span class="form-hint">Comma-separated list of required skills</span>
          </div>

          <div class="grid grid-2">
            <div class="form-group">
              <label class="form-label" for="job-location">Location</label>
              <input type="text" id="job-location" class="form-input" placeholder="City, State or 'Remote'" value="${user.location || ''}" />
            </div>
            <div class="form-group">
              <label class="form-label" for="job-salary">Salary Range</label>
              <input type="text" id="job-salary" class="form-input" placeholder="e.g., $50,000 - $75,000" />
            </div>
          </div>

          <label class="form-check mt-2">
            <input type="checkbox" id="job-remote" />
            <span>This position offers remote work</span>
          </label>
        </div>

        <div class="card mb-6" style="padding:var(--space-8)">
          <h2 style="font-size:var(--font-size-xl)" class="mb-6">Accessibility & Requirements</h2>
          <p class="text-secondary mb-4">What accessibility features does this role provide?</p>

          <div class="grid grid-2 mb-6">
            ${[
              ['screen-reader-friendly', '🖥️ Screen Reader Friendly'],
              ['no-physical-requirements', '♿ No Physical Requirements'],
              ['wheelchair-accessible', '🏢 Wheelchair Accessible Office'],
              ['flexible-hours', '⏰ Flexible Working Hours'],
              ['sign-language-support', '🤟 Sign Language Support'],
              ['quiet-workspace', '🔇 Quiet Workspace'],
              ['assistive-tech-provided', '🔧 Assistive Tech Provided'],
              ['elevator-access', '🛗 Elevator Access'],
            ].map(([val, label]) => `
              <label class="form-check">
                <input type="checkbox" name="a11y-tags" value="${val}" />
                <span>${label}</span>
              </label>
            `).join('')}
          </div>

          <h3 style="font-size:var(--font-size-lg)" class="mb-4">Physical Requirements Level</h3>
          <p class="text-secondary mb-4" style="font-size:var(--font-size-sm)">
            Rate how much each ability is needed for this job (higher = less needed = more accessible):
          </p>
          
          <div class="grid grid-2">
            ${[
              ['phys-mobility', '🦿 Mobility', 'How much physical mobility is needed?'],
              ['phys-vision', '👁️ Vision', 'How much visual ability is needed?'],
              ['phys-hearing', '👂 Hearing', 'How much hearing ability is needed?'],
              ['phys-cognition', '🧠 Cognition', 'How much cognitive demand is required?'],
            ].map(([id, label, hint]) => `
              <div class="form-group">
                <label class="form-label" for="${id}">${label}</label>
                <div class="flex items-center gap-3">
                  <span style="font-size:var(--font-size-xs);color:var(--color-text-muted);white-space:nowrap">High demand</span>
                  <input type="range" id="${id}" min="10" max="100" value="75" class="w-full" style="accent-color:var(--color-primary);height:8px" aria-describedby="${id}-hint" />
                  <span style="font-size:var(--font-size-xs);color:var(--color-text-muted);white-space:nowrap">Low demand</span>
                </div>
                <span class="form-hint" id="${id}-hint">${hint}</span>
              </div>
            `).join('')}
          </div>
        </div>

        <div class="flex gap-4">
          <button type="submit" class="btn btn-primary btn-lg">Publish Job</button>
          <a href="#/dashboard" class="btn btn-secondary btn-lg">Cancel</a>
        </div>
      </form>
    </div>
  `;

  document.getElementById('post-job-form').addEventListener('submit', (e) => {
    e.preventDefault();

    const title = document.getElementById('job-title').value.trim();
    const desc = document.getElementById('job-desc').value.trim();

    // Validate
    let valid = true;
    if (!title) { showError('job-title', 'Job title is required'); valid = false; }
    if (!desc) { showError('job-desc', 'Description is required'); valid = false; }
    if (!valid) return;

    const skillsRaw = document.getElementById('job-skills').value;
    const skills = skillsRaw.split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
    const tags = [...document.querySelectorAll('input[name="a11y-tags"]:checked')].map(c => c.value);

    createJob({
      employerId: getCurrentUserId(),
      title,
      description: desc,
      requiredSkills: skills,
      location: document.getElementById('job-location').value.trim() || 'Not specified',
      salaryRange: document.getElementById('job-salary').value.trim(),
      isRemote: document.getElementById('job-remote').checked,
      accessibilityTags: tags,
      physicalRequirements: {
        mobility: parseInt(document.getElementById('phys-mobility').value),
        vision: parseInt(document.getElementById('phys-vision').value),
        hearing: parseInt(document.getElementById('phys-hearing').value),
        cognition: parseInt(document.getElementById('phys-cognition').value),
      },
    });

    showToast('Job published successfully!', 'success');
    announce('Job posted successfully');
    navigate('/dashboard');
  });
}

function showError(fieldId, msg) {
  const input = document.getElementById(fieldId);
  const error = document.getElementById(fieldId + '-error');
  if (input) input.setAttribute('aria-invalid', 'true');
  if (error) { error.textContent = msg; error.classList.remove('hidden'); }
}
