// ============================================
// FILE HEADER: 
// What this file is: A service module for analyzing skill gaps.
// What module/stage it belongs to: Skill Planner (Phase 3 Integration).
// Real-world job: Automatically compares a candidate's skills against a job's requirements to suggest learning resources.
// Dependencies: talks to './learning.json' for resources, and './nlp.js' for understanding text similarity.
// ============================================
import learningResources from './learning.json';
import { calculateSemanticSimilarity, normalizeStr } from './nlp.js';

// Defining the storage key string so we don't misspell it in different places later.
const PROGRESS_KEY = 'equipath_skill_progress';

// ── Gap Analysis ─────────────────────────────────────────────────

/**
 * FUNCTION HEADER
 * Does: Compares a user's known skills against the skills requested by a job.
 * IN: userSkills (list of skills you have), jobSkills (list of skills required)
 * OUT: Object grouping skills into matched, partial, missing, and an overall percentage.
 * Real-world action: "This is the step where we check if a job fits the candidate and find out what they need to learn."
 */
export function analyzeGaps(userSkills = [], jobSkills = []) {
  // Creating buckets to hold our findings
  const matched = [];
  const partial = [];
  const missing = [];

  // Looping through every single skill the job is asking for
  jobSkills.forEach(jskill => {
    // Starting with 0 score, we will try to find the best matching skill the user has
    let bestMatchScore = 0.0;
    
    // Looping through every skill the user has to compare against the current job skill
    userSkills.forEach(uskill => {
      // Checking how similar the user's skill is to the job's skill
      const score = calculateSemanticSimilarity(uskill, jskill);
      // Keeping the highest score found so far
      bestMatchScore = Math.max(bestMatchScore, score);
    });

    // Checking if the similarity score is high enough to be considered a full match
    if (bestMatchScore >= 0.85) {
      matched.push(jskill);
    // Checking if the match is decent but not perfect
    } else if (bestMatchScore >= 0.5) {
      partial.push({ skill: jskill, score: bestMatchScore });
    // If there's no good match, the candidate is completely missing this skill
    } else {
      missing.push(jskill);
    }
  });

  // Getting the total number of required skills (falling back to 1 to prevent division by zero errors later) // SURPRISE: Fallback to 1 prevents a fatal crash if the job has 0 skills.
  const total = jobSkills.length || 1;
  
  // Adding up the partial scores to give the user partial credit
  const partialWeight = partial.reduce((sum, p) => sum + p.score, 0);
  
  // Calculating the final match percentage out of 100
  const matchPct = Math.round(((matched.length + partialWeight) / total) * 100);

  // Giving back all the categorized skills and the percentage score
  return { matched, partial, missing, matchPct };
}

/**
 * FUNCTION HEADER
 * Does: Gives just the match percentage for a user and job without the full breakdown.
 * IN: userSkills (list of strings), jobSkills (list of strings)
 * OUT: A single number (the percentage score)
 * Real-world action: "This is a quick shortcut used by older parts of the app to just get the score number."
 */
export function calcMatchPct(userSkills = [], jobSkills = []) {
  // Extracting only the match percentage from our detailed analysis function
  const { matchPct } = analyzeGaps(userSkills, jobSkills);
  return matchPct;
}

// ── Course Recommendations ────────────────────────────────────────

/**
 * FUNCTION HEADER
 * Does: Finds online courses and tutorials for the skills a user doesn't know fully.
 * IN: missingSkills (completely unknown skills), partialSkills (skills that need improvement)
 * OUT: A list of recommendations containing links to courses and tutorials.
 * Real-world action: "This is where we hand the candidate a map to learn what they don't know."
 */
export function recommendResources(missingSkills = [], partialSkills = []) {
  // Creating an empty bucket for our final course recommendations
  const recommendations = [];

  // Defining a helper function to process a single skill and find resources for it
  const processSkill = (skillName, priority) => {
    // Standardizing the string (e.g., lowercasing) so our matching is consistent // SURPRISE: ML/NLP preprocessing step to clean inputs before comparison; removing this means uppercase/lowercase mismatches would fail.
    const normalizedGap = normalizeStr(skillName);
    
    // Setting up a variable to hold any courses we find in our database
    let matchedResources = null;

    // Searching our local learning resource database to see if we have curated links for this skill
    for (const key in learningResources) {
      // Checking if there's any text overlap between our database key and the needed skill
      if (normalizeStr(key) === normalizedGap || normalizedGap.includes(normalizeStr(key)) || normalizeStr(key).includes(normalizedGap)) {
        // We found a match, so save these specific resources
        matchedResources = learningResources[key];
        break; // Stopping the loop early to save computing time // SURPRISE: Loop optimization; removing it causes unnecessary iteration after the answer is found.
      }
    }

    // If we didn't find anything in our database, we build some standard search links automatically
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

    // Adding the specific or general resources into our final list
    recommendations.push({ skill: skillName, resources: matchedResources, priority });
  };

  // Going through every fully missing skill and marking it as high priority to learn
  missingSkills.forEach(s => processSkill(s, 'high'));
  
  // Going through every partially known skill and marking it as medium priority to learn
  partialSkills.forEach(({ skill }) => processSkill(skill, 'medium'));

  // Returning the complete package of study materials
  return recommendations;
}

