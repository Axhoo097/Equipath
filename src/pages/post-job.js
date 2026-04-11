// ============================================
// FILE HEADER:
// What this file is: A UI component script for posting jobs.
// What module/stage it belongs to: Employer Dashboard (Phase 2/3).
// Real-world job: It draws the screen where employers fill out a form to advertise a new open position.
// Dependencies: talks to '../services/auth.js' for user checks, '../services/db.js' to save the job, an router/accessibility utils.
// ============================================
import { getCurrentUser, getCurrentUserId } from '../services/auth.js';
import { createJob } from '../services/db.js';
import { navigate } from '../router.js';
import { announce } from '../utils/accessibility.js';
import { showToast } from '../utils/helpers.js';

/**
 * FUNCTION HEADER
 * Does: Renders the entire "Post a Job" form onto the screen and sets up its behavior.
 * IN: container (the HTML element where we will draw the page)
 * OUT: void (it just modifies the DOM)
 * Real-world action: "This is the step where a company gets a blank sheet of paper to write a job ad."
 */
export function renderPostJob(container) {
  // Fetching the currently logged in person
  const user = getCurrentUser();
  
  // Checking if someone is logged in at all
  if (!user) { navigate('/login'); return; }
  
  // Verifying they are actually a company not a candidate // SURPRISE: Security guard pattern; without this, a candidate could maliciously post fake jobs.
  if (user.role !== 'employer') { navigate('/dashboard'); return; }

  // Injecting a massive block of HTML to build the visible UI form
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

  // Attaching an event listener so we control what happens when the employer clicks submit
  document.getElementById('post-job-form').addEventListener('submit', (e) => {
    // Stopping the browser from reloading the page, which is default form behavior
    e.preventDefault();

    // Pulling the raw text out of the title field
    const title = document.getElementById('job-title').value.trim();
    // Pulling the raw text out of the description box
    const desc = document.getElementById('job-desc').value.trim();

    // Setting up a flag to track if the form passes inspection
    let valid = true;
    
    // Validating title and showing error if empty
    if (!title) { showError('job-title', 'Job title is required'); valid = false; }
    
    // Validating description and showing error if empty
    if (!desc) { showError('job-desc', 'Description is required'); valid = false; }
    
    // Stopping execution immediately if our flag was flipped to false
    if (!valid) return;

    // Fetching the raw comma-separated string the user typed for skills
    const skillsRaw = document.getElementById('job-skills').value;
    
    // Splitting the string into an array, cleaning spaces, lowercasing, and removing empty ones
    const skills = skillsRaw.split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
    
    // Finding all checked checkboxes and stealing their values into a neat array // SURPRISE: A shorthand spread pattern mapping DOM nodes to values; otherwise you'd write a multi-line loop.
    const tags = [...document.querySelectorAll('input[name="a11y-tags"]:checked')].map(c => c.value);

    // Packaging all the scraped form data and sending it to our database wrapper
    createJob({
      employerId: getCurrentUserId(),
      title,
      description: desc,
      requiredSkills: skills,
      location: document.getElementById('job-location').value.trim() || 'Not specified',
      salaryRange: document.getElementById('job-salary').value.trim(),
      isRemote: document.getElementById('job-remote').checked,
      accessibilityTags: tags,
      // Pulling numeric slider values out for the accessible physical requirements
      physicalRequirements: {
        mobility: parseInt(document.getElementById('phys-mobility').value),
        vision: parseInt(document.getElementById('phys-vision').value),
        hearing: parseInt(document.getElementById('phys-hearing').value),
        cognition: parseInt(document.getElementById('phys-cognition').value),
      },
    });

    // Popping up a visual green success bubble
    showToast('Job published successfully!', 'success');
    
    // Telling the screen reader to speak out loud that it worked so blind users know
    announce('Job posted successfully');
    
    // Booting the employer back to their dashboard now that they are done
    navigate('/dashboard');
  });
}

/**
 * FUNCTION HEADER
 * Does: Visually highlights a specific form field in red and displays an error message.
 * IN: fieldId (the HTML ID of the broken input), msg (the text to show)
 * OUT: void (modifies the DOM classes)
 * Real-world action: "This is pointing a red finger at the paper telling the user they missed a required box."
 */
function showError(fieldId, msg) {
  // Finding the input box itself
  const input = document.getElementById(fieldId);
  
  // Finding the hidden error text box beneath it
  const error = document.getElementById(fieldId + '-error');
  
  // Telling screen readers this box is currently invalid // SURPRISE: Accessibility guard; removing this means blind people won't hear that their specific field failed.
  if (input) input.setAttribute('aria-invalid', 'true');
  
  // Making the red error text visible and putting the text inside it
  if (error) { error.textContent = msg; error.classList.remove('hidden'); }
}

// ============================================
// END-OF-FILE SUMMARY
// This file is responsible for drawing and handling the entire "Post a Job" screen for employers.
// It dynamically injects HTML into the page, waits for the user to submit an application form, and carefully extracts and validates the data.
// Once validated, it pushes this newly built job object into our local database which makes it appear for candidates to view.
// It fits into the bigger system by acting as the main input valve for new employment opportunities in the app.
// ============================================
