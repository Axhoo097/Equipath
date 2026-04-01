// ============================================
// Employer Readiness Score Engine (Sprint 8)
// ============================================

/**
 * Computes an employer's accessibility readiness score (0-100).
 * Based on accessibility features they offer.
 * @param {Object} employer 
 * @returns {number} Score
 */
export function computeEmployerScore(employer) {
  if (!employer) return 0;
  
  let score = 50; // Base score
  
  const features = employer.accessibilityFeatures || [];
  
  // Award points for specific highly-impactful features
  const pointMap = {
    'wheelchair-ramp': 10,
    'wheelchair-accessible': 10,
    'screen-reader-stations': 15,
    'assistive-tech': 15,
    'sign-language-interpreter': 20,
    'sign-language-support': 20,
    'flexible-hours': 10,
    'remote-option': 10,
    'quiet-workspace': 5,
    'elevator-access': 5
  };

  features.forEach(feature => {
    if (pointMap[feature]) {
      score += pointMap[feature];
    } else {
      score += 5; // generic feature
    }
  });

  // Cap at 100
  return Math.min(100, Math.max(0, score));
}
