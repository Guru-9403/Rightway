// localStorage-backed progress helpers (keys kept identical to the vanilla app so existing browsers keep their progress).

export const STORAGE_KEY = "rightway_skill_builder_state_v1";
const MEDICAL_KEY = "medical_code_progress_v1";
const GRAPHIC_KEY = "graphic_design_progress_v1";

export const emptyStatus = () => ({ taskCompleted: false, testPassed: false });
export const emptyStatuses = (n) => Array.from({ length: n }, emptyStatus);

export const isDone = (s) => !!(s && s.taskCompleted && s.testPassed);

export function trackPercent(arr, total) {
  return Math.round((arr.reduce((acc, s) => acc + (isDone(s) ? 1 : 0), 0) / total) * 100);
}

// lesson id -> which status array/index it lives in
export function lessonSlot(lessonId) {
  if (lessonId <= 10) return { arr: "statuses", idx: lessonId - 1 };
  if (lessonId <= 22) return { arr: "cssStatuses", idx: lessonId - 11 };
  if (lessonId <= 28) return { arr: "jsStatuses", idx: lessonId - 23 };
  if (lessonId <= 43) return { arr: "medicalStatuses", idx: lessonId - 29 };
  return { arr: "graphicDesignStatuses", idx: lessonId - 44 };
}

function readJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* localStorage unavailable or full */
  }
}

/* ---- per-course progress blobs ---- */

function readLevelProgress(key) {
  const parsed = readJson(key, null);
  return parsed && typeof parsed.unlockedLevel === "number" ? parsed : { unlockedLevel: 1, completedLevels: [], scores: {} };
}

export const getMedicalProgress = () => readLevelProgress(MEDICAL_KEY);
export const saveMedicalProgress = (prog) => writeJson(MEDICAL_KEY, prog);
export const getGraphicDesignProgress = () => readLevelProgress(GRAPHIC_KEY);
export const saveGraphicDesignProgress = (prog) => writeJson(GRAPHIC_KEY, prog);

export const saveCourseProgress = (courseId, prog) => writeJson(`course_prog_${courseId}`, prog);

function levelSummary(done, extraKey) {
  const p = readJson(extraKey, {});
  const isStarted = done > 0 || !!(p.isStarted || (p.completedLevels && p.completedLevels.length > 0));
  return {
    completedCount: done,
    currentLevel: !isStarted ? 0 : Math.min(done + 1, 100),
    isStarted,
    completedLevels: Array.from({ length: done }, (_, i) => i + 1),
  };
}

// state = { medicalStatuses, graphicDesignStatuses }
export function getCourseProgress(courseId, state) {
  if (courseId === "medical_coding") {
    return levelSummary(state.medicalStatuses.filter(isDone).length, MEDICAL_KEY);
  }
  if (courseId === "graphic_design") {
    return levelSummary(state.graphicDesignStatuses.filter(isDone).length, GRAPHIC_KEY);
  }

  const data = readJson(`course_prog_${courseId}`, null);
  if (data) {
    const done = Array.isArray(data.completedLevels) ? data.completedLevels.length : 0;
    const isStarted = !!data.isStarted || done > 0;
    return {
      completedCount: done,
      currentLevel: !isStarted ? 0 : Math.min(done + 1, 100),
      isStarted,
      completedLevels: data.completedLevels || [],
      scores: data.scores || {},
    };
  }
  return { completedCount: 0, currentLevel: 0, isStarted: false, completedLevels: [], scores: {} };
}

/* ---- whole-app persistence ---- */

export function loadSavedState(defaults) {
  const state = { ...defaults };
  const saved = readJson(STORAGE_KEY, null);
  if (saved) {
    if (saved.user) state.user = saved.user;
    if (typeof saved.xp === "number") state.xp = saved.xp;
    if (Array.isArray(saved.statuses) && saved.statuses.length === 10) state.statuses = saved.statuses;
    if (Array.isArray(saved.cssStatuses) && saved.cssStatuses.length === 12) state.cssStatuses = saved.cssStatuses;
    if (Array.isArray(saved.jsStatuses) && saved.jsStatuses.length === 6) state.jsStatuses = saved.jsStatuses;
    if (Array.isArray(saved.medicalStatuses)) {
      state.medicalStatuses = Array.from({ length: 15 }, (_, i) => saved.medicalStatuses[i] || emptyStatus());
    }
    if (Array.isArray(saved.graphicDesignStatuses)) {
      state.graphicDesignStatuses = Array.from({ length: 12 }, (_, i) => saved.graphicDesignStatuses[i] || emptyStatus());
    }
    if (typeof saved.medicalLevel === "number") state.medicalLevel = saved.medicalLevel;
    if (saved.certificateId) state.certificateId = saved.certificateId;
    if (saved.certificateIssuedAt) state.certificateIssuedAt = saved.certificateIssuedAt;
    if (saved.editorCode) state.editorCode = saved.editorCode;
    if (saved.quizState) state.quizState = saved.quizState;
  }

  // Fold the per-course "completedLevels" blobs back into the status arrays.
  const fold = (key, arrName, max) => {
    const prog = readJson(key, {});
    if (Array.isArray(prog.completedLevels)) {
      const next = state[arrName].map((s) => ({ ...s }));
      prog.completedLevels.forEach((lvl) => {
        const idx = lvl - 1;
        if (idx >= 0 && idx < max) next[idx] = { taskCompleted: true, testPassed: true };
      });
      state[arrName] = next;
    }
  };
  fold(MEDICAL_KEY, "medicalStatuses", 15);
  fold(GRAPHIC_KEY, "graphicDesignStatuses", 12);

  return state;
}

export function saveAppState(state) {
  writeJson(STORAGE_KEY, {
    user: state.user,
    xp: state.xp,
    statuses: state.statuses,
    cssStatuses: state.cssStatuses,
    jsStatuses: state.jsStatuses,
    medicalStatuses: state.medicalStatuses,
    graphicDesignStatuses: state.graphicDesignStatuses,
    certificateId: state.certificateId,
    certificateIssuedAt: state.certificateIssuedAt,
    editorCode: state.editorCode,
    quizState: state.quizState,
    medicalLevel: state.medicalLevel,
  });
}

export function clearSavedState() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
