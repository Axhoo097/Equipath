// ============================================
// Interview Prep Sandbox — Sprint 10
// Accessible, adaptive, speech-to-text interview practice
// ============================================
import { getCurrentUser, getCurrentUserId } from '../services/auth.js';
import { saveInterviewSession, getInterviewSessions } from '../services/db.js';
import { navigate } from '../router.js';

// ── Question Bank ─────────────────────────────────────────────────
const QUESTION_BANK = {
  behavioral: [
    { q: "Tell me about yourself and why you're interested in this role.", tip: "Use the Present-Past-Future structure: current role → background → why this job.", star: false },
    { q: "Describe a time you had to learn a new skill quickly under pressure.", tip: "Use STAR: Situation → Task → Action → Result.", star: true },
    { q: "How do you handle working with a difficult colleague or manager?", tip: "Focus on empathy, communication, and positive outcome.", star: true },
    { q: "What is your greatest professional achievement?", tip: "Quantify results where possible. Numbers are compelling.", star: true },
    { q: "Tell me about a time you failed. What did you learn?", tip: "Employers want growth mindset. Own the failure, show the lesson.", star: true },
    { q: "How do you prioritize tasks when everything feels urgent?", tip: "Mention frameworks: Eisenhower matrix, MoSCoW, time-blocking.", star: false },
    { q: "Describe a situation where you had to adapt to a major change at work.", tip: "Emphasize flexibility and resilience.", star: true },
    { q: "What motivates you to do your best at work?", tip: "Align your motivators with the company's mission.", star: false },
  ],
  technical: [
    { q: "Walk me through how you would approach debugging a complex production issue.", tip: "Show systematic thinking: reproduce → isolate → fix → verify → document.", star: false },
    { q: "How do you ensure your code is accessible to users with disabilities?", tip: "Mention WCAG 2.1, ARIA roles, semantic HTML, contrast ratios, keyboard nav.", star: false },
    { q: "Explain a technical decision you made and its trade-offs.", tip: "Show analytical thinking and awareness of alternatives.", star: true },
    { q: "How do you stay up to date with changes in your field?", tip: "List specific sources: blogs, conferences, communities, side projects.", star: false },
    { q: "Describe your experience with version control and code review.", tip: "Mention Git workflows, PR practices, constructive feedback culture.", star: false },
  ],
  situational: [
    { q: "If you discovered a critical bug just before a product launch, what would you do?", tip: "Show risk assessment, communication, and decisive action.", star: false },
    { q: "How would you handle a situation where your manager gave you conflicting instructions?", tip: "Emphasize clarification, transparency, and documentation.", star: false },
    { q: "Imagine a client is unhappy with your work. How do you respond?", tip: "Empathy first, understand their view, propose solutions.", star: false },
    { q: "You're given a project with an impossible deadline. What do you do?", tip: "Show scope management skills and stakeholder communication.", star: false },
  ],
  accessibility: [
    { q: "How would you request reasonable workplace accommodations for your disability?", tip: "Be direct but professional. Focus on what you need to do your best work.", star: false },
    { q: "Can you work in a standard office environment, or do you require specific adaptations?", tip: "Prepare a clear, confident answer about your specific needs.", star: false },
    { q: "How do you handle situations where accessibility tools aren't available?", tip: "Show your problem-solving and adaptability.", star: false },
    { q: "What tools or assistive technologies do you use to maximize your productivity?", tip: "Name specific tools. Show you're proactive about your own success.", star: false },
  ],
};

const CATEGORIES = Object.keys(QUESTION_BANK);

