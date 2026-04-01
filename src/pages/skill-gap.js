import { getCurrentUser } from '../services/auth.js';
import { getAllJobs } from '../services/db.js';
import { rankJobsForUser } from '../services/matching.js';
import { analyzeGaps, recommendResources } from '../services/skill-gap.js';
import { navigate } from '../router.js';

export function renderSkillGap(container) {
  const user = getCurrentUser();

  if (!user || user.role !== 'jobseeker') {
    navigate('/login');
    return;
  }

  // Get top 3 recommended jobs for this user
  const jobs = getAllJobs();
  const rankedJobs = rankJobsForUser(user, jobs).slice(0, 3);
  
  // Collect all unique missing skills from these top jobs
  let allMissingSkills = new Set();
  rankedJobs.forEach(({ job }) => {
    const gaps = analyzeGaps(user.skills || [], job.requiredSkills || []);
    gaps.forEach(g => allMissingSkills.add(g));
  });

  const missingSkillsArray = Array.from(allMissingSkills);
  const recommendations = recommendResources(missingSkillsArray);

  let html = `
    <div class="container py-xl">
      <header class="mb-lg">
        <h1>My Skill Navigator</h1>
        <p class="text-secondary">Based on your top job matches, here are the skills you should learn next to improve your chances.</p>
      </header>

      ${rankedJobs.length === 0 ? '<p>No jobs found to analyze.</p>' : ''}
      
      ${recommendations.length === 0 ? `
        <div class="card bg-surface p-md text-center">
          <h3>You're all set!</h3>
          <p class="text-secondary">Your skills perfectly match the top recommended jobs on Equipath.</p>
        </div>
      ` : `
        <ul aria-label="Skill Gap Recommendations" style="list-style: none; padding: 0; display: grid; gap: 1rem;">
          ${recommendations.map(rec => `
            <li class="card bg-surface p-md">
              <h3 class="mb-sm text-primary" style="text-transform: capitalize;">${rec.skill}</h3>
              <p class="text-secondary mb-md">Recommended Free Resources:</p>
              <ul style="list-style: none; padding: 0;">
                ${rec.resources.map(res => `
                  <li class="mb-sm">
                    <a href="${res.url}" target="_blank" rel="noopener noreferrer" class="btn btn-outline" style="display: inline-block; width: auto;">
                      ${res.title}
                    </a>
                  </li>
                `).join('')}
              </ul>
            </li>
          `).join('')}
        </ul>
      `}
    </div>
  `;

  container.innerHTML = html;
}
