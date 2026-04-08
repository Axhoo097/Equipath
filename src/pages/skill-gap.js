// ============================================
// Skill Planner Page — Full Feature Build
// Tab layout: Overview · Analyze · Courses · Progress
// ============================================
import { getCurrentUser, getCurrentUserId } from '../services/auth.js';
import { getAllJobsSync } from '../services/db.js';
import { rankJobsForUser } from '../services/matching.js';
import {
  analyzeGaps,
  recommendResources,
  extractSkillsFromJD,
  loadProgress,
  saveProgress,
  getProgressStats,
} from '../services/skill-gap.js';
import { navigate } from '../router.js';

// ── Entry point ────────────────────────────────────────────────────
export function renderSkillGap(container) {
  const user = getCurrentUser();
  if (!user || user.role !== 'jobseeker') {
    navigate('/login');
    return;
  }

  injectStyles();
  container.innerHTML = buildShell();
  initTabs(container, user);
  // Default to Overview
  activateTab(container, 'overview', user);
}

// ── Shell HTML ──────────────────────────────────────────────────────
function buildShell() {
  return `
  <div class="sp-page">
    <!-- Hero Header -->
    <div class="sp-hero">
      <div class="container">
        <div class="sp-hero-inner">
          <div>
            <div class="sp-badge">🎯 Skill Planner</div>
            <h1 class="sp-title">Your Career Growth Navigator</h1>
            <p class="sp-subtitle">Identify skill gaps, calculate job match scores, get personalized course recommendations, and track your progress.</p>
          </div>
          <div class="sp-hero-stats" id="sp-hero-stats">
            <!-- populated dynamically -->
          </div>
        </div>

        <!-- Tab nav -->
        <nav class="sp-tabs" role="tablist" aria-label="Skill Planner sections">
          <button class="sp-tab active" role="tab" data-tab="overview" aria-selected="true" id="tab-overview">
            <span class="sp-tab-icon">📊</span> Overview
          </button>
          <button class="sp-tab" role="tab" data-tab="analyze" aria-selected="false" id="tab-analyze">
            <span class="sp-tab-icon">🔍</span> Analyze
          </button>
          <button class="sp-tab" role="tab" data-tab="courses" aria-selected="false" id="tab-courses">
            <span class="sp-tab-icon">📚</span> Courses
          </button>
          <button class="sp-tab" role="tab" data-tab="progress" aria-selected="false" id="tab-progress">
            <span class="sp-tab-icon">✅</span> Progress
          </button>
        </nav>
      </div>
    </div>

    <!-- Tab content -->
    <div class="container sp-content-wrap">
      <div id="sp-panel" role="tabpanel" class="sp-panel" aria-live="polite">
        <!-- Tab content injected here -->
      </div>
    </div>
  </div>`;
}

// ── Tab routing ──────────────────────────────────────────────────────
function initTabs(container, user) {
  container.querySelectorAll('.sp-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      container.querySelectorAll('.sp-tab').forEach(b => {
        b.classList.remove('active');
        b.setAttribute('aria-selected', 'false');
      });
      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');
      activateTab(container, btn.dataset.tab, user);
    });
  });
}

function activateTab(container, tabId, user) {
  const panel = container.querySelector('#sp-panel');
  const heroStats = container.querySelector('#sp-hero-stats');

  // Refresh hero stats
  heroStats.innerHTML = buildHeroStats(user);

  panel.innerHTML = '';
  panel.style.animation = 'none';
  requestAnimationFrame(() => {
    panel.style.animation = '';
    switch (tabId) {
      case 'overview': renderOverview(panel, user); break;
      case 'analyze':  renderAnalyze(panel, user);  break;
      case 'courses':  renderCourses(panel, user);  break;
      case 'progress': renderProgress(panel, user);  break;
    }
  });
}

// ── Hero Stats ────────────────────────────────────────────────────────
function buildHeroStats(user) {
  const userId = getCurrentUserId();
  const jobs = getAllJobsSync();
  const top = rankJobsForUser(user, jobs)[0];
  const topMatch = top ? top.matchScore : 0;

  const stats = getProgressStats(userId);
  const userSkillCount = (user.skills || []).length;

  return `
    <div class="sp-hero-stat-grid">
      <div class="sp-hero-stat">
        <div class="sp-stat-num">${userSkillCount}</div>
        <div class="sp-stat-label">Your Skills</div>
      </div>
      <div class="sp-hero-stat">
        <div class="sp-stat-num sp-stat-match">${topMatch}%</div>
        <div class="sp-stat-label">Top Job Match</div>
      </div>
      <div class="sp-hero-stat">
        <div class="sp-stat-num sp-stat-done">${stats.completed}</div>
        <div class="sp-stat-label">Skills Mastered</div>
      </div>
      <div class="sp-hero-stat">
        <div class="sp-stat-num sp-stat-wip">${stats.inProgress}</div>
        <div class="sp-stat-label">In Progress</div>
      </div>
    </div>`;
}

// ═══════════════════════════════════════════════════════════════════
// TAB 1: OVERVIEW — Top job matches with skill analysis per job
// ═══════════════════════════════════════════════════════════════════
function renderOverview(panel, user) {
  const jobs = getAllJobsSync();
  const ranked = rankJobsForUser(user, jobs).slice(0, 5);

  if (ranked.length === 0) {
    panel.innerHTML = `<div class="sp-empty"><div class="sp-empty-icon">🔍</div><h3>No Jobs Found</h3><p>Post or browse jobs first.</p></div>`;
    return;
  }

  panel.innerHTML = `
    <div class="sp-section-header">
      <h2 class="sp-section-title">Top Job Matches & Skill Gaps</h2>
      <p class="sp-section-sub">Your top 5 recommended jobs with detailed skill breakdowns</p>
    </div>
    <div class="sp-job-list">
      ${ranked.map((item, i) => buildJobCard(item, user, i)).join('')}
    </div>`;

  // Animate progress bars
  animateBars(panel);
}