// ── AI Feedback Engine ────────────────────────────────────────────
function generateAIFeedback(transcript, question, tipText) {
  const words = transcript.trim().split(/\s+/).length;
  const sentences = transcript.split(/[.!?]+/).filter(Boolean).length;
  const hasNumbers = /\d+/.test(transcript);
  const hasStar = /situation|task|action|result|when i|i decided|the outcome/i.test(transcript);
  const fillerCount = (transcript.match(/\b(um|uh|like|you know|basically|literally|actually)\b/gi) || []).length;
  const avgSentenceLen = words / Math.max(sentences, 1);

  const score = Math.min(100, Math.max(20,
    (words >= 80 ? 20 : Math.round((words / 80) * 20)) +
    (hasStar ? 25 : 0) +
    (hasNumbers ? 15 : 0) +
    (fillerCount < 3 ? 20 : fillerCount < 6 ? 10 : 0) +
    (avgSentenceLen < 25 ? 20 : avgSentenceLen < 35 ? 10 : 5)
  ));

  const strengths = [];
  const improvements = [];

  if (words >= 80) strengths.push('Good answer length — detailed and substantive.');
  else improvements.push(`Your answer is a bit short (${words} words). Aim for at least 80-120 words.`);

  if (hasStar) strengths.push('Great structure! You used the STAR method effectively.');
  else if (question.star) improvements.push('Try using the STAR method: Situation, Task, Action, Result.');

  if (hasNumbers) strengths.push('Nice work including specific numbers — this makes your answer compelling.');
  else improvements.push('Add specific metrics or numbers to quantify your impact (e.g., "improved by 30%").');

  if (fillerCount === 0) strengths.push('Excellent — no filler words detected!');
  else if (fillerCount < 3) strengths.push(`Only ${fillerCount} filler word(s) — very clean delivery.`);
  else improvements.push(`Detected ${fillerCount} filler words (um, uh, like...). Practice pausing instead.`);

  if (avgSentenceLen < 25) strengths.push('Clear, concise sentences — easy for the interviewer to follow.');
  else improvements.push('Try breaking up long sentences for clarity.');

  return { score, strengths, improvements, tipText, wordCount: words };
}

// ── Timer ─────────────────────────────────────────────────────────
let timerInterval = null;
let elapsed = 0;

function startTimer() {
  elapsed = 0;
  clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    elapsed++;
    const el = document.getElementById('interview-timer');
    if (el) el.textContent = formatTime(elapsed);
  }, 1000);
}

function stopTimer() {
  clearInterval(timerInterval);
  timerInterval = null;
}

function formatTime(secs) {
  const m = String(Math.floor(secs / 60)).padStart(2, '0');
  const s = String(secs % 60).padStart(2, '0');
  return `${m}:${s}`;
}

// ── Page State ────────────────────────────────────────────────────
let currentCategory = 'behavioral';
let currentIndex = 0;
let questions = [];
let isRecording = false;
let recognition = null;
let finalTranscript = '';
let sessionAnswers = [];

function shuffleQuestions(cat) {
  const q = [...QUESTION_BANK[cat]];
  for (let i = q.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [q[i], q[j]] = [q[j], q[i]];
  }
  return q;
}

// ── Render ─────────────────────────────────────────────────────────
export function renderInterviewSandbox(container) {
  const user = getCurrentUser();
  if (!user || user.role !== 'jobseeker') { navigate('/login'); return; }

  const userId = getCurrentUserId();
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const isSpeechSupported = !!SpeechRecognition;

  // Reset state
  currentCategory = 'behavioral';
  currentIndex = 0;
  questions = shuffleQuestions(currentCategory);
  isRecording = false;
  finalTranscript = '';
  sessionAnswers = [];
  stopTimer();

  if (isSpeechSupported) {
    recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) finalTranscript += event.results[i][0].transcript + ' ';
        else interim += event.results[i][0].transcript;
      }
      const el = document.getElementById('sandbox-transcript');
      if (el) {
        el.innerHTML = `<strong>${finalTranscript}</strong><span style="opacity:0.6"> ${interim}</span>`;
      }
    };

    recognition.onerror = (e) => {
      console.error('Speech error:', e.error);
      stopRecording();
      const statusEl = document.getElementById('recording-status');
      if (statusEl) statusEl.innerHTML = `<span class="tag tag-danger">Mic error: ${e.error}. Check browser permissions.</span>`;
    };

    recognition.onend = () => {
      if (isRecording) { try { recognition.start(); } catch (_) {} }
    };
  }

  const pastSessions = getInterviewSessions(userId);

  container.innerHTML = buildHTML(user, isSpeechSupported, pastSessions);
  attachEvents(container, user, userId, isSpeechSupported, pastSessions);
}

