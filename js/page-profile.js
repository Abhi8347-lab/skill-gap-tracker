/**
 * Page 1 Controller: Multi-step Profile Setup Wizard.
 */
(async function () {
  const Data = window.SkillPathData;
  const Storage = window.SkillPathStorage;
  const Nav = window.SkillPathNav;
  const { escapeHtml } = Nav;

  const TOTAL_STEPS = 4;

  const appState = await Storage.initState();

  const draft = {
    name: appState.profile?.name || "",
    status: appState.profile?.status || "student",
    backgroundDetail:
      appState.profile?.backgroundDetail ||
      Data.BACKGROUND_OPTIONS.student.choices[0],
    targetRole: appState.profile?.targetRole || Data.ROLES_CATALOG[0].id,
    selectedSkills: Array.isArray(appState.profile?.selectedSkills)
      ? [...appState.profile.selectedSkills]
      : [],
    skillRatings: { ...(appState.profile?.skillRatings || {}) },
    experience: appState.profile?.experience || "0",
    weeklyHours: appState.profile?.weeklyHours || "5-10",
  };

  let currentStep = 1;
  let maxVisitedStep = appState.profile ? TOTAL_STEPS : 1;
  let activeSkillFilter = "all";

  // DOM References
  const stepCounterEl = document.getElementById("wizard-step-counter");
  const progressPctEl = document.getElementById("wizard-progress-pct");
  const progressBarEl = document.getElementById("wizard-progressbar");
  const progressFillEl = document.getElementById("wizard-progress-fill");
  const tabsEl = document.getElementById("wizard-tabs");
  const panels = Array.from(document.querySelectorAll(".wizard-panel"));
  const errorBox = document.getElementById("wizard-error");
  const btnPrev = document.getElementById("btn-prev");
  const btnNext = document.getElementById("btn-next");

  const nameInput = document.getElementById("input-name");
  const statusOptionsEl = document.getElementById("status-options");
  const backgroundLabelEl = document.getElementById("background-label");
  const backgroundSelectEl = document.getElementById("select-background");
  const roleSelectEl = document.getElementById("select-role");
  const rolePreviewEl = document.getElementById("role-preview-card");
  const skillFiltersEl = document.getElementById("skill-category-filters");
  const skillChipsEl = document.getElementById("skills-chip-grid");
  const ratingsListEl = document.getElementById("selected-ratings-list");
  const clearSkillsBtn = document.getElementById("btn-clear-skills");
  const expOptionsEl = document.getElementById("experience-options");
  const hoursOptionsEl = document.getElementById("hours-options");
  const summaryPreviewEl = document.getElementById("wizard-summary-preview");

  const RATING_LABELS = {
    1: "Basic",
    2: "Beginner",
    3: "Intermediate",
    4: "Proficient",
    5: "Expert",
  };

  function statusIconSvg(icon) {
    if (icon === "graduation") {
      return `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>`;
    }
    if (icon === "briefcase") {
      return `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>`;
    }
    return `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>`;
  }

  function showError(msg) {
    if (!msg) {
      errorBox.hidden = true;
      errorBox.textContent = "";
      return;
    }
    errorBox.hidden = false;
    errorBox.textContent = msg;
  }

  function renderStatusOptions() {
    statusOptionsEl.innerHTML = Data.STATUS_OPTIONS.map((opt) => {
      const selected = draft.status === opt.id;
      return `
        <button
          type="button"
          class="choice-card ${selected ? "is-selected" : ""}"
          data-status="${opt.id}"
          aria-pressed="${selected}"
        >
          <span class="choice-icon">${statusIconSvg(opt.icon)}</span>
          <span class="choice-title">${escapeHtml(opt.label)}</span>
          <span class="choice-desc">${escapeHtml(opt.description)}</span>
        </button>
      `;
    }).join("");

    statusOptionsEl.querySelectorAll(".choice-card").forEach((btn) => {
      btn.addEventListener("click", () => {
        const nextStatus = btn.getAttribute("data-status");
        if (nextStatus !== draft.status) {
          draft.status = nextStatus;
          const bgConfig = Data.BACKGROUND_OPTIONS[nextStatus];
          draft.backgroundDetail = bgConfig.choices[0];
          renderStatusOptions();
          renderBackgroundDropdown();
          renderSummaryPreview();
        }
      });
    });
  }

  function renderBackgroundDropdown() {
    const config =
      Data.BACKGROUND_OPTIONS[draft.status] || Data.BACKGROUND_OPTIONS.other;
    backgroundLabelEl.innerHTML = `${escapeHtml(config.label)} <span class="req">*</span>`;

    if (!config.choices.includes(draft.backgroundDetail)) {
      draft.backgroundDetail = config.choices[0];
    }

    backgroundSelectEl.innerHTML = config.choices
      .map(
        (choice) =>
          `<option value="${escapeHtml(choice)}" ${choice === draft.backgroundDetail ? "selected" : ""}>${escapeHtml(choice)}</option>`
      )
      .join("");
  }

  function renderRoleSelect() {
    roleSelectEl.innerHTML = Data.ROLES_CATALOG.map(
      (role) =>
        `<option value="${escapeHtml(role.id)}" ${role.id === draft.targetRole ? "selected" : ""}>${escapeHtml(role.name)}</option>`
    ).join("");
    renderRolePreview();
  }

  function renderRolePreview() {
    const role = Data.ROLE_MAP[draft.targetRole] || Data.ROLES_CATALOG[0];
    const pills = role.skills
      .map((s) => {
        const name = Data.SKILL_MAP[s.skillId]?.name || s.skillId;
        return `<span class="preview-skill-pill">${escapeHtml(name)} <em>(${s.required}/5)</em></span>`;
      })
      .join("");

    rolePreviewEl.innerHTML = `
      <div class="role-preview-top">
        <div>
          <span class="ai-mini-badge">AI Role Blueprint</span>
          <h3>${escapeHtml(role.name)}</h3>
          <p>${escapeHtml(role.tagline)}</p>
        </div>
        <div class="role-skill-count">${role.skills.length} core skills</div>
      </div>
      <div class="role-preview-skills">${pills}</div>
    `;
  }

  function renderSkillCategoryFilters() {
    const role = Data.ROLE_MAP[draft.targetRole] || Data.ROLES_CATALOG[0];
    const filters = [
      { id: "all", label: "All Skills" },
      { id: "role", label: `For ${role.name}` },
      ...Data.SKILL_CATEGORIES.map((c) => ({ id: c, label: c })),
    ];

    skillFiltersEl.innerHTML = filters
      .map(
        (f) => `
        <button
          type="button"
          class="filter-pill ${activeSkillFilter === f.id ? "is-active" : ""}"
          data-filter="${escapeHtml(f.id)}"
        >${escapeHtml(f.label)}</button>
      `
      )
      .join("");

    skillFiltersEl.querySelectorAll(".filter-pill").forEach((btn) => {
      btn.addEventListener("click", () => {
        activeSkillFilter = btn.getAttribute("data-filter");
        renderSkillCategoryFilters();
        renderSkillChips();
      });
    });
  }

  function renderSkillChips() {
    const role = Data.ROLE_MAP[draft.targetRole] || Data.ROLES_CATALOG[0];
    const roleSkillIds = new Set(role.skills.map((s) => s.skillId));

    const visibleSkills = Data.SKILLS_CATALOG.filter((skill) => {
      if (activeSkillFilter === "all") return true;
      if (activeSkillFilter === "role") return roleSkillIds.has(skill.id);
      return skill.category === activeSkillFilter;
    });

    skillChipsEl.innerHTML = visibleSkills
      .map((skill) => {
        const isSelected = draft.selectedSkills.includes(skill.id);
        const isTargetSkill = roleSkillIds.has(skill.id);
        return `
          <button
            type="button"
            class="skill-chip ${isSelected ? "is-selected" : ""} ${isTargetSkill ? "is-target-match" : ""}"
            data-skill-id="${escapeHtml(skill.id)}"
            aria-pressed="${isSelected}"
          >
            <span class="chip-check" aria-hidden="true">${isSelected ? "✓" : "+"}</span>
            <span>${escapeHtml(skill.name)}</span>
            ${isTargetSkill ? `<span class="chip-goal-dot" title="Core skill for ${escapeHtml(role.name)}">★</span>` : ""}
          </button>
        `;
      })
      .join("");

    skillChipsEl.querySelectorAll(".skill-chip").forEach((chip) => {
      chip.addEventListener("click", () => {
        const skillId = chip.getAttribute("data-skill-id");
        toggleSkill(skillId);
      });
    });
  }

  function toggleSkill(skillId) {
    const idx = draft.selectedSkills.indexOf(skillId);
    if (idx >= 0) {
      draft.selectedSkills.splice(idx, 1);
      delete draft.skillRatings[skillId];
    } else {
      draft.selectedSkills.push(skillId);
      if (!draft.skillRatings[skillId]) {
        draft.skillRatings[skillId] = 3;
      }
    }
    renderSkillChips();
    renderSelectedRatings();
    renderSummaryPreview();
  }

  function renderSelectedRatings() {
    if (draft.selectedSkills.length === 0) {
      ratingsListEl.innerHTML = `
        <div class="ratings-empty">
          No current skills selected yet — click any skill chips above to rate yourself 1–5,
          or click <strong>Next</strong> to get a complete beginner roadmap from Step 1!
        </div>
      `;
      return;
    }

    ratingsListEl.innerHTML = draft.selectedSkills
      .map((skillId) => {
        const skill = Data.SKILL_MAP[skillId];
        if (!skill) return "";
        const val = Number(draft.skillRatings[skillId] || 3);
        const starsHtml = [1, 2, 3, 4, 5]
          .map(
            (star) => `
            <button
              type="button"
              class="star-btn ${star <= val ? "is-filled" : ""}"
              data-skill-id="${escapeHtml(skillId)}"
              data-rating="${star}"
              aria-label="Rate ${escapeHtml(skill.name)} ${star} out of 5 (${RATING_LABELS[star]})"
              title="${star}/5 — ${RATING_LABELS[star]}"
            >★</button>
          `
          )
          .join("");

        return `
          <div class="rating-row">
            <div class="rating-skill-info">
              <span class="rating-skill-name">${escapeHtml(skill.name)}</span>
              <span class="rating-level-badge">${val}/5 · ${RATING_LABELS[val]}</span>
            </div>
            <div class="rating-controls">
              <div class="star-group" role="group" aria-label="Rating for ${escapeHtml(skill.name)}">
                ${starsHtml}
              </div>
              <button
                type="button"
                class="rating-remove-btn"
                data-remove-skill="${escapeHtml(skillId)}"
                aria-label="Remove ${escapeHtml(skill.name)}"
                title="Remove skill"
              >✕</button>
            </div>
          </div>
        `;
      })
      .join("");

    ratingsListEl.querySelectorAll(".star-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const skillId = btn.getAttribute("data-skill-id");
        const rating = Number(btn.getAttribute("data-rating"));
        draft.skillRatings[skillId] = rating;
        renderSelectedRatings();
        renderSummaryPreview();
      });
    });

    ratingsListEl.querySelectorAll(".rating-remove-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const skillId = btn.getAttribute("data-remove-skill");
        toggleSkill(skillId);
      });
    });
  }

  function renderExperienceOptions() {
    expOptionsEl.innerHTML = Data.EXPERIENCE_OPTIONS.map((opt) => {
      const selected = draft.experience === opt.id;
      return `
        <button
          type="button"
          class="choice-card choice-card-compact ${selected ? "is-selected" : ""}"
          data-exp="${escapeHtml(opt.id)}"
          aria-pressed="${selected}"
        >
          <span class="choice-title">${escapeHtml(opt.label)}</span>
          <span class="choice-desc">${escapeHtml(opt.sublabel)}</span>
        </button>
      `;
    }).join("");

    expOptionsEl.querySelectorAll("[data-exp]").forEach((btn) => {
      btn.addEventListener("click", () => {
        draft.experience = btn.getAttribute("data-exp");
        renderExperienceOptions();
        renderSummaryPreview();
      });
    });
  }

  function renderHoursOptions() {
    hoursOptionsEl.innerHTML = Data.WEEKLY_HOURS_OPTIONS.map((opt) => {
      const selected = draft.weeklyHours === opt.id;
      return `
        <button
          type="button"
          class="choice-card choice-card-compact ${selected ? "is-selected" : ""}"
          data-hours="${escapeHtml(opt.id)}"
          aria-pressed="${selected}"
        >
          <span class="choice-title">${escapeHtml(opt.label)}</span>
          <span class="choice-desc">${escapeHtml(opt.sublabel)}</span>
        </button>
      `;
    }).join("");

    hoursOptionsEl.querySelectorAll("[data-hours]").forEach((btn) => {
      btn.addEventListener("click", () => {
        draft.weeklyHours = btn.getAttribute("data-hours");
        renderHoursOptions();
        renderSummaryPreview();
      });
    });
  }

  function renderSummaryPreview() {
    const role = Data.ROLE_MAP[draft.targetRole] || Data.ROLES_CATALOG[0];
    const exp = Data.EXPERIENCE_OPTIONS.find((e) => e.id === draft.experience);
    const hrs = Data.WEEKLY_HOURS_OPTIONS.find((h) => h.id === draft.weeklyHours);
    const displayName = draft.name.trim() || "You";

    summaryPreviewEl.innerHTML = `
      <div class="summary-preview-badge">Ready for AI Analysis</div>
      <p>
        <strong>${escapeHtml(displayName)}</strong> (${escapeHtml(draft.backgroundDetail)})
        → targeting <strong>${escapeHtml(role.name)}</strong> with
        <strong>${draft.selectedSkills.length}</strong> rated skill${draft.selectedSkills.length === 1 ? "" : "s"},
        <strong>${escapeHtml(exp ? exp.label : "")}</strong> experience, at
        <strong>${escapeHtml(hrs ? hrs.label : "")}</strong>.
      </p>
    `;
  }

  function validateStep(step) {
    if (step === 1) {
      if (!draft.name.trim()) {
        showError("Please enter your name before continuing.");
        nameInput.focus();
        return false;
      }
      if (!draft.status || !draft.backgroundDetail) {
        showError("Please select your current status and background.");
        return false;
      }
    }
    if (step === 2 && !draft.targetRole) {
      showError("Please choose your target career role.");
      return false;
    }
    if (step === 4 && (!draft.experience || !draft.weeklyHours)) {
      showError("Please pick both your experience level and weekly study hours.");
      return false;
    }
    showError("");
    return true;
  }

  function goToStep(step) {
    currentStep = Math.max(1, Math.min(TOTAL_STEPS, step));
    maxVisitedStep = Math.max(maxVisitedStep, currentStep);

    const pct = Math.round((currentStep / TOTAL_STEPS) * 100);
    stepCounterEl.textContent = `Step ${currentStep} of ${TOTAL_STEPS}`;
    progressPctEl.textContent = `${pct}%`;
    progressBarEl.setAttribute("aria-valuenow", String(pct));
    progressFillEl.style.width = `${pct}%`;

    panels.forEach((panel) => {
      const pStep = Number(panel.getAttribute("data-panel"));
      const active = pStep === currentStep;
      panel.hidden = !active;
      panel.classList.toggle("is-active", active);
    });

    tabsEl.querySelectorAll(".wizard-tab").forEach((tab) => {
      const tStep = Number(tab.getAttribute("data-step"));
      tab.classList.toggle("is-active", tStep === currentStep);
      tab.classList.toggle("is-complete", tStep < currentStep);
      tab.disabled = tStep > maxVisitedStep;
    });

    btnPrev.hidden = currentStep === 1;
    btnNext.textContent =
      currentStep === TOTAL_STEPS ? "Next: Analyze Skill Gap →" : "Next →";

    if (currentStep === 3) {
      renderSkillCategoryFilters();
      renderSkillChips();
      renderSelectedRatings();
    } else if (currentStep === 4) {
      renderSummaryPreview();
    }

    showError("");
  }

  async function submitProfile() {
    if (!validateStep(1) || !validateStep(2) || !validateStep(4)) {
      return;
    }

    btnNext.disabled = true;
    btnNext.textContent = "Analyzing...";

    const cleanProfile = {
      name: draft.name.trim(),
      status: draft.status,
      backgroundDetail: draft.backgroundDetail,
      targetRole: draft.targetRole,
      selectedSkills: draft.selectedSkills.slice(),
      skillRatings: { ...draft.skillRatings },
      experience: draft.experience,
      weeklyHours: draft.weeklyHours,
    };

    await Storage.saveProfile(cleanProfile);
    window.location.href = "analyzer.html";
  }

  // Bind inputs & events
  nameInput.value = draft.name;
  nameInput.addEventListener("input", (e) => {
    draft.name = e.target.value;
    if (draft.name.trim()) showError("");
  });

  backgroundSelectEl.addEventListener("change", (e) => {
    draft.backgroundDetail = e.target.value;
    renderSummaryPreview();
  });

  roleSelectEl.addEventListener("change", (e) => {
    draft.targetRole = e.target.value;
    renderRolePreview();
    renderSkillCategoryFilters();
    renderSkillChips();
    renderSummaryPreview();
  });

  clearSkillsBtn.addEventListener("click", () => {
    draft.selectedSkills = [];
    draft.skillRatings = {};
    renderSkillChips();
    renderSelectedRatings();
    renderSummaryPreview();
    Nav.showToast("Cleared selected skills — ready for a fresh-start roadmap.");
  });

  tabsEl.querySelectorAll(".wizard-tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      const target = Number(tab.getAttribute("data-step"));
      if (target <= maxVisitedStep && (target < currentStep || validateStep(currentStep))) {
        goToStep(target);
      }
    });
  });

  btnPrev.addEventListener("click", () => {
    if (currentStep > 1) goToStep(currentStep - 1);
  });

  btnNext.addEventListener("click", () => {
    if (!validateStep(currentStep)) return;
    if (currentStep < TOTAL_STEPS) {
      goToStep(currentStep + 1);
    } else {
      submitProfile();
    }
  });

  // Initial render
  Nav.render({
    activePage: "profile",
    state: appState,
    onReset: () => window.location.reload(),
  });
  renderStatusOptions();
  renderBackgroundDropdown();
  renderRoleSelect();
  renderSkillCategoryFilters();
  renderSkillChips();
  renderSelectedRatings();
  renderExperienceOptions();
  renderHoursOptions();
  renderSummaryPreview();
  goToStep(1);
})();