function buildJobCard({ job, matchScore, skillScore }, user, index) {
  const { matched, partial, missing, matchPct } = analyzeGaps(user.skills || [], job.requiredSkills || []);
  const matchClass = matchPct >= 75 ? 'high' : matchPct >= 45 ? 'medium' : 'low';
  const matchColor = matchPct >= 75 ? 'var(--color-success)' : matchPct >= 45 ? 'var(--color-warning)' : 'var(--color-error)';

  const skillTags = (arr, cls, label) => arr.length
    ? `<div class="sp-skill-group"><span class="sp-skill-label">${label}</span><div class="sp-skill-tags">${arr.map(s => `<span class="sp-tag sp-tag-${cls}">${s}</span>`).join('')}</div></div>`
    : '';

  return `
  <div class="sp-job-card" style="animation-delay: ${index * 80}ms">
    <div class="sp-job-header">
      <div class="sp-job-info">
        <span class="sp-job-rank">#${index + 1}</span>
        <div>
          <h3 class="sp-job-title">${job.title}</h3>
          <p class="sp-job-meta">
            ${job.location} · ${job.salaryRange || 'Salary not listed'}
            ${job.isRemote ? '<span class="sp-remote-badge">🌐 Remote</span>' : ''}
          </p>
        </div>
      </div>
      <div class="sp-match-ring" style="--pct:${matchPct}; --clr:${matchColor}" aria-label="${matchPct}% skill match">
        <svg class="sp-ring-svg" viewBox="0 0 64 64" aria-hidden="true">
          <circle class="sp-ring-bg" cx="32" cy="32" r="26"/>
          <circle class="sp-ring-fill" cx="32" cy="32" r="26"
            stroke="${matchColor}"
            stroke-dasharray="${Math.round(2 * Math.PI * 26 * matchPct / 100)} ${Math.round(2 * Math.PI * 26)}"
            transform="rotate(-90 32 32)"/>
        </svg>
        <span class="sp-ring-label">${matchPct}%</span>
      </div>
    </div>

    <!-- Skill match bar -->
    <div class="sp-match-bar-row">
      <span class="sp-match-bar-label">Skill Match</span>
      <div class="progress-bar" style="flex:1">
        <div class="progress-bar-fill sp-bar-anim" data-width="${matchPct}" style="background:${matchColor};width:0%"></div>
      </div>
      <span class="sp-match-bar-pct">${matchPct}%</span>
    </div>

    <!-- Skill pills -->
    <div class="sp-skills-breakdown">
      ${skillTags(matched, 'match', '✅ You have')}
      ${skillTags(partial.map(p => p.skill), 'partial', '⚡ Partial')}
      ${skillTags(missing, 'gap', '❌ Missing')}
    </div>

    ${missing.length > 0 ? `
    <div class="sp-job-footer">
      <a href="#/skill-map" class="btn btn-sm btn-primary" 
         onclick="document.querySelector('[data-tab=courses]')?.click()" 
         style="pointer-events:auto">
        📚 View Courses for Missing Skills
      </a>
    </div>` : `
    <div class="sp-job-footer">
      <span class="sp-perfect-match">🎉 You have all required skills for this job!</span>
    </div>`}
  </div>`;
}

// ═══════════════════════════════════════════════════════════════════
// TAB 2: ANALYZE — Custom skill vs. job requirement comparison
// ═══════════════════════════════════════════════════════════════════
function renderAnalyze(panel, user) {
  const jobs = getAllJobsSync();
  const userSkillsList = (user.skills || []).join(', ');

  panel.innerHTML = `
    <div class="sp-section-header">
      <h2 class="sp-section-title">Custom Gap Analysis</h2>
      <p class="sp-section-sub">Enter your skills and paste a job description or select a job to get an instant analysis</p>
    </div>

    <div class="sp-analyze-grid">
      <!-- Left: Inputs -->
      <div class="sp-analyze-inputs">
        <div class="sp-card">
          <h3 class="sp-card-title">🧑 Your Skills</h3>
          <p class="text-secondary" style="font-size:0.85rem;margin-bottom:0.75rem">From your profile. Add comma-separated skills below to test additional ones.</p>
          <div class="sp-profile-skills">
            ${(user.skills || []).map(s => `<span class="sp-tag sp-tag-match">${s}</span>`).join('') || '<em class="text-muted">No skills on profile yet</em>'}
          </div>
          <div class="form-group" style="margin-top:1rem">
            <label class="form-label" for="extra-skills">Add extra skills (comma-separated)</label>
            <input type="text" id="extra-skills" class="form-input" 
              placeholder="e.g. typescript, docker, agile"
              value="${userSkillsList}" />
          </div>
        </div>

        <div class="sp-card" style="margin-top:1rem">
          <h3 class="sp-card-title">💼 Job / Target Role</h3>
          <div class="form-group">
            <label class="form-label" for="job-select">Select from existing jobs</label>
            <select id="job-select" class="form-select">
              <option value="">— Choose a job —</option>
              ${jobs.map(j => `<option value="${j.id}">${j.title} (${j.location})</option>`).join('')}
            </select>
          </div>
          <div style="text-align:center;color:var(--color-text-muted);margin:0.5rem 0;font-size:0.8rem">— or —</div>
          <div class="form-group">
            <label class="form-label" for="jd-text">Paste a job description</label>
            <textarea id="jd-text" class="form-textarea" rows="5" 
              placeholder="Paste the full job description here. We'll auto-extract the required skills…"></textarea>
          </div>
          <div class="form-group">
            <label class="form-label" for="manual-skills">Or enter required skills manually</label>
            <input type="text" id="manual-skills" class="form-input"
              placeholder="e.g. python, sql, tableau, statistics" />
          </div>
          <button id="run-analysis" class="btn btn-primary w-full">
            🔍 Run Analysis
          </button>
        </div>
      </div>

      <!-- Right: Results -->
      <div id="analyze-results" class="sp-analyze-results">
        <div class="sp-empty" style="min-height:300px">
          <div class="sp-empty-icon">⚙️</div>
          <h3>Results appear here</h3>
          <p>Configure your skills and target role, then hit <strong>Run Analysis</strong>.</p>
        </div>
      </div>
    </div>`;

  // Bind job selector → populate manual skills
  const jobSelect = panel.querySelector('#job-select');
  const manualSkills = panel.querySelector('#manual-skills');
  jobSelect.addEventListener('change', () => {
    const job = jobs.find(j => j.id === jobSelect.value);
    if (job) {
      manualSkills.value = (job.requiredSkills || []).join(', ');
      panel.querySelector('#jd-text').value = '';
    }
  });

  // Auto-extract from JD
  panel.querySelector('#jd-text').addEventListener('input', (e) => {
    const extracted = extractSkillsFromJD(e.target.value);
    if (extracted.length > 0) manualSkills.value = extracted.join(', ');
  });

  // Run analysis
  panel.querySelector('#run-analysis').addEventListener('click', () => {
    const extraRaw = panel.querySelector('#extra-skills').value;
    const skillsRaw = panel.querySelector('#manual-skills').value;

    const userSkills = [...(user.skills || []), ...extraRaw.split(',').map(s => s.trim()).filter(Boolean)];
    const jobSkills  = skillsRaw.split(',').map(s => s.trim()).filter(Boolean);

    if (userSkills.length === 0) { showAnalysisError(panel, 'Please enter at least one skill.'); return; }
    if (jobSkills.length === 0)  { showAnalysisError(panel, 'Please enter at least one required skill.'); return; }

    const result = analyzeGaps(userSkills, jobSkills);
    renderAnalysisResult(panel.querySelector('#analyze-results'), result, jobSkills, userSkills);
  });
}

