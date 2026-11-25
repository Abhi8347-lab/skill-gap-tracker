/**
 * Page 2 Controller: Skill Gap Analyzer, Percentage Charts, 6-Week Plan & Roadmap.
 */
(async function () {
  const Storage = window.SkillPathStorage;
  const Engine = window.SkillPathEngine;
  const Nav = window.SkillPathNav;
  const Chart = window.SkillPathChart;
  const { escapeHtml } = Nav;

  let appState = await Storage.initState();
  let chartMode = null;

  const emptyEl = document.getElementById("analyzer-empty");
  const contentEl = document.getElementById("analyzer-content");
  const loadSampleBtn = document.getElementById("btn-load-sample-analyzer");
  const chartMount = document.getElementById("skill-chart-mount");
  const toggleButtons = Array.from(document.querySelectorAll("[data-chart-mode]"));
  const demoTagEl = document.getElementById("analyzer-demo-tag");
  const sixWeekGridEl = document.getElementById("six-week-plan-grid");

  function syncChartToggleUI() {
    toggleButtons.forEach((b) =>
      b.classList.toggle("is-active", b.getAttribute("data-chart-mode") === chartMode)
    );
  }

  function renderChart(roadmap) {
    if (!chartMode) {
      chartMode = roadmap.length <= 4 ? "bar" : "radar";
    }
    syncChartToggleUI();

    if (chartMode === "radar" && roadmap.length >= 3) {
      Chart.renderRadarChart(chartMount, roadmap);
    } else {
      Chart.renderBarChart(chartMount, roadmap);
    }
  }

  function renderSixWeekPlan(analysis) {
    document.getElementById("plan-subtitle").textContent =
      `Built around ${analysis.slotsPerWeek} learning slots/week` +
      (analysis.activePriorities.length
        ? ` · Company priority: ${analysis.activePriorities.join(", ")}`
        : "");

    sixWeekGridEl.innerHTML = analysis.sixWeekPlan
      .map((block, idx) => {
        const priorityBadge = block.priorityTag
          ? `<span class="priority-badge">★ ${escapeHtml(block.priorityTag)}</span>`
          : "";
        return `
          <article class="plan-week-card status-border-${block.status}">
            <div class="plan-week-top">
              <span class="week-pill">Phase ${idx + 1} · ${escapeHtml(block.weeksLabel)}</span>
              ${priorityBadge}
            </div>
            <h3>${escapeHtml(block.title)}</h3>
            <p class="plan-week-target">${escapeHtml(block.targetSummary)}</p>
            <p class="plan-week-desc">${escapeHtml(block.description)}</p>
            <div class="plan-week-footer">
              <span class="slots-chip">🗓 ${escapeHtml(block.slotsLabel)}</span>
              <a href="courses.html#skill-${escapeHtml(block.skillId)}" class="roadmap-course-link">
                Courses →
              </a>
            </div>
          </article>
        `;
      })
      .join("");
  }

  function renderPage() {
    Nav.render({
      activePage: "analyzer",
      state: appState,
      onReset: () => {
        appState = { profile: null, courseProgress: {}, updatedAt: null };
        chartMode = null;
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
    if (demoTagEl) {
      demoTagEl.hidden = !profile.isDemo;
    }

    // Header
    document.getElementById("analyzer-role-badge").textContent =
      `Target Role · ${analysis.role.name}`;
    document.getElementById("analyzer-title").textContent =
      `${profile.name}'s Skill Gap Analysis`;
    const prioritySuffix = analysis.activePriorities.length
      ? ` · Company priority: ${analysis.activePriorities.join(", ")}`
      : "";
    document.getElementById("analyzer-subtitle").textContent =
      `${profile.backgroundDetail || "Learner"} aiming for ${analysis.role.name}${prioritySuffix}`;

    // Overall Progress Bar
    document.getElementById("overall-progress-headline").textContent =
      `${analysis.masteredSkillsCount} of ${analysis.totalSkillsCount} target skills ready`;
    document.getElementById("overall-progress-pct").textContent =
      `${analysis.roadmapProgressPct}%`;
    document.getElementById("overall-progress-fill").style.width =
      `${analysis.roadmapProgressPct}%`;
    document.getElementById("overall-progress-caption").textContent =
      analysis.remainingSkills.length === 0
        ? "All required role skills meet target proficiency ✓!"
        : `${analysis.remainingSkills.length} skill${analysis.remainingSkills.length === 1 ? "" : "s"} below target — complete recommended courses to close the gaps.`;

    // KPI Cards
    document.getElementById("kpi-match-pct").textContent =
      `${analysis.skillMatchPct}%`;
    document.getElementById("kpi-match-sub").textContent =
      `Weighted match vs ${analysis.role.name} targets`;

    document.getElementById("kpi-breakdown-main").textContent =
      `${analysis.strongCount} Strong`;
    document.getElementById("kpi-breakdown-sub").textContent =
      `${analysis.needsImprovementCount} Needs Work · ${analysis.missingCount} Missing`;

    document.getElementById("kpi-time-weeks").textContent =
      analysis.estimatedWeeks === 0
        ? "Goal Met!"
        : `${analysis.estimatedWeeks} Weeks`;
    document.getElementById("kpi-time-sub").textContent =
      analysis.totalRemainingHours === 0
        ? "0 learning hours left"
        : `${analysis.totalRemainingHours} hrs left across ${analysis.sixWeekPlan.length} phases`;

    document.getElementById("kpi-weekly-pace").textContent =
      `${analysis.slotsPerWeek} slots/wk`;
    document.getElementById("kpi-exp-label").textContent =
      analysis.activePriorities.length
        ? `Priority: ${analysis.activePriorities[0]}`
        : `${analysis.expOption.label} experience`;

    // AI Advisor Insight
    document.getElementById("ai-headline").textContent =
      analysis.advisorSummary.headline;
    document.getElementById("ai-message").textContent =
      analysis.advisorSummary.message;

    // 6-Week Plan
    renderSixWeekPlan(analysis);

    // Chart
    renderChart(analysis.roadmap);

    // Visual Learning Roadmap
    document.getElementById("roadmap-step-max").textContent = String(
      analysis.totalSkillsCount
    );

    const roadmapList = document.getElementById("visual-roadmap-list");
    roadmapList.innerHTML = analysis.roadmap
      .map((item) => {
        const displaySkill = item.completedViaCourses
          ? `${item.skillName} ✓`
          : item.skillName;
        const pct = Math.min(
          100,
          Math.round((item.effectivePct / item.requiredPct) * 100)
        );
        const priorityChip = item.isPriorityMatch
          ? `<span class="priority-badge">★ Priority: ${escapeHtml(item.matchedPriorities[0])}</span>`
          : "";
        const actionLink =
          item.status === "strong"
            ? `<span class="roadmap-done-note">${item.completedViaCourses ? "Completed via courses ✓" : "Target proficiency met"}</span>`
            : `<a href="courses.html#skill-${escapeHtml(item.skillId)}" class="roadmap-course-link">Close ${item.gapPct}% gap →</a>`;

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
                  ${priorityChip}
                </div>
                <span class="status-pill status-${item.status}">${escapeHtml(item.statusLabel)}</span>
              </div>
              <p class="roadmap-why">${escapeHtml(item.why)}</p>
              <div class="roadmap-meter-row">
                <div class="roadmap-mini-track">
                  <div class="roadmap-mini-fill status-${item.status}" style="width: ${pct}%"></div>
                </div>
                <span class="roadmap-levels">
                  <strong>${item.effectivePct}%</strong> / ${item.requiredPct}% target
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
      const analysis = Engine.analyzeProfile(
        appState.profile,
        appState.courseProgress
      );
      if (analysis) renderChart(analysis.roadmap);
    });
  });

  if (loadSampleBtn) {
    loadSampleBtn.addEventListener("click", async () => {
      await Storage.resetState();
      const sample = Nav.getSampleProfile();
      appState = await Storage.saveProfile(sample);
      chartMode = null;
      Nav.showToast("Loaded Demo Employee: Junior Data Analyst!", "success");
      renderPage();
    });
  }

  renderPage();
})();
