import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, clearToken, getToken, setToken } from "../api/client";
import { googleIdToken, initFirebase } from "../lib/firebase";
import { RIGHTWAY_COURSES } from "../data/courses";
import { getCourseLevelData } from "../data/curriculum";
import { getLesson } from "../data/lessons";
import {
  clearSavedState,
  emptyStatuses,
  getCourseProgress,
  getGraphicDesignProgress,
  getMedicalProgress,
  lessonSlot,
  loadSavedState,
  saveAppState,
  saveCourseProgress,
  saveGraphicDesignProgress,
  saveMedicalProgress,
} from "../utils/progress";
import { PATHS } from "../utils/paths";

const AppContext = createContext(null);
export const useApp = () => useContext(AppContext);

export const GUEST_USER = {
  name: "Rightway Student",
  email: "student@rightwayskillbuilder.com",
  role: "student",
};

const DEFAULTS = {
  user: null,
  xp: 0,
  statuses: emptyStatuses(10),
  cssStatuses: emptyStatuses(12),
  jsStatuses: emptyStatuses(6),
  medicalStatuses: emptyStatuses(15),
  graphicDesignStatuses: emptyStatuses(12),
  certificateId: null,
  certificateIssuedAt: null,
  editorCode: {}, // lessonId -> current code string
  quizState: {}, // lessonId (or generic_<course>_<level>) -> { selected, submitted, passed, score, pct }
  medicalLevel: 1,
  enrolledCourses: ["graphic_design", "medical_coding"],
};

const freshQuiz = () => ({ selected: {}, submitted: false, passed: false });

// Returns a copy of `s` with one lesson's status entry updated.
function withSlot(s, lessonId, changes) {
  const { arr, idx } = lessonSlot(lessonId);
  const next = s[arr].slice();
  next[idx] = { ...next[idx], ...changes };
  return { ...s, [arr]: next };
}

