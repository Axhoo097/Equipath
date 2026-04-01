// ============================================
// NLP / Semantic Matching Engine (Phase 2)
// Light-weight client-side implementation of skill similarity
// ============================================

// A simple ontology/graph of skill clusters
export const skillClusters = {
  frontend: ['javascript', 'js', 'react', 'reactjs', 'vue', 'angular', 'html', 'css', 'typescript', 'ts', 'front-end', 'ui/ux', 'dom'],
  backend: ['python', 'node', 'nodejs', 'express', 'django', 'flask', 'java', 'spring', 'go', 'golang', 'ruby', 'rails', 'php', 'backend', 'api', 'server'],
  database: ['sql', 'mysql', 'postgresql', 'postgres', 'mongodb', 'mongo', 'nosql', 'firebase', 'firestore', 'redis', 'database', 'dbms'],
  design: ['figma', 'sketch', 'adobe', 'adobe-photoshop', 'photoshop', 'illustrator', 'adobe-illustrator', 'ui', 'ux', 'graphic-design', 'typography', 'design'],
  accessibility: ['accessibility', 'a11y', 'wcag', 'aria', 'screen-readers', 'inclusive-design', 'ada'],
  data: ['python', 'statistics', 'math', 'pandas', 'numpy', 'sql', 'tableau', 'excel', 'data-analysis', 'data-science', 'machine-learning', 'ai'],
  soft: ['communication', 'teamwork', 'leadership', 'problem-solving', 'writing', 'editing', 'presentation', 'public-speaking', 'project-management', 'advocacy']
};

/**
 * Normalizes a string by lowercasing, trimming, and replacing multiple spaces
 * @param {string} str 
 * @returns {string}
 */
export function normalizeStr(str) {
  if (!str) return '';
  return str.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
}

/**
 * Checks if two skills are exact matches after normalization
 */
export function isExactMatch(skillA, skillB) {
  return normalizeStr(skillA) === normalizeStr(skillB);
}

/**
 * Calculates a partial match score (0.0 to 1.0) based on shared clusters
 * @param {string} skillA 
 * @param {string} skillB 
 * @returns {number} Score (1.0 = exact, 0.5 = shared cluster, 0.0 = no relation)
 */
export function calculateSemanticSimilarity(skillA, skillB) {
  const normA = normalizeStr(skillA);
  const normB = normalizeStr(skillB);

  // Exact match
  if (normA === normB) return 1.0;

  // Partial match via substring (e.g. "react" and "reactjs")
  if (normA.includes(normB) || normB.includes(normA)) return 0.8;

  // Check cluster overlaps
  let maxScore = 0.0;
  for (const cluster in skillClusters) {
    const skillsInCluster = skillClusters[cluster].map(normalizeStr);
    
    // If one skill is essentially the cluster name (e.g., "frontend" vs "react")
    if (skillsInCluster.includes(normA) && normB.includes(cluster)) maxScore = Math.max(maxScore, 0.6);
    if (skillsInCluster.includes(normB) && normA.includes(cluster)) maxScore = Math.max(maxScore, 0.6);
    
    if (skillsInCluster.includes(normA) && skillsInCluster.includes(normB)) {
      maxScore = Math.max(maxScore, 0.5); // Both in same cluster gets a 0.5 partial credit
    }
  }

  return maxScore;
}
