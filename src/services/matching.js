// ============================================
// Job Matching Algorithm
// ============================================

/**
 * Compute match score between a job seeker and a job.
 * Score = 0.6 * skillScore + 0.4 * abilityScore
 * Returns 0–100
 */
export function computeMatchScore(user, job) {
  const skillScore = computeSkillScore(user.skills || [], job.requiredSkills || []);
  const abilityScore = computeAbilityScore(user.abilityProfile, job.physicalRequirements);
  return Math.round(0.6 * skillScore + 0.4 * abilityScore);
}

/**
 * Skill match: percentage of job skills the user has
 */
function computeSkillScore(userSkills, jobSkills) {
  if (!jobSkills.length) return 100;
  const userSet = new Set(userSkills.map(s => s.toLowerCase().trim()));
  let matches = 0;
  for (const skill of jobSkills) {
    if (userSet.has(skill.toLowerCase().trim())) {
      matches++;
    }
  }
  return Math.round((matches / jobSkills.length) * 100);
}

/**
 * Ability compatibility:
 * Higher score = user's abilities meet or exceed job's physical requirements.
 * physicalRequirements: { mobility: 0-100, vision: 0-100, hearing: 0-100, cognition: 0-100 }
 *   Higher value = the job requires LESS of that ability (more accessible)
 *   e.g., mobility: 95 means "almost no mobility needed"
 */
function computeAbilityScore(abilityProfile, physicalRequirements) {
  if (!abilityProfile || !physicalRequirements) return 75; // Neutral default

  const categories = ['mobility', 'vision', 'hearing', 'cognition'];
  let totalFit = 0;

  for (const cat of categories) {
    const userAbility = abilityProfile[cat] ?? 75;
    const jobAccessibility = physicalRequirements[cat] ?? 75;

    // If job accessibility is high (doesn't need the ability) OR user ability is high → good fit
    // Fit = min(100, userAbility + (100 - jobMinimumRequired))
    // Simplified: if user ability >= (100 - jobAccessibility), perfect fit
    const requiredLevel = 100 - jobAccessibility;
    if (userAbility >= requiredLevel) {
      totalFit += 100;
    } else {
      totalFit += Math.round((userAbility / Math.max(requiredLevel, 1)) * 100);
    }
  }

  return Math.round(totalFit / categories.length);
}

/**
 * Rank all jobs for a given user
 * Returns sorted array of { job, matchScore, skillScore, abilityScore }
 */
export function rankJobsForUser(user, jobs) {
  return jobs
    .map(job => {
      const skillScore = computeSkillScore(user.skills || [], job.requiredSkills || []);
      const abilityScore = computeAbilityScore(user.abilityProfile, job.physicalRequirements);
      const matchScore = Math.round(0.6 * skillScore + 0.4 * abilityScore);
      return { job, matchScore, skillScore, abilityScore };
    })
    .sort((a, b) => b.matchScore - a.matchScore);
}

/**
 * Compute skill gaps for a user against a job
 * Returns array of missing skills
 */
export function getSkillGaps(userSkills, jobSkills) {
  const userSet = new Set((userSkills || []).map(s => s.toLowerCase().trim()));
  return (jobSkills || []).filter(s => !userSet.has(s.toLowerCase().trim()));
}
