/**
 * Page 2 Controller: Skill Gap Analyzer, Charts & Ordered Learning Roadmap.
 */
(async function () {
  const Storage = window.SkillPathStorage;
  const Engine = window.SkillPathEngine;
  const Nav = window.SkillPathNav;
  const Chart = window.SkillPathChart;
  const { escapeHtml } = Nav;

  let appState = await Storage.initState();
  let chartMode = "radar";

  const emptyEl = document.getElementById("analyzer-empty");
  const contentEl = document.getElementById("analyzer-content");
  const loadSampleBtn = document.getElementById("btn-load-sample-analyzer");
  const chartMount = document.getElementById("skill-chart-mount");
  const toggleButtons = Array.from(document.querySelectorAll("[data-chart-mode]"));

  function renderChart(roadmap) {
    if (chartMode === "radar" && roadmap.length >= 3) {
      Chart.renderRadarChart(chartMount, roadmap);
    } else {
      Chart.renderBarChart(chartMount, roadmap);
    }
  }

  function renderPage() {
    Nav.render({
      activePage: "analyzer",
      state: appState,
      onReset: () => {
        appState = { profile: null, courseProgress: {}, updatedAt: null };
        renderPage();
      },
    });

    if (!appState.profile) {
      emptyEl.hidden = false;
      contentEl.hidden = true;
      return;
    }

    const analysis = Engine.analyzeProfile(
      appState.profile,
      appState.courseProgress
    );
    if (!analysis) {
      emptyEl.hidden = false;
      contentEl.hidden = true;
      return;
    }

    emptyEl.hidden = true;
    contentEl.hidden = false;

    const { profile } = appState;

    // Header
    document.getElementById("analyzer-role-badge").textContent =
      `Target Role · ${analysis.role.name}`;
    document.getElementById("analyzer-title").textContent =
      `${profile.name}'s Skill Gap Analysis`;
    document.getElementById("analyzer-subtitle").textContent =
      `${profile.backgroundDetail || "Learner"} aiming for ${analysis.role.name} · ${analysis.role.tagline}`;

    // Overall Progress Bar
    document.getElementById("overall-progress-headline").textContent =
      `${analysis.masteredSkillsCount} of ${analysis.totalSkillsCount} target skills ready`;
    document.getElementById("overall-progress-pct").textContent =
      `${analysis.roadmapProgressPct}%`;
    document.getElementById("overall-progress-fill").style.width =
      `${analysis.roadmapProgressPct}%`;
    document.getElementById("overall-progress-caption").textContent =
      analysis.remainingSkills.length === 0
        ? "All required role skills are Strong or Completed ✓!"
        : `${analysis.remainingSkills.length} skill${analysis.remainingSkills.length === 1 ? "" : "s"} remaining — complete their courses on the Courses page to update this roadmap live.`;

    // KPI Cards
    document.getElementById("kpi-match-pct").textContent =
      `${analysis.skillMatchPct}%`;
    document.getElementById("kpi-match-sub").textContent =
      `Weighted skill match for ${analysis.role.name}`;

    document.getElementById("kpi-breakdown-main").textContent =
      `${analysis.strongCount} Strong`;
    document.getElementById("kpi-breakdown-sub").textContent =
      `${analysis.needsImprovementCount} Needs Work · ${analysis.missingCount} Missing`;

    document.getElementById("kpi-time-weeks").textContent =
      analysis.estimatedWeeks === 0 ? "Goal Met!" : `~${analysis.estimatedWeeks} wks`;
    document.getElementById("kpi-time-sub").textContent =
      analysis.totalRemainingHours === 0
        ? "0 learning hours left"
        : `${analysis.totalRemainingHours} hrs left (${analysis.minWeeks}–${analysis.maxWeeks} wks range)`;

    document.getElementById("kpi-weekly-pace").textContent =
      analysis.hoursOption.label.replace("/week", "/wk");
    document.getElementById("kpi-exp-label").textContent =
      `${analysis.expOption.label} experience`;

    // AI Advisor Insight
    document.getElementById("ai-headline").textContent =
      analysis.advisorSummary.headline;
    document.getElementById("ai-message").textContent =
      analysis.advisorSummary.message;

    // Chart
    renderChart(analysis.roadmap);

    // Visual Learning Roadmap
    document.getElementById("roadmap-step-max").textContent =
      String(analysis.totalSkillsCount);

    const roadmapList = document.getElementById("visual-roadmap-list");
    roadmapList.innerHTML = analysis.roadmap
      .map((item) => {
        const displaySkill = item.completedViaCourses
          ? `${item.skillName} ✓`
          : item.skillName;
        const pct = Math.min(
          100,
          Math.round((item.effectiveLevel / item.requiredLevel) * 100)
        );
        const actionLink =
          item.status === "strong"
            ? `<span class="roadmap-done-note">${item.completedViaCourses ? "Completed via courses ✓" : "Target proficiency met"}</span>`
            : `<a href="courses.html#skill-${escapeHtml(item.skillId)}" class="roadmap-course-link">Learn ${escapeHtml(item.skillName)} (${item.remainingHours}h est.) →</a>`;

        return `
          <li class="roadmap-step status-border-${item.status}">
            <div class="roadmap-step-rail">
              <span class="roadmap-step-num status-dot-${item.status}">
                ${item.status === "strong" ? "✓" : item.stepNumber}
              </span>
            </div>
            <div class="roadmap-step-body">
              <div class="roadmap-step-top">
                <div class="roadmap-title-group">
                  <span class="roadmap-step-tag">Step ${item.stepNumber}</span>
                  <h3>${escapeHtml(displaySkill)}</h3>
                </div>
                <span class="status-pill status-${item.status}">${escapeHtml(item.statusLabel)}</span>
              </div>
              <p class="roadmap-why">${escapeHtml(item.why)}</p>
              <div class="roadmap-meter-row">
                <div class="roadmap-mini-track">
                  <div class="roadmap-mini-fill status-${item.status}" style="width: ${pct}%"></div>
                </div>
                <span class="roadmap-levels">
                  Level <strong>${item.effectiveLevel}</strong> / ${item.requiredLevel} required
                </span>
                ${actionLink}
              </div>
            </div>
          </li>
        `;
      })
      .join("");

    document.getElementById("roadmap-cta-note").textContent =
      analysis.remainingSkills.length === 0
        ? "Want extra practice? Review your completed courses or browse bonus materials."
        : `Ready to close your ${analysis.remainingSkills.length} remaining skill gap${analysis.remainingSkills.length === 1 ? "" : "s"}? Start with Step ${analysis.remainingSkills[0].stepNumber}: ${analysis.remainingSkills[0].skillName}.`;
  }

  toggleButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      chartMode = btn.getAttribute("data-chart-mode");
      toggleButtons.forEach((b) =>
        b.classList.toggle("is-active", b === btn)
      );
      const analysis = Engine.analyzeProfile(
        appState.profile,
        appState.courseProgress
      );
      if (analysis) renderChart(analysis.roadmap);
    });
  });

  if (loadSampleBtn) {
    loadSampleBtn.addEventListener("click", async () => {
      const sample = Nav.getSampleProfile();
      appState = await Storage.saveProfile(sample);
      Nav.showToast("Loaded sample AI/ML Engineer profile!", "success");
      renderPage();
    });
  }

  renderPage();
})();
