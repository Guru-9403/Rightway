import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { getCourseProgress, getMedicalProgress, saveCourseProgress, saveMedicalProgress } from "../utils/progress";
import { PATHS } from "../utils/paths";

// Course entry points shared by the landing page, intro page and lesson pages.
export function useCourseNav() {
  const navigate = useNavigate();
  const app = useApp();
  const { user, showToast } = app;

  // Verify real registered user (blocks guest access from directly watching/starting courses)
  const requireAuthOrRedirect = useCallback(
    (targetPath) => {
      const isAuth = !!user && user.email !== "student@rightwayskillbuilder.com";
      if (!isAuth) {
        sessionStorage.setItem("returnTo", targetPath);
        sessionStorage.setItem("openProfileAfterAuth", "true");
        if (showToast) {
          showToast("Please sign up first to watch course videos and start learning!");
        }
        navigate(`${PATHS.signup}?returnTo=${encodeURIComponent(targetPath)}`);
        return false;
      }
      return true;
    },
    [user, navigate, showToast]
  );

  const startCourse = useCallback(
    (courseId) => {
      const targetPath = PATHS.course(courseId);
      if (!requireAuthOrRedirect(targetPath)) return;
      navigate(targetPath);
    },
    [requireAuthOrRedirect, navigate]
  );

  const launchCourseLevel = useCallback(
    (courseId, levelNum) => {
      let targetPath = PATHS.courseLevel(courseId, levelNum || 1);
      if (courseId === "medical_coding") {
        targetPath = PATHS.lesson(28 + (levelNum || 1));
      } else if (courseId === "graphic_design") {
        targetPath = PATHS.lesson(43 + (levelNum || 1));
      } else if (courseId === "adobe_photoshop" && levelNum === 1) {
        targetPath = PATHS.lesson(46);
      } else if (courseId === "adobe_illustrator" && levelNum === 1) {
        targetPath = PATHS.lesson(44);
      } else if (courseId === "coreldraw" && levelNum === 1) {
        targetPath = PATHS.lesson(48);
      }

      if (!requireAuthOrRedirect(targetPath)) return;

      if (courseId === "medical_coding") {
        const prog = getMedicalProgress();
        prog.isStarted = true;
        saveMedicalProgress(prog);
        return navigate(targetPath);
      }

      if (courseId === "graphic_design") {
        try {
          const p = JSON.parse(localStorage.getItem("graphic_design_progress_v1") || "{}");
          p.isStarted = true;
          localStorage.setItem("graphic_design_progress_v1", JSON.stringify(p));
        } catch {
          /* ignore */
        }
        return navigate(targetPath);
      }

      // Generic courses
      const prog = getCourseProgress(courseId, app);
      prog.isStarted = true;
      if (!prog.currentLevel) prog.currentLevel = levelNum || 1;
      saveCourseProgress(courseId, prog);

      navigate(targetPath);
    },
    [app, requireAuthOrRedirect, navigate]
  );

  const launchCourseCurrentLevel = useCallback(
    (courseId) => {
      const prog = getCourseProgress(courseId, app);
      launchCourseLevel(courseId, prog.currentLevel === 0 ? 1 : prog.currentLevel);
    },
    [app, launchCourseLevel]
  );

  return { startCourse, launchCourseLevel, launchCourseCurrentLevel, requireAuthOrRedirect };
}
