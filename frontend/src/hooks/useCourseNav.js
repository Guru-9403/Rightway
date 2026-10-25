import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { getCourseProgress, getMedicalProgress, saveCourseProgress, saveMedicalProgress } from "../utils/progress";
import { PATHS } from "../utils/paths";

// Course entry points shared by the landing page, intro page and lesson pages.
export function useCourseNav() {
  const navigate = useNavigate();
  const app = useApp();
  const { ensureGuestUser } = app;

  const startCourse = useCallback(
    (courseId) => {
      ensureGuestUser();
      navigate(PATHS.course(courseId));
    },
    [ensureGuestUser, navigate]
  );

  const launchCourseLevel = useCallback(
    (courseId, levelNum) => {
      ensureGuestUser();

      if (courseId === "medical_coding") {
        const prog = getMedicalProgress();
        prog.isStarted = true;
        saveMedicalProgress(prog);
        return navigate(PATHS.lesson(28 + (levelNum || 1)));
      }

      if (courseId === "graphic_design") {
        try {
          const p = JSON.parse(localStorage.getItem("graphic_design_progress_v1") || "{}");
          p.isStarted = true;
          localStorage.setItem("graphic_design_progress_v1", JSON.stringify(p));
        } catch {
          /* ignore */
        }
        return navigate(PATHS.lesson(43 + (levelNum || 1)));
      }

      // Generic courses
      const prog = getCourseProgress(courseId, app);
      prog.isStarted = true;
      if (!prog.currentLevel) prog.currentLevel = levelNum || 1;
      saveCourseProgress(courseId, prog);

      // Suite courses reuse the Graphic Design video lessons for level 1.
      if (courseId === "adobe_photoshop" && levelNum === 1) return navigate(PATHS.lesson(46));
      if (courseId === "adobe_illustrator" && levelNum === 1) return navigate(PATHS.lesson(44));
      if (courseId === "coreldraw" && levelNum === 1) return navigate(PATHS.lesson(48));

      navigate(PATHS.courseLevel(courseId, levelNum || 1));
    },
    [app, ensureGuestUser, navigate]
  );

  const launchCourseCurrentLevel = useCallback(
    (courseId) => {
      const prog = getCourseProgress(courseId, app);
      launchCourseLevel(courseId, prog.currentLevel === 0 ? 1 : prog.currentLevel);
    },
    [app, launchCourseLevel]
  );

  return { startCourse, launchCourseLevel, launchCourseCurrentLevel };
}
