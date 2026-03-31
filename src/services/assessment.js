// ============================================
// Ability Assessment Scoring Service
// ============================================

export const ASSESSMENT_CATEGORIES = [
  {
    id: 'mobility',
    label: 'Mobility',
    icon: '🦿',
    description: 'Assess your physical mobility and movement capabilities.',
    questions: [
      { id: 'm1', text: 'I can walk or use a mobility aid for extended periods (30+ minutes)' },
      { id: 'm2', text: 'I can lift and carry objects weighing up to 10 pounds' },
      { id: 'm3', text: 'I can reach objects on shelves above shoulder height' },
      { id: 'm4', text: 'I can use stairs or navigate multi-level buildings' },
      { id: 'm5', text: 'I can perform fine motor tasks (typing, writing, handling small objects)' },
    ]
  },
  {
    id: 'vision',
    label: 'Vision',
    icon: '👁️',
    description: 'Assess your visual capabilities for workplace tasks.',
    questions: [
      { id: 'v1', text: 'I can read standard-size text on a screen or paper' },
      { id: 'v2', text: 'I can distinguish colors accurately' },
      { id: 'v3', text: 'I can work comfortably in varying light conditions' },
      { id: 'v4', text: 'I can identify faces or objects at a moderate distance' },
    ]
  },
  {
    id: 'hearing',
    label: 'Hearing',
    icon: '👂',
    description: 'Assess your auditory capabilities for communication.',
    questions: [
      { id: 'h1', text: 'I can hear and understand speech in a quiet environment' },
      { id: 'h2', text: 'I can participate in phone or video calls' },
      { id: 'h3', text: 'I can follow verbal instructions given in a group setting' },
      { id: 'h4', text: 'I can detect alarms, alerts, or environmental sounds' },
    ]
  },
  {
    id: 'cognition',
    label: 'Cognition',
    icon: '🧠',
    description: 'Assess your cognitive and processing capabilities.',
    questions: [
      { id: 'c1', text: 'I can concentrate on tasks for 30+ minutes without significant difficulty' },
      { id: 'c2', text: 'I can remember and follow multi-step instructions' },
      { id: 'c3', text: 'I can adapt to changes in routine or unexpected situations' },
      { id: 'c4', text: 'I can manage time and prioritize tasks independently' },
    ]
  }
];

// Scale labels
export const LIKERT_LABELS = [
  { value: 1, label: 'Cannot do', short: '1' },
  { value: 2, label: 'Very difficult', short: '2' },
  { value: 3, label: 'Somewhat difficult', short: '3' },
  { value: 4, label: 'Mostly able', short: '4' },
  { value: 5, label: 'Fully able', short: '5' },
];

/**
 * Compute ability profile from raw answers
 * @param {Object} answers - { questionId: score (1-5) }
 * @returns {{ mobility: number, vision: number, hearing: number, cognition: number, overall: number }}
 */
export function computeAbilityProfile(answers) {
  const profile = {};
  let totalScore = 0;
  let totalQuestions = 0;

  for (const category of ASSESSMENT_CATEGORIES) {
    const catAnswers = category.questions
      .map(q => answers[q.id])
      .filter(v => v !== undefined && v !== null);

    if (catAnswers.length === 0) {
      profile[category.id] = 0;
      continue;
    }

    const sum = catAnswers.reduce((a, b) => a + b, 0);
    const maxPossible = catAnswers.length * 5;
    profile[category.id] = Math.round((sum / maxPossible) * 100);
    totalScore += sum;
    totalQuestions += catAnswers.length;
  }

  profile.overall = totalQuestions > 0
    ? Math.round((totalScore / (totalQuestions * 5)) * 100)
    : 0;

  return profile;
}
