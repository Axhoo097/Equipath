// ============================================
// Database Service — Sprint 9 (Hybrid)
// Dual-mode: Firebase Firestore OR localStorage
// ============================================
import {
  FIREBASE_ENABLED,
  fsGet, fsSet, fsAdd, fsGetAll, fsQuery, fsUpdate,
} from './firebase.js';

// ── localStorage fallback helpers ───────────────────────────────
const DB_KEY = 'equipath_db';

function getDB() {
  const raw = localStorage.getItem(DB_KEY);
  if (raw) return JSON.parse(raw);
  const initial = { users: {}, jobs: {}, applications: {} };
  localStorage.setItem(DB_KEY, JSON.stringify(initial));
  return initial;
}

function saveDB(db) {
  localStorage.setItem(DB_KEY, JSON.stringify(db));
}

// ── Users ────────────────────────────────────────────────────────

export async function createUser(id, data) {
  const record = { ...data, createdAt: new Date().toISOString() };
  if (FIREBASE_ENABLED) {
    await fsSet('users', id, record);
    return { id, ...record };
  }
  const db = getDB();
  db.users[id] = record;
  saveDB(db);
  return db.users[id];
}

export async function getUser(id) {
  if (FIREBASE_ENABLED) {
    return await fsGet('users', id);
  }
  return getDB().users[id] || null;
}

export async function updateUser(id, data) {
  if (FIREBASE_ENABLED) {
    await fsUpdate('users', id, data);
    return await getUser(id);
  }
  const db = getDB();
  if (!db.users[id]) return null;
  db.users[id] = { ...db.users[id], ...data, updatedAt: new Date().toISOString() };
  saveDB(db);
  return db.users[id];
}

export async function getAllUsers() {
  if (FIREBASE_ENABLED) {
    const docs = await fsGetAll('users');
    return docs.reduce((acc, u) => { acc[u.id] = u; return acc; }, {});
  }
  return getDB().users;
}

// ── Sync wrappers (localStorage only — for legacy pages) ────────
export function getUserSync(id)               { return getDB().users[id] || null; }
export function getAllUsersSync()              { return getDB().users; }
export function getAllJobsSync()               { const j = getDB().jobs; return Object.values(j).sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt)); }
export function getJobSync(id)                { return getDB().jobs[id] || null; }
export function getJobsByEmployerSync(empId)  { return getAllJobsSync().filter(j=>j.employerId===empId); }
export function getApplicationsByUserSync(uid){ const a=getDB().applications; return Object.values(a).filter(x=>x.userId===uid); }
export function getApplicationsByJobSync(jid) { const a=getDB().applications; return Object.values(a).filter(x=>x.jobId===jid); }
export function createApplicationSync(data)   {
  const db=getDB(); const id='app_'+Date.now()+'_'+Math.random().toString(36).slice(2,6);
  db.applications[id]={id,...data,appliedAt:new Date().toISOString(),status:'applied'}; saveDB(db); return db.applications[id];
}
export function updateApplicationStatusSync(id,status) {
  const db=getDB(); if(db.applications[id]){db.applications[id].status=status;saveDB(db);} return db.applications[id];
}

// ── Jobs ─────────────────────────────────────────────────────────

export async function createJob(data) {
  if (FIREBASE_ENABLED) {
    const id = await fsAdd('jobs', data);
    return { id, ...data };
  }
  const db = getDB();
  const id = 'job_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
  db.jobs[id] = { id, ...data, createdAt: new Date().toISOString() };
  saveDB(db);
  return db.jobs[id];
}

export async function getJob(id) {
  if (FIREBASE_ENABLED) return await fsGet('jobs', id);
  return getDB().jobs[id] || null;
}

