import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { useCourseNav } from "../hooks/useCourseNav";
import { getCourseDisplayInfo, getCourseLevelData } from "../data/curriculum";
import { PATHS } from "../utils/paths";
import { getCourseProgress } from "../utils/progress";

function QuizSection({ courseId, levelNum, questions, quiz }) {
  const { setQuizAnswer, submitGenericQuiz } = useApp();
  const key = `generic_${courseId}_${levelNum}`;

  if (quiz.passed) {
    return (
      <div className="border border-emerald-200 bg-emerald-50 rounded-2xl p-6 mt-6 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🎉</span>
          <div>
            <div className="font-extrabold text-emerald-900 text-base">Knowledge Assessment Passed!</div>
            <div className="text-xs text-emerald-700 mt-0.5">You have mastered Level {String(levelNum).padStart(2, "0")} (+5 XP awarded).</div>
          </div>
        </div>
      </div>
    );
  }

  const allAnswered = questions.length > 0 && Object.keys(quiz.selected || {}).length === questions.length;

  return (
    <div className="mt-8">
      <div className="mb-4">
        <h3 className="text-base font-bold text-gray-900">Task: Knowledge Assessment</h3>
        <p className="text-xs text-gray-500">Answer all 5 questions below and pass with 70% or higher to unlock the next level.</p>
      </div>

      {questions.map((q, qi) => (
        <div key={qi} className="mb-5 bg-white border border-gray-200 rounded-xl p-4 sm:p-5">
          <div className="font-bold text-sm sm:text-base text-gray-900 mb-3">{qi + 1}. {q.q}</div>
          {q.options.map((opt) => {
            const isSelected = quiz.selected?.[qi] === opt;
            return (
              <label
                key={opt}
                className={`flex items-center gap-3 p-3 border ${isSelected ? "border-red-600 bg-red-50/50 font-medium" : "border-gray-200 hover:bg-gray-50"} rounded-xl cursor-pointer transition text-sm text-gray-800 mb-2`}
              >
                <input
                  type="radio"
                  name={`gen_quiz_${courseId}_${levelNum}_${qi}`}
                  value={opt}
                  checked={isSelected}
                  className="w-4 h-4 text-red-600 focus:ring-red-500"
                  onChange={() => setQuizAnswer(key, qi, opt)}
                />
                <span>{opt}</span>
              </label>
            );
          })}
        </div>
      ))}

      <div className="flex items-center justify-between mt-4">
        <button
          className={`${allAnswered ? "bg-red-600 hover:bg-red-700 cursor-pointer shadow-md" : "bg-gray-300 text-gray-500 cursor-not-allowed"} text-white font-bold text-sm px-6 py-2.5 rounded-xl transition`}
          disabled={!allAnswered}
          onClick={() => submitGenericQuiz(courseId, levelNum)}
        >
          Submit Level Assessment &rarr;
        </button>
        {quiz.submitted && !quiz.passed && (
          <span className="text-xs font-semibold text-red-600">Score: {quiz.pct}%. You need at least 70% to pass. Please review and try again.</span>
        )}
      </div>
    </div>
  );
}

// Video + theory + 5-question assessment for the courses that do not have bespoke lesson pages.
export default function GenericLessonPage() {
  const { courseId, levelNum: levelParam } = useParams();
  const levelNum = parseInt(levelParam, 10) || 1;
  const navigate = useNavigate();
  const app = useApp();
  const { launchCourseLevel } = useCourseNav();

  const info = getCourseDisplayInfo(courseId);
  const lvlData = getCourseLevelData(courseId, levelNum);
  const prog = getCourseProgress(courseId, app);
  const isCompleted = (prog.completedLevels || []).includes(levelNum);
  const quiz = app.quizState[`generic_${courseId}_${levelNum}`] || { selected: {}, submitted: false, passed: isCompleted };

  useEffect(() => {
    if (!app.user || app.user.email === "student@rightwayskillbuilder.com") {
      sessionStorage.setItem("returnTo", window.location.pathname);
      sessionStorage.setItem("openProfileAfterAuth", "true");
      if (app.showToast) app.showToast("Please sign up first to watch course videos and start learning!");
      navigate(`${PATHS.signup}?returnTo=${encodeURIComponent(window.location.pathname)}`);
    }
  }, [app.user, app.showToast, navigate]);

  if (!app.user || app.user.email === "student@rightwayskillbuilder.com") {
    return null;
  }

  return (
    <div className="w-full max-w-[1500px] mx-auto px-4 sm:px-8 lg:px-12 py-6 sm:py-8">
      <button className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-red-600 transition mb-4 cursor-pointer" onClick={() => navigate(PATHS.course(courseId))}>
        <span>&larr; Back to {info.title}</span>
      </button>

      <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
        <span className="text-xs font-bold uppercase tracking-wider text-red-600">Level {levelNum}</span>
        <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${isCompleted ? "bg-emerald-100 text-emerald-800 border border-emerald-200" : "bg-gray-100 text-gray-700"}`}>
          {isCompleted ? "✅ Completed" : "In Progress"}
        </span>
      </div>
      <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-6">Level {levelNum}</h1>

      <div className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-7 shadow-sm mb-6">
        <div className="text-xs font-bold uppercase tracking-wider text-red-600 mb-3 flex items-center gap-1.5">
          <span>📖 Theory & Core Concepts</span>
        </div>
        <div className="text-gray-800 text-base leading-relaxed font-normal" dangerouslySetInnerHTML={{ __html: lvlData.theoryHtml }} />
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-7 shadow-sm mb-6">
        <div className="text-xs font-bold uppercase tracking-wider text-blue-600 mb-2 flex items-center gap-1.5">
          <span>🎬 Video Demonstration</span>
        </div>
        <h3 className="text-sm font-bold text-gray-900 mb-3">Level {levelNum} Video Demonstration</h3>
        <div className="aspect-video w-full rounded-xl overflow-hidden bg-black border border-gray-200 shadow-inner">
          <iframe
            className="w-full h-full"
            src={lvlData.videoUrl || "https://www.youtube.com/embed/uBGl2BujkPQ"}
            title="Learning Video"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          ></iframe>
        </div>
      </div>

      <div className="bg-amber-50/80 border border-amber-200/80 rounded-xl p-4 text-xs sm:text-sm text-amber-900 flex items-start gap-3 mb-6">
        <span className="text-lg flex-shrink-0">💡</span>
        <div>
          <span className="font-bold block mb-0.5">Study Guideline</span>
          <p className="m-0 leading-normal">
            {lvlData.notice || "Study the theory and watch the video demonstration above, then pass the 5-question task with at least 70% to unlock the next level."}
          </p>
        </div>
      </div>

      <QuizSection courseId={courseId} levelNum={levelNum} questions={lvlData.mcqs} quiz={quiz} />

      {isCompleted && (
        <div className="mt-8 pt-4 border-t border-gray-200 flex justify-between items-center">
          <button className="text-sm font-semibold text-gray-600 hover:text-black cursor-pointer" onClick={() => navigate(PATHS.course(courseId))}>
            &larr; Course Dashboard
          </button>
          <button className="bg-red-600 hover:bg-red-700 text-white font-semibold text-sm py-2.5 px-6 rounded-xl transition cursor-pointer shadow-sm" onClick={() => launchCourseLevel(courseId, levelNum + 1)}>
            Continue Level {levelNum + 1} &rarr;
          </button>
        </div>
      )}
    </div>
  );
}
