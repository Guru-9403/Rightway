import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../api/client";
import { useApp } from "../context/AppContext";
import { useCourseNav } from "../hooks/useCourseNav";
import { getCourseDisplayInfo } from "../data/curriculum";
import { PATHS } from "../utils/paths";
import { getCourseProgress, isDone } from "../utils/progress";

function LevelsDrawer({ courseId, info, prog, onClose }) {
  const app = useApp();
  const { launchCourseLevel } = useCourseNav();

  const levels =
    info.levels ||
    Array.from({ length: 15 }, (_, i) => ({ id: i + 1, title: `Level ${String(i + 1).padStart(2, "0")}`, topic: `Core Competency Module ${i + 1}` }));

  const rows = levels.map((lvl) => {
    let isCompleted = false;
    let isUnlocked = false;

    if (courseId === "medical_coding" || courseId === "graphic_design") {
      const arr = courseId === "medical_coding" ? app.medicalStatuses : app.graphicDesignStatuses;
      isCompleted = isDone(arr[lvl.id - 1]);
      isUnlocked = lvl.id === 1 || !!(arr[lvl.id - 2] && arr[lvl.id - 2].taskCompleted);
    } else {
      const compList = prog.completedLevels || [];
      isCompleted = compList.includes(lvl.id);
      isUnlocked = lvl.id === 1 || compList.includes(lvl.id - 1);
    }

    const tone = isCompleted ? "border-emerald-300 bg-emerald-50/50" : isUnlocked ? "border-red-200 bg-red-50/30" : "border-gray-200 bg-gray-50 opacity-70";
    const badge = isCompleted ? "bg-emerald-600 text-white" : isUnlocked ? "bg-red-600 text-white" : "bg-gray-300 text-gray-700";

    return (
      <div key={lvl.id} className={`border ${tone} rounded-2xl p-4 sm:p-4.5 flex items-center justify-between gap-4 transition hover:shadow-sm`}>
        <div className="flex items-center gap-3.5">
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold text-sm sm:text-base ${badge}`}>{String(lvl.id).padStart(2, "0")}</div>
          <div>
            <h4 className="font-bold text-base sm:text-lg text-gray-900">Level {lvl.id}</h4>
          </div>
        </div>
        <div>
          {isCompleted ? (
            <button className="bg-emerald-100 text-emerald-800 border border-emerald-300 font-semibold text-xs sm:text-sm px-4 py-2 rounded-xl hover:bg-emerald-200 transition cursor-pointer" onClick={() => launchCourseLevel(courseId, lvl.id)}>
              Review ✓
            </button>
          ) : isUnlocked ? (
            <button className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs sm:text-sm px-5 py-2 rounded-xl transition shadow-sm cursor-pointer" onClick={() => launchCourseLevel(courseId, lvl.id)}>
              Start &rarr;
            </button>
          ) : (
            <span className="text-xs sm:text-sm text-gray-400 font-medium px-3.5 py-2 flex items-center gap-1">🔒 Locked</span>
          )}
        </div>
      </div>
    );
  });

  return (
    <div className="mt-10 pt-8 border-t border-gray-200 w-full max-w-5xl">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-lg sm:text-xl font-bold text-gray-900">Curriculum Levels & Roadmap</h3>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">Master each level and pass the 5-question task with at least 70% to unlock the next level.</p>
        </div>
        <button onClick={onClose} className="text-xs sm:text-sm text-gray-500 hover:text-black font-semibold cursor-pointer">
          ✕ Close
        </button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4 w-full">{rows}</div>
    </div>
  );
}

export default function CourseIntroPage({ courseId: courseIdProp }) {
  const params = useParams();
  const courseId = courseIdProp || params.courseId;
  const navigate = useNavigate();
  const app = useApp();
  const { launchCourseCurrentLevel } = useCourseNav();
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    if (courseId) {
      api.auditCourseOpened(courseId).catch(() => {});
    }
  }, [courseId]);

  const info = getCourseDisplayInfo(courseId);
  const prog = getCourseProgress(courseId, app);
  const total = 100; // course length shown on the intro card
  const completed = prog.completedCount;

  const scoreStr = `${String(completed).padStart(2, "0")} / ${String(total).padStart(2, "0")}`;
  const currentStr = String(prog.currentLevel).padStart(2, "0");

  return (
    <div className="cl-intro-page bg-white min-h-[calc(100vh-60px)]">
      <div className="w-full max-w-[1500px] mx-auto px-4 sm:px-8 lg:px-12 py-6 sm:py-10">
        <button className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-gray-500 hover:text-red-600 transition mb-5 cursor-pointer" onClick={() => navigate(PATHS.home)}>
          <span>&larr; Back to Courses</span>
        </button>

        <div className="border-b-2 sm:border-b-[3px] border-[#ff1a1a] pb-3 sm:pb-4 mb-8 flex items-end justify-between gap-4">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#ff1a1a] tracking-tight">{info.title}</h1>
          <span className="text-xs sm:text-sm font-bold text-gray-400 uppercase tracking-widest hidden sm:inline-block">RIGHTWAY SKILL BUILDER</span>
        </div>

        <div className="mb-8 sm:mb-10">
          <h2 className="text-gray-500 font-bold text-sm sm:text-base tracking-wider uppercase mb-2">WELCOME</h2>
          <p className="text-gray-700 text-sm sm:text-base md:text-lg leading-relaxed pl-4 sm:pl-8 lg:pl-10 w-full">
            Welcome to our {info.sessionName} session. In this session complete the level, unlock the next level. It's totally have a 100 levels. You completed 100 all levels, than take the final task. After succsessfully completed the task, You will receive your course completion certificate online.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 w-full mb-10">
          <div className="rw-intro-card border-2 sm:border-[2.5px] border-[#ff1a1a] rounded-3xl p-6 sm:p-8 bg-white flex flex-col justify-between min-h-[200px] sm:min-h-[220px] shadow-sm relative">
            <div>
              <div className="text-lg sm:text-xl font-bold text-gray-900">Levels</div>
              <div className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-[#ff1a1a] my-2 sm:my-3 tracking-tight">{scoreStr}</div>
              <div className="text-sm sm:text-base text-gray-400 font-medium">Completed level score</div>
            </div>
            <div className="flex justify-end mt-4">
              <button onClick={() => setDrawerOpen((o) => !o)} className={`rw-intro-btn-toggle ${drawerOpen ? "active" : ""}`} title={drawerOpen ? "Close levels" : "Show levels"}>
                {drawerOpen ? "Close" : "Show"}
              </button>
            </div>
          </div>

          <div className="rw-intro-card border-2 sm:border-[2.5px] border-[#ff1a1a] rounded-3xl p-6 sm:p-8 bg-white flex flex-col justify-between min-h-[200px] sm:min-h-[220px] shadow-sm relative">
            <div>
              <div className="text-lg sm:text-xl font-bold text-gray-900">Current Level</div>
              <div className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-[#ff1a1a] my-2 sm:my-3 tracking-tight">{currentStr}</div>
            </div>
            <div className="flex justify-end mt-4">
              <button onClick={() => launchCourseCurrentLevel(courseId)} className="rw-intro-btn-start">
                {completed > 0 ? "Resume" : "Start"}
              </button>
            </div>
          </div>
        </div>

        {drawerOpen && <LevelsDrawer courseId={courseId} info={info} prog={prog} onClose={() => setDrawerOpen(false)} />}
      </div>
    </div>
  );
}