function showAnalysisError(panel, msg) {
  const el = panel.querySelector('#analyze-results');
  el.innerHTML = `<div class="sp-empty"><div class="sp-empty-icon">⚠️</div><p style="color:var(--color-error)">${msg}</p></div>`;
}

function renderAnalysisResult(el, result, jobSkills, userSkills) {
  const { matched, partial, missing, matchPct } = result;
  const matchColor = matchPct >= 75 ? 'var(--color-success)' : matchPct >= 45 ? 'var(--color-warning)' : 'var(--color-error)';

  const recs = recommendResources(missing, partial);

  el.innerHTML = `
    <div class="sp-result-card">
      <!-- Score ring -->
      <div class="sp-result-score-wrap">
        <div class="sp-big-ring" aria-label="${matchPct}% match">
          <svg viewBox="0 0 120 120" class="sp-big-ring-svg">
            <circle cx="60" cy="60" r="52" class="sp-ring-bg-lg"/>
            <circle cx="60" cy="60" r="52" class="sp-ring-fill-lg"
              stroke="${matchColor}"
              stroke-dasharray="${Math.round(2 * Math.PI * 52 * matchPct / 100)} ${Math.round(2 * Math.PI * 52)}"
              transform="rotate(-90 60 60)"/>
          </svg>
          <div class="sp-big-ring-label">
            <span class="sp-big-pct" style="color:${matchColor}">${matchPct}%</span>
            <span class="sp-big-sublabel">Match</span>
          </div>
        </div>
        <div class="sp-result-meta">
          <div class="sp-result-meta-row"><span class="sp-tag sp-tag-match">✅ ${matched.length} matched</span></div>
          <div class="sp-result-meta-row"><span class="sp-tag sp-tag-partial">⚡ ${partial.length} partial</span></div>
          <div class="sp-result-meta-row"><span class="sp-tag sp-tag-gap">❌ ${missing.length} missing</span></div>
        </div>
      </div>

      <!-- Skill breakdown rows -->
      <div class="sp-breakdown-list">
        ${jobSkills.map(skill => {
          const m = matched.find(s => s.toLowerCase() === skill.toLowerCase());
          const p = partial.find(p => p.skill.toLowerCase() === skill.toLowerCase());
          const isMiss = missing.find(s => s.toLowerCase() === skill.toLowerCase());
          let icon = '❌', cls = 'gap', label = 'Missing';
          if (m) { icon = '✅'; cls = 'match'; label = 'You have this'; }
          else if (p) { icon = '⚡'; cls = 'partial'; label = `Partial (${Math.round(p.score * 100)}%)`; }
          return `
            <div class="sp-breakdown-row">
              <span class="sp-bd-icon">${icon}</span>
              <span class="sp-bd-skill">${skill}</span>
              <span class="sp-tag sp-tag-${cls} sp-bd-label">${label}</span>
            </div>`;
        }).join('')}
      </div>

      ${recs.length > 0 ? `
      <div class="sp-result-recs">
        <h4 class="sp-result-recs-title">🎯 Next Steps — Quick Wins</h4>
        ${recs.slice(0, 3).map(rec => `
          <div class="sp-quick-course">
            <span class="sp-qc-skill ${rec.priority === 'high' ? 'sp-tag-gap' : 'sp-tag-partial'}">${rec.skill}</span>
            <a href="${rec.resources[0].url}" target="_blank" rel="noopener" class="sp-qc-link btn btn-sm btn-secondary">
              ${rec.resources[0].title} →
            </a>
          </div>`).join('')}
        <p class="sp-result-tip text-muted">Switch to the <strong>Courses</strong> tab for the full learning path.</p>
      </div>` : `
      <div class="sp-result-recs sp-perfect">
        🎉 <strong>Excellent!</strong> You meet all required skills for this role!
      </div>`}
    </div>`;
}