export async function getAllJobs() {
  if (FIREBASE_ENABLED) {
    const docs = await fsGetAll('jobs');
    return docs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }
  const jobs = getDB().jobs;
  return Object.values(jobs).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

export async function getJobsByEmployer(employerId) {
  if (FIREBASE_ENABLED) return await fsQuery('jobs', 'employerId', '==', employerId);
  return (await getAllJobs()).filter(j => j.employerId === employerId);
}

// ── Applications ──────────────────────────────────────────────────

export async function createApplication(data) {
  if (FIREBASE_ENABLED) {
    const id = await fsAdd('applications', { ...data, status: 'applied' });
    return { id, ...data, status: 'applied' };
  }
  const db = getDB();
  const id = 'app_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
  db.applications[id] = { id, ...data, appliedAt: new Date().toISOString(), status: 'applied' };
  saveDB(db);
  return db.applications[id];
}

export async function getApplicationsByUser(userId) {
  if (FIREBASE_ENABLED) return await fsQuery('applications', 'userId', '==', userId);
  const apps = getDB().applications;
  return Object.values(apps).filter(a => a.userId === userId);
}

export async function getApplicationsByJob(jobId) {
  if (FIREBASE_ENABLED) return await fsQuery('applications', 'jobId', '==', jobId);
  const apps = getDB().applications;
  return Object.values(apps).filter(a => a.jobId === jobId);
}

export async function updateApplicationStatus(id, status) {
  if (FIREBASE_ENABLED) {
    await fsUpdate('applications', id, { status });
    return;
  }
  const db = getDB();
  if (db.applications[id]) {
    db.applications[id].status = status;
    saveDB(db);
  }
  return db.applications[id];
}

// ── Analytics helpers (Sprint 11) ────────────────────────────────

export async function getEmployerAnalytics(employerId) {
  const jobs = await getJobsByEmployer(employerId);
  let totalApps = 0;
  let shortlisted = 0;
  let skillFreq = {};
  const jobStats = [];

  for (const job of jobs) {
    const apps = await getApplicationsByJob(job.id);
    totalApps += apps.length;
    shortlisted += apps.filter(a => a.status === 'shortlisted').length;
    jobStats.push({ job, appCount: apps.length, apps });
    (job.requiredSkills || []).forEach(s => { skillFreq[s] = (skillFreq[s] || 0) + 1; });
  }

  const topSkills = Object.entries(skillFreq)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 8)
    .map(([skill, count]) => ({ skill, count }));

  return { jobs, totalApps, shortlisted, jobStats, topSkills };
}

// ── Interview Session Storage (Sprint 10) ─────────────────────────

export function saveInterviewSession(userId, sessionData) {
  const key = `equipath_interview_${userId}`;
  const existing = JSON.parse(localStorage.getItem(key) || '[]');
  existing.unshift({ ...sessionData, savedAt: new Date().toISOString() });
  localStorage.setItem(key, JSON.stringify(existing.slice(0, 10))); // keep last 10
}

export function getInterviewSessions(userId) {
  const key = `equipath_interview_${userId}`;
  return JSON.parse(localStorage.getItem(key) || '[]');
}

// ── Seed sample data (localStorage mode only) ────────────────────

