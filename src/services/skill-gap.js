import learningResources from './learning.json';
import { calculateSemanticSimilarity, normalizeStr } from './nlp.js';
import { getJob } from './db.js';

/**
 * Analyzes gaps between a candidate's skills and a target job's requirements
 * @param {Array<string>} userSkills
 * @param {Array<string>} jobSkills
 * @returns {Array<string>} Array of missing skills
 */
export function analyzeGaps(userSkills = [], jobSkills = []) {
  const missingSkills = [];
  
  jobSkills.forEach(jskill => {
    // Check if user has this skill (at least 0.8 partial match or exact)
    let bestMatchScore = 0.0;
    userSkills.forEach(uskill => {
      const score = calculateSemanticSimilarity(uskill, jskill);
      bestMatchScore = Math.max(bestMatchScore, score);
    });
    
    // If the best match score is strictly less than 0.8, we consider it a gap
    if (bestMatchScore < 0.8) {
      missingSkills.push(jskill);
    }
  });

  return missingSkills;
}

/**
 * Recommend resources for an array of missing skills based on learning.json
 * @param {Array<string>} missingSkills
 * @returns {Array<{ skill: string, resources: Array<{title: string, url: string}> }>}
 */
export function recommendResources(missingSkills = []) {
  const recommendations = [];

  missingSkills.forEach(gap => {
    const normalizedGap = normalizeStr(gap);
    let matchedResources = [];

    // Check exact mappings based on normalized string keys in our json
    for (const key in learningResources) {
      if (normalizeStr(key) === normalizedGap || normalizedGap.includes(normalizeStr(key))) {
        matchedResources = learningResources[key];
        break;
      }
    }

    // Default generic fallback for skills we don't have cataloged
    if (matchedResources.length === 0) {
      matchedResources = [
        { title: `Search FreeCodeCamp for ${gap}`, url: `https://www.freecodecamp.org/news/search?query=${encodeURI(gap)}` },
        { title: `Look up ${gap} on Coursera`, url: `https://www.coursera.org/search?query=${encodeURI(gap)}` }
      ];
    }

    recommendations.push({
      skill: gap,
      resources: matchedResources
    });
  });

  return recommendations;
}
