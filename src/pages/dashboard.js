// ============================================
// Dashboard Page
// ============================================
import { getCurrentUser, getCurrentUserId } from '../services/auth.js';
import { getAllJobs, getApplicationsByUser, getJobsByEmployer, getApplicationsByJob } from '../services/db.js';
import { rankJobsForUser } from '../services/matching.js';
import { navigate } from '../router.js';

export function renderDashboard(container) {
  const user = getCurrentUser();
  if (!user) { navigate('/login'); return; }

  if (user.role === 'employer') {
    renderEmployerDashboard(container, user);
  } else {
    renderSeekerDashboard(container, user);
  }
}

function renderSeekerDashboard(container, user) {
  const userId = getCurrentUserId();
  const allJobs = getAllJobs();
  const ranked = rankJobsForUser(user, allJobs);
  const topMatches = ranked.slice(0, 3);
  const applications = getApplicationsByUser(userId);
  const hasAssessment = !!user.abilityProfile;

  container.innerHTML = `
    <div class="container page">
      <div class="dashboard-header">
        <h1>Welcome, <span class="text-gradient">${user.name || 'Job Seeker'}</span></h1>
        <p class="text-secondary">Your inclusive job search starts here.</p>
      </div>

      <!-- Stats -->
      <div class="grid grid-4 mb-8">
        <div class="card stat-card">
          <div class="stat-icon purple" aria-hidden="true">🎯</div>
          <div>
            <div class="stat-value">${ranked.length}</div>
            <div class="stat-label">Jobs Available</div>
          </div>
        </div>
        <div class="card stat-card">
          <div class="stat-icon green" aria-hidden="true">📄</div>
          <div>
            <div class="stat-value">${applications.length}</div>
            <div class="stat-label">Applications Sent</div>
          </div>
        </div>
        <div class="card stat-card">
          <div class="stat-icon amber" aria-hidden="true">⭐</div>
          <div>
            <div class="stat-value">${topMatches.length > 0 ? topMatches[0].matchScore + '%' : '—'}</div>
            <div class="stat-label">Best Match Score</div>
          </div>
        </div>
        <div class="card stat-card">
          <div class="stat-icon blue" aria-hidden="true">🧠</div>
          <div>
            <div class="stat-value">${hasAssessment ? user.abilityProfile.overall + '%' : '—'}</div>
            <div class="stat-label">Assessment Score</div>
          </div>
        </div>
      </div>

      <!-- Quick Actions -->
      ${!hasAssessment ? `
        <div class="card card-gradient mb-8" style="border-left:4px solid var(--color-accent)">
          <div class="flex items-center justify-between" style="flex-wrap:wrap;gap:var(--space-4)">
            <div>
              <h3>Complete Your Ability Assessment</h3>
              <p class="text-secondary mt-1">Take our 5-minute assessment to get personalized job matches.</p>
            </div>
            <a href="#/assessment" class="btn btn-primary">Start Assessment →</a>
          </div>
        </div>
      ` : ''}

      ${(user.skills || []).length === 0 ? `
        <div class="card card-gradient mb-8" style="border-left:4px solid var(--color-warning)">
          <div class="flex items-center justify-between" style="flex-wrap:wrap;gap:var(--space-4)">
            <div>
              <h3>Add Your Skills</h3>
              <p class="text-secondary mt-1">Update your profile with skills to improve job matching accuracy.</p>
            </div>
            <a href="#/profile" class="btn btn-secondary">Update Profile →</a>
          </div>
        </div>
      ` : ''}

      <!-- Top Matches -->
      <div class="flex items-center justify-between mb-4">
        <h2>Top Job Matches</h2>
        <a href="#/jobs" class="btn btn-ghost btn-sm">View All →</a>
      </div>

      ${topMatches.length > 0 ? `
        <div class="grid" style="gap:var(--space-4)">
          ${topMatches.map(({ job, matchScore }) => `
            <div class="card job-card">
              <div class="job-card-body">
                <div class="job-card-title">${job.title}</div>
                <div class="job-card-company">${getEmployerName(job.employerId)} · ${job.location}</div>
                <div class="job-card-meta">
                  ${job.isRemote ? '<span class="tag tag-success">Remote</span>' : ''}
                  ${job.salaryRange ? `<span class="tag">${job.salaryRange}</span>` : ''}
                </div>
                <div class="job-card-tags">
                  ${(job.accessibilityTags || []).slice(0, 3).map(t => `<span class="tag">${formatTag(t)}</span>`).join('')}
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
          `).join('')}
        </div>
      ` : `
        <div class="card empty-state">
          <div class="empty-state-icon">🔍</div>
          <h3>No matches yet</h3>
          <p>Complete your profile and assessment to see personalized job matches.</p>
        </div>
      `}

      ${hasAssessment ? `
        <!-- Ability Profile -->
        <h2 class="mt-8 mb-4">Your Ability Profile</h2>
        <div class="card">
          <div class="ability-scores">
            ${['mobility', 'vision', 'hearing', 'cognition'].map(cat => `
              <div class="ability-score-item">
                <div class="ability-score-header">
                  <span>${cat.charAt(0).toUpperCase() + cat.slice(1)}</span>
                  <span class="text-primary" style="font-weight:600">${user.abilityProfile[cat]}%</span>
                </div>
                <div class="progress-bar">
                  <div class="progress-bar-fill" style="width:${user.abilityProfile[cat]}%" role="progressbar" 
                       aria-valuenow="${user.abilityProfile[cat]}" aria-valuemin="0" aria-valuemax="100"
                       aria-label="${cat} score ${user.abilityProfile[cat]} percent"></div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}
    </div>
  `;
}

function renderEmployerDashboard(container, user) {
  const userId = getCurrentUserId();
  const myJobs = getJobsByEmployer(userId);
  let totalApps = 0;
  myJobs.forEach(j => { totalApps += getApplicationsByJob(j.id).length; });

  container.innerHTML = `
    <div class="container page">
      <div class="dashboard-header">
        <h1>Welcome, <span class="text-gradient">${user.companyName || user.name || 'Employer'}</span></h1>
        <p class="text-secondary">Manage your inclusive job postings.</p>
      </div>

      <div class="grid grid-3 mb-8">
        <div class="card stat-card">
          <div class="stat-icon purple" aria-hidden="true">📋</div>
          <div>
            <div class="stat-value">${myJobs.length}</div>
            <div class="stat-label">Active Listings</div>
          </div>
        </div>
        <div class="card stat-card">
          <div class="stat-icon green" aria-hidden="true">👥</div>
          <div>
            <div class="stat-value">${totalApps}</div>
            <div class="stat-label">Total Applications</div>
          </div>
        </div>
        <div class="card stat-card">
          <div class="stat-icon amber" aria-hidden="true">⭐</div>
          <div>
            <div class="stat-value">${user.employerReadinessScore || '—'}</div>
            <div class="stat-label">Readiness Score</div>
          </div>
        </div>
      </div>

      <div class="flex items-center justify-between mb-4">
        <h2>Your Job Listings</h2>
        <a href="#/post-job" class="btn btn-primary btn-sm">+ Post New Job</a>
      </div>

      ${myJobs.length > 0 ? `
        <div class="grid" style="gap:var(--space-4)">
          ${myJobs.map(job => {
            const apps = getApplicationsByJob(job.id);
            return `
              <div class="card job-card">
                <div class="job-card-body">
                  <div class="job-card-title">${job.title}</div>
                  <div class="job-card-company">${job.location} · ${job.salaryRange || 'Salary not specified'}</div>
                  <div class="job-card-meta">
                    ${job.isRemote ? '<span class="tag tag-success">Remote</span>' : ''}
                    <span class="tag">${apps.length} application${apps.length !== 1 ? 's' : ''}</span>
                  </div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      ` : `
        <div class="card empty-state">
          <div class="empty-state-icon">📋</div>
          <h3>No job listings yet</h3>
          <p>Post your first inclusive job to start receiving applications from talented PwD candidates.</p>
          <a href="#/post-job" class="btn btn-primary mt-4">Post a Job</a>
        </div>
      `}
    </div>
  `;
}

function getEmployerName(employerId) {
  const { getUser } = require('../services/db.js');
  const emp = getUser(employerId);
  return emp?.companyName || emp?.name || 'Unknown Company';
}

function formatTag(tag) {
  return tag.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

// Fix: use dynamic import workaround for getUser
function require(path) {
  // We already import getUser at the top level via db.js — let's use it directly
  return { getUser: (id) => {
    const db = JSON.parse(localStorage.getItem('equipath_db') || '{}');
    return db.users?.[id] || null;
  }};
}
