/**
 * Hybrid persistence layer: writes synchronously to localStorage and syncs
 * with Flask SQLite API endpoints when served over HTTP(S).
 */
window.SkillPathStorage = (function () {
  const STORAGE_KEY = "skillpath_ai_state_v1";

  function isHttpOrigin() {
    return (
      window.location.protocol === "http:" ||
      window.location.protocol === "https:"
    );
  }

  function readLocal() {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return { profile: null, courseProgress: {}, updatedAt: null };
      }
      const parsed = JSON.parse(raw);
      return {
        profile: parsed && typeof parsed.profile === "object" ? parsed.profile : null,
        courseProgress:
          parsed && parsed.courseProgress && typeof parsed.courseProgress === "object"
            ? parsed.courseProgress
            : {},
        updatedAt: parsed && parsed.updatedAt ? parsed.updatedAt : null,
      };
    } catch (_err) {
      return { profile: null, courseProgress: {}, updatedAt: null };
    }
  }

  function writeLocal(state) {
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          profile: state.profile || null,
          courseProgress: state.courseProgress || {},
          updatedAt: state.updatedAt || new Date().toISOString(),
        })
      );
    } catch (_err) {
      // Ignore storage quota errors in restricted environments.
    }
  }

  async function apiRequest(url, options) {
    if (!isHttpOrigin()) return null;
    try {
      const resp = await window.fetch(url, {
        headers: { "Content-Type": "application/json" },
        ...options,
      });
      if (!resp.ok) return null;
      return await resp.json();
    } catch (_err) {
      return null;
    }
  }

  async function initState() {
    const local = readLocal();
    const remote = await apiRequest("/api/state", { method: "GET" });
    if (!remote) return local;

    const remoteHasData = Boolean(
      remote.profile ||
        (remote.courseProgress && Object.keys(remote.courseProgress).length > 0)
    );
    const localHasData = Boolean(
      local.profile ||
        (local.courseProgress && Object.keys(local.courseProgress).length > 0)
    );

    if (remoteHasData && !localHasData) {
      writeLocal(remote);
      return remote;
    }

    if (localHasData && !remoteHasData) {
      await apiRequest("/api/state", {
        method: "POST",
        body: JSON.stringify(local),
      });
      return local;
    }

    if (remoteHasData && localHasData && remote.updatedAt && local.updatedAt) {
      if (new Date(remote.updatedAt) > new Date(local.updatedAt)) {
        writeLocal(remote);
        return remote;
      }
    }

    return local;
  }

  async function saveProfile(profile) {
    const local = readLocal();
    const nextState = {
      profile,
      courseProgress: local.courseProgress || {},
      updatedAt: new Date().toISOString(),
    };
    writeLocal(nextState);

    const synced = await apiRequest("/api/profile", {
      method: "POST",
      body: JSON.stringify(profile),
    });
    if (synced) {
      writeLocal(synced);
      return synced;
    }
    return nextState;
  }

  async function setCourseStatus(courseId, status) {
    const local = readLocal();
    const progress = { ...(local.courseProgress || {}) };
    if (status === "not_started") {
      delete progress[courseId];
    } else {
      progress[courseId] = status;
    }
    const nextState = {
      profile: local.profile,
      courseProgress: progress,
      updatedAt: new Date().toISOString(),
    };
    writeLocal(nextState);

    const synced = await apiRequest("/api/course-status", {
      method: "POST",
      body: JSON.stringify({ courseId, status }),
    });
    if (synced) {
      writeLocal(synced);
      return synced;
    }
    return nextState;
  }

  async function resetState() {
    const empty = { profile: null, courseProgress: {}, updatedAt: null };
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch (_err) {
      // Ignore storage removal errors.
    }
    await apiRequest("/api/state", { method: "DELETE" });
    return empty;
  }

  return {
    readLocal,
    initState,
    saveProfile,
    setCourseStatus,
    resetState,
  };
})();
