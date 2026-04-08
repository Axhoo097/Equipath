// ============================================
// Skill Gap Service — Enhanced Skill Planner
// Analyzes gaps, calculates match %, recommends
// ============================================
import learningResources from './learning.json';
import { calculateSemanticSimilarity, normalizeStr } from './nlp.js';

const PROGRESS_KEY = 'equipath_skill_progress';

// ── Gap Analysis ─────────────────────────────────────────────────

/**
 * Analyzes gaps between a candidate's skills and a target job's requirements.
 * Returns an object with matched, missing, and partial skill arrays.
 * @param {string[]} userSkills
 * @param {string[]} jobSkills
 * @returns {{ matched: string[], partial: {skill:string,score:number}[], missing: string[], matchPct: number }}
 */
export function analyzeGaps(userSkills = [], jobSkills = []) {
  const matched = [];
  const partial = [];
  const missing = [];

  jobSkills.forEach(jskill => {
    let bestMatchScore = 0.0;
    userSkills.forEach(uskill => {
      const score = calculateSemanticSimilarity(uskill, jskill);
      bestMatchScore = Math.max(bestMatchScore, score);
    });

    if (bestMatchScore >= 0.85) {
      matched.push(jskill);
    } else if (bestMatchScore >= 0.5) {
      partial.push({ skill: jskill, score: bestMatchScore });
    } else {
      missing.push(jskill);
    }
  });

  const total = jobSkills.length || 1;
  const partialWeight = partial.reduce((sum, p) => sum + p.score, 0);
  const matchPct = Math.round(((matched.length + partialWeight) / total) * 100);

  return { matched, partial, missing, matchPct };
}

/**
 * Calculate match percentage against a single job (simple array API for legacy use).
 * @param {string[]} userSkills
 * @param {string[]} jobSkills
 * @returns {number} Percentage 0-100
 */
export function calcMatchPct(userSkills = [], jobSkills = []) {
  const { matchPct } = analyzeGaps(userSkills, jobSkills);
  return matchPct;
}

// ── Course Recommendations ────────────────────────────────────────

/**
 * Build rich recommendations for missing / partial skills.
 * @param {string[]} missingSkills
 * @param {{skill:string,score:number}[]} partialSkills
 * @returns {Array<{skill:string, resources:Array<{title:string,url:string,type:string}>, priority:'high'|'medium'|'low'}>}
 */
export function recommendResources(missingSkills = [], partialSkills = []) {
  const recommendations = [];

  const processSkill = (skillName, priority) => {
    const normalizedGap = normalizeStr(skillName);
    let matchedResources = null;

    for (const key in learningResources) {
      if (normalizeStr(key) === normalizedGap || normalizedGap.includes(normalizeStr(key)) || normalizeStr(key).includes(normalizedGap)) {
        matchedResources = learningResources[key];
        break;
      }
    }

    if (!matchedResources) {
      matchedResources = [
        {
          title: `FreeCodeCamp: ${skillName}`,
          url: `https://www.freecodecamp.org/news/search?query=${encodeURIComponent(skillName)}`,
          type: 'free',
          duration: '~10 hrs',
        },
        {
          title: `Coursera: ${skillName}`,
          url: `https://www.coursera.org/search?query=${encodeURIComponent(skillName)}`,
          type: 'paid',
          duration: 'Varies',
        },
        {
          title: `YouTube Tutorial: ${skillName}`,
          url: `https://www.youtube.com/results?search_query=${encodeURIComponent(skillName + ' tutorial')}`,
          type: 'free',
          duration: '~3 hrs',
        },
      ];
    }

    recommendations.push({ skill: skillName, resources: matchedResources, priority });
  };

  missingSkills.forEach(s => processSkill(s, 'high'));
  partialSkills.forEach(({ skill }) => processSkill(skill, 'medium'));

  return recommendations;
}

// ── Progress Tracking ─────────────────────────────────────────────

/**
 * Load all skill progress entries for a user.
 * @param {string} userId
 * @returns {Object} { skillName: { status: 'not_started'|'in_progress'|'completed', completedAt?, notes? } }
 */
export function loadProgress(userId) {
  const raw = localStorage.getItem(`${PROGRESS_KEY}_${userId}`);
  return raw ? JSON.parse(raw) : {};
}

/**
 * Save skill progress for a user.
 * @param {string} userId
 * @param {string} skillName
 * @param {'not_started'|'in_progress'|'completed'} status
 * @param {string} [notes]
 */
export function saveProgress(userId, skillName, status, notes = '') {
  const all = loadProgress(userId);
  all[normalizeStr(skillName)] = {
    skill: skillName,
    status,
    notes,
    updatedAt: new Date().toISOString(),
    ...(status === 'completed' ? { completedAt: new Date().toISOString() } : {}),
  };
  localStorage.setItem(`${PROGRESS_KEY}_${userId}`, JSON.stringify(all));
  return all;
}

/**
 * Get summary stats for user progress.
 * @param {string} userId
 * @returns {{ total: number, completed: number, inProgress: number, notStarted: number, pct: number }}
 */
export function getProgressStats(userId) {
  const all = loadProgress(userId);
  const entries = Object.values(all);
  const completed = entries.filter(e => e.status === 'completed').length;
  const inProgress = entries.filter(e => e.status === 'in_progress').length;
  const notStarted = entries.filter(e => e.status === 'not_started').length;
  const total = entries.length;
  const pct = total === 0 ? 0 : Math.round((completed / total) * 100);
  return { total, completed, inProgress, notStarted, pct };
}

// ── Manual Job-Skill Analysis ─────────────────────────────────────

/**
 * Analyze a custom job description (freeform text → extract skills).
 * This is a lightweight keyword extractor.
 * @param {string} jdText  raw job description text
 * @returns {string[]}
 */
export function extractSkillsFromJD(jdText = '') {
  const knownSkills = Object.keys(learningResources).concat([
    'communication', 'project-management', 'leadership', 'writing',
    'public-speaking', 'data-analysis', 'machine-learning', 'typescript',
    'node', 'nodejs', 'vue', 'angular', 'docker', 'kubernetes', 'aws', 'gcp', 'azure',
    'git', 'agile', 'scrum', 'excel', 'powerpoint', 'tableau', 'power-bi',
    'photoshop', 'illustrator', 'ux', 'ui', 'figma', 'sketch',
    'java', 'c++', 'c#', 'ruby', 'php', 'go', 'kotlin', 'swift',
    'tensorflow', 'pytorch', 'nlp', 'deep-learning', 'blockchain',
    'content-strategy', 'social-media', 'seo', 'analytics', 'advocacy',
    'automation', 'qa-testing', 'statistics', 'r', 'matlab',
    'screen-readers', 'wcag', 'accessibility', 'sql', 'mongodb',
    'postgresql', 'firebase', 'graphql', 'rest', 'api',
  ]);
  const normalized = jdText.toLowerCase();
  const found = new Set();
  knownSkills.forEach(skill => {
    const key = skill.replace(/-/g, ' ');
    if (normalized.includes(key) || normalized.includes(skill)) {
      found.add(skill);
    }
  });
  return Array.from(found);
}