// ═══════════════════════════════════════════════════════════════════
// TAB 3: COURSES — Personalized learning roadmap
// ═══════════════════════════════════════════════════════════════════
function renderCourses(panel, user) {
  const userId = getCurrentUserId();
  const jobs = getAllJobsSync();
  const ranked = rankJobsForUser(user, jobs).slice(0, 3);

  let allMissing = new Set();
  let allPartial = [];
  const partialSet = new Set();

  ranked.forEach(({ job }) => {
    const { missing, partial } = analyzeGaps(user.skills || [], job.requiredSkills || []);
    missing.forEach(s => allMissing.add(s));
    partial.forEach(p => {
      if (!partialSet.has(p.skill)) { allPartial.push(p); partialSet.add(p.skill); }
    });
  });

  const missingArr = Array.from(allMissing);
  const recs = recommendResources(missingArr, allPartial);
  const progress = loadProgress(userId);

  if (recs.length === 0) {
    panel.innerHTML = `
      <div class="sp-empty">
        <div class="sp-empty-icon">🎉</div>
        <h3>You're fully qualified!</h3>
        <p>Your skills perfectly cover the top recommended jobs. Explore more jobs or update your profile.</p>
        <a href="#/jobs" class="btn btn-primary">Browse Jobs</a>
      </div>`;
    return;
  }

  panel.innerHTML = `
    <div class="sp-section-header">
      <h2 class="sp-section-title">Personalized Learning Roadmap</h2>
      <p class="sp-section-sub">
        Based on your top <strong>${ranked.length}</strong> job matches — 
        <strong>${missingArr.length}</strong> skills to learn, 
        <strong>${allPartial.length}</strong> to strengthen
      </p>
    </div>

    <!-- Priority legend -->
    <div class="sp-legend">
      <span class="sp-tag sp-tag-gap">🔴 High Priority — Missing</span>
      <span class="sp-tag sp-tag-partial">🟡 Medium Priority — Partially there</span>
    </div>

    <!-- Course cards grid -->
    <div class="sp-course-grid">
      ${recs.map((rec, i) => buildCourseCard(rec, i, progress)).join('')}
    </div>`;

  // Progress button handlers
  panel.querySelectorAll('.sp-progress-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const { skill, status } = btn.dataset;
      saveProgress(userId, skill, status);
      renderCourses(panel, user); // re-render
    });
  });
}

function buildCourseCard(rec, index, progress) {
  const key = rec.skill.toLowerCase().replace(/\s+/g, '-');
  const prog = progress[key] || { status: 'not_started' };
  const statusLabels = { not_started: 'Not Started', in_progress: 'In Progress', completed: 'Completed' };
  const statusColors = { not_started: 'var(--color-text-muted)', in_progress: 'var(--color-warning)', completed: 'var(--color-success)' };
  const statusIcons  = { not_started: '○', in_progress: '◑', completed: '●' };

  const typeIcon = { free: '🆓', paid: '💰' };

  return `
  <div class="sp-course-card" style="animation-delay:${index * 60}ms">
    <div class="sp-course-header">
      <div class="sp-course-title-row">
        <span class="sp-tag ${rec.priority === 'high' ? 'sp-tag-gap' : 'sp-tag-partial'}">${rec.priority === 'high' ? '🔴 High' : '🟡 Medium'}</span>
        <span class="sp-course-status-dot" style="color:${statusColors[prog.status]}" title="${statusLabels[prog.status]}">
          ${statusIcons[prog.status]} ${statusLabels[prog.status]}
        </span>
      </div>
      <h3 class="sp-course-skill" style="text-transform:capitalize">${rec.skill}</h3>
    </div>

    <div class="sp-course-resources">
      ${rec.resources.slice(0, 3).map(res => `
        <a href="${res.url}" target="_blank" rel="noopener noreferrer" class="sp-resource-link">
          <span class="sp-resource-icon">${typeIcon[res.type] || '📖'}</span>
          <div class="sp-resource-info">
            <span class="sp-resource-name">${res.title}</span>
            ${res.duration ? `<span class="sp-resource-duration">${res.duration}</span>` : ''}
          </div>
          <span class="sp-resource-arrow">→</span>
        </a>`).join('')}
    </div>

    <!-- Progress controls -->
    <div class="sp-course-actions">
      <span class="sp-actions-label">Mark as:</span>
      <button class="sp-progress-btn ${prog.status === 'in_progress' ? 'active' : ''}" 
        data-skill="${rec.skill}" data-status="in_progress" 
        title="Mark In Progress">◑ Learning</button>
      <button class="sp-progress-btn sp-progress-done ${prog.status === 'completed' ? 'active' : ''}" 
        data-skill="${rec.skill}" data-status="completed"
        title="Mark Complete">✅ Done</button>
    </div>
  </div>`;
}

