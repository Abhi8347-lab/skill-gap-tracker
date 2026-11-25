/**
 * Shared navigation bar, page stepper, toast feedback, and safe HTML utilities.
 */
window.SkillPathNav = (function () {
  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function showToast(message, tone = "info") {
    let container = document.getElementById("toast-container");
    if (!container) {
      container = document.createElement("div");
      container.id = "toast-container";
      container.className = "toast-container";
      container.setAttribute("aria-live", "polite");
      document.body.appendChild(container);
    }

    const toast = document.createElement("div");
    toast.className = `toast toast-${tone}`;
    toast.textContent = message;
    container.appendChild(toast);

    window.requestAnimationFrame(() => {
      toast.classList.add("is-visible");
    });

    window.setTimeout(() => {
      toast.classList.remove("is-visible");
      window.setTimeout(() => toast.remove(), 250);
    }, 2800);
  }

  function getSampleProfile() {
    return {
      name: "Alex Rivera",
      status: "student",
      backgroundDetail: "Computer Science & Engineering (CSE)",
      targetRole: "ai_ml_engineer",
      selectedSkills: ["git", "sql"],
      skillRatings: {
        git: 3,
        sql: 2,
      },
      experience: "0-1",
      weeklyHours: "5-10",
    };
  }

  function render({ activePage, state, onReset }) {
    const mount = document.getElementById("app-navbar");
    if (!mount) return;

    const profile = state && state.profile ? state.profile : null;
    const analysis =
      profile && window.SkillPathEngine
        ? window.SkillPathEngine.analyzeProfile(profile, state.courseProgress)
        : null;

    const steps = [
      {
        id: "profile",
        num: 1,
        label: "Profile Setup",
        href: "index.html",
        done: Boolean(profile),
      },
      {
        id: "analyzer",
        num: 2,
        label: "Skill Gap Analyzer",
        href: "analyzer.html",
        done: Boolean(analysis && analysis.roadmapProgressPct === 100),
      },
      {
        id: "courses",
        num: 3,
        label: "Courses & Progress",
        href: "courses.html",
        done: Boolean(analysis && analysis.overallCoursePct === 100 && analysis.totalGapCourses > 0),
      },
    ];

    const rolePill = analysis
      ? `<span class="nav-user-pill" title="${escapeHtml(profile.name)}">
          <span class="nav-user-dot"></span>
          <span>${escapeHtml(profile.name.split(/\s+/)[0])} · ${escapeHtml(analysis.role.name)}</span>
        </span>`
      : `<span class="nav-user-pill is-muted">No profile saved yet</span>`;

    const resetBtn = profile
      ? `<button type="button" class="btn-ghost-sm" id="nav-reset-btn" title="Start over with a fresh profile">Reset</button>`
      : "";

    mount.innerHTML = `
      <div class="navbar-inner">
        <a href="index.html" class="brand-link">
          <span class="brand-mark" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
              <path d="M2 17l10 5 10-5"></path>
              <path d="M2 12l10 5 10-5"></path>
            </svg>
          </span>
          <span class="brand-text">
            <strong>SkillPath</strong>
            <span class="brand-badge">AI</span>
          </span>
        </a>

        <nav class="page-stepper" aria-label="Primary flow">
          ${steps
            .map((step, idx) => {
              const isActive = step.id === activePage;
              const cls = [
                "stepper-link",
                isActive ? "is-active" : "",
                step.done ? "is-done" : "",
              ]
                .filter(Boolean)
                .join(" ");
              const badgeContent = step.done && !isActive ? "✓" : String(step.num);
              const connector =
                idx < steps.length - 1
                  ? `<span class="stepper-arrow" aria-hidden="true">→</span>`
                  : "";
              return `
                <a href="${step.href}" class="${cls}" ${isActive ? 'aria-current="page"' : ""}>
                  <span class="stepper-num">${badgeContent}</span>
                  <span class="stepper-label">${escapeHtml(step.label)}</span>
                </a>
                ${connector}
              `;
            })
            .join("")}
        </nav>

        <div class="nav-actions">
          ${rolePill}
          ${resetBtn}
        </div>
      </div>
    `;

    const resetTrigger = document.getElementById("nav-reset-btn");
    if (resetTrigger) {
      resetTrigger.addEventListener("click", async () => {
        if (
          !window.confirm(
            "Reset your saved profile and course progress to start fresh?"
          )
        ) {
          return;
        }
        await window.SkillPathStorage.resetState();
        if (typeof onReset === "function") {
          onReset();
        } else {
          window.location.href = "index.html";
        }
      });
    }
  }

  return {
    escapeHtml,
    showToast,
    getSampleProfile,
    render,
  };
})();
