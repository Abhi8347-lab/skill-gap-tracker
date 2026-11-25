/**
 * Browser localStorage persistence layer for SkillSync AI.
 * Stores all user profile data, skill scores, and course progress strictly
 * in localStorage (no server files or local databases).
 */
window.SkillPathStorage = (function () {
  const STORAGE_KEY = "skillsync_ai_state_v1";
  const LEGACY_KEY = "skillpath_ai_state_v1";

  function readLocal() {
    try {
      let raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        const legacyRaw = window.localStorage.getItem(LEGACY_KEY);
        if (legacyRaw) {
          raw = legacyRaw;
          window.localStorage.setItem(STORAGE_KEY, legacyRaw);
        }
      }
      if (!raw) {
        return { profile: null, courseProgress: {}, updatedAt: null };
      }
      const parsed = JSON.parse(raw);
      return {
        profile:
          parsed && typeof parsed.profile === "object" ? parsed.profile : null,
        courseProgress:
          parsed &&
          parsed.courseProgress &&
          typeof parsed.courseProgress === "object"
            ? parsed.courseProgress
            : {},
        updatedAt: parsed && parsed.updatedAt ? parsed.updatedAt : null,
      };
    } catch (_err) {
      return { profile: null, courseProgress: {}, updatedAt: null };
    }
  }

  function writeLocal(state) {
    const payload = {
      profile: state.profile || null,
      courseProgress: state.courseProgress || {},
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
      profile,
      courseProgress: local.courseProgress || {},
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
      profile: local.profile,
      courseProgress: progress,
      updatedAt: new Date().toISOString(),
    });
  }

  async function resetState() {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
      window.localStorage.removeItem(LEGACY_KEY);
    } catch (_err) {
      // Ignore storage removal errors.
    }
    return { profile: null, courseProgress: {}, updatedAt: null };
  }

  return {
    readLocal,
    initState,
    saveProfile,
    setCourseStatus,
    resetState,
  };
})();
