// ============================================
// Mock Database (localStorage-backed)
// Replaces Firebase for local development
// ============================================

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

// --- Users ---
export function createUser(id, data) {
  const db = getDB();
  db.users[id] = { ...data, createdAt: new Date().toISOString() };
  saveDB(db);
  return db.users[id];
}

export function getUser(id) {
  return getDB().users[id] || null;
}

export function updateUser(id, data) {
  const db = getDB();
  if (!db.users[id]) return null;
  db.users[id] = { ...db.users[id], ...data, updatedAt: new Date().toISOString() };
  saveDB(db);
  return db.users[id];
}

export function getAllUsers() {
  return getDB().users;
}

// --- Jobs ---
export function createJob(data) {
  const db = getDB();
  const id = 'job_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
  db.jobs[id] = { id, ...data, createdAt: new Date().toISOString() };
  saveDB(db);
  return db.jobs[id];
}

export function getJob(id) {
  return getDB().jobs[id] || null;
}

export function getAllJobs() {
  const jobs = getDB().jobs;
  return Object.values(jobs).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

export function getJobsByEmployer(employerId) {
  return getAllJobs().filter(j => j.employerId === employerId);
}

// --- Applications ---
export function createApplication(data) {
  const db = getDB();
  const id = 'app_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
  db.applications[id] = { id, ...data, appliedAt: new Date().toISOString(), status: 'applied' };
  saveDB(db);
  return db.applications[id];
}

export function getApplicationsByUser(userId) {
  const apps = getDB().applications;
  return Object.values(apps).filter(a => a.userId === userId);
}

export function getApplicationsByJob(jobId) {
  const apps = getDB().applications;
  return Object.values(apps).filter(a => a.jobId === jobId);
}

export function updateApplicationStatus(id, status) {
  const db = getDB();
  if (db.applications[id]) {
    db.applications[id].status = status;
    saveDB(db);
  }
  return db.applications[id];
}

// --- Seed sample data ---
export function seedData() {
  const db = getDB();
  if (Object.keys(db.jobs).length > 0) return; // Already seeded

  // Sample employer
  const empId = 'emp_demo';
  db.users[empId] = {
    role: 'employer',
    email: 'hr@accesstech.com',
    name: 'Access Tech Solutions',
    companyName: 'Access Tech Solutions',
    industry: 'Technology',
    location: 'San Francisco, CA',
    companySize: '50-200',
    accessibilityFeatures: ['wheelchair-ramp', 'screen-reader-stations', 'flexible-hours', 'remote-option'],
    employerReadinessScore: 92,
    createdAt: new Date().toISOString()
  };

  const emp2 = 'emp_inclucorp';
  db.users[emp2] = {
    role: 'employer',
    email: 'jobs@inclucorp.org',
    name: 'IncluCorp',
    companyName: 'IncluCorp',
    industry: 'Non-Profit',
    location: 'New York, NY',
    companySize: '200-500',
    accessibilityFeatures: ['sign-language-interpreter', 'flexible-hours', 'quiet-workspace', 'assistive-tech'],
    employerReadinessScore: 88,
    createdAt: new Date().toISOString()
  };

  const emp3 = 'emp_greenleaf';
  db.users[emp3] = {
    role: 'employer',
    email: 'careers@greenleaf.io',
    name: 'GreenLeaf Digital',
    companyName: 'GreenLeaf Digital',
    industry: 'Marketing',
    location: 'Austin, TX',
    companySize: '10-50',
    accessibilityFeatures: ['remote-option', 'flexible-hours'],
    employerReadinessScore: 72,
    createdAt: new Date().toISOString()
  };

  // Sample jobs
  const sampleJobs = [
    {
      id: 'job_1', employerId: empId, title: 'Frontend Developer (Accessible Web)',
      description: 'Build accessible, WCAG-compliant web applications using React. Remote-friendly role with flexible hours. Experience with ARIA patterns preferred.',
      requiredSkills: ['javascript', 'react', 'html', 'css', 'accessibility', 'wcag'],
      location: 'Remote', salaryRange: '$80,000 - $110,000', isRemote: true,
      accessibilityTags: ['screen-reader-friendly', 'remote', 'flexible-hours', 'no-physical-requirements'],
      physicalRequirements: { mobility: 95, vision: 60, hearing: 85, cognition: 50 },
      createdAt: '2026-03-28T10:00:00Z'
    },
    {
      id: 'job_2', employerId: empId, title: 'Data Analyst',
      description: 'Analyze user engagement data, create dashboards, and generate insights. Office has full wheelchair accessibility and assistive technology.',
      requiredSkills: ['python', 'sql', 'excel', 'statistics', 'tableau'],
      location: 'San Francisco, CA', salaryRange: '$70,000 - $95,000', isRemote: false,
      accessibilityTags: ['wheelchair-accessible', 'assistive-tech-provided', 'elevator-access'],
      physicalRequirements: { mobility: 80, vision: 55, hearing: 75, cognition: 45 },
      createdAt: '2026-03-27T14:00:00Z'
    },
    {
      id: 'job_3', employerId: emp2, title: 'Content Writer — Inclusive Communications',
      description: 'Write accessible, inclusive content for our website and publications. Flexible schedule with work-from-home option. Sign language interpreters available for meetings.',
      requiredSkills: ['writing', 'editing', 'seo', 'content-strategy', 'accessibility'],
      location: 'New York, NY (Hybrid)', salaryRange: '$55,000 - $75,000', isRemote: false,
      accessibilityTags: ['sign-language-support', 'hybrid', 'flexible-hours', 'quiet-workspace'],
      physicalRequirements: { mobility: 90, vision: 60, hearing: 80, cognition: 50 },
      createdAt: '2026-03-26T09:00:00Z'
    },
    {
      id: 'job_4', employerId: emp2, title: 'Community Outreach Coordinator',
      description: 'Coordinate disability advocacy programs and community engagement. Travel required within city. Office is fully accessible.',
      requiredSkills: ['communication', 'project-management', 'public-speaking', 'social-media', 'advocacy'],
      location: 'New York, NY', salaryRange: '$50,000 - $65,000', isRemote: false,
      accessibilityTags: ['wheelchair-accessible', 'assistive-tech-provided'],
      physicalRequirements: { mobility: 60, vision: 50, hearing: 45, cognition: 45 },
      createdAt: '2026-03-25T11:00:00Z'
    },
    {
      id: 'job_5', employerId: emp3, title: 'Graphic Designer (Remote)',
      description: 'Create visual content for digital campaigns. Fully remote position with flexible schedule. Must be comfortable with Adobe Creative Suite.',
      requiredSkills: ['graphic-design', 'adobe-photoshop', 'adobe-illustrator', 'figma', 'typography'],
      location: 'Remote', salaryRange: '$60,000 - $85,000', isRemote: true,
      accessibilityTags: ['remote', 'flexible-hours', 'no-physical-requirements'],
      physicalRequirements: { mobility: 95, vision: 30, hearing: 90, cognition: 50 },
      createdAt: '2026-03-24T16:00:00Z'
    },
    {
      id: 'job_6', employerId: empId, title: 'QA Tester — Accessibility Testing',
      description: 'Test web and mobile apps for accessibility compliance. Experience with screen readers (NVDA, VoiceOver) is a strong plus.',
      requiredSkills: ['qa-testing', 'accessibility', 'screen-readers', 'wcag', 'manual-testing', 'automation'],
      location: 'Remote', salaryRange: '$65,000 - $90,000', isRemote: true,
      accessibilityTags: ['remote', 'flexible-hours', 'screen-reader-friendly'],
      physicalRequirements: { mobility: 95, vision: 55, hearing: 80, cognition: 50 },
      createdAt: '2026-03-23T12:00:00Z'
    },
  ];

  sampleJobs.forEach(job => { db.jobs[job.id] = job; });
  saveDB(db);
}