// ═══════════════════════════════════════════════════════════════════
// TAB 4: PROGRESS — Dashboard with charts & streak
// ═══════════════════════════════════════════════════════════════════
function renderProgress(panel, user) {
  const userId = getCurrentUserId();
  const allProgress = loadProgress(userId);
  const stats = getProgressStats(userId);
  const entries = Object.values(allProgress);

  const completed  = entries.filter(e => e.status === 'completed');
  const inProgress = entries.filter(e => e.status === 'in_progress');
  const notStarted = entries.filter(e => e.status === 'not_started');

  const circumference = Math.round(2 * Math.PI * 45);
  const dashOffset = Math.round(circumference * (1 - stats.pct / 100));

  panel.innerHTML = `
    <div class="sp-section-header">
      <h2 class="sp-section-title">Progress Dashboard</h2>
      <p class="sp-section-sub">Track your skill development journey</p>
    </div>

    ${entries.length === 0 ? `
    <div class="sp-empty">
      <div class="sp-empty-icon">📈</div>
      <h3>No Progress Yet</h3>
      <p>Head to the <strong>Courses</strong> tab and start marking skills as "Learning" or "Done".</p>
      <button class="btn btn-primary" onclick="document.querySelector('[data-tab=courses]')?.click()">Go to Courses</button>
    </div>` : `

    <!-- Summary KPI cards -->
    <div class="sp-kpi-grid">
      <div class="sp-kpi-card">
        <div class="sp-kpi-donut" aria-label="${stats.pct}% overall completion">
          <svg viewBox="0 0 100 100" class="sp-donut-svg">
            <circle cx="50" cy="50" r="45" class="sp-donut-bg"/>
            <circle cx="50" cy="50" r="45" class="sp-donut-fill"
              stroke-dasharray="${circumference}"
              stroke-dashoffset="${dashOffset}"
              transform="rotate(-90 50 50)"/>
          </svg>
          <div class="sp-donut-label">
            <span class="sp-donut-pct">${stats.pct}%</span>
            <span class="sp-donut-sub">Complete</span>
          </div>
        </div>
        <div class="sp-kpi-info">
          <h4>Overall Progress</h4>
          <p>${stats.completed} of ${stats.total} skills mastered</p>
        </div>
      </div>

      <div class="sp-kpi-card sp-kpi-done">
        <div class="sp-kpi-icon">✅</div>
        <div class="sp-kpi-info">
          <div class="sp-kpi-num">${stats.completed}</div>
          <div class="sp-kpi-label">Completed</div>
        </div>
      </div>
      <div class="sp-kpi-card sp-kpi-wip">
        <div class="sp-kpi-icon">◑</div>
        <div class="sp-kpi-info">
          <div class="sp-kpi-num">${stats.inProgress}</div>
          <div class="sp-kpi-label">In Progress</div>
        </div>
      </div>
      <div class="sp-kpi-card sp-kpi-todo">
        <div class="sp-kpi-icon">○</div>
        <div class="sp-kpi-info">
          <div class="sp-kpi-num">${stats.notStarted}</div>
          <div class="sp-kpi-label">Not Started</div>
        </div>
      </div>
    </div>

    <!-- Bar chart: skills breakdown -->
    ${buildBarChart(stats)}

    <!-- Skill lists -->
    <div class="sp-progress-lists">
      ${completed.length > 0 ? `
      <div class="sp-progress-group">
        <h3 class="sp-pg-title sp-pg-done">✅ Completed Skills</h3>
        <div class="sp-pg-items">
          ${completed.map(e => buildProgressItem(e, userId, panel, user)).join('')}
        </div>
      </div>` : ''}

      ${inProgress.length > 0 ? `
      <div class="sp-progress-group">
        <h3 class="sp-pg-title sp-pg-wip">◑ Currently Learning</h3>
        <div class="sp-pg-items">
          ${inProgress.map(e => buildProgressItem(e, userId, panel, user)).join('')}
        </div>
      </div>` : ''}

      ${notStarted.length > 0 ? `
      <div class="sp-progress-group">
        <h3 class="sp-pg-title sp-pg-todo">○ Not Started</h3>
        <div class="sp-pg-items">
          ${notStarted.map(e => buildProgressItem(e, userId, panel, user)).join('')}
        </div>
      </div>` : ''}
    </div>`}`;

  // Bind status change dropdowns
  panel.querySelectorAll('.sp-status-select').forEach(sel => {
    sel.addEventListener('change', () => {
      saveProgress(userId, sel.dataset.skill, sel.value);
      renderProgress(panel, user);
    });
  });
}

function buildBarChart(stats) {
  const total = stats.total || 1;
  const doneW    = Math.round((stats.completed  / total) * 100);
  const wipW     = Math.round((stats.inProgress / total) * 100);
  const todoW    = Math.round((stats.notStarted / total) * 100);

  return `
    <div class="sp-bar-chart-card">
      <h4 class="sp-bar-title">Skill Status Breakdown</h4>
      <div class="sp-stacked-bar" role="img" aria-label="Skill status bar: ${doneW}% done, ${wipW}% in progress, ${todoW}% not started">
        ${doneW > 0  ? `<div class="sp-seg sp-seg-done"  style="width:${doneW}%"  title="Completed: ${stats.completed}"></div>`  : ''}
        ${wipW  > 0  ? `<div class="sp-seg sp-seg-wip"   style="width:${wipW}%"   title="In Progress: ${stats.inProgress}"></div>` : ''}
        ${todoW > 0  ? `<div class="sp-seg sp-seg-todo"  style="width:${todoW}%"  title="Not Started: ${stats.notStarted}"></div>` : ''}
      </div>
      <div class="sp-bar-legend">
        <span><span class="sp-legend-dot" style="background:var(--color-success)"></span>Done ${doneW}%</span>
        <span><span class="sp-legend-dot" style="background:var(--color-warning)"></span>Learning ${wipW}%</span>
        <span><span class="sp-legend-dot" style="background:var(--color-border-strong)"></span>Queued ${todoW}%</span>
      </div>
    </div>`;
}

function buildProgressItem(entry, userId, panel, user) {
  const date = entry.completedAt
    ? `Completed ${new Date(entry.completedAt).toLocaleDateString()}`
    : entry.updatedAt
      ? `Updated ${new Date(entry.updatedAt).toLocaleDateString()}`
      : '';

  const statusIcons = { not_started: '○', in_progress: '◑', completed: '✅' };

  return `
    <div class="sp-pi-row">
      <span class="sp-pi-icon">${statusIcons[entry.status] || '○'}</span>
      <div class="sp-pi-info">
        <span class="sp-pi-skill">${entry.skill}</span>
        ${date ? `<span class="sp-pi-date text-muted">${date}</span>` : ''}
      </div>
      <select class="sp-status-select" data-skill="${entry.skill}" aria-label="Change status for ${entry.skill}">
        <option value="not_started"  ${entry.status === 'not_started'  ? 'selected' : ''}>○ Not Started</option>
        <option value="in_progress"  ${entry.status === 'in_progress'  ? 'selected' : ''}>◑ In Progress</option>
        <option value="completed"    ${entry.status === 'completed'    ? 'selected' : ''}>✅ Completed</option>
      </select>
    </div>`;
}

