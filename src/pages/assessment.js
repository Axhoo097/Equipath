// ============================================
// Ability Assessment Page (Sprint 3)
// ============================================
import { getCurrentUser, getCurrentUserId } from '../services/auth.js';
import { updateUser } from '../services/db.js';
import { ASSESSMENT_CATEGORIES, LIKERT_LABELS, computeAbilityProfile } from '../services/assessment.js';
import { navigate } from '../router.js';
import { announce } from '../utils/accessibility.js';
import { showToast } from '../utils/helpers.js';

export function renderAssessment(container) {
  const user = getCurrentUser();
  if (!user) { navigate('/login'); return; }
  if (user.role === 'employer') { navigate('/dashboard'); return; }

  let currentStep = 0;
  const answers = {};

  // Initialize with existing answers if any
  if (user.assessmentAnswers) {
    Object.assign(answers, user.assessmentAnswers);
  }

  function render() {
    const category = ASSESSMENT_CATEGORIES[currentStep];
    const isLast = currentStep === ASSESSMENT_CATEGORIES.length - 1;
    const isFirst = currentStep === 0;

    container.innerHTML = `
      <div class="container container-md page">
        <h1 class="mb-2">Functional Ability Assessment</h1>
        <p class="text-secondary mb-6">
          Rate your ability level for each statement. This helps us match you to jobs where you'll thrive.
          Your answers are <strong>private</strong> and never shared with employers without your consent.
        </p>

        <!-- Progress Steps -->
        <div class="assessment-progress" role="navigation" aria-label="Assessment progress">
          ${ASSESSMENT_CATEGORIES.map((cat, i) => {
            const status = i < currentStep ? 'completed' : i === currentStep ? 'active' : '';
            return `
              ${i > 0 ? `<div class="assessment-step-line" style="${i <= currentStep ? 'background:var(--color-success)' : ''}"></div>` : ''}
              <div class="assessment-step ${status}" aria-current="${i === currentStep ? 'step' : 'false'}">
                <div class="assessment-step-number">
                  ${i < currentStep ? '✓' : i + 1}
                </div>
                <span class="hidden" style="display:none">${cat.label}</span>
              </div>
            `;
          }).join('')}
        </div>

        <!-- Category Header -->
        <div class="card mb-6" style="padding:var(--space-8)">
          <div class="flex items-center gap-4 mb-6">
            <span style="font-size:36px" aria-hidden="true">${category.icon}</span>
            <div>
              <h2 style="font-size:var(--font-size-2xl)">${category.label}</h2>
              <p class="text-secondary">${category.description}</p>
            </div>
          </div>

          <div class="flex items-center justify-between mb-4" style="font-size:var(--font-size-sm);color:var(--color-text-muted)">
            <span>Cannot do</span>
            <span>Fully able</span>
          </div>

          <!-- Questions -->
          <div id="questions-container" role="group" aria-label="${category.label} questions">
            ${category.questions.map((q, qi) => `
              <div class="mb-6" style="padding-bottom:var(--space-5);${qi < category.questions.length - 1 ? 'border-bottom:1px solid var(--color-border)' : ''}">
                <p class="mb-3" style="font-weight:var(--font-weight-medium)" id="q-label-${q.id}">
                  ${qi + 1}. ${q.text}
                </p>
                <div class="likert-scale" role="radiogroup" aria-labelledby="q-label-${q.id}">
                  ${LIKERT_LABELS.map(opt => `
                    <div class="likert-option">
                      <input type="radio" name="${q.id}" id="${q.id}_${opt.value}" value="${opt.value}" 
                        ${answers[q.id] == opt.value ? 'checked' : ''} />
                      <label for="${q.id}_${opt.value}">
                        <span style="font-size:var(--font-size-lg);font-weight:700">${opt.value}</span>
                        <span style="font-size:var(--font-size-xs);color:var(--color-text-muted)">${opt.label}</span>
                      </label>
                    </div>
                  `).join('')}
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Navigation -->
        <div class="flex justify-between">
          <button class="btn btn-secondary" id="prev-btn" ${isFirst ? 'disabled style="opacity:0.5"' : ''}>
            ← Previous
          </button>
          <span class="text-muted flex items-center" style="font-size:var(--font-size-sm)">
            Step ${currentStep + 1} of ${ASSESSMENT_CATEGORIES.length}
          </span>
          ${isLast ? `
            <button class="btn btn-primary" id="finish-btn">Finish & See Results ✓</button>
          ` : `
            <button class="btn btn-primary" id="next-btn">Next →</button>
          `}
        </div>
      </div>
    `;

    // Collect answers on change
    container.querySelectorAll('input[type="radio"]').forEach(radio => {
      radio.addEventListener('change', () => {
        answers[radio.name] = parseInt(radio.value);
      });
    });

    // Navigation
    document.getElementById('prev-btn')?.addEventListener('click', () => {
      if (currentStep > 0) { currentStep--; render(); announce(`Step ${currentStep + 1}: ${ASSESSMENT_CATEGORIES[currentStep].label}`); }
    });

    document.getElementById('next-btn')?.addEventListener('click', () => {
      // Validate all questions answered for current step
      const unanswered = category.questions.filter(q => !answers[q.id]);
      if (unanswered.length > 0) {
        showToast('Please answer all questions before proceeding.', 'error');
        announce('Please answer all questions');
        return;
      }
      currentStep++;
      render();
      announce(`Step ${currentStep + 1}: ${ASSESSMENT_CATEGORIES[currentStep].label}`);
    });

    document.getElementById('finish-btn')?.addEventListener('click', () => {
      // Validate final step
      const unanswered = category.questions.filter(q => !answers[q.id]);
      if (unanswered.length > 0) {
        showToast('Please answer all questions before finishing.', 'error');
        return;
      }

      // Compute & save
      const profile = computeAbilityProfile(answers);
      const userId = getCurrentUserId();
      updateUser(userId, {
        abilityProfile: profile,
        overallAbilityScore: profile.overall,
        assessmentAnswers: answers,
      });

      showToast('Assessment complete! Your ability profile has been saved.', 'success');
      announce('Assessment complete');
      renderResults(container, profile);
    });
  }

  render();
}

function renderResults(container, profile) {
  container.innerHTML = `
    <div class="container container-md page">
      <div class="text-center mb-8">
        <div style="font-size:48px;margin-bottom:var(--space-4)">🎉</div>
        <h1>Assessment Complete!</h1>
        <p class="text-secondary mt-2">Here's your ability profile. This helps us match you to the right jobs.</p>
      </div>

      <div class="card" style="padding:var(--space-8)">
        <div class="text-center mb-6">
          <div class="score-badge ${profile.overall >= 70 ? 'high' : profile.overall >= 40 ? 'medium' : 'low'}" 
               style="width:80px;height:80px;font-size:var(--font-size-2xl);margin:0 auto"
               aria-label="Overall ability score ${profile.overall} percent">
            ${profile.overall}%
          </div>
          <p class="text-secondary mt-2">Overall Ability Score</p>
        </div>

        <div class="ability-scores">
          ${['mobility', 'vision', 'hearing', 'cognition'].map(cat => {
            const icon = { mobility: '🦿', vision: '👁️', hearing: '👂', cognition: '🧠' }[cat];
            return `
              <div class="ability-score-item">
                <div class="ability-score-header">
                  <span>${icon} ${cat.charAt(0).toUpperCase() + cat.slice(1)}</span>
                  <span style="font-weight:700;color:var(--color-primary)">${profile[cat]}%</span>
                </div>
                <div class="progress-bar" style="height:12px">
                  <div class="progress-bar-fill" style="width:${profile[cat]}%" role="progressbar"
                       aria-valuenow="${profile[cat]}" aria-valuemin="0" aria-valuemax="100"
                       aria-label="${cat} ${profile[cat]} percent"></div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>

      <div class="flex justify-center gap-4 mt-8">
        <a href="#/jobs" class="btn btn-primary btn-lg">Find Matching Jobs →</a>
        <a href="#/dashboard" class="btn btn-secondary btn-lg">Back to Dashboard</a>
      </div>
    </div>
  `;
}
