import { useState } from "react";
import { useNavigate } from "react-router-dom";
import VideoTheaterModal from "../components/modals/VideoTheaterModal";
import { useApp } from "../context/AppContext";
import { PATHS, lessonNextPath } from "../utils/paths";
import { isDone, lessonSlot } from "../utils/progress";

// Graphic Design: theory + video walkthrough, finished with "Mark Completed & Continue".
export default function GraphicDesignLessonPage({ lesson }) {
  const lessonId = lesson.id;
  const app = useApp();
  const navigate = useNavigate();
  const [theaterOpen, setTheaterOpen] = useState(false);

  const { arr, idx: levelIdx } = lessonSlot(lessonId);
  const status = app[arr][levelIdx];
  const isCompleted = isDone(status);
  const levelNum = levelIdx + 1;

  const complete = () => {
    app.completeGraphicLesson(lessonId);
    navigate(lessonNextPath(lessonId));
  };

  // A lesson stays locked until the previous one is completed.
  if (levelIdx > 0 && !isDone(app.graphicDesignStatuses[levelIdx - 1]) && !isCompleted) {
    return (
      <div className="max-w-md mx-auto px-6 py-16 text-center">
        <div className="text-4xl mb-3">🔒</div>
        <h2 className="text-xl font-bold mb-2">Lesson {levelIdx + 1} is Locked</h2>
        <p className="text-sm text-gray-600 mb-6">Complete Lesson {levelIdx} first to unlock this lesson.</p>
        <button className="bg-black text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-gray-800 transition" onClick={() => navigate(PATHS.graphicDesign)}>
          Back to Dashboard
        </button>
      </div>
    );
  }

  const btnWhite = "bg-white hover:bg-gray-100 text-gray-800 border border-gray-300 font-bold text-xs sm:text-sm px-4 py-2.5 rounded-xl shadow-sm transition active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap";

  return (
    <div className="w-full max-w-[1500px] mx-auto px-4 sm:px-8 lg:px-12 py-6 sm:py-8">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <button className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-black transition cursor-pointer" onClick={() => navigate(PATHS.graphicDesign)}>
          <span>← Back to dashboard</span>
        </button>
        {levelIdx > 0 && (
          <button className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:text-red-600 transition cursor-pointer" onClick={() => navigate(PATHS.lesson(lessonId - 1))}>
            <span>&larr; Previous Session (Level {String(levelIdx).padStart(2, "0")})</span>
          </button>
        )}
      </div>

      <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
        <span className="text-xs font-bold uppercase tracking-wider text-red-600">Level {levelNum}</span>
        <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${isCompleted ? "bg-emerald-100 text-emerald-800 border border-emerald-200" : "bg-gray-100 text-gray-700"}`}>
          {isCompleted ? "✅ Completed" : "In Progress"}
        </span>
      </div>
      <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-6">Level {levelNum}</h1>

      <div className="bg-white border border-gray-200 rounded-2xl p-5 sm:p-7 shadow-sm mb-6">
        <div className="text-xs font-bold uppercase tracking-wider text-purple-700 mb-3 flex items-center gap-1.5">
          <span>🎨 Design Theory, Tools & Shortcuts</span>
        </div>
        <div className="text-gray-800 text-sm sm:text-base leading-relaxed font-normal" dangerouslySetInnerHTML={{ __html: lesson.theoryHtml }} />
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-5 sm:p-6 shadow-sm mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center font-bold text-xl flex-shrink-0 border border-red-100">🎬</div>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-red-600">Video Walkthrough</span>
              <span className="text-gray-300">•</span>
              <span className="text-xs text-gray-500 font-medium">Level {levelNum} Demonstration</span>
            </div>
            <h3 className="text-sm sm:text-base font-bold text-gray-900 leading-snug">Level {levelNum} Video Demonstration</h3>
            <p className="text-xs text-gray-500 mt-0.5">Click the play button to open and watch the instructor video demonstration.</p>
          </div>
        </div>
        <div className="w-full sm:w-auto flex-shrink-0">
          <button
            className="w-full sm:w-auto bg-red-600 hover:bg-red-700 active:scale-95 text-white font-bold text-sm px-6 py-3 rounded-xl shadow-md hover:shadow-lg transition flex items-center justify-center gap-2.5 cursor-pointer"
            onClick={() => setTheaterOpen(true)}
          >
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
            <span>Play Video</span>
          </button>
        </div>
      </div>

      <div className="bg-purple-50/80 border border-purple-200/80 rounded-xl p-4 text-xs sm:text-sm text-purple-900 flex items-start gap-3 mb-6">
        <span className="text-lg flex-shrink-0">💡</span>
        <div>
          <span className="font-bold block mb-0.5">Study Guideline</span>
          <p className="m-0 leading-normal">
            Review the theory concepts and click Play Video to watch the instructor demonstration. When you are ready, click Complete below to proceed to the next lesson.
          </p>
        </div>
      </div>

      <div className="bg-gradient-to-r from-red-50/90 to-orange-50/90 border border-red-200/90 rounded-2xl p-5 sm:p-6 shadow-sm mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xl flex-shrink-0">✅</span>
              <h3 className="font-extrabold text-gray-900 text-base">Finished Theory & Video?</h3>
            </div>
            <p className="text-xs sm:text-sm text-gray-600 leading-normal">
              Mark this level as completed to record your progress (+5 XP) and unlock {levelIdx < 11 ? `Level ${String(levelIdx + 2).padStart(2, "0")}` : "your Certificate"}.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap flex-shrink-0">
            {levelIdx > 0 ? (
              <>
                <button className="bg-white hover:bg-gray-100 text-gray-700 border border-gray-300 font-semibold text-xs sm:text-sm px-3.5 py-2.5 rounded-xl shadow-sm transition active:scale-95 flex items-center justify-center gap-1 cursor-pointer whitespace-nowrap" title="Back to Dashboard" onClick={() => navigate(PATHS.graphicDesign)}>
                  <span>Dashboard</span>
                </button>
                <button className={btnWhite} onClick={() => navigate(PATHS.lesson(lessonId - 1))}>
                  <span>&larr; Previous Session</span>
                </button>
              </>
            ) : (
              <button className={btnWhite} onClick={() => navigate(PATHS.graphicDesign)}>
                <span>&larr; Dashboard</span>
              </button>
            )}

            <button
              className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs sm:text-sm px-5 py-2.5 rounded-xl shadow-sm hover:shadow-md transition active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
              onClick={complete}
            >
              <span>{isCompleted ? "Completed ✓ Continue Next" : "Mark Completed & Continue"}</span>
              <span>&rarr;</span>
            </button>
          </div>
        </div>
      </div>

      {theaterOpen && <VideoTheaterModal lessonId={lessonId} onClose={() => setTheaterOpen(false)} onComplete={complete} />}
    </div>
  );
}