// ── HTML Builder ──────────────────────────────────────────────────
function buildHTML(user, isSpeechSupported, pastSessions) {
  const catTabs = CATEGORIES.map(cat => `
    <button class="category-tab ${cat === currentCategory ? 'active' : ''}"
            data-cat="${cat}" aria-pressed="${cat === currentCategory}">
      ${categoryIcon(cat)} ${capitalize(cat)}
    </button>
  `).join('');

  const q = questions[currentIndex];

  return `
    <div class="container py-xl" style="max-width:1100px">
      <!-- Header -->
      <header class="mb-lg" style="display:flex;align-items:flex-start;justify-content:space-between;flex-wrap:wrap;gap:var(--space-4)">
        <div>
          <h1>🎙 Interview Prep Sandbox</h1>
          <p class="text-secondary" style="max-width:520px">
            Practice real interview questions with live speech-to-text and AI feedback. 
            Tailored for accessible, inclusive hiring.
          </p>
        </div>
        <div class="card" style="padding:var(--space-3) var(--space-5);display:flex;align-items:center;gap:var(--space-4);min-width:200px">
          <div style="text-align:center">
            <div style="font-size:var(--font-size-xl);font-weight:700;color:var(--color-primary)" id="interview-timer">00:00</div>
            <div style="font-size:var(--font-size-xs);color:var(--color-text-secondary)">Answer Time</div>
          </div>
          <div style="text-align:center">
            <div style="font-size:var(--font-size-xl);font-weight:700;color:var(--color-accent)" id="question-counter">1 / ${questions.length}</div>
            <div style="font-size:var(--font-size-xs);color:var(--color-text-secondary)">Progress</div>
          </div>
          <div style="text-align:center">
            <div style="font-size:var(--font-size-xl);font-weight:700;color:var(--color-success)" id="session-score-display">—</div>
            <div style="font-size:var(--font-size-xs);color:var(--color-text-secondary)">Avg Score</div>
          </div>
        </div>
      </header>

      <!-- Category Tabs -->
      <div class="category-tabs mb-6" role="group" aria-label="Question category">
        ${catTabs}
      </div>

      <!-- Progress Bar -->
      <div class="progress-bar mb-6" style="height:6px" aria-hidden="true">
        <div class="progress-bar-fill" id="question-progress" style="width:${((currentIndex + 1) / questions.length) * 100}%;transition:width 0.4s ease"></div>
      </div>

      <!-- Main Grid -->
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-6)">

        <!-- LEFT: Question Panel -->
        <div style="display:flex;flex-direction:column;gap:var(--space-4)">
          <!-- Question Card -->
          <div class="card" id="question-card" style="border-left:4px solid var(--color-primary);min-height:180px">
            <div style="display:flex;align-items:center;gap:var(--space-2);margin-bottom:var(--space-3)">
              <span class="tag" style="background:var(--color-primary);color:white;font-size:var(--font-size-xs)">${categoryIcon(currentCategory)} ${capitalize(currentCategory)}</span>
              ${q.star ? '<span class="tag tag-warning" style="font-size:var(--font-size-xs)">⭐ STAR Method</span>' : ''}
            </div>
            <h2 id="current-question" style="font-size:var(--font-size-lg);line-height:1.5;color:var(--color-text)">
              "${q.q}"
            </h2>
          </div>

          <!-- Tip Card -->
          <div class="card card-gradient" id="tip-card" style="padding:var(--space-4)">
            <div style="display:flex;align-items:center;gap:var(--space-2);margin-bottom:var(--space-2)">
              <span style="font-size:1.2em">💡</span>
              <strong style="font-size:var(--font-size-sm);color:var(--color-primary)">Interview Tip</strong>
            </div>
            <p id="current-tip" style="font-size:var(--font-size-sm);color:var(--color-text-secondary);line-height:1.6">${q.tip}</p>
          </div>

          <!-- Controls -->
          <div class="card" style="padding:var(--space-4)">
            <div style="display:flex;gap:var(--space-3);flex-wrap:wrap;align-items:center;margin-bottom:var(--space-3)">
              ${isSpeechSupported ? `
                <button id="record-btn" class="btn btn-primary" aria-label="Toggle voice recording" style="flex:1;min-width:160px">
                  🎤 Start Answering
                </button>
              ` : `
                <div class="tag tag-warning" style="flex:1">No mic API in this browser — type below instead.</div>
              `}
              <button id="skip-btn" class="btn btn-ghost" title="Next question">↻ Next</button>
            </div>

            ${!isSpeechSupported ? `
              <textarea id="typed-answer" class="form-input" rows="4" placeholder="Type your answer here..."
                style="width:100%;resize:vertical;font-size:var(--font-size-sm)"></textarea>
            ` : ''}

            <div id="recording-status" aria-live="assertive" style="min-height:28px"></div>
          </div>

          <!-- Navigation -->
          <div style="display:flex;gap:var(--space-3)">
            <button id="prev-btn" class="btn btn-outline btn-sm" style="flex:1" ${currentIndex === 0 ? 'disabled' : ''}>← Prev</button>
            <button id="analyze-btn" class="btn btn-secondary btn-sm" style="flex:2" ${!finalTranscript.trim() ? 'disabled' : ''}>
              🧠 Analyze My Answer
            </button>
            <button id="next-btn" class="btn btn-outline btn-sm" style="flex:1">Next →</button>
          </div>
        </div>

        <!-- RIGHT: Transcript + Feedback -->
        <div style="display:flex;flex-direction:column;gap:var(--space-4)">
          <!-- Live Transcript -->
          <div class="card" style="flex:1">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:var(--space-3)">
              <h3 style="font-size:var(--font-size-base);margin:0">📝 Live Transcript</h3>
              <button id="clear-btn" class="btn btn-ghost btn-sm">Clear</button>
            </div>
            <div
              id="sandbox-transcript"
              role="log"
              aria-live="polite"
              aria-label="Live speech transcript"
              style="min-height:160px;background:rgba(0,0,0,0.08);border-radius:8px;padding:var(--space-4);font-size:var(--font-size-base);line-height:1.7;border:1px solid var(--color-border)"
            >
              <em style="color:var(--color-text-secondary)">Your spoken or typed answer will appear here…</em>
            </div>
            <div style="display:flex;justify-content:space-between;margin-top:var(--space-2)">
              <span id="word-count" style="font-size:var(--font-size-xs);color:var(--color-text-secondary)">0 words</span>
              <span style="font-size:var(--font-size-xs);color:var(--color-text-secondary)">
                ${isSpeechSupported ? '🎤 Speech-to-text enabled' : '⌨️ Type your answer on the left'}
              </span>
            </div>
          </div>

          <!-- AI Feedback Panel (hidden until used) -->
          <div id="feedback-panel" class="card" style="display:none;border-left:4px solid var(--color-secondary)">
            <h3 style="margin-bottom:var(--space-4);display:flex;align-items:center;gap:var(--space-2)">
              🤖 AI Feedback <span id="feedback-score-badge" class="score-badge high" style="width:auto;height:auto;padding:2px 10px;font-size:var(--font-size-sm)">—</span>
            </h3>
            <div id="feedback-strengths" style="margin-bottom:var(--space-3)"></div>
            <div id="feedback-improvements"></div>
            <div style="margin-top:var(--space-4);padding-top:var(--space-3);border-top:1px solid var(--color-border)">
              <button id="save-answer-btn" class="btn btn-primary btn-sm" style="width:100%">💾 Save Answer & Continue</button>
            </div>
          </div>

          <!-- Accessibility Mode Panel -->
          <div class="card card-gradient" style="padding:var(--space-4)">
            <h3 style="font-size:var(--font-size-sm);margin-bottom:var(--space-3)">♿ Accessibility Adaptations</h3>
            <div style="display:flex;flex-wrap:wrap;gap:var(--space-2)">
              <button id="font-up-btn" class="btn btn-ghost btn-sm" title="Increase font size" aria-label="Increase transcript font size">A+</button>
              <button id="font-down-btn" class="btn btn-ghost btn-sm" title="Decrease font size" aria-label="Decrease transcript font size">A−</button>
              <button id="high-contrast-btn" class="btn btn-ghost btn-sm" aria-label="Toggle high contrast mode">◐ Contrast</button>
              <button id="read-question-btn" class="btn btn-ghost btn-sm" aria-label="Read question aloud">🔊 Read Aloud</button>
              <button id="extra-time-btn" class="btn btn-ghost btn-sm" aria-label="Enable extra time mode">⏱ Extra Time</button>
            </div>
            <p id="a11y-status" style="font-size:var(--font-size-xs);color:var(--color-text-secondary);margin-top:var(--space-2)"></p>
          </div>
        </div>
      </div>

      <!-- Session History -->
      ${pastSessions.length > 0 ? `
        <section class="mt-8">
          <h2 class="mb-4">📊 Your Past Sessions</h2>
          <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:var(--space-4)">
            ${pastSessions.slice(0, 4).map(s => `
              <div class="card" style="padding:var(--space-4)">
                <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:var(--space-2)">
                  <strong style="font-size:var(--font-size-sm)">${s.category ? capitalize(s.category) : 'Mixed'} Session</strong>
                  <span class="score-badge ${s.avgScore >= 70 ? 'high' : s.avgScore >= 40 ? 'medium' : 'low'}"
                        style="width:auto;height:auto;padding:2px 8px;font-size:0.7rem">
                    Avg ${s.avgScore || 0}%
                  </span>
                </div>
                <p style="font-size:var(--font-size-xs);color:var(--color-text-secondary)">
                  ${s.questionsAnswered || 0} questions · ${new Date(s.savedAt).toLocaleDateString()}
                </p>
              </div>
            `).join('')}
          </div>
        </section>
      ` : ''}
    </div>
  `;
}

