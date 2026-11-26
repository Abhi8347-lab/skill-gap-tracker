/**
 * Browser localStorage persistence layer for SkillSync AI.
 * Stores all user profile data, diagnostic test attempts, verified levels,
 * course progress, nudges, notifications, HR priorities, and re-plan history
 * strictly in browser localStorage with automatic schema migration.
 */
window.SkillPathStorage = (function () {
  const STORAGE_KEY = "skillsync_ai_state_v1";
  const LEGACY_KEY = "skillpath_ai_state_v1";
  const THEME_KEY = "skillsync_ai_theme";
  const CURRENT_EMP_ID = "emp_current";

  function defaultState() {
    const defaultPriorities =
      window.SkillPathData && window.SkillPathData.DEFAULT_ORG_PRIORITIES
        ? JSON.parse(JSON.stringify(window.SkillPathData.DEFAULT_ORG_PRIORITIES))
        : [{ skillId: "power_bi", weight: 5 }];

    return {
      schemaVersion: 2,
      activeRole: "employee",
      currentEmployeeId: CURRENT_EMP_ID,
      anonymiseHR: true,
      profile: null,
      courseProgress: {},
      testResults: {},
      verifiedLevels: {},
      notifications: [],
      nudges: [],
      priorities: defaultPriorities,
      replanHistory: [],
      updatedAt: null,
    };
  }

  function migrateState(parsed) {
    const base = defaultState();
    if (!parsed || typeof parsed !== "object") {
      return base;
    }

    const activeRole = ["employee", "manager", "hr"].includes(parsed.activeRole)
      ? parsed.activeRole
      : "employee";

    return {
      schemaVersion: 2,
      activeRole,
      currentEmployeeId: parsed.currentEmployeeId || CURRENT_EMP_ID,
      anonymiseHR:
        typeof parsed.anonymiseHR === "boolean" ? parsed.anonymiseHR : true,
      profile:
        parsed.profile && typeof parsed.profile === "object"
          ? parsed.profile
          : null,
      courseProgress:
        parsed.courseProgress && typeof parsed.courseProgress === "object"
          ? parsed.courseProgress
          : {},
      testResults:
        parsed.testResults && typeof parsed.testResults === "object"
          ? parsed.testResults
          : {},
      verifiedLevels:
        parsed.verifiedLevels && typeof parsed.verifiedLevels === "object"
          ? parsed.verifiedLevels
          : {},
      notifications: Array.isArray(parsed.notifications)
        ? parsed.notifications
        : [],
      nudges: Array.isArray(parsed.nudges) ? parsed.nudges : [],
      priorities: Array.isArray(parsed.priorities)
        ? parsed.priorities
        : base.priorities,
      replanHistory: Array.isArray(parsed.replanHistory)
        ? parsed.replanHistory
        : [],
      updatedAt: parsed.updatedAt || null,
    };
  }

  function readLocal() {
    try {
      let raw = window.localStorage.getItem(STORAGE_KEY);
      let needsMigrationSave = false;
      if (!raw) {
        const legacyRaw = window.localStorage.getItem(LEGACY_KEY);
        if (legacyRaw) {
          raw = legacyRaw;
          needsMigrationSave = true;
        }
      }
      if (!raw) {
        return defaultState();
      }
      const parsed = JSON.parse(raw);
      const migrated = migrateState(parsed);
      if (needsMigrationSave || !parsed.schemaVersion) {
        writeLocal(migrated);
      }
      return migrated;
    } catch (_err) {
      return defaultState();
    }
  }

  function writeLocal(state) {
    const payload = {
      ...migrateState(state),
      updatedAt: state.updatedAt || new Date().toISOString(),
    };
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch (_err) {
      // Ignore storage quota errors in restricted environments.
    }
    return payload;
  }

  async function initState() {
    return readLocal();
  }

  async function saveProfile(profile) {
    const local = readLocal();
    return writeLocal({
      ...local,
      profile,
      updatedAt: new Date().toISOString(),
    });
  }

  async function setCourseStatus(courseId, status) {
    const local = readLocal();
    const progress = { ...(local.courseProgress || {}) };
    if (status === "not_started") {
      delete progress[courseId];
    } else {
      progress[courseId] = status;
    }
    return writeLocal({
      ...local,
      courseProgress: progress,
      updatedAt: new Date().toISOString(),
    });
  }

  async function setActiveRole(role) {
    const valid = ["employee", "manager", "hr"].includes(role)
      ? role
      : "employee";
    const local = readLocal();
    return writeLocal({
      ...local,
      activeRole: valid,
      updatedAt: new Date().toISOString(),
    });
  }

  async function setAnonymiseHR(value) {
    const local = readLocal();
    return writeLocal({
      ...local,
      anonymiseHR: Boolean(value),
      updatedAt: new Date().toISOString(),
    });
  }

  async function recordTestAttempt(employeeId, skillId, attemptRecord) {
    const local = readLocal();
    const empId = employeeId || local.currentEmployeeId || CURRENT_EMP_ID;
    const allResults = { ...(local.testResults || {}) };
    const empResults = { ...(allResults[empId] || {}) };
    const prevAttempts = Array.isArray(empResults[skillId])
      ? empResults[skillId].slice()
      : [];

    prevAttempts.push(attemptRecord);
    empResults[skillId] = prevAttempts;
    allResults[empId] = empResults;

    const allVerified = { ...(local.verifiedLevels || {}) };
    const empVerified = { ...(allVerified[empId] || {}) };
    empVerified[skillId] = {
      level: attemptRecord.level,
      score: attemptRecord.score,
      easyCorrect: attemptRecord.easyCorrect,
      hardCorrect: attemptRecord.hardCorrect,
      verifiedPct: attemptRecord.verifiedPct,
      updatedAt: attemptRecord.date,
    };
    allVerified[empId] = empVerified;

    return writeLocal({
      ...local,
      testResults: allResults,
      verifiedLevels: allVerified,
      updatedAt: new Date().toISOString(),
    });
  }

  async function addReplanEntry(entry) {
    const local = readLocal();
    const list = Array.isArray(local.replanHistory)
      ? local.replanHistory.slice()
      : [];
    list.unshift({
      id: `replan_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      date: new Date().toISOString(),
      ...entry,
    });
    return writeLocal({
      ...local,
      replanHistory: list.slice(0, 30),
      updatedAt: new Date().toISOString(),
    });
  }

  async function addNudge({
    employeeId,
    employeeName,
    actionType = "nudge",
    senderRole = "manager",
    message,
  }) {
    const local = readLocal();
    const timestamp = new Date().toISOString();
    const id = `msg_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

    const notifications = [
      {
        id,
        employeeId,
        employeeName,
        type: actionType,
        senderRole,
        message,
        createdAt: timestamp,
        read: false,
      },
      ...(local.notifications || []),
    ].slice(0, 40);

    const nudges = [
      {
        id,
        employeeId,
        employeeName,
        actionType,
        senderRole,
        message,
        createdAt: timestamp,
      },
      ...(local.nudges || []),
    ].slice(0, 40);

    return writeLocal({
      ...local,
      notifications,
      nudges,
      updatedAt: timestamp,
    });
  }

  async function markNotificationsRead() {
    const local = readLocal();
    const notifications = (local.notifications || []).map((n) => ({
      ...n,
      read: true,
    }));
    return writeLocal({
      ...local,
      notifications,
      updatedAt: new Date().toISOString(),
    });
  }

  async function savePriorities(priorities) {
    const local = readLocal();
    const clean = (Array.isArray(priorities) ? priorities : [])
      .filter((p) => p && p.skillId)
      .map((p) => ({
        skillId: String(p.skillId),
        weight: Math.max(1, Math.min(5, Number(p.weight) || 3)),
      }));

    return writeLocal({
      ...local,
      priorities: clean,
      updatedAt: new Date().toISOString(),
    });
  }

  async function resetState() {
    const local = readLocal();
    try {
      window.localStorage.removeItem(STORAGE_KEY);
      window.localStorage.removeItem(LEGACY_KEY);
    } catch (_err) {
      // Ignore storage removal errors.
    }
    const fresh = defaultState();
    fresh.activeRole = local.activeRole || "employee";
    return fresh;
  }

  function getTheme() {
    try {
      return window.localStorage.getItem(THEME_KEY) === "dark"
        ? "dark"
        : "light";
    } catch (_err) {
      return "light";
    }
  }

  function setTheme(theme) {
    const clean = theme === "dark" ? "dark" : "light";
    try {
      window.localStorage.setItem(THEME_KEY, clean);
    } catch (_err) {
      // Ignore storage error.
    }
    document.documentElement.setAttribute("data-theme", clean);
    return clean;
  }

  return {
    CURRENT_EMP_ID,
    readLocal,
    initState,
    saveProfile,
    setCourseStatus,
    setActiveRole,
    setAnonymiseHR,
    recordTestAttempt,
    addReplanEntry,
    addNudge,
    markNotificationsRead,
    savePriorities,
    resetState,
    getTheme,
    setTheme,
  };
})();
