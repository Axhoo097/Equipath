// ============================================
// Jobs Page — Browse & Apply (Sprint 4)
// ============================================
import { getCurrentUser, getCurrentUserId } from '../services/auth.js';
import { getAllJobs, createApplication, getApplicationsByUser, getUser } from '../services/db.js';
import { rankJobsForUser, getSkillGaps } from '../services/matching.js';
import { computeEmployerScore } from '../services/readiness.js';
import { navigate } from '../router.js';
import { announce } from '../utils/accessibility.js';
import { showToast } from '../utils/helpers.js';

export function renderJobs(container) {
  const user = getCurrentUser();
  if (!user) { navigate('/login'); return; }
  if (user.role === 'employer') { navigate('/dashboard'); return; }

  const allJobs = getAllJobs();
  const ranked = rankJobsForUser(user, allJobs);
  const applications = getApplicationsByUser(getCurrentUserId());
  const appliedJobIds = new Set(applications.map(a => a.jobId));

  let filterRemote = false;
  let searchQuery = '';

  function render() {
    let filtered = ranked;

    if (filterRemote) {
      filtered = filtered.filter(r => r.job.isRemote);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(r =>
        r.job.title.toLowerCase().includes(q) ||
        r.job.description.toLowerCase().includes(q) ||
        (r.job.requiredSkills || []).some(s => s.toLowerCase().includes(q))
      );
    }

    container.innerHTML = `
      <div class="container page">
        <div class="flex items-center justify-between mb-6" style="flex-wrap:wrap;gap:var(--space-4)">
          <div>
            <h1>Find Jobs</h1>
            <p class="text-secondary">${filtered.length} jobs matched to your profile</p>
          </div>
        </div>

        <!-- Search & Filters -->
        <div class="card mb-6" style="padding:var(--space-4)">
          <div class="flex gap-4 items-center" style="flex-wrap:wrap">
            <div class="form-group" style="flex:1;min-width:250px;margin-bottom:0">
              <label for="job-search" class="sr-only">Search jobs</label>
              <input type="search" id="job-search" class="form-input" placeholder="🔍 Search by title, skill, or keyword..." value="${searchQuery}" />
            </div>
            <label class="form-check" style="min-height:auto">
              <input type="checkbox" id="filter-remote" ${filterRemote ? 'checked' : ''} />
              <span>Remote Only</span>
            </label>
          </div>
        </div>

        <!-- Results -->
        <div id="job-results" aria-live="polite">
          ${filtered.length > 0 ? `
            <div class="grid" style="gap:var(--space-4)">
              ${filtered.map(({ job, matchScore, skillScore, abilityScore }) => {
                const applied = appliedJobIds.has(job.id);
                const gaps = getSkillGaps(user.skills, job.requiredSkills);
                const emp = getUser(job.employerId);
                const empName = emp?.companyName || emp?.name || 'Unknown Company';
                const empScore = computeEmployerScore(emp);
                return `
                  <div class="card job-card" id="job-${job.id}">
                    <div class="job-card-body">
                      <div class="job-card-title">${job.title}</div>
                      <div class="job-card-company flex items-center gap-2" style="font-size: var(--font-size-sm);">
                        <strong>${empName}</strong> · ${job.location}
                        <span class="badge ${empScore >= 80 ? 'bg-success' : 'bg-warning'} text-white" style="padding: 2px 6px; border-radius: 4px; font-size: 0.75rem;" title="Employer Accessibility Score">
                          🛡️ ${empScore}% Accessible
                        </span>
                      </div>
                      <p class="text-secondary mb-3" style="font-size:var(--font-size-sm);line-height:1.5;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">
                        ${job.description}
                      </p>
                      <div class="job-card-meta">
                        ${job.isRemote ? '<span class="tag tag-success">Remote</span>' : ''}
                        ${job.salaryRange ? `<span class="tag">${job.salaryRange}</span>` : ''}
                        <span class="tag" title="Skill match">🎯 ${skillScore}% skill</span>
                        <span class="tag" title="Ability fit">♿ ${abilityScore}% ability</span>
                      </div>
                      <div class="job-card-tags mt-2">
                        ${(job.accessibilityTags || []).slice(0, 4).map(t => `<span class="tag">${formatTag(t)}</span>`).join('')}
                      </div>
                      ${gaps.length > 0 ? `
                        <div class="mt-3" style="font-size:var(--font-size-xs);color:var(--color-text-muted)">
                          <strong>Skill gaps:</strong> ${gaps.map(g => formatTag(g)).join(', ')}
                        </div>
                      ` : ''}
                      <div class="mt-4">
                        ${applied
                          ? '<button class="btn btn-ghost btn-sm" disabled>✓ Applied</button>'
                          : `
                            <div style="margin-bottom: 0.5rem;">
                              <label class="form-check" style="font-size: var(--font-size-sm);">
                                <input type="checkbox" id="anon-${job.id}" />
                                <span>Apply Anonymously (Hide name & demographic cues)</span>
                              </label>
                            </div>
                            <button class="btn btn-primary btn-sm apply-btn" data-job-id="${job.id}">Apply Now</button>
                          `
                        }
                      </div>
                    </div>
                    <div class="job-card-score">
                      <div class="score-badge ${matchScore >= 70 ? 'high' : matchScore >= 40 ? 'medium' : 'low'}"
                           aria-label="Match score ${matchScore} percent">
                        ${matchScore}%
                      </div>
                      <span class="job-card-score-label">Match</span>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          ` : `
            <div class="card empty-state">
              <div class="empty-state-icon">🔍</div>
              <h3>No jobs found</h3>
              <p>Try adjusting your search or filters.</p>
            </div>
          `}
        </div>
      </div>
    `;

    // Search handler
    document.getElementById('job-search')?.addEventListener('input', (e) => {
      searchQuery = e.target.value;
      render();
    });

    // Remote filter
    document.getElementById('filter-remote')?.addEventListener('change', (e) => {
      filterRemote = e.target.checked;
      render();
      announce(filterRemote ? 'Showing remote jobs only' : 'Showing all jobs');
    });

    // Apply buttons
    container.querySelectorAll('.apply-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const jobId = btn.dataset.jobId;
        const isAnon = document.getElementById(`anon-${jobId}`)?.checked || false;
        createApplication({
          jobId,
          userId: getCurrentUserId(),
          matchScore: ranked.find(r => r.job.id === jobId)?.matchScore || 0,
          isAnonymous: isAnon,
        });
        appliedJobIds.add(jobId);
        showToast('Application submitted successfully!', 'success');
        announce('Application submitted');
        render();
      });
    });
  }

  render();
}

function formatTag(tag) {
  return tag.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}
