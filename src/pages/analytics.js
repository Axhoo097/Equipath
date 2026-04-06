// ============================================
// Employer Analytics Page — Sprint 11
// Rich insights dashboard for employers
// ============================================
import { getCurrentUser, getCurrentUserId } from '../services/auth.js';
import { getEmployerAnalytics, getUser } from '../services/db.js';
import { computeEmployerScore } from '../services/readiness.js';
import { navigate } from '../router.js';

// All features with their point values and descriptions
const ALL_FEATURES = [
  { key: 'wheelchair-ramp',         label: 'Wheelchair Ramp',         points: 10, icon: '♿', desc: 'Physical ramp access to the building' },
  { key: 'wheelchair-accessible',   label: 'Wheelchair Accessible',   points: 10, icon: '♿', desc: 'Full wheelchair accessible workspace' },
  { key: 'screen-reader-stations',  label: 'Screen Reader Stations',  points: 15, icon: '🖥️', desc: 'Dedicated workstations with screen readers pre-installed' },
  { key: 'assistive-tech',          label: 'Assistive Technology',    points: 15, icon: '🛠️', desc: 'Various assistive devices provided on request' },
  { key: 'sign-language-interpreter',label:'Sign Language Interpreter',points: 20, icon: '🤟', desc: 'Professional interpreters available for meetings' },
  { key: 'sign-language-support',   label: 'Sign Language Support',   points: 20, icon: '🤟', desc: 'Sign language support for communication' },
  { key: 'flexible-hours',          label: 'Flexible Hours',          points: 10, icon: '🕐', desc: 'Flexible start/end times to match personal needs' },
  { key: 'remote-option',           label: 'Remote Work Option',      points: 10, icon: '🏠', desc: 'Option to work fully or partially remote' },
  { key: 'quiet-workspace',         label: 'Quiet Workspace',         points: 5,  icon: '🔇', desc: 'Low-noise zones available for focus work' },
  { key: 'elevator-access',         label: 'Elevator Access',         points: 5,  icon: '🛗', desc: 'Elevator available for multi-story buildings' },
  { key: 'mental-health-support',   label: 'Mental Health Support',   points: 10, icon: '💚', desc: 'EAP programs and counseling access' },
  { key: 'disability-disclosure',   label: 'Safe Disclosure Policy',  points: 10, icon: '🛡️', desc: 'Formal policy protecting disability disclosure privacy' },
  { key: 'ergonomic-equipment',     label: 'Ergonomic Equipment',     points: 8,  icon: '💺', desc: 'Adjustable desks, chairs, and peripherals' },
  { key: 'captions-support',        label: 'Captions & Subtitles',    points: 8,  icon: '📝', desc: 'Auto-captions on video calls and training' },
];

export async function renderAnalytics(container) {
  const user = getCurrentUser();
  if (!user || user.role !== 'employer') { navigate('/dashboard'); return; }

  const userId = getCurrentUserId();

  // Loading state
  container.innerHTML = `
    <div class="container py-xl" style="text-align:center">
      <div style="font-size:3rem;margin-bottom:var(--space-4)">⏳</div>
      <p class="text-secondary">Loading your analytics…</p>
    </div>
  `;

  try {
    const analytics = await getEmployerAnalytics(userId);
    const score = computeEmployerScore(user);
    const features = user.accessibilityFeatures || [];
    const missing = ALL_FEATURES.filter(f => !features.includes(f.key));
    const present = ALL_FEATURES.filter(f => features.includes(f.key));

    // Sort missing by potential points (highest first)
    const sortedMissing = [...missing].sort((a, b) => b.points - a.points);

    // Potential score projections
    const top3Missing = sortedMissing.slice(0, 3);
    const projectedScore = Math.min(100, score + top3Missing.reduce((sum, f) => sum + f.points, 0));

    container.innerHTML = buildAnalyticsHTML(user, score, analytics, present, sortedMissing, projectedScore, top3Missing);
    attachAnalyticsEvents(container, user, userId, analytics, features);
  } catch (err) {
    container.innerHTML = `
      <div class="container page">
        <div class="card empty-state">
          <div class="empty-state-icon">⚠️</div>
          <h3>Could not load analytics</h3>
          <p>${err.message}</p>
          <a href="#/dashboard" class="btn btn-primary mt-4">← Back to Dashboard</a>
        </div>
      </div>
    `;
  }
}

