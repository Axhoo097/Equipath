# 🌟 Equipath: Disability-Inclusive Job-Matching Platform

Welcome to **Equipath**! This is a comprehensive, full-stack application designed specifically to bridge the gap between talented individuals with disabilities and inclusive employers. Equipath provides an accessible, dignified, and highly intelligent job-seeking experience.

## ✨ Project Overview

Traditional job boards often fail to account for the physical, cognitive, and sensory accessibility needs of their users. Equipath changes this by matching candidates not only by their technical skills but also by their required physical accommodations. 

Built through an iterative 3-phase process, Equipath has evolved from a functional prototype into a production-ready system integrated with modern databases, natural language processing, and AI-driven interview tools.

---

## 🎯 Key Features

### 1. 🤝 Inclusive Job Matching Engine
- Translates standard job post skills and requirements against user capabilities.
- Analyzes mobility, vision, hearing, and cognitive demands of roles dynamically.
- Provides a detailed "Match Percentage" evaluating both skills and accessibility readiness.

### 2. 🧠 Advanced Skill Planner (Phase 3)
- NLP-driven analysis that compares the candidate's existing skills against job requirements to identify gaps.
- Calculates an exact match percentage, displaying what skills are **Matched**, **Partial**, or **Missing**.
- Highly personalized, priority-based online learning course recommendations to help fill gaps.
- A robust Progress Tracking dashboard for candidates to manage their ongoing education.

### 3. 🎙️ Accessible Interview Sandbox
- A specialized staging ground for candidates to practice job interviews.
- Integrated **Speech-to-Text** capabilities allowing candidates to confidently answer simulated prompts.
- AI-driven, actionable feedback to help candidates improve in a safe, non-judgmental environment.

### 4. 📊 Employer Analytics Dashboard
- Provides employers with actionable insights into the accessibility readiness of their job posts.
- Helps companies visualize how easily candidates with varying needs can interact with their listings, creating a push for improved physical and digital inclusion.

### 5. 🔒 Secure Authentication & Data
- Real-time cloud database and robust user authentication seamlessly integrated.
- Stores historical candidate profiles, employer job posts, reading assignments, and interview progress securely.

---

## 💻 Tech Stack

- **Frontend & Tooling**: Vanilla JS, HTML5, Vanilla CSS, Vite
- **Architecture**: ES Modules (Components, Pages, Services structure)
- **Backend/Database**: Firebase (Firestore DB, Authentication)
- **Machine Learning**: Custom NLP logic for semantic skill-gap processing.
- **Accessibility Integration**: Web Content Accessibility Guidelines (WCAG) compliant, optimized for screen-readers, distinct aria-labels, and dynamic toasts.

---

## 📂 Project Structure

```text
equipath/
├── package.json          # Project metadata, dependencies, and Vite scripts
├── vite.config.js        # Bundler configuration
├── src/
│   ├── main.js           # Application entry point
│   ├── router.js         # Single Page Application routing logic
│   ├── components/       # Reusable UI fragments (Nav, Footer, Modals)
│   ├── pages/            # View controllers for each major route
│   │   ├── analytics.js        # Employer accessibility dashboard
│   │   ├── interview-sandbox.js# Audio-driven prep environment
│   │   ├── post-job.js         # Inclusive job posting form
│   │   ├── skill-gap.js        # Interactive learning planner page
│   │   └── ...                 # (dashboard, login, jobs, profile, etc.)
│   ├── services/         # Core business logic and integrations
│   │   ├── auth.js & db.js     # Firebase cloud integrations
│   │   ├── skill-gap.js        # Engine for skill gap calculation
│   │   ├── nlp.js              # Semantic similarity logic
│   │   └── learning.json       # Curated database of course recommendations
│   ├── styles/           # CSS design system (Variables, Utilities, Grid)
│   └── utils/            # Shared utilities (accessibility.js for screen readers)
```

---

## 🚀 Getting Started Locally

Getting Equipath up and running on your local machine is incredibly simple thanks to Vite.

**1. Clone the Repository:**
\`\`\`bash
git clone https://github.com/your-username/equipath.git
cd equipath
\`\`\`

**2. Install Dependencies:**
\`\`\`bash
npm install
\`\`\`

**3. Start the Development Server:**
\`\`\`bash
npm run dev
\`\`\`

Your application will open seamlessly in your local browser (typically on `http://localhost:5173`). Have fun exploring the app!

---

## 📚 Philosophy & Code Quality

The code inside this repository has been structured heavily around the principle of maintaining readability and beginner-friendly education without sacrificing scale. You will find:
- **Comprehensive File Headers** explaining the real-world utility of each module.
- **Detailed Method Comments** outlining expected inputs/outputs, alongside side-effects.
- **Inline Explanations** of complex ML pre-processing or potential UI boundary edge cases. 

*Thank you for supporting digital inclusion in the workspace.*