// ── Utilities ──────────────────────────────────────────────────────
function animateBars(panel) {
  requestAnimationFrame(() => {
    panel.querySelectorAll('.sp-bar-anim').forEach(bar => {
      const w = bar.dataset.width;
      setTimeout(() => { bar.style.width = w + '%'; }, 100);
    });
  });
}

// ═══════════════════════════════════════════════════════════════════
// Scoped Styles
// ═══════════════════════════════════════════════════════════════════
function injectStyles() {
  if (document.getElementById('sp-styles')) return;
  const style = document.createElement('style');
  style.id = 'sp-styles';
  style.textContent = `
/* ── Skill Planner Scoped Styles ── */
.sp-page { min-height: 100vh; }

/* Hero */
.sp-hero {
  background: var(--gradient-hero);
  padding: 2.5rem 0 0;
  color: #fff;
}
.sp-hero-inner {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 2rem;
  flex-wrap: wrap;
  margin-bottom: 2rem;
}
.sp-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  background: rgba(255,255,255,0.15);
  border: 1px solid rgba(255,255,255,0.25);
  backdrop-filter: blur(8px);
  border-radius: 999px;
  padding: 0.3rem 0.9rem;
  font-size: 0.8rem;
  font-weight: 600;
  margin-bottom: 0.75rem;
  color: #c7d2fe;
}
.sp-title {
  font-size: clamp(1.6rem, 4vw, 2.4rem);
  font-weight: 800;
  line-height: 1.2;
  margin-bottom: 0.5rem;
  color: #fff;
}
.sp-subtitle {
  color: #a5b4fc;
  font-size: 1rem;
  max-width: 520px;
  line-height: 1.6;
}

/* Hero stats */
.sp-hero-stat-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
  background: rgba(255,255,255,0.08);
  border: 1px solid rgba(255,255,255,0.15);
  border-radius: 1rem;
  padding: 1.25rem 1.5rem;
  min-width: 300px;
  backdrop-filter: blur(12px);
}
.sp-hero-stat { text-align: center; }
.sp-stat-num {
  font-size: 2rem;
  font-weight: 800;
  color: #fff;
  line-height: 1;
}
.sp-stat-match { color: #6ee7b7; }
.sp-stat-done  { color: #a3e635; }
.sp-stat-wip   { color: #fbbf24; }
.sp-stat-label { font-size: 0.72rem; color: #a5b4fc; margin-top: 0.25rem; }

/* Tabs */
.sp-tabs {
  display: flex;
  gap: 0.25rem;
  margin-top: 1.5rem;
  border-bottom: none;
  overflow-x: auto;
}
.sp-tab {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.65rem 1.25rem;
  background: rgba(255,255,255,0.08);
  border: 1px solid rgba(255,255,255,0.1);
  border-bottom: none;
  border-radius: 0.5rem 0.5rem 0 0;
  color: rgba(255,255,255,0.7);
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 200ms ease;
  white-space: nowrap;
}
.sp-tab:hover { background: rgba(255,255,255,0.15); color: #fff; }
.sp-tab.active {
  background: var(--color-bg);
  color: var(--color-primary);
  border-color: transparent;
}
.sp-tab-icon { font-size: 1rem; }

/* Content */
.sp-content-wrap { padding-top: 2rem; padding-bottom: 4rem; }
.sp-panel { animation: fadeIn 250ms ease; }

/* Section header */
.sp-section-header { margin-bottom: 1.75rem; }
.sp-section-title { font-size: 1.5rem; font-weight: 700; margin-bottom: 0.35rem; }
.sp-section-sub { color: var(--color-text-secondary); font-size: 0.95rem; }

/* Job Cards */
.sp-job-list { display: grid; gap: 1.25rem; }
.sp-job-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 1rem;
  padding: 1.5rem;
  box-shadow: var(--shadow-sm);
  animation: slideUp 300ms ease both;
  transition: box-shadow 200ms, transform 200ms;
}
.sp-job-card:hover { box-shadow: var(--shadow-lg); transform: translateY(-2px); }
.sp-job-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
  margin-bottom: 1rem;
}
.sp-job-info { display: flex; align-items: flex-start; gap: 0.75rem; }
.sp-job-rank {
  background: var(--gradient-primary);
  color: #fff;
  font-weight: 800;
  font-size: 0.8rem;
  padding: 0.25rem 0.5rem;
  border-radius: 0.4rem;
  min-width: 2rem;
  text-align: center;
  margin-top: 0.1rem;
  flex-shrink: 0;
}
.sp-job-title { font-size: 1.1rem; font-weight: 700; margin-bottom: 0.2rem; }
.sp-job-meta { color: var(--color-text-secondary); font-size: 0.85rem; display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; }
.sp-remote-badge {
  background: #d1fae5;
  color: #065f46;
  padding: 0.1rem 0.4rem;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 600;
}

/* Match Ring (small) */
.sp-match-ring { position: relative; width: 64px; height: 64px; flex-shrink: 0; }
.sp-ring-svg { width: 64px; height: 64px; }
.sp-ring-bg { fill: none; stroke: var(--color-border); stroke-width: 6; }
.sp-ring-fill { fill: none; stroke-width: 6; stroke-linecap: round; }
.sp-ring-label {
  position: absolute; inset: 0;
  display: flex; align-items: center; justify-content: center;
  font-size: 0.75rem; font-weight: 800;
}

/* Bar */
.sp-match-bar-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
}
.sp-match-bar-label { font-size: 0.8rem; font-weight: 600; color: var(--color-text-secondary); flex-shrink: 0; }
.sp-match-bar-pct { font-size: 0.8rem; font-weight: 700; flex-shrink: 0; min-width: 2.5rem; text-align: right; }
.sp-bar-anim { transition: width 0.8s cubic-bezier(0.25, 1, 0.5, 1); }

/* Skills breakdown */
.sp-skills-breakdown { display: flex; flex-direction: column; gap: 0.6rem; margin-bottom: 1rem; }
.sp-skill-group { display: flex; align-items: flex-start; gap: 0.6rem; flex-wrap: wrap; }
.sp-skill-label { font-size: 0.75rem; font-weight: 600; color: var(--color-text-muted); min-width: 80px; padding-top: 0.15rem; flex-shrink: 0; }
.sp-skill-tags { display: flex; flex-wrap: wrap; gap: 0.35rem; }

/* Tags */
.sp-tag {
  display: inline-flex; align-items: center;
  padding: 0.2rem 0.6rem;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 600;
}
.sp-tag-match   { background: #d1fae5; color: #065f46; }
.sp-tag-partial { background: #fef3c7; color: #92400e; }
.sp-tag-gap     { background: #fee2e2; color: #991b1b; }

.sp-job-footer { display: flex; align-items: center; gap: 1rem; padding-top: 0.75rem; border-top: 1px solid var(--color-border); flex-wrap: wrap; }
.sp-perfect-match { color: var(--color-success); font-weight: 600; font-size: 0.9rem; }

/* ── Analyze Tab ── */
.sp-analyze-grid {
  display: grid;
  grid-template-columns: 1fr 1.1fr;
  gap: 1.5rem;
  align-items: start;
}
.sp-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 1rem;
  padding: 1.5rem;
  box-shadow: var(--shadow-sm);
}
.sp-card-title { font-size: 1rem; font-weight: 700; margin-bottom: 0.75rem; }
.sp-profile-skills { display: flex; flex-wrap: wrap; gap: 0.35rem; margin-bottom: 0.5rem; }

.sp-analyze-results {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 1rem;
  padding: 1.5rem;
  min-height: 300px;
  box-shadow: var(--shadow-sm);
}

/* Result card */
.sp-result-card { display: flex; flex-direction: column; gap: 1.25rem; animation: fadeIn 250ms ease; }
.sp-result-score-wrap { display: flex; align-items: center; gap: 1.5rem; flex-wrap: wrap; }
.sp-big-ring { position: relative; width: 120px; height: 120px; flex-shrink: 0; }
.sp-big-ring-svg { width: 120px; height: 120px; }
.sp-ring-bg-lg  { fill: none; stroke: var(--color-border); stroke-width: 8; }
.sp-ring-fill-lg { fill: none; stroke-width: 8; stroke-linecap: round; }
.sp-big-ring-label {
  position: absolute; inset: 0;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
}
.sp-big-pct { font-size: 1.8rem; font-weight: 800; line-height: 1; }
.sp-big-sublabel { font-size: 0.7rem; color: var(--color-text-muted); font-weight: 600; text-transform: uppercase; }
.sp-result-meta { display: flex; flex-direction: column; gap: 0.4rem; }
.sp-result-meta-row {}

/* Breakdown list */
.sp-breakdown-list { display: flex; flex-direction: column; gap: 0.45rem; }
.sp-breakdown-row {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.4rem 0.6rem;
  background: var(--color-bg-alt);
  border-radius: 0.5rem;
  font-size: 0.88rem;
}
.sp-bd-icon { font-size: 0.9rem; }
.sp-bd-skill { flex: 1; font-weight: 500; text-transform: capitalize; }
.sp-bd-label { font-size: 0.72rem; }

/* Quick courses in result */
.sp-result-recs { background: var(--color-bg-alt); border-radius: 0.75rem; padding: 1rem; }
.sp-result-recs-title { font-size: 0.95rem; font-weight: 700; margin-bottom: 0.75rem; }
.sp-quick-course { display: flex; align-items: center; gap: 0.6rem; margin-bottom: 0.5rem; flex-wrap: wrap; }
.sp-qc-skill { flex-shrink: 0; }
.sp-qc-link { flex: 1; text-align: left; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.sp-result-tip { font-size: 0.78rem; margin-top: 0.5rem; }
.sp-perfect { color: var(--color-success); font-weight: 600; font-size: 0.95rem; }

/* ── Courses Tab ── */
.sp-legend { display: flex; gap: 0.5rem; margin-bottom: 1.25rem; flex-wrap: wrap; }
.sp-course-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 1.25rem; }
.sp-course-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 1rem;
  padding: 1.25rem;
  box-shadow: var(--shadow-sm);
  display: flex; flex-direction: column; gap: 0.75rem;
  animation: slideUp 300ms ease both;
  transition: box-shadow 200ms, transform 200ms;
}
.sp-course-card:hover { box-shadow: var(--shadow-lg); transform: translateY(-2px); }
.sp-course-header {}
.sp-course-title-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.5rem; }
.sp-course-skill { font-size: 1.1rem; font-weight: 700; }
.sp-course-status-dot { font-size: 0.78rem; font-weight: 600; }

/* Resource links */
.sp-course-resources { display: flex; flex-direction: column; gap: 0.4rem; flex: 1; }
.sp-resource-link {
  display: flex; align-items: center; gap: 0.6rem;
  background: var(--color-bg-alt);
  border: 1px solid var(--color-border);
  border-radius: 0.5rem;
  padding: 0.5rem 0.75rem;
  text-decoration: none;
  color: var(--color-text);
  font-size: 0.85rem;
  transition: all 150ms ease;
}
.sp-resource-link:hover { background: var(--color-primary-50); border-color: var(--color-primary-200); color: var(--color-primary-dark); }
.sp-resource-icon { font-size: 1rem; flex-shrink: 0; }
.sp-resource-info { flex: 1; min-width: 0; }
.sp-resource-name { display: block; font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.sp-resource-duration { font-size: 0.72rem; color: var(--color-text-muted); }
.sp-resource-arrow { color: var(--color-text-muted); font-size: 0.85rem; flex-shrink: 0; }

/* Progress buttons */
.sp-course-actions { display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; padding-top: 0.5rem; border-top: 1px solid var(--color-border); }
.sp-actions-label { font-size: 0.78rem; color: var(--color-text-muted); font-weight: 600; flex-shrink: 0; }
.sp-progress-btn {
  padding: 0.3rem 0.75rem;
  border: 1.5px solid var(--color-border);
  border-radius: 999px;
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;
  background: var(--color-surface);
  color: var(--color-text-secondary);
  transition: all 150ms ease;
}
.sp-progress-btn:hover { border-color: var(--color-warning); color: var(--color-warning); background: #fffbeb; }
.sp-progress-btn.active { border-color: var(--color-warning); color: var(--color-warning); background: #fef3c7; }
.sp-progress-done:hover { border-color: var(--color-success); color: var(--color-success); background: #ecfdf5; }
.sp-progress-done.active { border-color: var(--color-success); color: var(--color-success); background: #d1fae5; }

/* ── Progress Tab ── */
.sp-kpi-grid { display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; gap: 1rem; margin-bottom: 1.5rem; }
.sp-kpi-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 1rem;
  padding: 1.25rem;
  display: flex; align-items: center; gap: 1rem;
  box-shadow: var(--shadow-sm);
}
.sp-kpi-done { border-left: 4px solid var(--color-success); }
.sp-kpi-wip  { border-left: 4px solid var(--color-warning); }
.sp-kpi-todo { border-left: 4px solid var(--color-border-strong); }
.sp-kpi-icon { font-size: 2rem; }
.sp-kpi-num  { font-size: 2.5rem; font-weight: 800; line-height: 1; }
.sp-kpi-label { font-size: 0.8rem; color: var(--color-text-muted); margin-top: 0.15rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.03em; }

/* Donut */
.sp-kpi-donut { position: relative; width: 80px; height: 80px; flex-shrink: 0; }
.sp-donut-svg { width: 80px; height: 80px; }
.sp-donut-bg   { fill: none; stroke: var(--color-border); stroke-width: 10; }
.sp-donut-fill { fill: none; stroke: var(--color-primary); stroke-width: 10; stroke-linecap: round; transition: stroke-dashoffset 1s ease; }
.sp-donut-label { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; }
.sp-donut-pct { font-size: 1rem; font-weight: 800; line-height: 1; }
.sp-donut-sub { font-size: 0.6rem; color: var(--color-text-muted); font-weight: 600; text-transform: uppercase; }

/* Stacked bar chart */
.sp-bar-chart-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 1rem;
  padding: 1.25rem 1.5rem;
  margin-bottom: 1.5rem;
  box-shadow: var(--shadow-sm);
}
.sp-bar-title { font-size: 0.95rem; font-weight: 700; margin-bottom: 0.75rem; }
.sp-stacked-bar { display: flex; height: 14px; border-radius: 999px; overflow: hidden; background: var(--color-bg-alt); margin-bottom: 0.6rem; }
.sp-seg { height: 100%; transition: width 0.8s cubic-bezier(0.25, 1, 0.5, 1); }
.sp-seg-done { background: var(--color-success); }
.sp-seg-wip  { background: var(--color-warning); }
.sp-seg-todo { background: var(--color-border-strong); }
.sp-bar-legend { display: flex; gap: 1.5rem; font-size: 0.8rem; color: var(--color-text-secondary); flex-wrap: wrap; }
.sp-legend-dot { display: inline-block; width: 10px; height: 10px; border-radius: 50%; margin-right: 0.3rem; vertical-align: middle; }

/* Progress lists */
.sp-progress-lists { display: grid; gap: 1.25rem; }
.sp-progress-group {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 1rem;
  padding: 1.25rem;
  box-shadow: var(--shadow-sm);
}
.sp-pg-title { font-size: 0.95rem; font-weight: 700; margin-bottom: 0.75rem; padding-bottom: 0.75rem; border-bottom: 1px solid var(--color-border); }
.sp-pg-done { color: var(--color-success); }
.sp-pg-wip  { color: var(--color-warning); }
.sp-pg-todo { color: var(--color-text-muted); }
.sp-pg-items { display: flex; flex-direction: column; gap: 0.4rem; }
.sp-pi-row {
  display: flex; align-items: center; gap: 0.75rem;
  padding: 0.5rem 0.6rem;
  border-radius: 0.5rem;
  transition: background 150ms;
}
.sp-pi-row:hover { background: var(--color-bg-alt); }
.sp-pi-icon { font-size: 1rem; width: 1.2rem; text-align: center; flex-shrink: 0; }
.sp-pi-info { flex: 1; min-width: 0; }
.sp-pi-skill { display: block; font-weight: 600; font-size: 0.9rem; text-transform: capitalize; }
.sp-pi-date { font-size: 0.75rem; }
.sp-status-select {
  padding: 0.25rem 0.5rem; font-size: 0.78rem;
  border: 1.5px solid var(--color-border);
  border-radius: 0.4rem;
  background: var(--color-surface);
  color: var(--color-text);
  cursor: pointer;
}

/* Empty state */
.sp-empty {
  text-align: center;
  padding: 3rem 1rem;
  color: var(--color-text-muted);
}
.sp-empty-icon { font-size: 3rem; margin-bottom: 0.75rem; }
.sp-empty h3 { font-size: 1.2rem; font-weight: 700; color: var(--color-text); margin-bottom: 0.4rem; }
.sp-empty p { font-size: 0.9rem; margin-bottom: 1rem; }

/* Responsive */
@media (max-width: 900px) {
  .sp-analyze-grid { grid-template-columns: 1fr; }
  .sp-kpi-grid { grid-template-columns: 1fr 1fr; }
  .sp-hero-stat-grid { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 640px) {
  .sp-hero-inner { flex-direction: column; }
  .sp-hero-stat-grid { min-width: unset; width: 100%; }
  .sp-kpi-grid { grid-template-columns: 1fr 1fr; }
  .sp-course-grid { grid-template-columns: 1fr; }
  .sp-tabs { gap: 0.15rem; }
  .sp-tab { padding: 0.5rem 0.75rem; font-size: 0.8rem; }
}
  `;
  document.head.appendChild(style);
}