function buildAnalyticsHTML(user, score, analytics, present, sortedMissing, projectedScore, top3Missing) {
  const { totalApps, shortlisted, jobStats, topSkills } = analytics;
  const conversionRate = totalApps > 0 ? Math.round((shortlisted / totalApps) * 100) : 0;
  const scoreColor = score >= 80 ? 'var(--color-success)' : score >= 60 ? 'var(--color-warning)' : 'var(--color-danger)';
  const scoreLabel = score >= 80 ? 'Excellent' : score >= 60 ? 'Good' : 'Needs Improvement';

  return `
    <div class="container py-xl" style="max-width:1100px">
      <!-- Header -->
      <header class="mb-lg" style="display:flex;align-items:flex-start;justify-content:space-between;flex-wrap:wrap;gap:var(--space-4)">
        <div>
          <h1>📊 Employer Analytics</h1>
          <p class="text-secondary">Insights to help you attract more inclusive talent and improve your accessibility score.</p>
        </div>
        <a href="#/dashboard" class="btn btn-ghost btn-sm">← Back to Dashboard</a>
      </header>

      <!-- Hero Score + KPIs -->
      <div style="display:grid;grid-template-columns:auto 1fr;gap:var(--space-6);margin-bottom:var(--space-8);flex-wrap:wrap" class="analytics-hero">
        <!-- Score Ring -->
        <div class="card" style="display:flex;flex-direction:column;align-items:center;justify-content:center;gap:var(--space-4);padding:var(--space-8);min-width:220px">
          <div style="position:relative;width:150px;height:150px">
            <svg viewBox="0 0 120 120" style="transform:rotate(-90deg);width:150px;height:150px" aria-hidden="true">
              <circle cx="60" cy="60" r="52" fill="none" stroke="var(--color-border)" stroke-width="12"/>
              <circle cx="60" cy="60" r="52" fill="none" stroke="${scoreColor}" stroke-width="12"
                stroke-dasharray="${Math.round(2 * Math.PI * 52)}"
                stroke-dashoffset="${Math.round(2 * Math.PI * 52 * (1 - score / 100))}"
                stroke-linecap="round"
                style="transition: stroke-dashoffset 1.2s ease"/>
            </svg>
            <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);text-align:center">
              <div style="font-size:2rem;font-weight:800;color:${scoreColor}">${score}</div>
              <div style="font-size:0.65rem;color:var(--color-text-secondary);text-transform:uppercase;letter-spacing:0.05em">/ 100</div>
            </div>
          </div>
          <div style="text-align:center">
            <div style="font-weight:700;color:${scoreColor}">${scoreLabel}</div>
            <div style="font-size:var(--font-size-sm);color:var(--color-text-secondary)">Accessibility Score</div>
          </div>
          ${projectedScore > score ? `
            <div style="background:rgba(99,102,241,0.12);border-radius:8px;padding:var(--space-2) var(--space-3);text-align:center;width:100%">
              <div style="font-size:var(--font-size-sm);color:var(--color-primary);font-weight:600">⬆ Could reach ${projectedScore}</div>
              <div style="font-size:var(--font-size-xs);color:var(--color-text-secondary)">with 3 improvements</div>
            </div>
          ` : ''}
        </div>

        <!-- KPI Cards Grid -->
        <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:var(--space-4)">
          <div class="card stat-card">
            <div class="stat-icon purple" aria-hidden="true">📋</div>
            <div>
              <div class="stat-value">${analytics.jobs.length}</div>
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
              <div class="stat-value">${shortlisted}</div>
              <div class="stat-label">Shortlisted</div>
            </div>
          </div>
          <div class="card stat-card">
            <div class="stat-icon blue" aria-hidden="true">📈</div>
            <div>
              <div class="stat-value">${conversionRate}%</div>
              <div class="stat-label">Shortlist Rate</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Two Column Layout -->
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-6);margin-bottom:var(--space-8)">
        <!-- Job Performance Chart -->
        <div class="card">
          <h2 style="margin-bottom:var(--space-4);font-size:var(--font-size-lg)">📋 Applications per Job</h2>
          ${jobStats.length > 0 ? `
            <div style="display:flex;flex-direction:column;gap:var(--space-3)">
              ${jobStats.map(({ job, appCount }, i) => {
                const maxApps = Math.max(...jobStats.map(s => s.appCount), 1);
                const pct = Math.round((appCount / maxApps) * 100);
                const colors = ['var(--color-primary)','var(--color-secondary)','var(--color-accent)','var(--color-success)','var(--color-warning)','var(--color-danger)'];
                const barColor = colors[i % colors.length];
                return `
                  <div>
                    <div style="display:flex;justify-content:space-between;margin-bottom:4px;font-size:var(--font-size-sm)">
                      <span style="font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:70%">${job.title}</span>
                      <span style="font-weight:700;color:${barColor}">${appCount}</span>
                    </div>
                    <div class="progress-bar" style="height:10px">
                      <div class="progress-bar-fill" 
                           style="width:${pct}%;background:${barColor};transition:width 0.8s ease"
                           role="progressbar" aria-valuenow="${appCount}" aria-valuemin="0" aria-valuemax="${maxApps}"
                           aria-label="${job.title}: ${appCount} applications"></div>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          ` : `<div class="empty-state"><div class="empty-state-icon">📋</div><p>No job listings yet.</p></div>`}
        </div>

        <!-- Top Required Skills -->
        <div class="card">
          <h2 style="margin-bottom:var(--space-4);font-size:var(--font-size-lg)">🔧 Most Required Skills</h2>
          ${analytics.topSkills.length > 0 ? `
            <div style="display:flex;flex-wrap:wrap;gap:var(--space-2);margin-bottom:var(--space-4)">
              ${analytics.topSkills.map(({ skill, count }, i) => {
                const size = i === 0 ? '1rem' : i < 3 ? '0.875rem' : '0.75rem';
                const opacity = 1 - (i / analytics.topSkills.length) * 0.4;
                return `<span class="tag" style="font-size:${size};opacity:${opacity};padding:var(--space-2) var(--space-3)">${skill} <strong>(${count})</strong></span>`;
              }).join('')}
            </div>
            <div style="font-size:var(--font-size-xs);color:var(--color-text-secondary)">Based on skills listed across all your job postings.</div>
          ` : `<div class="empty-state"><div class="empty-state-icon">🔧</div><p>Post jobs with required skills to see insights.</p></div>`}
        </div>
      </div>

      <!-- Accessibility Score Breakdown -->
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-6);margin-bottom:var(--space-8)">

        <!-- Current Features -->
        <div class="card">
          <h2 style="margin-bottom:var(--space-4);font-size:var(--font-size-lg)">✅ Active Accessibility Features</h2>
          ${present.length > 0 ? `
            <div style="display:flex;flex-direction:column;gap:var(--space-3)">
              ${present.map(f => `
                <div style="display:flex;align-items:center;gap:var(--space-3);padding:var(--space-2) 0;border-bottom:1px solid var(--color-border)">
                  <span style="font-size:1.3rem">${f.icon}</span>
                  <div style="flex:1">
                    <div style="font-size:var(--font-size-sm);font-weight:600">${f.label}</div>
                    <div style="font-size:var(--font-size-xs);color:var(--color-text-secondary)">${f.desc}</div>
                  </div>
                  <span class="tag tag-success" style="font-size:0.65rem;flex-shrink:0">+${f.points} pts</span>
                </div>
              `).join('')}
            </div>
          ` : `<p class="text-secondary">No accessibility features added yet.</p>`}
        </div>

        <!-- Score Booster Recommendations -->
        <div class="card" style="border-top:4px solid var(--color-primary)">
          <h2 style="margin-bottom:var(--space-2);font-size:var(--font-size-lg)">🚀 Score Booster Recommendations</h2>
          <p style="font-size:var(--font-size-sm);color:var(--color-text-secondary);margin-bottom:var(--space-4)">
            Add these features to attract more candidates and raise your score from <strong>${score}</strong> toward <strong>${projectedScore}+</strong>.
          </p>
          ${sortedMissing.length > 0 ? `
            <div style="display:flex;flex-direction:column;gap:var(--space-3)">
              ${sortedMissing.slice(0, 6).map((f, i) => `
                <div class="booster-item ${i < 3 ? 'booster-top' : ''}" 
                     style="display:flex;align-items:flex-start;gap:var(--space-3);padding:var(--space-3);border-radius:8px;background:${i < 3 ? 'rgba(99,102,241,0.08)' : 'transparent'};border:1px solid ${i < 3 ? 'var(--color-primary)' : 'var(--color-border)'}">
                  <span style="font-size:1.3rem;flex-shrink:0">${f.icon}</span>
                  <div style="flex:1">
                    <div style="font-size:var(--font-size-sm);font-weight:600;display:flex;align-items:center;gap:var(--space-2)">
                      ${f.label}
                      ${i < 3 ? '<span style="font-size:0.6rem;background:var(--color-primary);color:white;padding:1px 6px;border-radius:99px">TOP PICK</span>' : ''}
                    </div>
                    <div style="font-size:var(--font-size-xs);color:var(--color-text-secondary)">${f.desc}</div>
                  </div>
                  <div style="text-align:right;flex-shrink:0">
                    <div style="font-size:var(--font-size-sm);font-weight:700;color:var(--color-primary)">+${f.points}</div>
                    <div style="font-size:0.65rem;color:var(--color-text-secondary)">pts</div>
                  </div>
                </div>
              `).join('')}
            </div>
            <div style="margin-top:var(--space-4)">
              <a href="#/profile" class="btn btn-primary btn-sm" style="width:100%">Update Company Profile →</a>
            </div>
          ` : `
            <div style="text-align:center;padding:var(--space-6)">
              <div style="font-size:3rem;margin-bottom:var(--space-3)">🏆</div>
              <p style="font-weight:700;color:var(--color-success)">You've implemented all tracked features!</p>
            </div>
          `}
        </div>
      </div>

      <!-- Per-Job Applicant Details -->
      ${analytics.jobStats.some(s => s.appCount > 0) ? `
        <section style="margin-bottom:var(--space-8)">
          <h2 class="mb-4">👥 Applicant Breakdown by Job</h2>
          <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:var(--space-4)">
            ${analytics.jobStats.filter(s => s.appCount > 0).map(({ job, apps }) => {
              const shortlisted = apps.filter(a => a.status === 'shortlisted').length;
              const applied = apps.filter(a => a.status === 'applied').length;
              const rate = apps.length > 0 ? Math.round((shortlisted / apps.length) * 100) : 0;
              return `
                <div class="card" style="padding:var(--space-4)">
                  <div style="font-weight:700;font-size:var(--font-size-sm);margin-bottom:var(--space-2)">${job.title}</div>
                  <div style="font-size:var(--font-size-xs);color:var(--color-text-secondary);margin-bottom:var(--space-3)">${job.location}</div>
                  <div style="display:flex;gap:var(--space-3);margin-bottom:var(--space-3)">
                    <div style="text-align:center;flex:1;background:rgba(0,0,0,0.05);border-radius:6px;padding:var(--space-2)">
                      <div style="font-weight:700;font-size:var(--font-size-lg);color:var(--color-primary)">${apps.length}</div>
                      <div style="font-size:0.65rem;color:var(--color-text-secondary)">Total</div>
                    </div>
                    <div style="text-align:center;flex:1;background:rgba(0,0,0,0.05);border-radius:6px;padding:var(--space-2)">
                      <div style="font-weight:700;font-size:var(--font-size-lg);color:var(--color-warning)">${applied}</div>
                      <div style="font-size:0.65rem;color:var(--color-text-secondary)">Applied</div>
                    </div>
                    <div style="text-align:center;flex:1;background:rgba(0,0,0,0.05);border-radius:6px;padding:var(--space-2)">
                      <div style="font-weight:700;font-size:var(--font-size-lg);color:var(--color-success)">${shortlisted}</div>
                      <div style="font-size:0.65rem;color:var(--color-text-secondary)">Shortlisted</div>
                    </div>
                  </div>
                  <div style="font-size:var(--font-size-xs);color:var(--color-text-secondary)">
                    Shortlist rate: <strong>${rate}%</strong>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </section>
      ` : ''}

      <!-- Disability Inclusivity Insights -->
      <section class="card" style="margin-bottom:var(--space-8);border-top:4px solid var(--color-accent)">
        <h2 style="margin-bottom:var(--space-2)">🌍 Disability Inclusivity Insights</h2>
        <p style="font-size:var(--font-size-sm);color:var(--color-text-secondary);margin-bottom:var(--space-6)">
          How your current accessibility features map to different disability communities.
        </p>
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:var(--space-4)">
          ${getInclusivityInsights(user.accessibilityFeatures || []).map(ins => `
            <div style="padding:var(--space-4);border-radius:8px;background:${ins.supported ? 'rgba(16,185,129,0.08)' : 'rgba(0,0,0,0.04)'};border:1px solid ${ins.supported ? 'var(--color-success)' : 'var(--color-border)'}">
              <div style="font-size:1.5rem;margin-bottom:var(--space-2)">${ins.icon}</div>
              <div style="font-weight:600;font-size:var(--font-size-sm);margin-bottom:var(--space-1)">${ins.community}</div>
              <div style="font-size:var(--font-size-xs);color:var(--color-text-secondary);margin-bottom:var(--space-2)">${ins.desc}</div>
              ${ins.supported
                ? '<span class="tag tag-success" style="font-size:0.65rem">✓ Well Supported</span>'
                : '<span class="tag" style="font-size:0.65rem;opacity:0.7">⚡ Can Improve</span>'}
            </div>
          `).join('')}
        </div>
      </section>
    </div>
  `;
}

function getInclusivityInsights(features) {
  return [
    {
      community: 'Mobility Disabilities',
      icon: '♿',
      desc: 'Physical access, wheelchair & elevator support',
      supported: features.some(f => ['wheelchair-ramp','wheelchair-accessible','elevator-access','remote-option'].includes(f)),
    },
    {
      community: 'Visual Impairments',
      icon: '👁️',
      desc: 'Screen reader access, assistive tech',
      supported: features.some(f => ['screen-reader-stations','assistive-tech'].includes(f)),
    },
    {
      community: 'Deaf & Hard of Hearing',
      icon: '🤟',
      desc: 'Sign language interpreters and caption support',
      supported: features.some(f => ['sign-language-interpreter','sign-language-support','captions-support'].includes(f)),
    },
    {
      community: 'Neurodivergent',
      icon: '🧠',
      desc: 'Quiet spaces, flexible hours, low-sensory environments',
      supported: features.some(f => ['quiet-workspace','flexible-hours'].includes(f)),
    },
    {
      community: 'Mental Health',
      icon: '💚',
      desc: 'EAP programs and mental health resources',
      supported: features.some(f => ['mental-health-support'].includes(f)),
    },
    {
      community: 'Remote Workers',
      icon: '🏠',
      desc: 'Work-from-home options for maximum flexibility',
      supported: features.some(f => ['remote-option'].includes(f)),
    },
  ];
}

function attachAnalyticsEvents(container, user, userId, analytics, features) {
  // Any future interactive elements (e.g., export, share) can go here
}