export function seedData() {
  if (FIREBASE_ENABLED) return; // Firestore manages its own data
  const db = getDB();
  if (Object.keys(db.jobs).length > 0) return; // Already seeded

  const empId = 'emp_demo';
  db.users[empId] = {
    role: 'employer', email: 'hr@accesstech.com', name: 'Access Tech Solutions',
    companyName: 'Access Tech Solutions', industry: 'Technology',
    location: 'San Francisco, CA', companySize: '50-200',
    accessibilityFeatures: ['wheelchair-ramp', 'screen-reader-stations', 'flexible-hours', 'remote-option'],
    employerReadinessScore: 92, createdAt: new Date().toISOString(),
  };

  const emp2 = 'emp_inclucorp';
  db.users[emp2] = {
    role: 'employer', email: 'jobs@inclucorp.org', name: 'IncluCorp',
    companyName: 'IncluCorp', industry: 'Non-Profit',
    location: 'New York, NY', companySize: '200-500',
    accessibilityFeatures: ['sign-language-interpreter', 'flexible-hours', 'quiet-workspace', 'assistive-tech'],
    employerReadinessScore: 88, createdAt: new Date().toISOString(),
  };

  const emp3 = 'emp_greenleaf';
  db.users[emp3] = {
    role: 'employer', email: 'careers@greenleaf.io', name: 'GreenLeaf Digital',
    companyName: 'GreenLeaf Digital', industry: 'Marketing',
    location: 'Austin, TX', companySize: '10-50',
    accessibilityFeatures: ['remote-option', 'flexible-hours'],
    employerReadinessScore: 72, createdAt: new Date().toISOString(),
  };

  const sampleJobs = [
    {
      id: 'job_1', employerId: empId, title: 'Frontend Developer (Accessible Web)',
      description: 'Build accessible, WCAG-compliant web applications using React. Remote-friendly role with flexible hours.',
      requiredSkills: ['javascript', 'react', 'html', 'css', 'accessibility', 'wcag'],
      location: 'Remote', salaryRange: '$80,000 - $110,000', isRemote: true,
      accessibilityTags: ['screen-reader-friendly', 'remote', 'flexible-hours', 'no-physical-requirements'],
      physicalRequirements: { mobility: 95, vision: 60, hearing: 85, cognition: 50 },
      createdAt: '2026-03-28T10:00:00Z',
    },
    {
      id: 'job_2', employerId: empId, title: 'Data Analyst',
      description: 'Analyze user engagement data, create dashboards, and generate insights.',
      requiredSkills: ['python', 'sql', 'excel', 'statistics', 'tableau'],
      location: 'San Francisco, CA', salaryRange: '$70,000 - $95,000', isRemote: false,
      accessibilityTags: ['wheelchair-accessible', 'assistive-tech-provided', 'elevator-access'],
      physicalRequirements: { mobility: 80, vision: 55, hearing: 75, cognition: 45 },
      createdAt: '2026-03-27T14:00:00Z',
    },
    {
      id: 'job_3', employerId: emp2, title: 'Content Writer — Inclusive Communications',
      description: 'Write accessible, inclusive content for our website and publications.',
      requiredSkills: ['writing', 'editing', 'seo', 'content-strategy', 'accessibility'],
      location: 'New York, NY (Hybrid)', salaryRange: '$55,000 - $75,000', isRemote: false,
      accessibilityTags: ['sign-language-support', 'hybrid', 'flexible-hours', 'quiet-workspace'],
      physicalRequirements: { mobility: 90, vision: 60, hearing: 80, cognition: 50 },
      createdAt: '2026-03-26T09:00:00Z',
    },
    {
      id: 'job_4', employerId: emp2, title: 'Community Outreach Coordinator',
      description: 'Coordinate disability advocacy programs and community engagement.',
      requiredSkills: ['communication', 'project-management', 'public-speaking', 'social-media', 'advocacy'],
      location: 'New York, NY', salaryRange: '$50,000 - $65,000', isRemote: false,
      accessibilityTags: ['wheelchair-accessible', 'assistive-tech-provided'],
      physicalRequirements: { mobility: 60, vision: 50, hearing: 45, cognition: 45 },
      createdAt: '2026-03-25T11:00:00Z',
    },
    {
      id: 'job_5', employerId: emp3, title: 'Graphic Designer (Remote)',
      description: 'Create visual content for digital campaigns. Fully remote with flexible schedule.',
      requiredSkills: ['graphic-design', 'adobe-photoshop', 'adobe-illustrator', 'figma', 'typography'],
      location: 'Remote', salaryRange: '$60,000 - $85,000', isRemote: true,
      accessibilityTags: ['remote', 'flexible-hours', 'no-physical-requirements'],
      physicalRequirements: { mobility: 95, vision: 30, hearing: 90, cognition: 50 },
      createdAt: '2026-03-24T16:00:00Z',
    },
    {
      id: 'job_6', employerId: empId, title: 'QA Tester — Accessibility Testing',
      description: 'Test web and mobile apps for accessibility compliance.',
      requiredSkills: ['qa-testing', 'accessibility', 'screen-readers', 'wcag', 'manual-testing', 'automation'],
      location: 'Remote', salaryRange: '$65,000 - $90,000', isRemote: true,
      accessibilityTags: ['remote', 'flexible-hours', 'screen-reader-friendly'],
      physicalRequirements: { mobility: 95, vision: 55, hearing: 80, cognition: 50 },
      createdAt: '2026-03-23T12:00:00Z',
    },
  ];

  sampleJobs.forEach(job => { db.jobs[job.id] = job; });
  saveDB(db);
}