// ── Progress Tracking ─────────────────────────────────────────────

/**
 * FUNCTION HEADER
 * Does: Gets the recorded study progress of a user from browser storage.
 * IN: userId (the unique string identifying the person)
 * OUT: An object containing all the skills they are tracking and their completion status.
 * Real-world action: "This is opening the user's planner notebook to see what they've checked off."
 */
export function loadProgress(userId) {
  // Asking the browser's local storage for a string representing the user's progress
  const raw = localStorage.getItem(`${PROGRESS_KEY}_${userId}`);
  
  // If we found something, turn the string back into an object; otherwise, return an empty object // SURPRISE: Null check with a fallback; if removed, `JSON.parse(null)` would break the app.
  return raw ? JSON.parse(raw) : {};
}

/**
 * FUNCTION HEADER
 * Does: Updates browser storage to remember that a candidate has made progress on a skill.
 * IN: userId, skillName, status (how far along they are), notes (optional user thoughts)
 * OUT: The complete updated list of all the user's tracked skills.
 * Real-world action: "This is writing down in the notebook that the user just finished a video course."
 */
export function saveProgress(userId, skillName, status, notes = '') {
  // First, we pull out everything the user has recorded so far
  const all = loadProgress(userId);
  
  // We insert or update the specific skill entry with the new status and a fresh timestamp
  all[normalizeStr(skillName)] = {
    skill: skillName,
    status,
    notes,
    updatedAt: new Date().toISOString(),
    // Using a spread operator with a condition to ONLY save the completion date if they are fully done
    ...(status === 'completed' ? { completedAt: new Date().toISOString() } : {}),
  };
  
  // We turn the updated object back into a string and store it in the browser
  localStorage.setItem(`${PROGRESS_KEY}_${userId}`, JSON.stringify(all));
  
  // Handing back the updated catalog
  return all;
}

/**
 * FUNCTION HEADER
 * Does: Calculates a quick statistical summary of a user's overall learning progress.
 * IN: userId (the person's ID)
 * OUT: Object with counts of complete, active, and unstarted skills, plus an overall percentage.
 * Real-world action: "This is generating the circular progress chart that shows 50% complete."
 */
export function getProgressStats(userId) {
  // Getting all the saved skills for the user
  const all = loadProgress(userId);
  
  // Extracting just the data entries from the object to work with them like a list
  const entries = Object.values(all);
  
  // Counting how many items have their status directly set to 'completed'
  const completed = entries.filter(e => e.status === 'completed').length;
  
  // Counting how many are actively being worked on
  const inProgress = entries.filter(e => e.status === 'in_progress').length;
  
  // Counting how many have not been started yet
  const notStarted = entries.filter(e => e.status === 'not_started').length;
  
  // Grabbing the total count of all tracked skills
  const total = entries.length;
  
  // Calculating completion percentage, preventing division by zero if there are no skills
  const pct = total === 0 ? 0 : Math.round((completed / total) * 100);
  
  // Grouping it into a clean statistical bundle
  return { total, completed, inProgress, notStarted, pct };
}

// ── Manual Job-Skill Analysis ─────────────────────────────────────

/**
 * FUNCTION HEADER
 * Does: Scans a large paragraph of text looking for buzzwords and skill names.
 * IN: jdText (the raw job description paragraph)
 * OUT: A list of standardized skill names found in the text.
 * Real-world action: "This is reading a messy job posting and highlighting the key requirements."
 */
export function extractSkillsFromJD(jdText = '') {
  // Building a giant static list of known industry skills to look out for
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
  
  // Translating the entire text to lowercase to make matching easier
  const normalized = jdText.toLowerCase();
  
  // Setting up a 'Set' which is a special list that automatically prevents duplicates // SURPRISE: Using a Set prevents bulkification issues where a skill mentioned 5 times creates 5 duplicates.
  const found = new Set();
  
  // Going through every single word in our massive skill list
  knownSkills.forEach(skill => {
    // Replacing dashes with spaces to catch variations (like 'node-js' vs 'node js')
    const key = skill.replace(/-/g, ' ');
    
    // If the text contains the skill word or our dashed variation, we record it
    if (normalized.includes(key) || normalized.includes(skill)) {
      found.add(skill);
    }
  });
  
  // Converting the special Set back into a regular array list
  return Array.from(found);
}

// ============================================
// END-OF-FILE SUMMARY
// This file acts as the primary logical brain for our skill planner feature. 
// It runs whenever the user visits the skill matching screen or saves their learning progress. 
// It takes user data and compares it against job requirements to calculate how closely they align, and outputs course recommendations. 
// Ultimately, it ties the candidate's existing capabilities to their future goals, integrating tightly with the rest of the web app's candidate-facing functions.
// ============================================
