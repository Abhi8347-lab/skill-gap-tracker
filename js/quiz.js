/**
 * Skill Diagnostic Quiz Controller (quiz.html):
 * - Runs 1 test per skill at a time (3 Easy -> 2 Hard, 4 shuffled options each)
 * - Immediate feedback + one-line explanation, no going back
 * - Computes Beginner / Intermediate / Expert via SkillPathEngine.getLevel()
 * - Saves attempt history, updates verifiedLevels, triggers adaptive re-plan
 */
(async function () {
  const Data = window.SkillPathData;
  const Questions = window.SkillSyncQuestions;
  const Storage = window.SkillPathStorage;
  const Engine = window.SkillPathEngine;
  const Nav = window.SkillPathNav;
  const { escapeHtml } = Nav;

  let appState = await Storage.initState();

  const queueEl = document.getElementById("quiz-skill-queue");
  const stageEl = document.getElementById("quiz-stage-card");
  const historyCardEl = document.getElementById("quiz-history-card");
  const historyTitleEl = document.getElementById("quiz-history-title");
  const historyListEl = document.getElementById("quiz-history-list");
  const modePillEl = document.getElementById("quiz-mode-pill");
  const aiModeToggle = document.getElementById("toggle-ai-quiz-mode");

  const LEVEL_MEANINGS = {
    Expert:
      "You mastered both core foundations and tricky scenario edge cases (5/5). Mapped to 90% verified score.",
    Intermediate:
      "You have solid core understanding (3–4/5 with strong foundations). Mapped to 60% verified score.",
    Beginner:
      "Foundational concepts need reinforcement before advanced topics. Mapped to 30% verified score.",
  };

  function getTargetSkillsList() {
    const profile = appState.profile;
    const set = new Set();
    if (profile && Array.isArray(profile.selectedSkills)) {
      profile.selectedSkills.forEach((id) => set.add(id));
    }
    if (profile && profile.targetRole && Data.ROLE_MAP[profile.targetRole]) {
      Data.ROLE_MAP[profile.targetRole].skills.forEach((s) =>
        set.add(s.skillId)
      );
    }
    if (set.size === 0) {
      ["sql", "power_bi", "statistics", "python", "excel", "javascript"].forEach(
        (id) => set.add(id)
      );
    }
    return Array.from(set).filter((id) => Questions.hasQuestions(id));
  }

  const params = new URLSearchParams(window.location.search);
  const requestedSkill = params.get("skill");

  let skillList = getTargetSkillsList();
  let activeSkillId =
    requestedSkill && Questions.hasQuestions(requestedSkill)
      ? requestedSkill
      : skillList[0] || "sql";

  if (!skillList.includes(activeSkillId) && Questions.hasQuestions(activeSkillId)) {
    skillList.unshift(activeSkillId);
  }

  let session = null;

  function shuffleOptions(question) {
    const tagged = question.options.map((text, idx) => ({
      text,
      isCorrect: idx === question.correctAnswer,
    }));
    for (let i = tagged.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [tagged[i], tagged[j]] = [tagged[j], tagged[i]];
    }
    return {
      ...question,
      options: tagged.map((t) => t.text),
      correctAnswer: tagged.findIndex((t) => t.isCorrect),
    };
  }

  async function loadQuestionsForSession(skillId) {
    const skillName = Data.SKILL_MAP[skillId]?.name || skillId;
    const useAi = Boolean(aiModeToggle && aiModeToggle.checked);
    const canCallHttp =
      window.location.protocol === "http:" ||
      window.location.protocol === "https:";

    if (useAi && canCallHttp) {
      try {
        const resp = await window.fetch("/api/ai-quiz", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ skillId, skillName }),
        });
        if (resp.ok) {
          const data = await resp.json();
          if (Array.isArray(data.questions) && data.questions.length === 5) {
            return {
              source: data.source === "ai" ? "AI Generated" : "Offline Bank (Fallback)",
              questions: data.questions.map(shuffleOptions),
            };
          }
        }
      } catch (_err) {
        // Silently fall back to offline bank.
      }
    }

    const offline = Questions.getQuestionsForSkill(skillId).map(shuffleOptions);
    return {
      source: "Offline Bank",
      questions: offline,
    };
  }

  async function startSkillTest(skillId) {
    activeSkillId = skillId;
    stageEl.innerHTML = `<div class="quiz-loading">Preparing 5 diagnostic questions for ${escapeHtml(Data.SKILL_MAP[skillId]?.name || skillId)}...</div>`;

    const loaded = await loadQuestionsForSession(skillId);
    if (modePillEl) {
      modePillEl.textContent = `Question Source: ${loaded.source}`;
    }

    session = {
      skillId,
      skillName: Data.SKILL_MAP[skillId]?.name || skillId,
      source: loaded.source,
      questions: loaded.questions,
      currentIndex: 0,
      selectedOption: null,
      answered: false,
      easyCorrect: 0,
      hardCorrect: 0,
      answersLog: [],
      finished: false,
      resultData: null,
    };

    renderQueue();
    renderStage();
    renderHistory();
  }

  function renderQueue() {
    skillList = getTargetSkillsList();
    if (!skillList.includes(activeSkillId)) skillList.unshift(activeSkillId);

    const empId = appState.currentEmployeeId || "emp_current";
    const verifiedMap = appState.verifiedLevels?.[empId] || {};

    queueEl.innerHTML = skillList
      .map((skillId) => {
        const name = Data.SKILL_MAP[skillId]?.name || skillId;
        const ver = verifiedMap[skillId];
        const isActive = skillId === activeSkillId;
        const badgeHtml = ver
          ? `<span class="ver-mini-pill level-${ver.level.toLowerCase()}">${escapeHtml(ver.level)} (${ver.score}/5)</span>`
          : `<span class="ver-mini-pill level-unverified">Unverified</span>`;

        return `
          <button
            type="button"
            class="quiz-queue-btn ${isActive ? "is-active" : ""}"
            data-quiz-skill="${escapeHtml(skillId)}"
          >
            <span class="quiz-queue-name">${escapeHtml(name)}</span>
            ${badgeHtml}
          </button>
        `;
      })
      .join("");

    queueEl.querySelectorAll("[data-quiz-skill]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const sid = btn.getAttribute("data-quiz-skill");
        startSkillTest(sid);
      });
    });
  }

  function renderStage() {
    if (!session) {
      const skillName = Data.SKILL_MAP[activeSkillId]?.name || activeSkillId;
      const empId = appState.currentEmployeeId || "emp_current";
      const existing = appState.verifiedLevels?.[empId]?.[activeSkillId];

      stageEl.innerHTML = `
        <div class="quiz-intro-box">
          <div class="ai-mini-badge">5-Question Skill Verification</div>
          <h2>${escapeHtml(skillName)} Diagnostic Test</h2>
          <p>
            You will answer <strong>3 Easy</strong> questions followed by <strong>2 Hard</strong> questions.
            Options are shuffled on every attempt, with instant feedback after each answer.
          </p>
          ${
            existing
              ? `<p class="quiz-prev-note">Current Verified Level: <strong>${escapeHtml(existing.level)}</strong> (${existing.score}/5 · ${existing.verifiedPct}%)</p>`
              : `<p class="quiz-prev-note">Status: <strong>Unverified</strong></p>`
          }
          <button type="button" id="btn-start-quiz-now" class="btn-primary">
            ${existing ? `Retake ${escapeHtml(skillName)} Test →` : `Start ${escapeHtml(skillName)} Test →`}
          </button>
        </div>
      `;

      document
        .getElementById("btn-start-quiz-now")
        .addEventListener("click", () => startSkillTest(activeSkillId));
      return;
    }

    if (session.finished && session.resultData) {
      renderResultScreen();
      return;
    }

    const q = session.questions[session.currentIndex];
    const qNum = session.currentIndex + 1;
    const total = session.questions.length;
    const pct = Math.round((qNum / total) * 100);
    const diffLabel = q.difficulty === "easy" ? "Easy (Foundation)" : "Hard (Scenario)";

    const optionsHtml = q.options
      .map((optText, idx) => {
        let cls = "quiz-option-btn";
        if (session.answered) {
          if (idx === q.correctAnswer) cls += " is-correct";
          else if (idx === session.selectedOption) cls += " is-wrong";
        } else if (session.selectedOption === idx) {
          cls += " is-selected";
        }
        return `
          <button
            type="button"
            class="${cls}"
            data-option-idx="${idx}"
            ${session.answered ? "disabled" : ""}
            aria-label="Option ${idx + 1}: ${escapeHtml(optText)}"
          >
            <span class="quiz-option-key">${idx + 1}</span>
            <span class="quiz-option-text">${escapeHtml(optText)}</span>
          </button>
        `;
      })
      .join("");

    let feedbackHtml = "";
    if (session.answered) {
      const wasRight = session.selectedOption === q.correctAnswer;
      feedbackHtml = `
        <div class="quiz-feedback ${wasRight ? "is-correct" : "is-wrong"}" role="status">
          <strong>${wasRight ? "✓ Correct!" : "✕ Incorrect."}</strong>
          <span>${escapeHtml(q.explanation)}</span>
        </div>
      `;
    }

    stageEl.innerHTML = `
      <div class="quiz-active-wrap">
        <div class="quiz-top-meta">
          <span class="quiz-skill-pill">${escapeHtml(session.skillName)}</span>
          <span class="quiz-diff-pill diff-${q.difficulty}">${diffLabel}</span>
          <span class="quiz-counter">Question ${qNum} of ${total}</span>
        </div>

        <div class="progress-track" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${pct}">
          <div class="progress-fill" style="width: ${pct}%"></div>
        </div>

        <h2 class="quiz-question-text">${escapeHtml(q.question)}</h2>

        <div class="quiz-options-list" role="radiogroup" aria-label="Answer choices">
          ${optionsHtml}
        </div>

        ${feedbackHtml}

        <div class="quiz-actions-row">
          <span class="quiz-kbd-hint">Tip: Press keys 1–4 to answer, Enter to continue (no going back).</span>
          ${
            session.answered
              ? `<button type="button" id="btn-quiz-next" class="btn-primary">
                  ${qNum === total ? "Finish &amp; See Level →" : "Next Question →"}
                </button>`
              : ""
          }
        </div>
      </div>
    `;

    if (!session.answered) {
      stageEl.querySelectorAll("[data-option-idx]").forEach((btn) => {
        btn.addEventListener("click", () => {
          selectAnswer(Number(btn.getAttribute("data-option-idx")));
        });
      });
    } else {
      const nextBtn = document.getElementById("btn-quiz-next");
      if (nextBtn) {
        nextBtn.addEventListener("click", advanceQuestion);
        nextBtn.focus();
      }
    }
  }

  function selectAnswer(idx) {
    if (!session || session.answered || session.finished) return;
    const q = session.questions[session.currentIndex];
    session.selectedOption = idx;
    session.answered = true;

    const isCorrect = idx === q.correctAnswer;
    if (isCorrect) {
      if (q.difficulty === "easy") session.easyCorrect += 1;
      else session.hardCorrect += 1;
    }

    session.answersLog.push({
      questionId: q.id,
      difficulty: q.difficulty,
      isCorrect,
    });

    renderStage();
  }

  async function advanceQuestion() {
    if (!session || !session.answered) return;
    if (session.currentIndex < session.questions.length - 1) {
      session.currentIndex += 1;
      session.selectedOption = null;
      session.answered = false;
      renderStage();
      return;
    }

    await finishQuiz();
  }

  async function finishQuiz() {
    const easy = session.easyCorrect;
    const hard = session.hardCorrect;
    const totalScore = easy + hard;
    const level = Engine.getLevel(easy, hard);
    const verifiedPct = Engine.getLevelPct(level);

    const empId = appState.currentEmployeeId || "emp_current";
    const prevLevel = appState.verifiedLevels?.[empId]?.[session.skillId]?.level || null;

    const attemptRecord = {
      date: new Date().toISOString(),
      skillId: session.skillId,
      skillName: session.skillName,
      score: totalScore,
      easyCorrect: easy,
      hardCorrect: hard,
      level,
      verifiedPct,
      source: session.source,
    };

    appState = await Storage.recordTestAttempt(
      empId,
      session.skillId,
      attemptRecord
    );

    // Re-run gap analysis & log adaptive re-plan entry when verified level is set/changed
    let updatedPlanSummary = "";
    if (appState.profile) {
      const newAnalysis = Engine.analyzeProfile(
        appState.profile,
        appState.courseProgress,
        appState
      );
      if (newAnalysis && newAnalysis.sixWeekPlan.length > 0) {
        updatedPlanSummary = newAnalysis.sixWeekPlan
          .map((p) => `${p.weeksLabel}: ${p.title}`)
          .join(" | ");
      }
      const reasonText =
        prevLevel && prevLevel !== level
          ? `${session.skillName} diagnostic updated ${prevLevel} → ${level} (${verifiedPct}%)`
          : `${session.skillName} verified at ${level} (${verifiedPct}%)`;

      appState = await Storage.addReplanEntry({
        employeeId: empId,
        skillId: session.skillId,
        reason: reasonText,
        summary: updatedPlanSummary || "Re-evaluated role roadmap and priority ranking.",
      });
    }

    const selfRatedPct = appState.profile
      ? Engine.resolveInitialPct(appState.profile, session.skillId)
      : 0;

    session.finished = true;
    session.resultData = {
      totalScore,
      easy,
      hard,
      level,
      verifiedPct,
      selfRatedPct,
      prevLevel,
      updatedPlanSummary,
    };

    Nav.render({ activePage: "quiz", state: appState });
    renderQueue();
    renderStage();
    renderHistory();

    Nav.showToast("Level updated. Your plan was re-generated.", "success");
  }

  function renderResultScreen() {
    const res = session.resultData;
    const empId = appState.currentEmployeeId || "emp_current";
    const verifiedMap = appState.verifiedLevels?.[empId] || {};
    const nextUnverified = skillList.find(
      (sid) => sid !== session.skillId && !verifiedMap[sid]
    );

    const selfVsVerifiedHtml =
      res.selfRatedPct > 0
        ? `<div class="quiz-self-vs-verified">Self-rated <strong>${res.selfRatedPct}%</strong> vs Verified <strong>${escapeHtml(res.level)} (${res.verifiedPct}%)</strong></div>`
        : `<div class="quiz-self-vs-verified">Verified Score Applied to Analyzer: <strong>${res.verifiedPct}%</strong></div>`;

    const nextBtnHtml = nextUnverified
      ? `<button type="button" id="btn-quiz-next-skill" class="btn-primary">
          Next Test: ${escapeHtml(Data.SKILL_MAP[nextUnverified]?.name || nextUnverified)} →
        </button>`
      : `<a href="analyzer.html" class="btn-primary">View Updated Skill Gap &amp; Plan →</a>`;

    stageEl.innerHTML = `
      <div class="quiz-result-card">
        <div class="quiz-result-top">
          <div>
            <span class="ai-mini-badge">${escapeHtml(session.skillName)} Verification Result</span>
            <h2>Score: ${res.totalScore} / 5</h2>
          </div>
          <span class="level-badge-lg level-${res.level.toLowerCase()}">${escapeHtml(res.level)}</span>
        </div>

        <div class="quiz-breakdown-grid">
          <div class="quiz-break-box">
            <span>Easy Questions</span>
            <strong>${res.easy} / 3</strong>
          </div>
          <div class="quiz-break-box">
            <span>Hard Questions</span>
            <strong>${res.hard} / 2</strong>
          </div>
          <div class="quiz-break-box">
            <span>Verified Score</span>
            <strong>${res.verifiedPct}%</strong>
          </div>
        </div>

        ${selfVsVerifiedHtml}

        <p class="quiz-level-meaning">${escapeHtml(LEVEL_MEANINGS[res.level])}</p>

        ${
          res.updatedPlanSummary
            ? `<div class="quiz-replan-banner">
                <strong>✦ Adaptive Re-Plan Updated:</strong> ${escapeHtml(res.updatedPlanSummary)}
              </div>`
            : ""
        }

        <div class="quiz-result-actions">
          ${nextBtnHtml}
          <button type="button" id="btn-quiz-retake" class="btn-secondary">
            Retake ${escapeHtml(session.skillName)} Test
          </button>
          <a href="analyzer.html" class="btn-ghost-sm">Go to Skill Gap Analyzer →</a>
        </div>
      </div>
    `;

    const nextSkillBtn = document.getElementById("btn-quiz-next-skill");
    if (nextSkillBtn && nextUnverified) {
      nextSkillBtn.addEventListener("click", () => startSkillTest(nextUnverified));
    }

    document
      .getElementById("btn-quiz-retake")
      .addEventListener("click", () => startSkillTest(session.skillId));
  }

  function renderHistory() {
    const empId = appState.currentEmployeeId || "emp_current";
    const attempts = appState.testResults?.[empId]?.[activeSkillId] || [];
    const skillName = Data.SKILL_MAP[activeSkillId]?.name || activeSkillId;

    if (attempts.length === 0) {
      historyCardEl.hidden = true;
      return;
    }

    historyCardEl.hidden = false;
    historyTitleEl.textContent = `${skillName} Diagnostic Attempt History (${attempts.length})`;

    historyListEl.innerHTML = `
      <div class="table-scroll">
        <table class="data-table">
          <thead>
            <tr>
              <th>Attempt</th>
              <th>Date</th>
              <th>Score</th>
              <th>Easy / Hard</th>
              <th>Verified Level</th>
              <th>Source</th>
            </tr>
          </thead>
          <tbody>
            ${attempts
              .slice()
              .reverse()
              .map(
                (att, idx) => `
              <tr>
                <td>#${attempts.length - idx}</td>
                <td>${escapeHtml(String(att.date || "").slice(0, 16).replace("T", " "))}</td>
                <td><strong>${att.score} / 5</strong> (${att.verifiedPct}%)</td>
                <td>${att.easyCorrect}/3 · ${att.hardCorrect}/2</td>
                <td><span class="ver-mini-pill level-${att.level.toLowerCase()}">${escapeHtml(att.level)}</span></td>
                <td>${escapeHtml(att.source || "Offline Bank")}</td>
              </tr>
            `
              )
              .join("")}
          </tbody>
        </table>
      </div>
    `;
  }

  // Keyboard shortcuts (1-4 to pick option, Enter to continue)
  document.addEventListener("keydown", (e) => {
    if (!session || session.finished) return;
    if (["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement?.tagName)) {
      return;
    }
    if (!session.answered && ["1", "2", "3", "4"].includes(e.key)) {
      const idx = Number(e.key) - 1;
      if (idx < session.questions[session.currentIndex].options.length) {
        selectAnswer(idx);
      }
    } else if (session.answered && e.key === "Enter") {
      e.preventDefault();
      advanceQuestion();
    }
  });

  Nav.render({
    activePage: "quiz",
    state: appState,
    onReset: () => window.location.reload(),
  });
  renderQueue();
  if (requestedSkill && Questions.hasQuestions(requestedSkill)) {
    startSkillTest(requestedSkill);
  } else {
    renderStage();
    renderHistory();
  }
})();
