/**
 * Page 3 Controller: Explainable Recommended Courses & Live Progress Tracker.
 */
(async function () {
  const Storage = window.SkillPathStorage;
  const Engine = window.SkillPathEngine;
  const Nav = window.SkillPathNav;
  const { escapeHtml } = Nav;

  let appState = await Storage.initState();
  let viewFilter = "gap";
  let platformFilter = "all";
  let priceFilter = "all";
  let aiExplanationCache = {};
  let aiSourceLabel = "Template Fallback";

  const emptyEl = document.getElementById("courses-empty");
  const contentEl = document.getElementById("courses-content");
  const loadSampleBtn = document.getElementById("btn-load-sample-courses");
  const groupsContainer = document.getElementById("courses-groups-container");
  const platformSelect = document.getElementById("filter-platform");
  const priceSelect = document.getElementById("filter-price");
  const viewFilterEl = document.getElementById("view-filter-pills");
  const demoTagEl = document.getElementById("courses-demo-tag");
  const aiSourcePillEl = document.getElementById("ai-source-pill");

  const STATUS_OPTIONS = [
    { id: "not_started", label: "Not Started" },
    { id: "in_progress", label: "In Progress" },
    { id: "completed", label: "Completed" },
  ];

  function platformSlug(platformName) {
    return platformName.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  }

  function populatePlatformFilter(roadmap) {
    const platforms = new Set();
    roadmap.forEach((step) => {
      step.courses.forEach((c) => platforms.add(c.platform));
    });

    const sorted = Array.from(platforms).sort();
    const prevValue = platformSelect.value || "all";

    platformSelect.innerHTML =
      `<option value="all">All Platforms</option>` +
      sorted
        .map(
          (p) =>
            `<option value="${escapeHtml(p)}" ${p === prevValue ? "selected" : ""}>${escapeHtml(p)}</option>`
        )
        .join("");

    if (!platforms.has(prevValue)) {
      platformFilter = "all";
      platformSelect.value = "all";
    }
  }

  function matchesViewFilter(step) {
    if (viewFilter === "all") return true;
    if (viewFilter === "remaining") return step.status !== "strong";
    if (viewFilter === "completed") return step.status === "strong";
    return step.includeInCoursePlan;
  }

  function matchesCourseFilters(course) {
    if (platformFilter !== "all" && course.platform !== platformFilter) {
      return false;
    }
    if (priceFilter === "free" && !course.isFree) return false;
    if (priceFilter === "paid" && course.isFree) return false;
    return true;
  }

  async function handleStatusChange(courseId, nextStatus, skillName) {
    const prevAnalysis = Engine.analyzeProfile(
      appState.profile,
      appState.courseProgress
    );
    const prevDoneSet = new Set(
      prevAnalysis
        ? prevAnalysis.roadmap
            .filter((s) => s.status === "strong")
            .map((s) => s.skillId)
        : []
    );

    appState = await Storage.setCourseStatus(courseId, nextStatus);
    renderPage();

    const nextAnalysis = Engine.analyzeProfile(
      appState.profile,
      appState.courseProgress
    );
    if (nextAnalysis) {
      const newlyCompleted = nextAnalysis.roadmap.find(
        (s) =>
          s.skillName === skillName &&
          s.status === "strong" &&
          !prevDoneSet.has(s.skillId)
      );
      if (newlyCompleted) {
        Nav.showToast(
          `${newlyCompleted.skillName} ✓ marked complete! Skill gap & plan updated.`,
          "success"
        );
      } else if (nextStatus === "completed") {
        Nav.showToast(`Course marked completed!`, "success");
      }
    }
  }

  function renderDashboard(analysis) {
    if (demoTagEl) {
      demoTagEl.hidden = !appState.profile.isDemo;
    }
    if (aiSourcePillEl) {
      aiSourcePillEl.textContent = `✦ AI Reasoning: ${aiSourceLabel}`;
    }

    document.getElementById("courses-role-badge").textContent =
      `Explainable Picks · ${analysis.role.name}`;
    document.getElementById("courses-title").textContent =
      `Recommended Courses for ${analysis.role.name}`;
    document.getElementById("courses-subtitle").textContent =
      `Grouped in roadmap order for ${appState.profile.name}. Every course explains why SkillSync AI picked it.`;

    const pct = analysis.overallCoursePct;
    document.getElementById("dash-headline").textContent =
      analysis.totalGapCourses === 0
        ? "All target skills already Strong!"
        : `${pct}% of recommended courses completed`;
    document.getElementById("dash-overall-pct").textContent = `${pct}%`;
    document.getElementById("dash-progress-fill").style.width = `${pct}%`;

    document.getElementById("dash-caption").textContent =
      analysis.remainingSkills.length === 0
        ? `🎉 Amazing work! Every skill for ${analysis.role.name} meets target proficiency ✓.`
        : `${analysis.masteredSkillsCount} of ${analysis.totalSkillsCount} roadmap skills ready · ${analysis.remainingSkills.length} skill${analysis.remainingSkills.length === 1 ? "" : "s"} remaining.`;

    document.getElementById("dash-completed-courses").textContent =
      `${analysis.completedCoursesCount} / ${analysis.totalGapCourses}`;
    document.getElementById("dash-inprogress-courses").textContent =
      `${analysis.inProgressCoursesCount} in progress · ${analysis.notStartedCoursesCount} not started`;

    document.getElementById("dash-remaining-skills").textContent = String(
      analysis.remainingSkills.length
    );
    document.getElementById("dash-skill-match-live").textContent =
      `Live Skill Match: ${analysis.skillMatchPct}%`;

    document.getElementById("dash-time-left").textContent =
      analysis.estimatedWeeks === 0
        ? "Done ✓"
        : `${analysis.estimatedWeeks} wks`;
    document.getElementById("dash-hours-left").textContent =
      `${analysis.slotsPerWeek} slots/week · ${analysis.totalRemainingHours} hrs left`;

    // Skill readiness pill strip
    const pillsEl = document.getElementById("dash-skill-pills");
    pillsEl.innerHTML = analysis.roadmap
      .map((step) => {
        const isDone = step.status === "strong";
        const label = isDone
          ? `${step.skillName} ✓ (${step.effectivePct}%)`
          : `${step.skillName} (${step.effectivePct}%)`;
        return `
          <a
            href="#skill-${escapeHtml(step.skillId)}"
            class="readiness-pill status-${step.status}"
            title="Step ${step.stepNumber}: ${escapeHtml(step.statusLabel)}"
          >${escapeHtml(label)}</a>
        `;
      })
      .join("");
  }

  function renderCourseGroups(analysis) {
    const visibleSteps = analysis.roadmap.filter(matchesViewFilter);

    if (visibleSteps.length === 0) {
      const emptyMsg =
        viewFilter === "gap" && analysis.totalGapCourses === 0
          ? "You already meet target scores for every required skill! Switch to 'All Role Skills' above for optional refreshers."
          : "No skill sections match the selected filters.";

      groupsContainer.innerHTML = `
        <div class="card empty-filter-card">
          <p>${escapeHtml(emptyMsg)}</p>
        </div>
      `;
      return;
    }

    const htmlSections = visibleSteps
      .map((step) => {
        const filteredCourses = step.courses.filter(matchesCourseFilters);
        if (
          filteredCourses.length === 0 &&
          (platformFilter !== "all" || priceFilter !== "all")
        ) {
          return "";
        }

        const isDone = step.status === "strong";
        const headingName = isDone ? `${step.skillName} ✓` : step.skillName;
        const priorityChip = step.isPriorityMatch
          ? `<span class="priority-badge">★ Priority: ${escapeHtml(step.matchedPriorities[0])}</span>`
          : "";

        const cardsHtml = filteredCourses
          .map((course) => {
            const pSlug = platformSlug(course.platform);
            const priceLabel = course.isFree ? "Free" : "Paid";
            const priceClass = course.isFree ? "badge-free" : "badge-paid";
            const whyLine =
              aiExplanationCache[course.id] || course.whyRecommended;

            const statusButtons = STATUS_OPTIONS.map((opt) => {
              const active = course.status === opt.id;
              return `
                <button
                  type="button"
                  class="status-seg-btn ${active ? `is-active state-${opt.id}` : ""}"
                  data-course-id="${escapeHtml(course.id)}"
                  data-status="${opt.id}"
                  data-skill-name="${escapeHtml(step.skillName)}"
                  aria-pressed="${active}"
                >${opt.label}</button>
              `;
            }).join("");

            return `
              <article class="course-card state-${course.status}">
                <div class="course-card-top">
                  <span class="platform-badge platform-${escapeHtml(pSlug)}">${escapeHtml(course.platform)}</span>
                  <div class="course-badge-right">
                    ${course.isCapstone ? `<span class="capstone-badge">Week 6 Project</span>` : ""}
                    <span class="price-badge ${priceClass}">${priceLabel}</span>
                  </div>
                </div>

                <h3 class="course-title">${escapeHtml(course.title)}</h3>

                <div class="course-why-box">
                  <span class="course-why-label">✦ Why this course?</span>
                  <p class="course-why-text">${escapeHtml(whyLine)}</p>
                </div>

                <div class="course-meta-row">
                  <span class="course-meta-chip">
                    <span aria-hidden="true">⚡</span> ${escapeHtml(course.level)}
                  </span>
                  <span class="course-meta-chip">
                    <span aria-hidden="true">⏱</span> ${escapeHtml(course.duration)}
                  </span>
                </div>

                <div class="course-status-control" role="group" aria-label="Course progress for ${escapeHtml(course.title)}">
                  ${statusButtons}
                </div>

                <div class="course-card-footer">
                  <a
                    href="${escapeHtml(course.url)}"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="btn-start-course"
                    data-start-course-id="${escapeHtml(course.id)}"
                    data-start-status="${escapeHtml(course.status)}"
                    data-skill-name="${escapeHtml(step.skillName)}"
                  >
                    Start Course ↗
                  </a>
                </div>
              </article>
            `;
          })
          .join("");

        return `
          <section id="skill-${escapeHtml(step.skillId)}" class="card skill-course-group ${isDone ? "is-skill-done" : ""}">
            <div class="skill-group-header">
              <div class="skill-group-title-wrap">
                <span class="roadmap-step-num status-dot-${step.status}">
                  ${isDone ? "✓" : step.stepNumber}
                </span>
                <div>
                  <div class="skill-group-kicker">
                    Step ${step.stepNumber} · Score ${step.effectivePct}% / ${step.requiredPct}% target
                  </div>
                  <h2 class="skill-group-title">${escapeHtml(headingName)}</h2>
                </div>
              </div>
              <div class="skill-group-badges">
                ${priorityChip}
                <span class="course-count-chip">
                  ${step.coursesCompleted}/${step.coursesTotal} courses completed
                </span>
                <span class="status-pill status-${step.status}">
                  ${escapeHtml(step.statusLabel)}
                </span>
              </div>
            </div>

            <div class="courses-grid">
              ${cardsHtml}
            </div>
          </section>
        `;
      })
      .filter(Boolean)
      .join("");

    if (!htmlSections) {
      groupsContainer.innerHTML = `
        <div class="card empty-filter-card">
          <p>No courses match the current Platform / Price filters. Try resetting filters to All.</p>
        </div>
      `;
      return;
    }

    groupsContainer.innerHTML = htmlSections;

    groupsContainer.querySelectorAll(".status-seg-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const courseId = btn.getAttribute("data-course-id");
        const nextStatus = btn.getAttribute("data-status");
        const skillName = btn.getAttribute("data-skill-name");
        handleStatusChange(courseId, nextStatus, skillName);
      });
    });

    groupsContainer.querySelectorAll(".btn-start-course").forEach((link) => {
      link.addEventListener("click", () => {
        const courseId = link.getAttribute("data-start-course-id");
        const currentStatus = link.getAttribute("data-start-status");
        const skillName = link.getAttribute("data-start-name") || link.getAttribute("data-skill-name");
        if (currentStatus === "not_started") {
          handleStatusChange(courseId, "in_progress", skillName);
        }
      });
    });
  }

  async function refreshAiExplanations(analysis) {
    const res = await Engine.fetchAiExplanations(appState.profile, analysis);
    if (res && res.explanations) {
      aiExplanationCache = res.explanations;
      aiSourceLabel =
        res.source === "ai" ? "Live AI API" : "Built-in Template Fallback";
      renderDashboard(analysis);
      renderCourseGroups(analysis);
    }
  }

  function renderPage(triggerAiRefresh = false) {
    Nav.render({
      activePage: "courses",
      state: appState,
      onReset: () => {
        appState = { profile: null, courseProgress: {}, updatedAt: null };
        aiExplanationCache = {};
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

    populatePlatformFilter(analysis.roadmap);
    renderDashboard(analysis);
    renderCourseGroups(analysis);

    if (triggerAiRefresh) {
      refreshAiExplanations(analysis);
    }
  }

  // Filter event bindings
  viewFilterEl.querySelectorAll("[data-view-filter]").forEach((btn) => {
    btn.addEventListener("click", () => {
      viewFilter = btn.getAttribute("data-view-filter");
      viewFilterEl.querySelectorAll("[data-view-filter]").forEach((b) =>
        b.classList.toggle("is-active", b === btn)
      );
      renderPage();
    });
  });

  platformSelect.addEventListener("change", (e) => {
    platformFilter = e.target.value;
    renderPage();
  });

  priceSelect.addEventListener("change", (e) => {
    priceFilter = e.target.value;
    renderPage();
  });

  if (loadSampleBtn) {
    loadSampleBtn.addEventListener("click", async () => {
      await Storage.resetState();
      const sample = Nav.getSampleProfile();
      appState = await Storage.saveProfile(sample);
      Nav.showToast("Loaded Demo Employee: Junior Data Analyst!", "success");
      renderPage(true);
    });
  }

  renderPage(true);
})();
