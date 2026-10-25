import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { PATHS, lessonNextPath } from "../utils/paths";
import { isDone, lessonSlot } from "../utils/progress";

function QuizSection({ lessonId, questions, defaultPassed }) {
  const { quizState, setQuizAnswer, resetQuiz, submitMedicalQuiz } = useApp();
  const quiz = quizState[lessonId] || { selected: {}, submitted: false, passed: defaultPassed };

  if (quiz.passed) {
    return (
      <div className="border border-emerald-200 bg-emerald-50 rounded-2xl p-6 mt-6 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🎉</span>
          <div>
            <div className="font-extrabold text-emerald-900 text-base">Knowledge Assessment Passed!</div>
            <div className="text-xs text-emerald-700 mt-0.5">You have mastered this level (+5 XP awarded).</div>
          </div>
        </div>
      </div>
    );
  }

  const submit = () => {
    if (submitMedicalQuiz(lessonId) === "incomplete") {
      alert(`Please answer all ${questions.length} questions before submitting.`);
    }
  };

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-extrabold text-lg text-gray-900">Knowledge Assessment</h3>
          <p className="text-xs text-gray-500 mt-0.5">Pass mark is 70% (at least 4 of 5 correct) to complete this level.</p>
        </div>
        <span className="text-xs font-semibold bg-gray-100 text-gray-700 px-3 py-1 rounded-full">5 Questions</span>
      </div>

      {questions.map((q, qi) => (
        <div key={qi} className="bg-white border border-gray-200 rounded-2xl p-5 mb-4 shadow-sm">
          <div className="font-semibold text-sm text-gray-900 mb-3">
            <span className="text-red-600 font-bold mr-1">Q{qi + 1}.</span> {q.q}
          </div>
          <div>
            {q.options.map((opt) => {
              const isSelected = quiz.selected?.[qi] === opt;
              return (
                <label
                  key={opt}
                  className={`flex items-center gap-3 p-3 border ${isSelected ? "border-black bg-gray-100 font-medium" : "border-gray-200 hover:bg-gray-50"} rounded-xl cursor-pointer transition text-sm text-gray-800 mb-2`}
                >
                  <input
                    type="radio"
                    name={`med_quiz_${lessonId}_${qi}`}
                    value={opt}
                    checked={isSelected}
                    className="w-4 h-4 text-black focus:ring-black"
                    onChange={() => setQuizAnswer(lessonId, qi, opt)}
                  />
                  <span>{opt}</span>
                </label>
              );
            })}
          </div>
        </div>
      ))}

      <div className="mb-4">
        {quiz.submitted && !quiz.passed && (
          <div className="p-5 bg-rose-50 border border-rose-200 rounded-2xl text-center">
            <div className="text-2xl mb-1">⚠️</div>
            <h4 className="font-extrabold text-rose-900 text-sm">
              Score: {quiz.score || 0}/{questions.length} ({quiz.pct || 0}%) — Pass Mark is 70%
            </h4>
            <p className="text-xs text-rose-800 mt-1 mb-3">Review the clinical theory above and try again.</p>
            <button className="bg-black hover:bg-gray-800 text-white font-semibold text-xs py-2 px-5 rounded-xl transition" onClick={() => resetQuiz(lessonId)}>
              ↺ Retry Quiz
            </button>
          </div>
        )}
      </div>

      {!quiz.submitted && (
        <button className="bg-black hover:bg-gray-800 text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition" onClick={submit}>
          Submit Answers →
        </button>
      )}
    </div>
  );
}

export default function MedicalLessonPage({ lesson }) {
  const lessonId = lesson.id;
  const app = useApp();
  const navigate = useNavigate();

  const { arr, idx } = lessonSlot(lessonId);
  const status = app[arr][idx];
  const isCompleted = isDone(status);
  const levelNum = parseInt(lesson.levelNumber || String(lessonId - 28).padStart(2, "0"), 10);

  return (
    <div className="w-full max-w-[1500px] mx-auto px-4 sm:px-8 lg:px-12 py-6 sm:py-8">
      <button className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-black transition mb-4" onClick={() => navigate(PATHS.medical)}>
        <span>← Back to dashboard</span>
      </button>

      <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
        <span className="text-xs font-bold uppercase tracking-wider text-red-600">Level {levelNum}</span>
        <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${isCompleted ? "bg-emerald-100 text-emerald-800 border border-emerald-200" : "bg-gray-100 text-gray-700"}`}>
          {isCompleted ? "✅ Completed" : "In Progress"}
        </span>
      </div>
      <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-6">Level {levelNum}</h1>

      <div className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-7 shadow-sm mb-6">
        <div className="text-xs font-bold uppercase tracking-wider text-purple-700 mb-3 flex items-center gap-1.5">
          <span>📖 Clinical Theory & Anatomy</span>
        </div>
        <div className="text-gray-800 text-base leading-relaxed font-normal" dangerouslySetInnerHTML={{ __html: lesson.theoryHtml }} />
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-7 shadow-sm mb-6">
        <div className="text-xs font-bold uppercase tracking-wider text-blue-600 mb-2 flex items-center gap-1.5">
          <span>🎬 Video Walkthrough</span>
        </div>
        <h3 className="text-sm font-bold text-gray-900 mb-3">Level {levelNum} Demonstration</h3>
        <div className="aspect-video w-full rounded-xl overflow-hidden bg-black border border-gray-200 shadow-inner">
          <iframe
            className="w-full h-full"
            src={lesson.videoUrl || "https://www.youtube.com/embed/uBGl2BujkPQ"}
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
            {lesson.notice || "Study the clinical theory and watch the video walkthrough above, then pass the 5-question task with at least 70% to unlock the next level."}
          </p>
        </div>
      </div>

      <QuizSection lessonId={lessonId} questions={lesson.quiz.questions} defaultPassed={status.testPassed} />

      {isCompleted && (
        <div className="mt-8 pt-4 border-t border-gray-200 flex justify-between items-center">
          <button className="text-sm font-semibold text-gray-600 hover:text-black" onClick={() => navigate(PATHS.medical)}>← Dashboard</button>
          <button className="bg-black hover:bg-gray-800 text-white font-semibold text-sm py-2.5 px-6 rounded-xl transition" onClick={() => navigate(lessonNextPath(lessonId))}>
            {lessonId === 43 ? "View Certificates 🏆" : `Continue Lesson ${lessonId - 27} →`}
          </button>
        </div>
      )}
    </div>
  );
}