export function AppProvider({ children }) {
  const navigate = useNavigate();
  const [state, setState] = useState(() => loadSavedState(DEFAULTS));
  const [toast, setToast] = useState(null);
  const [activeModal, setActiveModal] = useState(null); // "contact" | "info" | { type: "course", courseId } | null

  const stateRef = useRef(state);
  stateRef.current = state;
  const toastTimer = useRef(null);
  const heartbeatTimer = useRef(null);
  const certInFlight = useRef(false);

  /* ---------- persistence ---------- */

  useEffect(() => {
    const t = setTimeout(() => saveAppState(state), 300);
    return () => clearTimeout(t);
  }, [state]);

  useEffect(() => {
    const flush = () => saveAppState(stateRef.current);
    window.addEventListener("pagehide", flush);
    return () => window.removeEventListener("pagehide", flush);
  }, []);

  /* ---------- toast / xp ---------- */

  const showToast = useCallback((message) => {
    setToast({ message });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2200);
  }, []);

  const awardXp = useCallback(
    (amount) => {
      setState((s) => ({ ...s, xp: s.xp + amount }));
      showToast(`+${amount} XP earned!`);
    },
    [showToast]
  );

  const closeModal = useCallback(() => setActiveModal(null), []);

  /* ---------- backend sync & heartbeat ---------- */

  const stopHeartbeat = useCallback(() => {
    clearInterval(heartbeatTimer.current);
    heartbeatTimer.current = null;
  }, []);

  const startHeartbeat = useCallback(() => {
    stopHeartbeat();
    const send = async () => {
      if (!getToken()) return;
      try {
        await api.heartbeat();
      } catch {
        /* ignore periodic heartbeat failures */
      }
    };
    send();
    heartbeatTimer.current = setInterval(send, 60000);
  }, [stopHeartbeat]);

  const logout = useCallback(async () => {
    stopHeartbeat();
    try {
      await api.logout();
    } catch {
      /* ignore network errors on logout */
    }
    clearToken();
    clearSavedState();
    setState((s) => ({ ...s, user: null, certificateId: null, certificateIssuedAt: null }));
    navigate(PATHS.home);
  }, [navigate, stopHeartbeat]);

  const syncProgress = useCallback(async () => {
    if (!getToken()) return;
    try {
      const res = await api.progress();
      if (res.ok) {
        const data = await res.json();
        setState((s) => {
          const n = { ...s };
          if (Array.isArray(data.statuses) && data.statuses.length === 10) n.statuses = data.statuses;
          if (Array.isArray(data.cssStatuses) && data.cssStatuses.length === 12) n.cssStatuses = data.cssStatuses;
          if (Array.isArray(data.jsStatuses) && data.jsStatuses.length === 6) n.jsStatuses = data.jsStatuses;
          if (Array.isArray(data.medicalStatuses)) {
            n.medicalStatuses = s.medicalStatuses.slice();
            data.medicalStatuses.forEach((st, idx) => {
              if (idx < 15 && st) n.medicalStatuses[idx] = st;
            });
          }
          if (Array.isArray(data.graphicDesignStatuses)) {
            n.graphicDesignStatuses = s.graphicDesignStatuses.slice();
            data.graphicDesignStatuses.forEach((st, idx) => {
              if (idx < 12 && st) n.graphicDesignStatuses[idx] = st;
            });
          }
          if (typeof data.xp === "number") n.xp = data.xp;
          if (data.certificateId) n.certificateId = data.certificateId;
          if (data.certificateIssuedAt) n.certificateIssuedAt = data.certificateIssuedAt;
          return n;
        });
      } else if (res.status === 401) {
        logout();
      }
    } catch (err) {
      console.warn("Could not sync progress from backend:", err);
    }
  }, [logout]);

  const syncLesson = useCallback(async (lessonId, payload) => {
    if (!getToken()) return;
    try {
      const res = await api.saveLesson(lessonId, payload);
      if (res.ok) {
        const data = await res.json();
        if (typeof data.xp === "number") setState((s) => ({ ...s, xp: data.xp }));
      }
    } catch (err) {
      console.warn("Failed to sync lesson progress to backend:", err);
    }
  }, []);

  const requestCertificate = useCallback(async () => {
    if (certInFlight.current || stateRef.current.certificateId) return;
    certInFlight.current = true;
    try {
      const res = await api.issueCertificate();
      if (res.ok) {
        const data = await res.json();
        setState((s) => ({ ...s, certificateId: data.certificateId, certificateIssuedAt: data.issuedAt }));
      }
    } catch (err) {
      console.warn("Failed to issue backend certificate:", err);
    } finally {
      certInFlight.current = false;
    }
  }, []);

  // Restore the session on first load.
  useEffect(() => {
    initFirebase(); // preload Firebase config in the background
    (async () => {
      if (!getToken()) return;
      try {
        const res = await api.me();
        if (res.ok) {
          const u = await res.json();
          setState((s) => ({ ...s, user: u }));
          await syncProgress();
          startHeartbeat();
        } else if (res.status === 401) {
          logout();
        }
      } catch (e) {
        console.warn("Could not verify session on load:", e);
      }
    })();
    return stopHeartbeat;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---------- auth ---------- */

  const applyAuth = useCallback(
    async (data) => {
      setToken(data.token);
      setState((s) => ({
        ...s,
        user: {
          name: data.name,
          email: data.email,
          role: data.role,
          studentId: data.studentId || data.user?.studentId || "RSB001",
          enrolledCourse: data.enrolledCourse || data.user?.enrolledCourse || "Full Stack Web Development",
          ...(data.user || {}),
        },
      }));
      await syncProgress();
      startHeartbeat();
    },
    [startHeartbeat, syncProgress]
  );

  const emailLogin = useCallback(
    async (email, password) => {
      const res = await api.login(email, password);
      const data = await res.json();
      if (!res.ok) {
        const error = new Error(data.message || "Login failed");
        error.requiresVerification = Boolean(data.requiresVerification);
        error.email = data.email || email;
        error.data = data;
        throw error;
      }
      await applyAuth(data);
    },
    [applyAuth]
  );

  const emailSignup = useCallback(
    async (name, email, password) => {
      const res = await api.signup(name, email, password);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Signup failed");
      await applyAuth(data);
    },
    [applyAuth]
  );

  const googleAuth = useCallback(async () => {
    const idToken = await googleIdToken();
    if (!idToken) {
      const err = new Error(
        "Google Sign-In is unavailable. Firebase configuration could not be loaded from backend or Firebase SDK was blocked."
      );
      err.code = "app/firebase-unavailable";
      throw err;
    }
    const res = await api.google(idToken);
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Google sign-in failed");
    await applyAuth(data);
  }, [applyAuth]);

  // Course pages are browsable without an account; they run under a placeholder student.
  const ensureGuestUser = useCallback((user = GUEST_USER) => {
    setState((s) => (s.user ? s : { ...s, user }));
  }, []);

  /* ---------- editor / quiz primitives ---------- */

  const setEditorCode = useCallback((lessonId, code) => {
    setState((s) => ({ ...s, editorCode: { ...s.editorCode, [lessonId]: code } }));
  }, []);

  const setQuizAnswer = useCallback((key, qIndex, option) => {
    setState((s) => {
      const q = s.quizState[key] || freshQuiz();
      return { ...s, quizState: { ...s.quizState, [key]: { ...q, selected: { ...q.selected, [qIndex]: option } } } };
    });
  }, []);

  const resetQuiz = useCallback((key) => {
    setState((s) => ({ ...s, quizState: { ...s.quizState, [key]: freshQuiz() } }));
  }, []);

  /* ---------- HTML / CSS / JS code lessons ---------- */

  const completeCodeTask = useCallback(
    (lessonId) => {
      const { arr, idx } = lessonSlot(lessonId);
      const was = stateRef.current[arr][idx].taskCompleted;
      setState((s) => ({ ...withSlot(s, lessonId, { taskCompleted: true }), xp: s.xp + (was ? 0 : 1) }));
      if (!was) showToast("+1 XP earned!");
      syncLesson(lessonId, { taskCompleted: true, xpAward: was ? 0 : 1 });
    },
    [showToast, syncLesson]
  );

  const passCodeQuiz = useCallback(
    (lessonId) => {
      const { arr, idx } = lessonSlot(lessonId);
      const was = stateRef.current[arr][idx].testPassed;
      setState((s) => {
        const q = s.quizState[lessonId] || freshQuiz();
        const n = withSlot(s, lessonId, { testPassed: true });
        return {
          ...n,
          xp: s.xp + (was ? 0 : 1),
          quizState: { ...s.quizState, [lessonId]: { ...q, passed: true } },
        };
      });
      if (!was) showToast("+1 XP earned!");
      syncLesson(lessonId, { testPassed: true, xpAward: was ? 0 : 1 });
    },
    [showToast, syncLesson]
  );

  /* ---------- Medical Coding lessons ---------- */

  // Returns "incomplete" when not every question is answered, otherwise { passed, correct, pct }.
  const submitMedicalQuiz = useCallback(
    (lessonId) => {
      const lesson = getLesson(lessonId);
      if (!lesson || !lesson.quiz || !lesson.quiz.questions) return null;
      const questions = lesson.quiz.questions;
      const total = questions.length;
      const cur = stateRef.current;
      const quiz = cur.quizState[lessonId] || freshQuiz();

      if (Object.keys(quiz.selected).length < total) return "incomplete";

      let correct = 0;
      questions.forEach((q, i) => {
        if (quiz.selected[i] === q.correct) correct++;
      });
      const pct = Math.round((correct / total) * 100);
      const passed = pct >= 70;

      const { arr, idx } = lessonSlot(lessonId);
      const wasPassed = cur[arr][idx].testPassed;

      setState((s) => {
        let n = {
          ...s,
          quizState: { ...s.quizState, [lessonId]: { ...quiz, submitted: true, passed, score: correct, pct } },
        };
        if (passed) {
          n = withSlot(n, lessonId, { taskCompleted: true, testPassed: true });
          if (!wasPassed) n.xp = s.xp + 5;
        }
        return n;
      });

      if (passed) {
        if (!wasPassed) showToast("+5 XP earned!");
        const prog = getMedicalProgress();
        const lvlNum = lessonId - 28;
        if (!prog.completedLevels.includes(lvlNum)) prog.completedLevels.push(lvlNum);
        if (lvlNum === prog.unlockedLevel && lvlNum < 15) prog.unlockedLevel = lvlNum + 1;
        prog.scores[lvlNum] = pct;
        saveMedicalProgress(prog);
        syncLesson(lessonId, { taskCompleted: true, testPassed: true, xpAward: wasPassed ? 0 : 5 });
      }
      return { passed, correct, pct };
    },
    [showToast, syncLesson]
  );

  /* ---------- Graphic Design lessons ---------- */

  const completeGraphicLesson = useCallback(
    (lessonId) => {
      const { arr, idx } = lessonSlot(lessonId);
      const cur = stateRef.current[arr][idx];
      const wasPassed = cur.taskCompleted && cur.testPassed;
      setState((s) => {
        const n = withSlot(s, lessonId, { taskCompleted: true, testPassed: true });
        return { ...n, xp: s.xp + (wasPassed ? 0 : 5) };
      });

      const prog = getGraphicDesignProgress();
      const lvlNum = lessonId - 43; // 1 to 12
      if (!prog.completedLevels.includes(lvlNum)) prog.completedLevels.push(lvlNum);
      if (lvlNum === prog.unlockedLevel && lvlNum < 12) prog.unlockedLevel = lvlNum + 1;
      saveGraphicDesignProgress(prog);

      syncLesson(lessonId, { taskCompleted: true, testPassed: true, xpAward: wasPassed ? 0 : 5 });
      showToast(`Level ${lvlNum} Completed! +5 XP`);
    },
    [showToast, syncLesson]
  );

  /* ---------- Generic (video + MCQ) course levels ---------- */

  const submitGenericQuiz = useCallback(
    (courseId, levelNum) => {
      const key = `generic_${courseId}_${levelNum}`;
      const cur = stateRef.current;
      const quiz = cur.quizState[key];
      if (!quiz) return;

      const questions = getCourseLevelData(courseId, levelNum).mcqs || [];
      let correct = 0;
      questions.forEach((q, idx) => {
        if (quiz.selected[idx] === q.options[q.answer]) correct++;
      });
      const pct = Math.round((correct / (questions.length || 1)) * 100);
      const passed = pct >= 70;

      setState((s) => ({
        ...s,
        xp: s.xp + (passed ? 5 : 0),
        quizState: { ...s.quizState, [key]: { ...quiz, submitted: true, passed, score: correct, pct } },
      }));

      if (passed) {
        const prog = getCourseProgress(courseId, cur);
        if (!prog.completedLevels) prog.completedLevels = [];
        if (!prog.completedLevels.includes(levelNum)) prog.completedLevels.push(levelNum);
        prog.currentLevel = Math.min(levelNum + 1, 100);
        prog.isStarted = true;
        if (!prog.scores) prog.scores = {};
        prog.scores[levelNum] = pct;
        saveCourseProgress(courseId, prog);
        showToast(`Level ${String(levelNum).padStart(2, "0")} Completed! +5 XP`);
      }
    },
    [showToast]
  );

  /* ---------- landing page ---------- */

  const enrollInCourse = useCallback(
    (courseId) => {
      setState((s) => ({
        ...s,
        xp: s.xp + 15,
        enrolledCourses: s.enrolledCourses.includes(courseId) ? s.enrolledCourses : [...s.enrolledCourses, courseId],
      }));
      setActiveModal(null);
      const c = RIGHTWAY_COURSES.find((item) => item.id === courseId);
      showToast(`Enrolled in ${c ? c.title : "Course"}! +15 XP`);
    },
    [showToast]
  );

  const value = useMemo(
    () => ({
      ...state,
      toast,
      activeModal,
      setActiveModal,
      closeModal,
      showToast,
      awardXp,
      applyAuth,
      emailLogin,
      emailSignup,
      googleAuth,
      logout,
      ensureGuestUser,
      requestCertificate,
      setEditorCode,
      setQuizAnswer,
      resetQuiz,
      completeCodeTask,
      passCodeQuiz,
      submitMedicalQuiz,
      completeGraphicLesson,
      submitGenericQuiz,
      enrollInCourse,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [state, toast, activeModal]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