// ── Event Wiring ──────────────────────────────────────────────────
function attachEvents(container, user, userId, isSpeechSupported, pastSessions) {
  let transcriptFontSize = 16; // px
  let extraTimeMode = false;

  function refreshQuestion() {
    const q = questions[currentIndex];
    const total = questions.length;

    document.getElementById('current-question').textContent = `"${q.q}"`;
    document.getElementById('current-tip').textContent = q.tip;
    document.getElementById('question-counter').textContent = `${currentIndex + 1} / ${total}`;
    document.getElementById('question-progress').style.width = `${((currentIndex + 1) / total) * 100}%`;

    // Reset
    finalTranscript = '';
    const transcriptEl = document.getElementById('sandbox-transcript');
    if (transcriptEl) transcriptEl.innerHTML = '<em style="color:var(--color-text-secondary)">Your answer will appear here…</em>';

    const wordCountEl = document.getElementById('word-count');
    if (wordCountEl) wordCountEl.textContent = '0 words';

    document.getElementById('feedback-panel').style.display = 'none';
    document.getElementById('analyze-btn').disabled = true;

    const prevBtn = document.getElementById('prev-btn');
    if (prevBtn) prevBtn.disabled = currentIndex === 0;

    stopTimer();
    elapsed = 0;
    const timerEl = document.getElementById('interview-timer');
    if (timerEl) timerEl.textContent = '00:00';
  }

  function stopRecording() {
    isRecording = false;
    stopTimer();
    const btn = document.getElementById('record-btn');
    const status = document.getElementById('recording-status');
    if (btn) { btn.textContent = '🎤 Start Answering'; btn.classList.replace('btn-danger', 'btn-primary'); }
    if (status) status.innerHTML = '';
    if (recognition) { try { recognition.stop(); } catch (_) {} }

    // Enable analyze if there's content
    const words = finalTranscript.trim().split(/\s+/).filter(Boolean).length;
    const analyzeBtn = document.getElementById('analyze-btn');
    if (analyzeBtn) analyzeBtn.disabled = words < 5;
  }

  // Record button
  document.getElementById('record-btn')?.addEventListener('click', () => {
    if (isRecording) {
      stopRecording();
    } else {
      isRecording = true;
      finalTranscript = '';
      const btn = document.getElementById('record-btn');
      const status = document.getElementById('recording-status');
      if (btn) { btn.textContent = '⏹ Stop Answering'; btn.classList.replace('btn-primary', 'btn-danger'); }
      if (status) status.innerHTML = '<span class="tag tag-success">🔴 Recording… speak now!</span>';
      startTimer();
      if (recognition) { try { recognition.start(); } catch (_) {} }

      // Update word count live
      const liveCount = setInterval(() => {
        if (!isRecording) { clearInterval(liveCount); return; }
        const words = finalTranscript.trim().split(/\s+/).filter(Boolean).length;
        const el = document.getElementById('word-count');
        if (el) el.textContent = `${words} word${words !== 1 ? 's' : ''}`;
        const analyzeBtn = document.getElementById('analyze-btn');
        if (analyzeBtn) analyzeBtn.disabled = words < 5;
      }, 500);
    }
  });

  // Skip / Prev / Next
  document.getElementById('skip-btn')?.addEventListener('click', () => {
    stopRecording();
    currentIndex = (currentIndex + 1) % questions.length;
    refreshQuestion();
  });

  document.getElementById('prev-btn')?.addEventListener('click', () => {
    if (currentIndex > 0) { stopRecording(); currentIndex--; refreshQuestion(); }
  });

  document.getElementById('next-btn')?.addEventListener('click', () => {
    stopRecording();
    currentIndex = (currentIndex + 1) % questions.length;
    refreshQuestion();
  });

  // Clear
  document.getElementById('clear-btn')?.addEventListener('click', () => {
    finalTranscript = '';
    const el = document.getElementById('sandbox-transcript');
    if (el) el.innerHTML = '<em style="color:var(--color-text-secondary)">Cleared. Start speaking…</em>';
    document.getElementById('word-count').textContent = '0 words';
    document.getElementById('analyze-btn').disabled = true;
    document.getElementById('feedback-panel').style.display = 'none';
  });

  // Category tabs
  container.querySelectorAll('.category-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      stopRecording();
      currentCategory = tab.dataset.cat;
      currentIndex = 0;
      questions = shuffleQuestions(currentCategory);
      container.querySelectorAll('.category-tab').forEach(t => { t.classList.remove('active'); t.setAttribute('aria-pressed', 'false'); });
      tab.classList.add('active');
      tab.setAttribute('aria-pressed', 'true');
      refreshQuestion();
    });
  });

  // AI Analyze
  document.getElementById('analyze-btn')?.addEventListener('click', () => {
    let text = finalTranscript.trim();
    if (!text) {
      const typedEl = document.getElementById('typed-answer');
      text = typedEl ? typedEl.value.trim() : '';
    }
    if (text.length < 10) {
      alert('Please provide a longer answer before analyzing!');
      return;
    }
    stopRecording();

    const q = questions[currentIndex];
    const { score, strengths, improvements, wordCount } = generateAIFeedback(text, q, q.tip);

    const panel = document.getElementById('feedback-panel');
    const badge = document.getElementById('feedback-score-badge');
    const strDiv = document.getElementById('feedback-strengths');
    const impDiv = document.getElementById('feedback-improvements');

    badge.textContent = `${score}/100`;
    badge.className = `score-badge ${score >= 70 ? 'high' : score >= 40 ? 'medium' : 'low'}`;
    badge.style.cssText = 'width:auto;height:auto;padding:2px 10px;font-size:var(--font-size-sm)';

    strDiv.innerHTML = strengths.length ? `
      <p style="font-size:var(--font-size-sm);font-weight:600;color:var(--color-success);margin-bottom:var(--space-2)">✅ Strengths</p>
      <ul style="list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:var(--space-1)">
        ${strengths.map(s => `<li style="font-size:var(--font-size-sm);padding-left:var(--space-3)">• ${s}</li>`).join('')}
      </ul>
    ` : '';

    impDiv.innerHTML = improvements.length ? `
      <p style="font-size:var(--font-size-sm);font-weight:600;color:var(--color-warning);margin-top:var(--space-3);margin-bottom:var(--space-2)">💡 To Improve</p>
      <ul style="list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:var(--space-1)">
        ${improvements.map(i => `<li style="font-size:var(--font-size-sm);padding-left:var(--space-3)">• ${i}</li>`).join('')}
      </ul>
    ` : '';

    panel.style.display = 'block';
    panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    // Update session avg
    sessionAnswers.push({ question: q.q, score, wordCount, time: elapsed });
    const avg = Math.round(sessionAnswers.reduce((a, b) => a + b.score, 0) / sessionAnswers.length);
    const avgEl = document.getElementById('session-score-display');
    if (avgEl) avgEl.textContent = `${avg}%`;
  });

  // Save answer
  document.getElementById('save-answer-btn')?.addEventListener('click', () => {
    const avg = sessionAnswers.length
      ? Math.round(sessionAnswers.reduce((a, b) => a + b.score, 0) / sessionAnswers.length)
      : 0;
    saveInterviewSession(userId, {
      category: currentCategory,
      questionsAnswered: sessionAnswers.length,
      avgScore: avg,
      answers: sessionAnswers,
    });
    // Move to next
    currentIndex = (currentIndex + 1) % questions.length;
    refreshQuestion();
    document.getElementById('feedback-panel').style.display = 'none';
  });

  // Typed answer sync
  document.getElementById('typed-answer')?.addEventListener('input', (e) => {
    finalTranscript = e.target.value;
    const words = finalTranscript.trim().split(/\s+/).filter(Boolean).length;
    const el = document.getElementById('word-count');
    if (el) el.textContent = `${words} word${words !== 1 ? 's' : ''}`;
    document.getElementById('analyze-btn').disabled = words < 5;
    // Mirror to transcript panel
    const transcriptEl = document.getElementById('sandbox-transcript');
    if (transcriptEl) transcriptEl.innerHTML = `<span>${e.target.value}</span>`;
  });

  // Accessibility controls
  document.getElementById('font-up-btn')?.addEventListener('click', () => {
    transcriptFontSize = Math.min(28, transcriptFontSize + 2);
    const el = document.getElementById('sandbox-transcript');
    if (el) el.style.fontSize = transcriptFontSize + 'px';
    setA11yStatus(`Text size: ${transcriptFontSize}px`);
  });

  document.getElementById('font-down-btn')?.addEventListener('click', () => {
    transcriptFontSize = Math.max(12, transcriptFontSize - 2);
    const el = document.getElementById('sandbox-transcript');
    if (el) el.style.fontSize = transcriptFontSize + 'px';
    setA11yStatus(`Text size: ${transcriptFontSize}px`);
  });

  document.getElementById('high-contrast-btn')?.addEventListener('click', () => {
    const body = document.documentElement;
    const current = body.getAttribute('data-theme');
    const next = current === 'high-contrast' ? 'dark' : 'high-contrast';
    body.setAttribute('data-theme', next);
    setA11yStatus(`Theme: ${next}`);
  });

  document.getElementById('read-question-btn')?.addEventListener('click', () => {
    const q = questions[currentIndex];
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(q.q);
      utter.rate = 0.9;
      window.speechSynthesis.speak(utter);
      setA11yStatus('Reading question aloud…');
    } else {
      setA11yStatus('Text-to-speech not supported in this browser.');
    }
  });

  document.getElementById('extra-time-btn')?.addEventListener('click', () => {
    extraTimeMode = !extraTimeMode;
    setA11yStatus(extraTimeMode ? '⏱ Extra time mode ON — no time pressure!' : '⏱ Extra time mode OFF');
  });

  function setA11yStatus(msg) {
    const el = document.getElementById('a11y-status');
    if (el) el.textContent = msg;
  }
}

// ── Helpers ───────────────────────────────────────────────────────
function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function categoryIcon(cat) {
  return { behavioral: '🧠', technical: '💻', situational: '🎯', accessibility: '♿' }[cat] || '❓';
}
