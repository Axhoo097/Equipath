// ============================================
// Landing Page
// ============================================

export function renderLanding(container) {
  container.innerHTML = `
    <!-- Hero -->
    <section class="hero" aria-labelledby="hero-heading">
      <div class="container">
        <div class="hero-content">
          <h1 id="hero-heading">
            Every Ability,<br/>
            <span style="color:var(--color-accent-light)">Every Opportunity</span>
          </h1>
          <p>
            Equipath connects people with disabilities to meaningful employment through
            intelligent matching, accessible design, and bias-free hiring — powered by
            ability, not limitation.
          </p>
          <div class="hero-cta">
            <a href="#/register" class="btn btn-primary btn-lg" id="cta-get-started">
              Get Started Free →
            </a>
            <a href="#/login" class="btn btn-secondary btn-lg" style="background:rgba(255,255,255,0.1);color:#fff;border-color:rgba(255,255,255,0.3);">
              Sign In
            </a>
          </div>
          <div class="hero-stats" aria-label="Platform statistics">
            <div class="hero-stat">
              <span class="hero-stat-number" aria-label="1 billion persons">1B+</span>
              <span class="hero-stat-label">Persons with Disabilities Worldwide</span>
            </div>
            <div class="hero-stat">
              <span class="hero-stat-number" aria-label="80 percent">80%</span>
              <span class="hero-stat-label">Working-Age PwD Underemployed</span>
            </div>
            <div class="hero-stat">
              <span class="hero-stat-number" aria-label="100 percent">100%</span>
              <span class="hero-stat-label">WCAG Accessible</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Features -->
    <section class="features-section" aria-labelledby="features-heading">
      <div class="container">
        <h2 id="features-heading" class="text-center mb-8">How Equipath Works</h2>
        <div class="grid grid-3">
          <div class="card feature-card" tabindex="0">
            <div class="feature-icon" aria-hidden="true">🎯</div>
            <h3>Ability-Based Matching</h3>
            <p>Our assessment profiles your strengths — not limitations — to match you with roles where you'll thrive.</p>
          </div>
          <div class="card feature-card" tabindex="0">
            <div class="feature-icon" aria-hidden="true">🛡️</div>
            <h3>Bias-Free Hiring</h3>
            <p>Anonymous profiles hide identity cues during screening so employers judge you on skills, not stereotypes.</p>
          </div>
          <div class="card feature-card" tabindex="0">
            <div class="feature-icon" aria-hidden="true">🏆</div>
            <h3>Employer Readiness Scores</h3>
            <p>See which companies truly invest in accessibility and inclusion before you apply.</p>
          </div>
          <div class="card feature-card" tabindex="0">
            <div class="feature-icon" aria-hidden="true">📊</div>
            <h3>Skill Gap Navigator</h3>
            <p>Get personalized learning recommendations to bridge the gap between your skills and dream jobs.</p>
          </div>
          <div class="card feature-card" tabindex="0">
            <div class="feature-icon" aria-hidden="true">♿</div>
            <h3>Fully Accessible</h3>
            <p>Screen-reader optimized, keyboard navigable, high-contrast modes — built for everyone from day one.</p>
          </div>
          <div class="card feature-card" tabindex="0">
            <div class="feature-icon" aria-hidden="true">🔒</div>
            <h3>Privacy First</h3>
            <p>Your disability data is yours. We never share it without your explicit consent. ADA & CRPD compliant.</p>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA -->
    <section class="container text-center" style="padding:var(--space-20) 0" aria-labelledby="cta-heading">
      <h2 id="cta-heading" class="mb-4">Ready to Find Your Perfect Match?</h2>
      <p class="text-secondary mb-8" style="max-width:600px;margin-left:auto;margin-right:auto;">
        Join thousands of job seekers and inclusive employers on Equipath. 
        It's free, accessible, and built with your rights in mind.
      </p>
      <div class="flex justify-center gap-4">
        <a href="#/register" class="btn btn-primary btn-lg">Create Your Profile</a>
        <a href="#/register" class="btn btn-secondary btn-lg">Hire Inclusively</a>
      </div>
    </section>

    <!-- Footer -->
    <footer class="footer" role="contentinfo">
      <div class="container">
        <div class="footer-inner">
          <span class="footer-text">© 2026 Equipath — Inclusive Employment for All</span>
          <ul class="footer-links" aria-label="Footer links">
            <li><a href="#/">Privacy Policy</a></li>
            <li><a href="#/">Accessibility Statement</a></li>
            <li><a href="#/">ADA Compliance</a></li>
          </ul>
        </div>
      </div>
    </footer>
  `;
}
